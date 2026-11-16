// Brief beolvasása: materyaller/<slug>/brief.md
// Formátum: YAML-szerű fejléc (--- ... ---), utána SCRIPT:, KIEJTÉS:, MEGJEGYZÉS: szakaszok.
import fs from 'node:fs';
import path from 'node:path';

const ALAP = {
  nyelv: 'hu',
  hang: 'noemi',
  beszedtempo: 1.0,
  vagasi_tempo: 'kozepes',
  stilus: 'aetherpontis',
  felirat: 'karaoke',
  zene: 'nincs',
  zene_db: -24,
  cta: '',
  mod: 'auto',
  hangeffekt: 'igen',
};

const tisztit = (v) => {
  v = v.replace(/\s+#.*$/, '').trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  return v;
};

export function parseBrief(file) {
  const raw = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  const meta = {};
  let body = raw;
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  if (m) {
    body = raw.slice(m[0].length);
    for (const line of m[1].split('\n')) {
      const mm = line.match(/^\s*([A-Za-z_áéíóöőúüűÁÉÍÓÖŐÚÜŰ]+)\s*:\s*(.*)$/);
      if (mm) meta[mm[1].toLowerCase()] = tisztit(mm[2]);
    }
  }
  // szakaszok
  const szakasz = {};
  let cur = null;
  for (const line of body.split('\n')) {
    const h = line.match(/^\s*(SCRIPT|KIEJTÉS|KIEJTES|MEGJEGYZÉS|MEGJEGYZES)\s*:\s*(#.*)?$/i);
    if (h) { cur = h[1].toUpperCase().replace('É', 'E'); szakasz[cur] = []; continue; }
    if (cur) szakasz[cur].push(line);
  }
  const script = (szakasz.SCRIPT || []).join('\n').trim();
  if (!script) throw new Error(`A briefben nincs SCRIPT: szakasz vagy üres (${file})`);
  const kiejtes = {};
  for (const l of szakasz.KIEJTES || []) {
    const k = l.match(/^\s*(.+?)\s*=\s*(.+?)\s*$/);
    if (k && !k[1].startsWith('#')) kiejtes[k[1]] = k[2];
  }
  const o = {...ALAP, ...meta};
  o.beszedtempo = Number(o.beszedtempo) || 1;
  o.zene_db = Number(o.zene_db) || -24;
  o.slug = o.cim || path.basename(path.dirname(file));
  o.script = script;
  o.kiejtes = kiejtes;
  o.megjegyzes = (szakasz.MEGJEGYZES || []).join('\n').trim();
  o.mappa = path.dirname(file);
  // mely mezők jöttek alapértékből (riporthoz)
  o.alapertelmezett = Object.keys(ALAP).filter((k) => meta[k] === undefined && !(k === 'zene_db' && o.zene === 'nincs') && k !== 'mod');
  return o;
}

export const briefPath = (slugOrPath) =>
  slugOrPath.endsWith('.md') ? slugOrPath : path.join('materyaller', slugOrPath, 'brief.md');
