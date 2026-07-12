import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Redirect, Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import Icon from '@/components/icon';
import LoadStateView from '@/components/load-state-view';
import OutlineButton from '@/components/outline-button';
import PrimaryButton from '@/components/primary-button';
import { useResolvedTheme } from '@/lib/display-settings';
import { getDraft, updateDraft } from '@/lib/report-draft';
import { colors, fonts } from '@/lib/theme';
import { useLazyMap } from '@/lib/use-lazy-map';

// Seyhan, Adana — where the map looks before the user sets a real location.
const ADANA_CENTER = { latitude: 36.9914, longitude: 35.3308 };

export default function ReportDetails() {
  const router = useRouter();
  // Standalone icons (no light chip behind them) need light line-art in dark mode.
  const iconTone = useResolvedTheme() === 'dark' ? 'paper' : 'ink';
  const draft = getDraft();

  const [description, setDescription] = useState(draft.description);
  const [photoUri, setPhotoUri] = useState(draft.photoUri);
  const [coords, setCoords] = useState(
    draft.latitude != null && draft.longitude != null
      ? { latitude: draft.latitude, longitude: draft.longitude }
      : null
  );
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const { Map: MapView, failed: mapFailed, retry: retryMap } = useLazyMap('LocationPickerMap');

  // Photo picking must fire directly from onPress — browsers silently block
  // the file dialog otherwise (CLAUDE.md gotcha).
  const pickPhoto = async () => {
    setPhotoError(null);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.7,
      });
      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch {
      setPhotoError('Fotoğraf seçilemedi. Tekrar dene.');
    }
  };

  const locate = async () => {
    setLocating(true);
    setLocationError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Konum izni verilmedi. Pini elle sürükleyebilirsin.');
        return;
      }
      // Race a hard timeout: dismissing (not denying) the browser's location
      // prompt can leave getCurrentPositionAsync pending forever.
      const pos = await Promise.race([
        Location.getCurrentPositionAsync({}),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 10_000)),
      ]);
      setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
    } catch {
      setLocationError('Konum alınamadı. Pini elle sürükleyebilirsin.');
    } finally {
      setLocating(false);
    }
  };

  const continueToRouting = () => {
    // Single commit point: the draft is written once, here — not mirrored on
    // every keystroke.
    updateDraft({
      description,
      photoUri,
      latitude: coords?.latitude ?? null,
      longitude: coords?.longitude ?? null,
    });
    router.push({ pathname: '/routing-result', params: { category: draft.category! } });
  };

  if (!draft.category) {
    return <Redirect href="/report-category" />;
  }

  const pin = coords ?? ADANA_CENTER;

  // Gentle, deterministic (not AI) quality nudge — never blocks submission, the
  // description is optional. Only when the user HAS typed something that reads
  // as low-signal: a handful of characters, or one character repeated.
  const trimmed = description.trim();
  const looksRepeated = trimmed.length >= 4 && /^(.)\1+$/.test(trimmed.replace(/\s/g, ''));
  const qualityHint =
    trimmed.length === 0
      ? null
      : looksRepeated
        ? 'İpucu: birkaç kelimeyle ne olduğunu yazarsan daha kolay anlaşılır.'
        : trimmed.length < 10
          ? 'İpucu: birkaç kelime daha eklersen sorun daha net anlaşılır (zorunlu değil).'
          : null;

  return (
    <>
      <Stack.Screen options={{ title: 'Detaylar' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.heading} accessibilityRole="header">
          Detayları ekle
        </Text>
        <Text style={styles.sub}>Hepsi opsiyonel — istersen doğrudan devam et.</Text>

        <Text style={styles.sectionLabel}>Açıklama</Text>
        <TextInput
          style={styles.input}
          placeholder="Kısaca anlat..."
          placeholderTextColor={colors.inkMuted}
          accessibilityLabel="Açıklama (opsiyonel)"
          multiline
          maxLength={500}
          value={description}
          onChangeText={setDescription}
        />
        {description.length > 0 ? (
          <Text style={styles.counter}>{description.length}/500</Text>
        ) : null}
        {qualityHint ? <Text style={styles.qualityHint}>{qualityHint}</Text> : null}

        {photoUri ? (
          <View style={styles.photoRow}>
            <Image source={{ uri: photoUri }} style={styles.photoThumb} contentFit="cover" accessibilityLabel="Eklediğin fotoğraf" />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Fotoğrafı kaldır"
              onPress={() => setPhotoUri(null)}
            >
              <Text style={styles.link}>Fotoğrafı kaldır</Text>
            </Pressable>
          </View>
        ) : (
          <OutlineButton
            label="Fotoğraf Ekle"
            icon={<Icon name="camera" size={22} tone={iconTone} />}
            accessibilityLabel="Fotoğraf ekle"
            onPress={pickPhoto}
          />
        )}
        {photoError ? <Text style={styles.locationError}>{photoError}</Text> : null}

        {Platform.OS === 'web' ? (
          <>
            <View style={styles.locationHeader}>
              <Text style={styles.sectionLabel}>Konum</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Konumumu bul"
                onPress={locate}
                disabled={locating}
                style={styles.locateLink}
              >
                <Icon name="pin" size={18} tone={iconTone} />
                <Text style={styles.link}>{locating ? 'Konum aranıyor…' : 'Konumumu Bul'}</Text>
              </Pressable>
            </View>
            {locationError ? <Text style={styles.locationError}>{locationError}</Text> : null}
            <View style={styles.mapBox}>
              {MapView ? (
                <MapView
                  latitude={pin.latitude}
                  longitude={pin.longitude}
                  onMove={(latitude: number, longitude: number) =>
                    setCoords({ latitude, longitude })
                  }
                />
              ) : mapFailed ? (
                <LoadStateView message="Harita yüklenemedi." onRetry={retryMap} />
              ) : (
                <LoadStateView loading message="Harita yükleniyor…" />
              )}
            </View>
            <Text style={styles.mapHint}>
              {coords
                ? 'Pini sürükleyerek düzeltebilirsin'
                : 'Konum henüz ayarlanmadı — pini sürükle ya da "Konumumu Bul" de'}
            </Text>
          </>
        ) : null}

        <PrimaryButton label="Devam Et" onPress={continueToRouting} />
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
    gap: 14,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
    paddingBottom: 40,
  },
  heading: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 24,
    color: colors.ink,
    marginTop: 8,
  },
  sub: {
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.inkMuted,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.ink,
    borderRadius: 6,
    minHeight: 96,
    padding: 12,
    fontFamily: fonts.sans,
    fontSize: 16,
    color: colors.ink,
    textAlignVertical: 'top',
  },
  counter: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: colors.inkMuted,
    alignSelf: 'flex-end',
    marginTop: -8,
  },
  qualityHint: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.inkMuted,
    lineHeight: 19,
    marginTop: -4,
  },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  photoThumb: {
    width: 88,
    height: 88,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.ink,
  },
  link: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
    color: colors.petrol,
    paddingVertical: 12,
    minHeight: 44,
  },
  locateLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  sectionLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 16,
    color: colors.ink,
  },
  locationError: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.terracottaText,
  },
  mapBox: {
    height: 220,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.ink,
    overflow: 'hidden',
    alignItems: 'stretch',
    justifyContent: 'center',
  },
  mapHint: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.inkMuted,
    marginBottom: 6,
  },
});
