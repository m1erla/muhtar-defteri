import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { openContactUrl, type Channel } from '@/lib/channels';
import { colors, fonts } from '@/lib/theme';

// Shared channel bits used by BOTH the routing result (rich card) and the Kanal
// Rehberi directory (compact rows). Extracted so the scope badge, the tel:
// normalization, and the a11y labels live in one place and can't drift between
// the two screens a user sees back-to-back.

// The ADANA (filled deep-teal) / ULUSAL (ink outline) scope badge. Shape + label
// carry the meaning, never colour alone — an outline vs fill plus the word.
export function ScopePill({ scope }: { scope: Channel['scope'] }) {
  const isAdana = scope === 'adana';
  return (
    <View style={[s.pill, isAdana ? s.pillAdana : s.pillNational]}>
      <Text style={[s.pillText, isAdana && s.pillTextAdana]}>{isAdana ? 'ADANA' : 'ULUSAL'}</Text>
    </View>
  );
}

// Phone + web-page affordances for a channel. `prominent` (routing result) draws
// the phone as a bordered call-to-action; the default compact form (directory)
// keeps it a plain row. The web link is a plain row in both. Renders nothing for
// a field the channel doesn't have.
export function ChannelContact({
  channel,
  prominent = false,
}: {
  channel: Channel;
  prominent?: boolean;
}) {
  return (
    <>
      {channel.contact_phone ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Ara: ${channel.contact_phone}`}
          onPress={() => Linking.openURL(`tel:${channel.contact_phone!.replace(/\s/g, '')}`)}
          style={prominent ? s.callBtn : s.row}
        >
          <Text style={prominent ? s.callNumber : s.text}>{channel.contact_phone}</Text>
          <Text style={prominent ? s.callHint : s.hint}>Ara →</Text>
        </Pressable>
      ) : null}
      {channel.contact_url ? (
        <Pressable
          accessibilityRole="link"
          accessibilityLabel="Web sayfasını aç"
          onPress={() => openContactUrl(channel.contact_url!)}
          style={s.row}
        >
          <Text style={s.text} numberOfLines={1}>
            {channel.contact_url.replace(/^https?:\/\//, '')}
          </Text>
          <Text style={s.hint}>Aç →</Text>
        </Pressable>
      ) : null}
    </>
  );
}

const s = StyleSheet.create({
  pill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderWidth: 1.5,
  },
  pillAdana: { backgroundColor: colors.scopeAdanaBg, borderColor: colors.scopeAdanaBg },
  pillNational: { backgroundColor: 'transparent', borderColor: colors.ink },
  pillText: {
    fontFamily: fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 1,
    color: colors.ink,
  },
  pillTextAdana: { color: colors.scopeAdanaText },
  // Plain contact row (compact) — the web link everywhere, and the phone in the
  // directory.
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    minHeight: 44,
  },
  text: {
    flex: 1,
    fontFamily: fonts.mono,
    fontSize: 14,
    color: colors.petrol,
  },
  hint: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: colors.petrol,
  },
  // Prominent phone CTA — a clear, bordered "call" affordance on the routing card.
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    minHeight: 50,
    borderWidth: 1.5,
    borderColor: colors.petrol,
    borderRadius: 6,
    paddingHorizontal: 14,
    marginTop: 2,
  },
  callNumber: {
    fontFamily: fonts.monoMedium,
    fontSize: 18,
    color: colors.petrol,
  },
  callHint: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: colors.petrol,
  },
});
