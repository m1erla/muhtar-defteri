import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Redirect, Stack, useRouter } from 'expo-router';
import { useEffect, useState, type ComponentType } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import PrimaryButton from '@/components/primary-button';
import { getDraft, updateDraft } from '@/lib/report-draft';
import { colors, fonts } from '@/lib/theme';

// Seyhan, Adana — the pin's default before the user shares their location.
const ADANA_CENTER = { latitude: 36.9914, longitude: 35.3308 };

type MapProps = {
  latitude: number;
  longitude: number;
  onMove: (latitude: number, longitude: number) => void;
};

export default function ReportDetails() {
  const router = useRouter();
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

  // The map library is the heaviest dependency in the app — loaded lazily,
  // client-side only (leaflet touches `window` at import, breaking static render).
  const [MapView, setMapView] = useState<ComponentType<MapProps> | null>(null);
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    let live = true;
    import('@/components/maps').then(
      (mod) => live && setMapView(() => mod.LocationPickerMap),
      () => undefined
    );
    return () => {
      live = false;
    };
  }, []);

  // Photo picking must fire directly from onPress — browsers silently block
  // the file dialog otherwise (CLAUDE.md gotcha).
  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
      updateDraft({ photoUri: result.assets[0].uri });
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
      const pos = await Location.getCurrentPositionAsync({});
      const next = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      setCoords(next);
      updateDraft(next);
    } catch {
      setLocationError('Konum alınamadı. Pini elle sürükleyebilirsin.');
    } finally {
      setLocating(false);
    }
  };

  if (!draft.category) {
    return <Redirect href="/report-category" />;
  }

  const pin = coords ?? ADANA_CENTER;

  return (
    <>
      <Stack.Screen options={{ title: 'Detaylar' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Detayları ekle</Text>
        <Text style={styles.sub}>Hepsi opsiyonel — istersen doğrudan devam et.</Text>

        <TextInput
          style={styles.input}
          placeholder="Kısaca anlat..."
          placeholderTextColor="#2B262080"
          multiline
          maxLength={500}
          value={description}
          onChangeText={(text) => {
            setDescription(text);
            updateDraft({ description: text });
          }}
        />

        {photoUri ? (
          <View style={styles.photoRow}>
            <Image source={{ uri: photoUri }} style={styles.photoThumb} contentFit="cover" />
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setPhotoUri(null);
                updateDraft({ photoUri: null });
              }}
            >
              <Text style={styles.link}>Fotoğrafı kaldır</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable accessibilityRole="button" onPress={pickPhoto} style={styles.outlineButton}>
            <Text style={styles.outlineButtonLabel}>📷 Fotoğraf Ekle</Text>
          </Pressable>
        )}

        <View style={styles.locationHeader}>
          <Text style={styles.sectionLabel}>Konum</Text>
          <Pressable accessibilityRole="button" onPress={locate} disabled={locating}>
            <Text style={styles.link}>{locating ? 'Konum aranıyor…' : '📍 Konumumu Bul'}</Text>
          </Pressable>
        </View>
        {locationError ? <Text style={styles.locationError}>{locationError}</Text> : null}
        <View style={styles.mapBox}>
          {MapView ? (
            <MapView
              latitude={pin.latitude}
              longitude={pin.longitude}
              onMove={(latitude, longitude) => {
                setCoords({ latitude, longitude });
                updateDraft({ latitude, longitude });
              }}
            />
          ) : (
            <Text style={styles.mapLoading}>Harita yükleniyor…</Text>
          )}
        </View>
        <Text style={styles.mapHint}>Pini sürükleyerek düzeltebilirsin</Text>

        <PrimaryButton label="Devam Et" onPress={() => router.push('/routing-result')} />
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
    color: colors.ink,
    opacity: 0.7,
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
  outlineButton: {
    minHeight: 48,
    borderWidth: 1.5,
    borderColor: colors.petrol,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  outlineButtonLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 16,
    color: colors.petrol,
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
    paddingVertical: 8,
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
    color: colors.terracotta,
  },
  mapBox: {
    height: 220,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.ink,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapLoading: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.ink,
    opacity: 0.6,
  },
  mapHint: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.ink,
    opacity: 0.6,
    marginBottom: 6,
  },
});
