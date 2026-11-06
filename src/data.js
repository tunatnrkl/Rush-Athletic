/* =========================================================================
   RUSH ATHLETIC — MODÜLER KATALOGLAR (testler, egzersizler, branşlar, sağlık)
   Yeni branş / test / egzersiz eklemek için yalnızca bu dizilere kayıt eklenir.
   ========================================================================= */
const APP_VERSION = "1.0.0";
const ENGINE_VERSION = "kural-tabanlı motor v1.0";

const QUALITIES = [
  {k:"str", n:"Kuvvet"}, {k:"pow", n:"Patlayıcı kuvvet"}, {k:"spd", n:"Sürat"},
  {k:"agi", n:"Çeviklik"}, {k:"end", n:"Dayanıklılık"}, {k:"coo", n:"Koordinasyon"},
  {k:"bal", n:"Denge"}, {k:"mob", n:"Mobilite"}, {k:"rea", n:"Reaksiyon"}
];
const QN = Object.fromEntries(QUALITIES.map(q => [q.k, q.n]));
const FEAT_N = Object.assign({H:"Boy (yaşa göre)", AS:"Kol açıklığı / boy", M:"Vücut kütlesi (boya göre)"}, QN);

/* Hareket kısıtlama etiketleri — sağlık kayıtlarından gelir, egzersiz/test filtresinde kullanılır */
const RTAGS = {
  jump:"Sıçrama / iniş (plyometrik)", sprint:"Maksimal sürat koşusu", run:"Koşu / tekrarlı koşu",
  cod:"Ani yön değiştirme", overhead:"Baş üstü kol hareketleri", upperLoad:"Üst ekstremite itme yükü",
  wrist:"El bileği yüklenmesi", grip:"Kavrama / taşıma", spine:"Omurgaya eksenel yük",
  flexion:"Omurga fleksiyonu (öne eğilme)", rotation:"Dirençli / hızlı gövde rotasyonu",
  deepKnee:"Derin diz bükme", contact:"Fiziksel temas", inversion:"Baş aşağı pozisyon",
  valsalva:"Nefes tutma / yüksek izometrik zorlanma", maxEffort:"Maksimal efor / yüksek nabız"
};

const EQUIP = {
  db:"Dambıl", kb:"Kettlebell", band:"Direnç bandı", bar:"Barbell", cone:"Koni", hurdle:"Engel (mini)",
  rope:"İp", mb:"Sağlık topu", box:"Plyometrik kutu", balance:"Denge ekipmanı", sprintEq:"Sprint ekipmanı (kızak/paraşüt/fotosel)",
  cardio:"Kardiyo cihazları", ball:"Top (branş topu)"
};
const ENVS = {
  home:{n:"Ev", space:false, eq:["band","rope","ball"]},
  outdoor:{n:"Açık alan", space:true, eq:["cone","rope","ball","band"]},
  school:{n:"Okul spor salonu", space:true, eq:["cone","rope","ball","mb","hurdle","balance"]},
  gym:{n:"Profesyonel spor salonu", space:false, eq:["db","kb","band","bar","mb","box","balance","cardio","rope"]},
  perf:{n:"Atletik performans merkezi", space:true, eq:Object.keys(EQUIP)},
  club:{n:"Spor kulübü", space:true, eq:["cone","hurdle","rope","ball","mb","band","box","db","balance"]}
};

const SEASON_PHASES = {
  pre:{n:"Sezon öncesi hazırlık", vol:1.0, note:"Genel ve özel hazırlık; kapasite ve kuvvet temeli."},
  in:{n:"Sezon içi performans", vol:0.7, note:"Kısa, yüksek kaliteli seanslar; kuvvet ve sürat korunur, hacim düşer."},
  trans:{n:"Sezon arası geçiş", vol:0.8, note:"Çeşitlilik, farklı hareket deneyimleri, zayıf yönler."},
  post:{n:"Sezon sonrası toparlanma", vol:0.6, note:"Aktif dinlenme, mobilite, oyun temelli hareket."},
  precomp:{n:"Müsabaka öncesi hazırlık", vol:0.75, note:"Yoğunluk korunur, hacim azaltılır (tapering)."},
  tourn:{n:"Turnuva dönemi", vol:0.55, note:"Yalnızca aktivasyon, mobilite ve kısa sürat uyarıları."}
};

/* -------------------------------------------------------------------------
   SAĞLIK KATEGORİLERİ — varsayılan tıbbi onay gereksinimi ve öneri kısıtlamalar
   (Sistem TEŞHİS KOYMAZ; yalnızca kayıt, uyarı ve program filtresi sağlar.)
   ------------------------------------------------------------------------- */
const HEALTH_CATS = [
  {k:"chronic", n:"Kronik hastalık", clear:true, tags:[]},
  {k:"cardio", n:"Kalp ve damar hastalığı", clear:true, tags:["maxEffort","valsalva"]},
  {k:"asthma", n:"Astım", clear:true, tags:[]},
  {k:"resp", n:"Solunum problemi", clear:true, tags:["maxEffort"]},
  {k:"neuro", n:"Nörolojik rahatsızlık", clear:true, tags:[]},
  {k:"ortho", n:"Ortopedik rahatsızlık", clear:true, tags:[]},
  {k:"scoliosis", n:"Skolyoz", clear:true, tags:["spine"]},
  {k:"spine", n:"Omurga problemi", clear:true, tags:["spine","flexion","rotation"]},
  {k:"posture", n:"Duruş bozukluğu", clear:false, tags:[]},
  {k:"muscle", n:"Kas hastalığı", clear:true, tags:["maxEffort"]},
  {k:"joint", n:"Eklem problemi", clear:true, tags:[]},
  {k:"sense", n:"Görme / işitme kısıtlılığı", clear:false, tags:[]},
  {k:"congenital", n:"Doğuştan fiziksel farklılık", clear:true, tags:[]},
  {k:"mobility", n:"Hareket kısıtlılığı", clear:true, tags:[]},
  {k:"surgery", n:"Geçmiş ameliyat", clear:true, tags:[]},
  {k:"injury", n:"Sakatlık geçmişi", clear:false, tags:[]},
  {k:"pain", n:"Güncel ağrı", clear:true, tags:[]},
  {k:"doctorban", n:"Doktor tarafından yasaklanan hareket", clear:false, tags:[]},
  {k:"restriction", n:"Egzersiz kısıtlaması", clear:false, tags:[]},
  {k:"medication", n:"Kullanılan ilaç", clear:false, tags:[]},
  {k:"other", n:"Diğer", clear:false, tags:[]}
];
const HCAT = Object.fromEntries(HEALTH_CATS.map(c => [c.k, c]));

/* -------------------------------------------------------------------------
   PERFORMANS TESTLERİ
   n: {m:[8 yaş, 12 yaş, 16 yaş], f:[...]} yaklaşık ortalamalar (doğrusal ara değer)
   sd: mutlak standart sapma, sdf: ortalamanın oranı olarak SS
   cv: tipik hata (% değişkenlik), te: mutlak tipik hata
   UYARI: Referanslar yaklaşık popülasyon değerleridir; kulüp/ülke normları ile güncellenmelidir.
   ------------------------------------------------------------------------- */
const SRC = {
  tomk:"Tomkinson GR ve ark. (2018) Br J Sports Med 52:1445 — Avrupalı çocuk ve ergenlerde fiziksel uygunluk normları",
  alpha:"Ruiz JR ve ark. (2011) ALPHA sağlıkla ilişkili fitness test bataryası, Br J Sports Med 45:518",
  nsca:"NSCA (2016) Essentials of Strength Training and Conditioning, 4. baskı — test protokolleri",
  sprint:"Gençlik sprint performansı çalışmaları (ör. Meyers ve ark. 2015, J Sports Sci) — yaklaşık değerler",
  yoyo:"Bangsbo J ve ark. (2008) Sports Med 38:37 — Yo-Yo testleri; genç referansları yaklaşık",
  leger:"Léger LA ve ark. (1988) J Sports Sci 6:93; Tomkinson ve ark. (2017) — 20 m mekik koşusu",
  sixmwt:"ATS (2002) 6 dakika yürüme testi kılavuzu; Geiger R ve ark. (2007) J Pediatr 150:395",
  eurofit:"Council of Europe (1993) EUROFIT test bataryası",
  ybal:"Plisky PJ ve ark. (2006/2009) Y Denge Testi; gençlerde değerler yaklaşık",
  ktk:"Kiphard & Schilling — Körperkoordinationstest für Kinder (KTK); yaklaşık değerler",
  agil:"Pauole K ve ark. (2000) T-test; Draper & Lancaster (1985) 505; Illinois çeviklik testi",
  wall:"Mackenzie B (2005) 101 Performance Evaluation Tests — duvar topu testi; yaklaşık",
  ankle:"Bennell K ve ark. (1998) diz-duvar testi güvenilirliği",
  rt:"Uygulama içi dokunmatik reaksiyon; cihaz gecikmesi içerir — yalnızca bireysel karşılaştırma için güvenilir",
  fgram:"FitnessGram (Cooper Institute) test protokolleri",
  hop:"Myer GD ve ark. — tek ayak sekme ve asimetri değerlendirmesi; yaklaşık"
};
const TESTS = [
  {id:"sp5",n:"5 m sprint",q:"spd",u:"s",lb:1,dec:2,minAge:6,tags:["sprint"],eq:"Fotosel veya kronometre, 2 koni",
   purpose:"İlk adım hızı ve hızlanma kapasitesi.",
   proto:"Ön ayak çizginin 0,5 m gerisinde iki noktalı çıkış. 2–3 deneme, aralarda en az 2 dk dinlenme; en iyi değer kaydedilir. Elle kronometre fotosele göre 0,1–0,2 s fark yaratabilir; tekrar testlerde aynı yöntemi kullanın.",
   nm:{m:[1.42,1.28,1.16],f:[1.47,1.34,1.28]},sd:0.09,cv:3.5,src:SRC.sprint,pop:"8–16 yaş okul/kulüp çocukları (yaklaşık)"},
  {id:"sp10",n:"10 m sprint",q:"spd",u:"s",lb:1,dec:2,minAge:6,tags:["sprint"],eq:"Fotosel veya kronometre, 2 koni",
   purpose:"Hızlanma kapasitesi; takım sporlarında kritik.",
   proto:"Ayakta iki noktalı çıkış, 10 m'ye maksimal koşu. 2–3 deneme, 2–3 dk dinlenme, en iyi süre.",
   nm:{m:[2.40,2.15,1.95],f:[2.46,2.24,2.14]},sd:0.14,cv:2.5,src:SRC.sprint,pop:"8–16 yaş (yaklaşık)"},
  {id:"sp20",n:"20 m sprint",q:"spd",u:"s",lb:1,dec:2,minAge:7,tags:["sprint"],eq:"Fotosel veya kronometre, koniler, 25 m alan",
   purpose:"Hızlanma + sürat geçişi.",
   proto:"Ayakta çıkış, 20 m maksimal koşu, bitişten sonra 5 m yavaşlama alanı. 2–3 deneme, en iyi süre.",
   nm:{m:[4.25,3.85,3.45],f:[4.40,4.02,3.85]},sd:0.25,cv:2,src:SRC.sprint,pop:"8–16 yaş (yaklaşık)"},
  {id:"sp30",n:"30 m sprint",q:"spd",u:"s",lb:1,dec:2,minAge:8,tags:["sprint"],eq:"Fotosel veya kronometre, 40 m alan",
   purpose:"Hızlanma ve maksimal sürate yaklaşma.",
   proto:"Ayakta çıkış, 30 m maksimal koşu. 2 deneme, 3 dk dinlenme.",
   nm:{m:[6.00,5.35,4.75],f:[6.20,5.62,5.32]},sd:0.35,cv:2,src:SRC.sprint,pop:"8–16 yaş (yaklaşık)"},
  {id:"fly20",n:"Maksimum sürat (uçan 20 m)",q:"spd",u:"s",lb:1,dec:2,minAge:10,tags:["sprint"],eq:"Fotosel önerilir, 45 m alan",
   purpose:"Maksimal koşu hızı.",
   proto:"20 m kademeli hızlanma bölgesi + 20 m ölçüm bölgesi. 2 deneme, 3–4 dk dinlenme. Isınma tam olmalı.",
   nm:{m:[3.60,3.15,2.75],f:[3.75,3.35,3.15]},sd:0.22,cv:2,src:SRC.sprint,pop:"10–16 yaş (yaklaşık)"},
  {id:"cmj",n:"Dikey sıçrama (CMJ)",q:"pow",u:"cm",lb:0,dec:1,minAge:7,tags:["jump"],eq:"Sıçrama matı, doğrulanmış uygulama veya duvar işareti",
   purpose:"Alt ekstremite patlayıcı kuvveti.",
   proto:"Eller belde, hızlı çömelme ve maksimal dikey sıçrama. 3 deneme, 1 dk dinlenme, en iyi değer. Yöntem (mat/uygulama/duvar) kaydedilmeli; yöntemler arası değerler karşılaştırılamaz.",
   nm:{m:[22,29,39],f:[21,26,29]},sd:5,cv:5,src:SRC.nsca,pop:"8–16 yaş (yaklaşık)"},
  {id:"sbj",n:"Durarak uzun atlama",q:"pow",u:"cm",lb:0,dec:0,minAge:6,tags:["jump"],eq:"Mezura, kaymaz zemin",
   purpose:"Yatay patlayıcı kuvvet; ALPHA bataryası testi.",
   proto:"Çizgi gerisinden çift ayak, kol savuruşlu maksimal atlama. Arka topuğa ölçülür. 2–3 deneme, en iyi.",
   nm:{m:[125,165,205],f:[115,150,165]},sd:20,cv:3,src:SRC.tomk,pop:"Avrupa 9–17 yaş normları (Tomkinson 2018) yaklaşık"},
  {id:"hop",n:"Tek ayak uzun sekme",q:"pow",u:"cm",lb:0,dec:0,minAge:9,tags:["jump"],bil:1,eq:"Mezura",
   purpose:"Tek taraflı patlayıcı kuvvet ve sağ-sol asimetrisi.",
   proto:"Tek ayak üzerinde ileri sekme ve aynı ayakla 2 sn dengeli iniş. Her bacak 2–3 deneme. İniş kontrolsüzse deneme geçersiz.",
   nm:{m:[100,135,170],f:[92,120,135]},sd:18,cv:4,src:SRC.hop,pop:"Yaklaşık"},
  {id:"mbt",n:"Sağlık topu göğüs atışı (1 kg, oturarak)",q:"pow",u:"m",lb:0,dec:2,minAge:8,tags:["upperLoad"],eq:"1 kg sağlık topu, mezura, duvar",
   purpose:"Üst gövde patlayıcı kuvveti.",
   proto:"Sırt duvara dayalı otururken topu göğüsten iki elle maksimal itme. 3 deneme, en iyi.",
   nm:{m:[2.9,4.0,5.6],f:[2.7,3.6,4.3]},sd:0.55,cv:5,src:SRC.nsca,pop:"Yaklaşık"},
  {id:"grip",n:"El kavrama kuvveti",q:"str",u:"kg",lb:0,dec:1,minAge:6,tags:["grip"],bil:1,eq:"Ayarlanabilir el dinamometresi",
   purpose:"Genel kas kuvveti göstergesi (ALPHA).",
   proto:"Ayakta, kol gövde yanında, dirsek düz. Kavrama aralığı el boyuna göre ayarlanır. Her el 2 deneme, en iyi değer.",
   nm:{m:[13,22,38],f:[12,21,27]},sdf:0.2,cv:5,src:SRC.tomk,pop:"Avrupa 9–17 yaş normları yaklaşık"},
  {id:"pushup",n:"Şınav (90°, ritimli)",q:"str",u:"tekrar",lb:0,dec:0,minAge:8,tags:["upperLoad","wrist"],eq:"Metronom (3 sn'de 1 tekrar)",
   purpose:"Üst gövde kuvvet-dayanıklılığı.",
   proto:"FitnessGram protokolü: dirsekler 90°'ye, ritme uyarak devam. İkinci form hatasında test biter.",
   nm:{m:[8,14,22],f:[6,10,10]},sd:6,cv:10,src:SRC.fgram,pop:"Yaklaşık"},
  {id:"plank",n:"Plank (ön destek) süresi",q:"str",u:"s",lb:0,dec:0,minAge:7,tags:["wrist"],eq:"Kronometre",
   purpose:"Gövde (core) kuvvet-dayanıklılığı.",
   proto:"Önkol desteğinde düz gövde. Kalça düşmesi/yükselmesi uyarıdan sonra tekrarlanırsa test biter. Üst sınır 240 sn.",
   nm:{m:[40,70,95],f:[40,65,85]},sd:30,cv:12,src:SRC.nsca,pop:"Yaklaşık",max:240},
  {id:"t505",n:"505 çeviklik testi",q:"agi",u:"s",lb:1,dec:2,minAge:8,tags:["cod","sprint"],bil:1,eq:"Fotosel/kronometre, koniler",
   purpose:"180° yön değiştirme hızı; sol/sağ dönüş karşılaştırması.",
   proto:"10 m hızlanma, 5 m ölçüm bölgesine giriş, çizgide 180° dönüş ve 5 m geri. Her yön 2 deneme.",
   nm:{m:[3.05,2.80,2.55],f:[3.15,2.90,2.75]},sd:0.17,cv:3,src:SRC.agil,pop:"Yaklaşık"},
  {id:"ttest",n:"T-test",q:"agi",u:"s",lb:1,dec:2,minAge:8,tags:["cod","sprint"],eq:"4 koni, kronometre",
   purpose:"Çok yönlü çeviklik (öne, yana, geri).",
   proto:"Pauole protokolü: 10 m ileri, 5 m sola kayma, 10 m sağa kayma, 5 m sola, 10 m geri koşu. 2 deneme.",
   nm:{m:[13.8,12.3,11.0],f:[14.3,13.0,12.3]},sd:1.0,cv:3,src:SRC.agil,pop:"Yaklaşık"},
  {id:"illinois",n:"Illinois çeviklik testi",q:"agi",u:"s",lb:1,dec:2,minAge:9,tags:["cod","sprint"],eq:"8 koni, 10×5 m alan",
   purpose:"Slalom ve yön değiştirme.",
   proto:"Yüzüstü başlangıç, standart parkur. 2 deneme, en iyi.",
   nm:{m:[21.0,19.0,17.2],f:[22.0,20.2,19.2]},sd:1.3,cv:3,src:SRC.agil,pop:"Yaklaşık"},
  {id:"rag",n:"Reaktif çeviklik (Y testi)",q:"agi",u:"s",lb:1,dec:2,minAge:9,tags:["cod","sprint"],eq:"Koniler, işaret veren eş/ışık sistemi",
   purpose:"Algı-karar + yön değiştirme.",
   proto:"5 m düz koşudan sonra işarete göre sağ/sol 45° hedefe 5 m. 4–6 deneme, ortalama. Referans norm yok; yalnızca bireysel karşılaştırma.",
   nm:null,cv:4,src:SRC.agil,pop:"Norm yok — bireysel"},
  {id:"yoyo",n:"Yo-Yo aralıklı toparlanma 1 (IR1)",q:"end",u:"m",lb:0,dec:0,minAge:11,maxEff:1,tags:["maxEffort","run","cod"],eq:"Ses kaydı, koniler, 20+5 m alan",
   purpose:"Aralıklı yüksek şiddetli koşu kapasitesi.",
   proto:"Maksimal efor testidir: yalnızca antrenör onayı, sağlık engeli olmaması ve yeterli hazırlık ile uygulanır. 2×20 m koşu + 10 sn aktif dinlenme; artan hız.",
   nm:{m:[400,800,1400],f:[320,560,760]},sdf:0.4,cv:9,src:SRC.yoyo,pop:"Yaklaşık"},
  {id:"shuttle20",n:"20 m mekik koşusu (çok aşamalı)",q:"end",u:"tur",lb:0,dec:0,minAge:8,maxEff:1,tags:["maxEffort","run","cod"],eq:"Ses kaydı, 20 m alan",
   purpose:"Aerobik kapasite (ALPHA).",
   proto:"Maksimal efor testidir: antrenör onayı gerekir. Artan hızda 20 m mekik; iki kez sinyale yetişememe ile biter.",
   nm:{m:[25,45,68],f:[20,34,40]},sdf:0.35,cv:8,src:SRC.leger,pop:"Avrupa normları yaklaşık"},
  {id:"walk6",n:"6 dakika yürüme testi",q:"end",u:"m",lb:0,dec:0,minAge:6,tags:[],eq:"30 m koridor, koniler, kronometre",
   purpose:"Submaksimal fonksiyonel kapasite; maksimal efor gerektirmez.",
   proto:"ATS protokolü: 30 m parkurda 6 dk mümkün olan en hızlı yürüme (koşmadan). Standart cümlelerle teşvik.",
   nm:{m:[590,650,690],f:[570,630,650]},sd:60,cv:5,src:SRC.sixmwt,pop:"Sağlıklı çocuklar (Geiger 2007) yaklaşık"},
  {id:"sitreach",n:"Otur-uzan",q:"mob",u:"cm",lb:0,dec:0,minAge:6,tags:["flexion"],eq:"Otur-uzan kutusu (ayak tabanı = 0 cm)",
   purpose:"Hamstring ve bel bölgesi esnekliği.",
   proto:"Dizler düz, eller üst üste, yavaşça öne uzanma, 2 sn tutma. Ayak tabanı 0; ötesi +, gerisi −. 2 deneme.",
   nm:{m:[1,-1,2],f:[4,5,7]},sd:7,te:1.5,src:SRC.eurofit,pop:"Yaklaşık (EUROFIT esaslı)"},
  {id:"ankle",n:"Ayak bileği mobilitesi (diz-duvar)",q:"mob",u:"cm",lb:0,dec:1,minAge:7,tags:[],bil:1,eq:"Mezura, duvar",
   purpose:"Dorsifleksiyon açıklığı; iniş ve squat mekaniği için önemli.",
   proto:"Topuk yerde, diz duvara değerken ayak ucunun duvara en uzak mesafesi. Her taraf 3 deneme.",
   nm:{m:[10,10,10],f:[10,10,10]},sd:3,te:0.8,src:SRC.ankle,pop:"Yaklaşık"},
  {id:"shoulder",n:"Omuz mobilitesi (sırt kaşıma)",q:"mob",u:"cm",lb:0,dec:0,minAge:7,tags:["overhead"],bil:1,eq:"Cetvel",
   purpose:"Omuz kuşağı hareket açıklığı.",
   proto:"Bir el omuz üstünden, diğeri bel altından sırtta buluşturulur. Parmak uçları üst üste = +, arada boşluk = −. Sol/sağ el üstte ayrı.",
   nm:{m:[1,-1,-2],f:[4,3,3]},sd:5,te:1.5,src:SRC.fgram,pop:"Yaklaşık"},
  {id:"sls",n:"Tek ayak denge (gözler kapalı)",q:"bal",u:"s",lb:0,dec:0,minAge:6,tags:[],bil:1,eq:"Kronometre",
   purpose:"Statik denge ve propriosepsiyon.",
   proto:"Eller belde, gözler kapalı tek ayak üzerinde; destek ayağı oynarsa veya diğer ayak yere değerse süre durur. Üst sınır 45 sn. Her taraf 2 deneme.",
   nm:{m:[8,15,20],f:[9,16,21]},sd:8,te:4,src:SRC.eurofit,pop:"Yaklaşık",max:45},
  {id:"ybal",n:"Y denge testi (bileşik skor)",q:"bal",u:"%",lb:0,dec:1,minAge:8,tags:[],bil:1,eq:"Y denge kiti veya bant + mezura; bacak uzunluğu",
   purpose:"Dinamik denge; sağ-sol asimetrisi.",
   proto:"Anterior, posteromedial, posterolateral uzanmaların toplamı / (3 × bacak uzunluğu) × 100. Her yön 3 deneme.",
   nm:{m:[85,92,96],f:[86,93,97]},sd:8,te:3,src:SRC.ybal,pop:"Yaklaşık"},
  {id:"walltoss",n:"El-göz koordinasyonu (duvar topu, 30 sn)",q:"coo",u:"tekrar",lb:0,dec:0,minAge:7,tags:[],eq:"Tenis topu, duvar, 2 m çizgi",
   purpose:"El-göz koordinasyonu.",
   proto:"2 m mesafeden alternatif elle atış ve karşı elle tutuş; 30 sn'deki başarılı tutuş sayısı.",
   nm:{m:[14,24,31],f:[13,23,29]},sd:5,te:2,src:SRC.wall,pop:"Yaklaşık"},
  {id:"footeye",n:"Ayak-göz koordinasyonu (duvar pası, 30 sn)",q:"coo",u:"tekrar",lb:0,dec:0,minAge:7,tags:[],eq:"Top, duvar, 2 m çizgi",
   purpose:"Ayak-göz koordinasyonu.",
   proto:"2 m çizgi gerisinden duvara ayakla pas ve kontrol; 30 sn'deki başarılı pas sayısı. Norm yok; bireysel karşılaştırma.",
   nm:null,te:2,src:SRC.wall,pop:"Norm yok — bireysel"},
  {id:"ktk",n:"Hareket koordinasyonu (KTK yanlara sıçrama, 15 sn)",q:"coo",u:"tekrar",lb:0,dec:0,minAge:6,tags:["jump"],eq:"Ortası çizgili 60×50 cm alan",
   purpose:"Genel vücut koordinasyonu ve ritim.",
   proto:"Çift ayak, çizginin iki yanına 15 sn hızlı sıçrama. 2 deneme, en iyi.",
   nm:{m:[38,52,62],f:[37,50,58]},sd:9,te:3,src:SRC.ktk,pop:"Yaklaşık"},
  {id:"react",n:"Reaksiyon süresi (uygulama içi)",q:"rea",u:"ms",lb:1,dec:0,minAge:6,tags:[],eq:"Bu uygulama (Reaksiyon testi ekranı)",inApp:1,
   purpose:"Basit görsel reaksiyon süresi.",
   proto:"Uygulamadaki reaksiyon testi: ekran yeşile döndüğünde dokunun. 5 denemenin medyanı kaydedilir. Dokunmatik ekran gecikmesi (≈40–80 ms) içerir; farklı cihazlar karşılaştırılamaz.",
   nm:{m:[390,320,280],f:[395,325,285]},sd:45,te:15,src:SRC.rt,pop:"Uygulama tahmini — yaklaşık"}
];
const TEST = Object.fromEntries(TESTS.map(t => [t.id, t]));

/* -------------------------------------------------------------------------
   EGZERSİZ KÜTÜPHANESİ
   c: kategori, q: hedef özellikler, lv: en düşük gelişim evresi (1–6), eq: gerekli ekipman (biri yeterli: "|")
   tg: kısıtlama etiketleri, sp: geniş alan gerekir, d: varsayılan doz {s,r|t|d,rest,ps(taraf başına)}
   ------------------------------------------------------------------------- */
const CATS = {warm:"Genel ısınma", mob:"Dinamik mobilite", act:"Aktivasyon", spd:"Sürat", plyo:"Patlayıcı kuvvet / plyometrik",
  str:"Kuvvet", cod:"Çeviklik", coo:"Koordinasyon", bal:"Denge", rea:"Reaksiyon", cond:"Dayanıklılık", prev:"Branşa özgü / önleyici", cool:"Soğuma"};
function E(id,n,c,q,lv,m,p,tech,cues,mis,easy,hard,alt,eq,tg,d,x){return Object.assign({id,n,c,q,lv,m,p,tech,cues,mis,easy,hard,alt,eq,tg,d},x||{});}
const EXERCISES = [
 // ---- Genel ısınma
 E("w1","Hafif tempolu koşu ve yan adımlar","warm",["end"],1,"Tüm vücut","Vücut ısısını ve nabzı kademeli artırmak.","Rahat tempoda 2–3 dk koşu; aralarda yan adım ve geri geri koşu.",["Rahat nefes","Kısa ve hafif adımlar"],["Hızlı başlamak"],"Tempolu yürüyüş","Skip varyasyonları eklemek","w4",[],["run"],{s:1,t:240,rest:0}),
 E("w2","Jumping jack ve hafif sekmeler","warm",["coo"],1,"Baldır, omuz","Nabız artışı, ayak bileği hazırlığı.","Kollar ve bacaklar eşzamanlı açılıp kapanır; ayak ucunda hafif temas.",["Yumuşak iniş","Ritimli"],["Topuk üzerine sert iniş"],"Yürüyerek jack (sekmeden)","Çapraz jack","w4",[],["jump"],{s:2,t:30,rest:15}),
 E("w3","İp atlama (temel)","warm",["coo","end"],1,"Baldır, ayak bileği","Ritim, koordinasyon ve ayak bileği sertliği.","İki ayak, bilekten çevirme, alçak sıçrama.",["Dirsekler gövdeye yakın","Ayak ucu teması"],["Çok yüksek sıçrama"],"İpsiz ritimli sekme","Tek ayak / çift döndürme","w4",["rope"],["jump"],{s:3,t:30,rest:20}),
 E("w4","Yürüyerek hareket hazırlığı","warm",["mob","coo"],1,"Kalça, diz, ayak bileği","Darbesiz genel ısınma (kısıtlamalı sporcular için uygun).","Diz çekerek yürüyüş, topuk-kalça, yan adım, kol çevirme serisi; her biri 10–15 m.",["Dik gövde","Kontrollü tempo"],["Acele etmek"],"Yerinde uygulama","Tempoyu artırmak","w1",[],[],{s:1,t:240,rest:0}),
 E("w5","Kardiyo cihazında ısınma","warm",["end"],1,"Alt ekstremite","Darbesiz kademeli ısınma.","Bisiklet/eliptik cihazda 4–5 dk, son dakika tempoyu hafif artırarak.",["Konuşabilecek tempo"],["Yüksek dirençle başlamak"],"Daha kısa süre","Kısa tempo artışları","w4",["cardio"],[],{s:1,t:300,rest:0}),
 // ---- Dinamik mobilite
 E("m1","Dünyanın en iyi esnetmesi","mob",["mob"],1,"Kalça fleksörleri, adduktorlar, torakal omurga","Kalça ve torakal mobilite.","Öne hamle, aynı taraf dirseği ayak içine, ardından kolu tavana açarak döndürme.",["Arka diz düz","Göğüs açılırken nefes ver"],["Ön dizin içe düşmesi"],"Arka dizi yere koymak","Hamstring uzanması eklemek","m2",[],[],{s:1,r:5,ps:1,rest:0}),
 E("m2","Kalça kapısı açma-kapama","mob",["mob","bal"],1,"Kalça rotatorları","Kalça iç-dış rotasyon mobilitesi.","Yürürken dizi yukarı ve dışa (açma) veya dışarıdan içe (kapama) daire çizerek taşı.",["Gövde dik","Destek ayağı sabit"],["Gövdeyi yana yatırmak"],"Duvara tutunarak","Ters yöne yürüyerek","m5",[],[],{s:1,r:6,ps:1,rest:0}),
 E("m3","Ayak bileği diz-duvar mobilizasyonu","mob",["mob"],1,"Baldır, ayak bileği","Dorsifleksiyon açıklığı (iniş/squat mekaniği).","Ayak duvara yakın, topuk yerde; dizi ayak ucu hizasında duvara doğru it.",["Topuk yerde","Diz 2.–3. parmak hizasında"],["Dizin içe kaçması"],"Daha yakın mesafe","Bantla posterior kayma","m1",[],[],{s:1,r:10,ps:1,rest:0}),
 E("m4","Yan yatarak torakal rotasyon (kitap açma)","mob",["mob"],1,"Torakal omurga, göğüs","Göğüs omurgası rotasyonu.","Yan yatış, dizler 90°; üstteki kolu açarak göğsü tavana döndür.",["Dizler birlikte","Göz eli takip eder"],["Beli döndürmek"],"Küçük açıklık","2 sn bekleme","m1",[],["rotation"],{s:1,r:8,ps:1,rest:0}),
 E("m5","Bacak sallamaları (öne-arkaya / yana)","mob",["mob"],1,"Hamstring, kalça fleksör, adduktor","Kalça dinamik hareket açıklığı.","Duvara tutun, bacağı kontrollü artan genişlikte salla.",["Gövde sabit","Kontrollü genlik"],["Belden hareket"],"Küçük açıklık","Tutunmadan","m2",[],[],{s:1,r:10,ps:1,rest:0}),
 E("m6","Omuz daireleri ve bant geçişi","mob",["mob"],1,"Omuz kuşağı","Omuz hareket açıklığı ve skapula kontrolü.","Kollar düz, bant/sopa ile önden başın üstünden arkaya kontrollü geçiş.",["Kaburgalar aşağıda","Ağrısız açıklık"],["Beli çukurlaştırmak"],"Geniş tutuş, yarım açıklık","Dar tutuş","m4",[],["overhead"],{s:1,r:10,rest:0}),
 E("m7","Tırtıl yürüyüşü (inchworm)","mob",["mob","str"],2,"Hamstring, omuz, core","Arka zincir esnekliği ve omuz stabilitesi.","Öne eğil, ellerle ileri yürü plank pozisyonuna gel, ayaklarla ellere yaklaş.",["Kalça sabit plankta","Dizler hafif bükülebilir"],["Kalçanın düşmesi"],"Diz bükük","Plankta şınav eklemek","m1",[],["wrist","flexion"],{s:1,r:5,rest:0}),
 E("m8","Geri hamle + yukarı uzanma","mob",["mob","bal"],1,"Kalça fleksörleri, gluteal","Kalça önü esnekliği ve denge.","Geri hamle; arka taraf kolunu yukarı-çapraz uzat.",["Ön diz ayak üstünde","Kalça ileri"],["Ön dizin içe düşmesi"],"Kısa hamle","Rotasyon eklemek","m1",[],["overhead"],{s:1,r:5,ps:1,rest:0}),
 E("m9","Kedi-deve","mob",["mob"],1,"Omurga","Omurga segmental hareketi.","Dört ayak üzerinde nefesle uyumlu omurga yuvarlama ve çukurlaştırma.",["Yavaş tempo","Nefesle uyum"],["Ağrılı açıklığa zorlamak"],"Küçük açıklık","Segment segment","m4",[],["flexion"],{s:1,r:8,rest:0}),
 // ---- Aktivasyon
 E("a1","Kalça köprüsü (çift → tek bacak)","act",["str"],1,"Gluteal, hamstring","Kalça ekstansör aktivasyonu.","Sırtüstü, dizler bükük; kalçayı omuz-diz hizasına kaldır, 2 sn tut.",["Kaburgalar aşağıda","Topuklardan it"],["Beli aşırı çukurlaştırmak"],"Çift bacak","Tek bacak + üstte bekleme","a2",[],[],{s:2,r:10,rest:30}),
 E("a2","Mini bant yan adım","act",["str","bal"],1,"Gluteus medius","Kalça abduktor aktivasyonu; diz hizası kontrolü.","Bant diz üstünde/ayak bileğinde, yarım çömelmiş pozisyonda yan adımlar.",["Dizler ayak üstünde","Gövde sabit"],["Ayakları sürüklemek"],"Bantsız","Bant ayak bileğinde","a1",["band"],[],{s:2,r:10,ps:1,rest:30}),
 E("a3","Dead bug","act",["str","coo"],1,"Derin karın kasları","Gövde stabilitesi ve karşı kol-bacak koordinasyonu.","Sırtüstü, kollar yukarı, dizler 90°; karşı kol ve bacağı uzatırken bel yerde.",["Bel zemine yakın","Yavaş nefes ver"],["Belin kalkması"],"Yalnız bacak hareketi","Bant direnciyle","a4",[],[],{s:2,r:8,ps:1,rest:30}),
 E("a4","Bird dog","act",["str","bal"],1,"Gövde, gluteal, sırt","Gövde stabilitesi ve kontralateral kontrol.","Dört ayak, karşı kol ve bacağı uzat, 2 sn tut.",["Kalça seviyede","Uzun omurga"],["Kalçayı döndürmek"],"Yalnız bacak","Dirsek-diz dokundurma","a3",[],["wrist"],{s:2,r:8,ps:1,rest:30}),
 E("a5","Bant ile Y-T-W","act",["str","mob"],2,"Skapula retraktörleri, rotator manşet","Skapula ve omuz arka kasları aktivasyonu.","Bantla kollar Y, T, W şekillerinde açılır; kürek kemikleri geri-aşağı.",["Boyun rahat","Yavaş dönüş"],["Omuz silkme"],"Yalnız T","Öne eğik pozisyon","v4",["band"],["overhead"],{s:2,r:8,rest:30}),
 E("a6","Yan plank","act",["str","bal"],1,"Oblikler, gluteus medius","Lateral gövde stabilitesi.","Dirsek omuz altında, gövde düz çizgide yan destek.",["Kalça yukarıda","Baş-kalça-ayak hizalı"],["Kalça düşmesi"],"Diz destekli","Üst bacak kaldırarak","a3",[],[],{s:2,t:20,ps:1,rest:30}),
 E("a7","Pogo sekmeleri","plyo",["pow","coo"],1,"Baldır, ayak bileği","Ayak bileği reaktif sertliği; düşük şiddetli plyometrik.","Diz hafif bükük, ayak bileklerinden ritmik kısa sekmeler.",["Hızlı yer teması","Dik gövde"],["Topuk üzerine iniş"],"Daha yavaş ritim","Öne-arkaya/yana pogo","w4",[],["jump"],{s:2,r:15,rest:45},{pc:1}),
 // ---- Sürat
 E("s1","Duvar drili (A-pozisyonu)","spd",["spd","coo"],1,"Kalça fleksörleri, baldır","Hızlanma postürü ve diz-kalça mekaniği.","Ellerle duvara 45° yaslan; dizi kalça hizasına çek, ayağı kalçanın altına vur. Tekli → ikili → üçlü geçiş.",["Ayak bileği kilitli (dorsifleksiyon)","Gövde-bacak düz çizgi"],["Kalçayı kırmak"],"Tek tek yavaş","Ritimli ardışık geçiş","s2",[],[],{s:3,r:6,ps:1,rest:45}),
 E("s2","A-skip","spd",["spd","coo"],2,"Kalça fleksörleri, baldır","Sprint ritmi ve ayak teması.","Diz yukarı, ayak kalça altına aktif iniş, karşı kol uyumu; 15–20 m.",["Kol-bacak uyumu","Ayak ucu yukarı"],["Öne eğilmek"],"A-march (yürüyerek)","Hızlı A-run","s1",[],["run"],{s:3,d:20,rest:45}),
 E("s3","B-skip","spd",["spd","coo"],3,"Hamstring, kalça","Sprintte ayağın yere aktif inişi (pawing).","A-skip'e ek olarak bacak öne uzatılıp aktif geri-aşağı çekilir.",["Kalça altı iniş","Dik gövde"],["Öne uzanıp topukla basmak"],"B-march","Hızlı tempo","s2",[],["run"],{s:2,d:20,rest:45}),
 E("s4","Hızlanma sprinti (10 m)","spd",["spd","pow"],1,"Kalça ekstansörleri, quadriceps, baldır","Hızlanma kapasitesi.","Farklı başlangıçlarla (ayakta, yarım diz, yüzüstü) 10 m maksimal sprint; tam dinlenme.",["Öne eğik gövde","Güçlü kol hareketi","Yere geri-aşağı itme"],["Dik başlamak","Kısa ve çok adım"],"Submaksimal (%80)","Kızak/bant direnci","s5",[],["sprint"],{s:4,d:10,rest:90},{sp:0}),
 E("s5","Düşerek başlangıç (10 m)","spd",["spd","rea"],1,"Kalça ekstansörleri","Hızlanma açısı ve ilk adım.","Dik dur, öne düş ve düşmeyi yakalayarak 10 m sprint.",["Tek parça düşüş","İlk adım kalça altına"],["Belden kırılmak"],"5 m","Reaktif işaretle","s4",[],["sprint"],{s:4,d:10,rest:90}),
 E("s6","Uçan sprint (10–20 m)","spd",["spd"],3,"Kalça, hamstring, baldır","Maksimal sürat.","20 m kademeli hızlanma + 10–20 m maksimal bölge; tam dinlenme (2–4 dk).",["Dik gövde","Rahat yüz/omuz","Ön tarafta mekanik"],["Gerilmek","Ağır bacak teması"],"%90 hız","Daha uzun bölge","s4",["cone"],["sprint"],{s:3,d:20,rest:150},{sp:1}),
 E("s7","Dirençli sprint (kızak/bant)","spd",["spd","pow"],4,"Kalça ekstansörleri","Hızlanmada kuvvet üretimi.","Hafif dirençle (vücut ağırlığının ≤%10–20'si veya eş-bant) 10–15 m sprint.",["Hızlanma postürü","Güçlü itiş"],["Fazla direnç teknik bozar"],"Daha hafif direnç","Kısa kontrast sprint","s4",["sprintEq|band"],["sprint"],{s:4,d:15,rest:120}),
 E("s8","Reaktif çıkış oyunu","spd",["spd","rea"],1,"Tüm alt ekstremite","Reaksiyon + hızlanma; oyun temelli.","Ses/el işaretiyle farklı pozisyonlardan 5 m yarış (kendi süresine karşı).",["Hızlı ilk adım","Göz işarette"],["Erken çıkış"],"Görsel işaret","Yön seçimli işaret","s5",[],["sprint"],{s:3,r:4,rest:60}),
 E("s9","Tekrarlı sprint (6 × 20 m)","cond",["end","spd"],4,"Tüm alt ekstremite","Tekrarlı sprint kapasitesi.","6 × 20 m sprint, 20–25 sn aktif dinlenme; set arası 3–4 dk.",["Her tekrarda kalite","Aktif dinlenme"],["Teknik bozulsa da sürdürmek"],"4 tekrar, uzun dinlenme","2 set","d1",["cone"],["sprint","maxEffort","run"],{s:2,r:6,d:20,rest:180},{sp:1}),
 E("s10","Üç noktalı / blok çıkışı","spd",["spd","pow"],3,"Kalça, quadriceps","Atletizm ve futbolda çıkış mekaniği.","Üç nokta pozisyonundan işaretle 10–15 m çıkış.",["Kalça omuzdan biraz yüksek","Güçlü kol"],["Erken dikleşmek"],"İki nokta çıkış","Rakip/işaret ile","s4",[],["sprint","wrist"],{s:4,d:15,rest:120}),
 // ---- Plyometrik / patlayıcı
 E("p2","Çizgi sekmeleri (öne-arkaya / yana)","plyo",["pow","coo"],1,"Baldır, quadriceps","Düşük şiddetli reaktif sekmeler ve ayak çabukluğu.","Çizgi üzerinden çift ayak hızlı küçük sekmeler.",["Hafif ve hızlı","Dizler esnek"],["Gürültülü sert iniş"],"Yavaş tempo","Tek ayak","p1",[],["jump"],{s:3,t:10,rest:45},{pc:12}),
 E("p3","Squat sıçrama + yapışık iniş","plyo",["pow"],2,"Quadriceps, gluteal, baldır","Konsantrik güç ve iniş kontrolü.","Yarım squat pozisyonundan maksimal sıçrama; yumuşak, dengeli 2 sn yapış.",["Diz ayak hizasında","Sessiz iniş"],["Dizlerin içe çökmesi"],"Alçak sıçrama","CMJ'ye geçiş","v1",[],["jump"],{s:3,r:5,rest:60},{pc:1}),
 E("p4","CMJ + iniş kontrolü","plyo",["pow"],2,"Gluteal, quadriceps, baldır","Dikey patlayıcı kuvvet.","Hızlı çömelme ve maksimal dikey sıçrama; iki ayak yumuşak iniş.",["Kol savuruşu","Kalça-diz-ayak hizası"],["Sert, düz bacak iniş"],"Squat sıçrama","Ağırlık yeleği yok—tekrar sayısı artışı","p3",[],["jump"],{s:3,r:5,rest:75},{pc:1}),
 E("p5","Durarak uzun atlama + yapış","plyo",["pow"],2,"Gluteal, hamstring, quadriceps","Yatay patlayıcı kuvvet.","Kol savuruşlu maksimal uzun atlama, dengeli iniş, 2 sn yapış.",["Kalça menteşesi","Ayaklar kalça genişliğinde iniş"],["Öne düşmek"],"Kısa mesafe","Ardışık 2 atlama","p3",[],["jump"],{s:3,r:4,rest:75},{pc:1}),
 E("p6","Kutuya sıçrama (alçak kutu)","plyo",["pow"],3,"Alt ekstremite","Sıçrama gücü; iniş darbesini azaltır.","30–45 cm kutuya CMJ ile sıçra, kutuda yumuşak iniş; kutudan adımla in (atlama).",["Kutudan yürüyerek in","Tam squata inme"],["Çok yüksek kutu seçmek"],"Daha alçak kutu","Tek ayak kutu","p4",["box"],["jump"],{s:3,r:5,rest:75},{pc:1}),
 E("p7","Mini engel sıçramaları (reaktif)","plyo",["pow","coo"],4,"Baldır, quadriceps","Reaktif kuvvet (kısa yer teması).","4–6 mini engel üzerinden ardışık çift ayak sıçrama.",["Kısa temas","Dizler önde"],["Uzun temas, derin çökme"],"Çizgi sekmeleri","Tek ayak (ileri evre)","p2",["hurdle"],["jump"],{s:3,r:5,rest:90},{pc:1}),
 E("p8","Tek ayak sekme ve yapış","plyo",["pow","bal"],3,"Gluteus medius, quadriceps","Tek taraflı kuvvet, iniş kontrolü, asimetri gelişimi.","Tek ayak öne/yana kısa sekme, aynı ayakla 2 sn dengeli yapış.",["Diz ayak üstünde","Kalça düşmesin"],["Dizin içe kaçması"],"Çift ayak ile","Çapraz/360° sekmeler","b2",[],["jump"],{s:2,r:5,ps:1,rest:60},{pc:1}),
 E("p9","Yanal sıçrama (patenci)","plyo",["pow","agi","bal"],3,"Gluteus medius, adduktorlar","Yanal güç ve yön değiştirme.","Bir ayaktan diğerine yana sıçrama, yapışık iniş.",["Kalça geride","Dış ayak kenarından itme"],["Gövde yana çökmesi"],"Adımlı versiyon","Reaktif ardışık","c4",[],["jump","cod"],{s:3,r:6,ps:1,rest:60},{pc:1}),
 E("p10","Derinlik sıçraması (alçak)","plyo",["pow"],5,"Alt ekstremite","İleri düzey reaktif güç.","20–30 cm kutudan düş, kısa temasla maksimal sıçra. Yalnızca iniş mekaniği iyi sporcularda.",["Kısa temas","Sessiz iniş"],["Yüksek kutu","Topuk teması"],"Kutu düşüşü + yapış","Yatay derinlik sıçraması","p7",["box"],["jump"],{s:3,r:4,rest:120},{pc:1}),
 E("p11","Sağlık topu göğüs pası (duvara)","plyo",["pow"],2,"Göğüs, triceps, omuz","Üst gövde patlayıcı kuvveti.","Atletik duruşta topu göğüsten duvara maksimal hızla it, geri yakala.",["Bacaklardan başlayan itiş","Hızlı salınım"],["Yalnız kollarla atmak"],"Hafif top","Adım alarak","p12",["mb"],["upperLoad"],{s:3,r:6,rest:60}),
 E("p12","Sağlık topu baş üstü yere vuruş","plyo",["pow","coo"],2,"Latissimus, karın, kalça","Tüm vücut patlayıcı kuvveti.","Topu baş üstüne kaldır, karın ve kollarla yere hızla vur.",["Topu bırakırken eğil","Diz hafif bükük"],["Belden aşırı fleksiyon"],"Hafif top","Rotasyonlu vuruş","p11",["mb"],["overhead","flexion"],{s:3,r:6,rest:60}),
 E("p13","Sağlık topu rotasyonel atış","plyo",["pow","coo"],3,"Oblikler, kalça","Rotasyonel güç (raket, atma, vuruş).","Duvara yan dur, kalçadan başlayan dönüşle topu duvara fırlat.",["Kalça önce döner","Kollar uzun"],["Yalnız kolla atmak"],"Yavaş kontrollü","Adım alarak","v5",["mb"],["rotation"],{s:3,r:6,ps:1,rest:60}),
 E("p14","Sekerek koşu (bounding)","plyo",["pow","spd"],4,"Kalça ekstansörleri, baldır","Yatay güç ve sprint adım uzunluğu.","Uzun, yüksek adımlarla 20–30 m sekerek koşu.",["Aktif ayak teması","Kol uyumu"],["Topukla iniş"],"Skip ile uzun adım","Tek bacak bounding","p5",[],["jump","run"],{s:3,d:20,rest:90},{pc:10,sp:1}),
 // ---- Kuvvet
 E("st1","Vücut ağırlığı squat (hedefe)","str",["str","mob"],1,"Quadriceps, gluteal","Temel squat paterni.","Ayaklar kalça-omuz genişliğinde; kalçayı geri-aşağı indir, kutuya/sandalyeye dokun, kalk.",["Topuklar yerde","Diz ayak hizasında","Göğüs açık"],["Dizlerin içe çökmesi","Topuk kalkması"],"Yüksek hedef","Tempo (3 sn iniş)","st3",[],["deepKnee"],{s:2,r:10,rest:60}),
 E("st2","Goblet squat","str",["str","mob"],3,"Quadriceps, gluteal, core","Yüklü squat paterni.","Dambıl/kettlebell göğüste; kontrollü squat.",["Dirsekler diz içinde","Gövde dik"],["Beli yuvarlamak"],"Vücut ağırlığı","Tempo/duraklama","st1",["db|kb"],["deepKnee","spine"],{s:3,r:8,rest:90}),
 E("st3","Statik hamle (split squat)","str",["str","bal"],2,"Quadriceps, gluteal","Tek taraflı kuvvet ve denge.","Adım pozisyonunda dikey iniş-çıkış.",["Ön diz ayak üstünde","Gövde dik"],["Ön dizin içe düşmesi"],"Tutunarak","Dambılla","st4",[],[],{s:2,r:8,ps:1,rest:60}),
 E("st4","Geri hamle (reverse lunge)","str",["str","bal"],2,"Quadriceps, gluteal","Tek taraflı kuvvet; deselerasyon.","Geri adımla hamle, ön bacakla iterek dön.",["Kontrollü iniş","Diz hizası"],["Öne devrilmek"],"Statik hamle","Dambılla / yürüyen hamle","st3",[],[],{s:2,r:8,ps:1,rest:60}),
 E("st5","Bulgar split squat","str",["str","bal","mob"],3,"Quadriceps, gluteal","İleri tek taraflı kuvvet.","Arka ayak bank üzerinde, ön bacakla iniş-çıkış.",["Gövde hafif öne","Ön topuk yerde"],["Kısa adım mesafesi"],"Statik hamle","Dambılla","st3",[],["deepKnee"],{s:3,r:8,ps:1,rest:75}),
 E("st6","Basamak çıkma (step-up)","str",["str","bal"],1,"Quadriceps, gluteal","Tek taraflı kuvvet; düşük risk.","Diz yüksekliğinde sağlam basamağa üstteki bacakla çık.",["Üst bacaktan it","Arka ayakla itme yok"],["Dizin içe düşmesi"],"Alçak basamak","Dambılla","st3",[],[],{s:2,r:8,ps:1,rest:60}),
 E("st7","Romanya deadlift (dambıl)","str",["str","mob"],3,"Hamstring, gluteal, sırt","Kalça menteşe paterni; arka zincir kuvveti.","Dambıllar uyluk önünde, kalçayı geri iterek nötral sırtla eğil, kalçadan kalk.",["Nötral omurga","Ağırlık bacağa yakın"],["Beli yuvarlamak"],"Sopa ile menteşe","Tek bacak","st8",["db|kb"],["spine","flexion"],{s:3,r:8,rest:90}),
 E("st8","Tek bacak RDL (vücut ağırlığı)","str",["str","bal"],2,"Hamstring, gluteal","Denge + arka zincir; tek taraflı kontrol.","Tek ayak üzerinde gövde öne, arka bacak geriye uzar; kalça seviyede.",["Kalça düz","Destek dizi hafif bükük"],["Kalçayı açmak"],"Duvara tutunarak","Dambılla","b2",[],[],{s:2,r:6,ps:1,rest:45}),
 E("st9","Kettlebell swing","str",["pow","str"],4,"Gluteal, hamstring","Kalça patlayıcı ekstansiyonu.","Kalça menteşesi ile kettlebell'i göğüs hizasına savur.",["Kalçadan güç","Kol pasif"],["Squat gibi çömelmek","Beli yuvarlamak"],"Kalça menteşe drili","Daha ağır KB","st7",["kb"],["spine","flexion"],{s:3,r:10,rest:75}),
 E("st10","Trap bar/barbell deadlift (teknik)","str",["str"],5,"Tüm arka zincir","Maksimal olmayan kuvvet gelişimi (uzman gözetiminde).","Hafif yükle teknik odaklı deadlift; 1RM testi yok.",["Nötral omurga","Bar bacağa yakın"],["Yük için tekniği bozmak"],"RDL dambıl","Kademeli yük","st7",["bar"],["spine","valsalva"],{s:3,r:5,rest:120}),
 E("st11","Barbell squat (teknik)","str",["str"],5,"Quadriceps, gluteal","İleri evre kuvvet (uzman gözetiminde).","Hafif yükle tam teknik; tekrar kalitesi öncelik.",["Topuk yerde","Diz ayak hizası"],["Yük için derinliği kaybetmek"],"Goblet squat","Kademeli yük","st2",["bar"],["spine","deepKnee","valsalva"],{s:3,r:5,rest:120}),
 E("st12","Şınav (eğimli → yer)","str",["str"],1,"Göğüs, triceps, core","Üst gövde itme kuvveti.","Gövde düz çizgide, dirsekler gövdeye 45°.",["Plank pozisyonu","Göğüs yere yaklaşır"],["Kalça düşmesi"],"Duvar/eğimli şınav","Tempo veya ayak yüksekte","v4",[],["upperLoad","wrist"],{s:3,r:8,rest:60}),
 E("st13","Bant kürek çekiş","str",["str"],1,"Sırt, arka omuz","Üst gövde çekiş kuvveti ve postür.","Bant sabitlenir, dirsekleri geriye çek, kürek kemiklerini sık.",["Göğüs açık","Omuz aşağı"],["Gövdeyi geriye atmak"],"Hafif bant","Tek kol / tempo","st14",["band"],[],{s:3,r:12,rest:45}),
 E("st14","Tek kol dambıl kürek","str",["str"],2,"Latissimus, rhomboidler","Tek taraflı çekiş kuvveti.","Bank destekli, dambılı kalçaya doğru çek.",["Nötral sırt","Dirsek kalçaya"],["Gövdeyi döndürmek"],"Bant kürek","Daha ağır","st13",["db|kb"],[],{s:3,r:10,ps:1,rest:60}),
 E("st15","Yarım diz dambıl omuz pres","str",["str"],3,"Omuz, triceps","Baş üstü itme kuvveti; gövde kontrolüyle.","Yarım diz pozisyonunda tek kol pres.",["Kaburgalar aşağıda","Kalça sıkılı"],["Beli çukurlaştırmak"],"Landmine/eğik pres","Ayakta","p11",["db|kb"],["overhead","upperLoad"],{s:3,r:8,ps:1,rest:60}),
 E("st16","Nordic hamstring (yardımlı)","prev",["str"],3,"Hamstring (eksantrik)","Hamstring eksantrik kuvveti; futbol/sprint önleyici.","Diz üstünde, ayaklar sabit; gövdeyi kontrollü öne bırak, ellerle karşıla.",["Kalça açık","Yavaş iniş"],["Kalçayı kırmak"],"Bantla yardım / kısa açıklık","Daha uzun açıklık","st8",[],[],{s:2,r:4,rest:90}),
 E("st17","Baldır kaldırma (çift → tek)","str",["str","bal"],1,"Gastrocnemius, soleus","Ayak bileği kuvveti; iniş ve sprint için.","Basamakta topuk kaldırma, kontrollü iniş.",["Tam açıklık","Yavaş iniş"],["Sekerek yapmak"],"Çift ayak yerde","Tek ayak, dambılla","a7",[],[],{s:3,r:12,rest:45}),
 E("st18","Pallof press","str",["str","bal"],2,"Core (anti-rotasyon)","Rotasyona direnç; gövde stabilitesi.","Yandan bant, eller göğüste; kolları öne uzat, gövde dönmesin.",["Kalça ve omuz sabit","Nefes kontrollü"],["Bantla dönmek"],"Hafif bant","Yarım diz / tek ayak","a3",["band"],[],{s:3,r:10,ps:1,rest:45}),
 E("st19","Plank varyasyonları","str",["str"],1,"Core","Gövde stabilitesi.","Önkol plankı; ilerledikçe omuz dokunma/kol kaldırma.",["Düz çizgi","Kalça sıkılı"],["Kalçanın düşmesi"],"Diz destekli","Omuz dokunma","a3",[],["wrist"],{s:3,t:30,rest:30}),
 E("st20","Çiftçi yürüyüşü","str",["str","bal"],2,"Kavrama, core, omuz","Kavrama ve gövde kontrolü.","Her elde dambıl/KB ile dik postürde 20 m yürüyüş.",["Omuzlar aşağı","Kısa adımlar"],["Yana eğilmek"],"Hafif yük","Tek taraflı taşıma","st19",["db|kb"],["grip","spine"],{s:3,d:20,rest:60}),
 E("st21","Kopenhag adduktor plankı (kısa kaldıraç)","prev",["str"],3,"Adduktorlar, core","Kasık sakatlığı önleme (futbol, hentbol, buz).","Yan plank, üst diz bank üzerinde; alttaki bacak serbest.",["Kalça düz","Kontrollü süre"],["Kalça düşmesi"],"Kısa süre","Uzun kaldıraç (ayak bankta)","a6",[],[],{s:2,t:15,ps:1,rest:45}),
 // ---- Çeviklik
 E("c1","5-10-5 (pro çeviklik)","cod",["agi","spd"],2,"Alt ekstremite","Yön değiştirme ve deselerasyon.","Ortadan 5 m sağa, 10 m sola, 5 m sağa koşu; dokunarak dönüş.",["Alçak ağırlık merkezi","Dış ayakla itme"],["Dik dönmek"],"%70 hız","Reaktif yön","c3",["cone"],["cod","sprint"],{s:3,r:4,rest:90}),
 E("c2","Koş-dur (3 adımda frenleme)","cod",["agi"],1,"Quadriceps, gluteal","Deselerasyon tekniği; sakatlık önleme temeli.","10 m orta hızda koş, 3 adımda dur; atletik duruşta yapış.",["Kalça geri","Diz ayak hizası"],["Dik dururken frenlemek"],"Yürüyüşten frenleme","Yüksek hız","c4",[],["cod","run"],{s:3,r:4,rest:45}),
 E("c3","Koni slalomu","cod",["agi","coo"],1,"Alt ekstremite","Çabuk ayak ve yön değişimi.","Zikzak dizili konilerde ileri/yanal slalom.",["Kısa adımlar","Kollar dengede"],["Uzun adım"],"Geniş koni aralığı","Topla","c1",["cone"],["cod"],{s:3,r:3,rest:60}),
 E("c4","Kayma adımı + çapraz adım","cod",["agi","coo"],1,"Kalça abduktorlar","Yanal hareket mekaniği.","Atletik duruşta 5 m kayma adımı, çapraz adıma geçerek 5 m hızlanma.",["Ayaklar birleşmesin","Alçak duruş"],["Ayak sürümek"],"Yavaş","Reaktif işaretli","c2",[],["cod"],{s:3,r:4,rest:45}),
 E("c5","Ayna drili (eşli)","cod",["agi","rea"],1,"Tüm vücut","Reaktif çeviklik; oyun temelli.","Eş liderin yön değişikliklerini 10 sn aynalar.",["Göz kalçada","Hazır duruş"],["Ayakları çaprazlamak"],"Yavaş lider","Temassız oyun","r1",[],["cod"],{s:3,t:10,rest:45}),
 E("c6","T-drill","cod",["agi","spd"],2,"Alt ekstremite","Çok yönlü çeviklik.","T düzeninde ileri koşu, yan kayma, geri koşu.",["Dönüşte alçal","Kısa adımlar"],["Geri koşuda dikleşmek"],"Yavaş","Reaktif","c1",["cone"],["cod","sprint"],{s:3,r:3,rest:90}),
 E("c7","Savunma kayması + close-out (basketbol)","prev",["agi","bal"],1,"Kalça, quadriceps","Basketbol savunma ayak işi.","Kayma adımlarıyla çizgi boyunca, ardından hücum oyuncusuna kısa adımlarla kapanış.",["Alçak duruş","Eller aktif"],["Ayakları birleştirmek"],"Yavaş tempo","Reaktif işaret","c4",[],["cod"],{s:3,r:4,rest:45}),
 // ---- Koordinasyon
 E("k1","Yer çizgileriyle ayak çabukluğu","coo",["coo","agi"],1,"Alt ekstremite","Ayak çabukluğu ve ritim.","Bant/tebeşirle çizilen kutularda içeri-dışarı, yan, çapraz adım desenleri.",["Ayak ucu teması","Kollar uyumlu"],["Çizgiye basmak"],"Yavaş, tek desen","Desen kombinasyonu","k5",[],[],{s:3,r:3,rest:30}),
 E("k2","Duvara top at-tut (alternatif el)","coo",["coo","rea"],1,"Üst ekstremite","El-göz koordinasyonu.","2 m mesafeden alternatif elle atıp karşı elle tutma.",["Göz topta","Yumuşak eller"],["Gövdeyle tutmak"],"Tek elle","Tek ayak üstünde","r3",["ball"],[],{s:3,t:30,rest:30}),
 E("k3","İp atlama varyasyonları","coo",["coo","end"],2,"Baldır","Ritim ve koordinasyon.","Koşar adım, çapraz, tek ayak varyasyonları.",["Ritim","Ayak ucu"],["Yüksek sıçrama"],"Temel atlama","Çift döndürme","k1",["rope"],["jump"],{s:3,t:30,rest:30}),
 E("k4","Top sektirme (el ve ayak)","coo",["coo"],1,"Tüm vücut","Top kontrolü ve iki taraflı koordinasyon.","Elle/ayakla yürüyerek ve yönler değiştirerek top kontrolü.",["Baş yukarı","İki taraf eşit"],["Yalnız baskın taraf"],"Duran","Hareket halinde","k2",["ball"],[],{s:3,t:40,rest:30}),
 E("k5","Çapraz koordinasyon dokunuşları","coo",["coo","bal"],1,"Tüm vücut","Kontralateral koordinasyon.","Yürüyerek → sekerek karşı el ile karşı dize/topuğa dokunma.",["Ritim","Dik gövde"],["Gözü yere dikmek"],"Yerinde","Hızlı tempo","k1",[],[],{s:2,r:12,rest:30}),
 E("k6","Ritim drilleri (skip varyasyonları)","coo",["coo","spd"],1,"Alt ekstremite","Hareket ritmi ve atletik koordinasyon.","Yana skip, geri skip, çapraz skip 15 m.",["Kol-bacak uyumu","Hafif temas"],["Gergin omuzlar"],"Yürüyüş","Hız artışı","s2",[],["run"],{s:2,d:15,rest:30}),
 // ---- Denge
 E("b1","Tek ayak denge (ilerlemeli)","bal",["bal"],1,"Ayak bileği, kalça","Statik denge ve propriosepsiyon.","Göz açık → kapalı, zemin → yumuşak yüzey, baş hareketi ekleyerek tek ayak duruş.",["Diz hafif bükük","Kalça seviyede"],["Destek dizini kilitlemek"],"Parmak desteği","Göz kapalı / yumuşak yüzey","b2",[],[],{s:2,t:30,ps:1,rest:20}),
 E("b2","Y-denge uzanmaları","bal",["bal","mob"],1,"Kalça, diz, ayak bileği","Dinamik denge ve diz kontrolü.","Tek ayakta serbest ayakla öne, arka-iç, arka-dış uzanma.",["Topuk yerde","Diz ayak hizası"],["Serbest ayağı yere basmak"],"Kısa uzanma","Uzun uzanma, yavaş","b1",[],[],{s:2,r:5,ps:1,rest:30}),
 E("b3","Tek ayak denge + top pası","bal",["bal","coo","rea"],2,"Ayak bileği, kalça","Pertürbasyon altında denge.","Tek ayak dururken eşle top alışverişi.",["Gövde stabil","Yumuşak eller"],["Diz içe"],"İki ayak","Yumuşak zemin","b1",["ball"],[],{s:2,t:30,ps:1,rest:30}),
 E("b4","Denge yastığında squat","bal",["bal","str"],2,"Ayak bileği, quadriceps","Dengesiz zeminde kontrol.","Denge yastığı/diskte yarım squat.",["Diz hizası","Yavaş tempo"],["Derin ve hızlı"],"Yerde","Tek ayak","b1",["balance"],["deepKnee"],{s:2,r:8,rest:30}),
 // ---- Reaksiyon
 E("r1","Renk/işaret komutlu çıkış","rea",["rea","agi"],1,"Tüm vücut","Görsel reaksiyon ve karar verme.","Eşin gösterdiği renge/yöne göre 3–5 m çıkış.",["Hazır duruş","Göz işarette"],["Tahmin ederek erken çıkış"],"Tek seçenek","Çok seçenekli","s8",[],["cod"],{s:3,r:5,rest:30}),
 E("r2","Düşen top yakalama","rea",["rea","coo"],1,"Üst ekstremite","Görsel reaksiyon.","Eşin rastgele bıraktığı topu yere 1 kez sektikten sonra yakala.",["Hazır eller","Kısa adım"],["Gözü topa değil ele dikmek"],"İki top sekmesi","Tek top sekmesi yok","r3",["ball"],[],{s:3,r:6,rest:30}),
 E("r3","Duvar sekmesi reaksiyon","rea",["rea","coo"],1,"El-göz","Hızlı reaksiyon ve el kontrolü.","Duvara yakın, eşin arkadan attığı topu duvardan sektikten sonra yakala.",["Hazır eller","Göz duvarda"],["Geç tepki"],"Daha uzak mesafe","Daha yakın mesafe","r2",["ball"],[],{s:3,r:8,rest:30}),
 E("r4","Ekran reaksiyon antrenmanı","rea",["rea"],1,"—","Basit görsel reaksiyon çalışması (uygulama içi).","Reaksiyon testi ekranında 3 tur; her tur 5 deneme.",["Rahat el","Tahmin etme"],["Erken dokunma"],"—","Seçimli reaksiyon","r1",[],[],{s:3,r:5,rest:20},{inApp:1}),
 // ---- Dayanıklılık
 E("d1","Aralıklı koşu (15 sn / 15 sn)","cond",["end"],2,"Tüm vücut","Aerobik kapasite; oyun hızına yakın.","15 sn orta-yüksek tempo koşu / 15 sn yürüyüş; 6–8 dk blok.",["Konuşamayacak ama kontrollü tempo","Teknik korunur"],["İlk tekrarlarda tüm gücü harcamak"],"Daha uzun dinlenme","Daha uzun blok","d3",[],["run"],{s:2,t:360,rest:180}),
 E("d2","Küçük alan oyunu (oyun temelli)","cond",["end","agi","coo","rea"],1,"Tüm vücut","Eğlenceli, branş uyumlu dayanıklılık.","Küçük gruplarla 3–4 dk oyun blokları (temassız kurallarla da oynanabilir).",["Sürekli hareket","Keyif"],["Uzun bekleme"],"Daha büyük alan, daha az oyuncu","Daha küçük alan","d1",["ball"],["run","cod"],{s:3,t:180,rest:90}),
 E("d3","Kardiyo cihazında aralıklı","cond",["end"],1,"Alt ekstremite","Darbesiz aerobik gelişim.","Bisiklet/eliptikte 30 sn tempolu / 60 sn rahat, 8–10 tekrar.",["Ritim","Rahat omuzlar"],["Aşırı direnç"],"Sürekli düşük tempo","Daha uzun tempolu bölümler","d4",["cardio"],[],{s:1,t:900,rest:0}),
 E("d4","Vücut ağırlığı dairesel antrenman","cond",["end","str"],1,"Tüm vücut","Genel dayanıklılık ve kas dayanıklılığı (az alan).","5 istasyon × 30 sn çalışma / 30 sn dinlenme (squat, şınav, plank, step-up, dead bug).",["Kalite > hız","Nefes kontrolü"],["Yorgunken teknik bozulması"],"20 sn çalışma","3. tur","d3",[],[],{s:2,t:300,rest:120}),
 E("d5","Tempo koşusu (60–100 m)","cond",["end","spd"],3,"Tüm vücut","Aerobik güç; teknik koşu.","Maksimalin ~%70'i hızda 60–100 m, yürüyerek dönüş.",["Rahat ve uzun adım","Dik postür"],["Hızın fazla artması"],"Daha kısa mesafe","Daha fazla tekrar","d1",[],["run"],{s:1,r:8,d:80,rest:45},{sp:1}),
 // ---- Branşa özgü / önleyici
 E("v1","İniş mekaniği drili (snap down → yapış)","prev",["bal","pow"],1,"Quadriceps, gluteal","Güvenli iniş paterni; ACL risk faktörlerini azaltmaya yönelik.","Ayak ucunda yüksel, hızla atletik iniş pozisyonuna düş ve 2 sn yapış.",["Kalça geri","Diz ayak hizasında","Sessiz iniş"],["Diz içe (valgus)","Düz bacakla iniş"],"Yavaş tempo","Sıçrama ile birleştir","p3",[],["jump"],{s:3,r:5,rest:45},{pc:1}),
 E("v3","Bant omuz dış rotasyon (90/90)","prev",["str","mob"],2,"Rotator manşet","Omuz sağlığı (voleybol, hentbol, tenis, yüzme).","Dirsek omuz hizasında 90°, bantla dış rotasyon.",["Yavaş dönüş","Dirsek sabit"],["Omuz silkme"],"Kol yanda (0°)","Hızlı eksantrik","a5",["band"],["overhead"],{s:2,r:12,ps:1,rest:30}),
 E("v4","Skapula şınavı / duvar kayması","prev",["str","mob"],1,"Serratus anterior, alt trapez","Kürek kemiği kontrolü.","Plankta/duvarda kürek kemiklerini açıp kapama; duvarda kolları yukarı kaydırma.",["Dirsekler düz","Boyun rahat"],["Kambur sırt"],"Duvarda","Yerde, tek kol","st12",[],["wrist"],{s:2,r:10,rest:30}),
 E("v5","Bant oduncu (chop/lift)","prev",["str","coo"],2,"Oblikler, kalça","Kontrollü rotasyonel kuvvet.","Bantı çapraz aşağıdan yukarı / yukarıdan aşağı çek; kalça ve omuz birlikte döner.",["Ayaklar sabit dönüş","Kontrol"],["Yalnız kolla çekmek"],"Yarım diz","Hızlı tempo","st18",["band"],["rotation"],{s:2,r:10,ps:1,rest:45}),
 E("v6","İlk adım patlaması (çapraz adım çıkışı)","prev",["spd","agi"],2,"Kalça, quadriceps","Basketbol/hentbol ilk adım hızı.","Atletik duruştan çapraz adım veya açık adımla 3–5 m patlayıcı çıkış.",["Alçak açı","Güçlü itiş"],["Dikleşerek çıkış"],"%70 hız","Top sürerek / reaktif","s5",[],["sprint","cod"],{s:3,r:4,ps:1,rest:60}),
 E("v7","Blok sıçrama + yan kayma (voleybol)","prev",["pow","agi"],2,"Alt ekstremite, omuz","Voleybol blok hareketi.","Yan kayma adımları + iki ayak blok sıçraması; yumuşak iniş.",["Eller yukarı-önde","Dengeli iniş"],["Tek ayak iniş"],"Kayma + yarım sıçrama","Ardışık bloklar","p4",[],["jump","overhead"],{s:3,r:5,rest:60},{pc:1}),
 E("v8","Kuru kara streamline + hollow (yüzme)","prev",["str","mob"],1,"Core, omuz","Suda gövde kontrolü ve kayma pozisyonu.","Kollar baş üstünde birleşik; hollow tutuş ve superman geçişleri.",["Kaburgalar aşağı","Uzun gövde"],["Bel boşluğu"],"Kollar yanda","Uzun süre","st19",[],["overhead"],{s:3,t:20,rest:30}),
 E("v9","Split-step + yönelme (raket sporları)","prev",["agi","rea"],1,"Alt ekstremite","Raket sporlarında ayak işi.","Eş işaretinde split-step ve 4 yöne kısa çıkış.",["Hafif sekme","Hızlı ilk adım"],["Geç split-step"],"Yavaş","Rastgele işaret","c5",[],["cod","jump"],{s:3,r:6,rest:45},{pc:1}),
 E("v10","Duruş-çıkış ve seviye değişimi (dövüş sporları)","prev",["agi","str","bal"],2,"Tüm vücut","Dövüş sporlarında temel duruş ve seviye değişimi (temassız).","Dövüş duruşunda ileri-geri adım ve hızlı alçalma-yükselme.",["Ağırlık merkezi alçak","Gövde dik"],["Ayakları çaprazlamak"],"Yavaş","İşaretle reaktif","c4",[],["cod"],{s:3,t:20,rest:40}),
 E("v11","Hollow body tutuş (jimnastik)","prev",["str"],1,"Ön gövde","Jimnastik temel gövde pozisyonu.","Sırtüstü, bel yerde, kollar ve bacaklar uzatılmış tutuş.",["Bel yerde","Çene hafif içeride"],["Belin kalkması"],"Dizler bükük","Sallanma (rock)","a3",[],[],{s:3,t:20,rest:30}),
 E("v12","Topla deselerasyon ve yön (futbol)","prev",["agi","coo"],2,"Alt ekstremite","Topla yön değiştirme ve kontrol.","Top sürerken işaretle durma, dönme ve 5 m hızlanma.",["Kısa dokunuşlar","Alçak duruş"],["Top uzağa gitmesi"],"Yavaş","Rakipli (temassız)","c2",["ball"],["cod"],{s:3,r:4,rest:45}),
 E("v13","Kürek/bisiklet tek bacak kuvvet zinciri","prev",["str","end"],2,"Quadriceps, gluteal","Tek taraflı kuvvet dayanıklılığı.","Step-up + split squat süper seti, orta tempo.",["Diz hizası","Ritim"],["Yorgunlukta diz çökmesi"],"Yalnız step-up","Dambılla","st6",[],[],{s:2,r:10,ps:1,rest:60}),
 E("v14","Duruş ve skapula stabilizasyonu (okçuluk)","prev",["str","bal"],1,"Skapula, core","Okçulukta duruş ve çekiş stabilitesi.","Bantla tek kol çekişte 5–10 sn izometrik tutuş, gövde sabit.",["Omuz aşağı","Sabit gövde"],["Omuzu kulağa kaldırmak"],"Hafif bant","Uzun tutuş","st13",["band"],[],{s:3,r:6,ps:1,rest:30}),
 // ---- Soğuma
 E("cl1","Yürüyüş ve diyafragma nefesi","cool",["end"],1,"—","Toparlanmaya geçiş.","2–3 dk yavaş yürüyüş, ardından 4 sn al – 6 sn ver nefes.",["Uzun nefes verme"],["Aniden durmak"],"Oturarak","—","cl2",[],[],{s:1,t:180,rest:0}),
 E("cl2","Statik esneme (alt ekstremite)","cool",["mob"],1,"Kalça fleksörü, hamstring, baldır","Rahatlama ve esneklik.","Her kas grubu 20–30 sn, ağrısız gerginlik.",["Ağrısız","Nefes"],["Yaylanmak"],"Daha kısa süre","Daha uzun süre","cl1",[],[],{s:1,t:30,ps:1,rest:0}),
 E("cl3","Göğüs-omuz esnemesi","cool",["mob"],1,"Göğüs, ön omuz","Postür ve omuz esnekliği.","Kapı çerçevesinde kol 90° ile göğsü açarak esneme.",["Ağrısız","Omuz aşağı"],["Zorlamak"],"Kol aşağıda","Kol yukarıda","cl2",[],[],{s:1,t:30,ps:1,rest:0})
];
const EX = Object.fromEntries(EXERCISES.map(e => [e.id, e]));
// Not: "p1" kimliği a7 (pogo) ile eşdeğerdir — alternatif zinciri için eşleme
EX.p1 = EX.a7;

/* -------------------------------------------------------------------------
   BRANŞ VERİ TABANI — ağırlıklar açıklanabilir uygunluk puanında kullanılır.
   w: özellik ağırlıkları (toplam 1'e normalize edilir); hM/mM: boy/kütle yönü (high|low|mid)
   focus: program öncelik sırası; prev: önleyici; drills: branşa özgü fiziksel çalışmalar
   ------------------------------------------------------------------------- */
const SPORTS = [
 {id:"basketball",n:"Basketbol",team:1,contact:0,hM:"high",
  w:{H:.16,AS:.08,pow:.16,spd:.10,agi:.14,coo:.12,end:.08,rea:.08,bal:.04,str:.04},
  focus:["pow","agi","spd","bal","str","end"],prev:["v1","p8","st17","a6"],drills:["v6","c7","p4","c1"],
  demands:"İlk adım hızı, sıçrama kapasitesi, patlayıcı kuvvet, yön değiştirme, tekrarlı sprint, denge, iniş mekaniği, gövde stabilitesi.",
  prereq:"Güvenli iniş mekaniği, temel squat/hamle paterni, ayak bileği mobilitesi.",
  goals:"CMJ ve 10 m sprintte bireysel gelişim; iniş tekniğinde diz hizası; 505 sol-sağ farkının azalması.",
  pos:[
   {id:"pg",n:"Oyun kurucu",w:{agi:.2,spd:.18,rea:.15,coo:.17,end:.12,H:.04,pow:.08,bal:.06}},
   {id:"sg",n:"Şutör gard",w:{coo:.18,spd:.15,agi:.15,pow:.12,H:.1,AS:.06,end:.12,rea:.12}},
   {id:"sf",n:"Kısa forvet",w:{H:.14,AS:.1,pow:.16,spd:.12,agi:.14,end:.12,coo:.12,str:.1}},
   {id:"pf",n:"Uzun forvet",w:{H:.2,AS:.12,str:.18,pow:.18,bal:.1,agi:.1,coo:.12}},
   {id:"c",n:"Pivot",w:{H:.28,AS:.16,str:.2,pow:.12,bal:.12,coo:.12}}]},
 {id:"football",n:"Futbol",team:1,contact:1,hM:"mid",
  w:{spd:.18,agi:.16,end:.18,pow:.12,coo:.14,str:.08,bal:.06,rea:.08},
  focus:["spd","agi","end","str","pow","coo"],prev:["st16","st21","v1","b2"],drills:["v12","s4","c2","d2"],
  demands:"Hızlanma, maksimum sürat, sprint mekaniği, tekrarlı sprint kapasitesi, yön değiştirme, alt ekstremite ve tek taraflı kuvvet, aerobik kapasite.",
  prereq:"Temel koşu mekaniği, deselerasyon tekniği, hamstring ve adduktor kuvveti.",
  goals:"10–20 m sprint ve 505'te bireysel gelişim; Nordic ve Kopenhag ilerlemesi; aerobik kapasite.",
  pos:[
   {id:"gk",n:"Kaleci",w:{H:.2,AS:.12,rea:.22,pow:.18,agi:.14,coo:.14}},
   {id:"cb",n:"Stoper",w:{H:.18,str:.18,pow:.16,spd:.12,end:.12,coo:.1,rea:.08,bal:.06}},
   {id:"fb",n:"Bek",w:{end:.22,spd:.2,agi:.18,coo:.12,pow:.1,rea:.08,bal:.1}},
   {id:"cm",n:"Orta saha",w:{end:.26,coo:.2,agi:.16,spd:.1,rea:.1,bal:.08,pow:.1}},
   {id:"w",n:"Kanat",w:{spd:.26,agi:.2,coo:.16,end:.14,pow:.12,rea:.12}},
   {id:"st",n:"Forvet",w:{spd:.2,pow:.18,agi:.14,coo:.16,str:.1,rea:.12,bal:.1}}]},
 {id:"volleyball",n:"Voleybol",team:1,contact:0,hM:"high",
  w:{H:.2,AS:.1,pow:.22,rea:.1,coo:.14,agi:.1,mob:.08,bal:.06},
  focus:["pow","rea","bal","mob","agi","str"],prev:["v1","v3","v4","p8"],drills:["v7","p4","r1","k2"],
  demands:"Sıçrama kapasitesi, patlayıcı kuvvet, omuz mobilitesi, iniş kontrolü, reaksiyon, koordinasyon.",
  prereq:"İniş mekaniği, omuz mobilitesi ve skapula kontrolü.",
  goals:"CMJ'de bireysel gelişim; iniş kalitesi; omuz mobilitesi sol-sağ dengesi.",
  pos:[
   {id:"s",n:"Pasör",w:{coo:.24,rea:.18,agi:.18,pow:.1,H:.1,end:.1,bal:.1}},
   {id:"oh",n:"Smaçör",w:{H:.16,AS:.08,pow:.24,coo:.14,agi:.12,end:.12,mob:.08,rea:.06}},
   {id:"mb",n:"Orta oyuncu",w:{H:.28,AS:.14,pow:.24,rea:.14,agi:.1,coo:.1}},
   {id:"op",n:"Pasör çaprazı",w:{H:.2,AS:.1,pow:.26,str:.12,coo:.12,mob:.1,end:.1}},
   {id:"l",n:"Libero",w:{rea:.24,agi:.22,coo:.2,bal:.12,spd:.1,end:.12}}]},
 {id:"handball",n:"Hentbol",team:1,contact:1,hM:"high",
  w:{H:.12,AS:.06,str:.12,pow:.16,spd:.12,agi:.14,end:.12,coo:.12,M:.04},
  focus:["pow","agi","str","spd","end","coo"],prev:["v3","st21","v1","p8"],drills:["v6","p13","c1","p11"],
  demands:"Patlayıcı kuvvet, atış gücü, yön değiştirme, temas kuvveti, tekrarlı sprint.",
  prereq:"Omuz sağlığı, iniş mekaniği, gövde stabilitesi.",
  goals:"Sağlık topu atış ve CMJ gelişimi; omuz dış rotasyon kuvveti.",
  pos:[
   {id:"gk",n:"Kaleci",w:{rea:.24,H:.14,AS:.12,agi:.16,mob:.16,coo:.18}},
   {id:"wg",n:"Kanat",w:{spd:.24,agi:.2,pow:.16,coo:.16,end:.12,bal:.12},hM:"mid"},
   {id:"cb",n:"Oyun kurucu (merkez)",w:{coo:.22,agi:.2,rea:.14,pow:.12,spd:.12,end:.12,H:.08}},
   {id:"bk",n:"Sağ/Sol bek",w:{H:.18,AS:.08,pow:.24,str:.18,coo:.12,end:.1,agi:.1}},
   {id:"pv",n:"Pivot",w:{str:.26,M:.16,H:.12,bal:.18,pow:.14,coo:.14},mM:"high"}]},
 {id:"rugby",n:"Ragbi",team:1,contact:1,hM:"mid",mM:"high",
  w:{str:.18,pow:.16,spd:.14,M:.12,end:.14,agi:.12,coo:.08,bal:.06},
  focus:["str","pow","spd","end","agi","bal"],prev:["st21","st16","a6","st19"],drills:["s4","p5","c2","st20"],
  demands:"Kuvvet, temas toleransı, patlayıcı güç, tekrarlı sprint, deselerasyon.",
  prereq:"Temas öncesi güvenli düşme ve temas tekniği (yaşa uygun), boyun-gövde kuvveti, uzman onayı.",
  goals:"Genel kuvvet ve hızlanma gelişimi; güvenli temas tekniği.",
  pos:[
   {id:"fr",n:"Forvet (ön hat)",w:{str:.28,M:.22,pow:.16,end:.12,bal:.12,H:.1}},
   {id:"lk",n:"İkinci hat",w:{H:.22,AS:.08,str:.2,pow:.18,M:.12,end:.1,coo:.1},hM:"high"},
   {id:"bk",n:"Arka hat",w:{spd:.26,agi:.2,pow:.14,coo:.14,end:.12,rea:.14},mM:"mid"}]},
 {id:"athletics",n:"Atletizm",team:0,contact:0,hM:"mid",
  w:{spd:.22,pow:.2,end:.14,coo:.12,str:.1,mob:.08,bal:.06,H:.08},
  focus:["spd","pow","coo","str","mob","end"],prev:["st16","st17","v1","m3"],drills:["s2","s3","s10","p14"],
  demands:"Sprint mekaniği, patlayıcı kuvvet, ritim, disipline göre dayanıklılık.",
  prereq:"Koşu tekniği temelleri, ayak bileği ve kalça mobilitesi.",
  goals:"Sprint tekniği ve 20–30 m süre gelişimi; sıçrama gücü.",
  pos:[
   {id:"spr",n:"Sürat / engelli",w:{spd:.34,pow:.26,coo:.14,mob:.1,str:.1,rea:.06}},
   {id:"dist",n:"Orta-uzun mesafe",w:{end:.46,coo:.12,spd:.12,mob:.1,M:.1,bal:.1},mM:"low"},
   {id:"jmp",n:"Atlamalar",w:{pow:.32,spd:.22,H:.12,coo:.14,bal:.1,mob:.1},hM:"high"},
   {id:"thr",n:"Atmalar",w:{str:.28,pow:.26,M:.14,H:.12,coo:.12,mob:.08},hM:"high",mM:"high"}]},
 {id:"swimming",n:"Yüzme",team:0,contact:0,hM:"high",
  w:{H:.12,AS:.14,end:.22,mob:.16,coo:.14,str:.12,pow:.1},
  focus:["mob","end","str","coo","pow","bal"],prev:["v3","v4","v8","a5"],drills:["v8","st13","p12","d3"],
  demands:"Omuz hareketliliği, gövde kontrolü, genel kuvvet, aerobik kapasite, koordinasyon.",
  prereq:"Su güveni ve temel yüzme becerisi; omuz mobilitesi.",
  goals:"Omuz mobilitesi ve gövde kuvvet-dayanıklılığı gelişimi.",
  pos:[
   {id:"spr",n:"Sprint (50–100 m)",w:{pow:.22,str:.18,AS:.14,H:.12,coo:.14,mob:.1,end:.1}},
   {id:"dist",n:"Orta-uzun mesafe",w:{end:.36,mob:.16,coo:.16,AS:.12,H:.1,str:.1}}]},
 {id:"tennis",n:"Tenis",team:0,contact:0,hM:"mid",
  w:{agi:.2,rea:.16,coo:.18,spd:.12,pow:.1,end:.12,mob:.06,bal:.06},
  focus:["agi","rea","pow","coo","end","mob"],prev:["v3","v5","b2","a2"],drills:["v9","p13","c4","k2"],
  demands:"Çok yönlü çeviklik, reaksiyon, rotasyonel güç, omuz sağlığı, aralıklı dayanıklılık.",prereq:"Omuz ve gövde kontrolü, temel ayak işi.",goals:"505 ve reaksiyon gelişimi; rotasyonel güç.",pos:[]},
 {id:"tabletennis",n:"Masa tenisi",team:0,contact:0,hM:"mid",
  w:{rea:.28,coo:.28,agi:.2,bal:.1,spd:.08,mob:.06},
  focus:["rea","coo","agi","bal","pow","mob"],prev:["v5","b1","a2","m4"],drills:["v9","r3","k2","c4"],
  demands:"Reaksiyon, el-göz koordinasyonu, kısa mesafe çeviklik, denge.",prereq:"Temel el-göz koordinasyonu.",goals:"Reaksiyon ve koordinasyon test gelişimi.",pos:[]},
 {id:"badminton",n:"Badminton",team:0,contact:0,hM:"mid",
  w:{agi:.24,rea:.2,coo:.18,pow:.12,end:.12,spd:.08,mob:.06},
  focus:["agi","rea","pow","coo","end","mob"],prev:["v3","v1","b2","st17"],drills:["v9","p9","c1","k2"],
  demands:"Hamle-geri dönüş çevikliği, sıçrama, reaksiyon, omuz sağlığı.",prereq:"Ayak işi temeli, iniş kontrolü.",goals:"Çeviklik ve reaksiyon gelişimi.",pos:[]},
 {id:"gymnastics",n:"Jimnastik",team:0,contact:0,hM:"low",mM:"low",
  w:{str:.2,mob:.2,pow:.16,coo:.16,bal:.16,H:.06,M:.06},
  focus:["mob","str","bal","coo","pow","rea"],prev:["v11","v4","m3","a5"],drills:["v11","p3","b1","m7"],
  demands:"Göreceli kuvvet, mobilite, denge, koordinasyon, iniş kontrolü.",prereq:"Temel vücut pozisyonları (hollow/arch), bilek ve omuz hazırlığı.",goals:"Mobilite ve gövde kuvveti gelişimi.",pos:[]},
 {id:"wrestling",n:"Güreş",team:0,contact:1,hM:"mid",
  w:{str:.26,pow:.16,end:.16,bal:.14,agi:.1,coo:.1,mob:.08},
  focus:["str","bal","end","pow","agi","mob"],prev:["st19","a6","st21","st18"],drills:["v10","st20","p12","d4"],
  demands:"Göreceli kuvvet, denge, kavrama, anaerobik dayanıklılık.",prereq:"Güvenli düşme, boyun-gövde kuvveti; sıklet konusu yalnızca uzman kontrolünde.",goals:"Genel kuvvet ve denge gelişimi.",pos:[]},
 {id:"boxing",n:"Boks",team:0,contact:1,hM:"mid",
  w:{spd:.14,rea:.2,end:.2,pow:.14,coo:.14,agi:.12,AS:.06},
  focus:["rea","end","pow","agi","coo","str"],prev:["v4","st18","a6","m4"],drills:["v10","p11","r3","d1"],
  demands:"Reaksiyon, aralıklı dayanıklılık, üst gövde gücü, ayak işi.",prereq:"Temassız teknik dönem; baş darbesi riski için yaşa uygun kurallar ve uzman onayı.",goals:"Reaksiyon ve dayanıklılık gelişimi.",pos:[]},
 {id:"taekwondo",n:"Tekvando",team:0,contact:1,hM:"mid",
  w:{pow:.18,mob:.18,agi:.16,rea:.16,coo:.12,bal:.1,H:.06,AS:.04},
  focus:["mob","pow","rea","agi","bal","coo"],prev:["m5","b2","a2","p8"],drills:["v10","p9","m2","r1"],
  demands:"Kalça mobilitesi, patlayıcı tekme gücü, reaksiyon, denge.",prereq:"Kalça mobilitesi ve tek ayak denge.",goals:"Mobilite ve denge testlerinde gelişim.",pos:[]},
 {id:"karate",n:"Karate",team:0,contact:1,hM:"mid",
  w:{rea:.2,spd:.16,coo:.16,agi:.14,mob:.12,pow:.12,bal:.1},
  focus:["rea","coo","agi","pow","mob","bal"],prev:["m2","b1","st18","a6"],drills:["v10","r1","p9","k5"],
  demands:"Reaksiyon, koordinasyon, hız, denge.",prereq:"Temel duruş ve denge.",goals:"Reaksiyon ve koordinasyon gelişimi.",pos:[]},
 {id:"judo",n:"Judo",team:0,contact:1,hM:"mid",
  w:{str:.26,pow:.14,bal:.18,end:.14,coo:.12,agi:.08,mob:.08},
  focus:["str","bal","pow","end","coo","mob"],prev:["st19","a6","st13","st18"],drills:["v10","st20","p12","st14"],
  demands:"Kavrama ve çekiş kuvveti, denge, anaerobik dayanıklılık.",prereq:"Güvenli düşme (ukemi) tekniği; uzman onayı.",goals:"Çekiş kuvveti ve denge gelişimi.",pos:[]},
 {id:"fencing",n:"Eskrim",team:0,contact:0,hM:"mid",
  w:{rea:.26,agi:.2,coo:.18,spd:.12,pow:.1,bal:.08,AS:.06},
  focus:["rea","agi","coo","pow","bal","str"],prev:["a2","st3","b2","m2"],drills:["r1","c4","st4","v9"],
  demands:"Reaksiyon, ileri-geri çeviklik, hamle gücü, koordinasyon.",prereq:"Temel ayak işi ve tek taraflı kuvvet dengesi.",goals:"Reaksiyon ve hamle gücü gelişimi.",pos:[]},
 {id:"cycling",n:"Bisiklet",team:0,contact:0,hM:"mid",mM:"low",
  w:{end:.36,pow:.18,str:.16,M:.1,coo:.08,mob:.06,bal:.06},
  focus:["end","str","pow","mob","bal","coo"],prev:["m1","a1","st19","m5"],drills:["v13","d3","st6","st8"],
  demands:"Aerobik kapasite, alt ekstremite kuvveti, kalça mobilitesi, gövde stabilitesi.",prereq:"Güvenli bisiklet kullanımı.",goals:"Aerobik kapasite ve tek taraflı kuvvet.",pos:[]},
 {id:"rowing",n:"Kürek",team:0,contact:0,hM:"high",
  w:{H:.18,AS:.12,end:.26,str:.2,pow:.12,mob:.06,coo:.06},
  focus:["end","str","pow","mob","coo","bal"],prev:["st7","st13","a1","m9"],drills:["v13","st14","d3","st9"],
  demands:"Aerobik kapasite, arka zincir kuvveti, kalça menteşe paterni, gövde kontrolü.",prereq:"Kalça menteşe tekniği ve nötral omurga.",goals:"Kuvvet-dayanıklılık ve aerobik kapasite.",pos:[]},
 {id:"archery",n:"Okçuluk",team:0,contact:0,hM:"mid",
  w:{bal:.26,coo:.22,str:.18,mob:.12,rea:.06,end:.08,AS:.08},
  focus:["bal","str","coo","mob","end","rea"],prev:["v14","v4","a5","st18"],drills:["v14","b1","st13","a5"],
  demands:"Statik denge, skapula stabilitesi, çekiş kuvvet-dayanıklılığı, odak.",prereq:"Omuz sağlığı ve duruş kontrolü.",goals:"Denge ve skapula kontrolü gelişimi.",pos:[]}
];

/* Bilimsel referanslar */
const REFS = [
 ["Uzun vadeli atletik gelişim","Lloyd RS ve ark. (2016) NSCA Position Statement on Long-Term Athletic Development. J Strength Cond Res 30(6):1491–1509."],
 ["Gençlerde direnç antrenmanı","Faigenbaum AD ve ark. (2009) Youth resistance training: updated position statement (NSCA). J Strength Cond Res 23:S60–79."],
 ["Pediatri — direnç antrenmanı","Stricker PR, Faigenbaum AD, McCambridge TM (2020) Resistance Training for Children and Adolescents. Pediatrics 145(6) — American Academy of Pediatrics."],
 ["IOC — genç sporcu gelişimi","Bergeron MF ve ark. (2015) IOC consensus statement on youth athletic development. Br J Sports Med 49:843–851."],
 ["Gençlik fiziksel gelişim modeli","Lloyd RS, Oliver JL (2012) The Youth Physical Development Model. Strength Cond J 34(3):61–72."],
 ["Olgunlaşma tahmini","Mirwald RL ve ark. (2002) Med Sci Sports Exerc 34:689–694; Moore SA ve ark. (2015) Med Sci Sports Exerc 47:1755–1764 (yeniden düzenlenmiş eşitlikler)."],
 ["Büyüme atağı ve yük","Malina RM, Bouchard C, Bar-Or O (2004) Growth, Maturation, and Physical Activity. Human Kinetics."],
 ["Erken uzmanlaşma ve haftalık saat","Jayanthi NA ve ark. (2015) Am J Sports Med 43:794–801 — haftalık organize spor saati ≤ yaş önerisi."],
 ["Seans RPE yükü","Foster C ve ark. (2001) A new approach to monitoring exercise training. J Strength Cond Res 15:109–115."],
 ["Akut:kronik yük (sınırlılıklarıyla)","Gabbett TJ (2016) Br J Sports Med 50:273–280; Impellizzeri FM ve ark. (2020) eleştirisi — oran tek başına sakatlık tahmin etmez."],
 ["Ölçüm hatası","Hopkins WG (2000) Measures of reliability in sports medicine and science. Sports Med 30:1–15."],
 ["Avrupa fitness normları","Tomkinson GR ve ark. (2018) Br J Sports Med 52:1445–1456."],
 ["ALPHA test bataryası","Ruiz JR ve ark. (2011) Br J Sports Med 45:518–524."],
 ["Sakatlık önleme programları","FIFA 11+ Kids (FIFA Training Centre); Rössler R ve ark. (2018) Sports Med 48:1493–1504."],
 ["Uyku önerileri","Paruthi S ve ark. (2016) American Academy of Sleep Medicine — 6–12 yaş 9–12 sa, 13–18 yaş 8–10 sa."],
 ["İniş mekaniği / diz hizası","Myer GD ve ark. (2011) Hewett TE ve ark. (2005) — dinamik valgus ve nöromüsküler antrenman."],
 ["2B video açı ölçümü","Munro A ve ark. (2012) frontal düzlem projeksiyon açısı (FPPA) güvenilirliği; Schurr SA ve ark. (2017) 2B–3B karşılaştırma."],
 ["UEFA / FIFA eğitim kaynakları","UEFA Training Ground ve FIFA Training Centre gençlik antrenmanı yayınları."],
 ["ACSM","ACSM's Guidelines for Exercise Testing and Prescription (11. baskı) — pediatrik egzersiz testi."]
];

/* Boy referansı (WHO 2007 büyüme referansı medyan değerleri, yaklaşık) */
const HREF = {
 m:{6:116,7:122,8:128,9:133,10:138,11:143,12:149,13:156,14:163,15:170,16:173,17:175,18:176},
 f:{6:115,7:121,8:127,9:133,10:138,11:144,12:151,13:157,14:160,15:162,16:163,17:163,18:163}
};
/* BMI medyanı (WHO 2007, yaklaşık) */
const BMIREF = {
 m:{6:15.3,7:15.5,8:15.7,9:16.0,10:16.4,11:16.9,12:17.5,13:18.2,14:19.0,15:19.8,16:20.5,17:21.1,18:21.7},
 f:{6:15.3,7:15.4,8:15.7,9:16.1,10:16.6,11:17.2,12:18.0,13:18.8,14:19.6,15:20.2,16:20.7,17:21.0,18:21.3}
};
