// Hangeffektek.
//   npm run sfx -- lista                          beépített + saját effektek
//   npm run sfx -- general "<leírás>" <nev> [mp]  új effekt ElevenLabs-szal -> hangeffekt/<nev>.mp3
//
// Beépített effektek: ffmpeg-gel, helyben generálva (out/_sfx/), internet nélkül.
// Saját / generált effektek: hangeffekt/ mappa (verziózott, a csapat újrahasználja).
import fs from 'node:fs';
import path from 'node:path';
import {loadEnv, run} from './lib/env.mjs';

loadEnv();

// név -> [időtartam mp, ffmpeg aevalsrc kifejezés, utószűrők]
export const BEEPITETT = {
  loves: [0.7, '0.9*(random(0)*2-1)*exp(-t*26)+0.9*sin(2*PI*(60+90*exp(-t*30))*t)*exp(-t*10)', 'lowpass=f=5000', 'Rajzfilmes lövés'],
  whoosh: [0.45, '(random(0)*2-1)*pow(sin(PI*t/0.45),2)', 'highpass=f=500,lowpass=f=2800', 'Suhanás (jelenetváltás)'],
  whoosh_hosszu: [0.9, '(random(0)*2-1)*pow(sin(PI*t/0.9),2)', 'highpass=f=300,lowpass=f=2200', 'Hosszú suhanás'],
  pop: [0.16, 'sin(2*PI*(500+1800*exp(-t*40))*t)*exp(-t*28)', '', 'Felbukkanás'],
  ding: [1.2, '0.6*sin(2*PI*1320*t)*exp(-t*4)+0.3*sin(2*PI*2640*t)*exp(-t*6)+0.15*sin(2*PI*3960*t)*exp(-t*9)', '', 'Csengő (siker, CTA)'],
  bumm: [0.8, 'sin(2*PI*(45+140*exp(-t*18))*t)*exp(-t*5)+0.5*(random(0)*2-1)*exp(-t*22)', 'lowpass=f=3000', 'Becsapódás'],
  csorrenes: [0.9, '0.3*(sin(2*PI*523*t)+sin(2*PI*1187*t)+sin(2*PI*1871*t)+sin(2*PI*2633*t))*exp(-t*8)', '', 'Fémes koppanás (cső)'],
  karc: [0.55, '(random(0)*2-1)*abs(sin(2*PI*7*t))*exp(-t*2.5)', 'bandpass=f=1600:width_type=h:w=1400,volume=6', 'Lemezkarc (megállás, fordulat)'],
  siker: [0.7, '0.5*sin(2*PI*if(lt(t,0.12),660,if(lt(t,0.24),880,1320))*t)*exp(-mod(t,0.12)*9)*if(gt(t,0.24),exp(-(t-0.24)*4),1)', '', 'Felfelé futó dallam'],
  tik: [0.05, 'sin(2*PI*2200*t)*exp(-t*180)', '', 'Kattanás'],
  boing: [0.9, 'sin(2*PI*(200+90*sin(2*PI*11*t)*exp(-t*3))*t)*exp(-t*3.2)', '', 'Rugós boing (vicces)'],
  pecset: [0.35, 'sin(2*PI*(80+60*exp(-t*40))*t)*exp(-t*14)+0.4*(random(0)*2-1)*exp(-t*45)', 'lowpass=f=2500', 'Pecsét lecsapása'],
};

export function sfxFajl(nev) {
  for (const ext of ['.wav', '.mp3', '.m4a']) {
    const f = path.join('hangeffekt', nev + ext);
    if (fs.existsSync(f)) return f;
  }
  const b = BEEPITETT[nev];
  if (!b) throw new Error(`Ismeretlen hangeffekt: "${nev}". Beépítettek: ${Object.keys(BEEPITETT).join(', ')}; vagy tedd a hangeffekt/ mappába, vagy generáld: npm run sfx -- general "<leírás>" ${nev}`);
  const ki = path.join('out', '_sfx', nev + '.wav');
  if (!fs.existsSync(ki)) {
    fs.mkdirSync(path.dirname(ki), {recursive: true});
    const [d, expr, szuro] = b;
    const af = ['volume=0.8', szuro, 'afade=t=out:st=' + Math.max(0, d - 0.04) + ':d=0.04'].filter(Boolean).join(',');
    run('ffmpeg', ['-y', '-v', 'error', '-f', 'lavfi', '-i', `aevalsrc='${expr}':s=48000:d=${d}`, '-af', af, '-ac', '1', ki]);
  }
  return ki;
}

async function general(leiras, nev, mp) {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error('Nincs ELEVENLABS_API_KEY a .env fájlban.');
  const body = {text: leiras, prompt_influence: 0.5};
  if (mp) body.duration_seconds = Math.max(0.5, Math.min(30, Number(mp)));
  const r = await fetch('https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_128', {method: 'POST', headers: {'xi-api-key': key, 'Content-Type': 'application/json'}, body: JSON.stringify(body)});
  if (!r.ok) throw new Error(`ElevenLabs hiba ${r.status}: ${(await r.text()).slice(0, 300)}`);
  fs.mkdirSync('hangeffekt', {recursive: true});
  const f = path.join('hangeffekt', nev + '.mp3');
  fs.writeFileSync(f, Buffer.from(await r.arrayBuffer()));
  console.log(`Kész: ${f}`);
}

if (process.argv[1]?.endsWith('sfx.mjs')) {
  const [cmd, a, b, c] = process.argv.slice(2);
  try {
    if (cmd === 'lista') {
      console.log('Beépített (helyben generált):');
      for (const [n, v] of Object.entries(BEEPITETT)) console.log(`  ${n.padEnd(14)} ${v[3]}`);
      const sajat = fs.existsSync('hangeffekt') ? fs.readdirSync('hangeffekt').filter((f) => /\.(wav|mp3|m4a)$/.test(f)) : [];
      console.log('Saját (hangeffekt/):' + (sajat.length ? '\n  ' + sajat.join('\n  ') : ' nincs'));
    } else if (cmd === 'general') {
      if (!a || !b) throw new Error('Használat: npm run sfx -- general "<leírás angolul>" <nev> [mp]');
      await general(a, b, c);
    } else if (cmd === 'proba') {
      for (const n of Object.keys(BEEPITETT)) console.log(sfxFajl(n));
    } else {
      console.log('Használat: npm run sfx -- lista | general "<leírás>" <nev> [mp] | proba');
    }
  } catch (e) { console.error('HIBA:', e.message); process.exit(1); }
}
