// Narráció generálása a scriptből + szószintű időbélyegek.
//
//   node tools/narracio.mjs <slug|brief.md>                  -> out/<slug>/narracio.wav, szavak.json, meta.json
//   node tools/narracio.mjs --szoveg "..." --hang noemi --tempo 1.05 --ki out/proba
//
// Szolgáltatók (ayarlar/hangok.json): elevenlabs | edge | espeak
// Csak a hang generálása megy felhőbe (ElevenLabs / Microsoft Edge). Minden más helyben fut.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {parseBrief, briefPath} from './lib/brief.mjs';
import {loadEnv, run, hossz, python} from './lib/env.mjs';
import {felolvasando, szavakKarakterekbol, karakterekHatarokbol, karakterekBecsles, mondatok} from './lib/idozites.mjs';

loadEnv();

export function hangPreset(nev) {
  const all = JSON.parse(fs.readFileSync('ayarlar/hangok.json', 'utf8'));
  const p = all[nev];
  if (!p || nev.startsWith('_')) {
    const nevek = Object.keys(all).filter((k) => !k.startsWith('_')).join(', ');
    throw new Error(`Ismeretlen hang: "${nev}". Elérhető: ${nevek}`);
  }
  return {nev, ...p};
}

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// ---------------------------------------------------------------- szolgáltatók
// Mindegyik: ({tts, preset, tempo, tmp}) -> {nyers: hangfájl, start[], end[]} (karakteridők a tts szövegre)

async function elevenlabs({tts, preset, tempo, tmp}) {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error('Nincs ELEVENLABS_API_KEY a .env fájlban. Másold a .env.example-t .env néven és írd bele a kulcsot.');
  if (!preset.hang || preset.hang.startsWith('CSERELD')) throw new Error(`A(z) "${preset.nev}" hangnál nincs beállítva ElevenLabs voice ID (ayarlar/hangok.json). Listázás: npm run hangok -- lista`);
  const model = preset.modell || 'eleven_multilingual_v2';
  const body = {
    text: tts,
    model_id: model,
    voice_settings: {
      stability: preset.stabilitas ?? 0.5,
      similarity_boost: preset.hasonlosag ?? 0.75,
      style: preset.stilus ?? 0,
      use_speaker_boost: true,
      speed: clamp(tempo, 0.7, 1.2),
    },
  };
  // a multilingual_v2 nem fogad language_code-ot, a többi modell igen
  if (!/multilingual_v2/.test(model) && preset.nyelv) body.language_code = preset.nyelv;
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(preset.hang)}/with-timestamps?output_format=mp3_44100_128`;
  const res = await fetch(url, {method: 'POST', headers: {'xi-api-key': key, 'Content-Type': 'application/json'}, body: JSON.stringify(body)});
  if (!res.ok) throw new Error(`ElevenLabs hiba ${res.status}: ${(await res.text()).slice(0, 500)}`);
  const j = await res.json();
  const nyers = path.join(tmp, 'el.mp3');
  fs.writeFileSync(nyers, Buffer.from(j.audio_base64, 'base64'));
  const al = j.alignment;
  const start = new Array(tts.length).fill(NaN), end = new Array(tts.length).fill(NaN);
  if (al && al.characters && al.characters.length === tts.length) {
    al.character_start_times_seconds.forEach((t, i) => (start[i] = t));
    al.character_end_times_seconds.forEach((t, i) => (end[i] = t));
  } else if (al && al.characters) {
    // eltérő hossz (ritka): karakterek egymás utáni párosítása
    let c = 0;
    al.characters.forEach((ch, i) => {
      const k = tts.indexOf(ch, c);
      if (k >= 0 && k - c < 4) { start[k] = al.character_start_times_seconds[i]; end[k] = al.character_end_times_seconds[i]; c = k + 1; }
    });
  }
  return {nyers, start, end};
}

async function edge({tts, preset, tempo, tmp}) {
  const py = python(['edge-tts']);
  const txt = path.join(tmp, 'tts.txt');
  fs.writeFileSync(txt, tts);
  const nyers = path.join(tmp, 'edge.mp3');
  const js = path.join(tmp, 'edge.json');
  const pct = Math.round((clamp(tempo, 0.5, 2) - 1) * 100);
  const r = run(py, ['tools/edge_szavak.py', txt, preset.hang, `${pct >= 0 ? '+' : ''}${pct}%`, nyers, js], {okOnFail: true});
  if (r.status !== 0) {
    const utolso = (r.stderr || '').trim().split('\n').pop();
    throw new Error(`Az edge-tts nem tudott hangot generálni (nincs internet, vagy a Microsoft hangszolgáltatás nem érhető el erről a gépről). Részlet: ${utolso}`);
  }
  const hatarok = JSON.parse(fs.readFileSync(js, 'utf8'));
  return {nyers, ...karakterekHatarokbol(tts, hatarok)};
}

async function espeak({tts, preset, tempo, tmp}) {
  // Helyi, internet nélküli robothang: csak a folyamat teszteléséhez.
  const bin = ['espeak-ng', 'espeak'].find((b) => run('which', [b], {okOnFail: true}).status === 0);
  if (!bin) throw new Error('espeak-ng nincs telepítve (Mac: brew install espeak-ng). Ez csak teszthang, használd az edge vagy elevenlabs hangot.');
  const ms = mondatok(tts);
  const lista = [];
  const szakaszok = [];
  let t = 0;
  ms.forEach((m, i) => {
    const f = path.join(tmp, `m${i}.wav`);
    run(bin, ['-v', preset.hang || 'hu', '-s', String(Math.round(165 * tempo)), '-w', f, m.szoveg]);
    const d = hossz(f);
    szakaszok.push({a: m.a, b: m.b, t0: t + 0.05, t1: t + d - 0.12});
    lista.push(`file '${path.resolve(f)}'`);
    t += d;
  });
  const lst = path.join(tmp, 'lista.txt');
  fs.writeFileSync(lst, lista.join('\n'));
  const nyers = path.join(tmp, 'espeak.wav');
  run('ffmpeg', ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', lst, '-c', 'copy', nyers]);
  return {nyers, ...karakterekBecsles(tts, szakaszok)};
}

const SZOLG = {elevenlabs, edge, espeak};

// ---------------------------------------------------------------- fő függvény
export async function narracio({script, kiejtes = {}, hang, tempo = 1, ki}) {
  const preset = hangPreset(hang);
  const fn = SZOLG[preset.szolgaltato];
  if (!fn) throw new Error(`Ismeretlen szolgáltató: ${preset.szolgaltato}`);
  fs.mkdirSync(ki, {recursive: true});
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'narr-'));
  const {tokens, tts, spans} = felolvasando(script, kiejtes);
  console.log(`Narráció: ${preset.nev} (${preset.szolgaltato}), tempó ${tempo}, ${tokens.length} szó`);
  const r = await fn({tts, preset, tempo, tmp});
  // egységes kimenet: 48 kHz mono wav, Instagramhoz igazított hangosság (-14 LUFS)
  const wav = path.join(ki, 'narracio.wav');
  run('ffmpeg', ['-y', '-v', 'error', '-i', r.nyers, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-ar', '48000', '-ac', '1', '-c:a', 'pcm_s16le', wav]);
  const d = hossz(wav);
  const szavak = szavakKarakterekbol(tokens, spans, r.start, r.end, d);
  fs.writeFileSync(path.join(ki, 'szavak.json'), JSON.stringify(szavak, null, 1));
  const meta = {hang: preset.nev, szolgaltato: preset.szolgaltato, hangId: preset.hang, modell: preset.modell, tempo, hossz: d, szavakSzama: szavak.length, kiejtes, felolvasott: tts, keszult: new Date().toISOString()};
  fs.writeFileSync(path.join(ki, 'meta.json'), JSON.stringify(meta, null, 1));
  fs.rmSync(tmp, {recursive: true, force: true});
  console.log(`Kész: ${wav} (${d.toFixed(2)} mp)`);
  return meta;
}

// ---------------------------------------------------------------- parancssor
const isMain = import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('narracio.mjs');
if (isMain) {
  const a = process.argv.slice(2);
  const opt = (n) => { const i = a.indexOf(n); return i >= 0 ? a[i + 1] : undefined; };
  try {
    if (opt('--szoveg')) {
      await narracio({script: opt('--szoveg'), hang: opt('--hang') || 'noemi', tempo: Number(opt('--tempo') || 1), ki: opt('--ki') || 'out/proba'});
    } else if (a[0]) {
      const b = parseBrief(briefPath(a[0]));
      await narracio({script: b.script, kiejtes: b.kiejtes, hang: opt('--hang') || b.hang, tempo: Number(opt('--tempo') || b.beszedtempo), ki: path.join('out', b.slug)});
    } else {
      console.log('Használat: node tools/narracio.mjs <slug|brief.md> [--hang X] [--tempo 1.05]');
      process.exit(1);
    }
  } catch (e) { console.error('HIBA:', e.message); process.exit(1); }
}
