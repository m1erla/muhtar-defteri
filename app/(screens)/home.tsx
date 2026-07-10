import { Link, Stack, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import LedgerRow from '@/components/ledger-row';
import PrimaryButton from '@/components/primary-button';
import { fetchReports } from '@/lib/reports';
import { colors, fonts } from '@/lib/theme';
import { useLoad } from '@/lib/use-load';

export default function Home() {
  const router = useRouter();

  // Focus refetch so a just-submitted report shows up when the user returns.
  // The ⟳ repeat badge is intentionally NOT shown here: this is a 4-row preview,
  // so a same-spot count computed over it would under-count and mislead — the
  // density signal lives on map-list, which loads the full set.
  const { state, reload } = useLoad(() => fetchReports({}, 4), [], {
    refetchOnFocus: true,
    keepDataWhileReloading: true,
  });

  return (
    <>
      <Stack.Screen options={{ title: 'Mahalle Defteri' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.tagline}>
          Adana'daki bir sorunu doğru resmi kanala bildir — istersen mahallenin kaydına da ekle.
        </Text>

        <PrimaryButton label="Bir Sorun Bildir" onPress={() => router.push('/report-category')} />

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Son bildirilenler</Text>
            <Link href="/map-list" style={styles.sectionLink}>
              Mahalle Kaydı →
            </Link>
          </View>

          {state.status === 'error' ? (
            // A failed load must not read as "no reports" — that would misrepresent
            // the transparency map on its own landing page.
            <Pressable accessibilityRole="button" onPress={reload} style={styles.notice}>
              <Text style={styles.noticeText}>Kayıtlar yüklenemedi. Dokunup tekrar dene.</Text>
            </Pressable>
          ) : state.status === 'ready' && state.data.length === 0 ? (
            <Text style={styles.empty}>
              Henüz kayıt yok. İlk kaydı sen ekleyebilirsin — yukarıdan bir sorun bildir.
            </Text>
          ) : state.status === 'ready' ? (
            <View style={styles.ledgerFrame}>
              {state.data.map((r) => (
                <LedgerRow
                  key={r.id}
                  report={r}
                  onPress={() => router.push({ pathname: '/report-detail', params: { id: r.id } })}
                />
              ))}
            </View>
          ) : null}
        </View>

        <Link href="/how-it-works" style={styles.footerLink}>
          Mahalle Defteri nedir, ne değildir?
        </Link>
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
    gap: 18,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
    paddingBottom: 40,
  },
  tagline: {
    fontFamily: fonts.sans,
    fontSize: 16,
    color: colors.ink,
    lineHeight: 23,
    marginTop: 8,
  },
  section: {
    marginTop: 8,
    gap: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sectionTitle: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 17,
    color: colors.ink,
  },
  sectionLink: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: colors.petrol,
    paddingVertical: 14,
    minHeight: 44,
  },
  ledgerFrame: {
    // Close the top of the ledger so the preview reads as a bounded page of
    // entries, not floating rows (the one place FRONTEND.md says to spend the
    // visual budget). Each row already draws its own bottom rule.
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.ink,
  },
  empty: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.inkMuted,
    lineHeight: 21,
    paddingVertical: 8,
  },
  notice: {
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: 'center',
  },
  noticeText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.inkMuted,
    lineHeight: 21,
  },
  footerLink: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.petrol,
    textAlign: 'center',
    paddingVertical: 14,
    minHeight: 44,
  },
});
