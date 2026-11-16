import {Ev, Theme} from './types';

// Szó a narrációból. t = kezdés, e = vége (mp, a JELENET elejéhez képest; felirat esetén a videó elejéhez képest)
export type Szo = {w: string; t: number; e?: number};

type RBase = {start: number; dur: number; be?: Belepes; atmenet?: boolean};
export type Belepes = 'fel' | 'zoom' | 'balrol' | 'jobbrol' | 'maszk';

// Teljes képernyős kinetikus tipográfia: a szavak a narrációval együtt jelennek meg.
export type KinetikEv = RBase & {
  type: 'kinetik';
  szavak: Szo[];
  kiemel?: string[];     // ezek a szavak (írásjel nélkül, kisbetűvel is jó) kiemelt dobozt kapnak
  hook?: boolean;        // nyitó kampó: nagyobb, nagybetűs
  felso?: string;        // kis felirat a szöveg fölött (pl. "PROBLÉMA")
  igazitas?: 'kozep' | 'bal';
  karaoke?: boolean;     // az éppen elhangzó szó kiemelve
};

// Nagy, felpörgő szám + címke
export type SzamlaloEv = RBase & {
  type: 'szamlalo';
  ertek: number;
  elotag?: string;
  utotag?: string;
  cimke?: string;
  szavak?: Szo[];        // a címke szavai időzítve (ha van, ezek jelennek meg sorban)
};

// Felsorolás: az elemek akkor jelennek meg, amikor elhangzanak
export type FelsorolasEv = RBase & {
  type: 'felsorolas';
  cim?: string;
  elemek: {szoveg: string; t: number}[];
};

// Záró cselekvésre hívás
export type CtaEv = RBase & {
  type: 'cta';
  szoveg: string;
  alszoveg?: string;
  gomb?: string;
  logo?: string;          // public/m/ alatti fájl
};

// Feliratsáv (kiegészítő, nem ana jelenet). A szavak ideje a VIDEÓ elejéhez képest.
export type FeliratEv = {type: 'felirat'; start: number; dur: number; szavak: Szo[]; karaoke?: boolean};

export type REv = Ev | KinetikEv | SzamlaloEv | FelsorolasEv | CtaEv | FeliratEv;

export type ReelTheme = Theme & {
  szoveg: string;    // alap szövegszín
  halvany?: string;  // másodlagos szöveg
};

export type ReelProps = {
  width: number;
  height: number;
  fps: number;
  duration: number;
  bg: string;
  theme: ReelTheme;
  safe?: {fent: number; lent: number; oldal: number}; // 1080 széles vászonra számolt pixel
  logo?: string;      // kis vízjel (public/m/ alatt), opcionális
  hatter?: 'racs' | 'foltok' | 'sima';
  hangeffekt?: boolean; // whoosh a csíkos váltásoknál, pop a kampónál, ding a CTA-nál
  events: REv[];
};
