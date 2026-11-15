"""Renderiza cada slide do deck em PNG 1920x1080 com o Chrome headless."""
import json, re, subprocess
from pathlib import Path

AQUI = Path(__file__).parent
DECK = AQUI.parent / "deck" / "project"
OUT = AQUI / "img"; OUT.mkdir(exist_ok=True)
HTML = AQUI / "slides_html"; HTML.mkdir(exist_ok=True)
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

ICONES = {
    "Chat": '<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-4-.9L3 20l1.1-4.2A8.4 8.4 0 1 1 21 11.5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
    "Home": '<path d="M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
}

def icone(m):
    nome, estilo = m.group(1), m.group(2)
    return f'<svg viewBox="0 0 24 24" style="{estilo}">{ICONES[nome]}</svg>'

def seta(m):
    estilo = m.group(1)
    w = int(re.search(r"width:\s*(\d+)px", estilo).group(1))
    cor = re.search(r"color:\s*(#[0-9A-Fa-f]+)", estilo).group(1)
    return (f'<svg width="{w}" height="20" viewBox="0 0 {w} 20" style="flex-shrink:0">'
            f'<line x1="0" y1="10" x2="{w-10}" y2="10" stroke="{cor}" stroke-width="3"/>'
            f'<polygon points="{w-12},3 {w},10 {w-12},17" fill="{cor}"/></svg>')

deck = json.loads((DECK / "deck.json").read_text(encoding="utf-8"))
css = (DECK / "deck.css").read_text(encoding="utf-8")
for n, nome in enumerate(deck["order"], 1):
    corpo = (DECK / "slides" / f"{nome}.html").read_text(encoding="utf-8")
    corpo = re.sub(r'<x-icon name="(\w+)" style="([^"]*)"></x-icon>', icone, corpo)
    corpo = re.sub(r'<x-connector[^>]*style="([^"]*)"></x-connector>', seta, corpo)
    corpo = re.sub(r"<aside>.*?</aside>", "", corpo, flags=re.S)
    pagina = f"""<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible+Next:wght@400;700;800&display=swap" rel="stylesheet">
<style>*{{margin:0}} html,body{{width:1920px;height:1080px;overflow:hidden}} body{{counter-reset:page {n-1}}}
section{{position:relative;width:1920px;height:1080px}} .entra{{animation:none!important}} {css}</style></head>
<body>{corpo}</body></html>"""
    arq = HTML / f"{nome}.html"
    arq.write_text(pagina, encoding="utf-8")
    subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1",
                    "--window-size=1920,1080", "--virtual-time-budget=4000", f"--screenshot={OUT / ('slide_' + nome + '.png')}",
                    arq.as_uri()], capture_output=True, timeout=60)
    print("ok", nome, (OUT / f"slide_{nome}.png").exists())
