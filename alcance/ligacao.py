"""Ligação de voz em tempo real: Twilio Media Streams <-> Gemini Live.

Twilio manda áudio mu-law 8 kHz; o Gemini recebe PCM 16 kHz e responde PCM 24 kHz.
"""
import asyncio
import audioop  # stdlib no Python 3.11; shortcut: some no 3.13, trocar por numpy se atualizar o Python
import base64
import json
import logging
import os
import wave

from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from google import genai
from google.genai import types
from twilio.rest import Client as Twilio

from alcance.config import DADOS
from alcance.db import conectar
from alcance.assistente import pcm_para_wav, transcrever
from alcance.ia import FERRAMENTAS, MODELOS_VOZ, contexto_consulta, executar_acao, instrucoes_ligacao

log = logging.getLogger("alcance.ligacao")
router = APIRouter()
URL_PUBLICA = DADOS / "url_publica.txt"  # escrito por `python -m alcance.tunel`


def _salvar_fala(consulta_id: int, quem: str, texto: str):
    texto = texto.strip()
    if not texto:
        return
    con = conectar()
    con.execute("INSERT INTO falas (consulta_id, quem, texto) VALUES (?,?,?)", (consulta_id, quem, texto))
    con.commit()
    con.close()


@router.post("/api/ligar/{cid}")
def ligar(cid: int):
    """Liga para o celular verificado (MEU_CELULAR) fazendo o papel do cidadão `cid`."""
    if not URL_PUBLICA.exists():
        raise HTTPException(503, "Túnel desligado. Rode: python -m alcance.tunel")
    host = URL_PUBLICA.read_text().strip().removeprefix("https://")
    contexto_consulta(cid)  # valida antes de gastar a ligação
    twiml = (f'<Response><Connect><Stream url="wss://{host}/twilio/stream">'
             f'<Parameter name="cid" value="{cid}"/></Stream></Connect></Response>')
    tw = Twilio(os.environ["TWILIO_ACCOUNT_SID"], os.environ["TWILIO_AUTH_TOKEN"])
    # destino fixo: só o número verificado do dono da conta pode ser chamado
    chamada = tw.calls.create(to=os.environ["MEU_CELULAR"], from_=os.environ["TWILIO_PHONE_NUMBER"], twiml=twiml)
    return {"status": "ligando", "sid": chamada.sid}


async def _abrir_sessao(cliente, config):
    ultimo = None
    for modelo in MODELOS_VOZ:
        try:
            cm = cliente.aio.live.connect(model=modelo, config=config)
            return cm, await cm.__aenter__()
        except Exception as e:  # modelo indisponível: tenta o próximo
            log.warning("Modelo %s falhou: %s", modelo, e)
            ultimo = e
    raise RuntimeError(f"Nenhum modelo de voz disponível: {ultimo}")


@router.websocket("/twilio/stream")
async def stream(ws: WebSocket):
    await ws.accept()
    sid = None
    # espera o evento "start" com o streamSid e o cidadão
    while sid is None:
        msg = json.loads(await ws.receive_text())
        if msg["event"] == "start":
            sid = msg["start"]["streamSid"]
            cid = int(msg["start"]["customParameters"]["cid"])
    c = contexto_consulta(cid)
    config = types.LiveConnectConfig(
        response_modalities=["AUDIO"],
        system_instruction=instrucoes_ligacao(c),
        tools=FERRAMENTAS,
        speech_config=types.SpeechConfig(language_code="pt-BR"),
        input_audio_transcription=types.AudioTranscriptionConfig(),
        output_audio_transcription=types.AudioTranscriptionConfig(),
        # linha telefônica tem chiado: detecção de fala menos sensível evita "interrupções" falsas
        realtime_input_config=types.RealtimeInputConfig(automatic_activity_detection=types.AutomaticActivityDetection(
            start_of_speech_sensitivity=types.StartSensitivity.START_SENSITIVITY_LOW,
            end_of_speech_sensitivity=types.EndSensitivity.END_SENSITIVITY_LOW,
            prefix_padding_ms=300, silence_duration_ms=900)),
    )
    cm, sessao = await _abrir_sessao(genai.Client(api_key=os.environ["GEMINI_API_KEY"]), config)
    estado_in, estado_out = None, None
    gravacao = bytearray()  # primeiros 60 s do áudio recebido, para diagnóstico da qualidade
    audio_turno = bytearray()  # áudio da pessoa desde o último turno, para a legenda em português
    fila = None  # tarefa de legenda anterior: mantém as falas na ordem certa

    async def salvar_turno(anterior, pcm: bytes, legenda_ao_vivo: str, texto_ia: str):
        texto = ""
        if len(pcm) > 16000 * 2 // 2:  # só transcreve se houver mais de meio segundo de áudio
            try:
                texto = await asyncio.to_thread(transcrever, pcm_para_wav(pcm, 16000), "audio/wav")
            except Exception as e:
                log.warning("legenda falhou: %s", e)
        if anterior:
            await anterior
        _salvar_fala(c["consulta_id"], "pessoa", texto or legenda_ao_vivo)
        _salvar_fala(c["consulta_id"], "ia", texto_ia)

    def fechar_turno():
        nonlocal fila
        fila = asyncio.create_task(salvar_turno(fila, bytes(audio_turno), "".join(fala_pessoa), "".join(fala_ia)))
        audio_turno.clear()
        fala_ia.clear()
        fala_pessoa.clear()
    fala_ia, fala_pessoa = [], []

    async def telefone_para_ia():
        nonlocal estado_in
        while True:
            msg = json.loads(await ws.receive_text())
            if msg["event"] == "media":
                pcm8 = audioop.ulaw2lin(base64.b64decode(msg["media"]["payload"]), 2)
                pcm16, estado_in = audioop.ratecv(pcm8, 2, 1, 8000, 16000, estado_in)
                if len(gravacao) < 16000 * 2 * 60:
                    gravacao.extend(pcm16)
                audio_turno.extend(pcm16)
                await sessao.send_realtime_input(audio=types.Blob(data=pcm16, mime_type="audio/pcm;rate=16000"))
            elif msg["event"] == "stop":
                return

    async def ia_para_telefone():
        nonlocal estado_out
        while True:
            async for m in sessao.receive():
                if m.tool_call:
                    respostas = []
                    for f in m.tool_call.function_calls:
                        r = executar_acao(c["consulta_id"], c["id"], "ligacao", f.name, f.args)
                        _salvar_fala(c["consulta_id"], "acao", f.name)
                        respostas.append(types.FunctionResponse(id=f.id, name=f.name, response=r))
                    await sessao.send_tool_response(function_responses=respostas)
                sc = m.server_content
                if not sc:
                    continue
                if sc.interrupted:  # a pessoa falou por cima: para de tocar o que estava no buffer
                    await ws.send_text(json.dumps({"event": "clear", "streamSid": sid}))
                if sc.model_turn:
                    for p in sc.model_turn.parts:
                        if p.inline_data:
                            pcm8, estado_out = audioop.ratecv(p.inline_data.data, 2, 1, 24000, 8000, estado_out)
                            await ws.send_text(json.dumps({"event": "media", "streamSid": sid,
                                                           "media": {"payload": base64.b64encode(audioop.lin2ulaw(pcm8, 2)).decode()}}))
                if sc.output_transcription and sc.output_transcription.text:
                    fala_ia.append(sc.output_transcription.text)
                if sc.input_transcription and sc.input_transcription.text:
                    fala_pessoa.append(sc.input_transcription.text)
                if sc.turn_complete:
                    fechar_turno()

    try:
        # a IA abre a conversa assim que a pessoa atende
        await sessao.send_client_content(
            turns=types.Content(role="user", parts=[types.Part(text="A pessoa atendeu o telefone. Comece a conversa.")]),
            turn_complete=True)
        tarefas = [asyncio.create_task(telefone_para_ia()), asyncio.create_task(ia_para_telefone())]
        await asyncio.wait(tarefas, return_when=asyncio.FIRST_COMPLETED)
        for t in tarefas:
            t.cancel()
    except WebSocketDisconnect:
        pass
    finally:
        with wave.open(str(DADOS / "ultima_ligacao_entrada.wav"), "wb") as w:
            w.setnchannels(1); w.setsampwidth(2); w.setframerate(16000); w.writeframes(bytes(gravacao))
        fechar_turno()
        await fila
        await cm.__aexit__(None, None, None)
