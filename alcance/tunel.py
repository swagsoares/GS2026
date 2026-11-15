"""Abre um túnel público (Cloudflare) para a porta 8000 e grava a URL em data/url_publica.txt.

Rodar e deixar aberto: .venv\\Scripts\\python -m alcance.tunel
"""
import re
import shutil
import subprocess
from pathlib import Path

from alcance.ligacao import URL_PUBLICA

EXE = shutil.which("cloudflared") or r"C:\Program Files (x86)\cloudflared\cloudflared.exe"


def main():
    if not Path(EXE).exists():
        raise SystemExit("cloudflared não encontrado. Instale: winget install Cloudflare.cloudflared")
    proc = subprocess.Popen([EXE, "tunnel", "--url", "http://127.0.0.1:8000", "--no-autoupdate"],
                            stderr=subprocess.PIPE, text=True)
    try:
        for linha in proc.stderr:
            achou = re.search(r"https://[a-z0-9-]+\.trycloudflare\.com", linha)
            if achou and not URL_PUBLICA.exists():
                URL_PUBLICA.write_text(achou.group(0))
                print("Túnel no ar:", achou.group(0), flush=True)
    finally:
        URL_PUBLICA.unlink(missing_ok=True)
        proc.terminate()


if __name__ == "__main__":
    URL_PUBLICA.unlink(missing_ok=True)
    main()
