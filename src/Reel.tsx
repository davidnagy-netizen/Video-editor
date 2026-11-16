import React from 'react';
import {AbsoluteFill, Html5Audio, Img, Sequence, continueRender, delayRender, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {BoxProvider} from './box';
import {One} from './Overlay';
import {Ev} from './types';
import {readable, SafeCtx} from './theme';
import {CtaEv, FeliratEv, FelsorolasEv, KinetikEv, REv, ReelProps, ReelTheme, SzamlaloEv, Szo, Belepes} from './reelTypes';

// ------------------------------------------------------------------ betűtípusok (public/fonts, OFL licenc)
const FONTS: [string, string, string][] = [
  ['Inter Display', 'InterDisplay-SemiBold.otf', '600'],
  ['Inter Display', 'InterDisplay-Bold.otf', '700'],
  ['Inter Display', 'InterDisplay-ExtraBold.otf', '800'],
  ['Inter Display', 'InterDisplay-Black.otf', '900'],
  ['Inter', 'Inter-Medium.otf', '500'],
  ['Inter', 'Inter-SemiBold.otf', '600'],
];
if (typeof document !== 'undefined' && typeof FontFace !== 'undefined') {
  const h = delayRender('Betűtípusok betöltése');
  Promise.all(FONTS.map(([fam, file, weight]) => new FontFace(fam, `url(${staticFile('fonts/' + file)})`, {weight}).load().then((f) => document.fonts.add(f))))
    .then(() => continueRender(h))
    .catch((e) => { console.error('Betűtípus hiba', e); continueRender(h); });
}

const CL = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const tisztaSzo = (w: string) => w.replace(/^[\s"'„”“«»(]+|[\s"'„”“«»),.;:]+$/g, '');
const kulcs = (w: string) => tisztaSzo(w).replace(/[?!…]+$/, '').toLowerCase();

type Ctx = {theme: ReelTheme; u: number; W: number; H: number; safe: {fent: number; lent: number; oldal: number}};
const RCtx = React.createContext<Ctx | null>(null);
const useR = () => React.useContext(RCtx)!;

// ------------------------------------------------------------------ belépés / kilépés
const useMozgas = (dur: number, be: Belepes = 'fel') => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {u, W} = useR();
  const inn = spring({frame, fps, config: {damping: 15, stiffness: 150, mass: 0.7}});
  const op = interpolate(frame, [0, 6], [0, 1], CL);
  const out = interpolate(frame, [dur - Math.round(fps * 0.25), dur], [1, 0], CL);
  let transform = '';
  let clipPath: string | undefined;
  if (be === 'fel') transform = `translateY(${(1 - inn) * 140 * u}px)`;
  if (be === 'zoom') transform = `scale(${0.72 + 0.28 * inn})`;
  if (be === 'balrol') transform = `translateX(${-(1 - inn) * W * 0.7}px)`;
  if (be === 'jobbrol') transform = `translateX(${(1 - inn) * W * 0.7}px)`;
  if (be === 'maszk') clipPath = `inset(${Math.max(0, (1 - inn) * 100)}% 0 0 0)`;
  transform += ` translateY(${-(1 - out) * 50 * u}px) scale(${1 - (1 - out) * 0.05})`;
  return {style: {opacity: Math.min(op, out), transform, clipPath} as React.CSSProperties, frame, fps};
};

// Gyors színes csík, ami átsöpör a képen a jelenet elején (jelenetváltás)
const Csik: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {theme, W, H} = useR();
  const p = interpolate(frame, [0, Math.round(fps * 0.45)], [0, 1], CL);
  if (p >= 1) return null;
  const e = 1 - Math.pow(1 - p, 3);
  const x = interpolate(e, [0, 1], [-1.1, 1.1]) * W;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div style={{position: 'absolute', top: -H * 0.1, left: x, width: W * 0.9, height: H * 1.2, background: theme.primary, transform: 'skewX(-12deg)'}} />
      <div style={{position: 'absolute', top: -H * 0.1, left: x - W * 0.25, width: W * 0.2, height: H * 1.2, background: theme.accent, transform: 'skewX(-12deg)'}} />
    </AbsoluteFill>
  );
};

// A biztonsági zónán belüli tartalomterület
const Terulet: React.FC<{children: React.ReactNode; style?: React.CSSProperties; align?: 'center' | 'flex-start'}> = ({children, style, align = 'center'}) => {
  const {safe} = useR();
  return (
    <div style={{position: 'absolute', top: safe.fent, bottom: safe.lent, left: safe.oldal, right: safe.oldal, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: align, ...style}}>
      {children}
    </div>
  );
};

// ------------------------------------------------------------------ kinetikus tipográfia
const betumeret = (szavak: string[], W: number, Hh: number, u: number, hook: boolean) => {
  const chars = szavak.join(' ').length || 1;
  const leghosszabb = Math.max(...szavak.map((w) => w.length), 1) + 0.8; // + a kiemelő doboz belső margója
  const terulet = Math.sqrt((0.5 * W * Hh) / (0.66 * chars));
  const szelesseg = W / (leghosszabb * (hook ? 0.62 : 0.52)); // Inter Display Black: kb. 0.46 em/kisbetű, 0.56 em/nagybetű
  return Math.max(60 * u, Math.min(terulet, szelesseg, (hook ? 175 : 150) * u));
};

const Kinetik: React.FC<{ev: KinetikEv; dur: number}> = ({ev, dur}) => {
  const {theme, u, W, H, safe} = useR();
  const {style, frame, fps} = useMozgas(dur, ev.be ?? (ev.hook ? 'zoom' : 'fel'));
  const now = frame / fps;
  const szavak = ev.szavak.map((s) => ({...s, w: tisztaSzo(s.w)})).filter((s) => s.w);
  const kiemel = new Set((ev.kiemel ?? []).map(kulcs));
  const fs = betumeret(szavak.map((s) => (ev.hook ? s.w.toUpperCase() : s.w)), W - 2 * safe.oldal, H - safe.fent - safe.lent, u, !!ev.hook);
  let aktualis = -1;
  szavak.forEach((s, i) => { if (s.t <= now + 0.02) aktualis = i; });
  return (
    <AbsoluteFill style={style}>
      <Terulet align={ev.igazitas === 'bal' ? 'flex-start' : 'center'}>
        {ev.felso ? (
          <div style={{fontFamily: 'Inter', fontWeight: 600, fontSize: 30 * u, letterSpacing: 6 * u, color: theme.primary, textTransform: 'uppercase', marginBottom: 34 * u, opacity: interpolate(frame, [0, 8], [0, 1], CL)}}>{ev.felso}</div>
        ) : null}
        <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: ev.igazitas === 'bal' ? 'flex-start' : 'center', columnGap: fs * 0.26, rowGap: fs * 0.08, fontFamily: theme.font ?? 'Inter Display', fontWeight: 900, fontSize: fs, lineHeight: 1.06, letterSpacing: -0.02 * fs, textAlign: ev.igazitas === 'bal' ? 'left' : 'center'}}>
          {szavak.map((s, i) => {
            const f0 = Math.round(s.t * fps) - 2;
            const sp = spring({frame: frame - f0, fps, config: {damping: 13, stiffness: 190, mass: 0.6}});
            const lathato = frame >= f0;
            const kiemelt = kiemel.has(kulcs(s.w));
            const doboz = spring({frame: frame - f0 - 3, fps, config: {damping: 20, stiffness: 160}});
            const aktiv = ev.karaoke !== false && i === aktualis && !kiemelt;
            const szin = aktiv ? theme.primary : theme.szoveg;
            return (
              <span key={i} style={{position: 'relative', display: 'inline-block', opacity: lathato ? Math.min(1, sp * 1.4) : 0, transform: `translateY(${(1 - sp) * 0.45 * fs}px) scale(${0.86 + 0.14 * sp})`, color: szin, padding: kiemelt ? `0 ${0.12 * fs}px` : 0}}>
                {kiemelt ? (
                  <span style={{position: 'absolute', left: 0, right: 0, top: '6%', bottom: '2%', background: theme.primary, borderRadius: 0.1 * fs, transform: `scaleX(${doboz})`, transformOrigin: 'left center', zIndex: 0}} />
                ) : null}
                <span style={{position: 'relative', zIndex: 1}}>{ev.hook ? s.w.toUpperCase() : s.w}</span>
                {kiemelt ? (
                  // a doboz söprésével együtt váltó szövegszín (második réteg, kivágva)
                  <span style={{position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: 2, padding: `0 ${0.12 * fs}px`, color: readable(theme.primary), clipPath: `inset(0 ${Math.max(0, (1 - doboz) * 100)}% 0 0)`}}>{ev.hook ? s.w.toUpperCase() : s.w}</span>
                ) : null}
              </span>
            );
          })}
        </div>
      </Terulet>
      {ev.atmenet ? <Csik /> : null}
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ számláló
const Szamlalo: React.FC<{ev: SzamlaloEv; dur: number}> = ({ev, dur}) => {
  const {theme, u} = useR();
  const {style, frame, fps} = useMozgas(dur, ev.be ?? 'zoom');
  const p = interpolate(frame, [4, 4 + Math.min(fps * 1.1, dur * 0.5)], [0, 1], CL);
  const e = 1 - Math.pow(2, -10 * p);
  // kis számot (pl. felsorolás sorszáma) nem pörgetünk fel, csak beugrik
  const v = ev.ertek <= 10 ? ev.ertek : Math.round(ev.ertek * (p >= 1 ? 1 : e));
  const txt = v.toLocaleString('hu-HU');
  const vonal = interpolate(frame, [8, 26], [0, 1], CL);
  const now = frame / fps;
  return (
    <AbsoluteFill style={style}>
      <Terulet>
        <div style={{fontFamily: theme.font ?? 'Inter Display', fontWeight: 900, fontSize: (txt.length > 5 ? 230 : 320) * u, lineHeight: 0.95, color: theme.primary, fontVariantNumeric: 'tabular-nums', letterSpacing: -6 * u}}>
          {ev.elotag ?? ''}{txt}{ev.utotag ?? ''}
        </div>
        <div style={{height: 14 * u, width: 520 * u * vonal, background: theme.accent, borderRadius: 8 * u, margin: `${30 * u}px 0 ${40 * u}px`}} />
        {ev.szavak?.length ? (
          <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', columnGap: 18 * u, fontFamily: theme.font ?? 'Inter Display', fontWeight: 800, fontSize: 76 * u, lineHeight: 1.1, color: theme.szoveg, textAlign: 'center'}}>
            {ev.szavak.map((s, i) => (
              <span key={i} style={{opacity: interpolate(now, [s.t - 0.05, s.t + 0.12], [0, 1], CL), transform: `translateY(${interpolate(now, [s.t - 0.05, s.t + 0.2], [30, 0], CL) * u}px)`}}>{tisztaSzo(s.w)}</span>
            ))}
          </div>
        ) : ev.cimke ? (
          <div style={{fontFamily: theme.font ?? 'Inter Display', fontWeight: 800, fontSize: 76 * u, color: theme.szoveg, textAlign: 'center', lineHeight: 1.1}}>{ev.cimke}</div>
        ) : null}
      </Terulet>
      {ev.atmenet ? <Csik /> : null}
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ felsorolás
const Pipa: React.FC<{p: number; size: number}> = ({p, size}) => {
  const {theme} = useR();
  return (
    <div style={{width: size, height: size, borderRadius: size / 2, background: theme.primary, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${0.5 + 0.5 * p})`}}>
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24">
        <path d="M4 12.5l5 5L20 6.5" fill="none" stroke={readable(theme.primary)} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={30} strokeDashoffset={30 * (1 - p)} />
      </svg>
    </div>
  );
};

const Felsorolas: React.FC<{ev: FelsorolasEv; dur: number}> = ({ev, dur}) => {
  const {theme, u} = useR();
  const {style, frame, fps} = useMozgas(dur, ev.be ?? 'fel');
  const n = ev.elemek.length;
  const fs = (n > 4 ? 60 : 72) * u;
  return (
    <AbsoluteFill style={style}>
      <Terulet align="flex-start" style={{paddingLeft: 30 * u}}>
        {ev.cim ? <div style={{fontFamily: 'Inter', fontWeight: 600, fontSize: 32 * u, letterSpacing: 6 * u, color: theme.primary, textTransform: 'uppercase', marginBottom: 50 * u}}>{ev.cim}</div> : null}
        <div style={{display: 'flex', flexDirection: 'column', gap: 44 * u}}>
          {ev.elemek.map((el, i) => {
            const f0 = Math.round(el.t * fps) - 2;
            const sp = spring({frame: frame - f0, fps, config: {damping: 16, stiffness: 170}});
            const pipa = interpolate(frame - f0, [4, 16], [0, 1], CL);
            return (
              <div key={i} style={{display: 'flex', alignItems: 'center', gap: 34 * u, opacity: frame >= f0 ? sp : 0, transform: `translateX(${(1 - sp) * -160 * u}px)`}}>
                <Pipa p={pipa} size={fs * 1.15} />
                <div style={{fontFamily: theme.font ?? 'Inter Display', fontWeight: 800, fontSize: fs, color: theme.szoveg, lineHeight: 1.1}}>{el.szoveg}</div>
              </div>
            );
          })}
        </div>
      </Terulet>
      {ev.atmenet ? <Csik /> : null}
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ CTA
const Cta: React.FC<{ev: CtaEv; dur: number}> = ({ev, dur}) => {
  const {theme, u} = useR();
  const {style, frame, fps} = useMozgas(dur, ev.be ?? 'zoom');
  const pulse = 1 + 0.045 * Math.sin((frame / fps) * Math.PI * 2 * 1.1);
  const gomb = spring({frame: frame - 10, fps, config: {damping: 14}});
  const nyil = 10 * Math.sin((frame / fps) * Math.PI * 2 * 1.4);
  return (
    <AbsoluteFill style={style}>
      <Terulet>
        {ev.logo ? <Img src={staticFile('m/' + ev.logo)} style={{height: 120 * u, maxWidth: 520 * u, objectFit: 'contain', marginBottom: 60 * u}} /> : null}
        <div style={{fontFamily: theme.font ?? 'Inter Display', fontWeight: 900, fontSize: (ev.szoveg.length > 40 ? 88 : 108) * u, lineHeight: 1.05, color: theme.szoveg, textAlign: 'center', letterSpacing: -2 * u}}>{ev.szoveg}</div>
        {ev.alszoveg ? <div style={{fontFamily: 'Inter', fontWeight: 500, fontSize: 44 * u, color: theme.halvany ?? theme.szoveg, marginTop: 30 * u, textAlign: 'center'}}>{ev.alszoveg}</div> : null}
        {ev.gomb ? (
          <div style={{marginTop: 70 * u, transform: `scale(${gomb * pulse})`, background: theme.primary, color: readable(theme.primary), borderRadius: 999, padding: `${30 * u}px ${64 * u}px`, fontFamily: theme.font ?? 'Inter Display', fontWeight: 800, fontSize: 58 * u, display: 'flex', alignItems: 'center', gap: 22 * u}}>
            {ev.gomb}
            <span style={{display: 'inline-block', transform: `translateX(${nyil * u}px)`}}>→</span>
          </div>
        ) : null}
      </Terulet>
      {ev.atmenet ? <Csik /> : null}
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ feliratsáv (kiegészítő)
const Felirat: React.FC<{ev: FeliratEv; dur: number}> = ({ev, dur}) => {
  const {theme, u, safe} = useR();
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const now = ev.start + frame / fps;
  const op = Math.min(interpolate(frame, [0, 4], [0, 1], CL), interpolate(frame, [dur - 4, dur], [1, 0], CL));
  return (
    <div style={{position: 'absolute', left: safe.oldal, right: safe.oldal, bottom: safe.lent, display: 'flex', justifyContent: 'center', opacity: op}}>
      <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', columnGap: 16 * u, padding: `${14 * u}px ${28 * u}px`, borderRadius: 18 * u, background: 'rgba(0,0,0,0.55)', fontFamily: 'Inter Display', fontWeight: 800, fontSize: 56 * u, lineHeight: 1.15, color: '#ffffff', textAlign: 'center'}}>
        {ev.szavak.map((s, i) => {
          const aktiv = ev.karaoke !== false && now >= s.t && now < (s.e ?? s.t + 0.4);
          return <span key={i} style={{color: aktiv ? theme.primary : '#ffffff', transform: `scale(${aktiv ? 1.06 : 1})`, display: 'inline-block'}}>{tisztaSzo(s.w)}</span>;
        })}
      </div>
    </div>
  );
};

// ------------------------------------------------------------------ háttér
const Hatter: React.FC<{bg: string; mod: ReelProps['hatter']}> = ({bg, mod = 'racs'}) => {
  const {theme, u} = useR();
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = f / fps;
  const x1 = 30 + 25 * Math.sin(t / 3.1), y1 = 25 + 15 * Math.cos(t / 3.7);
  const x2 = 70 + 25 * Math.cos(t / 2.9), y2 = 75 + 12 * Math.sin(t / 3.3);
  const racs = 96 * u;
  return (
    <AbsoluteFill style={{background: bg}}>
      {mod !== 'sima' ? (
        <>
          <AbsoluteFill style={{background: `radial-gradient(60% 40% at ${x1}% ${y1}%, ${theme.primary}2e, transparent 70%)`}} />
          <AbsoluteFill style={{background: `radial-gradient(55% 35% at ${x2}% ${y2}%, ${theme.accent}24, transparent 70%)`}} />
        </>
      ) : (
        <AbsoluteFill style={{background: `linear-gradient(${160 + 10 * Math.sin(t / 4)}deg, ${theme.primary}14, transparent 55%)`}} />
      )}
      {mod === 'racs' ? (
        <AbsoluteFill style={{
          backgroundImage: `linear-gradient(${theme.szoveg}0d 2px, transparent 2px), linear-gradient(90deg, ${theme.szoveg}0d 2px, transparent 2px)`,
          backgroundSize: `${racs}px ${racs}px`,
          backgroundPosition: `${(t * 14 * u) % racs}px ${(t * 22 * u) % racs}px`,
        }} />
      ) : null}
      <AbsoluteFill style={{background: `radial-gradient(120% 80% at 50% 50%, transparent 55%, ${bg}cc 100%)`}} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ egy esemény
const Egy: React.FC<{ev: REv; dur: number}> = ({ev, dur}) => {
  const {theme} = useR();
  switch (ev.type) {
    case 'kinetik': return <Kinetik ev={ev} dur={dur} />;
    case 'szamlalo': return <Szamlalo ev={ev} dur={dur} />;
    case 'felsorolas': return <Felsorolas ev={ev} dur={dur} />;
    case 'cta': return <Cta ev={ev} dur={dur} />;
    case 'felirat': return <Felirat ev={ev} dur={dur} />;
    default: return <One ev={ev as Ev} dur={dur} theme={theme} />;
  }
};

const SAFE_ALAP = {fent: 290, lent: 450, oldal: 80};
const SORREND: Record<string, number> = {felirat: 50, progress: 60, logo: 55};

// Automatikus hangeffektek a jelenetekhez (public/sfx/, a render előtt a pipeline másolja oda)
const hangok = (events: REv[]) => {
  const out: {nev: string; t: number; db: number}[] = [];
  events.forEach((ev) => {
    if (ev.type === 'felirat' || ev.type === 'progress') return;
    const e = ev as {start: number; atmenet?: boolean; hook?: boolean; type: string};
    if (e.atmenet) out.push({nev: 'whoosh', t: Math.max(0, e.start - 0.05), db: -10});
    else if (e.type === 'kinetik' && e.hook) out.push({nev: 'pop', t: e.start + 0.05, db: -12});
    if (e.type === 'szamlalo') out.push({nev: 'tik', t: e.start + 0.15, db: -14});
    if (e.type === 'felsorolas') out.push({nev: 'pop', t: e.start + 0.1, db: -16});
    if (e.type === 'cta') out.push({nev: 'ding', t: e.start + 0.3, db: -10});
  });
  return out;
};

export const Reel: React.FC<ReelProps> = ({events, theme, fps, bg, safe, logo, hatter, hangeffekt}) => {
  const {width, height} = useVideoConfig();
  const k = width / 1080;
  const s = safe ?? SAFE_ALAP;
  const ctx: Ctx = {theme, u: width / 1100, W: width, H: height, safe: {fent: s.fent * k, lent: s.lent * k, oldal: s.oldal * k}};
  const sorted = events.map((ev, i) => ({ev, i})).sort((a, b) => (SORREND[a.ev.type] ?? 0) - (SORREND[b.ev.type] ?? 0) || a.i - b.i);
  return (
    <RCtx.Provider value={ctx}>
      <SafeCtx.Provider value={ctx.safe}>
        <BoxProvider box={{width, height, u: ctx.u}}>
          <AbsoluteFill style={{fontFamily: theme.font ?? 'Inter Display'}}>
            <Hatter bg={bg} mod={hatter} />
            {sorted.map(({ev, i}) => {
              const from = Math.round(ev.start * fps);
              const dur = Math.max(1, Math.round(ev.dur * fps));
              return (
                <Sequence key={i} from={from} durationInFrames={dur}>
                  <Egy ev={ev} dur={dur} />
                </Sequence>
              );
            })}
            {hangeffekt ? hangok(events).map((h, i) => (
              <Sequence key={'h' + i} from={Math.round(h.t * fps)} layout="none">
                <Html5Audio src={staticFile('sfx/' + h.nev + '.wav')} volume={Math.pow(10, h.db / 20)} />
              </Sequence>
            )) : null}
            {logo ? <Img src={staticFile('m/' + logo)} style={{position: 'absolute', top: ctx.safe.fent - 110 * ctx.u, left: ctx.safe.oldal, height: 64 * ctx.u, opacity: 0.9}} /> : null}
          </AbsoluteFill>
        </BoxProvider>
      </SafeCtx.Provider>
    </RCtx.Provider>
  );
};
