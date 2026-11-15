"""Vozes da versão "Clara" com 5 chamadas (cota diária): narração em grupos + 2 diálogos com duas vozes,
cortados nas pausas mais longas. Rodar da raiz do projeto."""
import json, os, re, subprocess, time, wave
from pathlib import Path
from dotenv import load_dotenv
from google import genai
from google.genai import types

AQUI = Path(__file__).parent
SAIDA = AQUI / "audio"
load_dotenv(Path.cwd() / ".env")
cli = genai.Client(api_key=os.environ["GEMINI_API_KEY"], http_options=types.HttpOptions(timeout=180_000))
cfg = json.loads((AQUI / "cenas.json").read_text(encoding="utf-8"))
MODELO = "gemini-2.5-flash-preview-tts"
NOMES = {"ia": "Clara", "antonio": "Antonio", "benedita": "Benedita"}
GRUPOS = [["s03", "s03b"], ["s05", "s13"], ["s15", "s16", "s17"]]
texto = {s["id"]: s.get("texto") for s in cfg["segmentos"]}

def salvar(arq, pcm):
    with wave.open(str(arq), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(24000); w.writeframes(pcm)

def chamar(prompt, speech):
    for _ in range(40):
        try:
            r = cli.models.generate_content(model=MODELO, contents=prompt, config=types.GenerateContentConfig(
                response_modalities=["AUDIO"], speech_config=speech))
            return r.candidates[0].content.parts[0].inline_data.data
        except Exception as e:
            msg = str(e)
            if "429" in msg:
                m = re.search(r"retryDelay': '(\d+)s", msg)
                espera = min(int(m.group(1)) + 30, 900) if m else 900
                print(time.strftime("%H:%M"), f"cota esgotada, espero {espera}s", flush=True); time.sleep(espera)
            elif any(x in msg for x in ("500", "503", "timed out", "Timeout")):
                print("erro temporário:", msg[:90], flush=True); time.sleep(20)
            else:
                raise
    raise SystemExit("desisti")

def cortar(arq, n):
    out = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(arq), "-af", "silencedetect=n=-40dB:d=0.25", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    ini = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", out)]
    fim = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", out)]
    with wave.open(str(arq)) as w:
        total = w.getnframes() / 24000
    pausas = [(b - a, (a + b) / 2) for a, b in zip(ini, fim) if a > 0.3 and b < total - 0.3]
    if len(pausas) < n - 1:
        return None
    cortes = sorted(m for _, m in sorted(pausas, reverse=True)[: n - 1])
    return list(zip([0.0] + cortes, cortes + [total]))

def recortar(inteiro, nomes, trechos):
    for nome, (a, b) in zip(nomes, trechos):
        subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(inteiro), "-ss", f"{a:.3f}", "-to", f"{b:.3f}",
                        str(SAIDA / f"{nome}.wav")], check=True)

voz = lambda q: types.VoiceConfig(prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name=cfg["vozes"][q]))

for g in GRUPOS:
    inteiro = AQUI / f"grupo_{'_'.join(g)}.wav"
    if not inteiro.exists():
        partes = "\n\n[pausa de três segundos]\n\n".join(texto[i] for i in g)
        prompt = (f"{cfg['estilo']['narrador']}. Leia os parágrafos abaixo; onde estiver escrito [pausa de três segundos], "
                  f"faça um silêncio de três segundos e não leia essa marcação.\n\n{partes}")
        salvar(inteiro, chamar(prompt, types.SpeechConfig(voice_config=voz("narrador"))))
    t = cortar(inteiro, len(g))
    if not t:
        print("AVISO: não consegui cortar", g, flush=True); continue
    recortar(inteiro, g, t)
    print("ok", g, [round(b - a, 1) for a, b in t], flush=True)

for nome, falas in cfg["dialogos"].items():
    linhas = [(q, t) for q, t in falas if q]
    quem = sorted({q for q, _ in linhas})
    inteiro = AQUI / f"dialogo_{nome}.wav"
    if not inteiro.exists():
        roteiro = "\n".join(f"{NOMES[q]}: {t}" for q, t in linhas)
        outro = [q for q in quem if q != "ia"][0]
        prompt = ("Leia este diálogo em português do Brasil, com uma pausa clara de um segundo entre as falas. "
                  f"Clara é a assistente virtual do posto de saúde, calma e carinhosa. {NOMES[outro]} é uma pessoa idosa e simples.\n\n{roteiro}")
        speech = types.SpeechConfig(multi_speaker_voice_config=types.MultiSpeakerVoiceConfig(speaker_voice_configs=[
            types.SpeakerVoiceConfig(speaker=NOMES[q], voice_config=voz(q)) for q in quem]))
        salvar(inteiro, chamar(prompt, speech))
    t = cortar(inteiro, len(linhas))
    if not t:
        print("AVISO: não consegui cortar o diálogo", nome, flush=True); continue
    recortar(inteiro, [f"d_{nome}_{i}" for i, (q, _) in enumerate(falas) if q], t)
    print("ok diálogo", nome, [round(b - a, 1) for a, b in t], flush=True)
print("vozes completas")
