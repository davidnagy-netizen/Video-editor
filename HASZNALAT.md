# Aetherpontis reelgyár – használati útmutató

Scriptből kész, narrált 9:16-os motion graphic reel: animált tipográfia, számlálók, felsorolások, karaoke felirat és a végén cselekvésre hívás. Forgatás és kézi vágás nélkül.

## Egyszeri beállítás (Mac)

1. Telepítsd a szükséges programokat (Terminálban): `brew install node ffmpeg python`
2. Lépj be a mappába, és telepítsd a projektet: `npm install`
3. Másold le a `.env.example` fájlt `.env` néven, és írd bele az ElevenLabs API-kulcsot. Kulcs nélkül is működik az ingyenes `noemi` és `tamas` hanggal.
4. Ha megvan a márkakészlet: logó a `marka/` mappába, színek és logónév az `ayarlar/stilusok.json` `aetherpontis` részébe (lásd `marka/README.md`).
5. Hangminták meghallgatása: `npm run hangok -- minta`, a fájlok az `out/hangmintak/` mappában lesznek.

Az első render letölti a Remotion saját böngészőjét (egyszer, kb. 100 MB).

## Reel készítése: beilleszted a scriptet, és kész

Három út van, mindegyik ugyanazt a rendszert használja.

**1. Reel Stúdió (a legegyszerűbb).** A Terminálban: `npm run studio-reel`. Megnyílik a böngészőben egy oldal: beilleszted a scriptet, kiválasztod a hangot, a tempót és a stílust, és rányomsz a „Reel készítése” gombra. A kész videó ugyanott lejátszható. Ha a gépen van Claude Code, az ágens dolgozik (szöveges és rajzfilmes sztori reel is); ha nincs, gépi szöveges reel készül.

**2. Claude Code-ban egy sorral.** Indítsd el a `claude` parancsot ebben a mappában, és írd be:

> /reel Mi van, ha kilövünk egy golyót egy csőbe, ami visszavezet ránk? … Hang: el-ferfi, pörgős.

Az ágens nem kérdez: eldönti, hogy szöveges (kinetikus tipográfia) vagy rajzfilmes sztori reel illik-e a scripthez, legenerálja a hangot, megrajzolja a jeleneteket, hangeffekteket tesz alá, renderel, ellenőriz, és megmondja, hol a kész videó.

**3. Egyetlen paranccsal, ágens nélkül (csak szöveges reel).**

```
npm run reel -- gyors "Három tipp, hogy ne fulladj bele az e-mailekbe. Egy: …" --tempo porgos --stilus neon
```

## A két mód

- **Szöveges (tipo):** nagy, a beszéddel szóra pontosan együtt mozgó szöveg, számlálók, felsorolások, CTA. Tippekhez, állításokhoz, oktató tartalomhoz.
- **Sztori:** rajzfilmes jelenetek szereplőkkel és tárgyakkal (pisztoly, golyó, cső, laptop, iroda, figura, pecsét, robbanás…), kamerarázással, villanással, hangeffektekkel. Vicces, „mi van, ha…” típusú ötletekhez. A minta a `src/sztorik/golyo-cso.tsx` (a golyós reel); az ágens minden új sztorit ehhez hasonlóan, a scripthez igazítva rajzol meg.

## Hangeffektek

Alapból szólnak: suhanás a jelenetváltásnál, pukkanás, csengő a CTA-nál; sztori módban lövés, csörrenés, lemezkarc, boing, pecsét stb. (`npm run sfx -- lista`). ElevenLabs-kulccsal bármilyen új effekt generálható: `npm run sfx -- general "cartoon cash register ding" kassza`. Ezek a `hangeffekt/` mappába kerülnek, és onnan újrahasználhatók. Kikapcsolás a briefben: `hangeffekt: nem`.

## Reel készítése kézzel (parancsokkal)

```
npm run reel -- uj va-reggeli-emailek      # új brief: materyaller/va-reggeli-emailek/brief.md
(töltsd ki a briefet)
npm run reel -- mind va-reggeli-emailek    # hang + vázlat + render egyben
```

Gyors próbához `--elonezet`: fél felbontásban, sokkal gyorsabban renderel. A végleges videó mindig teljes felbontásban készüljön.

## A brief beállításai

| Beállítás | Értékek | Mit jelent |
|---|---|---|
| `hang` | `noemi`, `tamas`, `el-noi`, `el-ferfi`, `david-klon`, `mate-klon`, `emma-en`, `andrew-en`, `teszt` | A narrátor. Lista: `npm run hangok -- lista` |
| `beszedtempo` | 0.85 – 1.2 | A narráció sebessége (1.0 = normál) |
| `vagasi_tempo` | `nyugodt`, `kozepes`, `gyors`, `porgos` | Milyen gyakran vált a kép: 4–6 / 2,5–4 / 1,5–2,5 / 0,8–1,6 mp-enként |
| `mod` | `auto`, `tipo`, `sztori` | Szöveges vagy rajzfilmes reel (auto: az ágens dönt) |
| `hangeffekt` | `igen`, `nem` | Hangeffektek a jelenetekhez |
| `stilus` | `aetherpontis`, `vilagos`, `neon`, `editoryal` | Színek, betűtípus, háttér |
| `felirat` | `karaoke`, `sima`, `nincs` | Karaoke: az éppen elhangzó szó kiemelve |
| `zene` | `nincs` vagy fájlnév | Háttérzene a `materyal/` mappából; beszéd alatt automatikusan halkul |
| `cta` | szöveg | A záró képernyő felirata; üresen az utolsó mondat lesz |
| `KIEJTÉS:` | `szó = kiejtés` | Csak a hangot módosítja (pl. márkanevek), a felirat a scriptet mutatja |

## Hangok

- **noemi / tamas**: ingyenes magyar Microsoft-hangok, kulcs nélkül működnek. Teszthez és belső anyagokhoz jók.
- **el-noi / el-ferfi**: ElevenLabs, sokkal természetesebb. Az alapbeállítás egy angol alaphang, ami magyarul is beszél; érdemes a Voice Library-ből magyar anyanyelvű hangot választani, és a voice ID-t beírni az `ayarlar/hangok.json` fájlba (`npm run hangok -- lista` kiírja a fiókodban elérhető hangokat).
- **david-klon / mate-klon**: ha az ElevenLabsben klónozzátok a saját hangotokat, az ID-t ide kell beírni.
- **teszt**: helyi robothang, csak a rendszer kipróbálására. Ilyen videót ne posztolj.

## Jó tudni

- A kódbázis a [omergocmen/ai-video-edit-workflow](https://github.com/omergocmen/ai-video-edit-workflow) (MIT) projektre épül, ezért a régi fájl- és mezőnevek egy része török. A meglévő videószerkesztő mód (felvett videó szerkesztése) továbbra is használható, lásd `README.eredeti.md`.
- **Remotion licenc:** a Remotion 3 főnél nagyobb profitorientált cégeknek fizetős céges licencet ír elő. Éles használat előtt nézzétek meg a remotion.pro oldalon, hogy rátok mi vonatkozik.
- Az API-kulcs csak a `.env` fájlban legyen; az nem kerül fel a GitHubra.
- Fegyveres poénokat organikus posztban nyugodtan, de **fizetett hirdetésben a Meta a fegyvert ábrázoló kreatívokat elutasíthatja**. Hirdetéshez érdemes a golyót más tárgyra cserélni (pl. papírrepülő, labda).
