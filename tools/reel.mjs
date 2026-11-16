// Motion reel készítése scriptből.
//
//   npm run reel -- uj <slug>        új brief sablon: materyaller/<slug>/brief.md
//   npm run reel -- hang <slug>      narráció + szóidők          -> out/<slug>/narracio.wav, szavak.json
//   npm run reel -- vazlat <slug>    jelenetvázlat (kiinduló)    -> out/<slug>/sahne.json, plan.md   [--felulir]
//   npm run reel -- render <slug>    1. kapu, render, hang, 2. kapu, ellenőrző képkockák -> out/<slug>/<slug>-<idő>.mp4
//   npm run reel -- mind <slug>      hang + vázlat (felülír) + render egyben
//   npm run reel -- gyors "<script>" [--hang noemi] [--stilus aetherpontis] [--tempo porgos] [--elonezet]
//                                   egy lépésben: brief + hang + vázlat + render (szöveges reel, ágens nélkül)
//   --elonezet                       fél felbontású, gyorsabb próbarender
import fs from 'node:fs';
import path from 'node:path';
import {parseBrief, briefPath} from './lib/brief.mjs';
import {loadEnv, run, hossz, remotionBrowserArgs} from './lib/env.mjs';
import os from 'node:os';
import {narracio} from './narracio.mjs';
import {BEEPITETT, sfxFajl} from './sfx.mjs';
import {sztoriLista} from './sztori-lista.mjs';

loadEnv();
const [cmd, slugArg, ...rest] = process.argv.slice(2);
const win = process.platform === 'win32';

const SABLON = (slug) => `---
cim: ${slug}
nyelv: hu
hang: noemi            # npm run hangok -- lista
beszedtempo: 1.0       # 0.85 – 1.2
vagasi_tempo: kozepes  # nyugodt | kozepes | gyors | porgos
mod: auto              # auto | tipo (kinetikus szöveg) | sztori (rajzfilmes történet, az ágens rajzolja)
hangeffekt: igen       # igen | nem
stilus: aetherpontis   # aetherpontis | vilagos | neon | editoryal
felirat: karaoke       # karaoke | sima | nincs
zene: nincs            # vagy fájlnév a materyal/ mappából
zene_db: -24
cta: ""                # üresen hagyva a script utolsó mondata lesz a CTA
---

SCRIPT:
Ide jön a felolvasandó szöveg.

KIEJTÉS:
# Aetherpontis = Éter-pontisz

MEGJEGYZÉS:
`;

function stamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

function kapu(args) {
  const r = run('node', ['scripts/kontrol.mjs', ...args], {okOnFail: true});
  process.stdout.write(r.stdout);
  process.stderr.write(r.stderr);
  if (r.status !== 0) throw new Error(`Kapu nem ment át: kontrol.mjs ${args[0]}. Javítsd a hibákat és futtasd újra.`);
}

async function hang(b) {
  return narracio({script: b.script, kiejtes: b.kiejtes, hang: b.hang, tempo: b.beszedtempo, ki: path.join('out', b.slug)});
}

function vazlat(b, felulir) {
  const args = ['tools/vazlat.mjs', path.join(b.mappa, 'brief.md')];
  if (felulir) args.push('--felulir');
  const r = run('node', args, {okOnFail: true});
  process.stdout.write(r.stdout); process.stderr.write(r.stderr);
  if (r.status !== 0) throw new Error('A vázlat nem készült el.');
}

// Sztori mód: ha van src/sztorik/<slug>.tsx, vagy a brief mod: sztori
const sztoriFajl = (b) => path.join('src', 'sztorik', `${b.slug}.tsx`);
const sztoriMod = (b) => b.mod === 'sztori' || (b.mod !== 'tipo' && fs.existsSync(sztoriFajl(b)));

function sztoriProps(b) {
  const dir = path.join('out', b.slug);
  const cfg = JSON.parse(fs.readFileSync('ayarlar/reel.json', 'utf8'));
  const stilusok = JSON.parse(fs.readFileSync('ayarlar/stilusok.json', 'utf8'));
  const st = stilusok[b.stilus] || stilusok.aetherpontis;
  const szavak = JSON.parse(fs.readFileSync(path.join(dir, 'szavak.json'), 'utf8'));
  const meta = JSON.parse(fs.readFileSync(path.join(dir, 'meta.json'), 'utf8'));
  const props = {
    slug: b.slug, width: cfg.width, height: cfg.height, fps: cfg.fps,
    duration: Math.round((meta.hossz + cfg.zaro_szunet) * 100) / 100,
    bg: st.bg, safe: cfg.safe, felirat: b.felirat,
    theme: {primary: st.primary, secondary: st.secondary, accent: st.accent, szoveg: st.szoveg, halvany: st.halvany, font: st.font},
    szavak: szavak.map((w) => ({w: w.szo, t: w.start, e: w.end})),
  };
  const f = path.join(dir, 'sztori.json');
  fs.writeFileSync(f, JSON.stringify(props, null, 1));
  return {f, props};
}

// hangeffektek a Remotion public/sfx/ mappájába (beépítettek + hangeffekt/ mappa, mind wav-ra alakítva)
function sfxMasol() {
  fs.mkdirSync('public/sfx', {recursive: true});
  for (const n of Object.keys(BEEPITETT)) fs.copyFileSync(sfxFajl(n), path.join('public/sfx', n + '.wav'));
  if (fs.existsSync('hangeffekt')) for (const f of fs.readdirSync('hangeffekt')) {
    const m = f.match(/^(.+)\.(mp3|wav|m4a)$/i);
    if (!m) continue;
    const ki = path.join('public/sfx', m[1] + '.wav');
    const src = path.join('hangeffekt', f);
    if (!fs.existsSync(ki) || fs.statSync(ki).mtimeMs < fs.statSync(src).mtimeMs) run('ffmpeg', ['-y', '-v', 'error', '-i', src, '-ar', '48000', '-ac', '1', ki]);
  }
}

function render(b, opt = {}) {
  const dir = path.join('out', b.slug);
  const sztori = sztoriMod(b);
  const sahne = path.join(dir, 'sahne.json');
  const narr = path.join(dir, 'narracio.wav');
  for (const f of [narr, ...(sztori ? [] : [sahne])]) if (!fs.existsSync(f)) throw new Error(`Hiányzik: ${f}. Előbb: npm run reel -- hang/vazlat ${b.slug}`);
  // materyalok (logó, képernyőképek) a Remotion public/m/ mappájába
  const mat = path.join(b.mappa, 'materyal');
  fs.mkdirSync('public/m', {recursive: true});
  // márkaelemek (logó stb.) a marka/ mappából, majd a reel saját anyagai
  if (fs.existsSync('marka')) for (const f of fs.readdirSync('marka')) if (/\.(png|jpe?g|svg|webp)$/i.test(f)) fs.copyFileSync(path.join('marka', f), path.join('public/m', f));
  if (fs.existsSync(mat)) for (const f of fs.readdirSync(mat)) if (fs.statSync(path.join(mat, f)).isFile()) fs.copyFileSync(path.join(mat, f), path.join('public/m', f));
  sfxMasol();
  sztoriLista();

  let props, propsFajl, comp;
  if (sztori) {
    if (!fs.existsSync(sztoriFajl(b))) throw new Error(`Sztori módhoz kell a ${sztoriFajl(b)} fájl (az ágens írja meg, lásd talimat/motion-reel.md „Sztori mód”).`);
    ({f: propsFajl, props} = sztoriProps(b));
    comp = 'Sztori';
    console.log('\n1. kapu: sztori típusellenőrzés');
    const tsc = run(path.join('node_modules', '.bin', win ? 'tsc.cmd' : 'tsc'), ['--noEmit'], {okOnFail: true, shell: win});
    if (tsc.status !== 0) { process.stdout.write(tsc.stdout); throw new Error('Kapu nem ment át: a sztori kódjában típushiba van (npm run tip).'); }
    console.log('Rendben.');
  } else {
    props = JSON.parse(fs.readFileSync(sahne, 'utf8'));
    props.hangeffekt = b.hangeffekt !== 'nem';
    fs.writeFileSync(sahne, JSON.stringify(props, null, 1));
    propsFajl = sahne;
    comp = 'Reel';
    const hianyzo = [];
    const fajlok = [props.logo, ...props.events.map((e) => e.logo || (e.type === 'shot' ? e.file : null))].filter(Boolean);
    for (const f of fajlok) if (!fs.existsSync(path.join('public/m', f))) hianyzo.push(f);
    if (hianyzo.length) throw new Error(`Hiányzó fájl(ok) a materyal mappában: ${hianyzo.join(', ')}`);
    console.log('\n1. kapu: jelenetterv');
    kapu(['sahne', sahne]);
  }

  console.log(`\nRender (${comp}${opt.elonezet ? ', gyors előnézet fél felbontásban' : ''})...`);
  const kepVideo = path.join(dir, 'video-kep.mp4');
  const rbin = path.join('node_modules', '.bin', win ? 'remotion.cmd' : 'remotion');
  const szal = Math.max(1, Math.floor(os.cpus().length * 0.75));
  const r = run(rbin, ['render', 'src/index.ts', comp, kepVideo, `--props=${propsFajl}`, '--codec=h264', '--crf=18', `--concurrency=${szal}`, '--x264-preset=veryfast',
    ...(opt.elonezet ? ['--scale=0.5'] : []), ...remotionBrowserArgs()], {stdio: ['ignore', 'inherit', 'inherit'], shell: win});
  if (r.status !== 0) throw new Error('A render nem sikerült.');

  console.log('\nHang ráillesztése (narráció + hangeffektek' + (b.zene && b.zene !== 'nincs' ? ' + zene' : '') + ')...');
  const ki = path.join(dir, `${b.slug}-${stamp()}${opt.elonezet ? '-elonezet' : ''}.mp4`);
  const D = props.duration;
  const vanHang = run('ffprobe', ['-v', 'error', '-select_streams', 'a', '-show_entries', 'stream=index', '-of', 'csv=p=0', kepVideo]).stdout.trim() !== '';
  const zene = b.zene && b.zene !== 'nincs' ? path.join(mat, b.zene) : null;
  if (zene && !fs.existsSync(zene)) console.warn(`Figyelem: a zenefájl nincs meg (${zene}), zene nélkül készül.`);
  const inputs = ['-i', kepVideo, '-i', narr];
  let fc = `[1:a]apad,atrim=0:${D},aresample=48000[n]`;
  let mix = ['[n]'];
  if (vanHang) { fc += `;[0:a]aresample=48000,apad,atrim=0:${D}[fx]`; mix.push('[fx]'); }
  if (zene && fs.existsSync(zene)) {
    inputs.push('-i', zene);
    fc += `;[2:a]volume=${b.zene_db}dB,aloop=loop=-1:size=2000000000,atrim=0:${D},afade=t=out:st=${Math.max(0, D - 2)}:d=2,aresample=48000[m];[n]asplit=2[n1][sc];[m][sc]sidechaincompress=threshold=0.03:ratio=8:attack=20:release=400[md]`;
    mix = mix.map((x) => (x === '[n]' ? '[n1]' : x)).concat('[md]');
  }
  fc += `;${mix.join('')}amix=inputs=${mix.length}:duration=first:normalize=0,alimiter=limit=0.95[a]`;
  run('ffmpeg', ['-y', '-v', 'error', ...inputs, '-filter_complex', fc, '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart', ki]);

  console.log('\n2. kapu: kész videó');
  kapu(['cikti', ki, '--sure', String(D)]);

  // ellenőrző képkockák a szemrevételezéshez
  const kk = path.join(dir, 'kockak');
  fs.mkdirSync(kk, {recursive: true});
  const n = 8;
  const kepek = [];
  for (let i = 0; i < n; i++) {
    const t = Math.min(D - 0.1, 0.6 + ((D - 1) * i) / (n - 1));
    const f = path.join(kk, `kocka-${String(i + 1).padStart(2, '0')}-${t.toFixed(1)}s.png`);
    run('ffmpeg', ['-y', '-v', 'error', '-ss', t.toFixed(2), '-i', ki, '-frames:v', '1', '-vf', 'scale=540:-2', f]);
    kepek.push(f);
  }
  // áttekintő lap biztonsági zóna jelöléssel (piros = Instagram-felület alatt)
  const s = props.safe || {fent: 290, lent: 450, oldal: 80};
  const k = 540 / 1080;
  const zona = `drawbox=x=0:y=0:w=iw:h=${Math.round(s.fent * k)}:color=red@0.25:t=fill,drawbox=x=0:y=ih-${Math.round(s.lent * k)}:w=iw:h=${Math.round(s.lent * k)}:color=red@0.25:t=fill`;
  run('ffmpeg', ['-y', '-v', 'error', ...kepek.flatMap((f) => ['-i', f]), '-filter_complex',
    kepek.map((_, i) => `[${i}:v]${zona}[z${i}]`).join(';') + ';' + kepek.map((_, i) => `[z${i}]`).join('') + `xstack=inputs=${n}:layout=0_0|w0_0|w0+w1_0|w0+w1+w2_0|0_h0|w0_h0|w0+w1_h0|w0+w1+w2_h0`,
    path.join(kk, 'attekintes.png')]);

  const meta = JSON.parse(fs.readFileSync(path.join(dir, 'meta.json'), 'utf8'));
  console.log(`\nKÉSZ: ${ki}`);
  console.log(`Hossz: ${hossz(ki).toFixed(1)} mp · hang: ${meta.hang} (${meta.szolgaltato}) · beszédtempó: ${b.beszedtempo} · vágási tempó: ${b.vagasi_tempo} · stílus: ${b.stilus}`);
  console.log(`Ellenőrző képkockák: ${kk}/ (attekintes.png)`);
  if (b.alapertelmezett.length) console.log(`Alapértékből: ${b.alapertelmezett.join(', ')}`);
  return ki;
}

try {
  if (cmd === 'uj') {
    if (!slugArg) throw new Error('Add meg a reel nevét: npm run reel -- uj <slug>');
    const f = path.join('materyaller', slugArg, 'brief.md');
    if (fs.existsSync(f)) throw new Error(`Már létezik: ${f}`);
    fs.mkdirSync(path.join('materyaller', slugArg, 'materyal'), {recursive: true});
    fs.writeFileSync(f, SABLON(slugArg));
    console.log(`Létrehozva: ${f}`);
  } else if (cmd === 'gyors') {
    const opt = (n) => { const i = rest.indexOf(n); return i >= 0 ? rest[i + 1] : undefined; };
    let script = slugArg;
    if (script && fs.existsSync(script) && script.endsWith('.txt')) script = fs.readFileSync(script, 'utf8');
    if (!script || script.trim().split(/\s+/).length < 3) throw new Error('Add meg a scriptet: npm run reel -- gyors "A teljes szöveg..." (vagy egy .txt fájl útvonalát)');
    const ekezet = {á: 'a', é: 'e', í: 'i', ó: 'o', ö: 'o', ő: 'o', ú: 'u', ü: 'u', ű: 'u'};
    const alap = script.toLowerCase().replace(/[áéíóöőúüű]/g, (c) => ekezet[c]).replace(/[^a-z0-9]+/g, '-').split('-').filter(Boolean).slice(0, 4).join('-');
    const slug = `${alap || 'reel'}-${stamp().slice(4, 13)}`;
    fs.mkdirSync(path.join('materyaller', slug, 'materyal'), {recursive: true});
    const sablon = SABLON(slug)
      .replace(/^hang: .*$/m, `hang: ${opt('--hang') || 'noemi'}`)
      .replace(/^stilus: .*$/m, `stilus: ${opt('--stilus') || 'aetherpontis'}`)
      .replace(/^vagasi_tempo: .*$/m, `vagasi_tempo: ${opt('--tempo') || 'gyors'}`)
      .replace(/^beszedtempo: .*$/m, `beszedtempo: ${opt('--beszedtempo') || (opt('--tempo') === 'porgos' ? '1.1' : '1.0')}`)
      .replace(/^mod: .*$/m, 'mod: tipo')
      .replace('Ide jön a felolvasandó szöveg.', script.trim());
    fs.writeFileSync(path.join('materyaller', slug, 'brief.md'), sablon);
    console.log(`Brief: materyaller/${slug}/brief.md`);
    const b = parseBrief(briefPath(slug));
    await hang(b);
    vazlat(b, true);
    render(b, {elonezet: rest.includes('--elonezet')});
  } else if (['hang', 'vazlat', 'render', 'mind'].includes(cmd)) {
    if (!slugArg) throw new Error(`Add meg a reel nevét: npm run reel -- ${cmd} <slug>`);
    const b = parseBrief(briefPath(slugArg));
    if (cmd === 'hang' || cmd === 'mind') await hang(b);
    if (cmd === 'vazlat') vazlat(b, rest.includes('--felulir'));
    if (cmd === 'mind' && !sztoriMod(b)) vazlat(b, true);
    if (cmd === 'mind' && sztoriMod(b)) console.log('Sztori mód: a meglévő src/sztorik/' + b.slug + '.tsx jelenetet használom (a szöveges vázlat nem kell hozzá).');
    if (cmd === 'render' || cmd === 'mind') render(b, {elonezet: rest.includes('--elonezet')});
  } else {
    console.log('Használat: npm run reel -- uj|hang|vazlat|render|mind <slug>  |  npm run reel -- gyors "<script>"');
  }
} catch (e) {
  console.error('\nHIBA:', e.message);
  process.exit(1);
}
