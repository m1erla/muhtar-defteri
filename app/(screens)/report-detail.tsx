import { Image } from 'expo-image';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import OutlineButton from '@/components/outline-button';
import StatusStamp from '@/components/status-stamp';
import { getCategory } from '@/lib/categories';
import { daysAgoLabel } from '@/lib/format';
import {
  confirmationCount,
  confirmReport,
  fetchMyConfirmation,
  fetchReport,
  type ConfirmationType,
  type Report,
} from '@/lib/reports';
import { colors, fonts } from '@/lib/theme';

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'missing' }
  | { status: 'ready'; report: Report; mine: ConfirmationType | null };

export default function ReportDetail() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setState({ status: 'loading' });
    try {
      const report = await fetchReport(id);
      if (!report) {
        setState({ status: 'missing' });
        return;
      }
      const mine = await fetchMyConfirmation(id);
      setState({ status: 'ready', report, mine });
    } catch (err) {
      setState({ status: 'error', message: err instanceof Error ? err.message : String(err) });
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const confirm = async (type: ConfirmationType) => {
    if (state.status !== 'ready' || confirming) return;
    setConfirming(true);
    setConfirmError(null);
    try {
      await confirmReport(state.report.id, type);
      await load();
    } catch {
      setConfirmError('Kaydedilemedi. Bağlantını kontrol edip tekrar dene.');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Bildirim' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {!id || state.status === 'missing' ? (
          <Text style={styles.stateText}>Bu kayıt bulunamadı.</Text>
        ) : null}

        {id && state.status === 'loading' ? (
          <View style={styles.stateBox}>
            <ActivityIndicator color={colors.petrol} />
          </View>
        ) : null}

        {state.status === 'error' ? (
          <View style={styles.stateBox}>
            <Text style={styles.stateText}>
              {state.message.startsWith('Supabase is not configured')
                ? 'Veritabanı bağlantısı henüz kurulmadı.'
                : 'Kayıt yüklenemedi. Bağlantını kontrol edip tekrar dene.'}
            </Text>
            <Pressable accessibilityRole="button" onPress={load}>
              <Text style={styles.retry}>Tekrar dene</Text>
            </Pressable>
          </View>
        ) : null}

        {state.status === 'ready' ? (
          <>
            <View style={styles.headerRow}>
              <StatusStamp status={state.report.status} size="large" />
              <Text style={styles.category}>
                {getCategory(state.report.category)?.emoji}{' '}
                {getCategory(state.report.category)?.label}
              </Text>
            </View>

            <Text style={styles.place}>{state.report.neighborhood ?? 'Adana'}</Text>

            {state.report.description ? (
              <Text style={styles.description}>{state.report.description}</Text>
            ) : null}

            {state.report.photo_url ? (
              <Image
                source={{ uri: state.report.photo_url }}
                style={styles.photo}
                contentFit="cover"
              />
            ) : null}

            <View style={styles.ledgerBlock}>
              <Text style={styles.mono}>İlk bildirilme: {daysAgoLabel(state.report.created_at)}</Text>
              <Text style={styles.mono}>
                {confirmationCount(state.report)} kişi bunu doğruladı
              </Text>
            </View>

            {confirmError ? <Text style={styles.error}>{confirmError}</Text> : null}

            {state.mine ? (
              <Text style={styles.confirmedNote}>
                {state.mine === 'resolved'
                  ? 'Bu kaydı "düzeldi" olarak işaretledin ✓'
                  : 'Bu kaydı doğruladın ✓'}
              </Text>
            ) : (
              <View style={styles.actions}>
                <OutlineButton
                  label="Ben de Gördüm"
                  color={colors.terracotta}
                  disabled={confirming}
                  onPress={() => confirm('still_open')}
                />
                <OutlineButton
                  label="Bu Düzeldi"
                  color={colors.moss}
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
  actions: {
    gap: 10,
  },
  confirmedNote: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
    color: colors.moss,
    textAlign: 'center',
    paddingVertical: 8,
  },
  error: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.terracotta,
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
