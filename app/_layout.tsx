import { Stack } from 'expo-router';
import Head from 'expo-router/head';

import { colors } from '@/lib/theme';

export default function RootLayout() {
  return (
    <>
      <Head>
        <title>Dijital Muhtar</title>
      </Head>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.paper },
          headerTintColor: colors.ink,
          headerTitleStyle: { color: colors.ink },
          contentStyle: { backgroundColor: colors.paper },
        }}
      />
    </>
  );
}
