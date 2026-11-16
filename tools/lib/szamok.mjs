// Számok felismerése szövegben (számjegy vagy magyar / angol számnév).
const HU_EGY = {egy: 1, kettő: 2, ketto: 2, két: 2, ket: 2, három: 3, harom: 3, négy: 4, negy: 4, öt: 5, ot: 5, hat: 6, hét: 7, het: 7, nyolc: 8, kilenc: 9};
const HU_TIZ = {tíz: 10, tiz: 10, tizen: 10, húsz: 20, husz: 20, huszon: 20, harminc: 30, negyven: 40, ötven: 50, hatvan: 60, hetven: 70, nyolcvan: 80, kilencven: 90};
const EN = {one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, fifteen: 15, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90, hundred: 100, thousand: 1000};

// "negyvenöt" -> 45, "kétszáz" -> 200, "ezer" -> 1000. Ha nem teljes számnév: null.
function huSzamnev(w) {
  let s = w, total = 0, cur = 0, talalt = false;
  const egyez = (tabla) => {
    const k = Object.keys(tabla).sort((a, b) => b.length - a.length).find((x) => s.startsWith(x));
    if (!k) return null;
    s = s.slice(k.length);
    return tabla[k];
  };
  while (s.length) {
    if (s.startsWith('ezer')) { total += (cur || 1) * 1000; cur = 0; s = s.slice(4); talalt = true; continue; }
    if (s.startsWith('száz') || s.startsWith('szaz')) { cur = (cur || 1) * 100; s = s.slice(4); talalt = true; continue; }
    const t = egyez(HU_TIZ);
    if (t !== null) { cur += t; talalt = true; continue; }
    const e = egyez(HU_EGY);
    if (e !== null) { cur += e; talalt = true; continue; }
    return null;
  }
  return talalt ? total + cur : null;
}

// Egy szó számértéke + utótag (pl. "40%" -> {ertek: 40, utotag: '%'}), vagy null.
export function szamErtek(szo, nyelv = 'hu') {
  const w = szo.toLowerCase().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}%]+$/gu, '');
  if (!w) return null;
  const d = w.match(/^(\d+(?:[.,]\d+)?)(%|x)?$/);
  if (d) return {ertek: Number(d[1].replace(',', '.')), utotag: d[2] || ''};
  if (nyelv === 'en') return EN[w] !== undefined ? {ertek: EN[w], utotag: ''} : null;
  const v = huSzamnev(w);
  return v === null ? null : {ertek: v, utotag: ''};
}
