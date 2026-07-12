import { StyleSheet, View } from 'react-native';

import Icon, { type IconName } from '@/components/icon';
import { FALLBACK_TINT, getCategory } from '@/lib/categories';
import { colors } from '@/lib/theme';

// The category's colour-coded mark: the hand-drawn Riso icon inside a soft
// accent-tinted rounded container (the per-category `tint` in lib/categories.ts).
// One component for every surface that shows a category — picker tiles, ledger
// rows, the Kanal Rehberi directory, the report-detail header — so the colour
// identity stays consistent and lives in exactly one place.
//
// Colour is never the only cue: a text label always sits beside this mark, and
// the ink icon on the tint clears WCAG's 3:1 non-text contrast with room to
// spare. On a pressed picker tile (petrol surface) the chip drops out and the
// icon prints in paper tone, matching the tile's inverted state.
export default function CategoryMark({
  slug,
  size = 52,
  iconSize,
  pressed = false,
}: {
  slug: IconName;
  size?: number;
  iconSize?: number;
  pressed?: boolean;
}) {
  const tint = getCategory(slug)?.tint ?? FALLBACK_TINT;
  const inner = iconSize ?? Math.round(size * 0.62);
  return (
    <View
      style={[
        styles.chip,
        { width: size, height: size, borderRadius: Math.round(size * 0.28) },
        pressed
          ? { backgroundColor: 'transparent', borderColor: 'transparent' }
          : { backgroundColor: tint, borderColor: colors.ink },
      ]}
    >
      <Icon name={slug} size={inner} tone={pressed ? 'paper' : 'ink'} />
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    justifyContent: 'center',
    // Hairline ink edge gives every chip a stable outline (prompt §13) so even
    // the palest tint reads as a distinct area on the cream tile.
    borderWidth: StyleSheet.hairlineWidth,
  },
});
