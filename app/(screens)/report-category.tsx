import { Stack, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import Page from '@/components/page';

import CategoryTile from '@/components/category-tile';
import { CATEGORIES, type CategorySlug } from '@/lib/categories';
import { resetDraft, updateDraft } from '@/lib/report-draft';
import { useLayout } from '@/lib/use-layout';
import { colors, fonts } from '@/lib/theme';

export default function ReportCategory() {
  const router = useRouter();
  const { isTablet, isDesktop } = useLayout();
  // 1 column on the phone, 2 on tablet, 3 on desktop.
  const cols = isDesktop ? 3 : isTablet ? 2 : 1;

  const pick = (category: CategorySlug) => {
    // A fresh category pick starts a fresh report.
    resetDraft();
    updateDraft({ category });
    router.push('/report-details');
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Sorun Bildir' }} />
      <Page contentStyle={[styles.content, isTablet && styles.contentWide]}>
        <Text style={styles.heading} accessibilityRole="header">
          Ne tür bir sorun?
        </Text>
        <Text style={styles.sub}>Birini seç, sana doğru resmi kanalı gösterelim.</Text>
        {/* Reflow into a grid on wider screens; the -6 margin + cell padding are
            the gutters (RN can't calc() grid gaps against percentage widths). */}
        <View style={styles.grid}>
          {CATEGORIES.map((c) => (
            <View key={c.slug} style={[styles.cell, { width: `${100 / cols}%` }]}>
              <CategoryTile label={c.label} slug={c.slug} onPress={() => pick(c.slug)} />
            </View>
          ))}
        </View>
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
  contentWide: {
    maxWidth: 900,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginTop: 4,
  },
  cell: {
    padding: 6,
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
