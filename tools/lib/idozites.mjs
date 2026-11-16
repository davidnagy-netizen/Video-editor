// Szószintű időzítés: a script szavai -> a felolvasott szöveg karakterei -> idők.
// A felirat és a jelenetek mindig a SCRIPT szavait használják, a hangszolgáltató csak az időket adja.

const PUNCT = /^[\s"'„”“«»()\[\]{}.,;:!?…–—-]+|[\s"'„”“«»()\[\]{}.,;:!?…–—-]+$/g;
export const mag = (tok) => tok.replace(PUNCT, '');

// A script szavaiból felépíti a felolvasandó szöveget (KIEJTÉS cserékkel),
// és minden script-szóhoz megjegyzi, melyik karaktertartomány tartozik hozzá.
export function felolvasando(script, kiejtes = {}) {
  const tokens = script.split(/\s+/).filter(Boolean);
  const kulcsok = Object.fromEntries(Object.entries(kiejtes).map(([k, v]) => [k.toLowerCase(), v]));
  const parts = [];
  const spans = [];
  let pos = 0;
  tokens.forEach((tok, i) => {
    const core = mag(tok);
    let piece = tok;
    const csere = kulcsok[core.toLowerCase()];
    if (core && csere) piece = tok.replace(core, csere);
    if (i > 0) pos += 1; // szóköz
    spans.push([pos, pos + piece.length]);
    parts.push(piece);
    pos += piece.length;
  });
  return {tokens, tts: parts.join(' '), spans};
}

// Karakteridőkből szóidők. start/end: karakterenkénti tömbök (NaN ahol ismeretlen).
export function szavakKarakterekbol(tokens, spans, start, end, osszHossz) {
  const out = tokens.map((tok, i) => {
    const [a, b] = spans[i];
    let s = Infinity, e = -Infinity;
    for (let c = a; c < b; c++) {
      if (Number.isFinite(start[c])) s = Math.min(s, start[c]);
      if (Number.isFinite(end[c])) e = Math.max(e, end[c]);
    }
    return {szo: tok, start: Number.isFinite(s) ? s : NaN, end: Number.isFinite(e) ? e : NaN};
  });
  // hiányzó értékek kitöltése a szomszédokból
  for (let i = 0; i < out.length; i++) {
    if (Number.isFinite(out[i].start)) continue;
    let j = i - 1; while (j >= 0 && !Number.isFinite(out[j].end)) j--;
    let k = i + 1; while (k < out.length && !Number.isFinite(out[k].start)) k++;
    const t0 = j >= 0 ? out[j].end : 0;
    const t1 = k < out.length ? out[k].start : osszHossz;
    const n = k - j - 1;
    for (let q = j + 1; q < k; q++) {
      const r = (q - j - 1) / n;
      out[q].start = t0 + (t1 - t0) * r;
      out[q].end = t0 + (t1 - t0) * (r + 1 / n);
    }
    i = k - 1;
  }
  for (const w of out) {
    if (!Number.isFinite(w.end) || w.end < w.start) w.end = w.start + 0.2;
    w.start = Math.round(w.start * 1000) / 1000;
    w.end = Math.round(w.end * 1000) / 1000;
  }
  return out;
}

// Szóhatár-listából (pl. edge-tts WordBoundary: {text, start, end}) karakteridők.
export function karakterekHatarokbol(tts, hatarok) {
  const start = new Array(tts.length).fill(NaN);
  const end = new Array(tts.length).fill(NaN);
  let cur = 0;
  for (const h of hatarok) {
    const t = (h.text || '').trim();
    if (!t) continue;
    const idx = tts.indexOf(t, cur);
    if (idx < 0 || idx - cur > 60) continue; // nem találtuk a közelben: kihagyjuk, a kitöltés pótolja
    for (let c = idx; c < idx + t.length; c++) { start[c] = h.start; end[c] = h.end; }
    cur = idx + t.length;
  }
  return {start, end};
}

// Becslés: egy szakasz (mondat) idejét a karakterek között arányosan osztja el.
// Írásjelek utáni szünet nagyobb súlyt kap. Csak tesztelésre / tartaléknak.
export function karakterekBecsles(tts, szakaszok) {
  const start = new Array(tts.length).fill(NaN);
  const end = new Array(tts.length).fill(NaN);
  for (const {a, b, t0, t1} of szakaszok) {
    const suly = [];
    for (let c = a; c < b; c++) {
      const ch = tts[c];
      suly.push(/[,;:]/.test(ch) ? 4 : /[.!?…]/.test(ch) ? 6 : ch === ' ' ? 0.6 : 1);
    }
    const ossz = suly.reduce((x, y) => x + y, 0) || 1;
    let t = t0;
    for (let c = a; c < b; c++) {
      const d = ((t1 - t0) * suly[c - a]) / ossz;
      start[c] = t; end[c] = t + d; t += d;
    }
  }
  return {start, end};
}

// Mondatokra bontás a felolvasandó szövegben (karaktertartományok)
export function mondatok(tts) {
  const out = [];
  const re = /[^.!?…]+[.!?…]*["”»]?\s*/g;
  let m;
  while ((m = re.exec(tts))) {
    const txt = m[0];
    if (!txt.trim()) continue;
    const lead = txt.length - txt.trimStart().length;
    out.push({a: m.index + lead, b: m.index + txt.trimEnd().length, szoveg: txt.trim()});
  }
  return out;
}
