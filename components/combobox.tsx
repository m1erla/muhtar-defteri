import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { trMatch } from '@/lib/tr-normalize';
import { colors, fonts } from '@/lib/theme';

export type Option = { value: string; label: string };

// A small accessible searchable select. Built for the Adana district list (and
// reusable): a labelled trigger that expands to a Turkish-aware search field and
// a filtered option list. Keyboard: type to filter, Enter selects the first
// match, Escape closes. Every option is a focusable button announced to screen
// readers with its selected state — the meaning never rides on colour alone.
// Colours come from theme tokens, so it follows light/dark/high-contrast.
export default function Combobox({
  label,
  placeholder,
  value,
  options,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string | null;
  options: Option[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selected = options.find((o) => o.value === value) ?? null;
  const filtered = useMemo(
    () => options.filter((o) => trMatch(o.label, query)),
    [options, query]
  );

  const choose = (v: string) => {
    onChange(v);
    setOpen(false);
    setQuery('');
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label} nativeID={`cb-${label}`}>
        {label}
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${selected ? selected.label : placeholder}`}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((o) => !o)}
        style={styles.trigger}
      >
        <Text style={[styles.triggerText, !selected && styles.placeholder]} numberOfLines={1}>
          {selected ? selected.label : placeholder}
        </Text>
        <Text style={styles.chevron}>{open ? '▴' : '▾'}</Text>
      </Pressable>

      {open ? (
        <View style={styles.panel}>
          <TextInput
            style={styles.search}
            placeholder="Ara…"
            placeholderTextColor={colors.inkMuted}
            accessibilityLabel={`${label} içinde ara`}
            value={query}
            onChangeText={setQuery}
            autoFocus
            onKeyPress={(e) => {
              const key = (e.nativeEvent as { key?: string }).key;
              if (key === 'Escape') setOpen(false);
              else if (key === 'Enter' && filtered[0]) choose(filtered[0].value);
            }}
          />
          <ScrollView style={styles.list} keyboardShouldPersistTaps="handled" nestedScrollEnabled>
            {filtered.length === 0 ? (
              <Text style={styles.empty}>Sonuç yok</Text>
            ) : (
              filtered.map((o) => {
                const isSel = o.value === value;
                return (
                  <Pressable
                    key={o.value}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSel }}
                    onPress={() => choose(o.value)}
                    style={[styles.option, isSel && styles.optionSel]}
                  >
                    <Text style={[styles.optionText, isSel && styles.optionTextSel]}>
                      {isSel ? '✓ ' : ''}
                      {o.label}
                    </Text>
                  </Pressable>
                );
              })
            )}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { fontFamily: fonts.sansSemiBold, fontSize: 16, color: colors.ink },
  trigger: {
    minHeight: 48,
    borderWidth: 1.5,
    borderColor: colors.ink,
    borderRadius: 6,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  triggerText: { flex: 1, fontFamily: fonts.sans, fontSize: 16, color: colors.ink },
  placeholder: { color: colors.inkMuted },
  chevron: { fontFamily: fonts.sans, fontSize: 14, color: colors.petrol },
  panel: {
    borderWidth: 1.5,
    borderColor: colors.ink,
    borderRadius: 6,
    overflow: 'hidden',
  },
  search: {
    minHeight: 44,
    paddingHorizontal: 12,
    fontFamily: fonts.sans,
    fontSize: 16,
    color: colors.ink,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.ink,
  },
  list: { maxHeight: 240 },
  option: { minHeight: 44, paddingHorizontal: 12, justifyContent: 'center' },
  optionSel: { backgroundColor: colors.pressOverlay },
  optionText: { fontFamily: fonts.sans, fontSize: 16, color: colors.ink },
  optionTextSel: { fontFamily: fonts.sansSemiBold, color: colors.petrol },
  empty: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.inkMuted,
    padding: 12,
  },
});
