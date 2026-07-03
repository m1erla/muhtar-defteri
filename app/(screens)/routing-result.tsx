import { Link, Redirect, Stack } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { getCategory } from '@/lib/categories';
import { fetchChannels, type Channel } from '@/lib/channels';
import { getDraft } from '@/lib/report-draft';
import { colors, fonts } from '@/lib/theme';

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; channels: Channel[] };

function ChannelCard({ channel }: { channel: Channel }) {
  const [copied, setCopied] = useState(false);
  const [checked, setChecked] = useState<Record<number, boolean>>({});

  const copy = async () => {
    const block = [channel.name, channel.contact_phone, channel.contact_url]
      .filter(Boolean)
      .join('\n');
    try {
      await navigator.clipboard.writeText(block);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (older browsers) — the info is still on screen.
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.scopeTag}>{channel.scope === 'adana' ? 'ADANA' : 'ULUSAL'}</Text>
        <Pressable accessibilityRole="button" onPress={copy}>
          <Text style={styles.copyLink}>{copied ? 'Kopyalandı ✓' : 'Bilgileri Kopyala'}</Text>
        </Pressable>
      </View>
      <Text style={styles.channelName}>{channel.name}</Text>
      {channel.description ? <Text style={styles.channelDesc}>{channel.description}</Text> : null}

      {channel.contact_phone ? (
        <Pressable
          accessibilityRole="link"
          onPress={() => Linking.openURL(`tel:${channel.contact_phone!.replace(/\s/g, '')}`)}
        >
          <Text style={styles.mono}>☎ {channel.contact_phone}</Text>
        </Pressable>
      ) : null}
      {channel.contact_url ? (
        <Pressable accessibilityRole="link" onPress={() => Linking.openURL(channel.contact_url!)}>
          <Text style={styles.mono}>🔗 {channel.contact_url.replace(/^https?:\/\//, '')}</Text>
        </Pressable>
      ) : null}

      {channel.required_info?.length ? (
        <View style={styles.checklist}>
          <Text style={styles.checklistLabel}>Yanına al:</Text>
          {channel.required_info.map((item, i) => (
            <Pressable
              key={i}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: !!checked[i] }}
              onPress={() => setChecked((prev) => ({ ...prev, [i]: !prev[i] }))}
              style={styles.checkRow}
            >
              <View style={[styles.checkbox, checked[i] && styles.checkboxChecked]}>
                {checked[i] ? <Text style={styles.checkmark}>✓</Text> : null}
              </View>
              <Text style={styles.checkText}>{item}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {channel.notes ? <Text style={styles.notes}>{channel.notes}</Text> : null}
    </View>
  );
}

export default function RoutingResult() {
  const category = getCategory(getDraft().category);
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  const load = useCallback(async () => {
    if (!category) return;
    setState({ status: 'loading' });
    try {
      const channels = await fetchChannels(category.slug);
      setState({ status: 'ready', channels });
    } catch (err) {
      setState({ status: 'error', message: err instanceof Error ? err.message : String(err) });
    }
  }, [category?.slug]);

  useEffect(() => {
    load();
  }, [load]);

  if (!category) {
    return <Redirect href="/report-category" />;
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Doğru Kanal' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.heading}>İşte doğru yer:</Text>
        <Text style={styles.sub}>
          {category.emoji} {category.label} için başvurabileceğin resmi kanallar. Bu uygulama resmi
          bir kanal değildir — seni doğru yere yönlendirir.
        </Text>

        {state.status === 'loading' ? (
          <View style={styles.stateBox}>
            <ActivityIndicator color={colors.petrol} />
            <Text style={styles.stateText}>Kanallar yükleniyor…</Text>
          </View>
        ) : null}

        {state.status === 'error' ? (
          <View style={styles.stateBox}>
            <Text style={styles.stateText}>
              {state.message.startsWith('Supabase is not configured')
                ? 'Veritabanı bağlantısı henüz kurulmadı.'
                : 'Kanallar yüklenemedi. Bağlantını kontrol edip tekrar dene.'}
            </Text>
            <Pressable accessibilityRole="button" onPress={load}>
              <Text style={styles.copyLink}>Tekrar dene</Text>
            </Pressable>
          </View>
        ) : null}

        {state.status === 'ready' && state.channels.length === 0 ? (
          <View style={styles.stateBox}>
            <Text style={styles.stateText}>Bu kategori için kayıtlı kanal bulunamadı.</Text>
          </View>
        ) : null}

        {state.status === 'ready'
          ? state.channels.map((c) => <ChannelCard key={c.id} channel={c} />)
          : null}

        <Link href="/add-to-map" style={styles.mapLink}>
          Haritaya da Ekle →
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
    gap: 14,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
    paddingBottom: 40,
  },
  heading: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 24,
    color: colors.ink,
    marginTop: 8,
  },
  sub: {
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.ink,
    opacity: 0.75,
  },
  stateBox: {
    paddingVertical: 32,
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
  card: {
    borderWidth: 1.5,
    borderColor: colors.ink,
    borderRadius: 6,
    padding: 16,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scopeTag: {
    fontFamily: fonts.monoMedium,
    fontSize: 12,
    color: colors.petrol,
    letterSpacing: 1,
  },
  copyLink: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
    color: colors.petrol,
    paddingVertical: 6,
  },
  channelName: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 19,
    color: colors.ink,
  },
  channelDesc: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.ink,
    opacity: 0.8,
  },
  mono: {
    fontFamily: fonts.monoMedium,
    fontSize: 16,
    color: colors.petrol,
    paddingVertical: 6,
  },
  checklist: {
    gap: 2,
    marginTop: 4,
  },
  checklistLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
    color: colors.ink,
    marginBottom: 4,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 40,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 1.5,
    borderColor: colors.ink,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.petrol,
    borderColor: colors.petrol,
  },
  checkmark: {
    color: colors.paper,
    fontSize: 14,
    lineHeight: 16,
  },
  checkText: {
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.ink,
    flex: 1,
  },
  notes: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.ink,
    opacity: 0.65,
    fontStyle: 'italic',
  },
  mapLink: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 16,
    color: colors.petrol,
    paddingVertical: 12,
    textAlign: 'center',
  },
});
