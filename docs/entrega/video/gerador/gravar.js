// Grava a interface EM MOVIMENTO (Chrome headless + screencast do DevTools) e gera MP4 1920x1080.
// Uso: node gravar.js [nome-do-take ...]   (sem argumentos grava todos)
const { spawn, execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const OUT = path.join(__dirname, 'telas');
const SITE = 'http://localhost:5173';
const API = 'http://localhost:8000';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
fs.mkdirSync(OUT, { recursive: true });

// rolagem suave dentro da página (px por segundo)
const rolar = (px, segundos) => `(() => new Promise((ok) => { const ini = scrollY, t0 = performance.now(), d = ${segundos * 1000};
  const passo = (t) => { const k = Math.min((t - t0) / d, 1), e = k < .5 ? 2*k*k : 1 - Math.pow(-2*k + 2, 2) / 2;
  scrollTo(0, ini + ${px} * e); k < 1 ? requestAnimationFrame(passo) : ok(); }; requestAnimationFrame(passo); }))()`;

const TAKES = {
  inicio: { rota: '/', seg: 16, durante: async (js) => { await esperar(6000); await js(rolar(1500, 8)); } },
  demo_inicio: { rota: '/demonstracao', seg: 8 },
  painel_ao_vivo: {
    rota: '/painel', seg: 13,
    antes: async (js) => { await fetch(`${API}/api/demo/reiniciar/1`, { method: 'POST' }); await esperar(4500);
      await js(`scrollTo(0, document.getElementById('atividade').getBoundingClientRect().top + scrollY - 24)`); },
    durante: async () => { await esperar(2000); await fetch(`${API}/api/demo/simular-ligacao/1`, { method: 'POST' }); },
    depois: async () => { await fetch(`${API}/api/demo/reiniciar/1`, { method: 'POST' }); },
  },
  painel_topo: { rota: '/painel', seg: 7 },
  painel_apoio: {
    rota: '/painel', seg: 13,
    antes: async (js) => { await fetch(`${API}/api/demo/reiniciar/1`, { method: 'POST' }); await fetch(`${API}/api/demo/simular-ligacao/1`, { method: 'POST' });
      await esperar(5000); await js(`scrollTo(0, document.getElementById('fila').getBoundingClientRect().top + scrollY - 24)`); },
    depois: async () => { await fetch(`${API}/api/demo/reiniciar/1`, { method: 'POST' }); },
  },
  visitas: { rota: '/visitas', seg: 9, durante: async (js) => { await esperar(4000);
    await js(`[...document.querySelectorAll('button')].find((b) => b.innerText.includes('Marcar visita'))?.click()`); } },
  governanca: { rota: '/governanca', seg: 16, durante: async (js) => { await esperar(2500); await js(rolar(1300, 11)); } },
  negocio: { rota: '/', seg: 9, antes: async (js) => { await esperar(2500);
    await js(`scrollTo(0, document.getElementById('negocio').getBoundingClientRect().top + scrollY - 40)`); } },
};
for (let k = 1; k <= 7; k++) TAKES[`antonio_${k}`] = { rota: `/demonstracao?cena=antonio&passo=${k}`, seg: 11 };
for (let k = 1; k <= 6; k++) TAKES[`benedita_${k}`] = { rota: `/demonstracao?cena=benedita&passo=${k}`, seg: 11 };

async function main() {
  const escolhidos = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(TAKES);
  const proc = spawn(CHROME, ['--headless=new', '--remote-debugging-port=9334', `--user-data-dir=${path.join(__dirname, 'chrome-perfil2')}`,
    '--window-size=1280,720', '--hide-scrollbars', '--autoplay-policy=no-user-gesture-required', 'about:blank']);
  let alvo;
  for (let i = 0; i < 40 && !alvo; i++) { await esperar(300); try { alvo = (await (await fetch('http://127.0.0.1:9334/json')).json()).find((t) => t.type === 'page'); } catch {} }
  const ws = new WebSocket(alvo.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0; const pend = {}; let aoQuadro = null;
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pend[m.id]) { pend[m.id](m); delete pend[m.id]; }
    if (m.method === 'Page.screencastFrame') { aoQuadro && aoQuadro(m.params); cdp('Page.screencastFrameAck', { sessionId: m.params.sessionId }); }
  };
  const cdp = (method, params = {}) => new Promise((r) => { id += 1; pend[id] = r; ws.send(JSON.stringify({ id, method, params })); });
  const js = async (expr) => (await cdp('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })).result?.result?.value;
  await cdp('Page.enable');
  await cdp('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1.5, mobile: false });

  for (const nome of escolhidos) {
    const t = TAKES[nome];
    await cdp('Page.navigate', { url: SITE + t.rota });
    await esperar(3000);
    if (t.antes) await t.antes(js);
    await esperar(500);
    const dir = path.join(OUT, nome); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir);
    const quadros = [];
    aoQuadro = (p) => { const f = path.join(dir, `${String(quadros.length).padStart(5, '0')}.jpg`); fs.writeFileSync(f, Buffer.from(p.data, 'base64')); quadros.push([f, p.metadata.timestamp]); };
    await cdp('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: 1920, maxHeight: 1080, everyNthFrame: 1 });
    const fim = Date.now() + t.seg * 1000;
    if (t.durante) await t.durante(js);
    while (Date.now() < fim) await esperar(100);
    await cdp('Page.stopScreencast');
    aoQuadro = null;
    if (t.depois) await t.depois(js);
    // cada quadro dura até o próximo (o screencast só manda quadro quando a tela muda)
    const lista = quadros.map(([f, ts], i) => `file '${f.replace(/\\/g, '/')}'\nduration ${((quadros[i + 1]?.[1] ?? ts + 0.5) - ts).toFixed(4)}\n`).join('')
      + (quadros.length ? `file '${quadros[quadros.length - 1][0].replace(/\\/g, '/')}'\n` : '');
    fs.writeFileSync(path.join(dir, 'lista.txt'), lista);
    execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', path.join(dir, 'lista.txt'),
      '-vf', 'scale=1920:1080:flags=lanczos,fps=30,format=yuv420p', '-t', String(t.seg), '-c:v', 'libx264', '-preset', 'medium', '-crf', '18',
      path.join(OUT, `${nome}.mp4`)]);
    console.log('gravado', nome, quadros.length, 'quadros');
  }
  ws.close(); proc.kill();
}
main().catch((e) => { console.error(e); process.exit(1); });
