"""API da Clara. Rodar: .venv\\Scripts\\python -m uvicorn alcance.api:app --reload"""
from datetime import date

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from alcance.canais import escolher_canal, modo_resposta
from alcance.config import APP_NOME, DB_PATH
from alcance.db import conectar, criar_banco, garantir_schema
from alcance.faltas import ALERTA, pontuar_consultas
from alcance.ligacao import router as ligacao_router
from alcance.whatsapp import router as whatsapp_router

app = FastAPI(title=f"{APP_NOME} API")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173"], allow_methods=["GET", "POST"])
app.include_router(ligacao_router)
app.include_router(whatsapp_router)


PISO_ACESSIBILIDADE = ALERTA  # quem tem barreira sempre entra na fila de contato


def tem_barreira(c: dict) -> bool:
    """Barreira real de acesso (idade sozinha não é barreira)."""
    return bool(c["baixa_visao"] or c["surdez"] or c["baixo_letramento"] or c["telefone"] != "smartphone")


def _garantir_banco():
    if not DB_PATH.exists():
        criar_banco()
        pontuar_consultas()
    garantir_schema()


def _consultas(where: str = "", params: tuple = ()) -> list[dict]:
    _garantir_banco()
    con = conectar()
    linhas = [dict(r) for r in con.execute(
        f"""SELECT co.id AS consulta_id, co.especialidade, co.data_consulta, co.data_marcacao,
                   co.sms_enviado, co.risco_falta, co.status,
                   (SELECT resultado FROM contatos ct WHERE ct.consulta_id = co.id ORDER BY ct.id DESC LIMIT 1) AS ultima_acao,
                   c.*
            FROM consultas co JOIN cidadaos c ON c.id = co.cidadao_id {where}""", params)]
    con.close()
    hoje = date.today()
    for r in linhas:
        r["canal"] = escolher_canal(r, hoje.day)
        r["modos"] = modo_resposta(r)
        r["dias_ate"] = (date.fromisoformat(r["data_consulta"]) - hoje).days
        r["barreira"] = tem_barreira(r)
        # o modelo alerta pouco os idosos (faltam menos na média, ver governança):
        # quem tem barreira de acesso sempre entra na fila de contato
        r["prioridade"] = max(r["risco_falta"] or 0, PISO_ACESSIBILIDADE) if r["barreira"] else (r["risco_falta"] or 0)
    return linhas


@app.get("/api/consultas")
def consultas():
    return _consultas()


@app.get("/api/cidadaos/{cid}")
def cidadao(cid: int):
    linhas = _consultas("WHERE c.id = ?", (cid,))
    if not linhas:
        raise HTTPException(404, "Cidadão não encontrado")
    return linhas[0]


@app.get("/api/cidadaos/{cid}/conversa")
def conversa(cid: int):
    """Falas e ações da conversa mais recente com o cidadão (para o site mostrar ao vivo)."""
    c = cidadao(cid)
    con = conectar()
    falas = [dict(r) for r in con.execute(
        "SELECT quem, texto, quando FROM falas WHERE consulta_id=? ORDER BY id", (c["consulta_id"],))]
    con.close()
    return {"status": c["status"], "falas": falas}


@app.post("/api/demo/reiniciar/{cid}")
def reiniciar(cid: int):
    """Apaga a conversa do cidadão e volta a consulta para 'agendada' (para gravar a demo de novo)."""
    c = cidadao(cid)
    con = conectar()
    con.execute("DELETE FROM falas WHERE consulta_id=?", (c["consulta_id"],))
    con.execute("DELETE FROM contatos WHERE consulta_id=?", (c["consulta_id"],))
    con.execute("UPDATE consultas SET status='agendada' WHERE id=?", (c["consulta_id"],))
    con.commit()
    con.close()
    return {"ok": True}


@app.get("/api/governanca")
def governanca():
    """Evidências de governança: avaliação da IA, ficha do modelo e trilha de auditoria."""
    import json
    from alcance.avaliacao import RESULTADO
    from alcance.config import MODELO_PATH
    from alcance.faltas import METRICAS_PATH
    _garantir_banco()
    con = conectar()
    auditoria = [dict(r) for r in con.execute("""
        SELECT ct.quando, ct.canal, ct.resultado, c.nome FROM contatos ct
        JOIN cidadaos c ON c.id = ct.cidadao_id ORDER BY ct.id DESC LIMIT 30""")]
    humanos = con.execute("SELECT count(*) FROM contatos WHERE resultado LIKE 'encaminhar_para_humano%'").fetchone()[0]
    total = con.execute("SELECT count(*) FROM contatos").fetchone()[0]
    con.close()
    ler = lambda p: json.loads(p.read_text(encoding="utf-8")) if p.exists() else None
    return {
        "avaliacao": ler(RESULTADO),
        "modelo": {"metodo": "modelo" if MODELO_PATH.exists() else "heuristica", "metricas": ler(METRICAS_PATH)},
        "auditoria": auditoria,
        "acoes_total": total,
        "passados_para_humano": humanos,
    }


@app.get("/api/metodo-risco")
def metodo_risco():
    from alcance.config import MODELO_PATH
    return {"metodo": "modelo" if MODELO_PATH.exists() else "heuristica"}
