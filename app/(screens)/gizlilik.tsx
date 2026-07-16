import { Link, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { ADS_ENABLED, clearAdsConsent, getAdsConsent, subscribeAdsConsent } from '@/lib/ads';
import { colors, fonts } from '@/lib/theme';

// Gizlilik ve veriler — the KVKK aydınlatma page. Written to stay TRUE in both
// build states: the ad/cookie section only renders when the app is built with
// ads enabled (EXPO_PUBLIC_ADS=1), so an ads-off build never claims cookies it
// doesn't set, and an ads-on build carries the disclosure AdSense approval and
// KVKK both require. Everything else on this page holds regardless.
export default function Gizlilik() {
  return (
    <>
      <Stack.Screen options={{ title: 'Gizlilik' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.heading} accessibilityRole="header">
          Gizlilik ve veriler
        </Text>
        <Text style={styles.lead}>
          Mahalle Defteri hesap istemez, kimlik toplamaz. Bu sayfa nelerin cihazında kaldığını,
          nelerin herkese açık olduğunu ve hangi servislerin işin içinde olduğunu düz bir dille
          anlatır.
        </Text>

        <Text style={styles.subheading} accessibilityRole="header">
          Hesap yok, kimlik yok
        </Text>
        <Text style={styles.body}>
          Üyelik ve giriş yoktur; adın, telefonun ya da e-postan hiçbir adımda istenmez. Cihazına
          bir kez rastgele, anonim bir oturum kimliği yazılır — bunun tek işi aynı kaydı iki kez
          doğrulamanı engellemek ve hız limitlerini uygulamak. Kim olduğunla eşleştirilemez.
        </Text>

        <Text style={styles.subheading} accessibilityRole="header">
          Cihazında kalanlar
        </Text>
        <Text style={styles.body}>
          Tarayıcının yerel deposunda yalnızca şunlar tutulur: anonim oturum kimliği, görünüm
          tercihlerin (tema, kontrast, yazı boyutu, hareket azaltma), takip ettiğin kayıtların
          listesi{ADS_ENABLED ? ' ve reklam çerezi tercihin' : ''}. Bunların hiçbiri sunucuya
          gönderilmez; site verilerini temizlersen hepsi silinir.
        </Text>

        <Text style={styles.subheading} accessibilityRole="header">
          Herkese açık olanlar
        </Text>
        <Text style={styles.body}>
          Bir sorunu haritaya eklemeyi SEN seçersen, yalnızca şunlar herkese açık kayda girer:
          kategori, yazdığın açıklama, eklediğin fotoğraf, yaklaşık konum (~110 metreye
          yuvarlanır) ve mahalle adı. Bu bir topluluk defteridir — eklemeden önce açıklamada ve
          fotoğrafta başkalarının kişisel bilgisi olmamasına özen göster.
        </Text>

        <Text style={styles.subheading} accessibilityRole="header">
          Kullanılan servisler
        </Text>
        <Text style={styles.body}>
          Kayıtlar Supabase üzerinde barınan bir veritabanında tutulur; site Cloudflare üzerinden
          yayınlanır. Harita karoları ve adres arama OpenStreetMap servislerinden gelir — harita
          açıldığında ya da adres arattığında tarayıcın bu servislere doğrudan bağlanır (IP adresin
          bu bağlantılarda onlara görünür; adres kutusuna kişisel bilgi yazma). Bunların dışında
          analitik ya da takip aracı kullanılmaz.
        </Text>

        {ADS_ENABLED ? <AdsSection /> : null}

        <Text style={styles.subheading} accessibilityRole="header">
          Hakların
        </Text>
        <Text style={styles.body}>
          KVKK kapsamındaki haklarını kullanmak — örneğin haritaya eklediğin bir kaydın
          kaldırılmasını istemek — için kaydın altındaki "Bir sorun bildir" bağlantısını
          kullanabilirsin; bildirimler defterin yönetimi tarafından incelenir.
        </Text>

        <Link href="/how-it-works" style={styles.link}>
          Mahalle Defteri nedir, ne değildir? →
        </Link>
      </ScrollView>
    </>
  );
}

// Only compiled-in when the ad system is enabled at build time. Discloses the
// AdSense cookies and gives the KVKK-required easy withdrawal.
function AdsSection() {
  const [consent, setConsent] = useState(getAdsConsent);
  useEffect(() => subscribeAdsConsent(setConsent), []);

  return (
    <>
      <Text style={styles.subheading} accessibilityRole="header">
        Reklamlar ve çerezler
      </Text>
      <Text style={styles.body}>
        Barındırma masrafını karşılamak için bazı sayfalarda "REKLAM" etiketiyle işaretli Google
        AdSense reklamları gösterilebilir. Reklam çerezleri yalnızca sen açıkça izin verirsen
        kullanılır; izin vermezsen reklam kodu hiç yüklenmez. Şu anki tercihin:{' '}
        <Text style={styles.strong}>
          {consent === 'granted' ? 'izin verildi' : consent === 'denied' ? 'izin verilmedi' : 'henüz seçilmedi'}
        </Text>
        .
      </Text>
      <Pressable accessibilityRole="button" onPress={clearAdsConsent} style={styles.resetBtn}>
        <Text style={styles.resetText}>Reklam çerezi tercihini sıfırla</Text>
      </Pressable>
      <Text style={styles.fineprint}>
        Sıfırlayınca seçim ekranı yeniden görünür; iznini geri çekersen yüklenmiş reklamlar bir
        sonraki sayfa açılışında kaybolur.
      </Text>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  content: {
    padding: 20,
    gap: 10,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
    paddingBottom: 40,
  },
  heading: { fontFamily: fonts.sansSemiBold, fontSize: 24, color: colors.ink },
  lead: { fontFamily: fonts.sans, fontSize: 16, color: colors.inkMuted, lineHeight: 23 },
  subheading: { fontFamily: fonts.sansSemiBold, fontSize: 18, color: colors.ink, marginTop: 10 },
  body: { fontFamily: fonts.sans, fontSize: 16, color: colors.ink, lineHeight: 24 },
  strong: { fontFamily: fonts.sansSemiBold },
  resetBtn: {
    minHeight: 44,
    justifyContent: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1.5,
    borderColor: colors.ink,
    borderRadius: 6,
    paddingHorizontal: 14,
    marginTop: 4,
  },
  resetText: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.ink },
  fineprint: { fontFamily: fonts.sans, fontSize: 13, color: colors.inkMuted, lineHeight: 18 },
  link: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
    color: colors.petrol,
    paddingVertical: 14,
    minHeight: 44,
    marginTop: 4,
  },
});
