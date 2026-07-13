import { Image } from 'expo-image';
import { Link, Stack } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import AdanaSkyline from '@/components/adana-skyline';
import Sivri from '@/components/sivri';
import { colors, fonts } from '@/lib/theme';

// "Sivri kim?" — the story behind the mascot: why an Adana app leans into the
// mosquito, and how the "writes, doesn't bite" idea maps onto what the product
// does. Copy stays warm and neutral — Sivri is a neighbourhood face, never an
// official emblem (same rule as the rest of the app).
export default function AboutSivri() {
  return (
    <>
      <Stack.Screen options={{ title: 'Sivri kim?' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Image
            source={{ uri: '/decor/sivri-hero.webp' }}
            style={styles.heroImage}
            contentFit="contain"
            accessibilityLabel="Sivri, kalemiyle deftere yazan sivrisinek; arkada Adana silüeti"
          />
        </View>
        <Text style={styles.heading} accessibilityRole="header">
          Sivri kim?
        </Text>
        <Text style={styles.lead}>
          Sivri, Mahalle Defteri'nin maskotu — ama sıradan bir çizim değil, Adana'ya ait küçük bir
          göz kırpma.
        </Text>

        <Text style={styles.subheading} accessibilityRole="header">
          Neden sivrisinek?
        </Text>
        <Text style={styles.body}>
          Adana denince akla gelen esprili simgelerden biri sivrisinektir. Şehrin sıcak ve nemli
          Çukurova iklimi, Seyhan boyunca uzanan sulak toprakları, sivrisineği yıllardır Adanalıların
          kendileriyle şakalaştığı tanıdık bir yerel karakter yaptı. Onu görmezden gelmek yerine
          sahiplenmek — gülümseyerek — çok daha Adana'ya yakışıyor.
        </Text>

        <Text style={styles.subheading} accessibilityRole="header">
          Isırmaz, yazar
        </Text>
        <Text style={styles.body}>
          Sivri'nin burnu bir kalem. Çünkü o ısırmıyor — kaydını tutuyor. Mahalle Defteri de tam
          bunu yapar: bir sorunu şikâyet olmaktan çıkarıp doğru resmi kapıya, yazılı ve takip
          edilebilir bir kayda dönüştürür. Rahatsız eden şeyi, çözülmesine yardımcı olan bir şeye
          çeviriyoruz.
        </Text>

        <Text style={styles.subheading} accessibilityRole="header">
          Sivri'nin halleri
        </Text>
        <View style={styles.moods}>
          <View style={styles.mood}>
            <Sivri size={78} mood="sleep" />
            <Text style={styles.moodText}>Liste boşken uyuklar</Text>
          </View>
          <View style={styles.mood}>
            <Sivri size={78} mood="happy" />
            <Text style={styles.moodText}>Kayıt eklenince sevinir</Text>
          </View>
          <View style={styles.mood}>
            <Sivri size={78} mood="idle" />
            <Text style={styles.moodText}>Yol boyunca eşlik eder</Text>
          </View>
        </View>

        <Text style={styles.subheading} accessibilityRole="header">
          Ne değil
        </Text>
        <Text style={styles.body}>
          Sivri sevimli, dost canlısı ve herkes için — korkutucu ya da gerçekçi değil. Mahalle
          Defteri gibi, resmi bir kurum simgesi de değil; mahallenin kendi defterinden bir yüz.
        </Text>

        <Link href="/how-it-works" style={styles.link}>
          Mahalle Defteri nedir, ne değildir? →
        </Link>

        <AdanaSkyline opacity={0.45} />
      </ScrollView>
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
  hero: { alignItems: 'center', paddingTop: 4 },
  heroImage: { width: '100%', maxWidth: 340, aspectRatio: 1 },
  heading: { fontFamily: fonts.sansSemiBold, fontSize: 26, color: colors.ink, textAlign: 'center' },
  lead: {
    fontFamily: fonts.sans,
    fontSize: 16,
    color: colors.inkMuted,
    lineHeight: 23,
    textAlign: 'center',
    marginBottom: 6,
  },
  subheading: { fontFamily: fonts.sansSemiBold, fontSize: 18, color: colors.ink, marginTop: 10 },
  body: { fontFamily: fonts.sans, fontSize: 16, color: colors.ink, lineHeight: 24 },
  moods: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 6,
  },
  mood: { flex: 1, alignItems: 'center', gap: 4 },
  moodText: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.inkMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
  link: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
    color: colors.petrol,
    paddingVertical: 14,
    minHeight: 44,
    marginTop: 4,
  },
});
