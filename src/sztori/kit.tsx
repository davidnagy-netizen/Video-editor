// Sztori-készlet: rajzfilmes, történetmesélő reelekhez (pl. „mi van, ha kilövünk egy golyót egy csőbe…”).
// Egy sztori = egy fájl a src/sztorik/ mappában, ami ezekből az elemekből épül fel.
// Koordináták: 1080×1920-as vászon, (0,0) a bal felső sarok. Idő: másodperc.
import React, {createContext, useContext} from 'react';
import {AbsoluteFill, Easing, Html5Audio, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {evolvePath, getLength, getPointAtLength, getTangentAtLength} from '@remotion/paths';

// ------------------------------------------------------------------ alapok
export type Szo = {w: string; t: number; e?: number};
export type Tema = {primary: string; secondary: string; accent: string; szoveg: string; halvany?: string; font?: string};
export type SztoriProps = {szavak: Szo[]; duration: number; theme: Tema; bg: string; safe: {fent: number; lent: number; oldal: number}};

const Ctx = createContext<SztoriProps | null>(null);
export const SztoriCtx = Ctx;
export const useSztori = () => useContext(Ctx)!;

/** Az aktuális idő másodpercben. */
export const useIdo = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  return f / fps;
};

const norm = (w: string) => w.toLowerCase().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');

/**
 * Szóidők a narrációból. ido('kilövünk') -> az első olyan szó kezdete, ami így kezdődik.
 * ido('golyót', 2) -> a második előfordulás. ido.vege('ránk') -> a szó vége.
 * Ha a szó nincs a narrációban, a render hibával áll le (így azonnal kiderül az elírás).
 */
export const useSzoIdo = () => {
  const {szavak} = useSztori();
  const keres = (minta: string, n = 1) => {
    const m = norm(minta);
    let k = 0;
    for (const s of szavak) if (norm(s.w).startsWith(m) && ++k === n) return s;
    throw new Error(`Sztori: a(z) "${minta}" (${n}.) szó nincs a narrációban. Elérhető szavak: ${szavak.map((s) => s.w).join(' ')}`);
  };
  const f = (minta: string, n = 1) => keres(minta, n).t;
  f.vege = (minta: string, n = 1) => { const s = keres(minta, n); return s.e ?? s.t + 0.3; };
  return f;
};

const CL = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const EASE = Easing.bezier(0.45, 0, 0.2, 1);

/** Időalapú átmenet: anim(t, [0.5, 1.2], [0, 1]). Alapból lágy (ease-in-out), határon kívül megáll. */
export const anim = (t: number, be: [number, number] | number[], ki: [number, number] | number[], ease: (x: number) => number = EASE) =>
  interpolate(t, be, ki, {...CL, easing: ease});

/** Rugós 0 -> 1 érték, t0-tól indul. pattogas: 0 (sima) … 1 (nagyon rugós). */
export const rugo = (t: number, t0: number, pattogas = 0.5, fps = 30) =>
  spring({frame: Math.round((t - t0) * fps), fps, config: {damping: 26 - 18 * pattogas, stiffness: 170, mass: 0.7}});

export const Ease = {lagy: EASE, gyorsul: Easing.in(Easing.cubic), lassul: Easing.out(Easing.cubic), linearis: (x: number) => x, ugras: Easing.out(Easing.back(1.8))};

// ------------------------------------------------------------------ jelenet, kamera
/** Teljes háttér a téma színével, finom mozgó fénnyel (a kép sosem áll meg). */
export const Hatter: React.FC<{szin?: string; folt?: string}> = ({szin, folt}) => {
  const {bg, theme} = useSztori();
  const t = useIdo();
  const x = 50 + 20 * Math.sin(t / 2.3), y = 40 + 15 * Math.cos(t / 2.9);
  return (
    <AbsoluteFill style={{background: szin ?? bg}}>
      <AbsoluteFill style={{background: `radial-gradient(70% 45% at ${x}% ${y}%, ${(folt ?? theme.primary)}26, transparent 70%)`}} />
    </AbsoluteFill>
  );
};

export type KameraKulcs = {t: number; x: number; y: number; z?: number; r?: number};
/**
 * Kamera: a világot úgy mozgatja, hogy a (x, y) pont kerüljön a kép közepére, z nagyítással.
 * kulcsok között lágyan mozog. razas: [{t, ero}] rázkódás (pl. lövésnél), ami gyorsan lecseng.
 */
export const Kamera: React.FC<{kulcsok: KameraKulcs[]; razas?: {t: number; ero?: number}[]; children: React.ReactNode}> = ({kulcsok, razas = [], children}) => {
  const t = useIdo();
  const {width, height} = useVideoConfig();
  const k = [...kulcsok].sort((a, b) => a.t - b.t);
  let x = k[0].x, y = k[0].y, z = k[0].z ?? 1, r = k[0].r ?? 0;
  for (let i = 0; i < k.length - 1; i++) {
    const a = k[i], b = k[i + 1];
    if (t >= a.t && t <= b.t) {
      const p = EASE((t - a.t) / Math.max(0.001, b.t - a.t));
      x = a.x + (b.x - a.x) * p; y = a.y + (b.y - a.y) * p;
      z = (a.z ?? 1) + ((b.z ?? 1) - (a.z ?? 1)) * p; r = (a.r ?? 0) + ((b.r ?? 0) - (a.r ?? 0)) * p;
    } else if (t > b.t) { x = b.x; y = b.y; z = b.z ?? 1; r = b.r ?? 0; }
  }
  let sx = 0, sy = 0;
  for (const s of razas) {
    const d = t - s.t;
    if (d >= 0 && d < 0.6) {
      const a = (s.ero ?? 1) * 28 * Math.exp(-d * 7);
      sx += a * Math.sin(d * 90); sy += a * Math.cos(d * 70);
    }
  }
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: 0, top: 0, width, height, transformOrigin: '0 0',
        transform: `translate(${width / 2 + sx}px, ${height / 2 + sy}px) rotate(${r}deg) scale(${z}) translate(${-x}px, ${-y}px)`}}>
        {children}
      </div>
    </AbsoluteFill>
  );
};

/** Elhelyezés: a gyerek középpontja (x, y)-ra kerül; s = méretarány, r = forgatás fokban, o = átlátszóság. */
export const Elem: React.FC<{x: number; y: number; s?: number; r?: number; o?: number; z?: number; children: React.ReactNode; flip?: boolean}> = ({x, y, s = 1, r = 0, o = 1, z, children, flip}) => (
  <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%, -50%) rotate(${r}deg) scale(${flip ? -s : s}, ${s})`, opacity: o, zIndex: z}}>
    {children}
  </div>
);

/** Pont és irány egy SVG útvonal mentén (p: 0..1). Mozgatáshoz: golyó a csőben. */
export const utMenten = (d: string, p: number) => {
  const L = getLength(d);
  const l = Math.max(0, Math.min(L, p * L));
  const pt = getPointAtLength(d, l) ?? {x: 0, y: 0};
  const tg = getTangentAtLength(d, l) ?? {x: 1, y: 0};
  return {x: pt.x, y: pt.y, szog: (Math.atan2(tg.y, tg.x) * 180) / Math.PI};
};

/**
 * Hangeffekt t másodpercnél. nev: beépített (loves, whoosh, whoosh_hosszu, pop, ding, bumm, csorrenes, karc, siker,
 * tik, boing, pecset) vagy a hangeffekt/ mappában lévő saját fájl neve kiterjesztés nélkül. db: hangerő (0 = eredeti, -6 = halkabb).
 */
export const Hang: React.FC<{nev: string; t: number; db?: number}> = ({nev, t, db = -4}) => {
  const {fps} = useVideoConfig();
  return (
    <Sequence from={Math.max(0, Math.round(t * fps))} layout="none">
      <Html5Audio src={staticFile('sfx/' + nev + '.wav')} volume={Math.pow(10, db / 20)} />
    </Sequence>
  );
};

// ------------------------------------------------------------------ szöveg
/** Nagy, rajzfilmes felirat, rugósan ugrik be t0-kor (és opcionálisan eltűnik t1-kor). */
export const Cim: React.FC<{x: number; y: number; t0: number; t1?: number; szoveg: string; meret?: number; szin?: string; kontur?: string; forgas?: number; szelesseg?: number}> = ({x, y, t0, t1, szoveg, meret = 110, szin, kontur, forgas = 0, szelesseg = 920}) => {
  const t = useIdo();
  const {theme} = useSztori();
  if (t < t0 - 0.05 || (t1 !== undefined && t > t1 + 0.2)) return null;
  const be = rugo(t, t0, 0.8);
  const ki = t1 === undefined ? 1 : anim(t, [t1, t1 + 0.2], [1, 0]);
  return (
    <Elem x={x} y={y} s={0.4 + 0.6 * be} r={forgas * be} o={Math.min(be * 1.5, ki)}>
      <div style={{width: szelesseg, textAlign: 'center', fontFamily: theme.font ?? 'Inter Display', fontWeight: 900, fontSize: meret, lineHeight: 1.02, letterSpacing: -0.02 * meret,
        color: szin ?? theme.szoveg, WebkitTextStroke: kontur ? `${meret * 0.06}px ${kontur}` : undefined, paintOrder: 'stroke fill', textShadow: `0 ${meret * 0.06}px 0 rgba(0,0,0,0.35)`}}>
        {szoveg}
      </div>
    </Elem>
  );
};

/** Szövegbuborék. farok: merre mutat (bal-le, jobb-le, bal-fel, jobb-fel). */
export const Buborek: React.FC<{x: number; y: number; t0: number; t1?: number; szoveg: string; meret?: number; farok?: 'bal-le' | 'jobb-le' | 'bal-fel' | 'jobb-fel'; szelesseg?: number}> = ({x, y, t0, t1, szoveg, meret = 54, farok = 'bal-le', szelesseg = 520}) => {
  const t = useIdo();
  const {theme} = useSztori();
  if (t < t0 - 0.05 || (t1 !== undefined && t > t1 + 0.2)) return null;
  const be = rugo(t, t0, 0.9);
  const ki = t1 === undefined ? 1 : anim(t, [t1, t1 + 0.2], [1, 0]);
  const fx = farok.startsWith('bal') ? '18%' : '82%';
  const le = farok.endsWith('le');
  return (
    <Elem x={x} y={y} s={be} o={ki}>
      <div style={{position: 'relative', width: szelesseg, background: '#ffffff', color: '#111111', borderRadius: 40, padding: '28px 36px', fontFamily: theme.font ?? 'Inter Display', fontWeight: 800, fontSize: meret, lineHeight: 1.12, textAlign: 'center', boxShadow: '0 12px 0 rgba(0,0,0,0.25)'}}>
        {szoveg}
        <div style={{position: 'absolute', left: fx, [le ? 'bottom' : 'top']: -34, width: 0, height: 0, borderLeft: '22px solid transparent', borderRight: '22px solid transparent', [le ? 'borderTop' : 'borderBottom']: '40px solid #ffffff', transform: 'translateX(-50%)'} as React.CSSProperties} />
      </div>
    </Elem>
  );
};

/** Karaoke feliratsáv alul (a biztonsági zónán belül), a narráció szavaiból automatikusan. */
export const Felirat: React.FC<{karaoke?: boolean; szoMax?: number}> = ({karaoke = true, szoMax = 4}) => {
  const {szavak, safe, theme} = useSztori();
  const t = useIdo();
  const {width} = useVideoConfig();
  // darabolás: szünetnél vagy írásjelnél vagy szoMax szónál új sor
  const darabok: Szo[][] = [];
  let cur: Szo[] = [];
  szavak.forEach((s, i) => {
    cur.push(s);
    const kov = szavak[i + 1];
    const szunet = kov ? kov.t - (s.e ?? s.t) > 0.35 : true;
    if (cur.length >= szoMax || /[.!?,;:…]$/.test(s.w) || szunet) { darabok.push(cur); cur = []; }
  });
  if (cur.length) darabok.push(cur);
  const akt = darabok.find((d, i) => {
    const a = d[0].t - 0.08;
    const b = darabok[i + 1] ? darabok[i + 1][0].t - 0.08 : (d[d.length - 1].e ?? d[d.length - 1].t) + 0.6;
    return t >= a && t < b;
  });
  if (!akt) return null;
  const tiszta = (w: string) => w.replace(/^[„"'(]+|[”"'),.;:]+$/g, '');
  return (
    <div style={{position: 'absolute', left: safe.oldal, right: safe.oldal, bottom: safe.lent, display: 'flex', justifyContent: 'center', zIndex: 100}}>
      <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', columnGap: 16, padding: '14px 28px', borderRadius: 18, background: 'rgba(0,0,0,0.6)', fontFamily: 'Inter Display', fontWeight: 800, fontSize: 56 * (width / 1100), color: '#fff', textAlign: 'center'}}>
        {akt.map((s, i) => {
          const aktiv = karaoke && t >= s.t && t < (s.e ?? s.t + 0.4);
          return <span key={i} style={{color: aktiv ? theme.primary : '#fff', display: 'inline-block', transform: `scale(${aktiv ? 1.06 : 1})`}}>{tiszta(s.w)}</span>;
        })}
      </div>
    </div>
  );
};

// ------------------------------------------------------------------ effektek
/** Fehér villanás (lövés, becsapódás). */
export const Villanas: React.FC<{t0: number; ero?: number; szin?: string}> = ({t0, ero = 0.85, szin = '#ffffff'}) => {
  const t = useIdo();
  const o = t < t0 ? 0 : ero * Math.exp(-(t - t0) * 9);
  if (o < 0.01) return null;
  return <AbsoluteFill style={{background: szin, opacity: o, zIndex: 90}} />;
};

/** Képregényes robbanás-csillag szöveggel (BUMM!, BANG!). */
export const Bumm: React.FC<{x: number; y: number; t0: number; szoveg?: string; meret?: number; szin?: string; tartam?: number}> = ({x, y, t0, szoveg = 'BUMM!', meret = 1, szin, tartam = 0.9}) => {
  const t = useIdo();
  const {theme} = useSztori();
  if (t < t0 || t > t0 + tartam + 0.2) return null;
  const be = rugo(t, t0, 1);
  const ki = anim(t, [t0 + tartam, t0 + tartam + 0.2], [1, 0]);
  const pont = (n: number, R: number, r: number) => Array.from({length: n * 2}, (_, i) => {
    const a = (Math.PI * i) / n - Math.PI / 2;
    const rr = i % 2 ? r : R;
    return `${200 + rr * Math.cos(a)},${200 + rr * Math.sin(a)}`;
  }).join(' ');
  return (
    <Elem x={x} y={y} s={meret * (0.3 + 0.7 * be)} r={-8 + 6 * Math.sin(t * 20)} o={ki} z={50}>
      <svg width={400} height={400} viewBox="0 0 400 400" style={{overflow: 'visible'}}>
        <polygon points={pont(12, 190, 120)} fill={szin ?? theme.accent} stroke="#111" strokeWidth={10} strokeLinejoin="round" />
        <polygon points={pont(12, 140, 95)} fill="#ffffff" />
        <text x={200} y={222} textAnchor="middle" fontFamily="Inter Display" fontWeight={900} fontSize={84} fill="#111" transform="rotate(-6 200 200)">{szoveg}</text>
      </svg>
    </Elem>
  );
};

/** Sebességvonalak egy irányba (fok). */
export const SebessegVonalak: React.FC<{x: number; y: number; t0: number; t1: number; irany?: number; hossz?: number; szin?: string}> = ({x, y, t0, t1, irany = 180, hossz = 260, szin = '#ffffff'}) => {
  const t = useIdo();
  if (t < t0 || t > t1) return null;
  const o = Math.min(anim(t, [t0, t0 + 0.08], [0, 0.9]), anim(t, [t1 - 0.1, t1], [0.9, 0]));
  return (
    <Elem x={x} y={y} r={irany} o={o} z={5}>
      <svg width={hossz * 2} height={220} viewBox={`0 0 ${hossz * 2} 220`}>
        {[20, 60, 100, 140, 180].map((yy, i) => {
          const off = ((t * 1400 + i * 97) % (hossz * 2));
          return <line key={i} x1={off} y1={yy} x2={off + hossz * (0.35 + 0.15 * (i % 3))} y2={yy} stroke={szin} strokeWidth={8} strokeLinecap="round" />;
        })}
      </svg>
    </Elem>
  );
};

/** Füstpamacs (lövés után, becsapódásnál). */
export const Fust: React.FC<{x: number; y: number; t0: number; meret?: number}> = ({x, y, t0, meret = 1}) => {
  const t = useIdo();
  const d = t - t0;
  if (d < 0 || d > 1.4) return null;
  return (
    <Elem x={x} y={y} s={meret} z={4}>
      <svg width={300} height={300} viewBox="0 0 300 300" style={{overflow: 'visible'}}>
        {[[150, 150, 60], [100, 120, 45], [200, 130, 50], [130, 90, 40], [180, 190, 42]].map(([cx, cy, r], i) => (
          <circle key={i} cx={cx + d * 40 * (i - 2)} cy={cy - d * 70} r={r * (0.5 + d)} fill="#E8ECF2" opacity={Math.max(0, 0.85 - d * 0.65)} />
        ))}
      </svg>
    </Elem>
  );
};

/** Konfetti eső t0-tól. */
export const Konfetti: React.FC<{t0: number; db?: number}> = ({t0, db = 70}) => {
  const t = useIdo();
  const {theme} = useSztori();
  const {width, height} = useVideoConfig();
  const d = t - t0;
  if (d < 0 || d > 3.5) return null;
  const szinek = [theme.primary, theme.accent, '#ffffff', '#FF5A7A', '#7C5CFF'];
  return (
    <AbsoluteFill style={{zIndex: 60, pointerEvents: 'none'}}>
      {Array.from({length: db}, (_, i) => {
        const r1 = Math.sin(i * 12.9898) * 43758.5453 % 1, r2 = Math.sin(i * 78.233) * 12345.678 % 1;
        const x = Math.abs(r1) * width + Math.sin(d * 3 + i) * 40;
        const y = -60 + d * (700 + Math.abs(r2) * 600) - 200 * Math.abs(r2);
        if (y > height + 50) return null;
        return <div key={i} style={{position: 'absolute', left: x, top: y, width: 18, height: 30, background: szinek[i % szinek.length], transform: `rotate(${d * 400 + i * 37}deg)`, borderRadius: 4}} />;
      })}
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ kellékek (SVG)
const KONTUR = '#111827';

/** Rajzfilmes pisztoly, jobbra néz. A cső vége a középponthoz képest kb. (+150, -55)·s. visszarug: lövés ideje (hátralökés). */
export const Pisztoly: React.FC<{s?: number; visszarug?: number}> = ({s = 1, visszarug}) => {
  const t = useIdo();
  const d = visszarug === undefined ? 1 : t - visszarug;
  const hatra = d >= 0 && d < 0.4 ? -30 * Math.exp(-d * 10) : 0;
  const forg = d >= 0 && d < 0.4 ? -14 * Math.exp(-d * 9) : 0;
  return (
    <svg width={340 * s} height={220 * s} viewBox="0 0 340 220" style={{overflow: 'visible', transform: `translateX(${hatra * s}px) rotate(${forg}deg)`, transformOrigin: '30% 70%'}}>
      <g stroke={KONTUR} strokeWidth={8} strokeLinejoin="round">
        <path d="M70 70 L120 70 L110 210 L40 210 Z" fill="#3B4252" />
        <path d="M78 95 L108 95 M75 125 L105 125 M72 155 L102 155" stroke="#2A303C" strokeWidth={6} />
        <path d="M120 100 Q150 100 150 130 Q150 150 130 150 L118 150" fill="none" />
        <rect x={30} y={30} width={290} height={62} rx={14} fill="#9AA7B8" />
        <rect x={30} y={30} width={290} height={22} rx={10} fill="#C9D3DF" stroke="none" />
        <rect x={300} y={38} width={34} height={44} rx={6} fill="#5B6778" />
        <path d="M60 40 L60 82 M85 40 L85 82 M110 40 L110 82" stroke="#7A8798" strokeWidth={6} />
      </g>
    </svg>
  );
};

/** Golyó (jobbra néz). arc: szemek és mosoly — az „okos golyó”. szemuveg: 0..1, felülről ráesik a szemüveg (okos!). */
export const Golyo: React.FC<{s?: number; arc?: boolean; kacsint?: boolean; szemuveg?: number}> = ({s = 1, arc = true, kacsint, szemuveg = 0}) => {
  const t = useIdo();
  const pislog = arc && (t % 2.6) < 0.12;
  return (
    <svg width={170 * s} height={74 * s} viewBox="0 0 170 74" style={{overflow: 'visible'}}>
      <g stroke={KONTUR} strokeWidth={6} strokeLinejoin="round">
        <rect x={4} y={10} width={88} height={54} rx={8} fill="#E2A93B" />
        <rect x={4} y={10} width={88} height={16} rx={6} fill="#F4C766" stroke="none" />
        <path d="M92 10 L112 10 Q166 22 166 37 Q166 52 112 64 L92 64 Z" fill="#C8763A" />
        <path d="M100 16 Q140 24 152 32" stroke="#E9A06A" strokeWidth={5} fill="none" />
      </g>
      {arc ? (
        <g>
          {pislog || kacsint ? <path d="M38 32 Q46 28 54 32" stroke={KONTUR} strokeWidth={5} fill="none" strokeLinecap="round" /> : <ellipse cx={46} cy={31} rx={7} ry={9} fill={KONTUR} />}
          {pislog ? <path d="M64 32 Q72 28 80 32" stroke={KONTUR} strokeWidth={5} fill="none" strokeLinecap="round" /> : <ellipse cx={72} cy={31} rx={7} ry={9} fill={KONTUR} />}
          <path d="M44 46 Q60 58 78 46" stroke={KONTUR} strokeWidth={5} fill="none" strokeLinecap="round" />
        </g>
      ) : null}
      {szemuveg > 0 ? (
        <g transform={`translate(0 ${-60 * (1 - szemuveg)})`} opacity={Math.min(1, szemuveg * 2)}>
          <circle cx={46} cy={31} r={14} fill="rgba(180,220,255,0.35)" stroke={KONTUR} strokeWidth={5} />
          <circle cx={76} cy={31} r={14} fill="rgba(180,220,255,0.35)" stroke={KONTUR} strokeWidth={5} />
          <path d="M60 30 L62 30 M32 28 L14 22" stroke={KONTUR} strokeWidth={5} strokeLinecap="round" />
        </g>
      ) : null}
    </svg>
  );
};

/** Cső egy SVG útvonal mentén (világkoordinátában). rajzol: 0..1 mennyi látszik belőle (felépülés). */
export const Cso: React.FC<{d: string; vastag?: number; rajzol?: number; szin?: string; z?: number}> = ({d, vastag = 90, rajzol = 1, szin = '#8FA1B5', z = 2}) => {
  const {width, height} = useVideoConfig();
  const ev = evolvePath(Math.max(0.0001, rajzol), d);
  const csik = {strokeDasharray: ev.strokeDasharray, strokeDashoffset: ev.strokeDashoffset};
  const veg = rajzol >= 0.999;
  const L = getLength(d);
  const a = getPointAtLength(d, 0) ?? {x: 0, y: 0}, b = getPointAtLength(d, L * rajzol) ?? {x: 0, y: 0};
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', zIndex: z}}>
      <path d={d} fill="none" stroke={KONTUR} strokeWidth={vastag + 16} strokeLinecap="butt" strokeLinejoin="round" {...csik} />
      <path d={d} fill="none" stroke={szin} strokeWidth={vastag} strokeLinecap="butt" strokeLinejoin="round" {...csik} />
      <path d={d} fill="none" stroke="#ffffff" strokeOpacity={0.35} strokeWidth={vastag * 0.18} strokeLinecap="butt" strokeLinejoin="round" transform={`translate(0 ${-vastag * 0.22})`} {...csik} />
      <circle cx={a.x} cy={a.y} r={vastag * 0.62} fill={szin} stroke={KONTUR} strokeWidth={8} />
      {veg ? <circle cx={b.x} cy={b.y} r={vastag * 0.62} fill={szin} stroke={KONTUR} strokeWidth={8} /> : null}
      {veg ? <circle cx={b.x} cy={b.y} r={vastag * 0.38} fill="#1F2937" /> : null}
    </svg>
  );
};

/** Rajzfilmfigura. arc: normal | meglepett | ijedt | boldog | ravasz. ing: ingszín. */
export const Figura: React.FC<{s?: number; arc?: 'normal' | 'meglepett' | 'ijedt' | 'boldog' | 'ravasz'; ing?: string; integet?: boolean}> = ({s = 1, arc = 'normal', ing, integet}) => {
  const t = useIdo();
  const {theme} = useSztori();
  const remeg = arc === 'ijedt' ? Math.sin(t * 60) * 3 : 0;
  const kar = integet ? Math.sin(t * 9) * 20 : 0;
  const szem = arc === 'meglepett' || arc === 'ijedt' ? 16 : 11;
  return (
    <svg width={240 * s} height={420 * s} viewBox="0 0 240 420" style={{overflow: 'visible', transform: `translateX(${remeg}px)`}}>
      <g stroke={KONTUR} strokeWidth={8} strokeLinejoin="round" strokeLinecap="round">
        <path d="M70 250 L60 400 M170 250 L180 400" fill="none" strokeWidth={22} stroke="#1F2937" />
        <rect x={50} y={170} width={140} height={120} rx={50} fill={ing ?? theme.primary} />
        <path d={`M55 200 Q20 240 30 ${280 - kar}`} fill="none" strokeWidth={20} stroke={ing ?? theme.primary} />
        <path d={`M185 200 Q225 ${220 - kar} ${215 + kar * 0.3} ${150 - kar}`} fill="none" strokeWidth={20} stroke={ing ?? theme.primary} />
        <circle cx={120} cy={100} r={78} fill="#F2C8A0" />
        <path d="M48 80 Q60 20 120 22 Q182 20 194 80 Q160 52 120 56 Q80 52 48 80 Z" fill="#3B2A20" />
      </g>
      <ellipse cx={92} cy={104} rx={szem * 0.8} ry={szem} fill={KONTUR} />
      <ellipse cx={148} cy={104} rx={szem * 0.8} ry={szem} fill={KONTUR} />
      {arc === 'ravasz' ? <path d="M76 86 L108 94 M164 86 L132 94" stroke={KONTUR} strokeWidth={7} strokeLinecap="round" /> : null}
      {arc === 'meglepett' || arc === 'ijedt' ? <ellipse cx={120} cy={146} rx={16} ry={20} fill={KONTUR} />
        : arc === 'boldog' ? <path d="M88 134 Q120 170 152 134 Z" fill={KONTUR} />
        : arc === 'ravasz' ? <path d="M96 142 Q130 156 150 136" stroke={KONTUR} strokeWidth={7} fill="none" strokeLinecap="round" />
        : <path d="M100 142 Q120 152 140 142" stroke={KONTUR} strokeWidth={7} fill="none" strokeLinecap="round" />}
      {arc === 'ijedt' ? <path d="M196 60 Q210 85 196 96 Q182 85 196 60 Z" fill="#7FC8FF" stroke={KONTUR} strokeWidth={4} /> : null}
    </svg>
  );
};

/** Laptop, a képernyőn vállalatirányítási irányítópulttal (oszlopok nőnek t0-tól). felirat: a képernyő fejléce. */
export const Laptop: React.FC<{s?: number; t0?: number; felirat?: string}> = ({s = 1, t0 = 0, felirat = 'Irányítópult'}) => {
  const t = useIdo();
  const {theme} = useSztori();
  const p = (i: number) => anim(t, [t0 + 0.1 * i, t0 + 0.1 * i + 0.6], [0, 1], Ease.lassul);
  const bars = [0.45, 0.7, 0.55, 0.85, 0.95];
  return (
    <svg width={560 * s} height={380 * s} viewBox="0 0 560 380" style={{overflow: 'visible'}}>
      <g stroke={KONTUR} strokeWidth={8} strokeLinejoin="round">
        <rect x={60} y={10} width={440} height={290} rx={20} fill="#1F2937" />
        <rect x={80} y={30} width={400} height={250} rx={8} fill="#F8FAFC" />
        <path d="M10 300 L550 300 L520 350 L40 350 Z" fill="#9AA7B8" />
      </g>
      <rect x={80} y={30} width={400} height={44} fill={theme.primary} />
      <text x={100} y={60} fontFamily="Inter Display" fontWeight={800} fontSize={24} fill="#0E1726">{felirat}</text>
      {bars.map((h, i) => (
        <rect key={i} x={110 + i * 62} y={260 - 150 * h * p(i)} width={40} height={150 * h * p(i)} rx={6} fill={i === 4 ? theme.accent : '#94A3B8'} />
      ))}
      <path d={`M110 ${200 - 40 * p(0)} L172 ${180 - 50 * p(1)} L234 ${190 - 40 * p(2)} L296 ${150 - 50 * p(3)} L358 ${120 - 50 * p(4)}`} stroke={theme.primary} strokeWidth={6} fill="none" opacity={p(4)} />
    </svg>
  );
};

/** Iroda/székház táblával (pl. AETHERPONTIS). Az ablakok t0-tól kigyulladnak. */
export const Iroda: React.FC<{s?: number; tabla?: string; t0?: number; logo?: string}> = ({s = 1, tabla = 'AETHERPONTIS', t0 = 0, logo}) => {
  const t = useIdo();
  const {theme} = useSztori();
  return (
    <svg width={420 * s} height={560 * s} viewBox="0 0 420 560" style={{overflow: 'visible'}}>
      <g stroke={KONTUR} strokeWidth={8} strokeLinejoin="round">
        <rect x={40} y={110} width={340} height={440} rx={10} fill="#334155" />
        <rect x={20} y={40} width={380} height={86} rx={16} fill={theme.primary} />
        <rect x={170} y={450} width={80} height={100} rx={6} fill="#1F2937" />
      </g>
      {logo ? <image href={staticFile('m/' + logo)} x={40} y={50} width={340} height={66} preserveAspectRatio="xMidYMid meet" />
        : <text x={210} y={98} textAnchor="middle" fontFamily="Inter Display" fontWeight={900} fontSize={tabla.length > 10 ? 40 : 52} letterSpacing={2} fill="#0E1726">{tabla}</text>}
      {Array.from({length: 12}, (_, i) => {
        const on = t > t0 + i * 0.06;
        return <rect key={i} x={75 + (i % 3) * 100} y={150 + Math.floor(i / 3) * 72} width={70} height={48} rx={6} fill={on ? '#FDE68A' : '#1E293B'} stroke={KONTUR} strokeWidth={5} />;
      })}
    </svg>
  );
};

/** Pecsét, ami t0-kor lecsapódik (pl. INGYENES PRÓBA). */
export const Pecset: React.FC<{x: number; y: number; t0: number; szoveg?: string; szin?: string; forgas?: number; meret?: number}> = ({x, y, t0, szoveg = 'INGYENES', szin = '#E11D48', forgas = -12, meret = 1}) => {
  const t = useIdo();
  if (t < t0) return null;
  const d = t - t0;
  const sc = d < 0.12 ? 2.6 - 1.6 * (d / 0.12) : 1 + 0.06 * Math.exp(-(d - 0.12) * 12) * Math.sin((d - 0.12) * 40);
  return (
    <Elem x={x} y={y} s={sc * meret} r={forgas} o={Math.min(1, d / 0.06)} z={40}>
      <div style={{border: `12px solid ${szin}`, color: szin, borderRadius: 22, padding: '14px 34px', fontFamily: 'Inter Display', fontWeight: 900, fontSize: 92, letterSpacing: 4, whiteSpace: 'nowrap', background: 'rgba(255,255,255,0.92)'}}>{szoveg}</div>
    </Elem>
  );
};

/** CTA gomb pulzálással. */
export const Gomb: React.FC<{x: number; y: number; t0: number; szoveg: string}> = ({x, y, t0, szoveg}) => {
  const t = useIdo();
  const {theme} = useSztori();
  if (t < t0) return null;
  const be = rugo(t, t0, 0.8);
  const pulse = 1 + 0.05 * Math.sin((t - t0) * 7);
  return (
    <Elem x={x} y={y} s={be * pulse} z={45}>
      <div style={{background: theme.primary, color: '#0E1726', borderRadius: 999, padding: '34px 70px', fontFamily: 'Inter Display', fontWeight: 900, fontSize: 66, whiteSpace: 'nowrap', boxShadow: '0 14px 0 rgba(0,0,0,0.3)', border: `8px solid ${KONTUR}`}}>
        {szoveg} <span style={{display: 'inline-block', transform: `translateX(${10 * Math.sin((t - t0) * 9)}px)`}}>→</span>
      </div>
    </Elem>
  );
};

/** Kép a materyal/ vagy marka/ mappából (render előtt a public/m/ alá másolódik). */
export const Kep: React.FC<{fajl: string; szelesseg: number}> = ({fajl, szelesseg}) => <Img src={staticFile('m/' + fajl)} style={{width: szelesseg}} />;
