# Mahalle Defteri — jüri sunum senaryosu (demo script)

~60–75 saniyelik canlı demo. Türkçe konuşma satırları hazır; köşeli parantez
içindekiler senin için sahne yönergeleridir (jüriye söyleme).

## Platform, tek cümlede
Mahalle Defteri **mobil öncelikli bir web uygulamasıdır** — telefonun
tarayıcısında açılır, indirme/kurulum yok. (Expo/React Native ile yazıldı ama
yayın hedefi web.) Native bir uygulama değildir; bu bilinçli bir tercih.

## Demo öncesi kontrol (jüriden önce)
- **Telefonla, canlı, soğuk aç** (PRD §12 bunu puanlıyor — laptoptan anlatma).
- **Hangi URL: https://muhtar-defteri.com** — özel alan adı, Türkiye'den
  erişilebilir. (Cloudflare'in `*.pages.dev` adresi bazı TR operatörlerinde bloklu;
  özel alan adı bu yüzden var. Demoda pages.dev'i AÇMA.)
- Şebeke: mobil veri + wifi ikisini de dene, hangisi hızlıysa onu kullan.
- Demo verisi hazır (Çukurova'da ⟳3 tekrar, Sinanpaşa'da 45 günlük gecikmiş
  kayıt). Sayfayı bir kez önceden açıp önbelleği ısıt, sonra kapat.
- Ana ekranı ("Bir Sorun Bildir") açık bırakıp öyle başla.

---

## 60 saniyelik senaryo

**Açılış — problem (~10 sn).**
> "Adana'da bir sorun görüyorsunuz: kaldırıma park etmiş bir araç, taşan bir çöp
> konteyneri. Peki kimi arayacaksınız? Alo 153 mü, 112 mi, CİMER mi? Çoğumuz
> bilmeyiz. Mahalle Defteri tam burada devreye giriyor."

**1. Doğru kanala yönlendirme (~25 sn).**
[Ana ekran → "Bir Sorun Bildir" → "Hatalı Park"]
> "Sorunun türünü seçiyorum."
[Detay ekranı — kısaca göster, geç]
> "İstersen fotoğraf ve konum ekliyorsun; hiçbiri zorunlu değil."
["Devam Et" → yönlendirme sonucu]
> "Ve işte doğru yer: Adana için ALO 153, ulusal için 112 Online İhbar. Numara,
> form bağlantısı ve 'yanına al' listesi — plaka, fotoğraf. Tek dokunuşla
> kopyalayıp arıyorsun. Buraya kadar 30 saniye sürdü."

**2. Şeffaflık ve hesap verebilirlik (~25 sn).**
[Ana ekran → "Mahalle Kaydı" (harita/liste)]
> "İkinci kısım: şeffaflık. Bildirilen sorunlar herkese açık."
[Çukurova satırlarındaki **⟳3** rozetini / haritadaki '3'lü işareti göster]
> "Şu işarete dikkat: aynı noktada üç kez bildirilmiş. Tekrarlayan bir sorun,
> okumaya gerek kalmadan bir bakışta belli."
[45 günlük Sinanpaşa (Kaldırım/Altyapı) kaydına dokun]
> "Detayda: ne zamandır beklediği, kaç kişinin doğruladığı — ve şu satır:
> 'Belediyenin 15 iş günü yanıt süresi ölçütü aşıldı'. Yani sadece bildirmiyoruz,
> takip ediyoruz. Herkes 'Ben de Gördüm' ya da 'Bu Düzeldi' diyebiliyor."

**3. Ne olduğu / ne olmadığı (~10 sn).**
[→ "Nasıl çalışır?"]
> "Peki bu resmi bir kanal mı? Hayır — ve bunu açıkça söylüyoruz. Mahalle Defteri
> resmi bir devlet kanalı değil; mevcut kanalların yerine geçmez, yanında çalışan
> bir yönlendirme ve şeffaflık katmanı. Hesap yok, kişisel veri yok."

**Kapanış (~5 sn).**
> "Bugün Adana için hazır. Aynı model, sadece kanal listesi genişletilerek her il
> için çalışır. Teşekkürler."

---

## Puan kriterlerine bağlanışı (PRD §12) — jüri bunu görsün
- **Fikir & Problem (%30):** açılıştaki "kimi arayacaksınız?" anı.
- **UX/UI (%20):** 60 saniyenin altında biten akış; defter satırları, damga işareti.
- **Yenilikçilik (%20):** yönlendirme + şeffaflık katmanı — bir başvuru kanalı
  *değil*; ⟳ tekrar işareti ve "gecikmiş" ölçütü bunu somutlaştırıyor.
- **Teknik yeterlilik (%15):** telefonda canlı, gerçek veritabanı, doğrulanmış
  gerçek kanallar.
- **Sunum (%15):** bu senaryo + net "ne değildir" çerçevesi.

## Olası jüri soruları (hazırlık)
- **"Resmi bir uygulama mı?"** → Hayır. Uygulamanın içinde de açıkça yazıyor;
  "Nasıl çalışır?" ekranı bunu tek işi olarak yapıyor.
- **"Veriler nasıl doğrulanıyor / kötüye kullanım?"** → Kanal listesi resmi
  kaynaklardan doğrulandı (adana.bel.tr, cimer.gov.tr, alo181.gov.tr,
  ihbar.ng112.gov.tr). Kayıtlar topluluktan; durum/tarih sunucuda sabit,
  kullanıcı değiştiremiyor (veri tabanı kuralları), aynı kişi bir kaydı bir kez
  doğrulayabiliyor.
- **"Gizlilik?"** → Hesap yok; anonim cihaz kimliği; yalnızca yaklaşık konum
  (~110 m) ve senin paylaştığın bilgi herkese açık.
- **"Ölçeklenir mi?"** → Ağır harita kümeleme yok; mahalle/kaba konumla
  gruplama. Yeni il = yeni kanal kaydı, o kadar.
- **"Neden native uygulama değil?"** → İndirme yok, her telefonda anında açılır,
  hep güncel, canlı bir URL — yarışmanın istediği tam da bu.

## Bir şey ters giderse (yedek plan)
- Ağ takılırsa: okuma akışları (Mahalle Kaydı, kayıt detayı, yönlendirme) ayrı
  yükleniyor; en kötü ihtimalle boş durumlar "hata" değil "henüz kayıt yok"
  diye görünür — panik yok, tekrar dene.
- "Haritaya Ekle" gönderimi konum izni ister; demoda izni önceden ver ya da bu
  adımı anlatıp geç, okuma tarafı zaten dolu.
