import React from 'react';
import {Theme, Pos} from './types';

export const fontFor = (t: Theme) =>
  t.font ? t.font
  : t.style === 'editoryal' ? 'Georgia, "Times New Roman", serif'
  : t.style === 'terminal' ? 'Consolas, "Cascadia Mono", monospace'
  : '"Segoe UI", system-ui, Arial, sans-serif';

const lum = (hex: string) => {
  const h = hex.replace('#', '');
  const c = [0, 2, 4].map((i) => parseInt(h.substr(i, 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
export const readable = (bg: string) => (lum(bg) > 0.5 ? '#111111' : '#ffffff');
export const bright = (a: string, b: string) => (lum(a) >= lum(b) ? a : b);

// stile göre panel görünümü. Yazı rengi arka plana göre okunur seçilir.
export const panel = (t: Theme, scale: number): React.CSSProperties => {
  const r = (n: number) => n * scale;
  const br = bright(t.primary, t.secondary);
  switch (t.style) {
    case 'cizgi':
      return {background: 'rgba(10,12,16,0.93)', border: `${r(2)}px solid ${br}`, borderRadius: r(6), color: br, padding: `${r(14)}px ${r(22)}px`};
    case 'blok':
      return {background: t.primary, color: readable(t.primary), borderRadius: r(4), padding: `${r(16)}px ${r(28)}px`, fontWeight: 800};
    case 'cam':
      return {background: 'rgba(20,22,28,0.4)', backdropFilter: `blur(${r(18)}px)`, border: `${r(1.5)}px solid rgba(255,255,255,0.4)`, borderRadius: r(22), color: br, textShadow: `0 ${r(1)}px ${r(4)}px rgba(0,0,0,0.5)`, padding: `${r(16)}px ${r(26)}px`};
    case 'editoryal':
      return {background: t.secondary, color: readable(t.secondary), borderTop: `${r(4)}px solid ${t.primary}`, borderBottom: `${r(1)}px solid ${readable(t.secondary)}`, padding: `${r(16)}px ${r(28)}px`};
    case 'terminal':
      return {background: 'rgba(14,16,20,0.94)', color: br, border: `${r(1.5)}px solid ${br}`, borderRadius: r(3), padding: `${r(14)}px ${r(22)}px`};
  }
};

// Biztonsági zóna (Reel): a felület széleitől tartott távolság pixelben. Ha nincs megadva, a régi margók élnek.
export type Safe = {fent: number; lent: number; oldal: number};
export const SafeCtx = React.createContext<Safe | null>(null);

export const place = (pos: Pos | undefined, w: number, h: number, safe?: Safe | null): React.CSSProperties => {
  const mx = safe ? safe.oldal : w * 0.05, my = h * 0.07;
  if (safe) return placeSafe(pos, w, h, safe);
  const p = pos ?? 'alt';
  const s: React.CSSProperties = {position: 'absolute', display: 'flex', maxWidth: w * 0.8};
  if (p === 'ust') return {...s, top: my, left: 0, right: 0, justifyContent: 'center', maxWidth: undefined};
  if (p === 'ust2') return {...s, top: h * 0.27, left: 0, right: 0, justifyContent: 'center', maxWidth: undefined};
  if (p === 'alt-ust') return {...s, bottom: h * 0.45, left: 0, right: 0, justifyContent: 'center', maxWidth: undefined};
  if (p === 'orta') return {...s, top: 0, bottom: 0, left: 0, right: 0, justifyContent: 'center', alignItems: 'center', maxWidth: undefined};
  if (p === 'alt') return {...s, bottom: my, left: 0, right: 0, justifyContent: 'center', maxWidth: undefined};
  if (p === 'sol-ust') return {...s, top: my, left: mx};
  if (p === 'sag-ust') return {...s, top: my, right: mx};
  if (p === 'sol-alt') return {...s, bottom: my, left: mx};
  return {...s, bottom: my, right: mx};
};

// Biztonsági zónán belüli elhelyezés: semmi nem kerül a felső / alsó Instagram-felület alá.
const placeSafe = (pos: Pos | undefined, w: number, h: number, sz: Safe): React.CSSProperties => {
  const p = pos ?? 'alt';
  const s: React.CSSProperties = {position: 'absolute', display: 'flex'};
  const top = sz.fent, bottom = sz.lent, side = sz.oldal;
  const inner = h - top - bottom;
  if (p === 'ust') return {...s, top, left: side, right: side, justifyContent: 'center'};
  if (p === 'ust2') return {...s, top: top + inner * 0.18, left: side, right: side, justifyContent: 'center'};
  if (p === 'alt-ust') return {...s, bottom: bottom + inner * 0.25, left: side, right: side, justifyContent: 'center'};
  if (p === 'orta') return {...s, top, bottom, left: side, right: side, justifyContent: 'center', alignItems: 'center'};
  if (p === 'alt') return {...s, bottom, left: side, right: side, justifyContent: 'center'};
  if (p === 'sol-ust') return {...s, top, left: side, maxWidth: w - 2 * side};
  if (p === 'sag-ust') return {...s, top, right: side, maxWidth: w - 2 * side};
  if (p === 'sol-alt') return {...s, bottom, left: side, maxWidth: w - 2 * side};
  return {...s, bottom, right: side, maxWidth: w - 2 * side};
};
