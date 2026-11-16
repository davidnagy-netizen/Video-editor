---
name: motion-reel
description: Scriptből narrált, 9:16-os motion graphic reelt készít az Aetherpontisnak (ElevenLabs vagy ingyenes hang, kinetikus tipográfia, karaoke felirat, Remotion render). Használd, ha valaki reelt, motion reelt, rövid videót kér egy szövegből, scriptet ad videónak, vagy egy materyaller/<slug>/brief.md fájlra mutat. Make a motion graphic reel from a script.
---

# Motion reel

A teljes folyamat a `talimat/motion-reel.md` fájlban van. Először azt olvasd el, utána a lépéseket sorrendben hajtsd végre. A felhasználó általában egy scriptet ad (hanggal, tempóval, stílussal), vagy egy `materyaller/<slug>/brief.md` fájlra mutat.

Röviden: brief → `npm run reel -- hang <slug>` → `npm run reel -- vazlat <slug>` → a `out/<slug>/sahne.json` átnézése és javítása → `npm run reel -- render <slug>` → a `kockak/attekintes.png` megnézése → riport.
