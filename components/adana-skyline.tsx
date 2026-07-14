import { Platform, View } from 'react-native';

// A thin Adana skyline band (Sabancı Camii's six minarets, the Taşköprü, palms,
// the Seyhan) used as a quiet footer accent. Decorative — aria-hidden, web-only.
// `opacity` keeps it faint.
//
// The light/dark variant is chosen in CSS (.mdr-skyline in app/+html.tsx), not from
// the JS-resolved theme. useResolvedTheme() only knows the real theme AFTER
// hydration, so with the static export every dark-mode visitor fetched the LIGHT
// band, painted it, then swapped — a visible flash and a wasted 68KB. The CSS
// variant is right on the first paint (the no-flash script sets data-theme before
// anything renders), and it lets high-contrast override the theme, which the JS
// path could not.
export default function AdanaSkyline({ opacity = 0.5 }: { opacity?: number }) {
  if (Platform.OS !== 'web') return null;
  return (
    <View style={{ width: '100%', alignItems: 'center' }} pointerEvents="none">
      <div className="mdr-skyline" style={{ opacity }} aria-hidden="true" />
    </View>
  );
}
