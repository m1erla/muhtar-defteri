import { Stack, useRouter } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import Page from '@/components/page';

import CategoryTile from '@/components/category-tile';
import { CATEGORIES, type CategorySlug } from '@/lib/categories';
import { resetDraft, updateDraft } from '@/lib/report-draft';
import { colors, fonts } from '@/lib/theme';

export default function ReportCategory() {
  const router = useRouter();

  const pick = (category: CategorySlug) => {
    // A fresh category pick starts a fresh report.
    resetDraft();
    updateDraft({ category });
    router.push('/report-details');
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Sorun Bildir' }} />
      <Page contentStyle={styles.content}>
        <Text style={styles.heading} accessibilityRole="header">
          Ne tür bir sorun?
        </Text>
        <Text style={styles.sub}>Birini seç, sana doğru resmi kanalı gösterelim.</Text>
        {CATEGORIES.map((c) => (
          <CategoryTile key={c.slug} label={c.label} slug={c.slug} onPress={() => pick(c.slug)} />
        ))}
      </Page>
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
    gap: 12,
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
  sub: {
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.inkMuted,
    marginBottom: 8,
  },
});
