import { Image } from 'expo-image';
import { Platform, View } from 'react-native';

import { useResolvedTheme } from '@/lib/display-settings';

// A thin Adana skyline band (Sabancı Camii's six minarets, the Taşköprü, palms,
// the Seyhan) used as a quiet footer accent. Uses the AI art, with a cream-ink
// "night ledger" variant so it reads on the dark theme too. Decorative —
// aria-hidden, pointer-events:none, web-only. `opacity` keeps it faint.
export default function AdanaSkyline({ opacity = 0.5 }: { opacity?: number }) {
  const theme = useResolvedTheme();
  if (Platform.OS !== 'web') return null;
  const src = theme === 'dark' ? '/decor/skyline-band-dark.webp' : '/decor/skyline-band.webp';
  return (
    <View style={{ width: '100%', opacity, alignItems: 'center' }} pointerEvents="none">
      <Image
        source={{ uri: src }}
        style={{ width: '100%', maxWidth: 640, aspectRatio: 1600 / 333 }}
        contentFit="contain"
        accessibilityLabel=""
        accessible={false}
      />
    </View>
  );
}
