import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import OutlineButton from '@/components/outline-button';
import PrimaryButton from '@/components/primary-button';
import { FLAG_REASONS, submitFlag, type FlagReason } from '@/lib/flags';
import { friendlyDbError } from '@/lib/supabase';
import { colors, fonts } from '@/lib/theme';

// Accessible "report a problem with this report" form, shown inline on the
// report detail. Reason is a required single-select (radio semantics, never
// colour-alone — the chosen one is filled AND announced checked); detail is
// optional. Neutral confirmation, no scores, no accusatory copy. The DB keeps
// it private and rate-limited; nothing here deletes the report.
export default function FlagForm({
  reportId,
  onClose,
}: {
  reportId: string;
  onClose: () => void;
}) {
  const [reason, setReason] = useState<FlagReason | null>(null);
  const [detail, setDetail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const send = async () => {
    if (!reason || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      // recorded=false means this session already flagged it — same neutral
      // outcome, so we confirm either way.
      await submitFlag(reportId, reason, detail);
      setDone(true);
    } catch (err) {
      setError(friendlyDbError(err, 'Bildirim gönderilemedi. Bağlantını kontrol edip tekrar dene.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <View style={styles.box}>
        <Text style={styles.doneText} accessibilityRole="alert">
          İncelenmek üzere iletildi. Teşekkürler.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.box}>
      <Text style={styles.heading} accessibilityRole="header">
        Bu kayıtla ilgili bir sorun mu var?
      </Text>
      <Text style={styles.sub}>
        Bir neden seç; istersen kısaca açıkla. Bildirim site yönetimince incelenir —
        kayıt otomatik olarak silinmez.
      </Text>

      <View accessibilityRole="radiogroup">
        {FLAG_REASONS.map((r) => {
          const selected = reason === r.slug;
          return (
            <Pressable
              key={r.slug}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              // RN-Web doesn't emit aria-checked from accessibilityState here,
              // so set it explicitly — the checked state must reach the AT.
              aria-checked={selected}
              accessibilityLabel={r.label}
              onPress={() => setReason(r.slug)}
              style={styles.reasonRow}
            >
              <View style={[styles.radio, selected && styles.radioOn]}>
                {selected ? <View style={styles.radioDot} /> : null}
              </View>
              <Text style={[styles.reasonText, selected && styles.reasonTextOn]}>{r.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <TextInput
        style={styles.input}
        placeholder="Kısaca açıkla (opsiyonel)"
        placeholderTextColor={colors.inkMuted}
        accessibilityLabel="Açıklama (opsiyonel)"
        multiline
        maxLength={500}
        value={detail}
        onChangeText={setDetail}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <PrimaryButton
        label={submitting ? 'Gönderiliyor…' : 'Gönder'}
        onPress={send}
        disabled={!reason || submitting}
      />
      <OutlineButton label="Vazgeç" onPress={onClose} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    gap: 12,
    borderWidth: 1.5,
    borderColor: colors.ink,
    borderRadius: 6,
    padding: 16,
    marginTop: 8,
  },
  heading: { fontFamily: fonts.sansSemiBold, fontSize: 17, color: colors.ink },
  sub: { fontFamily: fonts.sans, fontSize: 14, color: colors.inkMuted, lineHeight: 20 },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 44,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { borderColor: colors.petrol },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.petrol },
  reasonText: { flex: 1, fontFamily: fonts.sans, fontSize: 15, color: colors.ink },
  reasonTextOn: { fontFamily: fonts.sansSemiBold, color: colors.petrol },
  input: {
    borderWidth: 1.5,
    borderColor: colors.ink,
    borderRadius: 6,
    minHeight: 72,
    padding: 12,
    fontFamily: fonts.sans,
    fontSize: 16,
    color: colors.ink,
    textAlignVertical: 'top',
  },
  error: { fontFamily: fonts.sans, fontSize: 14, color: colors.terracottaText, lineHeight: 20 },
  doneText: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.mossText },
});
