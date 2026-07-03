import { Stack } from 'expo-router';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { colors, fonts } from '@/lib/theme';

// This screen has one job (PRD §8): say plainly what this is and isn't.
// TRT rule + CLAUDE.md: never read as an official government channel.
export default function HowItWorks() {
  return (
    <>
      <Stack.Screen options={{ title: 'Nasıl Çalışır?' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Dijital Muhtar nedir, ne değildir?</Text>

        <Text style={styles.subheading}>Nedir</Text>
        <Text style={styles.body}>
          Dijital Muhtar, Adana'daki yerel bir sorunu hangi resmi kanala bildirmen gerektiğini
          gösteren, topluluk temelli bir yönlendirme aracıdır. Sorunun türünü seçersin; sana doğru
          telefon numarasını, formu ve yanına alman gerekenleri söyler.
        </Text>
        <Text style={styles.body}>
          İstersen sorunu herkese açık mahalle kaydına da ekleyebilirsin. Böylece aynı sorunun kaç
          kez bildirildiği ve çözülüp çözülmediği herkes için görünür olur.
        </Text>

        <Text style={styles.subheading}>Ne değildir</Text>
        <Text style={styles.body}>
          Dijital Muhtar resmi bir devlet ya da belediye kanalı değildir. Buraya eklediğin kayıt,
          resmi bir başvuru yerine geçmez — sorunun çözülmesi için yönlendirdiğimiz resmi kanalı
          kullanman gerekir.
        </Text>
        <Text style={styles.body}>
          Hiçbir sorunun çözüleceğini garanti etmez. Verdiği söz, doğru yönlendirme ve görünürlüktür:
          neyin, nerede, ne zamandır beklediğini kayıt altına alır.
        </Text>

        <Text style={styles.subheading}>Gizlilik</Text>
        <Text style={styles.body}>
          Hesap ve üyelik yoktur. Haritaya eklediğin kayıtta yalnızca seçtiğin kategori, yazdığın
          açıklama, eklediğin fotoğraf ve yaklaşık konum herkese açık görünür. Adın, numaran ya da
          kimliğin istenmez ve saklanmaz.
        </Text>

        <Text style={styles.subheading}>Yönlendirdiği kanallar</Text>
        <Text style={styles.body}>
          ALO 153 (Adana Büyükşehir Çağrı Merkezi), Adana e-Belediye şikayet formu, 112 Acil Çağrı
          Merkezi ve 112 Online İhbar, Alo 181 (Çevre Bakanlığı) ve CİMER. Bu kanalların hiçbiriyle
          resmi bir bağı yoktur; yalnızca doğru kapıyı gösterir.
        </Text>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
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
    marginTop: 10,
  },
  body: {
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.ink,
    lineHeight: 23,
  },
});
