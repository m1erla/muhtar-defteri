import { Stack, useRouter } from 'expo-router';
import { Fragment, useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import AdSlot from '@/components/ad-slot';
import CategoryMark from '@/components/category-mark';
import LedgerRow from '@/components/ledger-row';
import LoadStateView from '@/components/load-state-view';
import Sivri from '@/components/sivri';
import { CATEGORIES, getCategory, type CategorySlug } from '@/lib/categories';
import { clusterKey, clusterReports } from '@/lib/cluster';
import { consumeReportAdded } from '@/lib/flash';
import { fetchReportStats, fetchReports, isArchivable, isOverdue } from '@/lib/reports';
import { friendlyDbError } from '@/lib/supabase';
import { colors, fonts } from '@/lib/theme';
import { useLazyMap } from '@/lib/use-lazy-map';
import { useLoad } from '@/lib/use-load';

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      // RN-Web drops accessibilityState here, so without this the ONLY signal
      // that a filter is on is the petrol fill — invisible to a screen reader
      // and colour-only for everyone else (same fix as flag-form/settings).
      aria-pressed={active}
      style={[styles.chip, active && styles.chipActive]}
    >
      <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{label}</Text>
    </Pressable>
  );
}

export default function MapList() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  // Map is progressive enhancement for wider WEB viewports (FRONTEND.md §2).
  const showMapPane = width >= 768 && Platform.OS === 'web';

  const [category, setCategory] = useState<CategorySlug | null>(null);
  const [status, setStatus] = useState<'open' | 'resolved' | null>(null);
  // Show only reports past the response benchmark (accountability filter).
  const [overdueOnly, setOverdueOnly] = useState(false);
  // Old, never-re-verified open reports drop off the default view (kept in the
  // DB) so the active map stays honest; the toggle brings them back.
  const [showOld, setShowOld] = useState(false);

  // One-shot success toast after add-to-map — read from a module flag (consumed
  // once, resets on full reload) so it never re-appears on back-nav/reload.
  // Auto-hides after 5s.
  const [showAdded, setShowAdded] = useState(consumeReportAdded);
  useEffect(() => {
    if (!showAdded) return;
    const t = setTimeout(() => setShowAdded(false), 5000);
    return () => clearTimeout(t);
  }, [showAdded]);

  // Fetch unfiltered and filter client-side, so the ⟳/pin same-spot counts are
  // computed over ALL reports and stay stable when chips toggle (server-filtering
  // made a spot's count shift with the active filter). The cap bounds this to the
  // newest 500 reports — ample for this scale; report-detail's fetchSameSpotCount
  // is the authoritative full-table count. Focus refetch keeps it fresh after a
  // confirm/resolve on the detail screen.
  const { state, reload } = useLoad(() => fetchReports({}, 500), [], {
    refetchOnFocus: true,
    keepDataWhileReloading: true,
  });

  // The strip's numbers come from the SAME head-count query Home uses, not from
  // the 500-row page below: counting the page would have made this screen
  // contradict Home's figures the moment the ledger passed the cap, and a
  // transparency number that disagrees with itself is worse than no number.
  // Three head-only counts — no rows.
  const { state: statsState } = useLoad(() => fetchReportStats(), [], { refetchOnFocus: true });

  const { Map: MapView, failed: mapFailed, retry: retryMap } = useLazyMap('ReportsMap', showMapPane);

  const openDetail = (id: string) => router.push({ pathname: '/report-detail', params: { id } });

  const all = state.status === 'ready' ? state.data : [];

  // Split in two on purpose. Everything here depends ONLY on the fetched rows —
  // clustering walks all ~500 of them — so it must not be recomputed every time a
  // filter chip is tapped. clusterReports() already returns each group with its
  // count, so `counts` is derived from it rather than walking the rows a second
  // time with clusterCounts().
  const { counts, spotlight, topCategory, topNeighborhood } = useMemo(() => {
    const groups = clusterReports(all);
    const counts = new Map(groups.map((g) => [g.key, g.count]));

    // The worst recurring spots (⟳ > 1), most-reported first — over ALL reports,
    // so it stays a stable, filter-independent signal.
    const spotlight = groups
      .filter((c) => c.count > 1)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    const catCount = new Map<string, number>();
    const nbCount = new Map<string, number>();
    for (const r of all) {
      catCount.set(r.category, (catCount.get(r.category) ?? 0) + 1);
      // Only real mahalle names compete for "en çok". Reports whose reverse-geocode
      // failed used to be folded into a pseudo-mahalle called "Adana", which could
      // then WIN and be shown as the city's most-reported neighbourhood.
      const nb = r.neighborhood?.trim();
      if (nb) nbCount.set(nb, (nbCount.get(nb) ?? 0) + 1);
    }
    const top = (m: Map<string, number>) =>
      [...m.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    const topCat = top(catCount);

    return {
      counts,
      spotlight,
      topCategory: topCat ? getCategory(topCat)?.label ?? null : null,
      topNeighborhood: top(nbCount),
    };
  }, [all]);

  // Only this depends on the filter chips.
  const { filtered, visible, hiddenCount } = useMemo(() => {
    const filtered = all.filter(
      (r) =>
        (!category || r.category === category) &&
        (!status || r.status === status) &&
        (!overdueOnly || isOverdue(r))
    );
    const visible = showOld ? filtered : filtered.filter((r) => !isArchivable(r));
    return { filtered, visible, hiddenCount: filtered.length - visible.length };
  }, [all, category, status, overdueOnly, showOld]);

  const stats = statsState.status === 'ready' ? statsState.data : null;

  // "Gecikmiş" means open-and-past-the-benchmark (isOverdue), so it and "Çözüldü"
  // can never both match a report — leaving them independently selectable gave a
  // dead combination that always rendered the empty state. Turning either on now
  // turns the other off.
  const toggleStatus = (s: 'open' | 'resolved') => {
    const next = status === s ? null : s;
    setStatus(next);
    if (next === 'resolved') setOverdueOnly(false);
  };
  const toggleOverdue = () => {
    const next = !overdueOnly;
    setOverdueOnly(next);
    if (next && status === 'resolved') setStatus(null);
  };

  const list = (
    <>
      {stats && stats.total > 0 ? (
        <View style={styles.statsStrip} accessibilityRole="summary">
          <Text style={styles.statsLine}>
            {stats.total} kayıt · %{Math.round((stats.resolved / stats.total) * 100)} çözüldü
            {stats.overdue > 0 ? ` · ${stats.overdue} gecikmiş` : ''}
          </Text>
          {topCategory || topNeighborhood ? (
            <Text style={styles.statsSub}>
              En çok: {[topCategory, topNeighborhood].filter(Boolean).join(' · ')}
            </Text>
          ) : null}
        </View>
      ) : null}

      {state.status === 'ready' && spotlight.length > 0 ? (
        <View style={styles.spotlight}>
          <Text style={styles.spotlightTitle}>En çok bildirilenler</Text>
          {spotlight.map((c) => {
            const place = c.representative.neighborhood?.trim() || 'Adana';
            const cat = getCategory(c.representative.category);
            return (
              <Pressable
                key={c.key}
                accessibilityRole="button"
                accessibilityLabel={`${place}, ${cat?.label ?? ''}, bu noktada ${c.count} kayıt`}
                onPress={() => openDetail(c.representative.id)}
                style={styles.spotlightRow}
              >
                <CategoryMark slug={c.representative.category} size={28} iconSize={18} />
                <Text style={styles.spotlightText} numberOfLines={1}>
                  {place} — {cat?.label}
                </Text>
                <Text style={styles.spotlightCount}>⟳{c.count}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {state.status === 'loading' ? <LoadStateView loading /> : null}

      {state.status === 'error' ? (
        <LoadStateView
          message={friendlyDbError(
            state.error,
            'Kayıtlar yüklenemedi. Bağlantını kontrol edip tekrar dene.'
          )}
          onRetry={reload}
        />
      ) : null}

      {state.status === 'ready' && filtered.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Sivri size={96} mood="sleep" />
          <LoadStateView message="Bu filtreyle kayıt yok. İlk kaydı sen ekleyebilirsin — ana sayfadan bir sorun bildir." />
        </View>
      ) : null}

      {state.status === 'ready' && filtered.length > 0 ? (
        <>
          {visible.length > 0 ? (
            <>
              <Text style={styles.legend}>Mahalle · tarih · kaç kişi doğruladı · durum</Text>
              <View style={styles.ledgerFrame}>
                {visible.map((r, i) => (
                  <Fragment key={r.id}>
                    {/* Dormant in-feed ad (null unless EXPO_PUBLIC_ADS=1): one
                        per 10 rows, never before row 10 — the stats strip,
                        spotlight and first screenful stay ad-free. Framed and
                        labelled, deliberately NOT shaped like a ledger row (an
                        ad that reads as a report is a fake report). Keyed by
                        list position so units don't jump when filters toggle. */}
                    {i > 0 && i % 10 === 0 ? <AdSlot format="infeed" /> : null}
                    <LedgerRow
                      report={r}
                      clusterCount={counts.get(clusterKey(r)) ?? 1}
                      onPress={() => openDetail(r.id)}
                    />
                  </Fragment>
                ))}
              </View>
            </>
          ) : (
            <LoadStateView message="Görünür kayıt yok — eski, doğrulanmamış kayıtlar gizlendi." />
          )}

          {hiddenCount > 0 || showOld ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => setShowOld((v) => !v)}
              style={styles.oldToggle}
            >
              <Text style={styles.oldToggleText}>
                {showOld
                  ? 'Eski, doğrulanmamış kayıtları gizle'
                  : `${hiddenCount} eski kayıt gizli · Göster`}
              </Text>
            </Pressable>
          ) : null}
        </>
      ) : null}
    </>
  );

  return (
    <>
      <Stack.Screen options={{ title: 'Mahalle Kaydı' }} />
      <View style={styles.container}>
        {showAdded ? (
          <>
            <Text style={styles.successBanner} accessibilityRole="alert">
              Kaydın mahalle defterine eklendi ✓
            </Text>
            <View style={styles.celebrate}>
              <Sivri size={84} mood="happy" />
            </View>
          </>
        ) : null}

        {/* The screen's own heading (the header bar shows only the wordmark now). */}
        <Text style={styles.screenTitle} accessibilityRole="header">
          Mahalle Kaydı
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipBar}
          contentContainerStyle={styles.chipBarContent}
        >
          {CATEGORIES.map((c) => (
            <Chip
              key={c.slug}
              label={c.label}
              active={category === c.slug}
              onPress={() => setCategory(category === c.slug ? null : c.slug)}
            />
          ))}
          <View style={styles.chipDivider} />
          <Chip label="Açık" active={status === 'open'} onPress={() => toggleStatus('open')} />
          <Chip
            label="Çözüldü"
            active={status === 'resolved'}
            onPress={() => toggleStatus('resolved')}
          />
          <Chip label="Gecikmiş" active={overdueOnly} onPress={toggleOverdue} />
        </ScrollView>

        {showMapPane ? (
          <View style={styles.wideRow}>
            <View style={styles.mapPane}>
              {MapView ? (
                <MapView reports={visible} counts={counts} onSelect={openDetail} />
              ) : mapFailed ? (
                <LoadStateView message="Harita yüklenemedi." onRetry={retryMap} />
              ) : (
                <LoadStateView loading message="Harita yükleniyor…" />
              )}
            </View>
            <ScrollView style={styles.listPane} contentContainerStyle={styles.listContent}>
              {list}
            </ScrollView>
          </View>
        ) : (
          <ScrollView style={styles.listPane} contentContainerStyle={styles.listContent}>
            {list}
          </ScrollView>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  successBanner: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: colors.paper,
    backgroundColor: colors.moss,
    paddingHorizontal: 16,
    paddingVertical: 10,
    textAlign: 'center',
  },
  celebrate: {
    alignItems: 'center',
    paddingTop: 8,
  },
  emptyWrap: {
    alignItems: 'center',
    gap: 6,
    paddingTop: 16,
  },
  screenTitle: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 20,
    color: colors.ink,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 2,
  },
  chipBar: {
    flexGrow: 0,
  },
  chipBarContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    alignItems: 'center',
  },
  chip: {
    borderWidth: 1.5,
    borderColor: colors.ink,
    borderRadius: 999,
    paddingHorizontal: 14,
    minHeight: 44,
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: colors.petrol,
    borderColor: colors.petrol,
  },
  chipLabel: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.ink,
  },
  chipLabelActive: {
    color: colors.paper,
  },
  chipDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.ink,
    opacity: 0.3,
    marginHorizontal: 4,
  },
  wideRow: {
    flex: 1,
    flexDirection: 'row',
  },
  mapPane: {
    flex: 1,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: colors.ink,
    justifyContent: 'center',
  },
  listPane: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
  },
  statsStrip: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: colors.ink,
    borderRadius: 6,
    gap: 2,
  },
  statsLine: {
    fontFamily: fonts.monoMedium,
    fontSize: 13,
    color: colors.ink,
  },
  statsSub: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.inkMuted,
  },
  spotlight: {
    marginTop: 12,
    gap: 2,
  },
  spotlightTitle: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: colors.ink,
    marginBottom: 4,
  },
  spotlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 44,
    paddingVertical: 6,
  },
  spotlightText: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.ink,
  },
  spotlightCount: {
    fontFamily: fonts.monoMedium,
    fontSize: 14,
    color: colors.terracottaText,
  },
  legend: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: colors.inkMuted,
    paddingTop: 12,
    paddingBottom: 6,
  },
  ledgerFrame: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.ink,
  },
  oldToggle: {
    minHeight: 44,
    justifyContent: 'center',
    paddingVertical: 10,
  },
  oldToggleText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: colors.petrol,
  },
});
