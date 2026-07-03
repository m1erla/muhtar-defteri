import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import LedgerRow from '@/components/ledger-row';
import LoadStateView from '@/components/load-state-view';
import { CATEGORIES, type CategorySlug } from '@/lib/categories';
import { fetchReports } from '@/lib/reports';
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

  // Focus refetch: returning from a detail where the user confirmed/resolved
  // must show fresh data — but keep the rendered list during the reload.
  const { state, reload } = useLoad(() => fetchReports({ category, status }), [category, status], {
    refetchOnFocus: true,
    keepDataWhileReloading: true,
  });

  const { Map: MapView, failed: mapFailed, retry: retryMap } = useLazyMap('ReportsMap', showMapPane);

  const openDetail = (id: string) => router.push({ pathname: '/report-detail', params: { id } });

  const list = (
    <>
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

      {state.status === 'ready' && state.data.length === 0 ? (
        <LoadStateView message="Bu filtreyle kayıt yok. İlk kaydı sen ekleyebilirsin — ana sayfadan bir sorun bildir." />
      ) : null}

      {state.status === 'ready'
        ? state.data.map((r) => <LedgerRow key={r.id} report={r} onPress={() => openDetail(r.id)} />)
        : null}
    </>
  );

  return (
    <>
      <Stack.Screen options={{ title: 'Mahalle Kaydı' }} />
      <View style={styles.container}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipBar}
          contentContainerStyle={styles.chipBarContent}
        >
          {CATEGORIES.map((c) => (
            <Chip
              key={c.slug}
              label={`${c.emoji} ${c.label}`}
              active={category === c.slug}
              onPress={() => setCategory(category === c.slug ? null : c.slug)}
            />
          ))}
          <View style={styles.chipDivider} />
          <Chip
            label="Açık"
            active={status === 'open'}
            onPress={() => setStatus(status === 'open' ? null : 'open')}
          />
          <Chip
            label="Çözüldü"
            active={status === 'resolved'}
            onPress={() => setStatus(status === 'resolved' ? null : 'resolved')}
          />
        </ScrollView>

        {showMapPane ? (
          <View style={styles.wideRow}>
            <View style={styles.mapPane}>
              {MapView ? (
                <MapView
                  reports={state.status === 'ready' ? state.data : []}
                  onSelect={openDetail}
                />
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
});
