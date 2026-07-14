// Subpath imports on purpose: importing from the package index makes Metro
// bundle every weight/italic variant (~5MB of TTFs for the 4 we use).
import { IBMPlexMono_400Regular } from '@expo-google-fonts/ibm-plex-mono/400Regular';
import { IBMPlexMono_500Medium } from '@expo-google-fonts/ibm-plex-mono/500Medium';
import { WorkSans_400Regular } from '@expo-google-fonts/work-sans/400Regular';
import { WorkSans_600SemiBold } from '@expo-google-fonts/work-sans/600SemiBold';
import { useFonts } from 'expo-font';
// DefaultTheme/ThemeProvider come from expo-router itself — it vendors react-navigation
// internally and re-exports them; @react-navigation/native is not a dependency here.
import {
  DefaultTheme,
  Stack,
  ThemeProvider,
  usePathname,
  useRouter,
  type ErrorBoundaryProps,
} from 'expo-router';
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

// The header bar. Its content is constrained to the SAME centred column as the
// page content (640px), and the bar itself is transparent — so the left/right
// gutters stay completely clear and the Adana margin art can run the full height
// of the viewport behind it, instead of being pushed below a full-width header.
// On phones maxWidth is a no-op, so the header looks exactly as before.
function AppHeader({ title }: { title: string }) {
  return (
    <View style={hdr.bar}>
      <View style={hdr.inner}>
        <HeaderBack />
        <Text style={hdr.title} numberOfLines={1}>
          {title}
        </Text>
        <ThemeToggle />
      </View>
    </View>
  );
}

const NAV_THEME = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: 'transparent', card: 'transparent' },
};

const hdr = StyleSheet.create({
  bar: {
    height: 64,
    width: '100%',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    paddingHorizontal: 16,
  },
  title: {
    flex: 1,
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
      {/* React Navigation's default theme paints the navigator container light
          grey (#F2F2F2). With a transparent header that grey showed as a band
          across the top — over the margin art and wrong in dark mode. Transparent
          navigator background: the page's own paper (html/body) shows instead. */}
      <ThemeProvider value={NAV_THEME}>
        <Stack
          screenOptions={{
            contentStyle: { backgroundColor: colors.paper },
            // Custom header: content centred in the content column, bar transparent,
            // so the margin art owns the full-height gutters.
            header: ({ options }) => <AppHeader title={options.title ?? ''} />,
          }}
        />
      </ThemeProvider>
      {/* Decorative Adana margin art on wide screens (web-only, ≥980px, light
          theme) — never touches the centred content. */}
      <SideDecor />
    </DisplaySettingsProvider>
  );
}
