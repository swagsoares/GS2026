"""Legendas no tempo exato da fala: o Whisper (local) marca o tempo de cada palavra do áudio final, e cada
legenda do roteiro é casada com essas palavras (difflib). A legenda entra quando a frase começa e só sai
quando ela termina. Depois queima as legendas no vídeo. Uso: python legendas_whisper.py"""
import difflib, re, subprocess, sys, unicodedata
from pathlib import Path

AQUI = Path(__file__).parent
sys.path.insert(0, str(AQUI.parent / "pywhisper"))
from faster_whisper import WhisperModel

def norm(t):
    t = unicodedata.normalize("NFKD", t.lower())
    t = "".join(c for c in t if not unicodedata.combining(c))
    t = t.replace("r$", " reais ").replace("%", " por cento ")
    return re.findall(r"[a-z]+|\d+", t)

def ts_srt(x):
    h, r = divmod(max(x, 0), 3600); m, s = divmod(r, 60)
    return f"{int(h):02d}:{int(m):02d}:{int(s):02d},{int((s % 1) * 1000):03d}"

def ts_ass(x):
    h, r = divmod(max(x, 0), 3600); m, s = divmod(r, 60)
    return f"{int(h)}:{int(m):02d}:{s:05.2f}"

def ler_srt(p):
    out = []
    for b in p.read_text(encoding="utf-8").strip().split("\n\n"):
        l = b.split("\n")
        a, z = l[1].split(" --> ")
        f = lambda s: (lambda h, m, r: int(h) * 3600 + int(m) * 60 + float(r.replace(",", ".")))(*s.split(":"))
        out.append([f(a), f(z), "\n".join(l[2:])])
    return out

audio = AQUI / "tmp_alinhar" / "final.wav"
subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(AQUI / "bruto.mp4"), "-ac", "1", "-ar", "16000", str(audio)], check=True)
modelo = WhisperModel("small", device="cpu", compute_type="int8")
segs, _ = modelo.transcribe(str(audio), language="pt", word_timestamps=True, beam_size=5, condition_on_previous_text=False)
palavras = []
for sg in segs:
    for w in sg.words:
        for tok in norm(w.word):
            palavras.append((tok, w.start, w.end))
print("palavras reconhecidas:", len(palavras), flush=True)

legs = ler_srt(AQUI / "legendas.srt")
# tokens do roteiro, guardando a qual legenda cada token pertence
tok_rot, dono = [], []
for i, (_, _, txt) in enumerate(legs):
    txt = re.sub(r"^[^:]{2,20}:\s", "", txt)  # tira "Clara: " dos diálogos
    for t in norm(txt):
        tok_rot.append(t); dono.append(i)
sm = difflib.SequenceMatcher(None, tok_rot, [p[0] for p in palavras], autojunk=False)
tempo_tok = [None] * len(tok_rot)
for a, b, n in sm.get_matching_blocks():
    for k in range(n):
        tempo_tok[a + k] = (palavras[b + k][1], palavras[b + k][2])
novos, sem = [], 0
for i, (ini, fim, txt) in enumerate(legs):
    ts = [tempo_tok[k] for k in range(len(tok_rot)) if dono[k] == i and tempo_tok[k]]
    if ts:
        novos.append([ts[0][0] - 0.05, ts[-1][1] + 0.25, txt])
    else:
        sem += 1
        novos.append([ini, fim, txt])  # sem correspondência: mantém o tempo antigo
# sem sobreposição; se a próxima vem logo depois, emenda para não piscar
for i in range(len(novos) - 1):
    prox = novos[i + 1][0]
    if novos[i][1] > prox - 0.02 or prox - novos[i][1] < 0.6:
        novos[i][1] = max(prox - 0.02, novos[i][0] + 0.8)
for n in novos:
    n[1] = max(n[1], n[0] + 1.0)
print("legendas:", len(novos), "| sem correspondência:", sem, flush=True)

(AQUI / "legendas.srt").write_text("".join(f"{i}\n{ts_srt(a)} --> {ts_srt(b)}\n{t}\n\n" for i, (a, b, t) in enumerate(novos, 1)), encoding="utf-8")
cab = (AQUI / "legendas.ass").read_text(encoding="utf-8").split("[Events]")[0]
eventos = "[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n" + "".join(
    f"Dialogue: 0,{ts_ass(a)},{ts_ass(b)},Padrao,,0,0,0,,{t.replace(chr(10), ' ')}\n" for a, b, t in novos)
(AQUI / "legendas.ass").write_text(cab + eventos, encoding="utf-8")

total = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(AQUI / "bruto.mp4")],
                             capture_output=True, text=True).stdout)
sub = (AQUI / "legendas.ass").as_posix().replace(":", "\\:")
subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(AQUI / "bruto.mp4"), "-vf",
                f"fade=t=in:st=0:d=0.8,fade=t=out:st={total - 1.2:.2f}:d=1.2,ass='{sub}'",
                "-af", f"loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000,afade=t=out:st={total - 1.2:.2f}:d=1.2",
                "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-c:a", "aac", "-b:a", "160k", str(AQUI / "Clara_pitch.mp4")], check=True)
print("pronto", round(total, 1), "s")
