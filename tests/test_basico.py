import pandas as pd

from alcance import db, faltas
from alcance.canais import AGENTE, LIGACAO, WHATSAPP, escolher_canal, modo_resposta


def _c(**kw):
    base = dict(telefone="smartphone", dados_ate_dia=None, baixa_visao=0, surdez=0,
                baixo_letramento=0, voz_lenta=0)
    return base | kw


def test_tres_frentes():
    assert escolher_canal(_c(telefone="nenhum"), 5) == AGENTE
    assert escolher_canal(_c(telefone="basico"), 5) == LIGACAO
    assert escolher_canal(_c(dados_ate_dia=19), 10) == WHATSAPP
    assert escolher_canal(_c(dados_ate_dia=19), 25) == LIGACAO  # franquia acabou


def test_modo_resposta_acessivel():
    assert "audio" in modo_resposta(_c(baixa_visao=1))
    assert "libras" in modo_resposta(_c(surdez=1))
    assert modo_resposta(_c())[0] == "linguagem_simples"


def test_banco_e_pontuacao(tmp_path, monkeypatch):
    path = tmp_path / "t.db"
    db.criar_banco(path, n=30)
    monkeypatch.setattr(faltas, "MODELO_PATH", tmp_path / "nao_existe.joblib")
    con = db.conectar(path)
    assert faltas.pontuar_consultas(con) == "heuristica"
    riscos = [r[0] for r in con.execute("SELECT risco_falta FROM consultas")]
    assert len(riscos) == 30 and all(0 <= r <= 1 for r in riscos)
    assert con.execute("SELECT nome FROM cidadaos WHERE id=1").fetchone()[0] == "Antônio Pereira"


def test_preparar_kaggle_remove_invalidos():
    df = pd.DataFrame({
        "Gender": ["F", "M"], "ScheduledDay": ["2016-04-29T18:38:08Z"] * 2,
        "AppointmentDay": ["2016-05-02T00:00:00Z", "2016-04-20T00:00:00Z"],
        "Age": [60, 30], "Scholarship": [0, 1], "Hipertension": [1, 0], "Diabetes": [0, 0],
        "Handcap": [1, 0], "SMS_received": [1, 0], "No-show": ["Yes", "No"],
    })
    X, y = faltas.preparar_kaggle(df)
    assert len(X) == 1 and X.iloc[0]["dias_espera"] == 3 and y.iloc[0] == 1


def test_api(tmp_path, monkeypatch):
    from fastapi.testclient import TestClient
    from alcance import api
    path = tmp_path / "api.db"
    db.criar_banco(path, n=10)
    monkeypatch.setattr(api, "DB_PATH", path)
    monkeypatch.setattr(api, "conectar", lambda: db.conectar(path))
    cli = TestClient(api.app)
    lista = cli.get("/api/consultas").json()
    assert len(lista) == 10 and {"canal", "modos", "dias_ate"} <= lista[0].keys()
    assert cli.get("/api/cidadaos/1").json()["nome"] == "Antônio Pereira"
    assert cli.get("/api/cidadaos/999").status_code == 404


def test_ia_prompt_e_acoes(tmp_path, monkeypatch):
    from alcance import ia
    path = tmp_path / "ia.db"
    db.criar_banco(path, n=5)
    monkeypatch.setattr(ia, "conectar", lambda: db.conectar(path))
    c = ia.contexto_consulta(1)
    texto = ia.instrucoes_ligacao(c)
    assert "Seu Antônio" in texto and "nunca peça para ela ler" in texto
    assert "Nunca sugira soluções pagas" in texto and "Rosa" in texto
    r = ia.executar_acao(c["consulta_id"], 1, "ligacao", "confirmar_consulta", None)
    assert r["ok"]
    con = db.conectar(path)
    assert con.execute("SELECT status FROM consultas WHERE id=?", (c["consulta_id"],)).fetchone()[0] == "confirmada"
    assert con.execute("SELECT count(*) FROM contatos").fetchone()[0] == 1


def test_whatsapp_rejeita_assinatura_falsa(monkeypatch):
    from fastapi.testclient import TestClient
    from alcance import api
    monkeypatch.setenv("TWILIO_AUTH_TOKEN", "x" * 32)
    cli = TestClient(api.app)
    r = cli.post("/whatsapp", data={"From": "whatsapp:+5511999999999", "Body": "oi"},
                 headers={"X-Twilio-Signature": "falsa"})
    assert r.status_code == 403
    assert cli.get("/audios/..%2F.env").status_code == 404


def test_assistente_executa_acao_e_responde(tmp_path, monkeypatch):
    from types import SimpleNamespace as NS
    from google.genai import types
    from alcance import assistente, ia
    path = tmp_path / "w.db"
    db.criar_banco(path, n=5)
    monkeypatch.setattr(ia, "conectar", lambda: db.conectar(path))
    c = ia.contexto_consulta(3)
    respostas = iter([
        NS(function_calls=[NS(name="pedir_transporte", args={})],
           candidates=[NS(content=types.Content(role="model", parts=[types.Part(text="...")]))], text=None),
        NS(function_calls=None, text="Pronto, Dona Benedita. O carro passa 1 hora antes."),
    ])
    monkeypatch.setattr(assistente, "_cliente", lambda: None)
    monkeypatch.setattr(assistente, "_gerar", lambda *a, **k: next(respostas))
    texto, acoes = assistente.responder(c, [], [types.Part(text="quero, sim, pode pedir o carro")])
    assert acoes == ["pedir_transporte"] and "Benedita" in texto
    assert "Dona Benedita" in assistente.instrucoes_mensagem(c)
    assert "vai virar ÁUDIO" in assistente.instrucoes_mensagem(c)  # baixo letramento -> resposta em voz


def test_trava_de_acao_irreversivel(tmp_path, monkeypatch):
    from alcance import ia
    path = tmp_path / "t.db"
    db.criar_banco(path, n=3)
    monkeypatch.setattr(ia, "conectar", lambda: db.conectar(path))
    c = ia.contexto_consulta(1)
    r = ia.executar_acao(c["consulta_id"], 1, "ligacao", "liberar_vaga", {"motivo": "não tem como ir"})
    assert r["ok"] is False
    con = db.conectar(path)
    assert con.execute("SELECT status FROM consultas WHERE id=?", (c["consulta_id"],)).fetchone()[0] == "agendada"
    r = ia.executar_acao(c["consulta_id"], 1, "ligacao", "liberar_vaga", {"confirmacao_da_pessoa": "pode liberar sim"})
    assert r["ok"] is True


def test_vies_por_grupo():
    import numpy as np
    rng = np.random.default_rng(0)
    n = 400
    X = pd.DataFrame({"idade": rng.integers(0, 90, n), "mulher": rng.integers(0, 2, n), "deficiencia": rng.integers(0, 2, n),
                      "bolsa": rng.integers(0, 2, n), "sms": rng.integers(0, 2, n), "dias_espera": rng.integers(0, 60, n)})
    y = pd.Series(rng.integers(0, 2, n))
    prob = rng.random(n)
    grupos = {g["grupo"] for g in faltas.vies_por_grupo(X, y, prob)}
    assert {"Idade 60+", "Mulheres", "Homens"} <= grupos
    assert set(faltas.efeito_sms(X, y)) == {"com_sms", "sem_sms"}


def test_mascara_dados_pessoais():
    from alcance.assistente import mascarar
    t = mascarar("meu cpf é 123.456.789-09, cartão 4111 1111 1111 1111, fone (27) 99876-5432")
    assert "123" not in t and "4111" not in t and "9876" not in t
    assert "[CPF]" in t and "[CARTÃO]" in t and "[TELEFONE]" in t
    assert mascarar("consulta dia 20 às 8h") == "consulta dia 20 às 8h"


def test_piso_de_prioridade_para_quem_tem_barreira():
    from alcance.api import tem_barreira
    base = dict(baixa_visao=0, surdez=0, baixo_letramento=0, telefone="smartphone", idade=30)
    assert not tem_barreira(base)
    assert not tem_barreira({**base, "idade": 70})
    assert tem_barreira({**base, "telefone": "basico"})
    assert tem_barreira({**base, "surdez": 1})


def test_nao_age_sem_o_sim(tmp_path, monkeypatch):
    """A IA tentou pedir o transporte quando a pessoa só disse que não tinha como ir: o código bloqueia."""
    from types import SimpleNamespace as NS
    from google.genai import types
    from alcance import assistente, ia
    path = tmp_path / "t.db"
    db.criar_banco(path, n=10)
    monkeypatch.setattr(ia, "conectar", lambda: db.conectar(path))
    c = ia.contexto_consulta(3)
    respostas = iter([
        NS(function_calls=[NS(name="pedir_transporte", args={})],
           candidates=[NS(content=types.Content(role="model", parts=[types.Part(text="...")]))], text=None),
        NS(function_calls=None, text="Quer que eu peça o carro da prefeitura?"),
    ])
    monkeypatch.setattr(assistente, "_cliente", lambda: None)
    monkeypatch.setattr(assistente, "_gerar", lambda *a, **k: next(respostas))
    texto, acoes = assistente.responder(c, [], [types.Part(text="Não vou conseguir ir, não tenho como ir.")])
    assert acoes == [] and "?" in texto
    assert assistente.disse_sim("Quero, sim.") and not assistente.disse_sim("não tenho como ir")


def test_rede_de_apoio_exige_consentimento(tmp_path, monkeypatch):
    """A família só é avisada com autorização cadastrada ou com o "sim" da pessoa na hora (LGPD)."""
    from alcance import ia
    path = tmp_path / "t.db"
    db.criar_banco(path, n=30)
    db.garantir_schema(path)
    monkeypatch.setattr(ia, "conectar", lambda: db.conectar(path))
    con = db.conectar(path)
    cid, cons = con.execute("""SELECT c.id, co.id FROM cidadaos c JOIN consultas co ON co.cidadao_id = c.id
                               WHERE c.contato_familia IS NOT NULL AND c.id <> 1 LIMIT 1""").fetchone()
    con.execute("UPDATE cidadaos SET autoriza_apoio = 0 WHERE id = ?", (cid,)); con.commit()
    assert ia.executar_acao(cons, cid, "whatsapp", "avisar_contato_apoio", {})["ok"] is False
    assert ia.executar_acao(cons, cid, "whatsapp", "avisar_contato_apoio", {"autorizacao_da_pessoa": "pode avisar sim"})["ok"] is True
    assert db.conectar(path).execute("SELECT autoriza_apoio FROM cidadaos WHERE id=?", (cid,)).fetchone()[0] == 1
