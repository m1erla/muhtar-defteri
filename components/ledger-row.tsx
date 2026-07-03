import { Pressable, StyleSheet, Text } from 'react-native';

import StatusStamp from '@/components/status-stamp';
import { getCategory } from '@/lib/categories';
import { formatLedgerDate } from '@/lib/format';
import type { Report } from '@/lib/reports';
import { confirmationCount } from '@/lib/reports';
import { colors, fonts } from '@/lib/theme';

// The signature element (FRONTEND.md §1): rows as ledger entries — thin rule
// between rows, tabular alignment, stamp instead of a pill badge. Reused on
// Home's preview and the full map/list view.
export default function LedgerRow({ report, onPress }: { report: Report; onPress: () => void }) {
  const category = getCategory(report.category);
  const count = confirmationCount(report);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <Text style={styles.emoji}>{category?.emoji ?? '📌'}</Text>
      <Text style={styles.place} numberOfLines={1}>
        {report.neighborhood ?? 'Adana'}
      </Text>
      <Text style={styles.mono}>{formatLedgerDate(report.created_at)}</Text>
      <Text style={[styles.mono, styles.count]}>{count > 0 ? `×${count}` : '—'}</Text>
      <StatusStamp status={report.status} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 52,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.ink,
  },
  pressed: {
    backgroundColor: '#2B262010',
  },
  emoji: {
    fontSize: 18,
  },
  place: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.ink,
  },
  mono: {
    fontFamily: fonts.mono,
    fontSize: 13,
    color: colors.ink,
  },
  count: {
    minWidth: 30,
    textAlign: 'right',
  },
});
