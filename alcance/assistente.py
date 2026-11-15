"""Assistente de mensagens (WhatsApp): texto, áudio e foto, com ações, base de direitos e resposta em voz."""
import io
import logging
import os
import re
import time
import wave
from pathlib import Path

import lameenc
from google import genai
from google.genai import types

from alcance.canais import modo_resposta
from alcance.ia import FERRAMENTAS, REGRAS, UBS, executar_acao, _data_falada, HORARIOS, persona

log = logging.getLogger("alcance.assistente")
CONHECIMENTO = (Path(__file__).parent / "conhecimento.md").read_text(encoding="utf-8")
# (modelo, orçamento de "pensamento"): medido em 14/11, o 3.5-flash sem pensamento respondeu em ~4 s
MODELOS_TEXTO = [("gemini-3.5-flash", 0), ("gemini-3.6-flash", 0), ("gemini-3.5-flash-lite", None)]
MODELOS_TTS = [("gemini-3.8-flash-tts", None), ("gemini-2.5-flash-preview-tts", None)]
MODELO_TRANSCRICAO = [("gemini-3.5-flash-lite", None), ("gemini-3.5-flash", 0)]


def _cliente():
    # sem novas tentativas no mesmo modelo: se demorar, passa logo para o próximo da lista
    return genai.Client(api_key=os.environ["GEMINI_API_KEY"], http_options=types.HttpOptions(
        timeout=15000, retry_options=types.HttpRetryOptions(attempts=1)))


def _gerar(cliente, modelos, _tentativa=0, **kw):
    """Tenta cada modelo em ordem: o Gemini às vezes devolve 503 (sobrecarga), 404 (modelo aposentado) ou 429 (limite).
    Se todos baterem no limite por minuto, espera o tempo pedido e tenta mais uma vez."""
    ultimo, espera = None, 0
    for m, pensamento in modelos:
        try:
            config = (kw.get("config") or types.GenerateContentConfig()).model_copy()
            if pensamento is not None:
                config.thinking_config = types.ThinkingConfig(thinking_budget=pensamento)
            return cliente.models.generate_content(model=m, **{**kw, "config": config})
        except Exception as e:
            log.warning("modelo %s falhou: %s", m, str(e)[:120])
            ultimo = e
            achou = re.search(r"retry in ([\d.]+)s", str(e))
            if "429" in str(e):
                espera = max(espera, float(achou.group(1)) + 1 if achou else 10)
    if espera and _tentativa == 0:
        time.sleep(min(espera, 30))
        return _gerar(cliente, modelos, _tentativa=1, **kw)
    raise RuntimeError(f"Nenhum modelo respondeu: {ultimo}")


def instrucoes_mensagem(c: dict) -> str:
    nome = c["nome"].split()[0]
    tratamento = ("Seu " if c["sexo"] == "M" else "Dona ") + nome if c["idade"] >= 60 else nome
    modos = modo_resposta(c)
    jeito = []
    if "audio" in modos:
        jeito.append("Sua resposta vai virar ÁUDIO: escreva como se estivesse falando, sem listas, sem emojis, sem links.")
    if c["surdez"]:
        jeito.append("A pessoa é surda e tem a Libras como primeira língua: use frases muito curtas e diretas, português simples, "
                     "uma ideia por frase. Ofereça a tradução em Libras pelo site quando ajudar.")
    hora = HORARIOS[c["consulta_id"] % len(HORARIOS)]
    return f"""{persona()}
Você está conversando por WhatsApp com {tratamento}, {c['idade']} anos.
Agente comunitária da pessoa: {c['agente']}.
Consulta marcada: {c['especialidade'].lower()} em {_data_falada(c['data_consulta'])}, às {hora}. Situação: {c['status']}.
{' '.join(jeito)}

Você ajuda com: a consulta (confirmar, remarcar, transporte, liberar vaga), explicar cartas e documentos que a pessoa fotografar
(diga em 2 ou 3 frases o que a carta pede, até quando e o que levar) e tirar dúvidas sobre direitos, usando SÓ a base abaixo.
Ao citar a fonte, use o nome que está no título do bloco (por exemplo "a LOAS", "o Estatuto da Pessoa Idosa"). Nunca atribua a informação a outro bloco.
Se a resposta não estiver na base, diga que não tem certeza e ofereça falar com a equipe (encaminhar_para_humano). Nunca invente lei, valor ou prazo.
Responda em no máximo 3 frases curtas, com no máximo 50 palavras no total, mesmo quando pedirem "direitinho". Responda primeiro exatamente o que foi perguntado (se perguntarem "como faço", diga como fazer, com o telefone ou o lugar); corte os detalhes, nunca a resposta. Termine com uma pergunta simples quando houver um próximo passo.
{REGRAS}

BASE DE CONHECIMENTO:
{CONHECIMENTO}"""


# "Primeiro oferece, depois faz" não pode depender só do prompt: a avaliação pegou a IA perguntando
# "quer que eu chame o transporte?" e pedindo o transporte na mesma resposta. Agora o código confere.
_SIM = re.compile(r"\b(sim|quero|pode|podem|isso|claro|ok|okay|aceito|por favor|beleza|t[aá] bom|combinado|confirmo|pode ser|quero sim)\b", re.I)
SEM_PRECISAR_DE_SIM = {"encaminhar_para_humano"}  # pedir um humano já é o pedido explícito


def disse_sim(fala: str) -> bool:
    return bool(_SIM.search(fala or ""))


def responder(c: dict, historico: list[tuple[str, str]], partes: list[types.Part], fala_da_pessoa: str | None = None) -> tuple[str, list[str]]:
    """Gera a resposta. historico: [(quem, texto)]. Retorna (texto, ações executadas).
    fala_da_pessoa: o que a pessoa disse agora (texto ou transcrição do áudio), para conferir o "sim" antes de agir."""
    if fala_da_pessoa is None:
        fala_da_pessoa = " ".join(p.text for p in partes if getattr(p, "text", None))
    cliente = _cliente()
    conteudos = [types.Content(role="user" if q == "pessoa" else "model", parts=[types.Part(text=t)])
                 for q, t in historico[-12:] if q in ("pessoa", "ia")]
    conteudos.append(types.Content(role="user", parts=partes))
    config = types.GenerateContentConfig(system_instruction=instrucoes_mensagem(c), tools=FERRAMENTAS,
                                         automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True))
    acoes = []
    for _ in range(3):  # no máximo 3 rodadas de ação -> resposta
        r = _gerar(cliente, MODELOS_TEXTO, contents=conteudos, config=config)
        chamadas = r.function_calls or []
        if not chamadas:
            return (r.text or "").strip(), acoes
        conteudos.append(r.candidates[0].content)
        respostas = []
        for f in chamadas:
            if f.name not in SEM_PRECISAR_DE_SIM and not disse_sim(fala_da_pessoa):
                res = {"ok": False, "mensagem": "Bloqueado: a pessoa ainda não disse sim. Ofereça e espere a resposta antes de fazer."}
            else:
                res = executar_acao(c["consulta_id"], c["id"], "whatsapp", f.name, dict(f.args or {}))
                acoes.append(f.name)
            respostas.append(types.Part.from_function_response(name=f.name, response=res))
        conteudos.append(types.Content(role="user", parts=respostas))
    return "Registrei seu pedido. A equipe da UBS vai confirmar com você.", acoes


def transcrever(audio: bytes, mime: str) -> str:
    """Transcreve um áudio em português (usado no WhatsApp e na legenda da ligação)."""
    r = _gerar(_cliente(), MODELO_TRANSCRICAO, contents=[
        types.Part.from_bytes(data=audio, mime_type=mime),
        "Transcreva em português do Brasil exatamente o que a pessoa disse. Responda só a transcrição. Se não houver fala, responda vazio."])
    return (r.text or "").strip()


_SENSIVEIS = [
    (re.compile(r"\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b"), "[CPF]"),
    (re.compile(r"\b(?:\d[ -]?){12,18}\d\b"), "[CARTÃO]"),
    (re.compile(r"(?:\+?55\s?)?\(?\d{2}\)?\s?9?\d{4}-?\d{4}\b"), "[TELEFONE]"),
]


def mascarar(texto: str) -> str:
    """LGPD (minimização): CPF, cartão e telefone não vão para a IA nem para o histórico."""
    for padrao, troca in _SENSIVEIS:
        texto = padrao.sub(troca, texto)
    return texto


def pcm_para_wav(pcm: bytes, taxa: int) -> bytes:
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(taxa)
        w.writeframes(pcm)
    return buf.getvalue()


def falar(texto: str, devagar: bool = False) -> bytes:
    """Converte texto em MP3 (formato aceito pelo WhatsApp)."""
    jeito = "devagar, com calma e carinho" if devagar else "com calma e carinho"
    r = _gerar(_cliente(), MODELOS_TTS, contents=f"Fale em português do Brasil, {jeito}: {texto}",
               config=types.GenerateContentConfig(
                   response_modalities=["AUDIO"],
                   speech_config=types.SpeechConfig(voice_config=types.VoiceConfig(
                       prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name="Kore")))))
    pcm = r.candidates[0].content.parts[0].inline_data.data
    enc = lameenc.Encoder()
    enc.set_bit_rate(64)
    enc.set_in_sample_rate(24000)
    enc.set_channels(1)
    enc.set_quality(5)
    return enc.encode(pcm) + enc.flush()
