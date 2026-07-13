import { Stack } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import CategoryMark from '@/components/category-mark';
import { ChannelContact, ScopePill } from '@/components/channel-contact';
import LoadStateView from '@/components/load-state-view';
import { CATEGORIES, getCategory } from '@/lib/categories';
import { fetchChannels, type Channel } from '@/lib/channels';
import { friendlyDbError } from '@/lib/supabase';
import { colors, fonts } from '@/lib/theme';
import { trMatch } from '@/lib/tr-normalize';
import { useLoad } from '@/lib/use-load';

// Does a channel match the directory search? Folds Turkish characters, and
// searches name + category label + description + phone so "cukurova", "185" or
// "cimer" all land.
function channelMatches(channel: Channel, query: string): boolean {
  if (!query.trim()) return true;
  const hay = [
    channel.name,
    getCategory(channel.category)?.label ?? '',
    channel.description ?? '',
    channel.contact_phone ?? '',
  ].join(' ');
  return trMatch(hay, query);
}

// Kanal Rehberi — the phone list in the back of the ledger. Every verified
// channel, browsable without filing a report. Compact rows on purpose: the
// rich card (checklist, notes, copy) lives on the routing result, where the
// user has a concrete problem in hand.

function ChannelRow({ channel }: { channel: Channel }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowHead}>
        <Text style={styles.name}>{channel.name}</Text>
        <ScopePill scope={channel.scope} />
      </View>
      <ChannelContact channel={channel} />
    </View>
  );
}

export default function ChannelDirectory() {
  const { state, reload } = useLoad(() => fetchChannels(), []);
  const [query, setQuery] = useState('');

  const data = state.status === 'ready' ? state.data : [];
  const groups = CATEGORIES.map((c) => ({
    category: c,
    rows: data.filter((ch) => ch.category === c.slug && channelMatches(ch, query)),
  })).filter((g) => g.rows.length > 0);

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

        {state.status === 'ready' ? (
          <TextInput
            style={styles.search}
            placeholder="Ara: kanal, kategori ya da numara"
            placeholderTextColor={colors.inkMuted}
            accessibilityLabel="Kanallarda ara"
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
        ) : null}

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

        {state.status === 'ready' && groups.length === 0 ? (
          <LoadStateView message="Bu aramayla eşleşen kanal yok." />
        ) : null}

        {groups.map(({ category: c, rows }) => (
          <View key={c.slug} style={styles.group}>
            <View style={styles.groupHeader}>
              <CategoryMark slug={c.slug} size={40} iconSize={24} />
              <Text style={styles.groupTitle} accessibilityRole="header">
                {c.label}
              </Text>
            </View>
            {rows.map((ch) => (
              <ChannelRow key={ch.id} channel={ch} />
            ))}
          </View>
        ))}
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
  search: {
    borderWidth: 1.5,
    borderColor: colors.ink,
    borderRadius: 6,
    minHeight: 48,
    paddingHorizontal: 12,
    fontFamily: fonts.sans,
    fontSize: 16,
    color: colors.ink,
    marginTop: 4,
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
});
