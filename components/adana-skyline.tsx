import { Platform, View } from 'react-native';

// A thin line-art strip of Adana's recognisable skyline — Sabancı Merkez Camii
// (its six minarets are the city's signature), the Roman Taşköprü arches, palms
// for the warm climate, and the Seyhan river in petrol. Sets a quiet sense of
// place on Home and the guide screen without competing with content. Ink is
// `currentColor` (var(--ink)) so it themes; kept faint. Purely decorative.
export default function AdanaSkyline({ opacity = 0.5 }: { opacity?: number }) {
  if (Platform.OS !== 'web') return null;
  return (
    <View style={{ width: '100%', opacity }} pointerEvents="none">
      <svg
        viewBox="0 0 700 96"
        width="100%"
        height={72}
        preserveAspectRatio="xMidYMax meet"
        aria-hidden="true"
        style={{ color: 'var(--ink)', display: 'block' }}
      >
        {/* Seyhan river */}
        <path
          d="M0 84 Q180 78 360 84 T700 82"
          style={{ stroke: 'var(--petrol)' }}
          strokeWidth={2.4}
          fill="none"
          opacity={0.55}
          strokeLinecap="round"
        />
        <path
          d="M0 90 Q200 85 400 90 T700 88"
          style={{ stroke: 'var(--petrol)' }}
          strokeWidth={1.6}
          fill="none"
          opacity={0.3}
          strokeLinecap="round"
        />
        <g
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.62}
        >
          {/* Sabancı Merkez Camii: dome + body */}
          <path d="M300 60 Q300 34 330 34 Q360 34 360 60" />
          <path d="M330 34 l0 -9 M326 27 q4 -5 8 0" />
          <path d="M300 60 l0 14 M360 60 l0 14 M300 74 l60 0" />
          {/* six minarets */}
          <g strokeWidth={1.8}>
            <path d="M286 74 L286 30 M282 30 q4 -6 8 0 M286 24 l0 -5" />
            <path d="M374 74 L374 30 M370 30 q4 -6 8 0 M374 24 l0 -5" />
            <path d="M270 74 L270 40 M267 40 q3 -5 6 0 M270 35 l0 -4" />
            <path d="M390 74 L390 40 M387 40 q3 -5 6 0 M390 35 l0 -4" />
            <path d="M256 74 L256 48 M253 48 q3 -4 6 0" />
            <path d="M404 74 L404 48 M401 48 q3 -4 6 0" />
          </g>
          {/* Taşköprü arches */}
          <g strokeWidth={1.9} opacity={0.9}>
            <path d="M60 78 L60 66 Q78 56 96 66 Q114 56 132 66 Q150 56 168 66 Q186 56 204 66 L204 78" />
            <path d="M60 66 L204 66" />
          </g>
          {/* palms */}
          <g strokeWidth={2}>
            <path d="M470 78 Q474 60 472 46" />
            <path d="M472 46 q-14 -6 -22 2 M472 46 q14 -6 22 2 M472 46 q-8 -14 -18 -14 M472 46 q8 -14 18 -14 M472 46 q0 -16 0 -18" />
            <path d="M628 78 Q632 62 630 50" />
            <path d="M630 50 q-11 -5 -18 1 M630 50 q11 -5 18 1 M630 50 q-6 -12 -14 -12 M630 50 q6 -12 14 -12" />
          </g>
        </g>
      </svg>
    </View>
  );
}
