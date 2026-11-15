"""Canal WhatsApp (Twilio Sandbox): recebe texto, áudio e foto; responde em texto e, se o perfil pedir, em áudio."""
import logging
import os
import re
import uuid

import httpx
from fastapi import APIRouter, BackgroundTasks, HTTPException, Request, Response
from fastapi.responses import FileResponse
from google.genai import types
from twilio.request_validator import RequestValidator
from twilio.rest import Client as Twilio

from alcance import assistente
from alcance.canais import modo_resposta
from alcance.config import DADOS
from alcance.db import conectar
from alcance.ia import contexto_consulta
from alcance.ligacao import URL_PUBLICA, _salvar_fala

log = logging.getLogger("alcance.whatsapp")
router = APIRouter()
AUDIOS = DADOS / "audios"
PERFIL = DADOS / "perfil_whatsapp.txt"  # qual cidadão fictício o seu celular representa na demo
TWIML_VAZIO = '<?xml version="1.0" encoding="UTF-8"?><Response></Response>'


def cidadao_do_celular() -> int:
    return int(PERFIL.read_text()) if PERFIL.exists() else 3  # padrão: Dona Benedita


@router.post("/api/demo/perfil-whatsapp/{cid}")
def escolher_perfil(cid: int):
    contexto_consulta(cid)
    PERFIL.write_text(str(cid))
    return {"cid": cid}


@router.get("/audios/{nome}")
def audio(nome: str):
    if not re.fullmatch(r"[0-9a-f]{32}\.mp3", nome):  # impede acesso a outros arquivos
        raise HTTPException(404)
    caminho = AUDIOS / nome
    if not caminho.exists():
        raise HTTPException(404)
    return FileResponse(caminho, media_type="audio/mpeg")


def _historico(consulta_id: int) -> list[tuple[str, str]]:
    con = conectar()
    linhas = con.execute("SELECT quem, texto FROM falas WHERE consulta_id=? ORDER BY id", (consulta_id,)).fetchall()
    con.close()
    return [(q, t) for q, t in linhas]


def processar(form: dict):
    """Roda em segundo plano: entende a mensagem, responde e grava tudo."""
    sid, token = os.environ["TWILIO_ACCOUNT_SID"], os.environ["TWILIO_AUTH_TOKEN"]
    c = contexto_consulta(cidadao_do_celular())
    registro = assistente.mascarar(form.get("Body", "").strip())
    partes = [types.Part(text=registro)] if registro else []
    for i in range(int(form.get("NumMedia", 0))):
        tipo = form[f"MediaContentType{i}"]
        dados = httpx.get(form[f"MediaUrl{i}"], auth=(sid, token), follow_redirects=True, timeout=30).content
        if tipo.startswith("audio/"):
            registro = assistente.mascarar(assistente.transcrever(dados, tipo)) or "(áudio)"
            partes.append(types.Part.from_bytes(data=dados, mime_type=tipo))
        elif tipo.startswith("image/"):
            registro = (registro + " (enviou uma foto)").strip()
            partes += [types.Part.from_bytes(data=dados, mime_type=tipo),
                       types.Part(text="A pessoa mandou esta foto. Se for carta ou documento, explique de forma simples.")]
    if not partes:
        return
    historico = _historico(c["consulta_id"])
    _salvar_fala(c["consulta_id"], "pessoa", registro)
    texto, acoes = assistente.responder(c, historico, partes, fala_da_pessoa=registro)
    for a in acoes:
        _salvar_fala(c["consulta_id"], "acao", a)
    _salvar_fala(c["consulta_id"], "ia", texto)

    media = None
    modos = modo_resposta(c)
    if "audio" in modos and URL_PUBLICA.exists():
        AUDIOS.mkdir(exist_ok=True)
        nome = f"{uuid.uuid4().hex}.mp3"
        (AUDIOS / nome).write_bytes(assistente.falar(texto, devagar="voz_lenta" in modos))
        media = [f"{URL_PUBLICA.read_text().strip()}/audios/{nome}"]
    Twilio(sid, token).messages.create(from_=os.environ["TWILIO_WHATSAPP_NUMBER"], to=form["From"],
                                       body=texto, media_url=media)


@router.post("/whatsapp")
async def receber(request: Request, tarefas: BackgroundTasks):
    form = dict(await request.form())
    # garante que a mensagem veio mesmo da Twilio (assinatura HMAC com o Auth Token)
    url = f"{URL_PUBLICA.read_text().strip()}/whatsapp" if URL_PUBLICA.exists() else str(request.url)
    assinatura = request.headers.get("X-Twilio-Signature", "")
    if not RequestValidator(os.environ["TWILIO_AUTH_TOKEN"]).validate(url, form, assinatura):
        raise HTTPException(403, "Assinatura inválida")
    if form.get("From") != f"whatsapp:{os.environ['MEU_CELULAR']}":
        return Response(TWIML_VAZIO, media_type="application/xml")  # demo: só responde ao número verificado
    tarefas.add_task(processar, form)
    return Response(TWIML_VAZIO, media_type="application/xml")
