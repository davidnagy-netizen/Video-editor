// Hangok kezelése.
//   npm run hangok -- lista            presetek + (ha van kulcs) a fiókod ElevenLabs hangjai
//   npm run hangok -- minta [nev ...]  hangminta minden (vagy a megadott) presethez: out/hangmintak/
import fs from 'node:fs';
import path from 'node:path';
import {loadEnv} from './lib/env.mjs';
import {narracio} from './narracio.mjs';

loadEnv();
const all = JSON.parse(fs.readFileSync('ayarlar/hangok.json', 'utf8'));
const nevek = Object.keys(all).filter((k) => !k.startsWith('_'));
const [cmd, ...rest] = process.argv.slice(2);

const PROBA = {
  hu: 'Szia! Ez egy hangminta az Aetherpontis reelekhez. Egy virtuális asszisztens átveszi a napi adminisztrációt, te pedig a vállalkozásodra figyelhetsz.',
  en: 'Hi! This is a voice sample for Aetherpontis reels. A virtual assistant takes over your daily admin, so you can focus on your business.',
};

if (cmd === 'lista') {
  console.log('Presetek (ayarlar/hangok.json):');
  for (const n of nevek) console.log(`  ${n.padEnd(12)} ${all[n].szolgaltato.padEnd(11)} ${all[n].leiras || ''}`);
  if (process.env.ELEVENLABS_API_KEY) {
    const r = await fetch('https://api.elevenlabs.io/v1/voices', {headers: {'xi-api-key': process.env.ELEVENLABS_API_KEY}});
    if (!r.ok) { console.error(`ElevenLabs hiba ${r.status}: ${(await r.text()).slice(0, 300)}`); process.exit(1); }
    const j = await r.json();
    console.log('\nA fiókodban elérhető ElevenLabs hangok (voice_id -> név):');
    for (const v of j.voices) {
      const l = v.labels || {};
      console.log(`  ${v.voice_id}  ${v.name}  [${[v.category, l.gender, l.accent, l.language].filter(Boolean).join(', ')}]`);
    }
    console.log('\nA kiválasztott voice_id-t írd be az ayarlar/hangok.json megfelelő presetjébe.');
  } else {
    console.log('\n(ElevenLabs hangok listázásához add meg az ELEVENLABS_API_KEY-t a .env fájlban.)');
  }
} else if (cmd === 'minta') {
  const cel = rest.length ? rest : nevek;
  const ok = [], hiba = [];
  for (const n of cel) {
    try {
      const ki = path.join('out', 'hangmintak', n);
      await narracio({script: PROBA[all[n].nyelv] || PROBA.hu, hang: n, tempo: 1, ki});
      const dst = path.join('out', 'hangmintak', `${n}.wav`);
      fs.copyFileSync(path.join(ki, 'narracio.wav'), dst);
      ok.push(dst);
    } catch (e) { hiba.push(`${n}: ${e.message.split('\n')[0]}`); }
  }
  console.log('\nElkészült minták:\n  ' + (ok.join('\n  ') || '-'));
  if (hiba.length) console.log('Kihagyva:\n  ' + hiba.join('\n  '));
} else {
  console.log('Használat: npm run hangok -- lista | npm run hangok -- minta [preset ...]');
}
