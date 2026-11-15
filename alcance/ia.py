"""Cérebro da Clara: persona, regras de segurança e as ações que a IA pode executar."""
from datetime import date

from google.genai import types

from alcance.canais import modo_resposta
from alcance.db import conectar

UBS = "UBS Jardim Esperança"
MODELOS_VOZ = ["gemini-3.8-live", "gemini-2.5-flash-native-audio-latest"]  # o 2º é reserva se o 1º falhar
DIAS = ["segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado", "domingo"]
HORARIOS = ["8 horas", "9 horas", "10 horas", "14 horas", "15 horas"]

REGRAS = """
Regras que você nunca quebra:
- Fale português do Brasil, simples, como uma vizinha atenciosa. Frases curtas. Sem siglas e sem palavras difíceis.
- Faça uma pergunta por vez e espere a resposta.
- Apresente-se só uma vez. Se não entender o que a pessoa disse, peça com calma para ela repetir; nunca recomece a apresentação.
- Nunca dê diagnóstico, orientação de remédio ou conselho médico. Para dúvida de saúde, use encaminhar_para_humano.
- Emergência de saúde (dor no peito, desmaio, falta de ar): mande ligar para o SAMU, número 192 (cento e noventa e dois), ou ir à UPA. Nunca cite outro número.
- Nunca sugira soluções pagas (táxi, aplicativo de carro, clínica particular). Ofereça só serviços públicos.
- Nunca peça CPF, senha, cartão ou dados bancários.
- Se a pessoa pedir para falar com alguém, use encaminhar_para_humano na hora.
- Só use uma ferramenta de ação depois que a pessoa disser claramente que quer (um "sim"). Primeiro ofereça, depois faça.
- "Não consigo ir" NÃO é "não quero": primeiro ofereça transporte ou outro dia. Só libere a vaga se a pessoa disser que não precisa mais da consulta e confirmar.
- Registre tudo o que for combinado usando as ferramentas. Não diga que fez algo sem usar a ferramenta.
- No fim, repita o que foi combinado em uma frase e se despeça.
"""


def persona() -> str:
    from alcance.config import APP_NOME
    return (f"Você é a {APP_NOME}, a assistente virtual do posto de saúde ({UBS}). Seu jeito: calma, carinhosa e direta, "
            "como uma vizinha de confiança que trabalha no posto. Trate pessoas mais velhas por 'seu' e 'dona', sem infantilizar. "
            "Se perguntarem, diga com honestidade que você é uma assistente virtual, não uma pessoa, e que a equipe do posto acompanha tudo.")


def contexto_consulta(cid: int) -> dict:
    con = conectar()
    r = con.execute("""SELECT co.id consulta_id, co.especialidade, co.data_consulta, co.status, c.*
                       FROM consultas co JOIN cidadaos c ON c.id = co.cidadao_id
                       WHERE c.id = ? ORDER BY co.data_consulta LIMIT 1""", (cid,)).fetchone()
    con.close()
    if not r:
        raise ValueError(f"Cidadão {cid} sem consulta")
    return dict(r)


def _data_falada(iso: str) -> str:
    d = date.fromisoformat(iso)
    return f"{DIAS[d.weekday()]}, dia {d.day}"


def instrucoes_ligacao(c: dict) -> str:
    tratamento = ("Seu " if c["sexo"] == "M" else "Dona ") + c["nome"].split()[0] if c["idade"] >= 60 else c["nome"].split()[0]
    jeito = []
    modos = modo_resposta(c)
    if "voz_lenta" in modos or c["idade"] >= 65:
        jeito.append("Fale devagar e com calma.")
    if c["baixa_visao"]:
        jeito.append("A pessoa enxerga pouco: nunca peça para ela ler nada; diga tudo em voz.")
    if c["baixo_letramento"]:
        jeito.append("A pessoa lê pouco: use palavras do dia a dia.")
    apoio = f"Contato de apoio cadastrado: {c['contato_familia']}." if c["contato_familia"] else "Sem contato de apoio cadastrado."
    hora = HORARIOS[c["consulta_id"] % len(HORARIOS)]
    return f"""{persona()}
Você está LIGANDO para {tratamento}, {c['idade']} anos.
Objetivo: confirmar a consulta de {c['especialidade'].lower()} marcada para {_data_falada(c['data_consulta'])}, às {hora}.
{' '.join(jeito)} {apoio}

Contra golpes: diga que a ligação foi pedida pela agente comunitária {c['agente']}, que a pessoa já conhece. Se a pessoa desconfiar, diga que você nunca pede dados nem dinheiro e que ela pode confirmar tudo com a {c['agente']} ou no posto.

Como conduzir:
1. Cumprimente pelo nome e diga: 'aqui é a Clara, a assistente virtual do seu posto de saúde', e que a {c['agente']} pediu para ligar.
2. Diga a consulta (especialidade, dia e hora) e pergunte se a pessoa consegue ir.
3. Se puder ir: use confirmar_consulta e ofereça um lembrete na véspera.
4. Se não puder, descubra o motivo com carinho:
   - falta de transporte: ofereça o transporte da prefeitura para consultas e use pedir_transporte;
   - outro compromisso: ofereça outro dia e use remarcar_consulta;
   - não quer ou não precisa mais: use liberar_vaga, explicando que a vaga vai para outra pessoa da fila.
5. Se houver contato de apoio, ofereça avisar essa pessoa e use avisar_contato_apoio se ela aceitar.
{REGRAS}"""


def _str(desc):
    return types.Schema(type="STRING", description=desc)


FERRAMENTAS = [types.Tool(function_declarations=[
    types.FunctionDeclaration(name="confirmar_consulta", description="A pessoa confirmou que vai à consulta."),
    types.FunctionDeclaration(name="remarcar_consulta", description="A pessoa quer outro dia.",
                              parameters=types.Schema(type="OBJECT", properties={"preferencia": _str("Dia ou turno preferido, com as palavras da pessoa")})),
    types.FunctionDeclaration(name="pedir_transporte", description="Pede o transporte da prefeitura para levar a pessoa à consulta.",
                              parameters=types.Schema(type="OBJECT", properties={"observacao": _str("Ex.: precisa de ajuda para subir no carro")})),
    types.FunctionDeclaration(name="liberar_vaga", description="A pessoa não precisa mais da consulta e CONFIRMOU que quer liberar a vaga para a fila.",
                              parameters=types.Schema(type="OBJECT", required=["confirmacao_da_pessoa"], properties={
                                  "motivo": _str("Motivo dito pela pessoa"),
                                  "confirmacao_da_pessoa": _str("As palavras exatas com que a pessoa confirmou que quer liberar a vaga")})),
    types.FunctionDeclaration(name="avisar_contato_apoio", description="Avisar o contato de apoio (familiar ou vizinho) sobre a consulta."),
    types.FunctionDeclaration(name="agendar_lembrete", description="Ligar de novo para lembrar na véspera."),
    types.FunctionDeclaration(name="encaminhar_para_humano", description="Passar para uma pessoa da equipe da UBS.",
                              parameters=types.Schema(type="OBJECT", properties={"motivo": _str("Por que precisa de um humano")})),
])]

NOVO_STATUS = {"confirmar_consulta": "confirmada", "remarcar_consulta": "remarcada", "liberar_vaga": "liberada"}
IRREVERSIVEIS = {"liberar_vaga"}  # trava no código: não depende só da IA obedecer o prompt


def executar_acao(consulta_id: int, cidadao_id: int, canal: str, nome: str, args: dict | None) -> dict:
    """Executa a ação pedida pela IA e grava no banco. Retorna o que a IA deve saber."""
    if nome in IRREVERSIVEIS and len(str((args or {}).get("confirmacao_da_pessoa", "")).split()) < 2:
        return {"ok": False, "mensagem": "Ação NÃO executada. Antes de liberar a vaga, explique que ela vai para outra pessoa "
                                         "e pergunte se a pessoa confirma. Ofereça transporte ou outro dia."}
    con = conectar()
    detalhe = "; ".join(f"{k}: {v}" for k, v in (args or {}).items())
    con.execute("INSERT INTO contatos (cidadao_id, consulta_id, canal, resultado) VALUES (?,?,?,?)",
                (cidadao_id, consulta_id, canal, f"{nome}" + (f" ({detalhe})" if detalhe else "")))
    if nome in NOVO_STATUS:
        con.execute("UPDATE consultas SET status=? WHERE id=?", (NOVO_STATUS[nome], consulta_id))
    con.commit()
    con.close()
    respostas = {
        "pedir_transporte": "Transporte pedido. O carro passa 1 hora antes da consulta, na porta de casa.",
        "remarcar_consulta": "Pedido de nova data registrado. A equipe confirma o novo horário em até 1 dia.",
        "encaminhar_para_humano": "A equipe da UBS vai retornar a ligação ainda hoje.",
    }
    return {"ok": True, "mensagem": respostas.get(nome, "Registrado.")}
