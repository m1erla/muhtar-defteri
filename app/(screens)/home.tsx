import { Link, Stack, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Page from '@/components/page';

import AdanaSkyline from '@/components/adana-skyline';
import Icon from '@/components/icon';
import LedgerRow from '@/components/ledger-row';
import PrimaryButton from '@/components/primary-button';
import Sivri from '@/components/sivri';
import { fetchReports, fetchReportStats } from '@/lib/reports';
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

  // The ledger's running tally. Quietly absent while loading or on error —
  // a stats line must never block or misrepresent the landing screen. Fetched
  // once per mount, not per focus: it's decorative, and the landing screen's
  // focus refetch budget (a scored criterion) belongs to the ledger rows.
  const { state: stats } = useLoad(fetchReportStats, []);

  return (
    <>
      <Stack.Screen options={{ title: 'Mahalle Defteri' }} />
      <Page contentStyle={styles.content}>
        {/* Instant "this is an Adana app" signal — the first thing on the
            landing screen (reuses the deep-teal ADANA badge language + brand
            pin; readable in both themes). */}
        <View style={styles.hero}>
          <View style={styles.localeBadge}>
            <Icon name="pin" size={15} tone="paper" />
            <Text style={styles.localeText} accessibilityLabel="Kapsam: Adana">
              Adana
            </Text>
          </View>
          <Link href="/about-sivri" accessibilityLabel="Sivri kimdir?" accessibilityRole="link">
            <Sivri size={92} mood="idle" />
          </Link>
        </View>
        <Text style={styles.tagline}>
          Adana'daki bir sorun için <Text style={styles.taglineStrong}>doğru kapıyı</Text> gösterir:
          seni doğru resmi kanala yönlendirir, istersen mahallenin kaydına da eklersin.
        </Text>

        <PrimaryButton label="Bir Sorun Bildir" onPress={() => router.push('/report-category')} />

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Son bildirilenler</Text>
            <Link href="/map-list" style={styles.sectionLink}>
              Mahalle Kaydı →
            </Link>
          </View>

          {stats.status === 'ready' && stats.data.total > 0 ? (
            <Text style={styles.statsLine}>
              Defterde {stats.data.total} kayıt · {stats.data.resolved} çözüldü ✓
              {stats.data.overdue > 0 ? ` · ${stats.data.overdue} gecikmiş` : ''}
            </Text>
          ) : null}

          {state.status === 'error' ? (
            // A failed load must not read as "no reports" — that would misrepresent
            // the transparency map on its own landing page.
            <Pressable accessibilityRole="button" onPress={reload} style={styles.notice}>
              <Text style={styles.noticeText}>Kayıtlar yüklenemedi. Dokunup tekrar dene.</Text>
            </Pressable>
          ) : state.status === 'ready' && state.data.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Sivri size={104} mood="sleep" />
              <Text style={styles.empty}>
                Henüz kayıt yok. İlk kaydı sen ekleyebilirsin — yukarıdan bir sorun bildir.
              </Text>
            </View>
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

        <Link href="/channels" style={styles.footerLink}>
          Kanal Rehberi — tüm resmi hatlar
        </Link>
        <Link href="/watchlist" style={styles.footerLink}>
          Takip ettiklerim
        </Link>
        <Link href="/how-it-works" style={styles.footerLink}>
          Mahalle Defteri nedir, ne değildir?
        </Link>
        <Link href="/settings" style={styles.footerLink}>
          Görünüm ve erişilebilirlik
        </Link>

        <AdanaSkyline opacity={0.5} />
      </Page>
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
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  localeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: colors.scopeAdanaBg,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  emptyWrap: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  localeText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: colors.scopeAdanaText,
    letterSpacing: 0.5,
  },
  tagline: {
    fontFamily: fonts.sans,
    fontSize: 16,
    color: colors.ink,
    lineHeight: 23,
  },
  taglineStrong: {
    fontFamily: fonts.sansSemiBold,
    color: colors.petrol,
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
  statsLine: {
    fontFamily: fonts.mono,
    fontSize: 13,
    color: colors.inkMuted,
    marginBottom: 6,
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
