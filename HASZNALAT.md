# Aetherpontis reelgyár – használati útmutató

Scriptből kész, narrált 9:16-os motion graphic reel: animált tipográfia, számlálók, felsorolások, karaoke felirat és a végén cselekvésre hívás. Forgatás és kézi vágás nélkül.

## Egyszeri beállítás (Mac)

1. Telepítsd a szükséges programokat (Terminálban): `brew install node ffmpeg python`
2. Lépj be a mappába, és telepítsd a projektet: `npm install`
3. Másold le a `.env.example` fájlt `.env` néven, és írd bele az ElevenLabs API-kulcsot. Kulcs nélkül is működik az ingyenes `noemi` és `tamas` hanggal.
4. Ha megvan a márkakészlet: logó a `marka/` mappába, színek és logónév az `ayarlar/stilusok.json` `aetherpontis` részébe (lásd `marka/README.md`).
5. Hangminták meghallgatása: `npm run hangok -- minta`, a fájlok az `out/hangmintak/` mappában lesznek.

Az első render letölti a Remotion saját böngészőjét (egyszer, kb. 100 MB).

## Reel készítése az ágenssel (ajánlott)

Nyisd meg a Terminált ebben a mappában, indítsd el a Claude Code-ot (`claude`), és írd be például:

> Készíts reelt ebből a scriptből: „…”. Hang: noemi, beszédtempó 1.05, gyors vágás, aetherpontis stílus.

Az ágens megírja a briefet, legenerálja a hangot, megtervezi és átnézi a jeleneteket, renderel, lefuttatja a két ellenőrzést, megnézi a képkockákat, és megmondja, hol a kész videó. Több reel egyszerre: „Készítsd el a materyaller mappában lévő összes új briefet” – ilyenkor a `reel-keszito` alügynök reelenként külön dolgozik.

A Cowork asztali alkalmazásban (csatolt mappával) is működik, de ott a cégszintű hálózati szabályok miatt az ElevenLabs és a Microsoft hangszolgáltatás le lehet tiltva. Ilyenkor a hangot a Terminálban generáld, vagy kérd meg az adminisztrátort, hogy engedélyezze az `api.elevenlabs.io` címet.

## Reel készítése kézzel (parancsokkal)

```
npm run reel -- uj va-reggeli-emailek      # új brief: materyaller/va-reggeli-emailek/brief.md
(töltsd ki a briefet)
npm run reel -- mind va-reggeli-emailek    # hang + vázlat + render egyben
```

Vagy lépésenként, ha a jeleneteket kézzel szeretnéd finomítani:

```
npm run reel -- hang va-reggeli-emailek
npm run reel -- vazlat va-reggeli-emailek  # out/va-reggeli-emailek/sahne.json és plan.md
(sahne.json szerkesztése, előnézet: npm run studio → "Reel")
npm run reel -- render va-reggeli-emailek
```

A kész videó: `out/<név>/<név>-<dátum-idő>.mp4`. Mellette a `kockak/attekintes.png` 8 képkockát mutat; a piros sávok azok a részek, amelyeket az Instagram felülete eltakar.

## A brief beállításai

| Beállítás | Értékek | Mit jelent |
|---|---|---|
| `hang` | `noemi`, `tamas`, `el-noi`, `el-ferfi`, `david-klon`, `mate-klon`, `emma-en`, `andrew-en`, `teszt` | A narrátor. Lista: `npm run hangok -- lista` |
| `beszedtempo` | 0.85 – 1.2 | A narráció sebessége (1.0 = normál) |
| `vagasi_tempo` | `nyugodt`, `kozepes`, `gyors` | Milyen gyakran vált a kép: 4–6 / 2,5–4 / 1,5–2,5 mp-enként |
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
