import { Image } from 'expo-image';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import LoadStateView from '@/components/load-state-view';
import OutlineButton from '@/components/outline-button';
import StatusStamp from '@/components/status-stamp';
import { getCategory } from '@/lib/categories';
import { businessDaysSince, daysAgoLabel, RESPONSE_BENCHMARK_DAYS } from '@/lib/format';
import {
  confirmationCount,
  confirmReport,
  fetchMyConfirmation,
  fetchReport,
  fetchSameSpotCount,
  type ConfirmationType,
  type Report,
} from '@/lib/reports';
import { friendlyDbError } from '@/lib/supabase';
import { colors, fonts } from '@/lib/theme';
import { useLoad } from '@/lib/use-load';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type DetailData = { report: Report | null; mine: ConfirmationType | null; sameSpot: number };

export default function ReportDetail() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const raw = Array.isArray(params.id) ? params.id[0] : params.id;
  // A malformed id (truncated share link) must land on "not found", not on a
  // retry loop against a Postgres uuid parse error.
  const id = raw && UUID_RE.test(raw) ? raw : null;

  const { state, reload, mutate } = useLoad<DetailData>(
    async () => {
      if (!id) return { report: null, mine: null, sameSpot: 0 };
      const report = await fetchReport(id);
      if (!report) return { report: null, mine: null, sameSpot: 0 };
      const [mine, sameSpot] = await Promise.all([
        fetchMyConfirmation(id),
        fetchSameSpotCount(report),
      ]);
      return { report, mine, sameSpot };
    },
    [id],
    // Keep the report on screen if the post-confirm reload fails (offline is the
    // common confirm-failure mode), so the "Kaydedilemedi" message stays visible
    // instead of the whole report collapsing to a load-error view.
    { keepDataWhileReloading: true }
  );

  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const confirm = async (type: ConfirmationType) => {
    if (state.status !== 'ready' || !state.data.report || confirming) return;
    const report = state.data.report;
    setConfirming(true);
    setConfirmError(null);
    try {
      const recorded = await confirmReport(report.id, type);
      if (recorded) {
        // The result is fully known locally — no round-trips, no spinner flash.
        mutate({
          report: {
            ...report,
            status: type === 'resolved' ? 'resolved' : report.status,
            confirmations: [{ count: confirmationCount(report) + 1 }],
          },
          mine: type,
          sameSpot: state.data.sameSpot,
        });
      } else {
        // This session had already confirmed (e.g. a second tab); nothing changed
        // in the DB, so refetch the true state instead of an optimistic guess
        // that could show "resolved" while the row is still open.
        reload();
      }
    } catch (err) {
      setConfirmError(friendlyDbError(err, 'Kaydedilemedi. Bağlantını kontrol edip tekrar dene.'));
      // The insert may have committed even though the call failed — refetch so
      // the buttons hide if it did, instead of inviting a duplicate retry.
      reload();
    } finally {
      setConfirming(false);
    }
  };

  const ready = state.status === 'ready' ? state.data : null;

  return (
    <>
      <Stack.Screen options={{ title: 'Bildirim' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {state.status === 'loading' ? <LoadStateView loading /> : null}

        {state.status === 'error' ? (
          <LoadStateView
            message={friendlyDbError(
              state.error,
              'Kayıt yüklenemedi. Bağlantını kontrol edip tekrar dene.'
            )}
            onRetry={reload}
          />
        ) : null}

        {ready && !ready.report ? <LoadStateView message="Bu kayıt bulunamadı." /> : null}

        {ready?.report ? (
          <>
            <View style={styles.headerRow}>
              <StatusStamp status={ready.report.status} size="large" />
              <Text style={styles.category}>
                {getCategory(ready.report.category)?.emoji}{' '}
                {getCategory(ready.report.category)?.label}
              </Text>
            </View>

            <Text style={styles.place}>{ready.report.neighborhood ?? 'Adana'}</Text>

            {ready.report.description ? (
              <Text style={styles.description}>{ready.report.description}</Text>
            ) : null}

            {ready.report.photo_url ? (
              <Image
                source={{ uri: ready.report.photo_url }}
                style={styles.photo}
                contentFit="cover"
                accessibilityLabel="Bildirilen sorunun fotoğrafı"
              />
            ) : null}

            <View style={styles.ledgerBlock}>
              <Text style={styles.mono}>
                İlk bildirilme: {daysAgoLabel(ready.report.created_at)}
              </Text>
              <Text style={styles.mono}>{confirmationCount(ready.report)} kişi bunu doğruladı</Text>
              {ready.sameSpot > 1 ? (
                <Text style={styles.mono}>Bu noktada {ready.sameSpot} kayıt var</Text>
              ) : null}
              {ready.report.status === 'open'
                ? (() => {
                    // Adana Büyükşehir's stated response window as the "past due"
                    // benchmark (PRD §11). A benchmark, not a guarantee.
                    const bd = businessDaysSince(ready.report.created_at);
                    const overdue = bd > RESPONSE_BENCHMARK_DAYS;
                    return (
                      <Text style={[styles.mono, overdue && styles.overdue]}>
                        {overdue
                          ? `Belediyenin ${RESPONSE_BENCHMARK_DAYS} iş günü yanıt süresi ölçütü aşıldı — ${bd} iş günü geçti`
                          : `Belediye yanıt süresi ölçütü: ${RESPONSE_BENCHMARK_DAYS} iş günü (${bd} iş günü geçti)`}
                      </Text>
                    );
                  })()
                : null}
            </View>

            {confirmError ? <Text style={styles.error}>{confirmError}</Text> : null}

            {ready.mine ? (
              <Text style={styles.confirmedNote}>
                {ready.mine === 'resolved'
                  ? 'Bu kaydı "düzeldi" olarak işaretledin ✓'
                  : 'Bu kaydı doğruladın ✓'}
              </Text>
            ) : (
              <View style={styles.actions}>
                <OutlineButton
                  label="Ben de Gördüm"
                  color={colors.terracottaText}
                  disabled={confirming}
                  onPress={() => confirm('still_open')}
                />
                <OutlineButton
                  label="Bu Düzeldi"
                  color={colors.mossText}
                  disabled={confirming}
                  onPress={() => confirm('resolved')}
                />
              </View>
            )}
          </>
        ) : null}
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
    gap: 14,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  category: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 17,
    color: colors.ink,
  },
  place: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 22,
    color: colors.ink,
  },
  description: {
    fontFamily: fonts.sans,
    fontSize: 16,
    color: colors.ink,
    lineHeight: 23,
  },
  photo: {
    width: '100%',
    height: 240,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.ink,
  },
  ledgerBlock: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.ink,
    paddingVertical: 12,
    gap: 6,
  },
  mono: {
    fontFamily: fonts.mono,
    fontSize: 14,
    color: colors.ink,
  },
  overdue: {
    fontFamily: fonts.monoMedium,
    color: colors.terracottaText,
  },
  actions: {
    gap: 10,
  },
  confirmedNote: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
    color: colors.mossText,
    textAlign: 'center',
    paddingVertical: 8,
  },
  error: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.terracottaText,
  },
});
