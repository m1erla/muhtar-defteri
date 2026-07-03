import { Link, Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import LedgerRow from '@/components/ledger-row';
import PrimaryButton from '@/components/primary-button';
import { fetchReports, type Report } from '@/lib/reports';
import { colors, fonts } from '@/lib/theme';

export default function Home() {
  const router = useRouter();
  const [recent, setRecent] = useState<Report[] | null>(null);

  // Home's preview stays quiet on failure (unconfigured DB, offline): an empty
  // ledger must look intentional, not broken (PRD §9) — errors surface on the
  // screens where the user is actually acting.
  useEffect(() => {
    let live = true;
    fetchReports({}, 4).then(
      (reports) => live && setRecent(reports),
      () => live && setRecent([])
    );
    return () => {
      live = false;
    };
  }, []);

  return (
    <>
      <Stack.Screen options={{ title: 'Dijital Muhtar' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.tagline}>
          Adana'daki bir sorunu doğru resmi kanala bildir — istersen mahallenin kaydına da ekle.
        </Text>

        <PrimaryButton label="Bir Sorun Bildir" onPress={() => router.push('/report-category')} />

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Son bildirilenler</Text>
            <Link href="/map-list" style={styles.sectionLink}>
              Tümü →
            </Link>
          </View>
          {recent === null ? null : recent.length === 0 ? (
            <Text style={styles.empty}>
              Henüz kayıt yok. İlk kaydı sen ekleyebilirsin — yukarıdan bir sorun bildir.
            </Text>
          ) : (
            recent.map((r) => (
              <LedgerRow
                key={r.id}
                report={r}
                onPress={() => router.push({ pathname: '/report-detail', params: { id: r.id } })}
              />
            ))
          )}
        </View>

        <Link href="/how-it-works" style={styles.footerLink}>
          Dijital Muhtar nedir, ne değildir?
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
    paddingVertical: 6,
  },
  empty: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.ink,
    opacity: 0.65,
    lineHeight: 21,
    paddingVertical: 8,
  },
  footerLink: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.petrol,
    textAlign: 'center',
    paddingVertical: 10,
  },
});
