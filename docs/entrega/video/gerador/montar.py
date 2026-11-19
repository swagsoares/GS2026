"""Monta o vídeo do pitch: cenas de cinema (Google Flow) + slides + telas do site + vozes + legendas.
Cada segmento tem uma lista de visuais; o último ocupa o tempo que sobrar da narração."""
import json, re, subprocess, wave
from pathlib import Path

AQUI = Path(__file__).parent
IMG, AUD, CINE, TMP = AQUI / "img", AQUI / "audio_final", AQUI / "flow", AQUI / "clipes"
TELAS = AQUI / "telas"
TMP.mkdir(exist_ok=True)
cfg = json.loads((AQUI / "cenas.json").read_text(encoding="utf-8"))
FPS, ANTES, DEPOIS, ENTRE_FALAS = 30, 0.35, 0.55, 0.45
NOMES = {"ia": "Clara", "antonio": "Seu Antônio", "benedita": "Dona Benedita"}
FONTE = "C\\:/Windows/Fonts/arial.ttf"
AVISO = (f"drawtext=fontfile='{FONTE}':text='Cena ilustrativa gerada com IA · personagens fictícios':"
         "x=40:y=36:fontsize=26:fontcolor=white@0.85:box=1:boxcolor=black@0.45:boxborderw=10")

NUMEROS = [
    ("trinta e oito vírgula seis por cento", "38,6%"), ("dezoito vírgula seis milhões", "18,6 milhões"),
    ("sete vírgula nove milhões", "7,9 milhões"), ("dois vírgula nove por cento", "2,9%"),
    ("Vinte e nove por cento", "29%"), ("sessenta e nove por cento", "69%"), ("Vinte e oito milhões", "28 milhões"),
    ("duzentos e oitenta e cinco mil", "285 mil"), ("cento e dez mil", "110 mil"), ("dezesseis de dezesseis", "16 de 16"),
    ("dezessete de dezessete", "17 de 17"), ("cento e noventa e dois", "192"), ("cento e doze", "112"),
    ("trezentos e seis", "306"), ("nove e meio por cento", "9,5%"), ("vinte e um por cento", "21%"), ("cem mil", "100 mil"),
    ("quatro mil e quinhentas", "4.500"), ("trinta e dois reais", "R$ 32"), ("doze centavos", "R$ 0,12"),
    ("três reais para cada real", "R$ 3 para cada R$ 1"), ("a Lú, do Magalú, e a Bia, do Bradesco", "a Lu, do Magalu, e a BIA, do Bradesco"), ("a personagem Lu, do Magalu, e a Bia, do Bradesco", "a personagem Lu, do Magalu, e a BIA, do Bradesco"), ("sessenta e oito", "68"), ("trinta dias", "30 dias"),
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
        raise SystemExit(r.stderr[-1500:])

def parte(visual, d, saida, ini=0.0):
    """Vídeo mudo de d segundos: cine:N, tela:nome (gravação da interface), slide:nome, still:nome ou dlg:arquivo."""
    tipo, alvo = visual.split(":")
    if tipo == "tela":
        quadros = len(list((TELAS / alvo).glob("*.jpg")))
        if quadros <= 3:  # tela parada: vira imagem com aproximação lenta (o screencast só manda quadro quando muda)
            png = TMP / f"tela_{alvo}.png"
            run("-i", TELAS / f"{alvo}.mp4", "-frames:v", "1", png)
            n = max(int(d * FPS), 1)
            z = "1" if alvo.startswith(("antonio_", "benedita_")) else f"1+0.035*on/{n}"  # no diálogo a câmera fica parada
            run("-loop", "1", "-framerate", FPS, "-i", png, "-vf",
                f"scale=3840:2160:flags=lanczos,zoompan=z='{z}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={n}:s=1920x1080:fps={FPS},format=yuv420p",
                "-t", f"{d:.3f}", "-c:v", "libx264", "-preset", "medium", "-crf", "18", saida)
            return
        run("-i", TELAS / f"{alvo}.mp4", "-vf", f"fps={FPS},tpad=stop_mode=clone:stop_duration=30,format=yuv420p",
            "-an", "-t", f"{d:.3f}", "-c:v", "libx264", "-preset", "medium", "-crf", "18", saida)
        return
    if tipo in ("cine", "clara"):  # cenas do Flow: realistas (cine) e a Clara animada (clara)
        run("-ss", f"{ini:.2f}", "-i", CINE / f"{tipo}{alvo}.mp4", "-t", f"{d:.3f}", "-vf",
            f"scale=1920:1080:flags=lanczos,fps={FPS},tpad=stop_mode=clone:stop_duration=10,{AVISO},format=yuv420p",
            "-an", "-t", f"{d:.3f}", "-c:v", "libx264", "-preset", "medium", "-crf", "18", saida)
        return
    img = IMG / (f"slide_{alvo}.png" if tipo == "slide" else f"still_{alvo}.png" if tipo == "still" else f"{alvo}.png")
    if tipo == "dlg":
        filtro = f"scale=1920:1080:flags=lanczos,fps={FPS},format=yuv420p"
    else:  # aproximação lenta para a tela não ficar parada
        n = max(int(d * FPS), 1)
        filtro = (f"scale=3840:2160:flags=lanczos,zoompan=z='1+0.04*on/{n}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'"
                  f":d={n}:s=1920x1080:fps={FPS},format=yuv420p")
    run("-loop", "1", "-framerate", FPS, "-i", img, "-vf", filtro, "-t", f"{d:.3f}", "-c:v", "libx264", "-preset", "medium", "-crf", "18", saida)

def clipe(nome, visuais, audio, total, inicio, som_do_clipe=None, ini=0.0):
    """visuais: [(visual, duração ou None)]; o None ocupa o resto."""
    fixos = sum(d for _, d in visuais if d)
    partes = []
    for k, (v, d) in enumerate(visuais):
        d = d if d else max(total - fixos, 0.5)
        p = TMP / f"{nome}_p{k}.mp4"
        parte(v, d, p, ini if k == 0 else 0.0)
        partes.append(p)
    lista = TMP / f"{nome}_lista.txt"
    lista.write_text("".join(f"file '{p.as_posix()}'\n" for p in partes), encoding="utf-8")
    video = TMP / f"{nome}_v.mp4"
    run("-f", "concat", "-safe", "0", "-i", lista, "-c", "copy", video)
    if som_do_clipe:   # abertura: o som ambiente da própria cena (celular vibrando)
        entrada = ["-i", som_do_clipe]
        filtro_a = "[1:a]aresample=48000,volume=0.9,apad[a]"
    elif audio:
        entrada = ["-i", audio]
        filtro_a = f"[1:a]aresample=48000,afade=t=in:d=0.04,areverse,afade=t=in:d=0.12,areverse,adelay={int(inicio * 1000)}:all=1,apad[a]"
    else:
        entrada = ["-f", "lavfi", "-i", "anullsrc=r=48000:cl=mono"]
        filtro_a = "[1:a]apad[a]"
    run("-i", video, *entrada, "-filter_complex", filtro_a, "-map", "0:v", "-map", "[a]", "-t", f"{total:.3f}",
        "-c:v", "copy", "-c:a", "aac", "-b:a", "160k", "-ac", "1", TMP / f"{nome}.mp4")

clipes, srt, t = [], [], 0.0

def falas_do_audio(arq):
    """Intervalos em que há voz (desconta pausas >= 0,25 s)."""
    out = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(arq), "-af", "silencedetect=n=-38dB:d=0.25", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    ini = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", out)]
    fim = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", out)]
    total = dur(arq)
    trechos, cur = [], 0.0
    for a, b in zip(ini, fim):
        if a > cur:
            trechos.append((cur, a))
        cur = b
    if cur < total:
        trechos.append((cur, total))
    return trechos or [(0.0, total)]

def fala_para_relogio(trechos, alvo):
    acum = 0.0
    for a, b in trechos:
        if acum + (b - a) >= alvo:
            return a + (alvo - acum)
        acum += b - a
    return trechos[-1][1]

def add_legenda(texto, ini, fim, quem=None, audio=None):
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
    if audio:
        trechos = falas_do_audio(audio)
        fala = sum(b - a for a, b in trechos)
        acum = 0
        for p in partes:
            a = fala_para_relogio(trechos, fala * acum / total)
            acum += len(p)
            b = fala_para_relogio(trechos, fala * acum / total)
            srt.append((ini + a, ini + b + 0.15, f"{quem}: {p}" if quem else p))
        return
    cur = ini
    for p in partes:
        d = (fim - ini) * len(p) / total
        srt.append((cur, cur + d, f"{quem}: {p}" if quem else p))
        cur += d

def visuais_de(s):
    if "visuais" in s:
        return [(v["v"], v.get("d")) for v in s["visuais"]]
    return [(s["visual"], None)]

for s in cfg["segmentos"]:
    if s["visual"].startswith("dialogo:"):
        alvo = s["visual"].split(":")[1]
        for k, (quem, texto) in enumerate(cfg["dialogos"][alvo]):
            v = f"tela:{alvo}_{k + 1}" if cfg.get("telas_dialogo") else f"dlg:d_{alvo}_{k + 1}"
            if quem:
                a = AUD / f"d_{alvo}_{k}.wav"; d = dur(a)
                total = 0.25 + d + ENTRE_FALAS
                clipe(f"{s['id']}_{k}", [(v, None)], a, total, 0.25)
                add_legenda(texto, t + 0.25, t + 0.25 + d, NOMES[quem], audio=a)
            else:
                total = 2.2
                clipe(f"{s['id']}_{k}", [(v, None)], None, total, 0)
            clipes.append(TMP / f"{s['id']}_{k}.mp4"); t += total
        continue
    vis = visuais_de(s)
    if s.get("texto"):
        a = AUD / f"{s['id']}.wav"; d = dur(a)
        antes, depois = s.get("antes", ANTES), s.get("depois", DEPOIS)
        total = max(antes + d + depois + s.get("cauda", 0), sum(x for _, x in vis if x) + 0.5)
        clipe(s["id"], vis, a, total, antes)
        add_legenda(s["texto"], t + antes, t + antes + d, audio=a)
    else:
        total = s.get("silencio", 2)
        som = CINE / f"cine{vis[0][0].split(':')[1]}.mp4" if s.get("som_do_clipe") else None
        clipe(s["id"], vis, None, total, 0, som, s.get("corte_inicio", 0.0))
    clipes.append(TMP / f"{s['id']}.mp4"); t += total
    print(f"{s['id']} ok, {t:.1f}s", flush=True)

lista = TMP / "lista.txt"
lista.write_text("".join(f"file '{c.as_posix()}'\n" for c in clipes), encoding="utf-8")
run("-f", "concat", "-safe", "0", "-i", lista, "-c", "copy", AQUI / "bruto.mp4")

def ts(x):
    h, r = divmod(x, 3600); m, sec = divmod(r, 60)
    return f"{int(h):02d}:{int(m):02d}:{int(sec):02d},{int((sec % 1) * 1000):03d}"
(AQUI / "legendas.srt").write_text("".join(f"{i}\n{ts(a)} --> {ts(b)}\n{txt}\n\n" for i, (a, b, txt) in enumerate(srt, 1)), encoding="utf-8")

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
    "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-c:a", "aac", "-b:a", "160k", AQUI / "Clara_pitch.mp4")
print(f"pronto: {t:.1f}s ({int(t // 60)}min{int(t % 60):02d}s), {len(srt)} legendas")
