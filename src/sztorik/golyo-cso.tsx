// Sztori: „Mi van, ha kilövünk egy golyót egy csőbe, ami visszavezet ránk?”
// Minden időzítés a narráció szavaihoz kötött (ido('szó')), így bármilyen hanggal és tempóval szinkronban marad.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {
  anim, Bumm, Buborek, Cim, Cso, Ease, Elem, Figura, Fust, Golyo, Gomb, Hang, Hatter, Iroda, Kamera, Konfetti, Laptop,
  Pecset, Pisztoly, rugo, SebessegVonalak, useIdo, useSztori, useSzoIdo, utMenten, Villanas,
} from '../sztori/kit';

// A világ (1080×1920-as koordináták): lövő balra lent, a cső körbefut és visszafordul a lövő fejére.
const CSO = 'M 580 1100 L 820 1100 C 1010 1100 1010 700 820 700 L 400 700 C 210 700 210 780 210 930';
const UT_A = 'M 580 1100 L 820 1100 C 1010 1100 1010 700 820 700 L 600 700'; // a golyó útja az elágazásig
const AG = 'M 600 700 L 600 520 C 600 420 760 470 760 330'; // a kitérő az Aetherpontis felé

const Jelenetek: React.FC = () => {
  const t = useIdo();
  const ido = useSzoIdo();
  const {duration, theme} = useSztori();

  const tKi = ido('kilövünk') + 0.2;
  const tVissza = ido('visszavezet');
  const tRank = ido('ránk');
  const tSemmi = ido('semmi');
  const tOkos = ido('okos');
  const tFel = ido('félúton');
  const tBe = ido('bekanyarodik');
  const tAeth = ido('aetherpontishoz');
  const tTudja = ido('tudja');
  const tVall = ido('vállalatirányítási');
  const tIngyen = ido('ingyen');
  const tLegyel = ido('legyél');
  const tGolyo = ido('golyó', 3);
  const tCel = tAeth + 0.45; // a golyó beér az irodába

  const jelenet = t < tTudja - 0.12 ? 1 : t < tLegyel - 0.1 ? 2 : 3;

  if (jelenet === 1) {
    // golyó helyzete
    let golyo: {x: number; y: number; szog: number} | null = null;
    if (t >= tKi && t < tBe) golyo = utMenten(UT_A, anim(t, [tKi, tSemmi], [0, 1], Ease.lassul));
    else if (t >= tBe && t < tAeth) golyo = utMenten(AG, anim(t, [tBe, tAeth], [0, 1], Ease.gyorsul));
    else if (t >= tAeth && t < tCel) golyo = {x: 760, y: anim(t, [tAeth, tCel], [330, 240]), szog: -90};
    const golyoMeret = t >= tAeth ? anim(t, [tAeth, tCel], [0.55, 0.15]) : 0.55;
    const arc = t < tVissza ? 'ravasz' : t < tSemmi ? 'ijedt' : t < tCel ? 'meglepett' : 'boldog';
    const szemuveg = anim(t, [tOkos, tOkos + 0.3], [0, 1], Ease.ugras);

    return (
      <AbsoluteFill>
        <Hatter />
        <Kamera
          kulcsok={[
            {t: 0, x: 400, y: 1110, z: 1.45},
            {t: tKi + 0.25, x: 420, y: 1110, z: 1.45},
            {t: tVissza, x: 600, y: 1040, z: 1.0},
            {t: tRank, x: 340, y: 1060, z: 1.25},
            {t: tSemmi, x: 600, y: 720, z: 1.9},
            {t: tOkos + 0.4, x: 600, y: 720, z: 2.1},
            {t: tBe, x: 640, y: 620, z: 1.15},
            {t: tAeth, x: 700, y: 360, z: 1.05},
            {t: tTudja, x: 740, y: 280, z: 1.25},
          ]}
          razas={[{t: tKi, ero: 1.2}, {t: tCel, ero: 0.5}]}
        >
          <Elem x={760} y={70} s={0.75}><Iroda t0={tCel} /></Elem>
          <Cso d={CSO} vastag={90} rajzol={anim(t, [0.1, Math.max(0.3, tKi - 0.05)], [0, 1])} />
          {t >= tFel - 0.1 ? <Cso d={AG} vastag={90} rajzol={anim(t, [tFel, tBe + 0.15], [0, 1], Ease.lassul)} szin={theme.primary} /> : null}
          <Cim x={400} y={500} t0={tFel + 0.2} t1={tAeth} szoveg="AETHERPONTIS" meret={40} szelesseg={420} szin={theme.primary} />
          <Elem x={210} y={1240} s={0.9}><Figura arc={arc} /></Elem>
          <Elem x={420} y={1140} s={0.8}><Pisztoly visszarug={tKi} /></Elem>
          <Fust x={610} y={1090} t0={tKi} meret={0.6} />
          <Bumm x={640} y={1010} t0={tKi} szoveg="BUMM!" meret={0.65} tartam={0.55} />
          {t >= tBe && t < tAeth ? <SebessegVonalak x={golyo?.x ?? 600} y={(golyo?.y ?? 600) + 90} t0={tBe} t1={tAeth} irany={90} hossz={160} /> : null}
          {golyo ? (
            <Elem x={golyo.x} y={golyo.y} s={golyoMeret} r={golyo.szog} z={20}>
              <Golyo kacsint={t > tOkos + 0.35 && t < tOkos + 0.75} szemuveg={szemuveg} />
            </Elem>
          ) : null}
        </Kamera>
        <Villanas t0={tKi} />
        <Cim x={540} y={520} t0={tSemmi} t1={tOkos - 0.15} szoveg="SEMMI." meret={170} szin={theme.accent} kontur="#111827" forgas={-4} />
        <Cim x={540} y={500} t0={tOkos} t1={tFel - 0.1} szoveg="Okos golyó." meret={110} kontur="#111827" />
      </AbsoluteFill>
    );
  }

  if (jelenet === 2) {
    const bob = Math.sin(t * 5) * 10;
    return (
      <AbsoluteFill>
        <Hatter folt={theme.accent} />
        <Kamera kulcsok={[{t: tTudja - 0.12, x: 540, y: 900, z: 1.35}, {t: tTudja + 0.3, x: 540, y: 900, z: 1.0}, {t: tLegyel, x: 540, y: 900, z: 1.05}]}>
          <Elem x={540} y={880} s={1.55 * (0.6 + 0.4 * rugo(t, tVall - 0.3, 0.6))}><Laptop t0={tVall} felirat="Vállalatirányítás" /></Elem>
          <Elem x={870} y={1140 + bob} s={1.15} flip r={-6}><Golyo szemuveg={1} /></Elem>
          <Buborek x={620} y={1010} t0={tVall + 0.5} t1={tIngyen} szoveg="Na, ezt megnézem." meret={44} szelesseg={400} farok="jobb-le" />
        </Kamera>
        <Cim x={540} y={430} t0={tVall} szoveg="VÁLLALATIRÁNYÍTÁSI SZOFTVER" meret={68} szin={theme.primary} />
        <Pecset x={540} y={880} t0={tIngyen + 0.1} szoveg="INGYENES PRÓBA" meret={0.8} />
      </AbsoluteFill>
    );
  }

  // 3. jelenet: CTA
  const bob = Math.sin(t * 4) * 14;
  return (
    <AbsoluteFill>
      <Hatter />
      <Kamera kulcsok={[{t: tLegyel - 0.1, x: 540, y: 960, z: 1.3}, {t: tLegyel + 0.35, x: 540, y: 960, z: 1.0}, {t: duration, x: 540, y: 960, z: 1.06}]}>
        <Elem x={540} y={820 + bob} s={2.5} r={Math.sin(t * 3) * 4}><Golyo szemuveg={1} /></Elem>
      </Kamera>
      <Cim x={540} y={470} t0={tLegyel} szoveg="Légy legalább olyan okos, mint egy golyó." meret={76} szelesseg={900} />
      <Cim x={540} y={1050} t0={tGolyo - 0.2} szoveg="AETHERPONTIS" meret={48} szin={theme.primary} />
      <Gomb x={540} y={1200} t0={tGolyo} szoveg="Próbáld ki ingyen" />
      <Konfetti t0={tGolyo} />
    </AbsoluteFill>
  );
};

// A hangeffektek egyszer, a jelenetektől függetlenül szólnak (így a jelenetváltás nem vágja el őket).
const Hangok: React.FC = () => {
  const ido = useSzoIdo();
  const tKi = ido('kilövünk') + 0.2;
  const tSemmi = ido('semmi');
  const tOkos = ido('okos');
  const tBe = ido('bekanyarodik');
  const tCel = ido('aetherpontishoz') + 0.45;
  const tTudja = ido('tudja');
  const tVall = ido('vállalatirányítási');
  const tIngyen = ido('ingyen');
  const tLegyel = ido('legyél');
  const tGolyo = ido('golyó', 3);
  return (
    <>
      <Hang nev="loves" t={tKi} db={-2} />
      <Hang nev="csorrenes" t={tKi + 0.3} db={-12} />
      <Hang nev="karc" t={tSemmi - 0.05} db={-8} />
      <Hang nev="boing" t={tOkos} db={-12} />
      <Hang nev="whoosh_hosszu" t={tBe} db={-6} />
      <Hang nev="ding" t={tCel} db={-6} />
      <Hang nev="whoosh" t={tTudja - 0.15} db={-8} />
      <Hang nev="pop" t={tVall} db={-10} />
      <Hang nev="pecset" t={tIngyen + 0.1} db={-3} />
      <Hang nev="whoosh" t={tLegyel - 0.12} db={-10} />
      <Hang nev="siker" t={tGolyo} db={-6} />
    </>
  );
};

const Sztori: React.FC = () => (
  <AbsoluteFill>
    <Jelenetek />
    <Hangok />
  </AbsoluteFill>
);

export default Sztori;
