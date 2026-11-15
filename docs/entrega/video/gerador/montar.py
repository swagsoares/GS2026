"""Monta o vídeo do pitch: imagens + vozes + legendas. Uso: python montar.py"""
import json, re, subprocess, wave
from pathlib import Path

AQUI = Path(__file__).parent
IMG, AUD, TMP = AQUI / "img", AQUI / "audio_final", AQUI / "clipes"
TMP.mkdir(exist_ok=True)
cfg = json.loads((AQUI / "cenas.json").read_text(encoding="utf-8"))
FPS, ANTES, DEPOIS, ENTRE_FALAS = 30, 0.35, 0.55, 0.45
NOMES = {"ia": "ALCANCE", "antonio": "Seu Antônio", "benedita": "Dona Benedita"}

# legenda com números, como se lê na tela (a voz fala por extenso)
NUMEROS = [
    ("trinta e oito vírgula seis por cento", "38,6%"), ("dezoito vírgula seis milhões", "18,6 milhões"),
    ("sete vírgula nove milhões", "7,9 milhões"), ("dois vírgula nove por cento", "2,9%"),
    ("Vinte e nove por cento", "29%"), ("sessenta e nove por cento", "69%"), ("Vinte e oito milhões", "28 milhões"),
    ("duzentos e oitenta e cinco mil", "285 mil"), ("cento e dez mil", "110 mil"), ("dezesseis de dezesseis", "16 de 16"),
    ("cento e noventa e dois", "192"), ("cento e doze", "112"), ("trezentos e seis", "306"),
    ("nove e meio por cento", "9,5%"), ("vinte e um por cento", "21%"), ("cem mil", "100 mil"),
    ("quatro mil e quinhentas", "4.500"), ("trinta e dois reais", "R$ 32"), ("doze centavos", "R$ 0,12"),
    ("três reais para cada real", "R$ 3 para cada R$ 1"), ("sessenta e oito", "68"), ("trinta dias", "30 dias"),
]

def legenda(t):
    for a, b in NUMEROS:
        t = t.replace(a, b)
    return t

def dur(arq):
    with wave.open(str(arq)) as w:
        return w.getnframes() / w.getframerate()

def run(*args):
    r = subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", *map(str, args)], capture_output=True, text=True)
    if r.returncode:
        raise SystemExit(r.stderr)

def clipe(nome, imagem, audio, total, inicio, zoom):
    if "final" in __import__("sys").argv and (TMP / f"{nome}.mp4").exists():
        return
    """Gera um MP4 de 'total' segundos com a imagem e o áudio começando em 'inicio'."""
    escala = "scale=1920:1080:flags=lanczos"
    if zoom:  # aproximação lenta (Ken Burns) para a tela não ficar parada
        n = int(total * FPS)
        filtro = (f"scale=3840:2160:flags=lanczos,zoompan=z='1+0.04*on/{n}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'"
                  f":d={n}:s=1920x1080:fps={FPS}")
    else:
        filtro = f"{escala},fps={FPS}"
    entrada_audio = (["-i", audio] if audio else ["-f", "lavfi", "-i", "anullsrc=r=48000:cl=mono"])
    atraso = int(inicio * 1000)
    run("-loop", "1", "-framerate", FPS, "-i", imagem, *entrada_audio,
        "-filter_complex", f"[0:v]{filtro},format=yuv420p[v];[1:a]aresample=48000,adelay={atraso}:all=1,apad[a]",
        "-map", "[v]", "-map", "[a]", "-t", f"{total:.3f}", "-c:v", "libx264", "-preset", "medium", "-crf", "18",
        "-c:a", "aac", "-b:a", "160k", "-ac", "1", TMP / f"{nome}.mp4")

clipes, srt, t = [], [], 0.0

def add_legenda(texto, ini, fim, quem=None):
    """Quebra em frases de até ~90 caracteres e distribui o tempo pelo tamanho."""
    texto = legenda(texto)
    partes = []
    for frase in re.split(r"(?<=[.?!:])\s+", texto):
        while len(frase) > 90:
            corte = frase.rfind(",", 0, 90)
            corte = corte if corte > 30 else frase.rfind(" ", 0, 90)
            partes.append(frase[:corte + 1].strip()); frase = frase[corte + 1:].strip()
        if frase:
            partes.append(frase)
    total = sum(len(p) for p in partes)
    cur = ini
    for p in partes:
        d = (fim - ini) * len(p) / total
        srt.append((cur, cur + d, f"{quem}: {p}" if quem else p))
        cur += d

import sys
SO_FINAL = "final" in sys.argv
for s in cfg["segmentos"]:
    tipo, alvo = s["visual"].split(":")
    if tipo == "dialogo":
        for k, (quem, texto) in enumerate(cfg["dialogos"][alvo]):
            img = IMG / f"d_{alvo}_{k + 1}.png"
            if quem:
                a = AUD / f"d_{alvo}_{k}.wav"; d = dur(a)
                total = 0.25 + d + ENTRE_FALAS
                clipe(f"{s['id']}_{k}", img, a, total, 0.25, False)
                add_legenda(texto, t + 0.25, t + 0.25 + d, NOMES[quem])
            else:
                total = 2.2
                clipe(f"{s['id']}_{k}", img, None, total, 0, False)
            clipes.append(TMP / f"{s['id']}_{k}.mp4"); t += total
        continue
    img = IMG / (f"slide_{alvo}.png" if tipo == "slide" else f"still_{alvo}.png")
    if s.get("texto"):
        a = AUD / f"{s['id']}.wav"; d = dur(a)
        total = ANTES + d + DEPOIS + s.get("cauda", 0)
        clipe(s["id"], img, a, total, ANTES, True)
        add_legenda(s["texto"], t + ANTES, t + ANTES + d)
    else:
        total = s.get("silencio", 2)
        clipe(s["id"], img, None, total, 0, True)
    clipes.append(TMP / f"{s['id']}.mp4"); t += total
    print(f"{s['id']} ok, {t:.1f}s", flush=True)

lista = TMP / "lista.txt"
lista.write_text("".join(f"file '{c.as_posix()}'\n" for c in clipes), encoding="utf-8")
if not SO_FINAL:
    run("-f", "concat", "-safe", "0", "-i", lista, "-c", "copy", AQUI / "bruto.mp4")

def ts(x):
    h, r = divmod(x, 3600); m, sec = divmod(r, 60)
    return f"{int(h):02d}:{int(m):02d}:{int(sec):02d},{int((sec % 1) * 1000):03d}"
(AQUI / "legendas.srt").write_text("".join(f"{i}\n{ts(a)} --> {ts(b)}\n{txt}\n\n" for i, (a, b, txt) in enumerate(srt, 1)), encoding="utf-8")

# legendas em ASS com resolução 1920x1080 declarada (tamanho e margens em pixels de verdade)
def ass_ts(x):
    h, r = divmod(x, 3600); m, sec = divmod(r, 60)
    return f"{int(h)}:{int(m):02d}:{sec:05.2f}"
cab = """[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Padrao,Arial,46,&H00FFFFFF,&H00FFFFFF,&H28101828,&H28101828,0,0,0,0,100,100,0,0,3,14,0,2,240,240,56,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
linhas = "".join(f"Dialogue: 0,{ass_ts(a)},{ass_ts(b)},Padrao,,0,0,0,,{txt}\n" for a, b, txt in srt)
(AQUI / "legendas.ass").write_text(cab + linhas, encoding="utf-8")
sub = (AQUI / "legendas.ass").as_posix().replace(":", "\\:")
run("-i", AQUI / "bruto.mp4", "-vf", f"fade=t=in:st=0:d=0.8,fade=t=out:st={t - 1.2:.2f}:d=1.2,ass='{sub}'",
    "-af", f"loudnorm=I=-16:TP=-1.5:LRA=11,afade=t=out:st={t - 1.2:.2f}:d=1.2",
    "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-c:a", "aac", "-b:a", "160k", AQUI / "ALCANCE_pitch.mp4")
print(f"pronto: {t:.1f}s ({int(t // 60)}min{int(t % 60):02d}s), {len(srt)} legendas")
