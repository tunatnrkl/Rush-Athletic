# Rush Athletic — Sporcu Gelişim Platformu

Antrenör, öğrenci ve velinin aynı uygulamada, **farklı yetkilerle** buluştuğu mobil web uygulaması (PWA).

| Rol | Nasıl katılır? | Ne yapar? |
|---|---|---|
| **Antrenör** | Kendisi hesap açar | Öğrenci ekler (kod üretir), boy/kilo/kol açıklığı gibi ölçümleri ve sıçrama, sprint, kuvvet testlerini **yalnızca o** girer, program hazırlar, grupları yönetir |
| **Öğrenci** | **Yalnızca antrenörün verdiği kodla** | Kendi kişisel bilgilerini ve sağlık durumunu girer, antrenmanını yapar, hareket videosunu yapay zekâya yorumlatır, veli kodu üretir |
| **Veli** | **Yalnızca öğrencinin verdiği kodla** | Çocuğunun programını, devamlılığını, hedeflerini, test sonuçlarını izler — **hiçbir şeyi değiştiremez** |

Bu kurallar bulutta **veritabanı sunucusunda zorunludur** (öğrenci test giremez, veli yazamaz, antrenörler birbirinin öğrencisini göremez).

## Telefona kurulum (GitHub Pages)

1. GitHub'da depo → **Settings → Pages** → Source: **Deploy from a branch** → Branch: **main**, klasör **/ (root)** → **Save**.
2. 1–3 dakika sonra adres: `https://<kullanıcı-adınız>.github.io/Rush-Athletic/`
3. Telefonda açın → iPhone: Paylaş → **Ana Ekrana Ekle** · Android: ⋮ → **Uygulamayı yükle**.

## İki çalışma modu

- **Deneme modu (kurulum gerekmez):** `config.js` boşsa uygulama böyle çalışır. Tüm hesaplar **aynı telefonda** tutulur. Giriş ekranındaki **“Örnek verilerle dene”** ile antrenör (`antrenor`), öğrenci (`deniz`) ve veli (`veli`) hesapları oluşur; şifre `demo1234`.
- **Bulut modu (farklı telefonlar):** Antrenörün kodunu öğrencinin **kendi telefonunda** girebilmesi için ücretsiz bir Supabase veritabanı gerekir. Kurulum bir kez yapılır (~10 dakika):

### Bulut kurulumu (Supabase, ücretsiz)

1. https://supabase.com → **Start your project** → GitHub hesabınızla giriş yapın.
2. **New project** → bir ad verin (ör. `rush-athletic`), bir veritabanı şifresi belirleyin, bölge olarak **Frankfurt (eu-central-1)** seçin → **Create**. 1–2 dakika bekleyin.
3. Sol menü **SQL Editor** → **New query** → bu depodaki `supabase/schema.sql` dosyasının **tamamını** yapıştırın → **Run**. (“Success” görmelisiniz.)
4. Sol menü **Authentication → Sign In / Providers → Email** → **Confirm email** seçeneğini **kapatın** → **Save**. (Çocukların e-postası olmayabilir; uygulama kullanıcı adıyla da çalışır.)
5. Sol menü **Project Settings → API** (veya **Data API**) sayfasından iki bilgiyi kopyalayın: **Project URL** ve **anon public** anahtarı.
6. GitHub'da bu depodaki `config.js` dosyasını açın → kalem simgesi → iki değeri tırnakların içine yapıştırın → **Commit changes**:
   ```js
   window.RUSH_CONFIG = {
     supabaseUrl: "https://xxxxxxxx.supabase.co",
     supabaseAnonKey: "eyJhbGciOi..."
   };
   ```
7. 1–2 dakika sonra uygulamayı yenileyin. Giriş ekranının altında **“Bulut (tüm cihazlarda)”** yazmalı.

> `anon public` anahtarının `config.js` içinde herkese açık durması Supabase'in öngördüğü kullanımdır; asıl koruma `schema.sql` içindeki satır güvenliği (RLS) ve rol kontrollü fonksiyonlardadır. **`service_role` anahtarını asla buraya koymayın.**

## Akış

1. **Antrenör** hesap açar → **Yeni öğrenci ekle** → 6 haneli kod çıkar → **Paylaş** ile öğrenciye gönderir.
2. **Öğrenci** uygulamayı açar → **Öğrenciyim** → kodu girer → kullanıcı adı/şifre belirler → kendi bilgilerini ve sağlık durumunu doldurur.
3. **Antrenör** ölçüm ve testleri girer (tek tek, önerilen batarya ile toplu veya grup halinde), programı oluşturur.
4. **Öğrenci** “Bugün” ekranından antrenmanı yapar: nasıl hissettiği, set takibi, dinlenme sayacı, zorluk (RPE). Ağrı 4/10 ve üzeriyse antrenman durur, antrenöre uyarı düşer.
5. **Öğrenci** Profilim → **Veli kodu** oluşturur → **Veli** “Veliyim” ile bu kodu girer ve izler.

## Görsel yapay zekâ (video ile hareket yorumu)

- Öğrenci antrenmandaki egzersizin yanındaki **AI** düğmesiyle (veya “Video AI” sekmesinden) hareketini çeker; antrenör de öğrencinin sayfasındaki **Video** sekmesinden çekebilir.
- Google'ın **MediaPipe Pose** modeli videonun her karesinde 33 vücut noktasını **telefonun içinde** bulur; video hiçbir sunucuya gönderilmez, yalnızca analiz sonucu kaydedilir. Model dosyaları `vendor/mediapipe/` içindedir; ilk kullanımdan sonra internetsiz de çalışır.
- Desteklenen hareket türleri: squat, hamle (lunge/split squat), sıçrama ve iniş, sprint/koşu, tek ayak denge, şınav, plank, kalça menteşe (RDL/swing). Egzersiz kütüphanesindeki ~60 egzersiz bu türlere bağlıdır.
- Ölçülenler: tekrar sayısı, derinlik (diz açısı / kalça düşüşü), gövde eğimi, dizlerin içe kaçması (diz/ayak bileği aralık oranı), topuk kalkması, iniş yumuşaklığı, uçuş süresinden tahmini sıçrama yüksekliği (h = g·t²/8), yer temas süresi ve RSI, denge salınımı ve kalça düşmesi, vücut çizgisi, sprintte diz çekişi ve ayak basış konumu.
- Çıktı: 0–100 teknik puan, “iyi yaptıkların”, “düzeltmen gerekenler” (ipucuyla), önerilen egzersizler ve iskelet çizilmiş anahtar kare.
- Sınırlar: 2B video olduğu için açı ölçümlerinde birkaç derece hata olabilir; çekim açısı önemlidir (uygulama her hareket için açıyı söyler). Teşhis değildir.

## Durum ve sınırlamalar

| Konu | Durum |
|---|---|
| Program üretimi | Açıklanabilir, kural tabanlı motor (yaş, olgunlaşma, sağlık kısıtlamaları, ekipman, maç takvimi). Büyük dil modeli bağlı değildir. |
| Video yapay zekâsı | Cihaz üzerinde MediaPipe + spor bilimi kuralları. Gerçek kişi fotoğrafıyla doğrulandı; farklı telefonlarda performans değişebilir. |
| Bildirimler | Uygulama içinde (verilerden hesaplanır). Uygulama kapalıyken telefona anlık bildirim (push) yoktur. |
| Önceki sürüm verileri | 1.0'daki tek cihaz şifreli kasa verileri bu sürüme taşınmaz (yalnızca deneme verisi vardı). |
| Referans normlar | Yayınlanmış çalışmalara dayanan yaklaşık değerlerdir. |

## Geliştirme

`src/` klasöründeki parçalardan tek dosyalık `index.html` üretilir:

```bash
./build.sh
```

- `src/data.js` testler, egzersizler, branşlar · `src/engine.js` program motoru ve analizler · `src/vision.js` görsel yapay zekâ
- `src/api.js` veri katmanı (deneme modu / Supabase) · `src/store.js` rol bazlı belge ayrımı
- `src/ui-coach.js` antrenör · `src/ui-athlete.js` öğrenci · `src/ui-parent.js` veli · `src/ui-common.js` ortak ekranlar
- `supabase/schema.sql` veritabanı ve yetki kuralları

Üçüncü taraf: `vendor/mediapipe/` — @mediapipe/tasks-vision 0.10.14 ve Pose Landmarker Lite modeli (Apache 2.0, © Google).
