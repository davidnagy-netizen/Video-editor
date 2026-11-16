# Aetherpontis Video Editor

Scriptből narrált motion graphic reeleket készítő, helyben futó rendszer és Claude Code ágens az Aetherpontis számára.

- **Bemenet:** egy szövegkönyv (script) és néhány beállítás: hang, beszédtempó, vágási tempó, stílus, felirat.
- **Kimenet:** 1080×1920-as, 30 fps-es H.264 mp4, narrációval, a narrációhoz szóra pontosan időzített kinetikus tipográfiával, számlálókkal, felsorolásokkal, karaoke felirattal és záró CTA-val.
- **Hang:** ElevenLabs (API-kulccsal) vagy ingyenes magyar Microsoft-hangok (edge-tts).
- **Render:** [Remotion](https://www.remotion.dev/) + ffmpeg, minden a saját gépen fut; csak a hang generálása megy felhőbe.

Kezdés és napi használat: **[HASZNALAT.md](HASZNALAT.md)**. Az ágens munkafolyamata: [talimat/motion-reel.md](talimat/motion-reel.md).

```
npm install
cp .env.example .env            # ELEVENLABS_API_KEY=...
npm run reel -- mind pelda-va-reggel
```

## Felépítés

| Hely | Mi van ott |
|---|---|
| `tools/reel.mjs` | A folyamat: `uj`, `hang`, `vazlat`, `render`, `mind` |
| `tools/narracio.mjs` | Narráció + szószintű időbélyeg (ElevenLabs / edge-tts / espeak teszt) |
| `tools/vazlat.mjs` | Gépi jelenetvázlat a szóidőkből (az ágens ezt finomítja) |
| `tools/hangok.mjs` | Hanglista és hangminták |
| `src/Reel.tsx`, `src/reelTypes.ts` | A motion graphic jelenetek (kinetik, szamlalo, felsorolas, cta, felirat, háttér, átmenetek) |
| `scripts/kontrol.mjs` | Ellenőrző kapuk (render előtt és után) |
| `ayarlar/` | Hangok, stílusok, közös reel-beállítások |
| `materyaller/<slug>/brief.md` | Reelenként egy brief (verziózott); a `materyal/` almappa anyagai nem kerülnek fel |
| `.claude/skills/motion-reel`, `.claude/agents/reel-keszito.md` | Claude Code skill és alügynök |

## Eredet és licenc

A [omergocmen/ai-video-edit-workflow](https://github.com/omergocmen/ai-video-edit-workflow) (MIT licenc, © 2026 Omer Gocmen) továbbfejlesztése; az eredeti videószerkesztő mód és leírása (`README.eredeti.md`) megmaradt. A beépített Inter betűtípus az OFL-1.1 licenc alatt áll (`public/fonts/LICENSE-Inter.txt`). A Remotion saját licence a 3 főnél nagyobb profitorientált cégeknek céges licencet ír elő.
