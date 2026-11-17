"""Narração nova (Gemini 3.8 Flash TTS, voz Charon) em 4 takes longos, cortados nos trechos por
programação dinâmica (duração esperada pelo tamanho do texto). Rodar da raiz do projeto."""
import json, math, os, re, subprocess, time, wave
from functools import lru_cache
from pathlib import Path
from dotenv import load_dotenv
from google import genai
from google.genai import types

AQUI = Path(__file__).parent
SAIDA = AQUI / "audio"
load_dotenv(Path.cwd() / ".env")
cli = genai.Client(api_key=os.environ["GEMINI_API_KEY"], http_options=types.HttpOptions(timeout=300_000))
cfg = json.loads((AQUI / "cenas.json").read_text(encoding="utf-8"))
MODELO, VOZ = "gemini-3.8-flash-tts", "Charon"
ESTILO = ("Narre em português do Brasil, com sotaque brasileiro natural, como um apresentador de pitch de startup: "
          "voz calorosa, confiante e com energia, ritmo ágil de conversa, sem arrastar as palavras. "
          "Onde estiver escrito [pausa], faça um silêncio de dois segundos e não leia a marcação")
texto = {s["id"]: s["texto"] for s in cfg["segmentos"] if s.get("texto")}
ids = list(texto)
GRUPOS = [ids[0:6], ids[6:12], ids[12:]]

def chamar(prompt):
    for _ in range(30):
        try:
            r = cli.models.generate_content(model=MODELO, contents=prompt, config=types.GenerateContentConfig(
                response_modalities=["AUDIO"], speech_config=types.SpeechConfig(voice_config=types.VoiceConfig(
                    prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name=VOZ)))))
            return r.candidates[0].content.parts[0].inline_data.data
        except Exception as e:
            msg = str(e)
            m = re.search(r"retryDelay': '(\d+)s", msg)
            print(time.strftime("%H:%M"), msg[:100], flush=True)
            time.sleep(min(int(m.group(1)) + 20, 900) if (m and "429" in msg) else 20)
    raise SystemExit("desisti")

def cortar(arq, pesos):
    out = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(arq), "-af", "silencedetect=n=-40dB:d=0.3", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    ini = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", out)]
    fim = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", out)]
    with wave.open(str(arq)) as w:
        total = w.getnframes() / w.getframerate()
    # pausas longas valem mais como ponto de corte
    cand = [((a + b) / 2, b - a) for a, b in zip(ini, fim) if 0.3 < a and b < total - 0.3]
    pontos = [0.0] + [c for c, _ in cand] + [total]
    bonus = [0.0] + [min(d, 2.0) for _, d in cand] + [0.0]
    esperado = [total * p / sum(pesos) for p in pesos]
    n = len(pesos)

    @lru_cache(None)
    def melhor(k, j):
        if k == 0:
            return (0.0, (0,)) if j == 0 else (math.inf, ())
        res = (math.inf, ())
        for i in range(j):
            c, cam = melhor(k - 1, i)
            if c == math.inf:
                continue
            d = pontos[j] - pontos[i]
            custo = c + math.log(max(d, 0.2) / esperado[k - 1]) ** 2 - (0.6 * bonus[j] if k < n else 0)
            if custo < res[0]:
                res = (custo, cam + (j,))
        return res

    _, cam = melhor(n, len(pontos) - 1)
    return [(pontos[a], pontos[b]) for a, b in zip(cam, cam[1:])]

for g in GRUPOS:
    inteiro = AQUI / f"narr_{g[0]}_{g[-1]}.wav"
    if not inteiro.exists():
        # o 3.8 lê em voz alta qualquer instrução: o prompt é SÓ o texto da narração
        pcm = chamar("\n\n".join(texto[i] for i in g))
        with wave.open(str(inteiro), "wb") as w:
            w.setnchannels(1); w.setsampwidth(2); w.setframerate(24000); w.writeframes(pcm)
        time.sleep(5)
    continue  # o corte fica com o alinhar.py
    for i, (a, b) in zip(g, trechos):
        subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(inteiro), "-ss", f"{a:.3f}", "-to", f"{b:.3f}",
                        str(SAIDA / f"{i}.wav")], check=True)
    print("ok", g, [round(b - a, 1) for a, b in trechos], flush=True)
print("narração completa")
