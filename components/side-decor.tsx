import { usePathname } from 'expo-router';
import { Platform } from 'react-native';

import AdSlot from '@/components/ad-slot';
import { ADS_ENABLED } from '@/lib/ads';

// Decorative side panels for wide screens — the AI-generated Adana margin art
// (public/decor/margin-{left,right}[-dark].webp). Left = Sabancı Camii, Taşköprü
// and palms; right = Büyük Saat Kulesi, the Varda viadüğü, orange blossom and
// cotton — deliberately different motifs per side, each with a night-ledger dark
// variant. The centred column is untouched: these two fixed panels fill only the
// empty gutters (sized via calc in app/+html.tsx), full viewport height since the
// header bar is transparent. pointer-events:none, aria-hidden, web-only, and not
// even fetched ≤980px (phones/tablets).
export default function SideDecor() {
  const pathname = usePathname();
  if (Platform.OS !== 'web') return null;
  // The ledger's margins carry the art; the map takes the whole desk. map-list is
  // the one full-bleed screen — its map pane and ledger pane are each flex:1
  // across the whole viewport, so the gutters aren't free real estate there and
  // the panels would paint straight over the map and the rows' ⟳/date/status
  // columns. Not a compromise: mapPane starts at x=0 like .mdr-side-l does, so
  // no viewport width exists where both fit. Skipping the divs also skips the
  // ~640KB art fetch on the heaviest screen. If this route is ever renamed,
  // update the check — the art would silently come back over the map.
  if (pathname === '/map-list') return null;
  return (
    <>
      <div className="mdr-side mdr-side-l" aria-hidden="true" />
      {/* With the dormant ad system enabled (EXPO_PUBLIC_ADS=1), the RIGHT
          gutter carries the desktop skyscraper instead of the art — one panel
          stays Adana, one earns hosting costs. The wrapper is clickable (ads
          need clicks, unlike the art) and, like the art, never renders ≤980px
          (.mdr-ad-gutter in app/+html.tsx) so phones never pay for it. */}
      {ADS_ENABLED ? (
        <div className="mdr-ad-gutter">
          <AdSlot format="sky" />
        </div>
      ) : (
        <div className="mdr-side mdr-side-r" aria-hidden="true" />
      )}
    </>
  );
}
