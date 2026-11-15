// Captura as telas do site (Chrome headless + DevTools Protocol). Uso: node captura.js
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const OUT = path.join(__dirname, 'img');
const SITE = 'http://localhost:5173';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const perfil = path.join(__dirname, 'chrome-perfil');

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const proc = spawn(CHROME, ['--headless=new', '--remote-debugging-port=9333', `--user-data-dir=${perfil}`,
    '--window-size=1920,1080', '--force-device-scale-factor=1', '--hide-scrollbars', 'about:blank']);
  let alvo;
  for (let i = 0; i < 40 && !alvo; i++) {
    await esperar(300);
    try { alvo = (await (await fetch('http://127.0.0.1:9333/json')).json()).find((t) => t.type === 'page'); } catch {}
  }
  const ws = new WebSocket(alvo.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0; const pend = {};
  ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend[m.id]) { pend[m.id](m); delete pend[m.id]; } };
  const cdp = (method, params = {}) => new Promise((r) => { id += 1; pend[id] = r; ws.send(JSON.stringify({ id, method, params })); });
  const js = async (expr) => (await cdp('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })).result?.result?.value;
  const foto = async (nome) => {
    const y = await js('scrollY');
    const r = await cdp('Page.captureScreenshot', { format: 'png', clip: { x: 0, y, width: 1200, height: 675, scale: 1.6 } });
    fs.writeFileSync(path.join(OUT, `${nome}.png`), Buffer.from(r.result.data, 'base64'));
    console.log('foto', nome);
  };
  const ir = async (rota, ms = 3000) => { await cdp('Page.navigate', { url: SITE + rota }); await esperar(ms); };
  const clicar = (texto) => js(`(() => { const b = [...document.querySelectorAll('button')].find((x) => x.innerText.includes(${JSON.stringify(texto)})); b && b.click(); return !!b; })()`);
  const nFalas = () => js(`document.querySelector('[aria-live=polite]')?.children.length ?? 0`);

  await cdp('Page.enable');
  await cdp('Emulation.setDeviceMetricsOverride', { width: 1200, height: 675, deviceScaleFactor: 1.6, mobile: false });
  // tamanho de texto maior para ficar legível no vídeo
  await ir('/demonstracao');
  await foto('still_demo_inicio');

  async function dialogo(nome, total) {
    await clicar('Ver exemplo');
    for (let k = 1; k <= total; k++) {
      for (let t = 0; t < 100 && (await nFalas()) < k; t++) await esperar(60);
      await esperar(650); // fim da animação de entrada
      await foto(`d_${nome}_${k}`);
    }
    await esperar(1500);
    await foto(`still_${nome}_fim`);
  }
  await dialogo('antonio', 7);

  await clicar('Dona Benedita');
  await esperar(800);
  await foto('still_benedita_inicio');
  await dialogo('benedita', 6);

  await ir('/visitas');
  await foto('still_visitas');

  await ir('/governanca', 3500);
  await js(`(() => { const h = [...document.querySelectorAll('h2')].find((x) => x.innerText.includes('Erros que')); h && window.scrollTo(0, h.getBoundingClientRect().top + scrollY - 40); })()`);
  await esperar(800);
  await foto('still_governanca');

  // o painel é capturado por último, depois que o transporte do Seu Antônio é registrado (ver montar.sh)
  if (process.argv[2] === 'painel') {
    await ir('/', 4500);
    await js(`(() => { const h = document.getElementById('fila'); window.scrollTo(0, h.getBoundingClientRect().top + scrollY - 24); })()`);
    await esperar(800);
    await foto('still_painel');
  }
  ws.close(); proc.kill();
}
main().catch((e) => { console.error(e); process.exit(1); });
