import { Link, Stack } from 'expo-router';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import AdSlot from '@/components/ad-slot';
import AdanaSkyline from '@/components/adana-skyline';
import Disclosure from '@/components/disclosure';
import Sivri from '@/components/sivri';
import StatusStamp from '@/components/status-stamp';
import { colors, fonts } from '@/lib/theme';

// The guide screen (PRD §8). Its first job is unchanged: say plainly what this
// is and isn't (TRT rule + CLAUDE.md: never read as an official government
// channel). Around that core it now carries the full user guide — quick start,
// the ledger-mark legend, FAQ, troubleshooting and per-need tips — written in
// plain Turkish for every age, no jargon.

function Step({ n, children }: { n: string; children: ReactNode }) {
  return (
    <View style={styles.stepRow}>
      <Text style={styles.stepNumber}>{n}</Text>
      <Text style={styles.stepText}>{children}</Text>
    </View>
  );
}

function LegendRow({ mark, children }: { mark: ReactNode; children: ReactNode }) {
  return (
    <View style={styles.legendRow}>
      <View style={styles.legendMark}>{mark}</View>
      <Text style={styles.legendText}>{children}</Text>
    </View>
  );
}

export default function HowItWorks() {
  return (
    <>
      <Stack.Screen options={{ title: 'Nasıl Çalışır?' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.introMascot}>
          <Sivri size={112} mood="idle" />
          <Link href="/about-sivri" style={styles.sivriLink}>
            Bu sivrisinek kim? — Sivri'yi tanı →
          </Link>
        </View>
        <Text style={styles.heading} accessibilityRole="header">
          Mahalle Defteri nedir, ne değildir?
        </Text>

        <Text style={styles.subheading} accessibilityRole="header">
          Üç adımda kullan
        </Text>
        <Step n="1">
          Sorunun türünü seç — çöp, hatalı park, kaldırım, aydınlatma, su arızası, gürültü ve daha
          fazlası.
        </Step>
        <Step n="2">İstersen fotoğraf ve konum ekle. Hiçbiri zorunlu değil.</Step>
        <Step n="3">
          Doğru resmi kanalı gör: numarayı tek dokunuşla ara ya da formu aç. İstersen sorunu
          herkese açık mahalle kaydına da ekle.
        </Step>

        <Text style={styles.subheading} accessibilityRole="header">
          Nedir
        </Text>
        <Text style={styles.body}>
          Mahalle Defteri, Adana'daki yerel bir sorunu hangi resmi kanala bildirmen gerektiğini
          gösteren, topluluk temelli bir yönlendirme aracıdır. Sorunun türünü seçersin; sana doğru
          telefon numarasını, formu ve yanına alman gerekenleri söyler.
        </Text>
        <Text style={styles.body}>
          İstersen sorunu herkese açık mahalle kaydına da ekleyebilirsin. Böylece aynı sorunun kaç
          kez bildirildiği ve çözülüp çözülmediği herkes için görünür olur.
        </Text>

        <Text style={styles.subheading} accessibilityRole="header">
          Ne değildir
        </Text>
        <Text style={styles.body}>
          Mahalle Defteri resmi bir devlet ya da belediye kanalı değildir. Buraya eklediğin kayıt,
          resmi bir başvuru yerine geçmez — sorunun çözülmesi için yönlendirdiğimiz resmi kanalı
          kullanman gerekir.
        </Text>
        <Text style={styles.body}>
          Hiçbir sorunun çözüleceğini garanti etmez. Verdiği söz, doğru yönlendirme ve görünürlüktür:
          neyin, nerede, ne zamandır beklediğini kayıt altına alır.
        </Text>

        <Text style={styles.subheading} accessibilityRole="header">
          Defterdeki işaretler ne anlama geliyor?
        </Text>
        <LegendRow mark={<StatusStamp status="open" />}>Sorun bildirilmiş, hâlâ bekliyor.</LegendRow>
        <LegendRow mark={<StatusStamp status="resolved" />}>
          Topluluk bu sorunu "düzeldi" olarak işaretlemiş.
        </LegendRow>
        <LegendRow mark={<Text style={styles.legendGlyph}>⟳3</Text>}>
          Aynı noktadan üç kez bildirilmiş — tekrarlayan bir sorun.
        </LegendRow>
        <LegendRow mark={<Text style={styles.legendGlyph}>×2</Text>}>
          İki kişi kaydı doğrulamış ("Ben de Gördüm" ya da "Bu Düzeldi").
        </LegendRow>
        <LegendRow mark={<Text style={styles.legendGlyphOverdue}>gecikmiş</Text>}>
          Belediyenin 15 iş günü yanıt süresi ölçütü aşılmış.
        </LegendRow>

        <Text style={styles.subheading} accessibilityRole="header">
          Sık sorulanlar
        </Text>
        <View>
          <Disclosure title="Bu resmi bir uygulama mı?">
            <Text style={styles.body}>
              Hayır. Mahalle Defteri resmi bir devlet ya da belediye kanalı değildir ve öyle
              görünmeye çalışmaz. İşi, seni doğru resmi kanala yönlendirmek ve mahallenin kaydını
              herkese açık tutmaktır.
            </Text>
          </Disclosure>
          <Disclosure title="Kayıtlar güvenilir mi? Kötüye kullanılamaz mı?">
            <Text style={styles.body}>
              Kanal listesi resmi kaynaklardan doğrulandı (adana.bel.tr, adana-aski.gov.tr,
              toroslaredas.com.tr, cimer.gov.tr, alo181.gov.tr, ihbar.ng112.gov.tr). Kayıtlar
              topluluktan gelir; tarih bilgisini sunucu belirler. Aynı cihaz bir kaydı bir kez
              doğrulayabilir ve cihaz başına hız limitleri var. Hesap olmadığı için bu sınırlar
              kesin bir kimlik garantisi değildir — kötüye kullanım fark edilirse kayıtlar site
              yönetimi tarafından temizlenir.
            </Text>
          </Disclosure>
          <Disclosure title="Kimliğim görünür mü?">
            <Text style={styles.body}>
              Hayır. Hesap ve üyelik yoktur; adın, numaran ya da kimliğin istenmez. Haritaya
              eklediğin kayıtta yalnızca seçtiğin kategori, yazdığın açıklama, eklediğin fotoğraf
              ve yaklaşık konum (yaklaşık 110 metre) herkese açık görünür.
            </Text>
          </Disclosure>
          <Disclosure title="Fotoğraf ya da konum eklemek zorunda mıyım?">
            <Text style={styles.body}>
              Hayır. Her alan opsiyoneldir — sadece sorunun türünü seçip devam edebilirsin. Fotoğraf
              ve konum, sorunun anlaşılmasını kolaylaştırır ama hiçbiri şart değil.
            </Text>
          </Disclosure>
          <Disclosure title="Bildirdiğim sorun çözülmezse ne olur?">
            <Text style={styles.body}>
              Çözüm her zaman resmi kanaldan gelir; Mahalle Defteri süreci görünür kılar. Kayıt açık
              kaldıkça kaç gündür beklediği herkes tarafından görülür. Sorun giderildiğinde "Bu
              Düzeldi" ile kapatılabilir.
            </Text>
          </Disclosure>
        </View>

        <Text style={styles.subheading} accessibilityRole="header">
          Sorun mu yaşıyorsun?
        </Text>
        <View>
          <Disclosure title="Fotoğraf seçilmiyor">
            <Text style={styles.body}>
              Tarayıcılar dosya seçiciyi yalnızca butona doğrudan dokunulduğunda açar. "Fotoğraf
              Ekle" butonuna tekrar dokun; hâlâ açılmıyorsa tarayıcının dosya erişim iznini kontrol
              et.
            </Text>
          </Disclosure>
          <Disclosure title="Konumum bulunamıyor">
            <Text style={styles.body}>
              Tarayıcı izin istediğinde "İzin ver" de. İzin vermek istemiyorsan sorun değil —
              haritadaki pini elle sürükleyerek de konumu ayarlayabilirsin.
            </Text>
          </Disclosure>
          <Disclosure title="Liste ya da harita boş görünüyor">
            <Text style={styles.body}>
              Bağlantı yavaş olabilir — "Tekrar dene" bağlantısına dokun. Henüz kayıt yoksa bu bir
              hata değildir; ilk kaydı sen ekleyebilirsin.
            </Text>
          </Disclosure>
        </View>

        <Text style={styles.subheading} accessibilityRole="header">
          Sana göre ipuçları
        </Text>
        <View>
          <Disclosure title="İlk kez mi geldin?">
            <Text style={styles.body}>
              Ana ekrandan "Bir Sorun Bildir" ile başla. Üç adım sürer, hiçbir alan zorunlu değil,
              hesap istemez. Yanlış bir şey seçersen geri dönüp değiştirebilirsin.
            </Text>
          </Disclosure>
          <Disclosure title="Telefonla aramayı mı tercih ediyorsun?">
            <Text style={styles.body}>
              Yönlendirme sonucundaki numaraya dokunman yeterli — telefonun arama ekranı açılır.
              "Yanına al" listesi, aramada soracakları bilgileri önceden hazırlamana yardım eder.
            </Text>
          </Disclosure>
          <Disclosure title="Küçük yazıları okumak zor geliyorsa">
            <Text style={styles.body}>
              Ana sayfadaki "Görünüm ve erişilebilirlik" bölümünden yazı boyutunu büyütebilir, koyu
              temayı ya da yüksek kontrastı açabilirsin — ayarların bu cihazda hatırlanır.
              Telefonunun kendi yakınlaştırma ayarları da burada çalışır; tüm butonlar büyük ve
              etiketlidir, uygulama ekran okuyucularla da kullanılır.
            </Text>
          </Disclosure>
          <Disclosure title="Acelen mi var?">
            <Text style={styles.body}>
              Fotoğrafı ve açıklamayı atla: sadece sorunun türünü seç, "Devam Et" de. Doğru kanal
              yarım dakikada ekranında.
            </Text>
          </Disclosure>
        </View>

        <Text style={styles.subheading} accessibilityRole="header">
          Gizlilik
        </Text>
        <Text style={styles.body}>
          Hesap ve üyelik yoktur. Haritaya eklediğin kayıtta yalnızca seçtiğin kategori, yazdığın
          açıklama, eklediğin fotoğraf ve yaklaşık konum herkese açık görünür. Adın, numaran ya da
          kimliğin istenmez ve saklanmaz.
        </Text>
        <Text style={styles.body}>
          Konum için adres arattığında, yazdığın metin koordinatı bulmak üzere harita servisine
          (OpenStreetMap) gönderilir. Bu yüzden arama kutusuna kişisel bilgi değil, adres/mahalle
          bilgisi yazman yeterli.
        </Text>

        <Text style={styles.subheading} accessibilityRole="header">
          Yönlendirdiği kanallar
        </Text>
        <Text style={styles.body}>
          ALO 153 (Adana Büyükşehir Çağrı Merkezi), Adana e-Belediye şikayet formu, ASKİ Alo 185,
          Toroslar EDAŞ 186, 112 Acil Çağrı Merkezi ve 112 Online İhbar, Alo 181 (Çevre Bakanlığı)
          ve CİMER. Bu kanalların hiçbiriyle resmi bir bağı yoktur; yalnızca doğru kapıyı gösterir.
        </Text>
        <Link href="/channels" style={styles.directoryLink}>
          Kanal Rehberi'ni aç — tüm hatlar tek sayfada →
        </Link>

        {/* Dormant ad slot (null unless EXPO_PUBLIC_ADS=1) — end of the guide,
            the only article-shaped page with real dwell time. Kept BELOW the
            channel-list paragraph and directory link: an ad among official
            numbers would read as a paid listing (OPERATIONS.md § Reklamlar). */}
        <AdSlot format="rect" />

        <AdanaSkyline opacity={0.45} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  introMascot: {
    alignItems: 'center',
    paddingTop: 4,
    gap: 2,
  },
  sivriLink: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: colors.petrol,
    paddingVertical: 8,
    textAlign: 'center',
  },
  content: {
    padding: 20,
    gap: 10,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
    paddingBottom: 40,
  },
  heading: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 24,
    color: colors.ink,
    marginTop: 8,
    marginBottom: 6,
  },
  subheading: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 17,
    color: colors.ink,
    marginTop: 14,
  },
  body: {
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.ink,
    lineHeight: 23,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  stepNumber: {
    fontFamily: fonts.monoMedium,
    fontSize: 15,
    color: colors.petrol,
    lineHeight: 23,
    width: 18,
    textAlign: 'center',
  },
  stepText: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.ink,
    lineHeight: 23,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 32,
  },
  legendMark: {
    width: 92,
    alignItems: 'flex-start',
  },
  legendGlyph: {
    fontFamily: fonts.monoMedium,
    fontSize: 14,
    color: colors.petrol,
  },
  legendGlyphOverdue: {
    fontFamily: fonts.monoMedium,
    fontSize: 13,
    color: colors.terracottaText,
  },
  legendText: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.ink,
    lineHeight: 21,
  },
  directoryLink: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: colors.petrol,
    paddingVertical: 12,
    minHeight: 44,
  },
});
