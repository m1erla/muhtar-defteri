import { useState, type PropsWithChildren } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/lib/theme';

// Animation-free disclosure row for FAQ/help lists (FRONTEND.md: motion is not
// where the visual budget goes — content just appears). Every row carries a
// bottom rule, like ledger ruling. Screen readers get the title + expanded
// state; the +/− mark is visual only.
export default function Disclosure({ title, children }: PropsWithChildren<{ title: string }>) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.item}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ expanded: open }}
        aria-expanded={open}
        onPress={() => setOpen((o) => !o)}
        style={styles.header}
      >
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.indicator}>{open ? '−' : '+'}</Text>
      </Pressable>
      {open ? <View style={styles.body}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.ink,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    minHeight: 48,
    paddingVertical: 12,
  },
  title: {
    flex: 1,
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
    color: colors.ink,
    lineHeight: 21,
  },
  indicator: {
    fontFamily: fonts.monoMedium,
    fontSize: 18,
    color: colors.petrol,
    width: 20,
    textAlign: 'center',
  },
  body: {
    paddingBottom: 14,
    gap: 8,
  },
});
