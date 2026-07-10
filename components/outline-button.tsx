import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

import { colors, fonts } from '@/lib/theme';

type Props = {
  label: string;
  onPress: () => void;
  color?: string;
  disabled?: boolean;
  style?: ViewStyle;
  // Spoken name when the visible label carries an emoji a screen reader would
  // otherwise read verbatim (e.g. "📷 Fotoğraf Ekle" → "Fotoğraf ekle").
  accessibilityLabel?: string;
};

export default function OutlineButton({
  label,
  onPress,
  color = colors.petrol,
  disabled = false,
  style,
  accessibilityLabel,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.button,
        { borderColor: color },
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text style={[styles.label, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderWidth: 1.5,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignSelf: 'stretch',
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.45,
  },
  label: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 16,
  },
});
