# Motion reel készítése scriptből (Aetherpontis)

Ez a fájl a motion reel mód egyetlen forrása. Bemenet: egy szövegkönyv (script) és néhány beállítás. Kimenet: 9:16-os, narrált motion graphic reel mp4-ben, amelyben a képet végig animált tipográfia és grafika adja (nincs kamerás felvétel).

A mód a `talimat/video-edit.md` **5S. Sesli anlatım + görsel** lépésére épül: ott a forrásvideóból csak a hang számít, és a képet teljes egészében Remotion-jelenetek adják. Itt a „forrás” a scriptből generált narráció. A török nyelvű mező- és értékneveket (`sahne`, `pos: "orta"` stb.) ne nevezd át.

## Kinek készül

Aetherpontis Solutions OÜ: virtuális asszisztens szolgáltatás és szoftverfejlesztés európai KKV-knak, vállalkozóknak. A reelek elsődleges nyelve magyar, de angol scriptet is kezelni kell. Magyar szövegben az ajánlat neve mindig „virtuális asszisztens”.

## Autopilóta: script be → kész videó ki (ez az alapértelmezett működés)

A felhasználó általában csak egy scriptet ad (néha pár beállítással: hang, stílus, tempó). **Ne kérdezz semmit.** Végig, megszakítás nélkül:

1. **Brief:** `npm run reel -- uj <slug>` (rövid, ékezet nélküli slug a script első szavaiból), töltsd ki: SCRIPT szó szerint, a megadott beállítások, a többi alapérték. Ha van `ELEVENLABS_API_KEY` a `.env`-ben és a felhasználó nem kért mást, a hang `el-ferfi` vagy `el-noi` legyen (a script hangvételéhez illően), különben `noemi`/`tamas`.
2. **Mód eldöntése** (ha nincs megadva):
   - **sztori**: ha a script helyzetet, történetet, képzeletbeli kísérletet, poént ír le, tárgyakkal vagy szereplőkkel („Mi van, ha…”, „Képzeld el…”, „Egy vállalkozó bemegy…”). Ilyenkor rajzfilmes jeleneteket rajzolsz (lásd „Sztori mód”).
   - **tipo**: tippek, felsorolások, állítások, számok, oktató jellegű szöveg. Kinetikus tipográfia (lásd „Lépések”).
3. **Tempó:** vicces vagy pörgős hangvételnél `vagasi_tempo: porgos` és `beszedtempo: 1.1`, egyébként `gyors`.
4. Hang → jelenetek (tipo: vázlat + átnézés; sztori: a `src/sztorik/<slug>.tsx` megírása) → `npm run reel -- render <slug>` → kapuk → képkockák megnézése → javítás, ha kell → riport.

Ha valami nem megy (pl. nincs API-kulcs, nincs internet), válts a legközelebbi működő megoldásra (ingyenes hang, majd `teszt` hang), és a riportban írd meg, mit kell pótolni. A riport rövid: a kész fájl útvonala, hossz, hang, mód, feltételezések.

## Négy szabály (mindennél fontosabb)

1. **A narráció pontosan a scriptet mondja, szó szerint.** A képernyőn megjelenő szöveg rövidíthet, de nem adhat hozzá új állítást, számot, ígéretet vagy ügyfélnevet, ami a scriptben nincs. Sztori módban rövid poén-szöveg (hangutánzó szó, szereplő reakciója, pl. „BUMM!”, „Na, ezt megnézem.”) mehet, de tényállítás, szám vagy ígéret nem.
2. **Minden jelenet arra a szóra indul, amelyiknél a narráció odaér.** Az időket mindig az `out/<slug>/szavak.json`-ból vedd, sosem becsüld.
3. **Kapuk nélkül nincs átadás.** `kontrol.mjs sahne` render előtt, `kontrol.mjs cikti` render után. Hiba esetén javíts és futtasd újra. A kapukat nem lehet kihagyni.
4. **Nézd meg, amit csináltál.** A render után nézd meg az `out/<slug>/kockak/attekintes.png` képet és szükség esetén az egyes kockákat. A piros sávok az Instagram-felület által takart részek: oda nem kerülhet fontos szöveg.

## Bemenet: a brief

Minden reelnek saját mappája van: `materyaller/<slug>/brief.md`, a logók és képernyőképek a `materyaller/<slug>/materyal/` mappában. A közös márkaelemek (pl. Aetherpontis logó) a `marka/` mappában vannak. Új brief: `npm run reel -- uj <slug>`.

```
---
cim: va-reggeli-emailek
nyelv: hu              # hu | en
hang: noemi            # ayarlar/hangok.json kulcsa
beszedtempo: 1.05      # 0.85–1.2, a narráció sebessége
vagasi_tempo: gyors    # nyugodt (4–6 mp/jelenet) | kozepes (2,5–4) | gyors (1,5–2,5) | porgos (0,8–1,6)
mod: auto              # auto | tipo | sztori
hangeffekt: igen       # igen | nem (whoosh, pop, ding a jelenetekhez)
stilus: aetherpontis   # ayarlar/stilusok.json kulcsa
felirat: karaoke       # karaoke | sima | nincs
zene: nincs            # vagy fájlnév a materyal/ mappából
zene_db: -24
cta: "Kövess a további tippekért"
---

SCRIPT:
(a felolvasandó szöveg)

KIEJTÉS:               # opcionális, csak a hangra hat, a felirat a scriptet mutatja
Aetherpontis = Éter-pontisz

MEGJEGYZÉS:            # opcionális, pl. „a 3. mondatnál a Tiptop logó”
```

Ha a felhasználó a chatbe írja a scriptet és a beállításokat, te írd meg belőle a briefet (`npm run reel -- uj <slug>`, majd töltsd ki). A slug rövid, ékezet nélküli, kötőjeles. Ami hiányzik, arra a sablon alapértéke érvényes; a riportban mondd meg, mit feltételeztél. Ha nincs ott senki, ne kérdezz, menj tovább észszerű feltételezéssel.

## Lépések

### 1. Brief és anyagok
Olvasd be a briefet. Nézd meg, hogy a megjegyzésben említett fájlok megvannak-e a `materyal/` mappában. Ami hiányzik, azt hagyd ki, és írd bele a riportba. Ügyfélnevet, logót, képernyőképet csak akkor használj, ha a brief megadja.

### 2. Narráció
```
npm run reel -- hang <slug>
```
Létrejön: `out/<slug>/narracio.wav` (48 kHz, -14 LUFS), `szavak.json` (`[{szo, start, end}]`, mp-ben), `meta.json`.
- `elevenlabs` hanghoz kell az `ELEVENLABS_API_KEY` a `.env`-ben. Ha nincs kulcs, vagy a voice ID nincs kitöltve, mondd meg, és ajánld fel a `noemi`/`tamas` ingyenes hangot.
- Az `edge` hang első használatkor a projekt `.venv` mappájába telepíti az `edge-tts` csomagot.
- A `teszt` hang (espeak) robothang, csak a folyamat kipróbálására. Ilyen reelt soha ne adj át posztolásra.
- Hallgass bele, ha tudsz, vagy legalább nézd meg a `szavak.json` elejét és végét: a szavak sorrendje egyezzen a scripttel, az idők nőjenek.

### 3. Vázlat
```
npm run reel -- vazlat <slug>
```
Létrejön az `out/<slug>/sahne.json` (Remotion `Reel` kompozíció props) és az `out/<slug>/plan.md` (táblázat: idő, jelenet, belépés, képernyőn megjelenő szöveg). A vázlat gépi kiindulópont: mondatokra és rövid gondolatokra bont, a számokból számlálót, a felsorolásokból listát, az utolsó mondatból CTA-t csinál.

**Ezután te jössz: nézd át és javítsd a `sahne.json`-t kreatívan.** Amit szinte mindig érdemes:
- A kampó (első jelenet, `hook: true`) legyen az első 2 mp-ben, a legerősebb szóval kiemelve. Ha a script első mondata gyenge kampó, a képernyőn rövidebb, ütősebb változat is mehet (`szavak` szavainak elhagyásával), de új állítás nem.
- Darabolás: egy jelenet = egy gondolat. Ne lógjon névelő vagy kötőszó a sor végén, ne törj ketté összetartozó kifejezést („a napját, hanem” rossz; „a napját” / „hanem adminisztrációval” jó).
- Kiemelés (`kiemel`): jelenetenként legfeljebb egy szó, és csak a lényeg (szám, fájdalompont, ajánlat). Ne minden jelenetben.
- Jelenettípusok váltakozzanak. Ugyanaz a nem-szöveges típus ne jöjjön háromszor egymás után.
- `atmenet: true` (színes csík) a nagyobb gondolati váltásoknál, nagyjából minden 3–4. jelenetnél. Ne mindenhol.
- `be` (belépés): `fel`, `zoom`, `balrol`, `jobbrol`, `maszk`. Ne legyen kettő ugyanaz egymás után.
- Ha a script márkát vagy ügyfelet említ és van hozzá logó a `materyal/`-ban, a régi `logo` esemény is használható (`pos: "sag-ust"`).
- Ha a jelenettervet módosítod, frissítsd a `plan.md`-t is, hogy egyezzen.

### 4. Render és ellenőrzés
```
npm run reel -- render <slug>
```
A parancs sorban: anyagok másolása `public/m/` alá → **1. kapu** (`node scripts/kontrol.mjs sahne out/<slug>/sahne.json`) → néma render (`Reel` kompozíció) → narráció (és zene, ha van) rákeverése → **2. kapu** (`node scripts/kontrol.mjs cikti ... --sure <mp>`) → 8 ellenőrző kocka és áttekintő lap az `out/<slug>/kockak/` mappába. A kimenet új fájl: `out/<slug>/<slug>-<dátum-idő>.mp4`, korábbi kimenet sosem íródik felül.

Szemrevételezés (`kockak/attekintes.png`, kétség esetén az egyes kockák vagy `npx remotion still src/index.ts Reel x.png --frame=N --props=out/<slug>/sahne.json`):
- Telefonon is kiolvasható-e minden szöveg (a legkisebb szöveg se legyen 48 px alatt 1080-as szélességen)?
- Nincs-e kilógó vagy egymásra csúszó szöveg?
- Nincs-e fontos szöveg a piros (takart) sávokban?
- Az ékezetek (ő, ű, á, é, í, ó, ö, ú, ü) jól jelennek-e meg?
- A jelenetek a megfelelő szónál indulnak-e?
Ha bármi hibás: javítsd a `sahne.json`-t, és futtasd újra a rendert.

Egyben is futtatható (a vázlatot felülírja, kézi javítás nélkül): `npm run reel -- mind <slug>`. Ágens nélkül, egyetlen paranccsal, közvetlenül a scriptből: `npm run reel -- gyors "<script>" [--hang noemi] [--tempo porgos] [--stilus neon] [--elonezet]`.

Gyorsítás: a render a gép magjainak 75%-át használja. Próbához `--elonezet` (fél felbontás, kb. négyszer gyorsabb), a végleges videó mindig teljes felbontásban készüljön.

### 5. Riport
Rövid, a fájlt ne nyisd meg. Tartalma: a kész fájl útvonala, hossz, hang és beállítások, mi maradt ki (hiányzó anyag), milyen feltételezéseket tettél, és ha ideiglenes márkaszínekkel készült (`"ideiglenes": true` a stílusban), azt is.

## Sztori mód (rajzfilmes, vicces reelek)

Itt nincs gépi vázlat: a jelenetet te írod meg React/SVG kódként a `src/sztorik/<slug>.tsx` fájlba, a `src/sztori/kit.tsx` készletből. **Mintának mindig nyisd meg a `src/sztorik/golyo-cso.tsx`-et**, és kövesd a felépítését (több jelenet időben egymás után, külön `Hangok` komponens, minden idő a narrációhoz kötve).

Menet:
1. `npm run reel -- hang <slug>`, majd nézd meg az `out/<slug>/szavak.json`-t: ezekre a szavakra fogod kötni a történés ütemeit.
2. Írd meg a `src/sztorik/<slug>.tsx`-et (`export default` egy komponens). Szerkezet: `ido('szó')` → időpontok; jelenetek `t` alapján váltva; minden jelenetben `<Hatter />`, `<Kamera kulcsok=… razas=…>` a világgal, a képernyőhöz rögzített feliratok a kamerán kívül.
3. `npm run tip` (típusellenőrzés), majd gyors próbakockák: `npx remotion still src/index.ts Sztori out/<slug>/proba.png --frame=<N> --props=out/<slug>/sztori.json --scale=0.5` (a `sztori.json`-t az első `render` hozza létre; vagy futtass egy `npm run reel -- render <slug> --elonezet`-et, ami fél felbontásban, gyorsan renderel).
4. `npm run reel -- render <slug>` (a pipeline magától sztori módba vált, ha létezik a `src/sztorik/<slug>.tsx`).

A készlet (`src/sztori/kit.tsx`), 1080×1920-as világkoordinátákban:
- Idő: `useIdo()`, `useSzoIdo()` → `ido('szó', n)`, `ido.vege('szó')` (elírt szónál a render hibát dob és kiírja az elérhető szavakat), `anim(t, [t0, t1], [a, b], Ease.lassul)`, `rugo(t, t0, pattogas)`.
- Kamera és elhelyezés: `<Kamera kulcsok={[{t, x, y, z}]} razas={[{t, ero}]}>`, `<Elem x y s r o flip>`, `utMenten(svgUt, p)` → pont és szög egy útvonalon (pl. golyó a csőben).
- Kellékek: `Pisztoly` (visszarúgással), `Golyo` (arc, kacsintás, szemüveg), `Cso` (SVG útvonal mentén, felépülő), `Figura` (arc: normal, meglepett, ijedt, boldog, ravasz; integet), `Laptop` (növekvő irányítópult), `Iroda` (táblával vagy logóval, kigyulladó ablakok), `Pecset`, `Gomb`, `Kep` (fájl a materyal/marka mappából).
- Szöveg és effekt: `Cim`, `Buborek`, `Bumm` (képregényes robbanás), `Villanas`, `Fust`, `SebessegVonalak`, `Konfetti`, `Hatter`.
- Hang: `<Hang nev="loves" t={…} db={-4} />`. Beépített: loves, whoosh, whoosh_hosszu, pop, ding, bumm, csorrenes, karc, siker, tik, boing, pecset (`npm run sfx -- lista`). Ha kell más (pl. „ricochet”, „cash register”), és van ElevenLabs-kulcs: `npm run sfx -- general "cartoon ricochet ping" rikoset 1` → `hangeffekt/rikoset.mp3`, utána `<Hang nev="rikoset" …/>`.
- Ha a készletből hiányzik egy kellék (autó, rakéta, pénzeső…), rajzold meg SVG-ben ugyanebben a stílusban (vastag sötét kontúr `#111827`, lapos színek, a téma színei), és ha újrahasználható, tedd be a `kit.tsx`-be.

Sztori-szabályok:
- **Ritmus:** 1–2 másodpercenként történjen valami (kameramozgás, belépő kellék, poén, hang). Vágás vagy nagy kameraváltás a mondathatároknál.
- **A poén legyen látható:** a csattanó pillanatában rázás, villanás vagy nagy felirat, és hozzá illő hang.
- **Biztonsági zóna:** a fontos dolgok a képernyőn y = 290 és 1380 között legyenek (alul a feliratsáv van). A kamera nagyítását számold bele: képernyő-y = 960 + (világ-y − kamera-y) · z.
- A feliratsávot (karaoke) a kompozíció magától teszi alá; ne rajzolj alá mást.
- Fegyver, erőszak csak rajzfilmesen és ártalmatlanul (senki nem sérül meg). Fizetett hirdetésnél a Meta a fegyveres képeket elutasíthatja; ezt a riportban jelezd, ha ilyen kellék van benne.

## A `Reel` jelenetek (sahne.json `events`)

Az idők másodpercben. `start`/`dur` a videóhoz képest. A `kinetik`, `szamlalo`, `felsorolas` szavainak / elemeinek `t` értéke **a jelenet elejéhez** képest értendő, a `felirat` szavaié **a videó elejéhez** képest.

| type | mezők | mikor |
|---|---|---|
| `kinetik` | szavak[{w,t}], kiemel?[], hook?, felso?, igazitas? (kozep/bal), karaoke?, be?, atmenet? | Alapjelenet: teljes képernyős szöveg, a szavak a narrációval együtt ugranak be |
| `szamlalo` | ertek, elotag?, utotag?, szavak?[{w,t}] vagy cimke?, be?, atmenet? | Ha szám hangzik el |
| `felsorolas` | elemek[{szoveg,t}], cim?, be?, atmenet? | 3+ felsorolt elem |
| `cta` | szoveg, alszoveg?, gomb?, logo?, be? | Utolsó jelenet, cselekvésre hívás |
| `felirat` | szavak[{w,t,e}], karaoke? | Kiegészítő feliratsáv ott, ahol a kép nem mutatja a kimondott szöveget |
| `progress` | – | Vékony haladásjelző |

A régi `Overlay` elemek is használhatók ugyanígy (`compare`, `chart`, `search`, `shot`, `logo`, `title`, `card`, `list`, `counter` stb., lásd `talimat/video-edit.md` táblázat), a biztonsági zónát ezek is betartják. Ha a műfajhoz új jelenet kell, vedd fel a `src/Reel.tsx`-be és a `src/reelTypes.ts`-be, majd `npm run tip`; ha ana jelenet, a `scripts/kontrol.mjs` `ARA` listájába NE vedd fel (az a kiegészítők listája).

A props gyökérszintű mezői: `width`, `height`, `fps`, `duration` (narráció + `zaro_szunet`), `bg`, `hatter` (`racs`/`foltok`/`sima`), `safe` (`{fent, lent, oldal}` px), `theme` (`primary`, `secondary`, `accent`, `style`, `font`, `szoveg`, `halvany`), opcionálisan `logo` (kis vízjel).

## Beállítások helye

- `ayarlar/hangok.json`: hang presetek. ElevenLabs hangok listája: `npm run hangok -- lista`; hangminták: `npm run hangok -- minta [preset…]` → `out/hangmintak/`.
- `ayarlar/stilusok.json`: stílusok (színek, betű, háttér, logó). Az `aetherpontis` színei ideiglenesek, amíg nincs meg a márkakészlet.
- `ayarlar/reel.json`: méret, fps, biztonsági zóna, vágási tempók, záró szünet.

## Stílusreferencia

Ha a `referenciak/` mappában van minta reel (videó vagy kép), vegyél ki belőle néhány kockát (`ffmpeg -ss <mp> -i <fájl> -frames:v 1 ref.png`), nézd meg, és ehhez igazítsd a tipográfiát, a ritmust és az átmeneteket. A mintákból csak a stílust vedd át; tartalmat, logót, márkaelemet, karaktert soha.

## Általános szabályok

- A forrásfájlokhoz (`materyaller/`, `referenciak/`, `marka/`) ne nyúlj, minden kimenet az `out/` alá kerül.
- A PATH-t ne módosítsd tartósan, shell-profilba ne írj. Python-csomag csak a projekt `.venv` mappájába mehet.
- Zenét és hangeffektet csak a mappában lévő, a felhasználó által megadott fájlból használj.
- Emojit ne használj, hacsak a brief nem kéri.
