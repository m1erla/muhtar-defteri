import { Platform } from 'react-native';

// Decorative side panels for wide screens. The centred column stays exactly as
// it is; these two fixed panels simply fill the empty margins so a desktop
// browser doesn't feel half-empty. In the app's own language: the margins become
// the ruled edge of the ledger, grounded by a faint Adana skyline (Sabancı
// Camii's six minarets, the Taşköprü, palms). Purely decorative —
// pointer-events:none + aria-hidden, web-only, static (no motion).
//
// Painted OVER the paper margins (the content's paper background fills the whole
// width), but positioned only in the side gutters via CSS `calc`, so they never
// reach the centred column. All the look — width, ruled lines, petrol page-edge,
// theming, and the ≤980px hide — lives in app/+html.tsx (.mdr-side). Ink is
// `currentColor`, so it themes light/dark with everything else.

// Faint Adana skyline, anchored to the bottom of each panel. currentColor inks.
const SKYLINE = `
<svg viewBox="0 0 700 120" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
  <g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="0.4">
    <path d="M0 104 Q180 98 360 104 T700 102" stroke-width="2.4"/>
    <path d="M300 80 Q300 54 330 54 Q360 54 360 80"/>
    <path d="M330 54 l0 -9 M326 47 q4 -5 8 0"/>
    <path d="M300 80 l0 14 M360 80 l0 14 M300 94 l60 0"/>
    <g stroke-width="1.8">
      <path d="M286 94 L286 50 M282 50 q4 -6 8 0 M286 44 l0 -5"/>
      <path d="M374 94 L374 50 M370 50 q4 -6 8 0 M374 44 l0 -5"/>
      <path d="M270 94 L270 60 M267 60 q3 -5 6 0 M270 55 l0 -4"/>
      <path d="M390 94 L390 60 M387 60 q3 -5 6 0 M390 55 l0 -4"/>
      <path d="M256 94 L256 68 M253 68 q3 -4 6 0"/>
      <path d="M404 94 L404 68 M401 68 q3 -4 6 0"/>
    </g>
    <g stroke-width="1.9">
      <path d="M60 98 L60 86 Q78 76 96 86 Q114 76 132 86 Q150 76 168 86 Q186 76 204 86 L204 98"/>
      <path d="M60 86 L204 86"/>
    </g>
    <g stroke-width="2">
      <path d="M470 98 Q474 80 472 66"/>
      <path d="M472 66 q-14 -6 -22 2 M472 66 q14 -6 22 2 M472 66 q-8 -14 -18 -14 M472 66 q8 -14 18 -14 M472 66 q0 -16 0 -18"/>
      <path d="M628 98 Q632 82 630 70"/>
      <path d="M630 70 q-11 -5 -18 1 M630 70 q11 -5 18 1 M630 70 q-6 -12 -14 -12 M630 70 q6 -12 14 -12"/>
    </g>
  </g>
</svg>`;

export default function SideDecor() {
  if (Platform.OS !== 'web') return null;
  return (
    <>
      <div className="mdr-side mdr-side-l" aria-hidden="true" dangerouslySetInnerHTML={{ __html: SKYLINE }} />
      <div className="mdr-side mdr-side-r" aria-hidden="true" dangerouslySetInnerHTML={{ __html: SKYLINE }} />
    </>
  );
}
