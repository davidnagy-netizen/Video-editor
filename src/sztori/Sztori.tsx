import React from 'react';
import {AbsoluteFill} from 'remotion';
import {sztorik} from '../sztorik';
import {Felirat, SztoriCtx, SztoriProps} from './kit';

export type SztoriCompProps = SztoriProps & {
  slug: string;
  width: number;
  height: number;
  fps: number;
  felirat?: 'karaoke' | 'sima' | 'nincs';
};

// A sztori-reel kompozíció: a src/sztorik/<slug>.tsx jelenetét rajzolja ki, alá a feliratsávot.
export const Sztori: React.FC<SztoriCompProps> = (p) => {
  const C = sztorik[p.slug];
  if (!C) throw new Error(`Nincs ilyen sztori: src/sztorik/${p.slug}.tsx (ismert: ${Object.keys(sztorik).join(', ') || 'egy sem'})`);
  return (
    <SztoriCtx.Provider value={p}>
      <AbsoluteFill style={{fontFamily: p.theme.font ?? 'Inter Display', background: p.bg}}>
        <C />
        {p.felirat !== 'nincs' ? <Felirat karaoke={p.felirat !== 'sima'} /> : null}
      </AbsoluteFill>
    </SztoriCtx.Provider>
  );
};
