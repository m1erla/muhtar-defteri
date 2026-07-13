import { Stack } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Page from '@/components/page';

import {
  useDisplaySettings,
  type TextScale,
  type ThemePref,
} from '@/lib/display-settings';
import { colors, fonts } from '@/lib/theme';

// Görünüm ve Erişilebilirlik — theme, contrast, text size, motion. All applied
// live and persisted (localStorage) by the display-settings provider. Controls
// are keyboard-focusable, ≥44px, and never signal state by colour alone (the
// selected option is filled AND announced — the segmented controls are a
// radiogroup of radios so a screen reader hears "N of 3, selected").

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.block}>
      <Text style={styles.label} accessibilityRole="header">
        {label}
      </Text>
      <View style={styles.segRow} accessibilityRole="radiogroup" accessibilityLabel={label}>
        {options.map((o) => {
          const selected = o.value === value;
          return (
            <Pressable
              key={o.value}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              // RN-Web doesn't emit aria-checked from accessibilityState here
              // (same quirk handled in flag-form.tsx) — set it explicitly so the
              // active choice reaches assistive tech.
              aria-checked={selected}
              onPress={() => onChange(o.value)}
              style={[styles.seg, selected && styles.segOn]}
            >
              <Text style={[styles.segText, selected && styles.segTextOn]}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function Toggle({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}
      onPress={() => onChange(!value)}
      style={styles.toggleRow}
    >
      <View style={styles.toggleText}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.hint}>{hint}</Text>
      </View>
      <View style={[styles.pill, value && styles.pillOn]}>
        <Text style={[styles.pillText, value && styles.pillTextOn]}>{value ? 'Açık' : 'Kapalı'}</Text>
      </View>
    </Pressable>
  );
}

export default function Settings() {
  const s = useDisplaySettings();
  return (
    <>
      <Stack.Screen options={{ title: 'Görünüm' }} />
      <Page contentStyle={styles.content}>
        <Text style={styles.heading} accessibilityRole="header">
          Görünüm ve Erişilebilirlik
        </Text>
        <Text style={styles.sub}>
          Bu ayarlar bu cihazda saklanır; hesap gerekmez.
        </Text>

        <Segmented<ThemePref>
          label="Tema"
          value={s.themePref}
          onChange={s.setThemePref}
          options={[
            { value: 'system', label: 'Sistem' },
            { value: 'light', label: 'Açık' },
            { value: 'dark', label: 'Koyu' },
          ]}
        />

        <Segmented<TextScale>
          label="Yazı boyutu"
          value={s.textScale}
          onChange={s.setTextScale}
          options={[
            { value: 'md', label: 'Normal' },
            { value: 'lg', label: 'Büyük' },
            { value: 'xl', label: 'Daha büyük' },
          ]}
        />

        <Toggle
          label="Yüksek kontrast"
          hint="Renkleri sadeleştirir, metni koyulaştırır."
          value={s.contrast}
          onChange={s.setContrast}
        />

        <Toggle
          label="Hareketi azalt"
          hint="Geçiş ve animasyonları en aza indirir."
          value={s.reducedMotion}
          onChange={s.setReducedMotion}
        />
      </Page>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  content: {
    padding: 20,
    gap: 20,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
    paddingBottom: 40,
  },
  heading: { fontFamily: fonts.sansSemiBold, fontSize: 24, color: colors.ink, marginTop: 8 },
  sub: { fontFamily: fonts.sans, fontSize: 15, color: colors.inkMuted, marginTop: -8 },
  block: { gap: 10 },
  label: { fontFamily: fonts.sansSemiBold, fontSize: 16, color: colors.ink },
  hint: { fontFamily: fonts.sans, fontSize: 13, color: colors.inkMuted, marginTop: 2 },
  segRow: { flexDirection: 'row', gap: 8 },
  seg: {
    flex: 1,
    minHeight: 48,
    borderWidth: 1.5,
    borderColor: colors.ink,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  segOn: { backgroundColor: colors.petrol, borderColor: colors.petrol },
  segText: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.ink, textAlign: 'center' },
  segTextOn: { color: colors.paper },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    minHeight: 48,
  },
  toggleText: { flex: 1 },
  pill: {
    minWidth: 74,
    minHeight: 40,
    borderWidth: 1.5,
    borderColor: colors.ink,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  pillOn: { backgroundColor: colors.petrol, borderColor: colors.petrol },
  pillText: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.ink },
  pillTextOn: { color: colors.paper },
});
