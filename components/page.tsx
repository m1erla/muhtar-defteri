import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

// The scroll frame for every single-column screen. On wide viewports (≥768px)
// the CSS in app/+html.tsx targets the data-mdr-desk / data-mdr-sheet attributes
// and renders the centred column as a bordered paper "sheet" on a toned "desk" —
// the muhtar's-desk-ledger metaphor, so the empty desktop margins read as
// intentional. Below the breakpoint the attributes do nothing: same ScrollView +
// centred content as before, pixel-identical on mobile.
//
// react-native-web maps the `dataSet` prop to `data-*` attributes; it isn't in
// the RN types, hence the small casts. Not used by the map/list screen, which
// keeps its own full-width split layout.
const deskAttr = { dataSet: { mdrDesk: 'true' } } as Record<string, unknown>;
const sheetAttr = { dataSet: { mdrSheet: 'true' } } as Record<string, unknown>;

export default function Page({
  children,
  contentStyle,
}: {
  children: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} {...deskAttr}>
      <View style={[styles.sheet, contentStyle]} {...sheetAttr}>
        {children}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  // flexGrow lets the sheet fill tall viewports so its side borders + shadow run
  // the full height; the screen's own contentStyle carries maxWidth/padding/gap.
  sheet: { flexGrow: 1, width: '100%' },
});
