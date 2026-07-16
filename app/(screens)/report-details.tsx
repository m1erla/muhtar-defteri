import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Redirect, Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import Combobox from '@/components/combobox';
import Icon from '@/components/icon';
import LoadStateView from '@/components/load-state-view';
import OutlineButton from '@/components/outline-button';
import PrimaryButton from '@/components/primary-button';
import { ADANA_DISTRICTS, getDistrict } from '@/lib/adana-districts';
import { useResolvedTheme } from '@/lib/display-settings';
import { inAdana, searchAdanaAddress, type GeoResult } from '@/lib/geocode';
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
  const [district, setDistrict] = useState<string | null>(null);
  // Address search (Adana-bounded forward geocode). User-triggered, not
  // per-keystroke (Nominatim policy). Results let the user drop a pin by typing
  // a mahalle/cadde/adres instead of hunting on the map.
  const [addressQuery, setAddressQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<GeoResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  // Bumping `focusKey` jumps+zooms the map to the current coords (district pick /
  // geolocation / address pick) without a jump on every pin drag. `focusZoom` is
  // the level.
  const [focusKey, setFocusKey] = useState(0);
  const [focusZoom, setFocusZoom] = useState(16);

  // Clear a pending address-search result list — called whenever the user sets
  // the location another way, so a stale list never lingers under the map.
  const clearResults = () => {
    setResults([]);
    setSearched(false);
    setSearchError(null);
  };

  // Move+zoom the map to the current coords and drop any stale search results.
  // EVERY location method ends with this, so a new one can't forget the
  // focusKey bump — the bump (not setCoords) is what actually re-centers.
  const jumpTo = (zoom: number) => {
    setFocusZoom(zoom);
    setFocusKey((k) => k + 1);
    clearResults();
  };

  // The non-map way to set location: pick a district and the map jumps to it.
  // Accessible (keyboard/screen-reader) — the map is never the only path.
  const pickDistrict = (slug: string) => {
    const d = getDistrict(slug);
    if (!d) return;
    setDistrict(slug);
    setCoords({ latitude: d.latitude, longitude: d.longitude });
    setAddressQuery('');
    setLocationError(null);
    jumpTo(d.zoom);
  };

  // Type an address / mahalle / cadde → Adana-bounded geocode → results to pick
  // from. Triggered by the button or the keyboard's search key, never on every
  // keystroke. Clears prior results up front so a failed re-search can't leave
  // the old list showing next to the error banner.
  const searchAddress = async () => {
    const q = addressQuery.trim();
    if (q.length < 3 || searching) return;
    setSearching(true);
    setSearchError(null);
    setResults([]);
    setSearched(false);
    try {
      const found = await searchAdanaAddress(q);
      setResults(found);
      setSearched(true);
    } catch {
      setSearchError(
        'Adres araması yapılamadı. Haritadan işaretleyebilir ya da "Konumumu Bul" diyebilirsin.'
      );
    } finally {
      setSearching(false);
    }
  };

  // Editing the query invalidates the previous result list / "not found", so a
  // stale result can't stay tappable (or a false "bulunamadı" linger) for text
  // that no longer matches what was searched.
  const onQueryChange = (t: string) => {
    setAddressQuery(t);
    if (results.length > 0 || searched || searchError) clearResults();
  };

  // Pick a search result: drop the pin there and let the user fine-tune by drag.
  const pickResult = (r: GeoResult) => {
    setCoords({ latitude: r.latitude, longitude: r.longitude });
    setAddressQuery(r.label);
    setDistrict(null);
    setLocationError(null);
    jumpTo(17);
  };

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
      // A device outside the province must not move the pin: this defter is
      // Adana-only, and out-of-box coordinates would only fail at the DB three
      // screens later. Say it here, at the moment it happens.
      if (!inAdana(pos.coords.latitude, pos.coords.longitude)) {
        setLocationError(
          'Konumun Adana sınırları dışında görünüyor — bu defter yalnızca Adana içindeki sorunlar için. Pini elle ya da adres/ilçe seçerek yerleştirebilirsin.'
        );
        return;
      }
      setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      setAddressQuery('');
      jumpTo(16);
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
  // Privacy nudge (soft, never blocks): a run of 10+ digits separated only by
  // phone-like characters reads as a phone / TC number. Catches "0532 123 45 67"
  // and "05321234567" but not short institutional numbers (185, 444 27 54) or
  // dates. The record is public, so we suggest — we don't stop the user.
  const looksLikePhone = /(?:\d[\s\-().]?){10,}/.test(trimmed);
  const qualityHint =
    trimmed.length === 0
      ? null
      : looksLikePhone
        ? 'İpucu: açıklamada telefon numarası gibi görünen bir bilgi var. Kayıt herkese açık olacağı için kişisel numaranı paylaşmamanı öneririz.'
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
        <Text style={styles.qualityHint}>
          Fotoğrafta başkalarının yüzü, aracı veya kişisel bilgileri varsa paylaşmamaya özen göster.
        </Text>

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

            {/* Type-an-address path: search a mahalle/cadde/adres within Adana
                and drop the pin on a result. Fine-tune by dragging; if nothing
                matches, fall back to the district picker or "Konumumu Bul". */}
            <View style={styles.searchRow}>
              <TextInput
                style={styles.searchInput}
                placeholder="Adres, mahalle veya cadde ara"
                placeholderTextColor={colors.inkMuted}
                accessibilityLabel="Adres ara"
                value={addressQuery}
                onChangeText={onQueryChange}
                onSubmitEditing={searchAddress}
                returnKeyType="search"
                autoCorrect={false}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Adresi ara"
                onPress={searchAddress}
                disabled={searching || addressQuery.trim().length < 3}
                style={styles.searchBtn}
              >
                <Text style={styles.searchBtnText}>{searching ? 'Aranıyor…' : 'Ara'}</Text>
              </Pressable>
            </View>
            {/* The typed text is sent to an external map service (OpenStreetMap)
                to find coordinates — so steer people toward place names, not
                personal info. */}
            <Text style={styles.qualityHint}>
              Aramayı harita servisi (OpenStreetMap) yapar — kutuya kişisel bilgi değil,
              adres/mahalle/cadde yaz.
            </Text>

            {results.length > 0 ? (
              <View style={styles.results} accessibilityRole="menu">
                {results.map((r, i) => (
                  <Pressable
                    key={`${r.latitude},${r.longitude},${i}`}
                    accessibilityRole="menuitem"
                    accessibilityLabel={r.label}
                    onPress={() => pickResult(r)}
                    style={styles.resultRow}
                  >
                    <Icon name="pin" size={16} tone={iconTone} />
                    <Text style={styles.resultText} numberOfLines={2}>
                      {r.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : searched ? (
              <Text style={styles.qualityHint}>
                Adres bulunamadı. İlçe seçebilir, haritadan işaretleyebilir ya da "Konumumu Bul"
                diyebilirsin.
              </Text>
            ) : null}
            {searchError ? <Text style={styles.locationError}>{searchError}</Text> : null}

            {/* Non-map fallback (accessibility, works offline): pick an Adana
                district and the map jumps there; fine-tune with the pin. */}
            <Combobox
              label="İlçe seç"
              placeholder="İlçe seç (Adana)"
              value={district}
              options={ADANA_DISTRICTS.map((d) => ({ value: d.slug, label: d.name }))}
              onChange={pickDistrict}
            />

            {locationError ? <Text style={styles.locationError}>{locationError}</Text> : null}
            <View style={styles.mapBox}>
              {MapView ? (
                <MapView
                  latitude={pin.latitude}
                  longitude={pin.longitude}
                  focusZoom={focusZoom}
                  focusKey={focusKey}
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
                : 'Konum henüz ayarlanmadı — adres ara, ilçe seç, pini sürükle ya da "Konumumu Bul" de'}
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
  searchRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'stretch',
  },
  searchInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.ink,
    borderRadius: 6,
    minHeight: 48,
    paddingHorizontal: 12,
    fontFamily: fonts.sans,
    fontSize: 16,
    color: colors.ink,
  },
  searchBtn: {
    minHeight: 48,
    minWidth: 72,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: colors.petrol,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBtnText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
    color: colors.paper,
  },
  results: {
    borderWidth: 1.5,
    borderColor: colors.ink,
    borderRadius: 6,
    overflow: 'hidden',
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 44,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.ink,
  },
  resultText: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.ink,
    lineHeight: 20,
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
