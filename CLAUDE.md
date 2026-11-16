# Video edit projesi

Bu klasör bir video edit akışıdır. Kullanıcı `baslat.bat` ile formu açıp bir brief hazırlar ve Başlat düğmesiyle seni çalıştırır.

Bir `materyaller/<video>/brief.md` dosyası gösterildiğinde veya brief yapıştırıldığında `talimat/video-edit.md` dosyasını oku ve oradaki akışı uygula.

Genel kurallar:
- Her şey bu bilgisayarda yerel çalışır. Bulut adımı yok.
- Orijinal video dosyasına dokunma. Çıktıyı `out/` altına yeni dosya olarak kaydet.
- Render bitince dosyayı veya uygulamayı açma. Sadece nerede olduğunu söyle.
- Kullanıcı yoksa soru sorma, makul varsayımla devam et ve raporda hangi varsayımı yaptığını söyle.
- Gerekli araçlar: Node.js, ffmpeg, Python. Eksik olanı kurmayı önerme, kullanıcıya `baslat.bat` (Mac'te `baslat.command`) dosyasını çalıştırmasını söyle (eksikleri kendisi kurar).
- Çıktı dikeyse yatay ekranı sığdırıp altını boş bırakma: `talimat/video-edit.md` içindeki "5D. Dikey çıktı" akışı. Teslimden önce `node scripts/kontrol.mjs cikti ...` geçmeli.
- Brief'te "Típus: Hangalapú narráció + kép" (eski briefte: "Tür: Sesli anlatım + görsel") yazıyorsa kaynağın görüntüsünü gösterme, sadece sesini kullan: `talimat/video-edit.md` içindeki "5S" akışı ve `node scripts/kontrol.mjs sahne sahne.json` kapısı.
- Küçük model kullanıyorsan önce `talimat/adim-adim.md` dosyasını oku.
- Bilgisayarın PATH ayarını kalıcı değiştirme. `setx` kullanma, kayıt defterine (registry) PATH yazma. Gerekirse sadece o oturumda `$env:Path`, `set PATH=` ya da (Mac) `export PATH=` ile ekle. `~/.zshrc` gibi kabuk dosyalarına da PATH yazma. Araçlar için `ortam.bat` ve `terminal.bat` var.

## Aetherpontis motion reel mód (magyar)

Ez a repó az Aetherpontis reelgyára is. Ha valaki **scriptből kér reelt / motion reelt / rövid videót**, scriptet ad videónak, vagy egy `materyaller/<slug>/brief.md` fájlra mutat, akkor ne a fenti videószerkesztő folyamatot használd, hanem olvasd el a `talimat/motion-reel.md` fájlt, és azt kövesd (Claude Code-ban: `motion-reel` skill, illetve `reel-keszito` alügynök).

- Kérdés nélkül, a scripttől a kész mp4-ig dolgozz („Autopilóta” a talimat/motion-reel.md-ben). Claude Code-ban a `/reel <script>` parancs is ezt indítja.
- Két mód: **tipo** (kinetikus szöveg, gépi vázlatból) és **sztori** (rajzfilmes, vicces jelenetek, amiket te írsz meg a `src/sztorik/<slug>.tsx`-be a `src/sztori/kit.tsx` készletből; minta: `src/sztorik/golyo-cso.tsx`).
- Parancsok: `npm run reel -- uj|hang|vazlat|render|mind <slug>`, `npm run reel -- gyors "<script>"`, `npm run hangok -- lista|minta`, `npm run sfx -- lista|general`.
- A narráció szó szerint a scriptet mondja; a képernyőn nem jelenhet meg új állítás, szám vagy ügyfélnév (sztori módban rövid poén-szöveg mehet).
- A két kapu (`kontrol.mjs sahne` és `kontrol.mjs cikti`) nem hagyható ki; render után nézd meg az `out/<slug>/kockak/attekintes.png` képet.
- API-kulcs csak a `.env` fájlban lehet, soha ne írd kódba, briefbe vagy riportba.
- A felhasználó a magyar nyelvű útmutatót a `HASZNALAT.md`-ben olvassa.
