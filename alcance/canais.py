"""As 3 frentes: decide por qual canal o ALCANCE fala com cada cidadão."""

WHATSAPP, LIGACAO, AGENTE = "whatsapp", "ligacao", "agente"


def escolher_canal(c: dict, dia_do_mes: int) -> str:
    """c: linha de `cidadaos` como dict. Retorna whatsapp | ligacao | agente."""
    if c["telefone"] == "nenhum":
        return AGENTE
    if c["telefone"] == "basico":
        return LIGACAO
    # smartphone: sem dados móveis no fim do mês, a ligação comum ainda funciona
    sem_dados = c["dados_ate_dia"] is not None and dia_do_mes > c["dados_ate_dia"]
    return LIGACAO if sem_dados else WHATSAPP


def modo_resposta(c: dict) -> list[str]:
    """Como a mensagem deve ser entregue, segundo o perfil de acessibilidade."""
    modos = ["linguagem_simples"]  # sempre (Lei 15.263/2025)
    if c["baixa_visao"] or c["baixo_letramento"]:
        modos.append("audio")
    if c["surdez"]:
        modos += ["texto", "libras"]
    if c["voz_lenta"]:
        modos.append("voz_lenta")
    return modos
