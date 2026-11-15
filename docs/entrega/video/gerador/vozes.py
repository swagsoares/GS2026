"""Gera as falas do vídeo com o Gemini TTS. Rodar a partir da raiz do projeto (para ler o .env)."""
import json, os, re, sys, time, wave
from pathlib import Path
from dotenv import load_dotenv
from google import genai
from google.genai import types

AQUI = Path(__file__).parent
SAIDA = AQUI / "audio"; SAIDA.mkdir(exist_ok=True)
load_dotenv(Path.cwd() / ".env")
cli = genai.Client(api_key=os.environ["GEMINI_API_KEY"], http_options=types.HttpOptions(timeout=120_000))
cfg = json.loads((AQUI / "cenas.json").read_text(encoding="utf-8"))
MODELOS = ["gemini-2.5-flash-preview-tts", "gemini-3.8-flash-tts"]

def falar(nome, quem, texto):
    arq = SAIDA / f"{nome}.wav"
    if arq.exists():
        return
    prompt = f"{cfg['estilo'][quem]}: {texto}"
    conf = types.GenerateContentConfig(response_modalities=["AUDIO"], speech_config=types.SpeechConfig(
        voice_config=types.VoiceConfig(prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name=cfg["vozes"][quem]))))
    for tentativa in range(6):
        for modelo in MODELOS:
            try:
                r = cli.models.generate_content(model=modelo, contents=prompt, config=conf)
                pcm = r.candidates[0].content.parts[0].inline_data.data
                with wave.open(str(arq), "wb") as w:
                    w.setnchannels(1); w.setsampwidth(2); w.setframerate(24000); w.writeframes(pcm)
                print(f"ok {nome} ({modelo}, {len(pcm)/48000:.1f}s)", flush=True)
                return
            except Exception as e:
                msg = str(e)
                m = re.search(r"retry(?:Delay)?['\": in]+(\d+)", msg)
                print(f"  {nome} {modelo}: {msg[:120]}", flush=True)
                if "429" in msg:
                    time.sleep(int(m.group(1)) + 2 if m else 30)
        time.sleep(5)
    sys.exit(f"falhou: {nome}")

for s in cfg["segmentos"]:
    if s.get("texto"):
        falar(s["id"], "narrador", s["texto"])
for nome, falas in cfg["dialogos"].items():
    for i, (quem, texto) in enumerate(falas):
        if quem:
            falar(f"d_{nome}_{i}", quem, texto)
print("tudo pronto")
