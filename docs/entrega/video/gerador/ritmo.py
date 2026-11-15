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
for k, (quem, t) in txt.items():
    src = NOVO / f"{k}.wav" if (NOVO / f"{k}.wav").exists() else V1 / f"{k}.wav"
    with wave.open(str(src)) as w: d = w.getnframes() / w.getframerate()
    ps = len(t.split()) / d
    f = min(max(ALVO[quem] / ps, 1.0), 1.55)
    filtro = "silenceremove=start_periods=1:start_threshold=-45dB:stop_periods=-1:stop_duration=0.45:stop_threshold=-45dB"
    if f > 1.02: filtro += f",atempo={f:.3f}"
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(src), "-af", filtro, "-ar", "24000", "-ac", "1", str(FIM / f"{k}.wav")], check=True)
    with wave.open(str(FIM / f"{k}.wav")) as w: d2 = w.getnframes() / w.getframerate()
    tot += d2
    print(f"{k:14s} {src.parent.name:9s} {ps:4.2f}p/s x{f:.2f} -> {d2:5.1f}s")
print("total de fala:", round(tot), "s")
