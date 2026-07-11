import { Pressable, StyleSheet, Text } from 'react-native';

import Icon from '@/components/icon';
import type { CategorySlug } from '@/lib/categories';
import { colors, fonts } from '@/lib/theme';

type Props = {
  label: string;
  slug: CategorySlug;
  onPress: () => void;
};

// FRONTEND.md §2: large tap targets, min 64px tall, icon + label. The picker
// is the highest-traffic screen — quiet, plain, fast. The icon flips to its
// paper-tone print when the tile is pressed (petrol surface).
export default function CategoryTile({ label, slug, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
    >
      {({ pressed }) => (
        <>
          <Icon name={slug} size={38} tone={pressed ? 'paper' : 'ink'} />
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
