import { Link, Redirect, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ChannelContact, ScopePill } from '@/components/channel-contact';
import LoadStateView from '@/components/load-state-view';
import { getCategory } from '@/lib/categories';
import { buildReportMessage, fetchChannels, type Channel } from '@/lib/channels';
import { getDraft } from '@/lib/report-draft';
import { friendlyDbError } from '@/lib/supabase';
import { colors, fonts } from '@/lib/theme';
import { useLoad } from '@/lib/use-load';

// `message` is built once by the screen from the RESOLVED category (URL param
// first), not per-card from the draft — so the WhatsApp prefill, the copy button
// and the heading can never name different categories.
function ChannelCard({ channel, message }: { channel: Channel; message: string }) {
  const [copied, setCopied] = useState(false);
  const [msgCopied, setMsgCopied] = useState(false);
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

  // For form/portal channels, hand the resident a ready-to-paste message — writing
  // it is the real friction. Plainly their own words; the app never submits for them.
  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setMsgCopied(true);
      setTimeout(() => setMsgCopied(false), 2000);
    } catch {
      // Clipboard unavailable — the form is still one tap away via "Aç →".
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <ScopePill scope={channel.scope} />
        <Pressable accessibilityRole="button" onPress={copy} hitSlop={6}>
          <Text style={styles.actionLink}>{copied ? 'Kopyalandı ✓' : 'Bilgileri Kopyala'}</Text>
        </Pressable>
      </View>
      <Text style={styles.channelName}>{channel.name}</Text>
      {channel.description ? <Text style={styles.channelDesc}>{channel.description}</Text> : null}

      <ChannelContact channel={channel} prominent whatsappText={message} />

      {/* "Mesaj", not "başvuru": several of these contact_url rows are an
          informational department page, not an application form, and the app
          never files anything on the resident's behalf (CLAUDE.md). */}
      {channel.contact_url ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Hazır mesajı kopyala"
          onPress={copyMessage}
          style={styles.copyMsgBtn}
        >
          <Text style={styles.copyMsgText}>
            {msgCopied ? 'Mesaj kopyalandı ✓' : 'Hazır mesajı kopyala'}
          </Text>
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
              // RN-Web doesn't emit aria-checked from accessibilityState here,
              // so a screen reader would announce every item as unchecked
              // (same fix as flag-form.tsx / settings.tsx).
              aria-checked={!!checked[i]}
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
  // Param first (survives reload/tab eviction, shareable), draft as fallback.
  const params = useLocalSearchParams<{ category?: string | string[] }>();
  const paramCategory = Array.isArray(params.category) ? params.category[0] : params.category;
  const category = getCategory(paramCategory) ?? getCategory(getDraft().category);

  const { state, reload } = useLoad(
    () => fetchChannels(category!.slug),
    [category?.slug]
  );

  if (!category) {
    return <Redirect href="/report-category" />;
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Doğru Kanal' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.heading} accessibilityRole="header">
          İşte doğru yer:
        </Text>
        <Text style={styles.sub}>
          {category.label} için başvurabileceğin resmi kanallar. Bu uygulama resmi bir kanal
          değildir — seni doğru yere yönlendirir.
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

        {state.status === 'ready' && state.data.length === 0 ? (
          <LoadStateView message="Bu kategori için kayıtlı kanal bulunamadı." />
        ) : null}

        {state.status === 'ready'
          ? state.data.map((c) => (
              <ChannelCard key={c.id} channel={c} message={buildReportMessage(category.slug)} />
            ))
          : null}

        <Link href="/add-to-map" style={styles.mapLink}>
          Haritaya da Ekle →
        </Link>
        {/* Terminal exit for the common "just get routed" story (PRD story 1) —
            without this the only way out is the back chevron, which walks the
            user backward through the funnel. */}
        <Link href="/home" replace style={styles.doneLink}>
          Bitti — Ana sayfaya dön
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
    color: colors.inkMuted,
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
  actionLink: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
    color: colors.petrol,
    paddingVertical: 12,
    minHeight: 44,
  },
  channelName: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 19,
    color: colors.ink,
  },
  channelDesc: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.inkMuted,
    lineHeight: 20,
  },
  copyMsgBtn: {
    minHeight: 44,
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.ink,
    borderRadius: 6,
    paddingHorizontal: 14,
  },
  copyMsgText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: colors.ink,
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
    minHeight: 44,
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
    color: colors.inkMuted,
    fontStyle: 'italic',
  },
  mapLink: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 16,
    color: colors.petrol,
    paddingVertical: 12,
    minHeight: 44,
    textAlign: 'center',
  },
  doneLink: {
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.inkMuted,
    paddingVertical: 12,
    minHeight: 44,
    textAlign: 'center',
  },
});
