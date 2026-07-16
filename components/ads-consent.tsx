import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ADS_ENABLED, ADSENSE_CLIENT, getAdsConsent, setAdsConsent, subscribeAdsConsent } from '@/lib/ads';
import { colors, fonts } from '@/lib/theme';

// KVKK ad-cookie consent — DORMANT with the rest of the ad system (renders
// nothing unless EXPO_PUBLIC_ADS=1). KVKK's cookie guideline requires prior
// explicit opt-in for advertising cookies, with decline as prominent as accept
// and no consent-by-scrolling — hence two equal buttons and nothing loading
// until a choice is made. Decline = no ad script at all (the clean reading),
// remembered per device like every other preference here.
//
// Same hook-safety split as AdSlot: the export is a hook-free gate on the
// build-time flag; hooks live in the inner component.

export default function AdsConsent() {
  if (!ADS_ENABLED || !ADSENSE_CLIENT) return null;
  return <AdsConsentBanner />;
}

function AdsConsentBanner() {
  const [consent, setConsent] = useState(getAdsConsent);
  const router = useRouter();
  useEffect(() => subscribeAdsConsent(setConsent), []);

  if (consent !== null) return null;

  return (
    <View style={styles.banner} accessibilityRole="alert">
      <Text style={styles.text}>
        Mahalle Defteri'nin barındırma masrafı için reklam gösterebiliriz. Bunun için reklam
        çerezlerine iznin gerekiyor; istemezsen hiçbir reklam çerezi kullanılmaz.{' '}
        <Text
          accessibilityRole="link"
          onPress={() => router.navigate('/gizlilik')}
          style={styles.detailLink}
        >
          Ayrıntılar: Gizlilik ve veriler
        </Text>
      </Text>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          onPress={() => setAdsConsent('denied')}
          style={styles.btn}
        >
          <Text style={styles.btnText}>İstemiyorum</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => setAdsConsent('granted')}
          style={[styles.btn, styles.btnPrimary]}
        >
          <Text style={[styles.btnText, styles.btnPrimaryText]}>İzin ver</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    width: '94%',
    maxWidth: 560,
    backgroundColor: colors.paper,
    borderWidth: 1.5,
    borderColor: colors.ink,
    borderRadius: 8,
    padding: 14,
    gap: 10,
    // Above screen content, below nothing else — there are no other overlays.
    zIndex: 10,
  },
  text: { fontFamily: fonts.sans, fontSize: 14, color: colors.ink, lineHeight: 20 },
  detailLink: { fontFamily: fonts.sansSemiBold, color: colors.petrol },
  row: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end' },
  btn: {
    minHeight: 44,
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.ink,
    borderRadius: 6,
  },
  btnPrimary: { backgroundColor: colors.petrol, borderColor: colors.petrol },
  btnText: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.ink },
  btnPrimaryText: { color: colors.paper },
});
