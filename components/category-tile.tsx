import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, fonts } from '@/lib/theme';

type Props = {
  label: string;
  emoji: string;
  onPress: () => void;
};

// FRONTEND.md §2: large tap targets, min 64px tall, icon + label. The picker
// is the highest-traffic screen — quiet, plain, fast.
export default function CategoryTile({ label, emoji, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
    >
      {({ pressed }) => (
        <>
          <Text style={styles.emoji}>{emoji}</Text>
          <Text style={[styles.label, pressed && styles.labelPressed]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    minHeight: 76,
    borderWidth: 1.5,
    borderColor: colors.ink,
    borderRadius: 6,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  pressed: {
    backgroundColor: colors.petrol,
    borderColor: colors.petrol,
  },
  emoji: {
    fontSize: 26,
  },
  label: {
    flex: 1,
    color: colors.ink,
    fontFamily: fonts.sansSemiBold,
    fontSize: 17,
  },
  labelPressed: {
    color: colors.paper,
  },
});
