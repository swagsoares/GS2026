"""Take 1: acha o início exato de cada frase-alvo varrendo os silêncios em ordem, e remove do s05 a fala
que a voz inventou (entre 'Ela liga para o Seu Antônio.' e 'Esta conversa reproduz...')."""
import subprocess, sys, time, wave
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
import importlib.util
spec = importlib.util.spec_from_file_location("a2", Path(__file__).parent / "alinhar2.py")
# reaproveita as funções sem rodar o script
fonte = (Path(__file__).parent / "alinhar2.py").read_text(encoding="utf-8").split("for g in GRUPOS:")[0]
ns = {"__file__": str(Path(__file__).parent / "alinhar2.py")}
exec(fonte.replace("GRUPOS = [ids[0:6], ids[6:12]] if len(sys.argv) < 2 else [ids[12:]]", "GRUPOS = []"), ns)
ouvir, parecido, silencios, AQUI = ns["ouvir"], ns["parecido"], ns["silencios"], ns["AQUI"]

arq = AQUI / "narr_s01_s05.wav"
with wave.open(str(arq)) as w:
    total = w.getnframes() / w.getframerate()
sil = silencios(arq)

def achar(frase, depois_de, n=4, minimo=0.6, primeira=None):
    for a, b in sil:
        if (a + b) / 2 <= depois_de + 0.5:
            continue
        ouvido = ouvir(arq, b - 0.05, 3.0)
        nota = parecido(ouvido, frase, n)
        if primeira and (ns["norm"](ouvido)[:1] != [primeira]):
            nota = 0
        if nota >= minimo:
            print(f"  '{frase[:30]}' em {(a + b) / 2:.1f}s ({nota:.2f}) <- {ouvido[:50]!r}", flush=True)
            return (a + b) / 2
        time.sleep(0.5)
    raise SystemExit(f"não achei: {frase}")

c_s02 = 23.3  # conferido
c_s03 = achar("Por isso criamos a Clara", c_s02 + 30)
c_s03b = achar("A Clara é uma persona", c_s03 + 5)
c_s04 = achar("Por três caminhos", c_s03b + 6)
c_s05 = achar("Veja a Clara trabalhando", c_s04 + 12, primeira="veja")
c_inv = achar("Oi seu Antônio", c_s05 + 1, 3)
c_volta = achar("Esta conversa reproduz uma ligação real", c_inv + 2)

def cortar(nome, a, b, extra=None):
    out = AQUI / "audio" / f"{nome}.wav"
    if extra:  # junta dois pedaços (pula o trecho inventado)
        p1, p2 = AQUI / "tmp_alinhar" / "p1.wav", AQUI / "tmp_alinhar" / "p2.wav"
        subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(arq), "-ss", f"{a:.3f}", "-to", f"{b:.3f}", str(p1)], check=True)
        subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(arq), "-ss", f"{extra[0]:.3f}", "-to", f"{extra[1]:.3f}", str(p2)], check=True)
        subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(p1), "-i", str(p2), "-filter_complex",
                        "[0:a]apad=pad_dur=0.25[x];[x][1:a]concat=n=2:v=0:a=1", str(out)], check=True)
    else:
        subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(arq), "-ss", f"{a:.3f}", "-to", f"{b:.3f}", str(out)], check=True)

cortar("s01", 0, c_s02)
cortar("s02", c_s02, c_s03)
cortar("s03", c_s03, c_s03b)
cortar("s03b", c_s03b, c_s04)
cortar("s04", c_s04, c_s05)
cortar("s05", c_s05, c_inv, extra=(c_volta, total))
for i in ["s02", "s03", "s03b", "s04", "s05"]:
    a = AQUI / "audio" / f"{i}.wav"
    with wave.open(str(a)) as w:
        d = w.getnframes() / w.getframerate()
    print(f"{i} ({d:.1f}s): {ouvir(a, 0, d)}", flush=True)
