# Rush Athletic — AI Destekli Atletik Performans ve Sporcu Gelişim Platformu

Çocuk ve gençlerin fiziksel gelişimini bilimsel yöntemlerle değerlendiren, uygun spor branşlarını keşfetmelerine yardımcı olan, branşa özel atletik performans programları hazırlayan, video ile hareket analizi yapan ve antrenör–veli–sporcuyu aynı platformda buluşturan **mobil öncelikli web uygulaması (PWA)**.

> Beslenme, diyet, kalori veya öğün planlaması **yoktur**; odak tamamen atletik performans ve fiziksel gelişimdir.

## Telefona kurulum (GitHub Pages)

1. Bu depoyu GitHub'a yükleyin (dosyalar kök dizinde kalmalı: `index.html`, `manifest.webmanifest`, `sw.js`, `icons/`, `.nojekyll`).
2. GitHub'da **Settings → Pages → Build and deployment → Source: Deploy from a branch**, branch olarak `main` (veya bu dalı) ve klasör olarak `/ (root)` seçin.
3. Birkaç dakika sonra uygulama `https://<kullanıcı-adı>.github.io/<depo-adı>/` adresinde yayında olur.
4. Telefonda açın:
   - **iPhone (Safari):** Paylaş ⬆︎ → **Ana Ekrana Ekle**
   - **Android (Chrome):** ⋮ menü → **Uygulamayı yükle** / **Ana ekrana ekle**
5. Uygulama tam ekran, dikey modda ve çevrimdışı çalışır.

> Şifreli veri saklama (Web Crypto) **HTTPS** gerektirir. GitHub Pages HTTPS sağlar. `index.html` dosyasını doğrudan dosya olarak açmak bazı tarayıcılarda çalışmayabilir.

## Hızlı deneme (Bölüm 27 örnek sporcu)

Giriş ekranında **“Demo çalışma alanı oluştur”** düğmesine basın. 13 yaşında, 165 cm, 52 kg, 2 yıllık basketbolcu örneği için: fiziksel profil, olgunlaşma analizi, ilk/ara/son testler, radar grafiği, basketbol uygunluk ve pozisyon analizi, 12 haftalık onaylı program, antrenman kayıtları, yük takibi, video analizi ve rapor otomatik oluşturulur.

| Rol | E-posta | Şifre |
|---|---|---|
| Antrenör | `antrenor@demo.app` | `Demo1234` |
| Veli | `veli@demo.app` | `Demo1234` |
| Sporcu | `sporcu@demo.app` | `Demo1234` |

Örnek veriler yalnızca sistemin işleyişini göstermek içindir. Gerçek sporcu programları bireysel değerlendirme ve uzman onayı gerektirir.

## Modüller (35 ekran)

Açılış · kayıt/giriş · rol seçimi · rol bazlı ana panel · sporcu oluşturma · sporcu profili · sağlık bilgileri · fiziksel özellikler · antropometri · biyolojik gelişim (Moore 2015 / Mirwald 2002 olgunlaşma ofseti, büyüme hızı, gelişim evresi) · performans test merkezi (28 test, protokol/ekipman/birim/referans/kaynak) · test sonuçları (tipik ölçüm hatasına göre değişim yorumu) · atletik radar (mevcut/önceki/hedef, eksik veri “veri yok”) · branş keşfi (20 branş, açıklanabilir ağırlıklar, ilgi %20) · branş uygunluk raporu (10 başlık) · pozisyon önerileri · program süresi seçimi (2/4/6/8/12/16/24 hafta, 1 yıl, özel) · program oluşturma (dönemlendirme, boşaltma haftaları, sezon/müsabaka, ekipman/ortam, sağlık filtreleri, plyometrik temas sınırı) · haftalık takvim · günlük antrenman (hazır oluş, set takibi, dinlenme zamanlayıcısı, ağrı ile durdurma, RPE) · egzersiz detayı (79 egzersiz, tüm alanlar) · video egzersiz kütüphanesi · video hareket analizi · yük takibi (sRPE, akut:kronik, monotoni, uyku) · ek gelişim · zayıf yön modu · sezon yönetimi · gelişim takibi · uzun vadeli analiz · antrenör paneli · veli paneli · PDF raporları · bildirimler · kullanıcı ayarları · veri ve gizlilik. Ek olarak: grup antrenmanı, sporcu karşılaştırma, branş veri tabanı (yeni branş ekleme), üye/erişim yönetimi, reaksiyon testi, bilimsel referanslar.

## Güvenlik ve çocuk koruma

- Tüm veriler cihazda **AES-256-GCM** ile şifreli saklanır; anahtar her kullanıcının şifresinden **PBKDF2-SHA256 (150.000 tekrar)** ile türetilir (veri anahtarı her üye için ayrı sarmalanır).
- Rol bazlı erişim: antrenör, sağlık ayrıntılarını yalnızca veli izniyle görür; veli yalnızca kendi çocuğunu, sporcu yalnızca kendini görür.
- KVKK izinleri (veri, sağlık, video, fotoğraf, antrenörle paylaşım, çocuğun onayı) zaman damgasıyla kaydedilir; video izni olmadan video yüklenemez.
- Veri dışa aktarma (JSON), şifreli yedek/geri yükleme, sporcu ve çalışma alanı silme, veri işleme kayıtları, otomatik kilit.
- Uygulama **teşhis koymaz, tedavi önermez**; tıbbi onay bekleyen durumlarda program oluşturmayı bekletir, yasaklı hareketleri programa ve testlere almaz, ağrı ≥4/10 bildiriminde antrenmanı durdurur.

## Durum ve sınırlamalar (dürüst beyan)

| Özellik | Durum |
|---|---|
| Program üretimi | **Kural tabanlı, açıklanabilir motor** (çalışır). Büyük dil modeli (LLM) bağlı **değildir**. |
| Harici AI yorumu | Opsiyonel: Ayarlar'da kendi HTTPS sunucunuzu tanımlarsanız anonim özet gönderilir. AI anahtarı istemcide tutulmaz; sunucu sizin tarafınızda olmalıdır. |
| Video analizi – manuel | Kare kare oynatma ve dokunarak açı ölçümü (diz, kalça, FPPA, gövde, pelvis vb.) **tam çalışır**. |
| Video analizi – otomatik | MediaPipe Pose ile **deneysel**; internet gerektirir, her cihazda çalışmayabilir. |
| Referans normlar | Yayınlanmış çalışmalara dayanan **yaklaşık** değerlerdir; kulüp/ülke normlarıyla güncellenmelidir. |
| Çoklu cihaz senkronizasyonu | **Yok** (sunucu gerekir). Her cihaz kendi şifreli verisini tutar; yedek dosyasıyla taşınabilir. |
| Anlık (push) bildirim | Uygulama kapalıyken **yok** (sunucu gerekir). Uygulama açıkken bildirim merkezi ve sistem bildirimi çalışır. |
| PDF | Tarayıcının “PDF olarak kaydet” yazdırma özelliği ile; ayrıca HTML rapor indirme. |

## Geliştirme

Kaynak kod `src/` klasöründe modüler parçalardadır; `index.html` bu parçalardan üretilir:

```bash
./build.sh   # src/*.html + src/*.js → index.html, sw.js önbellek sürümü güncellenir
```

- `src/data.js` — testler, egzersizler, branşlar, sağlık kategorileri, referanslar (yeni branş/test/egzersiz yalnızca veri eklenerek)
- `src/core.js` — şifreli kasa, IndexedDB, yetkilendirme, denetim kaydı, bildirimler
- `src/engine.js` — olgunlaşma, puanlama, branş uygunluğu, program motoru, yük, eğilim, video kuralları
- `src/charts.js` — bağımlılıksız SVG grafikler (radar, çizgi, sütun)
- `src/ui1–5.js` — ekranlar

Harici bağımlılık yoktur (otomatik video analizi hariç; o da yalnızca kullanıldığında yüklenir).

## Bilimsel temel

NSCA (Lloyd ve ark. 2016; Faigenbaum ve ark. 2009), American Academy of Pediatrics (Stricker ve ark. 2020), IOC (Bergeron ve ark. 2015), Youth Physical Development Model (Lloyd & Oliver 2012), Mirwald 2002 / Moore 2015, Foster 2001, Hopkins 2000, Tomkinson 2018, ALPHA (Ruiz 2011), FIFA 11+ Kids ve diğerleri. Tam liste uygulamadaki **Bilimsel referanslar** ekranındadır.
