import * as Location from 'expo-location';
import { Redirect, Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import PrimaryButton from '@/components/primary-button';
import Sivri from '@/components/sivri';
import { useResolvedTheme } from '@/lib/display-settings';
import { signalReportAdded } from '@/lib/flash';
import { getDraft, resetDraft } from '@/lib/report-draft';
import { submitReport } from '@/lib/reports';
import { friendlyDbError } from '@/lib/supabase';
import { colors, fonts, PALETTES } from '@/lib/theme';

type SubmitState = 'idle' | 'locating' | 'submitting' | 'error';

export default function AddToMap() {
  const router = useRouter();
  const draft = getDraft();
  const [state, setState] = useState<SubmitState>('idle');
  const [errorText, setErrorText] = useState<string | null>(null);
  // Resolve the spinner colour at the top level — never inside the `busy` JSX
  // branch, or the hook would be called conditionally (a crash the moment busy
  // flips true on submit).
  const spinnerColor = PALETTES[useResolvedTheme()].petrol;

  if (!draft.category) {
    return <Redirect href="/report-category" />;
  }
  const category = draft.category;

  const submit = async () => {
    setErrorText(null);
    let { latitude, longitude } = draft;

    // The map needs a location. If the user skipped it on the details screen,
    // ask right here — this runs from the button press, so the browser prompt
    // is user-gesture-initiated (Safari cares).
    if (latitude == null || longitude == null) {
      setState('locating');
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') throw new Error('denied');
        // Race a hard timeout: dismissing (not denying) the browser's location
        // prompt can leave getCurrentPositionAsync pending forever, which would
        // strand the screen in 'locating' with every button unmounted.
        const pos = await Promise.race([
          Location.getCurrentPositionAsync({}),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 10_000)),
        ]);
        latitude = pos.coords.latitude;
        longitude = pos.coords.longitude;
      } catch {
        setState('error');
        setErrorText(
          'Haritaya eklemek için konum gerekli. Konum iznini ver ya da detaylara dönüp pini elle yerleştir.'
        );
        return;
      }
    }

    setState('submitting');
    try {
      await submitReport({
        category,
        description: draft.description,
        photoUri: draft.photoUri,
        latitude,
        longitude,
      });
      signalReportAdded();
      resetDraft();
      router.replace('/map-list');
    } catch (err) {
      setState('error');
      setErrorText(friendlyDbError(err, 'Kayıt eklenemedi. Bağlantını kontrol edip tekrar dene.'));
    }
  };

  const busy = state === 'locating' || state === 'submitting';

  return (
    <>
      <Stack.Screen options={{ title: 'Haritaya Ekle' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={{ alignItems: 'center' }}>
          <Sivri size={88} mood="idle" />
        </View>
        <Text style={styles.heading} accessibilityRole="header">
          Haritaya eklemek ister misin?
        </Text>
        <Text style={styles.body}>
          Fotoğrafın ve yaklaşık konumun herkese açık haritada görünür. Kişisel bilgin paylaşılmaz.
        </Text>
        <Text style={styles.bodyDim}>
          Başkalarının yüzü, aracı veya kişisel bilgileri görünüyorsa paylaşmamaya özen göster.
        </Text>
        <Text style={styles.bodyDim}>
          Bu adım isteğe bağlı — resmi kanala başvurunu zaten yaptın ya da yapabilirsin. Haritaya
          eklemek sadece sorunun kaydını mahallen için görünür kılar.
        </Text>

        {errorText ? <Text style={styles.error}>{errorText}</Text> : null}

        {busy ? (
          <View style={styles.busyRow}>
            <ActivityIndicator color={spinnerColor} />
            <Text style={styles.bodyDim}>
              {state === 'locating' ? 'Konum alınıyor…' : 'Kayıt ekleniyor…'}
            </Text>
          </View>
        ) : (
          <>
            <PrimaryButton label="Evet, Ekle" onPress={submit} />
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                resetDraft();
                router.replace('/home');
              }}
            >
              <Text style={styles.skip}>Hayır, Geç</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  content: {
    padding: 20,
    gap: 16,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
  },
  heading: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 24,
    color: colors.ink,
    marginTop: 8,
  },
  body: {
    fontFamily: fonts.sans,
    fontSize: 16,
    color: colors.ink,
    lineHeight: 23,
  },
  bodyDim: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.inkMuted,
    lineHeight: 21,
  },
  error: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.terracottaText,
    lineHeight: 21,
  },
  busyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  skip: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 16,
    color: colors.petrol,
    textAlign: 'center',
    paddingVertical: 12,
    minHeight: 44,
  },
});
