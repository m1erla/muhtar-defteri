import { Image } from 'expo-image';
import { Platform, View } from 'react-native';

// A thin Adana skyline band (Sabancı Camii's six minarets, the Taşköprü, palms,
// the Seyhan) used as a quiet footer accent. Now the AI-generated transparent
// art (public/decor/skyline-band.webp) so it matches the margin panels; the
// transparency means it reads on both the light and dark ledger. Decorative —
// aria-hidden, pointer-events:none, web-only. `opacity` keeps it faint.
export default function AdanaSkyline({ opacity = 0.5 }: { opacity?: number }) {
  if (Platform.OS !== 'web') return null;
  return (
    <View style={{ width: '100%', opacity, alignItems: 'center' }} pointerEvents="none">
      <Image
        source={{ uri: '/decor/skyline-band.webp' }}
        style={{ width: '100%', maxWidth: 640, aspectRatio: 1600 / 333 }}
        contentFit="contain"
        accessibilityLabel=""
        accessible={false}
      />
    </View>
  );
}
