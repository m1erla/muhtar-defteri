// Subpath imports on purpose: importing from the package index makes Metro
// bundle every weight/italic variant (~5MB of TTFs for the 4 we use).
import { IBMPlexMono_400Regular } from '@expo-google-fonts/ibm-plex-mono/400Regular';
import { IBMPlexMono_500Medium } from '@expo-google-fonts/ibm-plex-mono/500Medium';
import { WorkSans_400Regular } from '@expo-google-fonts/work-sans/400Regular';
import { WorkSans_600SemiBold } from '@expo-google-fonts/work-sans/600SemiBold';
import { useFonts } from 'expo-font';
import { Stack, usePathname, useRouter, type ErrorBoundaryProps } from 'expo-router';
import Head from 'expo-router/head';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import OutlineButton from '@/components/outline-button';
import SideDecor from '@/components/side-decor';
import ThemeToggle from '@/components/theme-toggle';
import { DisplaySettingsProvider } from '@/lib/display-settings';
import { colors, fonts } from '@/lib/theme';

// A back control that never vanishes. The default header back button only shows
// when the JS navigation stack has a previous entry — so it disappeared after a
// full reload, a directly-opened link (a shared /report-detail), or any
// router.replace() (routing-result "Bitti", add-to-map submit/cancel), which all
// leave the target with no back entry. This always renders on non-home screens
// and falls back to Home when there's genuinely nowhere to go back to.
function HeaderBack() {
  const router = useRouter();
  const pathname = usePathname();
  // Home is the root — no back control there.
  if (pathname === '/home' || pathname === '/' || pathname === '/index') return null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Geri"
      onPress={() => (router.canGoBack() ? router.back() : router.replace('/home'))}
      style={hb.btn}
      hitSlop={8}
    >
      <Text style={hb.text}>‹ Geri</Text>
    </Pressable>
  );
}

const hb = StyleSheet.create({
  btn: {
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    paddingRight: 12,
    paddingLeft: 2,
  },
  text: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 17,
    color: colors.ink,
  },
});

// expo-router renders this instead of a blank white screen if any route throws.
// Stability is a scored competition criterion; keep it plain and on-brand.
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <View style={eb.container}>
      <Text style={eb.title}>Bir şeyler ters gitti</Text>
      <Text style={eb.body}>
        Beklenmedik bir hata oluştu. Tekrar deneyebilir ya da sayfayı yenileyebilirsin.
      </Text>
      <OutlineButton label="Tekrar dene" onPress={retry} />
      {__DEV__ ? <Text style={eb.detail}>{error.message}</Text> : null}
    </View>
  );
}

const eb = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
    padding: 24,
    gap: 14,
    justifyContent: 'center',
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
  },
  title: { fontFamily: fonts.sansSemiBold, fontSize: 22, color: colors.ink },
  body: { fontFamily: fonts.sans, fontSize: 16, color: colors.ink, lineHeight: 23 },
  detail: { fontFamily: fonts.mono, fontSize: 12, color: colors.inkMuted, marginTop: 8 },
});

export default function RootLayout() {
  // Not gated on `loaded`: screens render with fallback fonts and swap in —
  // blanking the app while fonts load would hurt the scored first-load time.
  useFonts({
    WorkSans_400Regular,
    WorkSans_600SemiBold,
    IBMPlexMono_400Regular,
    IBMPlexMono_500Medium,
  });

  return (
    <DisplaySettingsProvider>
      <Head>
        {/* Default browser-tab title — includes the city so a shared link or a
            bookmarked tab reads as an Adana app. Per-screen titles override it. */}
        <title>Mahalle Defteri · Adana</title>
      </Head>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.paper },
          headerTintColor: colors.ink,
          headerTitleStyle: { color: colors.ink, fontFamily: fonts.sansSemiBold },
          contentStyle: { backgroundColor: colors.paper },
          headerLeft: () => <HeaderBack />,
          headerRight: () => <ThemeToggle />,
        }}
      />
      {/* Decorative margins on wide screens (web-only, ≥980px) — never touches
          the centred content. */}
      <SideDecor />
    </DisplaySettingsProvider>
  );
}
