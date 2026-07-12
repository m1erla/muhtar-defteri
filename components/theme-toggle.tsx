import { Pressable, StyleSheet } from 'react-native';

import Icon from '@/components/icon';
import { useDisplaySettings } from '@/lib/display-settings';

// One-tap light/dark switch for the navbar (header). Flips to the opposite of
// the currently shown theme (moving off 'system' once the user chooses, which
// is what an explicit toggle should do). The full three-way control + text
// size + contrast still live on the Settings screen. Accessible: real button,
// 44px target, action-describing label; the icon is decorative alongside it.
export default function ThemeToggle() {
  const { resolvedTheme, setThemePref } = useDisplaySettings();
  const isDark = resolvedTheme === 'dark';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={isDark ? 'Açık temaya geç' : 'Koyu temaya geç'}
      onPress={() => setThemePref(isDark ? 'light' : 'dark')}
      style={styles.button}
      hitSlop={8}
    >
      {/* Sun in dark mode (tap → light), moon in light mode (tap → dark). Tone
          follows the header: light icon on the dark header, dark on the light. */}
      <Icon name={isDark ? 'sun' : 'moon'} size={24} tone={isDark ? 'paper' : 'ink'} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
});
