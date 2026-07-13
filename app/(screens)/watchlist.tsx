import { Stack, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import LedgerRow from '@/components/ledger-row';
import LoadStateView from '@/components/load-state-view';
import Sivri from '@/components/sivri';
import { fetchReportsByIds, type Report } from '@/lib/reports';
import { friendlyDbError } from '@/lib/supabase';
import { colors, fonts } from '@/lib/theme';
import { useLoad } from '@/lib/use-load';
import { getWatchlist } from '@/lib/watchlist';

// Takip Ettiklerim — the device-local watchlist (no account). Lists the reports
// the resident chose to follow, newest-followed first, with live status so a
// returning visitor can see whether their issues moved. Focus-refetches so a
// confirm/resolve elsewhere is reflected on return.
export default function Watchlist() {
  const router = useRouter();
  const { state, reload } = useLoad<Report[]>(
    async () => {
      const ids = getWatchlist();
      const reports = await fetchReportsByIds(ids);
      const byId = new Map(reports.map((r) => [r.id, r]));
      // Preserve the saved order; a purged/expired report simply drops out.
      return ids.map((id) => byId.get(id)).filter((r): r is Report => !!r);
    },
    [],
    { refetchOnFocus: true, keepDataWhileReloading: true }
  );

  return (
    <>
      <Stack.Screen options={{ title: 'Takip Ettiklerim' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.heading} accessibilityRole="header">
          Takip Ettiklerim
        </Text>
        <Text style={styles.sub}>
          Bu liste yalnızca bu cihazda tutulur; hesap gerekmez. Bir kaydı açıp "Takip et" diyerek
          buraya ekleyebilirsin.
        </Text>

        {state.status === 'loading' ? <LoadStateView loading /> : null}
        {state.status === 'error' ? (
          <LoadStateView
            message={friendlyDbError(
              state.error,
              'Liste yüklenemedi. Bağlantını kontrol edip tekrar dene.'
            )}
            onRetry={reload}
          />
        ) : null}

        {state.status === 'ready' && state.data.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Sivri size={100} mood="sleep" />
            <LoadStateView message="Henüz takip ettiğin kayıt yok. Mahalle kaydından bir sorunu açıp takip edebilirsin." />
          </View>
        ) : null}

        {state.status === 'ready' && state.data.length > 0 ? (
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
  heading: { fontFamily: fonts.sansSemiBold, fontSize: 24, color: colors.ink, marginTop: 8 },
  sub: { fontFamily: fonts.sans, fontSize: 15, color: colors.inkMuted, lineHeight: 22 },
  emptyWrap: { alignItems: 'center', gap: 6, paddingTop: 16 },
  ledgerFrame: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.ink,
    marginTop: 6,
  },
});
