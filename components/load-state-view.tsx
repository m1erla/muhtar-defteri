import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { useResolvedTheme } from '@/lib/display-settings';
import { colors, fonts, PALETTES } from '@/lib/theme';

// Shared loading/error block for data screens — one place for the spinner,
// the message, and a 44px retry affordance.
export default function LoadStateView({
  loading = false,
  message,
  onRetry,
}: {
  loading?: boolean;
  message?: string | null;
  onRetry?: () => void;
}) {
  // Concrete petrol for the current theme — ActivityIndicator's colour is not a
  // reliable place for a CSS var, and dark mode needs the lighter petrol.
  const spinner = PALETTES[useResolvedTheme()].petrol;
  return (
    <View style={styles.box}>
      {loading ? <ActivityIndicator color={spinner} /> : null}
      {message ? <Text style={styles.text}>{message}</Text> : null}
      {onRetry ? (
        <Pressable accessibilityRole="button" onPress={onRetry}>
          <Text style={styles.retry}>Tekrar dene</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    paddingVertical: 32,
    alignItems: 'center',
    gap: 12,
  },
  text: {
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.inkMuted,
    textAlign: 'center',
  },
  retry: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
    color: colors.petrol,
    paddingVertical: 12,
    minHeight: 44,
  },
});
