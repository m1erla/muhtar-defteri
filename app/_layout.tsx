import { IBMPlexMono_400Regular, IBMPlexMono_500Medium } from '@expo-google-fonts/ibm-plex-mono';
import { useFonts, WorkSans_400Regular, WorkSans_600SemiBold } from '@expo-google-fonts/work-sans';
import { Stack } from 'expo-router';
import Head from 'expo-router/head';

import { colors, fonts } from '@/lib/theme';

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
    <>
      <Head>
        <title>Dijital Muhtar</title>
      </Head>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.paper },
          headerTintColor: colors.ink,
          headerTitleStyle: { color: colors.ink, fontFamily: fonts.sansSemiBold },
          contentStyle: { backgroundColor: colors.paper },
        }}
      />
    </>
  );
}
