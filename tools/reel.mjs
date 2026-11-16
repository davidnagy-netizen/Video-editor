// Motion reel készítése scriptből.
//
//   npm run reel -- uj <slug>        új brief sablon: materyaller/<slug>/brief.md
//   npm run reel -- hang <slug>      narráció + szóidők          -> out/<slug>/narracio.wav, szavak.json
//   npm run reel -- vazlat <slug>    jelenetvázlat (kiinduló)    -> out/<slug>/sahne.json, plan.md   [--felulir]
//   npm run reel -- render <slug>    1. kapu, render, hang, 2. kapu, ellenőrző képkockák -> out/<slug>/<slug>-<idő>.mp4
//   npm run reel -- mind <slug>      hang + vázlat (felülír) + render egyben
import fs from 'node:fs';
import path from 'node:path';
import {parseBrief, briefPath} from './lib/brief.mjs';
import {loadEnv, run, hossz, remotionBrowserArgs} from './lib/env.mjs';
import {narracio} from './narracio.mjs';

loadEnv();
const [cmd, slugArg, ...rest] = process.argv.slice(2);
const win = process.platform === 'win32';

const SABLON = (slug) => `---
cim: ${slug}
nyelv: hu
hang: noemi            # npm run hangok -- lista
beszedtempo: 1.0       # 0.85 – 1.2
vagasi_tempo: kozepes  # nyugodt | kozepes | gyors
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

function render(b) {
  const dir = path.join('out', b.slug);
  const sahne = path.join(dir, 'sahne.json');
  const narr = path.join(dir, 'narracio.wav');
  for (const f of [sahne, narr]) if (!fs.existsSync(f)) throw new Error(`Hiányzik: ${f}. Előbb: npm run reel -- hang/vazlat ${b.slug}`);
  // materyalok (logó, képernyőképek) a Remotion public/m/ mappájába
  const mat = path.join(b.mappa, 'materyal');
  fs.mkdirSync('public/m', {recursive: true});
  // márkaelemek (logó stb.) a marka/ mappából, majd a reel saját anyagai
  if (fs.existsSync('marka')) for (const f of fs.readdirSync('marka')) if (/\.(png|jpe?g|svg|webp)$/i.test(f)) fs.copyFileSync(path.join('marka', f), path.join('public/m', f));
  if (fs.existsSync(mat)) for (const f of fs.readdirSync(mat)) if (fs.statSync(path.join(mat, f)).isFile()) fs.copyFileSync(path.join(mat, f), path.join('public/m', f));
  const props = JSON.parse(fs.readFileSync(sahne, 'utf8'));
  const hianyzo = [];
  const fajlok = [props.logo, ...props.events.map((e) => e.logo || (e.type === 'shot' ? e.file : null))].filter(Boolean);
  for (const f of fajlok) if (!fs.existsSync(path.join('public/m', f))) hianyzo.push(f);
  if (hianyzo.length) throw new Error(`Hiányzó fájl(ok) a materyal mappában: ${hianyzo.join(', ')}`);

  console.log('\n1. kapu: jelenetterv');
  kapu(['sahne', sahne]);

  console.log('\nRender (néma)...');
  const sessiz = path.join(dir, 'video-sessiz.mp4');
  const rbin = path.join('node_modules', '.bin', win ? 'remotion.cmd' : 'remotion');
  const r = run(rbin, ['render', 'src/index.ts', 'Reel', sessiz, `--props=${sahne}`, '--codec=h264', '--crf=18', '--muted', ...remotionBrowserArgs()], {stdio: ['ignore', 'inherit', 'inherit'], shell: win});
  if (r.status !== 0) throw new Error('A render nem sikerült.');

  console.log('\nHang ráillesztése...');
  const ki = path.join(dir, `${b.slug}-${stamp()}.mp4`);
  const D = props.duration;
  const zene = b.zene && b.zene !== 'nincs' ? path.join(mat, b.zene) : null;
  if (zene && !fs.existsSync(zene)) console.warn(`Figyelem: a zenefájl nincs meg (${zene}), zene nélkül készül.`);
  if (zene && fs.existsSync(zene)) {
    const vol = b.zene_db;
    run('ffmpeg', ['-y', '-v', 'error', '-i', sessiz, '-i', narr, '-i', zene, '-filter_complex',
      `[1:a]apad,atrim=0:${D},asplit=2[sp][sc];[2:a]volume=${vol}dB,aloop=loop=-1:size=2000000000,atrim=0:${D},afade=t=out:st=${Math.max(0, D - 2)}:d=2[m];[m][sc]sidechaincompress=threshold=0.03:ratio=8:attack=20:release=400[md];[sp][md]amix=inputs=2:duration=first:normalize=0[a]`,
      '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart', ki]);
  } else {
    run('ffmpeg', ['-y', '-v', 'error', '-i', sessiz, '-i', narr, '-filter_complex', `[1:a]apad,atrim=0:${D}[a]`,
      '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart', ki]);
  }

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
  } else if (['hang', 'vazlat', 'render', 'mind'].includes(cmd)) {
    if (!slugArg) throw new Error(`Add meg a reel nevét: npm run reel -- ${cmd} <slug>`);
    const b = parseBrief(briefPath(slugArg));
    if (cmd === 'hang' || cmd === 'mind') await hang(b);
    if (cmd === 'vazlat') vazlat(b, rest.includes('--felulir'));
    if (cmd === 'mind') vazlat(b, true);
    if (cmd === 'render' || cmd === 'mind') render(b);
  } else {
    console.log('Használat: npm run reel -- uj|hang|vazlat|render|mind <slug>');
  }
} catch (e) {
  console.error('\nHIBA:', e.message);
  process.exit(1);
}
