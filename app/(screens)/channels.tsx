import { Stack } from 'expo-router';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import Icon from '@/components/icon';
import LoadStateView from '@/components/load-state-view';
import { CATEGORIES } from '@/lib/categories';
import { fetchAllChannels, type Channel } from '@/lib/channels';
import { friendlyDbError } from '@/lib/supabase';
import { colors, fonts } from '@/lib/theme';
import { useLoad } from '@/lib/use-load';

// Kanal Rehberi — the phone list in the back of the ledger. Every verified
// channel, browsable without filing a report. Compact rows on purpose: the
// rich card (checklist, notes, copy) lives on the routing result, where the
// user has a concrete problem in hand.

function ChannelRow({ channel }: { channel: Channel }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowHead}>
        <Text style={styles.name}>{channel.name}</Text>
        <Text style={styles.scope}>{channel.scope === 'adana' ? 'ADANA' : 'ULUSAL'}</Text>
      </View>
      {channel.contact_phone ? (
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={`Telefon: ${channel.contact_phone}, aramak için dokun`}
          onPress={() => Linking.openURL(`tel:${channel.contact_phone!.replace(/\s/g, '')}`)}
        >
          <Text style={styles.contact}>☎ {channel.contact_phone}</Text>
        </Pressable>
      ) : null}
      {channel.contact_url ? (
        <Pressable
          accessibilityRole="link"
          accessibilityLabel="Web sayfasını aç"
          onPress={() => {
            // Channel rows come from the DB — only ever open web URLs from them.
            if (/^https?:\/\//.test(channel.contact_url!)) Linking.openURL(channel.contact_url!);
          }}
        >
          <Text style={styles.contact}>🔗 {channel.contact_url.replace(/^https?:\/\//, '')}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export default function ChannelDirectory() {
  const { state, reload } = useLoad(fetchAllChannels, []);

  return (
    <>
      <Stack.Screen options={{ title: 'Kanal Rehberi' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.heading} accessibilityRole="header">
          Kanal Rehberi
        </Text>
        <Text style={styles.sub}>
          Sorun türüne göre doğrulanmış resmi hatlar. Numaraya dokunarak arayabilirsin. Mahalle
          Defteri'nin bu kanallarla resmi bir bağı yoktur.
        </Text>

        {state.status === 'loading' ? <LoadStateView loading /> : null}
        {state.status === 'error' ? (
          <LoadStateView
            message={friendlyDbError(
              state.error,
              'Kanallar yüklenemedi. Bağlantını kontrol edip tekrar dene.'
            )}
            onRetry={reload}
          />
        ) : null}

        {state.status === 'ready'
          ? CATEGORIES.map((c) => {
              const rows = state.data.filter((ch) => ch.category === c.slug);
              if (rows.length === 0) return null;
              return (
                <View key={c.slug} style={styles.group}>
                  <View style={styles.groupHeader}>
                    <Icon name={c.slug} size={24} />
                    <Text style={styles.groupTitle} accessibilityRole="header">
                      {c.label}
                    </Text>
                  </View>
                  {rows.map((ch) => (
                    <ChannelRow key={ch.id} channel={ch} />
                  ))}
                </View>
              );
            })
          : null}
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
    gap: 10,
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
    color: colors.inkMuted,
    lineHeight: 22,
  },
  group: {
    marginTop: 10,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  groupTitle: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 17,
    color: colors.ink,
  },
  row: {
    paddingVertical: 10,
    gap: 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.ink,
  },
  rowHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  name: {
    flex: 1,
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
    color: colors.ink,
    lineHeight: 21,
  },
  scope: {
    fontFamily: fonts.monoMedium,
    fontSize: 11,
    color: colors.petrol,
    letterSpacing: 1,
  },
  contact: {
    fontFamily: fonts.mono,
    fontSize: 14,
    color: colors.petrol,
    paddingVertical: 6,
  },
});
