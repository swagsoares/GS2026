"""Diálogos com direção de interpretação (Gemini 2.5 TTS, que segue instruções sem lê-las) e a frase de abertura.
Rodar da raiz do projeto."""
import json, os, re, time, wave
from pathlib import Path
from dotenv import load_dotenv
from google import genai
from google.genai import types

AQUI = Path(__file__).parent
load_dotenv(Path.cwd() / ".env")
cli = genai.Client(api_key=os.environ["GEMINI_API_KEY"], http_options=types.HttpOptions(timeout=300_000))
cfg = json.loads((AQUI / "cenas.json").read_text(encoding="utf-8"))
voz = lambda n: types.VoiceConfig(prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name=n))

def salvar(arq, pcm):
    with wave.open(str(arq), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(24000); w.writeframes(pcm)

def chamar(modelo, conteudo, speech):
    for _ in range(12):
        try:
            r = cli.models.generate_content(model=modelo, contents=conteudo, config=types.GenerateContentConfig(
                response_modalities=["AUDIO"], speech_config=speech))
            return r.candidates[0].content.parts[0].inline_data.data
        except Exception as e:
            msg = str(e); print(time.strftime("%H:%M"), modelo, msg[:110], flush=True)
            if "PerDay" in msg:
                return None
            m = re.search(r"retryDelay': '(\d+)s", msg)
            time.sleep(min(int(m.group(1)) + 10, 120) if m else 20)
    return None

DIRECAO = {
    "antonio": ("Leia esta ligação telefônica em português do Brasil, como uma cena real e natural. "
                "Clara é a assistente virtual do posto de saúde: voz feminina calorosa, sorridente, calma, frases claras, ritmo de conversa. "
                "Antonio é um senhor de 68 anos do interior, simples, educado e um pouco tímido; fala devagar, com voz de idoso, "
                "e no fim fica aliviado e agradecido. Pausa natural de meio segundo entre as falas."),
    "benedita": ("Leia esta troca de áudios de WhatsApp em português do Brasil, como uma cena real e natural. "
                 "Clara é a assistente virtual do posto de saúde: voz feminina calorosa, paciente, explica devagar e com carinho. "
                 "Benedita é uma senhora de 72 anos, simpática, um pouco confusa com a carta, voz de idosa. Pausa de meio segundo entre as falas."),
}
NOMES = {"ia": "Clara", "antonio": "Antonio", "benedita": "Benedita"}
VOZES = {"ia": "Kore", "antonio": "Algenib", "benedita": "Gacrux"}
for nome, falas in cfg["dialogos"].items():
    arq = AQUI / f"dialogo4_{nome}.wav"
    if arq.exists():
        continue
    linhas = [(q, t) for q, t in falas if q]
    quem = sorted({q for q, _ in linhas})
    speech = types.SpeechConfig(multi_speaker_voice_config=types.MultiSpeakerVoiceConfig(speaker_voice_configs=[
        types.SpeakerVoiceConfig(speaker=NOMES[q], voice_config=voz(VOZES[q])) for q in quem]))
    pcm = chamar("gemini-2.5-flash-preview-tts", DIRECAO[nome] + "\n\n" + "\n".join(f"{NOMES[q]}: {t}" for q, t in linhas), speech)
    if pcm:
        salvar(arq, pcm); print("diálogo ok", nome, round(len(pcm) / 48000, 1), "s", flush=True)
    time.sleep(5)

# frase de abertura (mesma voz da narração: Charon no 3.8, que exige só o texto; se não houver cota, usa o 2.5)
GANCHO = "Esta é a Clara. Não é mais um lembrete por SMS: ela liga para quem não consegue ler, resolve na hora e avisa a família."
arq = AQUI / "audio" / "s00v.wav"
if not arq.exists():
    pcm = chamar("gemini-3.8-flash-tts", GANCHO, types.SpeechConfig(voice_config=voz("Charon")))
    if not pcm:
        pcm = chamar("gemini-2.5-flash-preview-tts", "Narre em português do Brasil, voz calorosa e confiante de apresentador: " + GANCHO,
                     types.SpeechConfig(voice_config=voz("Charon")))
    if pcm:
        salvar(arq, pcm); print("gancho ok", round(len(pcm) / 48000, 1), "s", flush=True)
