import { Image } from 'expo-image';
import { Link, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import AdSlot from '@/components/ad-slot';
import CategoryMark from '@/components/category-mark';
import FlagForm from '@/components/flag-form';
import LoadStateView from '@/components/load-state-view';
import OutlineButton from '@/components/outline-button';
import StatusStamp from '@/components/status-stamp';
import { getCategory } from '@/lib/categories';
import { useLazyMap } from '@/lib/use-lazy-map';
import { isWatched, toggleWatch } from '@/lib/watchlist';
import {
  businessDaysSince,
  calendarDaysSince,
  daysAgoLabel,
  RESPONSE_BENCHMARK_DAYS,
  STALE_DAYS,
} from '@/lib/format';
import {
  confirmationCount,
  confirmReport,
  fetchLastConfirmation,
  fetchMyConfirmation,
  fetchReport,
  fetchSameSpotCount,
  isOverdue,
  isReportId,
  type ConfirmationType,
  type Report,
} from '@/lib/reports';
import { friendlyDbError } from '@/lib/supabase';
import { colors, fonts } from '@/lib/theme';
import { useLoad } from '@/lib/use-load';

type DetailData = {
  report: Report | null;
  mine: ConfirmationType | null;
  sameSpot: number;
  lastVerifiedAt: string | null; // newest confirmation, or null if never verified
};

export default function ReportDetail() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const raw = Array.isArray(params.id) ? params.id[0] : params.id;
  // A malformed id (truncated share link) must land on "not found", not on a
  // retry loop against a Postgres uuid parse error.
  const id = isReportId(raw) ? raw : null;

  const { state, reload, mutate } = useLoad<DetailData>(
    async () => {
      if (!id) return { report: null, mine: null, sameSpot: 0, lastVerifiedAt: null };
      const report = await fetchReport(id);
      if (!report) return { report: null, mine: null, sameSpot: 0, lastVerifiedAt: null };
      const [mine, sameSpot, lastVerifiedAt] = await Promise.all([
        fetchMyConfirmation(id),
        fetchSameSpotCount(report),
        fetchLastConfirmation(id),
      ]);
      return { report, mine, sameSpot, lastVerifiedAt };
    },
    [id],
    // Keep the report on screen if the post-confirm reload fails (offline is the
    // common confirm-failure mode), so the "Kaydedilemedi" message stays visible
    // instead of the whole report collapsing to a load-error view.
    { keepDataWhileReloading: true }
  );

  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [shared, setShared] = useState(false);
  const [flagOpen, setFlagOpen] = useState(false);
  const [watched, setWatched] = useState(false);

  const reportId = state.status === 'ready' ? state.data.report?.id : undefined;

  // Only pull the leaflet chunk once there is actually a report to pin. Ungated,
  // it downloaded on every mount — including while the fetch was still in flight,
  // on a failed fetch, and for a bad/missing id (a dead shared link), where it
  // could never render anything. This screen is the one people open from a
  // WhatsApp link on a phone, so that was the worst place to spend the bytes.
  const { Map: LocationMap } = useLazyMap('ReportLocationMap', !!reportId);
  // Sync the follow state from localStorage once the report id is known.
  useEffect(() => {
    setWatched(reportId ? isWatched(reportId) : false);
  }, [reportId]);

  // Native share sheet where the browser has one (mobile — WhatsApp is the
  // point); clipboard fallback elsewhere. Never throws: a dismissed sheet is
  // not an error.
  const shareReport = async (report: Report) => {
    const label = getCategory(report.category)?.label ?? 'Kayıt';
    const url = window.location.href;
    const text = `${label} — ${report.neighborhood || 'Adana'} | Mahalle Defteri kaydı: ${url}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Mahalle Defteri', text, url });
        return;
      } catch (err) {
        // AbortError = user dismissed the sheet — the outcome they chose.
        // Anything else (share already in flight, permissions policy) falls
        // through to the clipboard so the tap never does silently nothing.
        if (err instanceof Error && err.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      setShared(true);
      setTimeout(() => setShared(false), 2500);
    } catch {
      // Clipboard unavailable — the URL is already in the address bar.
    }
  };

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
          lastVerifiedAt: new Date().toISOString(), // this confirmation IS a fresh verify
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
              <CategoryMark
                slug={getCategory(ready.report.category)?.slug ?? 'pin'}
                size={40}
                iconSize={24}
              />
              <Text style={styles.category} accessibilityRole="header">
                {getCategory(ready.report.category)?.label}
              </Text>
            </View>

            <Text style={styles.place}>{ready.report.neighborhood || 'Adana'}</Text>

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

            {LocationMap ? (
              <View style={styles.mapBox}>
                <LocationMap
                  latitude={ready.report.latitude}
                  longitude={ready.report.longitude}
                  status={ready.report.status}
                />
              </View>
            ) : null}

            <View style={styles.ledgerBlock}>
              <Text style={styles.mono}>
                İlk bildirilme: {daysAgoLabel(ready.report.created_at)}
              </Text>
              <Text style={styles.mono}>{confirmationCount(ready.report)} kişi bunu doğruladı</Text>
              {ready.lastVerifiedAt ? (
                <Text style={styles.mono}>Son doğrulama: {daysAgoLabel(ready.lastVerifiedAt)}</Text>
              ) : null}
              {ready.sameSpot > 1 ? (
                <Text style={styles.mono}>Bu noktada {ready.sameSpot} kayıt var</Text>
              ) : null}
              {ready.report.status === 'open'
                ? (() => {
                    // Adana Büyükşehir's stated response window as the "past due"
                    // benchmark (PRD §11). A benchmark, not a guarantee. isOverdue()
                    // is the shared test — the chip, the stats count and this line
                    // must never disagree about what "gecikmiş" means.
                    const bd = businessDaysSince(ready.report.created_at);
                    const overdue = isOverdue(ready.report);
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

            {ready.report.status === 'open' &&
            !ready.mine &&
            calendarDaysSince(ready.lastVerifiedAt ?? ready.report.created_at) >= STALE_DAYS ? (
              <View style={styles.staleNote}>
                <Text style={styles.staleText}>
                  Bu kayıt bir süredir doğrulanmadı. Sorun hâlâ duruyor mu? Aşağıdan bildirebilirsin.
                </Text>
              </View>
            ) : null}

            {confirmError ? (
              <Text style={styles.error} accessibilityRole="alert">
                {confirmError}
              </Text>
            ) : null}

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

            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: watched }}
              // RN-Web drops accessibilityState, so without this the button's only
              // "you are following this" signal is the ✓ in its label.
              aria-pressed={watched}
              accessibilityLabel={watched ? 'Takibi bırak' : 'Bu kaydı takip et'}
              onPress={() => {
                if (reportId) setWatched(toggleWatch(reportId));
              }}
              style={styles.watchRow}
            >
              {/* The followed list lives on /watchlist, not here — the old copy
                  ("durumunu buradan izle") pointed at this screen and the screen
                  offered no way to reach the list. */}
              <Text style={styles.watchLink}>
                {watched ? 'Takip ediliyor ✓ — bırak' : 'Takip et — Takip Ettiklerim listene ekle'}
              </Text>
            </Pressable>

            {watched ? (
              <Link href="/watchlist" style={styles.watchListLink}>
                Takip Ettiklerim listesini aç →
              </Link>
            ) : null}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Bu kaydı paylaş"
              onPress={() => {
                if (ready?.report) shareReport(ready.report);
              }}
              style={styles.shareRow}
            >
              <Text style={styles.shareLink}>
                {shared ? 'Bağlantı kopyalandı ✓' : 'Bu kaydı paylaş — komşuların da görsün'}
              </Text>
            </Pressable>

            {flagOpen ? (
              <FlagForm reportId={ready.report.id} onClose={() => setFlagOpen(false)} />
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Bu kayıtla ilgili bir sorun bildir"
                onPress={() => setFlagOpen(true)}
                style={styles.flagRow}
              >
                <Text style={styles.flagLink}>Bir sorun bildir</Text>
              </Pressable>
            )}

            {/* Dormant ad slot (null unless EXPO_PUBLIC_ADS=1). Strictly BELOW
                every civic action (confirm/watch/share/flag): an ad above or
                between them would tax the community-verification signal, and a
                layout shift near "Ben de Gördüm" risks misclicks on a
                once-per-session action. Placement plan: OPERATIONS.md § Reklamlar. */}
            <AdSlot format="rect" />
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
  shareRow: {
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareLink: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: colors.petrol,
    textAlign: 'center',
    paddingVertical: 12,
  },
  flagRow: {
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flagLink: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.inkMuted,
    textAlign: 'center',
    paddingVertical: 10,
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
  mapBox: {
    height: 200,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.ink,
    overflow: 'hidden',
  },
  watchRow: {
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  watchListLink: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.petrol,
    textAlign: 'center',
    minHeight: 44,
    paddingVertical: 14,
  },
  watchLink: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: colors.petrol,
    textAlign: 'center',
    paddingVertical: 12,
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
  staleNote: {
    borderWidth: 1.5,
    borderColor: colors.terracotta,
    borderRadius: 6,
    backgroundColor: colors.stampOpen,
    padding: 12,
  },
  staleText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.ink,
    lineHeight: 20,
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
