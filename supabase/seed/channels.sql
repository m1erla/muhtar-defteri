-- Dijital Muhtar — channels seed data (Adana + national routing list, PRD §11)
--
-- All facts verified against primary sources on 2026-07-03:
--   ALO 153:   https://www.adana.bel.tr/tr/birim-detay/48 (WhatsApp hattı, e-posta,
--              15/30 iş günü cevap standardı — hepsi resmi birim sayfasında)
--   e-belediye: https://ebelediye.adana.bel.tr/SikayetOneri (HTTP 200)
--   Alo 181:   https://alo181.gov.tr + https://alo181.gov.tr/tasks (çevre şikayetleri
--              kapsamda; arama ücretli — "ücretsiz" DEME)
--   112:       155 Polis İmdat Adana'da 112'ye birleştirildi (adana.gov.tr/sg-176);
--              fotoğraflı ihbar formu https://ihbar.ng112.gov.tr (EGM Mobil de aynı
--              forma çıkar; form anonim değil, jpg/png fotoğraf, plaka metne yazılır)
--   CİMER:     https://www.cimer.gov.tr (e-Devlet girişi zorunlu, günde 1 başvuru,
--              telefonla ALO 150)
--
-- Re-verify before launch: ALO 153 WhatsApp numarası resmi sayfada duruyor ama sayfa
-- içeriği eski — canlı bir test mesajıyla doğrula. "153" kısa kodu şehir içi kullanım
-- içindir; santral 0322 455 35 00.
--
-- channels is seed-only data (CLAUDE.md): safe to wipe and re-insert.

delete from channels;

insert into channels (category, name, scope, description, contact_phone, contact_url, required_info, notes) values

-- ── Temizlik / Çöp ─────────────────────────────────────────────────────────────
('cleanliness', 'ALO 153 Çağrı Merkezi (Adana Büyükşehir)', 'adana',
 'Taşan konteyner, alınmayan çöp, temizlik sorunları için ilk durak. Günün her saati açık; WhatsApp ile fotoğraflı ihbar alıyor.',
 '153', 'https://www.adana.bel.tr/tr/birim-detay/48',
 array['Adres veya mahalle bilgisi', 'Sorunun kısa tarifi', 'Fotoğraf (WhatsApp ihbarı için)'],
 'WhatsApp ihbar hattı: 0535 454 01 01 (adana.bel.tr''de listeli, Tem 2026). E-posta: alo153@adana.bel.tr. Belediyenin yazılı başvurulara cevap standardı 15 iş günü (farklı birimlerden bilgi gerekiyorsa 30 iş günü). Şehir dışından: 0322 455 35 00.'),

('cleanliness', 'e-Belediye Şikayet / Öneri Formu (Adana Büyükşehir)', 'adana',
 'Yazılı kayıt bırakmak istersen belediyenin çevrimiçi formu. Başvuru ilgili birime ve ilçeye içeride yönlendirilir.',
 null, 'https://ebelediye.adana.bel.tr/SikayetOneri',
 array['Adres bilgisi', 'Sorunun açıklaması', 'İletişim bilgin'],
 'Cevap standardı ALO 153 ile aynı: 15 iş günü (çapraz birimde 30 iş günü).'),

('cleanliness', 'Alo 181 (Çevre, Şehircilik ve İklim Değişikliği Bakanlığı)', 'national',
 'Kaçak moloz dökümü, çevre kirliliği gibi belediye temizliğini aşan çevre ihlalleri için bakanlık hattı. 7/24.',
 '181', 'https://alo181.gov.tr',
 array['Konum tarifi', 'Fotoğraf (varsa)', 'Web formu için TC kimlik no'],
 'Arama ücretlidir (acil numara değildir). Rutin çöp toplama sorunları için önce ALO 153. WhatsApp: 0532 010 11 81 (resmi sitede listeli).'),

-- ── Hatalı Park ────────────────────────────────────────────────────────────────
('parking', 'ALO 153 / Zabıta (Adana Büyükşehir)', 'adana',
 'Kaldırımı veya geçidi kapatan araçlar gibi zabıta konuları için belediyenin çağrı merkezi.',
 '153', 'https://www.adana.bel.tr/tr/birim-detay/48',
 array['Adres veya konum tarifi', 'Aracın plakası', 'Fotoğraf (WhatsApp ihbarı için)'],
 'WhatsApp ihbar hattı: 0535 454 01 01 (adana.bel.tr''de listeli, Tem 2026).'),

('parking', '112 Online İhbar (fotoğraflı)', 'national',
 'Acil olmayan hatalı park ihbarı için resmî çevrimiçi form. EGM Mobil uygulamasındaki ihbar da aynı forma çıkar.',
 null, 'https://ihbar.ng112.gov.tr',
 array['Plakanın net göründüğü fotoğraf (jpg/png)', 'Plaka numarası (açıklama metnine yaz)', 'Adres (il/ilçe/mahalle)', 'TC kimlik no ve iletişim bilgileri'],
 'Form anonim değildir; ad, TC kimlik no ve iletişim ister. Video yüklenmez, sadece fotoğraf.'),

('parking', '112 Acil Çağrı Merkezi', 'national',
 'Trafiği fiilen kapatan, o an müdahale gerektiren araçlar için acil hat. Eski 155 Polis İmdat aramaları artık 112''de.',
 '112', null,
 array['Tam konum', 'Aracın plakası ve rengi'],
 'Sadece acil durumda ara — acil olmayan/asılsız aramalar için idari para cezası uygulanabiliyor. Fotoğraflı ihbar için çevrimiçi formu kullan.'),

-- ── Kaldırım / Altyapı ─────────────────────────────────────────────────────────
('infrastructure', 'ALO 153 Çağrı Merkezi (Adana Büyükşehir)', 'adana',
 'Bozuk kaldırım, çukur, aydınlatma ve altyapı sorunları için ilk durak. Alo153 Saha Ekibi (Derman) yerinde inceleme yapıyor.',
 '153', 'https://www.adana.bel.tr/tr/birim-detay/48',
 array['Adres veya konum tarifi', 'Sorunun kısa tarifi', 'Fotoğraf (WhatsApp ihbarı için)'],
 'WhatsApp ihbar hattı: 0535 454 01 01 (adana.bel.tr''de listeli, Tem 2026). Cevap standardı 15 iş günü (çapraz birimde 30 iş günü).'),

('infrastructure', 'e-Belediye Şikayet / Öneri Formu (Adana Büyükşehir)', 'adana',
 'Yazılı kayıt bırakmak istersen belediyenin çevrimiçi formu. İlgili birime ve ilçe belediyesine içeride yönlendirilir.',
 null, 'https://ebelediye.adana.bel.tr/SikayetOneri',
 array['Adres bilgisi', 'Sorunun açıklaması', 'İletişim bilgin'],
 'Cevap standardı 15 iş günü (çapraz birimde 30 iş günü).'),

('infrastructure', 'CİMER (Cumhurbaşkanlığı İletişim Merkezi)', 'national',
 'Belediye kanallarından sonuç alamazsan üst başvuru yolu. Başvurun ilgili kuruma resmi kayıtla iletilir.',
 '150', 'https://www.cimer.gov.tr',
 array['e-Devlet şifresi (web başvurusu için)', 'Sorunun açıklaması ve konumu'],
 'Web başvurusu e-Devlet girişi ister; telefonla ALO 150 da kullanılabilir. Günde en fazla 1 başvuru.'),

-- ── Okul Çevresi Güvenliği ─────────────────────────────────────────────────────
('school_safety', 'ALO 153 Çağrı Merkezi (Adana Büyükşehir)', 'adana',
 'Okul çevresinde kasis, işaretleme, aydınlatma, kaldırım gibi fiziki güvenlik talepleri için belediye hattı.',
 '153', 'https://www.adana.bel.tr/tr/birim-detay/48',
 array['Okulun adı ve adresi', 'Sorunun kısa tarifi', 'Fotoğraf (WhatsApp ihbarı için)'],
 'WhatsApp ihbar hattı: 0535 454 01 01 (adana.bel.tr''de listeli, Tem 2026). Cevap standardı 15 iş günü (çapraz birimde 30 iş günü).'),

('school_safety', '112 Acil Çağrı Merkezi', 'national',
 'Okul önünde o an süren tehlikeli durum (tehlikeli sürüş, acil müdahale gereken durumlar) için acil hat.',
 '112', null,
 array['Okulun adı ve tam konum', 'Durumun kısa tarifi'],
 'Sadece acil durumda ara. Süreklilik gösteren güvenlik sorunları için ALO 153 veya CİMER''i kullan.'),

('school_safety', 'CİMER (Cumhurbaşkanlığı İletişim Merkezi)', 'national',
 'Okul çevresi güvenliğiyle ilgili kalıcı talepler için resmi başvuru yolu — ilgili kuruma (belediye, emniyet, MEB) yönlendirilir.',
 '150', 'https://www.cimer.gov.tr',
 array['e-Devlet şifresi (web başvurusu için)', 'Okulun adı, sorunun açıklaması ve konumu'],
 'Web başvurusu e-Devlet girişi ister; telefonla ALO 150 da kullanılabilir. Günde en fazla 1 başvuru.');
