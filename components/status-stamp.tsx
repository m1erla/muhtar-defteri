import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/lib/theme';

// FRONTEND.md §3: small circular stamp mark, terracotta open / moss resolved.
// Never color alone — the label always rides along.
export default function StatusStamp({ status, size = 'small' }: { status: 'open' | 'resolved'; size?: 'small' | 'large' }) {
  const color = status === 'open' ? colors.terracotta : colors.moss;
  const label = status === 'open' ? 'Açık' : 'Çözüldü';
  const large = size === 'large';
  return (
    <View style={styles.row}>
      <View
        style={[
          styles.dot,
          large && styles.dotLarge,
          { borderColor: color, backgroundColor: `${color}22` },
        ]}
      />
      <Text style={[styles.label, large && styles.labelLarge, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  dotLarge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 3,
  },
  label: {
    fontFamily: fonts.monoMedium,
    fontSize: 13,
  },
  labelLarge: {
    fontSize: 16,
  },
});
