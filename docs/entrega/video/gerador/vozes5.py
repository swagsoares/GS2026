"""Falas novas (s03b reescrita + s08b rede de apoio) e diálogos com o Gemini 3.8 TTS.
Regra aprendida: o 3.8 lê em voz alta qualquer instrução, então o prompt é só o texto (ou só as falas)."""
import json, os, re, subprocess, sys, time, wave
from pathlib import Path
from dotenv import load_dotenv
from google import genai
from google.genai import types

AQUI = Path(__file__).parent
load_dotenv(Path.cwd() / ".env")
cli = genai.Client(api_key=os.environ["GEMINI_API_KEY"], http_options=types.HttpOptions(timeout=300_000))
cfg = json.loads((AQUI / "cenas.json").read_text(encoding="utf-8"))
MODELO = "gemini-3.8-flash-tts"
seg = {s["id"]: s for s in cfg["segmentos"]}

def salvar(arq, pcm):
    with wave.open(str(arq), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(24000); w.writeframes(pcm)

def chamar(conteudo, speech):
    for _ in range(20):
        try:
            r = cli.models.generate_content(model=MODELO, contents=conteudo, config=types.GenerateContentConfig(
                response_modalities=["AUDIO"], speech_config=speech))
            return r.candidates[0].content.parts[0].inline_data.data
        except Exception as e:
            msg = str(e); print(time.strftime("%H:%M"), msg[:110], flush=True)
            m = re.search(r"retryDelay': '(\d+)s", msg)
            time.sleep(min(int(m.group(1)) + 15, 600) if (m and "429" in msg) else 20)
    raise SystemExit("desisti")

voz = lambda n: types.VoiceConfig(prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name=n))

# 1) narração: duas falas numa chamada só
arq = AQUI / "narr_s03b_s08b.wav"
if not arq.exists():
    salvar(arq, chamar(seg["s03b"]["texto"] + "\n\n" + seg["s08b"]["texto"], types.SpeechConfig(voice_config=voz("Charon"))))
    time.sleep(4)
print("narração ok", flush=True)

# 2) diálogos: só as falas, com os nomes dos falantes
NOMES = {"ia": "Clara", "antonio": "Antonio", "benedita": "Benedita"}
VOZES = {"ia": "Kore", "antonio": "Algenib", "benedita": "Gacrux"}
for nome, falas in cfg["dialogos"].items():
    arq = AQUI / f"dialogo3_{nome}.wav"
    if arq.exists():
        continue
    linhas = [(q, t) for q, t in falas if q]
    quem = sorted({q for q, _ in linhas})
    speech = types.SpeechConfig(multi_speaker_voice_config=types.MultiSpeakerVoiceConfig(speaker_voice_configs=[
        types.SpeakerVoiceConfig(speaker=NOMES[q], voice_config=voz(VOZES[q])) for q in quem]))
    salvar(arq, chamar("\n".join(f"{NOMES[q]}: {t}" for q, t in linhas), speech))
    print("diálogo ok", nome, flush=True)
    time.sleep(4)
