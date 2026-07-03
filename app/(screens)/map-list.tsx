import { Stack, useRouter } from 'expo-router';
import { useCallback, useEffect, useState, type ComponentType } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import LedgerRow from '@/components/ledger-row';
import { CATEGORIES, type CategorySlug } from '@/lib/categories';
import { fetchReports, type Report } from '@/lib/reports';
import { colors, fonts } from '@/lib/theme';

type MapProps = { reports: Report[]; onSelect: (id: string) => void };
type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; reports: Report[] };

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
  const wide = width >= 768;

  const [category, setCategory] = useState<CategorySlug | null>(null);
  const [status, setStatus] = useState<'open' | 'resolved' | null>(null);
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  const load = useCallback(async () => {
    setState({ status: 'loading' });
    try {
      const reports = await fetchReports({ category, status });
      setState({ status: 'ready', reports });
    } catch (err) {
      setState({ status: 'error', message: err instanceof Error ? err.message : String(err) });
    }
  }, [category, status]);

  useEffect(() => {
    load();
  }, [load]);

  // Map is progressive enhancement for wider viewports (FRONTEND.md §2) —
  // only load the chunk when it will actually render.
  const [MapView, setMapView] = useState<ComponentType<MapProps> | null>(null);
  useEffect(() => {
    if (!wide || Platform.OS !== 'web' || MapView) return;
    let live = true;
    import('@/components/maps').then(
      (mod) => live && setMapView(() => mod.ReportsMap),
      () => undefined
    );
    return () => {
      live = false;
    };
  }, [wide, MapView]);

  const openDetail = (id: string) => router.push({ pathname: '/report-detail', params: { id } });

  const list = (
    <>
      {state.status === 'loading' ? (
        <View style={styles.stateBox}>
          <ActivityIndicator color={colors.petrol} />
        </View>
      ) : null}

      {state.status === 'error' ? (
        <View style={styles.stateBox}>
          <Text style={styles.stateText}>
            {state.message.startsWith('Supabase is not configured')
              ? 'Veritabanı bağlantısı henüz kurulmadı.'
              : 'Kayıtlar yüklenemedi. Bağlantını kontrol edip tekrar dene.'}
          </Text>
          <Pressable accessibilityRole="button" onPress={load}>
            <Text style={styles.retry}>Tekrar dene</Text>
          </Pressable>
        </View>
      ) : null}

      {state.status === 'ready' && state.reports.length === 0 ? (
        <View style={styles.stateBox}>
          <Text style={styles.stateText}>
            Bu filtreyle kayıt yok. İlk kaydı sen ekleyebilirsin — ana sayfadan bir sorun bildir.
          </Text>
        </View>
      ) : null}

      {state.status === 'ready'
        ? state.reports.map((r) => <LedgerRow key={r.id} report={r} onPress={() => openDetail(r.id)} />)
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

        {wide ? (
          <View style={styles.wideRow}>
            <View style={styles.mapPane}>
              {MapView ? (
                <MapView
                  reports={state.status === 'ready' ? state.reports : []}
                  onSelect={openDetail}
                />
              ) : (
                <View style={styles.stateBox}>
                  <Text style={styles.stateText}>Harita yükleniyor…</Text>
                </View>
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
    minHeight: 40,
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
  stateBox: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 12,
  },
  stateText: {
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.ink,
    opacity: 0.75,
    textAlign: 'center',
  },
  retry: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
    color: colors.petrol,
    paddingVertical: 8,
  },
});
