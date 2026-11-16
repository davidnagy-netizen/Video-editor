// Reel Stúdió: helyi weboldal, ahol beilleszted a scriptet, kiválasztod a beállításokat, és egy gombnyomásra elkészül a reel.
//   npm run studio-reel   ->  http://localhost:4545
// Ha a gépen van Claude Code (`claude`), az ágens dolgozik (tipo vagy sztori mód, kérdések nélkül).
// Ha nincs, a gépi „gyors” folyamat fut (csak szöveges / tipo reel).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {spawn, spawnSync} from 'node:child_process';

const PORT = Number(process.env.STUDIO_PORT || 4545);
const win = process.platform === 'win32';
const vanClaude = spawnSync(win ? 'where' : 'which', ['claude']).status === 0;
const futasok = new Map(); // id -> {log: [], kesz, hiba, video, kezdes}

const json = (res, code, obj) => { res.writeHead(code, {'Content-Type': 'application/json; charset=utf-8'}); res.end(JSON.stringify(obj)); };
const olvas = (req) => new Promise((ok) => { let b = ''; req.on('data', (c) => (b += c)); req.on('end', () => ok(b)); });

function legujabbVideo(kezdes) {
  if (!fs.existsSync('out')) return null;
  let best = null;
  for (const d of fs.readdirSync('out')) {
    const dir = path.join('out', d);
    if (!fs.statSync(dir).isDirectory() || d.startsWith('_')) continue;
    for (const f of fs.readdirSync(dir)) {
      if (!/\.mp4$/.test(f) || /^video-/.test(f)) continue;
      const p = path.join(dir, f);
      const m = fs.statSync(p).mtimeMs;
      if (m >= kezdes && (!best || m > best.m)) best = {p, m};
    }
  }
  return best?.p ?? null;
}

function indit(o) {
  const id = Date.now().toString(36);
  const fut = {log: [], kesz: false, hiba: null, video: null, kezdes: Date.now()};
  futasok.set(id, fut);
  const ir = (s) => { for (const l of String(s).split('\n')) if (l.trim()) fut.log.push(l.slice(0, 400)); if (fut.log.length > 400) fut.log.splice(0, fut.log.length - 400); };
  let p;
  const beall = [`hang: ${o.hang}`, `beszédtempó: ${o.beszedtempo}`, `vágási tempó: ${o.tempo}`, `stílus: ${o.stilus}`, `felirat: ${o.felirat}`, `mód: ${o.mod}`, o.cta ? `CTA: ${o.cta}` : ''].filter(Boolean).join(', ');
  if (vanClaude && o.motor !== 'gepi') {
    const prompt = `/reel ${o.script}\n\nBeállítások: ${beall}`;
    ir(`Claude Code ágens indul (${o.mod === 'auto' ? 'a módot ő választja' : o.mod + ' mód'})…`);
    p = spawn('claude', ['-p', prompt, '--permission-mode', 'acceptEdits',
      '--allowedTools', 'Bash(npm run *),Bash(npm run tip),Bash(node *),Bash(npx remotion *),Bash(npx tsc *),Bash(ffmpeg *),Bash(ffprobe *),Bash(ls *),Bash(cat *),Read,Write,Edit,Glob,Grep',
      '--output-format', 'stream-json', '--verbose'], {shell: win});
    let puffer = '';
    p.stdout.on('data', (c) => {
      puffer += c;
      let i;
      while ((i = puffer.indexOf('\n')) >= 0) {
        const sor = puffer.slice(0, i); puffer = puffer.slice(i + 1);
        try {
          const e = JSON.parse(sor);
          if (e.type === 'assistant') for (const b of e.message?.content ?? []) {
            if (b.type === 'text' && b.text.trim()) ir('» ' + b.text.trim());
            if (b.type === 'tool_use') ir('> ' + (b.input?.command || b.input?.file_path || b.name));
          }
          if (e.type === 'result') ir(e.is_error ? 'HIBA: ' + (e.result || '') : 'Kész: ' + (e.result || ''));
        } catch { ir(sor); }
      }
    });
  } else {
    ir('Gépi „gyors” folyamat indul (szöveges reel)…');
    p = spawn('node', ['tools/reel.mjs', 'gyors', o.script, '--hang', o.hang, '--stilus', o.stilus, '--tempo', o.tempo, '--beszedtempo', String(o.beszedtempo)]);
    p.stdout.on('data', (c) => ir(String(c).replace(/^(Rendered|Encoded) .*$/gm, '')));
  }
  p.stderr.on('data', (c) => ir(String(c).replace(/^(Rendered|Encoded) .*$/gm, '')));
  p.on('close', (code) => {
    fut.kesz = true;
    fut.video = legujabbVideo(fut.kezdes);
    if (code !== 0 && !fut.video) fut.hiba = `A folyamat hibával állt le (${code}). Nézd meg a naplót.`;
    ir(fut.video ? `KÉSZ: ${fut.video}` : 'Vége.');
  });
  return id;
}

const srv = http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x');
  try {
    if (u.pathname === '/') { res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'}); return res.end(fs.readFileSync('tools/studio.html')); }
    if (u.pathname === '/api/info') {
      const hangok = JSON.parse(fs.readFileSync('ayarlar/hangok.json', 'utf8'));
      const stilusok = JSON.parse(fs.readFileSync('ayarlar/stilusok.json', 'utf8'));
      return json(res, 200, {
        claude: vanClaude, elevenlabs: fs.existsSync('.env') && /ELEVENLABS_API_KEY=\S+/.test(fs.readFileSync('.env', 'utf8')),
        hangok: Object.entries(hangok).filter(([k]) => !k.startsWith('_')).map(([k, v]) => ({id: k, leiras: v.leiras, szolgaltato: v.szolgaltato})),
        stilusok: Object.keys(stilusok).filter((k) => !k.startsWith('_')),
      });
    }
    if (u.pathname === '/api/start' && req.method === 'POST') {
      const o = JSON.parse(await olvas(req));
      if (!o.script || o.script.trim().split(/\s+/).length < 3) return json(res, 400, {hiba: 'Írj be egy scriptet.'});
      return json(res, 200, {id: indit(o)});
    }
    if (u.pathname === '/api/allapot') {
      const f = futasok.get(u.searchParams.get('id'));
      if (!f) return json(res, 404, {hiba: 'Nincs ilyen futás.'});
      return json(res, 200, {log: f.log.slice(-60), kesz: f.kesz, hiba: f.hiba, video: f.video ? '/video?f=' + encodeURIComponent(f.video) : null, fajl: f.video});
    }
    if (u.pathname === '/video') {
      const f = path.normalize(u.searchParams.get('f') || '');
      if (!f.startsWith('out' + path.sep) || !f.endsWith('.mp4') || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
      const size = fs.statSync(f).size;
      const range = req.headers.range?.match(/bytes=(\d+)-(\d*)/);
      if (range) {
        const a = Number(range[1]), b = range[2] ? Number(range[2]) : size - 1;
        res.writeHead(206, {'Content-Type': 'video/mp4', 'Content-Range': `bytes ${a}-${b}/${size}`, 'Accept-Ranges': 'bytes', 'Content-Length': b - a + 1});
        return fs.createReadStream(f, {start: a, end: b}).pipe(res);
      }
      res.writeHead(200, {'Content-Type': 'video/mp4', 'Content-Length': size, 'Accept-Ranges': 'bytes'});
      return fs.createReadStream(f).pipe(res);
    }
    res.writeHead(404); res.end();
  } catch (e) { json(res, 500, {hiba: e.message}); }
});

srv.listen(PORT, '127.0.0.1', () => {
  const url = `http://localhost:${PORT}`;
  console.log(`Reel Stúdió: ${url}  (leállítás: Ctrl+C)`);
  console.log(vanClaude ? 'Claude Code megtalálva: az ágens készíti a reeleket (szöveges és sztori mód).' : 'Claude Code nincs telepítve: csak a gépi, szöveges (tipo) reel érhető el.');
  const nyit = process.platform === 'darwin' ? 'open' : win ? 'start' : 'xdg-open';
  try { spawn(nyit, [url], {shell: win, stdio: 'ignore', detached: true}).unref(); } catch {}
});
