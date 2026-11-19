"""Escolhe a melhor versão de cada fala e acelera as arrastadas (atempo preserva o tom)."""
import json, subprocess, wave
from pathlib import Path
A = Path(__file__).parent
NOVO, V1, FIM = A / "audio", A / "audio_v1", A / "audio_final"
FIM.mkdir(exist_ok=True)
cfg = json.loads((A / "cenas.json").read_text(encoding="utf-8"))
txt = {s["id"]: ("narrador", s["texto"]) for s in cfg["segmentos"] if s.get("texto")}
for n, fs in cfg["dialogos"].items():
    for i, (q, t) in enumerate(fs):
        if q: txt[f"d_{n}_{i}"] = (q, t)
ALVO = {"narrador": 2.35, "ia": 2.3, "antonio": 2.0, "benedita": 1.9}
tot = 0

def limpar_pontas(arq):
    """Remove estalos/respiração soltos no começo e no fim (fragmentos < 0,3 s separados por silêncio)."""
    import re as _re
    out = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(arq), "-af", "silencedetect=n=-42dB:d=0.08", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    ini = [float(x) for x in _re.findall(r"silence_start: ([\d.]+)", out)]
    fim = [float(x) for x in _re.findall(r"silence_end: ([\d.]+)", out)]
    with wave.open(str(arq)) as w: total = w.getnframes() / w.getframerate()
    falas, cur = [], 0.0
    for a_, b_ in zip(ini, fim):
        if a_ > cur: falas.append([cur, a_])
        cur = b_
    if cur < total: falas.append([cur, total])
    while len(falas) > 1 and falas[-1][1] - falas[-1][0] < 0.3: falas.pop()
    while len(falas) > 1 and falas[0][1] - falas[0][0] < 0.3: falas.pop(0)
    if not falas: return
    a_, b_ = max(falas[0][0] - 0.05, 0), min(falas[-1][1] + 0.12, total)
    if a_ > 0.01 or b_ < total - 0.01:
        tmp = arq.with_suffix(".tmp.wav")
        subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(arq), "-ss", f"{a_:.3f}", "-to", f"{b_:.3f}", str(tmp)], check=True)
        tmp.replace(arq)
for k, (quem, t) in txt.items():
    src = NOVO / f"{k}.wav" if (NOVO / f"{k}.wav").exists() else V1 / f"{k}.wav"
    with wave.open(str(src)) as w: d = w.getnframes() / w.getframerate()
    ps = len(t.split()) / d
    f = min(max(ALVO[quem] / ps, 1.0), 1.55)
    filtro = "silenceremove=start_periods=1:start_threshold=-45dB:stop_periods=-1:stop_duration=0.45:stop_threshold=-45dB"
    if f > 1.02: filtro += f",atempo={f:.3f}"
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(src), "-af", filtro, "-ar", "24000", "-ac", "1", str(FIM / f"{k}.wav")], check=True)
    limpar_pontas(FIM / f"{k}.wav")
    with wave.open(str(FIM / f"{k}.wav")) as w: d2 = w.getnframes() / w.getframerate()
    tot += d2
    print(f"{k:14s} {src.parent.name:9s} {ps:4.2f}p/s x{f:.2f} -> {d2:5.1f}s")
print("total de fala:", round(tot), "s")
