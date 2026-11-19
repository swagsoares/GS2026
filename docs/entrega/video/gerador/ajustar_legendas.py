"""Ajuste fino das legendas pelo áudio final: início encaixado no começo real da voz e fim estendido até a
pausa seguinte. Depois queima as legendas no vídeo (a partir do bruto.mp4)."""
import re, subprocess
from pathlib import Path

AQUI = Path(__file__).parent
out = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(AQUI / "bruto.mp4"), "-af", "silencedetect=n=-38dB:d=0.2", "-f", "null", "-"],
                     capture_output=True, text=True).stderr
S = list(zip([float(x) for x in re.findall(r"silence_start: ([\d.]+)", out)], [float(x) for x in re.findall(r"silence_end: ([\d.]+)", out)]))

def silencio_em(t):
    return next(((s, e) for s, e in S if s <= t < e), None)

def proxima_pausa(t):
    return next((s for s, e in S if s >= t), t)

def f(s):
    h, m, r = s.split(":"); return int(h) * 3600 + int(m) * 60 + float(r.replace(",", "."))

L = []
for b in (AQUI / "legendas.srt").read_text(encoding="utf-8").strip().split("\n\n"):
    l = b.split("\n"); a, z = l[1].split(" --> "); L.append([f(a), f(z), "\n".join(l[2:])])

L.sort(key=lambda x: x[0])
for x in L:
    sl = silencio_em(x[0])
    if sl and sl[1] - x[0] > 0.05:      # começou no silêncio: entra quando a voz começa
        x[0] = sl[1] - 0.05
    if not silencio_em(x[1]):           # terminou no meio da fala: vai até a próxima pausa
        x[1] = proxima_pausa(x[1]) + 0.2
import json   # legendas que caíram no mesmo instante viram uma só, na ordem do roteiro
roteiro = json.dumps(json.loads((AQUI / "cenas.json").read_text(encoding="utf-8")), ensure_ascii=False)
M = []
for x in L:
    if M and abs(x[0] - M[-1][0]) < 0.15:
        partes = sorted([M[-1][2], x[2]], key=lambda t: roteiro.find(t))
        M[-1] = [M[-1][0], max(M[-1][1], x[1]), " ".join(partes)]
    else:
        M.append(x)
L = M
for i in range(len(L) - 1):            # sem sobrepor; emenda se a próxima vem logo
    prox = L[i + 1][0]
    if L[i][1] > prox - 0.02 or prox - L[i][1] < 0.5:
        L[i][1] = prox - 0.02
for i, x in enumerate(L):   # mínimo de 1,3 s na tela, sem invadir a próxima
    lim = L[i + 1][0] - 0.02 if i + 1 < len(L) else x[1] + 2
    x[1] = min(max(x[1], x[0] + 1.3), lim)

def ts_srt(x):
    h, r = divmod(max(x, 0), 3600); m, s = divmod(r, 60); return f"{int(h):02d}:{int(m):02d}:{int(s):02d},{int((s % 1) * 1000):03d}"
def ts_ass(x):
    h, r = divmod(max(x, 0), 3600); m, s = divmod(r, 60); return f"{int(h)}:{int(m):02d}:{s:05.2f}"

(AQUI / "legendas.srt").write_text("".join(f"{i}\n{ts_srt(a)} --> {ts_srt(b)}\n{t}\n\n" for i, (a, b, t) in enumerate(L, 1)), encoding="utf-8")
cab = (AQUI / "legendas.ass").read_text(encoding="utf-8").split("[Events]")[0]
(AQUI / "legendas.ass").write_text(cab + "[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n" +
    "".join(f"Dialogue: 0,{ts_ass(a)},{ts_ass(b)},Padrao,,0,0,0,,{t.replace(chr(10), ' ')}\n" for a, b, t in L), encoding="utf-8")
total = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(AQUI / "bruto.mp4")],
                             capture_output=True, text=True).stdout)
sub = (AQUI / "legendas.ass").as_posix().replace(":", "\\:")
subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(AQUI / "bruto.mp4"), "-vf",
                f"fade=t=in:st=0:d=0.8,fade=t=out:st={total - 1.2:.2f}:d=1.2,ass='{sub}'",
                "-af", f"loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000,afade=t=out:st={total - 1.2:.2f}:d=1.2",
                "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-c:a", "aac", "-b:a", "160k", str(AQUI / "Clara_pitch.mp4")], check=True)
print("pronto")
