// Jelenetvázlat (sahne.json) a narráció szóidőiből. Ez KIINDULÓ terv: az ágens átnézi és javítja.
//   node tools/vazlat.mjs <slug|brief.md> [--felulir]
import fs from 'node:fs';
import path from 'node:path';
import {parseBrief, briefPath} from './lib/brief.mjs';
import {szamErtek} from './lib/szamok.mjs';

const STOP = new Set('a az és egy is de hogy nem van volt lesz meg már csak még ez azt ami amit aki mert ha akkor pedig vagy sem se te én mi ti ők neked nekem the and or to of in on for is are you your it this that with be'.split(' '));
const NEVELO = /^(a|az|the|an)$/i;
const LOGO = new Set('a az egy és hogy de nem is the a an and to of that'.split(' '));
const tiszta = (w) => w.replace(/^[\s"'„”“«»(]+|[\s"'„”“«»),.;:]+$/g, '');
const kulcs = (w) => tiszta(w).replace(/[?!…]+$/, '').toLowerCase();
const mondatVeg = (w) => /[.!?…]["”»]?$/.test(w);
const vesszo = (w) => /[,;:–—]$/.test(w);
const r2 = (x) => Math.round(x * 100) / 100;
const nagy = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export function vazlat({brief, szavak, hossz, stilus, cfg}) {
  const tempo = cfg.vagasi_tempo[brief.vagasi_tempo] || cfg.vagasi_tempo.kozepes;
  const duration = r2(hossz + cfg.zaro_szunet);
  const nyelv = brief.nyelv || 'hu';

  // ---- mondatok
  const mondatok = [];
  let cur = [];
  szavak.forEach((s, i) => { cur.push(i); if (mondatVeg(s.szo) || i === szavak.length - 1) { mondatok.push(cur); cur = []; } });

  // ---- darabolás (jelenetenként egy gondolat)
  const darabol = (idx) => {
    const out = [];
    let d = [];
    for (const i of idx) {
      const s = szavak[i];
      if (d.length) {
        const t0 = szavak[d[0]].start;
        const elozo = szavak[d[d.length - 1]];
        const tul = d.length >= tempo.szo_max || s.end - t0 > tempo.max;
        const termeszetes = vesszo(elozo.szo) && elozo.end - t0 >= tempo.min * 0.8;
        if (tul || termeszetes) {
          // ne lógjon névelő / kötőszó a darab végén
          const vissza = [];
          while (tul && d.length > 1 && LOGO.has(kulcs(szavak[d[d.length - 1]].szo))) vissza.unshift(d.pop());
          out.push(d); d = vissza;
        }
      }
      d.push(i);
    }
    if (d.length) out.push(d);
    // túl rövid utolsó darab: összevonás az előzővel
    if (out.length > 1) {
      const u = out[out.length - 1];
      const dd = szavak[u[u.length - 1]].end - szavak[u[0]].start;
      if (dd < tempo.min * 0.5 && u.length <= 2) out[out.length - 2].push(...out.pop());
    }
    return out;
  };

  // ---- felsorolás felismerése egy mondatban: >= 3 rövid elem vesszővel / "és"-sel
  const KOTO = ['és', 'and', 'meg', 'vagy', 'or', 'valamint'];
  const VONATKOZO = /^(ami|amit|amely|amelyet|aki|akit|ahol|amikor|which|that|who|where)$/;
  const felsorolas = (idx) => {
    const seg = [[]];
    idx.forEach((i) => {
      const w = kulcs(szavak[i].szo);
      if (KOTO.includes(w)) { if (seg[seg.length - 1].length) seg.push([]); return; }
      seg[seg.length - 1].push(i);
      if (vesszo(szavak[i].szo)) seg.push([]);
    });
    const s = seg.filter((x) => x.length);
    if (s.length < 3) return null;
    // első szakasz: ha hosszú, az eleje bevezető, a vége (a következő elem hosszával egyező) az első elem
    let elotte = [];
    const first = s[0].slice();
    if (first.length > 4) { const k = Math.max(1, Math.min(3, s[1].length)); elotte = first.splice(0, first.length - k); }
    const elemek = [first];
    let j = 1;
    while (j < s.length && s[j].length <= 4 && !VONATKOZO.test(kulcs(szavak[s[j][0]].szo))) { elemek.push(s[j]); j++; }
    if (elemek.length < 3) return null;
    const utana = s.slice(j).flat();
    // a kimaradt kötőszavak is a "utána" részhez tartoznak, ha az elemek után jönnek
    const utolsoElem = Math.max(...elemek.flat());
    const utanaTeljes = idx.filter((i) => i > utolsoElem && (utana.includes(i) || utana.length));
    return {elotte, elemek, utana: utana.length ? utanaTeljes : []};
  };

  const szamKeres = (d) => {
    for (let k = 0; k < d.length; k++) {
      const v = szamErtek(szavak[d[k]].szo, nyelv);
      // az „egy” általában névelő; csak felsorolás sorszámaként („Egy:”) számít számnak
      if (!v || (v.ertek < 2 && !/[:.)]$/.test(szavak[d[k]].szo))) continue;
      const kov = szavak[d[k + 1]] ? kulcs(szavak[d[k + 1]].szo) : '';
      if (kov.startsWith('százalék') || kov === 'percent') v.utotag = '%';
      return {k, ...v};
    }
    return null;
  };

  const kulcsszo = (d) => {
    const jelolt = d.map((i) => tiszta(szavak[i].szo)).filter((w) => w.length >= 5 && !STOP.has(w.toLowerCase()));
    if (!jelolt.length) return [];
    return [jelolt.sort((a, b) => b.length - a.length)[0]];
  };

  // ---- jelenetek
  const jelenetek = []; // {tipus, idx: [szóindexek], ...}
  mondatok.forEach((m, mi) => {
    const utolso = mi === mondatok.length - 1 && mondatok.length > 1;
    if (utolso) { jelenetek.push({tipus: 'cta', idx: m}); return; }
    const fs_ = mi > 0 ? felsorolas(m) : null;
    if (fs_) {
      if (fs_.elotte.length) darabol(fs_.elotte).forEach((d) => jelenetek.push({tipus: 'kinetik', idx: d}));
      const fl = fs_.elemek.flat();
      const tol = Math.min(...fl), ig = Math.max(...fl);
      jelenetek.push({tipus: 'felsorolas', idx: m.filter((i) => i >= tol && i <= ig), elemek: fs_.elemek});
      if (fs_.utana.length) darabol(fs_.utana).forEach((d) => jelenetek.push({tipus: 'kinetik', idx: d}));
      return;
    }
    darabol(m).forEach((d) => jelenetek.push({tipus: 'kinetik', idx: d}));
  });
  if (jelenetek.length) jelenetek[0].hook = true;

  // számok -> számláló (nem egymás után, nem a kampóban)
  jelenetek.forEach((j, n) => {
    if (j.tipus !== 'kinetik' || j.hook) return;
    if (n > 0 && jelenetek[n - 1].tipus === 'szamlalo') return;
    const sz = szamKeres(j.idx);
    if (sz) { j.tipus = 'szamlalo'; j.szam = sz; }
  });

  // ---- időzítés és események
  const BE = ['fel', 'balrol', 'zoom', 'jobbrol', 'maszk'];
  const events = [];
  const karaoke = brief.felirat === 'karaoke';
  const starts = jelenetek.map((j, n) => (n === 0 ? 0 : r2(Math.max(0, szavak[j.idx[0]].start - cfg.elore))));
  jelenetek.forEach((j, n) => {
    const start = starts[n];
    const end = n === jelenetek.length - 1 ? duration : r2(Math.min(duration, starts[n + 1] + cfg.atfedes));
    const dur = r2(end - start);
    const rel = (i) => r2(szavak[i].start - start);
    const be = j.hook ? 'zoom' : BE[n % BE.length];
    const atmenet = n > 0 && n % 3 === 0;
    const base = {start, dur, be, ...(atmenet ? {atmenet: true} : {})};
    if (j.tipus === 'kinetik') {
      const kiemel = j.hook || n % 2 === 0 ? kulcsszo(j.idx) : [];
      events.push({type: 'kinetik', ...base, ...(j.hook ? {hook: true} : {}), karaoke, kiemel, szavak: j.idx.map((i) => ({w: szavak[i].szo, t: rel(i)}))});
    } else if (j.tipus === 'szamlalo') {
      const tobbi = j.idx.filter((_, k) => k !== j.szam.k && !(j.szam.utotag === '%' && k === j.szam.k + 1));
      events.push({type: 'szamlalo', ...base, ertek: j.szam.ertek, ...(j.szam.utotag ? {utotag: j.szam.utotag} : {}), szavak: tobbi.map((i) => ({w: szavak[i].szo, t: rel(i)}))});
    } else if (j.tipus === 'felsorolas') {
      const szamosLista = j.elemek.filter((e) => { const v = szamErtek(szavak[e[0]].szo, nyelv); return v && v.ertek >= 2; }).length >= 2;
      const elemek = j.elemek.map((e) => {
        const ws = e.map((i) => tiszta(szavak[i].szo));
        while (ws.length > 1 && NEVELO.test(ws[0])) ws.shift();
        const v = szamErtek(ws[0], nyelv);
        if (v && (v.ertek >= 2 || szamosLista)) ws[0] = String(v.ertek) + (v.utotag || '');
        return {szoveg: nagy(ws.join(' ')), t: rel(e[0])};
      });
      events.push({type: 'felsorolas', ...base, elemek});
    } else if (j.tipus === 'cta') {
      const kimondott = j.idx.map((i) => szavak[i].szo).join(' ').replace(/[.…]+$/, '').trim();
      events.push({type: 'cta', ...base, szoveg: brief.cta || kimondott, gomb: nyelv === 'en' ? 'Follow' : 'Követés', ...(stilus.logo ? {logo: stilus.logo} : {})});
      j.feliratKell = !!brief.cta && brief.cta.toLowerCase() !== kimondott.toLowerCase();
    }
    if (j.tipus === 'felsorolas') j.feliratKell = true;
  });

  // ---- feliratsáv ott, ahol a kép nem mutatja a kimondott szavakat
  if (brief.felirat !== 'nincs') {
    jelenetek.forEach((j, n) => {
      if (!j.feliratKell) return;
      const ev = events[n];
      const ws = j.idx.slice().sort((a, b) => a - b);
      for (let k = 0; k < ws.length; k += 4) {
        const grp = ws.slice(k, k + 4);
        const a = Math.max(ev.start, szavak[grp[0]].start - 0.05);
        const b = k + 4 < ws.length ? szavak[ws[k + 4]].start - 0.05 : Math.min(ev.start + ev.dur, szavak[grp[grp.length - 1]].end + 0.4);
        if (b - a < 0.2) continue;
        events.push({type: 'felirat', start: r2(a), dur: r2(b - a), karaoke, szavak: grp.map((i) => ({w: szavak[i].szo, t: r2(szavak[i].start), e: r2(szavak[i].end)}))});
      }
    });
  }
  events.push({type: 'progress', start: 0, dur: duration});

  const {_info, ideiglenes, logo, bg, hatter, ...szinek} = stilus;
  return {
    width: cfg.width, height: cfg.height, fps: cfg.fps, duration,
    bg, hatter, safe: cfg.safe,
    theme: {primary: szinek.primary, secondary: szinek.secondary, accent: szinek.accent, style: szinek.style, font: szinek.font, szoveg: szinek.szoveg, halvany: szinek.halvany},
    events,
  };
}

export function planMd(brief, sahne) {
  const sor = (e) => {
    const szoveg = e.type === 'kinetik' ? e.szavak.map((s) => s.w).join(' ')
      : e.type === 'szamlalo' ? `${e.ertek}${e.utotag || ''} – ${(e.szavak || []).map((s) => s.w).join(' ')}`
      : e.type === 'felsorolas' ? e.elemek.map((x) => x.szoveg).join(' / ')
      : e.type === 'cta' ? e.szoveg : '';
    return `| ${e.start.toFixed(2)} | ${(e.start + e.dur).toFixed(2)} | ${e.type}${e.hook ? ' (kampó)' : ''} | ${e.be || ''}${e.atmenet ? ' + csík' : ''} | ${szoveg.replace(/\|/g, '/')} |`;
  };
  const fo = sahne.events.filter((e) => !['felirat', 'progress'].includes(e.type));
  return [
    `# Terv: ${brief.slug}`,
    '',
    `Hang: ${brief.hang} · beszédtempó: ${brief.beszedtempo} · vágási tempó: ${brief.vagasi_tempo} · stílus: ${brief.stilus} · felirat: ${brief.felirat} · hossz: ${sahne.duration} mp`,
    '',
    '| kezd | vége | jelenet | belépés | képernyőn |',
    '|---|---|---|---|---|',
    ...fo.map(sor),
    '',
    `Feliratsáv-darabok: ${sahne.events.filter((e) => e.type === 'felirat').length}`,
  ].join('\n');
}

// ---------------------------------------------------------------- parancssor
if (process.argv[1]?.endsWith('vazlat.mjs')) {
  const a = process.argv.slice(2);
  if (!a[0]) { console.log('Használat: node tools/vazlat.mjs <slug|brief.md> [--felulir]'); process.exit(1); }
  const brief = parseBrief(briefPath(a[0]));
  const dir = path.join('out', brief.slug);
  const ki = path.join(dir, 'sahne.json');
  if (fs.existsSync(ki) && !a.includes('--felulir')) { console.error(`${ki} már létezik (lehet, hogy kézzel javított). Felülíráshoz: --felulir`); process.exit(1); }
  const szavak = JSON.parse(fs.readFileSync(path.join(dir, 'szavak.json'), 'utf8'));
  const meta = JSON.parse(fs.readFileSync(path.join(dir, 'meta.json'), 'utf8'));
  const stilusok = JSON.parse(fs.readFileSync('ayarlar/stilusok.json', 'utf8'));
  const stilus = stilusok[brief.stilus];
  if (!stilus) { console.error(`Ismeretlen stílus: ${brief.stilus}. Elérhető: ${Object.keys(stilusok).filter((k) => !k.startsWith('_')).join(', ')}`); process.exit(1); }
  const cfg = JSON.parse(fs.readFileSync('ayarlar/reel.json', 'utf8'));
  const sahne = vazlat({brief, szavak, hossz: meta.hossz, stilus, cfg});
  fs.writeFileSync(ki, JSON.stringify(sahne, null, 1));
  fs.writeFileSync(path.join(dir, 'plan.md'), planMd(brief, sahne));
  console.log(`Vázlat: ${ki} (${sahne.events.length} esemény, ${sahne.duration} mp)\nTerv: ${path.join(dir, 'plan.md')}`);
}
