"""Recorta os diálogos inteiros em falas escolhendo, entre as pausas, as que deixam cada trecho
com a duração mais próxima da esperada pelo tamanho do texto (programação dinâmica)."""
import json, math, re, subprocess, wave
from functools import lru_cache
from pathlib import Path

AQUI = Path(__file__).parent
cfg = json.loads((AQUI / "cenas.json").read_text(encoding="utf-8"))

def pausas(arq):
    out = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(arq), "-af", "silencedetect=n=-40dB:d=0.18", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    ini = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", out)]
    fim = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", out)]
    with wave.open(str(arq)) as w:
        total = w.getnframes() / w.getframerate()
    return [((a + b) / 2, b - a) for a, b in zip(ini, fim) if 0.3 < a and b < total - 0.3], total

for nome, falas in cfg["dialogos"].items():
    linhas = [(i, t) for i, (q, t) in enumerate(falas) if q]
    arq = AQUI / f"dialogo_{nome}.wav"
    cand, total = pausas(arq)
    pesos = [len(t) for _, t in linhas]
    esperado = [total * p / sum(pesos) for p in pesos]
    pontos = [0.0] + [c for c, _ in cand] + [total]
    n = len(linhas)

    @lru_cache(None)
    def melhor(k, j):
        """k falas já fechadas terminando no ponto j: menor custo e caminho."""
        if k == 0:
            return (0.0, (0,)) if j == 0 else (math.inf, ())
        res = (math.inf, ())
        for i in range(j):
            c, cam = melhor(k - 1, i)
            if c == math.inf:
                continue
            d = pontos[j] - pontos[i]
            custo = c + math.log(max(d, 0.2) / esperado[k - 1]) ** 2
            if custo < res[0]:
                res = (custo, cam + (j,))
        return res

    custo, cam = melhor(n, len(pontos) - 1)
    cortes = [pontos[j] for j in cam]
    for (i, _), a, b in zip(linhas, cortes, cortes[1:]):
        subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(arq), "-ss", f"{a:.3f}", "-to", f"{b:.3f}",
                        str(AQUI / "audio" / f"d_{nome}_{i}.wav")], check=True)
    print(nome, "durações:", [round(b - a, 1) for a, b in zip(cortes, cortes[1:])], "esperado:", [round(e, 1) for e in esperado])
