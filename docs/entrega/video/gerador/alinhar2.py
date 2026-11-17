"""Corte preciso: para cada fronteira, testa os silêncios candidatos perto da estimativa, transcreve os 3 s
seguintes e escolhe o que começa com as primeiras palavras esperadas. No fim, transcreve cada trecho inteiro."""
import difflib, json, os, re, subprocess, sys, time, unicodedata, wave
from pathlib import Path
from dotenv import load_dotenv
from google import genai
from google.genai import types

AQUI = Path(__file__).parent
load_dotenv(Path.cwd() / ".env")
cli = genai.Client(api_key=os.environ["GEMINI_API_KEY"], http_options=types.HttpOptions(timeout=120_000))
cfg = json.loads((AQUI / "cenas.json").read_text(encoding="utf-8"))
texto = {s["id"]: s["texto"] for s in cfg["segmentos"] if s.get("texto")}
ids = list(texto)
GRUPOS = [ids[0:6], ids[6:12]] if len(sys.argv) < 2 else [ids[12:]]
TMP = AQUI / "tmp_alinhar"; TMP.mkdir(exist_ok=True)

def norm(t):
    t = unicodedata.normalize("NFKD", t.lower())
    t = "".join(c for c in t if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9 ]", " ", t).split()

def ouvir(arq, ini, dur):
    tmp = TMP / "trecho.wav"
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-ss", f"{ini:.3f}", "-t", f"{dur:.2f}", "-i", str(arq), str(tmp)], check=True)
    for _ in range(6):
        try:
            r = cli.models.generate_content(model="gemini-3.5-flash-lite", contents=[types.Part.from_bytes(data=tmp.read_bytes(), mime_type="audio/wav"),
                                            "Transcreva exatamente as palavras faladas em português, escrevendo os números por extenso. Só o texto."])
            return (r.text or "").strip()
        except Exception as e:
            time.sleep(8)
    return ""

def parecido(ouvido, esperado, n=5):
    a, b = norm(ouvido)[:n], norm(esperado)[:n]
    return difflib.SequenceMatcher(None, a, b).ratio()

def silencios(arq):
    out = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(arq), "-af", "silencedetect=n=-40dB:d=0.2", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    ini = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", out)]
    fim = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", out)]
    return list(zip(ini, fim))

for g in GRUPOS:
    arq = AQUI / f"narr_{g[0]}_{g[-1]}.wav"
    with wave.open(str(arq)) as w:
        total = w.getnframes() / w.getframerate()
    sil = silencios(arq)
    pesos = [len(texto[i]) for i in g]
    cortes = [0.0]
    for k in range(1, len(g)):
        est = total * sum(pesos[:k]) / sum(pesos)
        cand = sorted([s for s in sil if abs((s[0] + s[1]) / 2 - est) < 9 and (s[0] + s[1]) / 2 > cortes[-1] + 1],
                      key=lambda s: abs((s[0] + s[1]) / 2 - est))[:7]
        melhor = (0, est)
        for a, b in cand:
            nota = parecido(ouvir(arq, b - 0.05, 3.2), texto[g[k]])
            if nota > melhor[0]:
                melhor = (nota, (a + b) / 2)
            if nota >= 0.8:
                break
            time.sleep(1)
        cortes.append(melhor[1])
        print(f"  fronteira {g[k]}: estimada {est:.1f}s -> {melhor[1]:.1f}s (confiança {melhor[0]:.2f})", flush=True)
    cortes.append(total)
    for i, a, b in zip(g, cortes, cortes[1:]):
        subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(arq), "-ss", f"{a:.3f}", "-to", f"{b:.3f}",
                        str(AQUI / "audio" / f"{i}.wav")], check=True)

# conferência final: transcrição completa de cada trecho
for g in GRUPOS:
    for i in g:
        arq = AQUI / "audio" / f"{i}.wav"
        with wave.open(str(arq)) as w:
            d = w.getnframes() / w.getframerate()
        print(f"{i} ({d:.1f}s): {ouvir(arq, 0, d)}", flush=True)
        time.sleep(1)
