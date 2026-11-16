"""edge-tts felolvasás szóhatárokkal.

Használat: python tools/edge_szavak.py SZOVEG_FAJL HANG TEMPO_SZAZALEK KIMENET.mp3 KIMENET.json
A JSON: [{"text": ..., "start": mp, "end": mp}, ...]
"""
import asyncio
import json
import sys

import edge_tts


async def main() -> None:
    szoveg_fajl, hang, tempo, ki_mp3, ki_json = sys.argv[1:6]
    szoveg = open(szoveg_fajl, encoding="utf-8").read()
    com = edge_tts.Communicate(szoveg, hang, rate=tempo, boundary="WordBoundary")
    hatarok = []
    with open(ki_mp3, "wb") as f:
        async for chunk in com.stream():
            if chunk["type"] == "audio":
                f.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                s = chunk["offset"] / 1e7
                hatarok.append({"text": chunk["text"], "start": s, "end": s + chunk["duration"] / 1e7})
    json.dump(hatarok, open(ki_json, "w", encoding="utf-8"), ensure_ascii=False, indent=1)


asyncio.run(main())
