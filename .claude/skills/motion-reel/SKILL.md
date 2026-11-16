---
name: motion-reel
description: Scriptből kész, narrált 9:16-os reelt készít az Aetherpontisnak, kérdések nélkül – kinetikus tipográfia vagy rajzfilmes, vicces sztori-jelenetek (pl. „mi van, ha…”), hangeffektekkel, karaoke felirattal, ElevenLabs hanggal. Használd, ha valaki reelt, motion reelt, rövid videót kér, scriptet ad videónak, vagy egy materyaller/<slug>/brief.md fájlra mutat. Make a reel from a script.
---

# Motion reel

A teljes folyamat a `talimat/motion-reel.md` fájlban van. Először azt olvasd el, utána a lépéseket sorrendben hajtsd végre. A felhasználó általában egy scriptet ad (hanggal, tempóval, stílussal), vagy egy `materyaller/<slug>/brief.md` fájlra mutat.

Ne kérdezz: az „Autopilóta” szakasz szerint a scripttől a kész, ellenőrzött mp4-ig végigviszed. Röviden: brief → mód (tipo / sztori) → `npm run reel -- hang <slug>` → tipo: `vazlat` + a `sahne.json` javítása; sztori: `src/sztorik/<slug>.tsx` megírása a `src/sztorik/golyo-cso.tsx` mintájára → `npm run reel -- render <slug>` → `kockak/attekintes.png` megnézése → riport.
