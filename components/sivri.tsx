import { Platform, View } from 'react-native';

// "Sivri" — Mahalle Defteri's neighbourhood mosquito, Adana's self-deprecating
// local emblem reimagined friendly: he WRITES reports (a pencil for a nose)
// instead of biting. Hand-drawn in the same Riso ink language as the category
// icons (components/icon.tsx): petrol wings, ledger-striped body, wobbly ink
// linework. Pure inline SVG — no libraries, a few KB.
//
// Web-only (the app's deploy target). Colours come from the theme: ink linework
// is `currentColor` (set to var(--ink) on the <svg>), petrol/paper via var()
// styles, so Sivri flips light/dark with everything else. Decorative by rule
// (aria-hidden) — a text label always sits beside him, same as the icons.
//
// Motion is CSS classes defined in app/+html.tsx; the global reduced-motion /
// data-motion kill switch freezes them, so Sivri is a still drawing for anyone
// who opts out.

export type SivriMood = 'idle' | 'happy' | 'sleep';

const INK = { stroke: 'currentColor' as const };
const petrol = (opacity = 1) => ({ fill: 'var(--petrol)', opacity });
const paperFill = { fill: 'var(--paper)' };

export default function Sivri({
  size = 128,
  mood = 'idle',
}: {
  size?: number;
  mood?: SivriMood;
}) {
  if (Platform.OS !== 'web') return null;
  const h = Math.round(size * (180 / 190));

  return (
    <View style={{ width: size, height: h, alignItems: 'center' }} pointerEvents="none">
      <svg
        viewBox="20 0 175 180"
        width={size}
        height={h}
        aria-hidden="true"
        className="sivri sivri-float"
        data-mood={mood}
        style={{ color: 'var(--ink)', overflow: 'visible' }}
      >
        {/* wings — petrol Riso layer + ink outline, flutter as a group */}
        <g className="sivri-wings">
          <path d="M92 90 Q150 30 174 56 Q170 92 114 104 Z" style={petrol(0.42)} />
          <path d="M94 96 Q140 64 162 96 Q151 122 106 110 Z" style={petrol(0.3)} />
          <path
            d="M92 90 Q150 30 174 56 Q170 92 114 104 Z"
            fill="none"
            stroke={INK.stroke}
            strokeWidth={2.2}
          />
          <path
            d="M94 96 Q140 64 162 96 Q151 122 106 110 Z"
            fill="none"
            stroke={INK.stroke}
            strokeWidth={2.2}
          />
        </g>

        {/* legs */}
        <g
          fill="none"
          stroke={INK.stroke}
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M82 106 Q70 128 82 142 q3 4 9 3" />
          <path d="M89 112 Q84 136 97 148 q4 3 10 1" />
          <path d="M97 118 Q101 141 118 149 q6 1 10 -3" />
          <path d="M101 101 Q124 106 132 93" />
          <path d="M103 111 Q130 119 143 112" />
          <path d="M101 123 Q128 135 139 131" />
        </g>

        {/* Riso body echo */}
        <path
          d="M90 92 Q132 100 140 132 Q144 154 122 162 Q99 168 89 141 Q83 112 90 92 Z"
          style={petrol(0.18)}
          transform="translate(3.5 3)"
        />
        {/* abdomen + ledger stripes */}
        <path
          d="M90 92 Q132 100 140 132 Q144 154 122 162 Q99 168 89 141 Q83 112 90 92 Z"
          style={paperFill}
          stroke={INK.stroke}
          strokeWidth={3.4}
          strokeLinejoin="round"
        />
        <g fill="none" stroke={INK.stroke} strokeWidth={2.3} strokeLinecap="round" opacity={0.7}>
          <path d="M95 116 Q116 123 133 118" />
          <path d="M95 132 Q114 140 129 134" />
          <path d="M97 147 Q112 153 124 149" />
        </g>

        {/* thorax + head */}
        <circle cx={88} cy={88} r={20} style={paperFill} stroke={INK.stroke} strokeWidth={3.4} />
        <circle cx={66} cy={64} r={25} style={paperFill} stroke={INK.stroke} strokeWidth={3.4} />

        {/* pencil "proboscis" — waves on success */}
        <g
          className={mood === 'happy' ? 'sivri-wave' : undefined}
          strokeLinejoin="round"
          strokeLinecap="round"
        >
          <path d="M58 82 L66 88 L47 114 L40 108 Z" style={petrol()} stroke={INK.stroke} strokeWidth={2.3} />
          <path d="M47 114 L40 108 L36 121 Z" style={paperFill} stroke={INK.stroke} strokeWidth={2.3} />
          <path d="M40.5 116 L36 121 L42 119 Z" fill="currentColor" />
        </g>

        {/* face */}
        <ellipse cx={52} cy={74} rx={6} ry={4} style={{ fill: 'var(--terracotta)', opacity: 0.26 }} />
        <ellipse cx={84} cy={70} rx={6} ry={4} style={{ fill: 'var(--terracotta)', opacity: 0.26 }} />
        {mood === 'idle' ? (
          <>
            <ellipse cx={58} cy={60} rx={9} ry={11} fill="#F8F3E7" stroke={INK.stroke} strokeWidth={2.2} />
            <ellipse cx={77} cy={58} rx={9} ry={11} fill="#F8F3E7" stroke={INK.stroke} strokeWidth={2.2} />
            <circle cx={59} cy={64} r={4.6} fill="currentColor" />
            <circle cx={78} cy={62} r={4.6} fill="currentColor" />
            <circle cx={57} cy={61} r={1.7} fill="#fff" />
            <circle cx={76} cy={59} r={1.7} fill="#fff" />
          </>
        ) : (
          // happy + sleep: cheerful closed "^ ^" / "‿ ‿" eyes
          <g fill="none" stroke={INK.stroke} strokeWidth={2.6} strokeLinecap="round">
            {mood === 'happy' ? (
              <>
                <path d="M51 62 Q58 55 65 62" />
                <path d="M71 60 Q78 53 85 60" />
              </>
            ) : (
              <>
                <path d="M51 60 Q58 66 65 60" />
                <path d="M71 58 Q78 64 85 58" />
              </>
            )}
          </g>
        )}
        <path
          d={mood === 'happy' ? 'M60 79 Q69 89 78 78' : 'M63 80 Q69 85 75 79'}
          fill="none"
          stroke={INK.stroke}
          strokeWidth={2.4}
          strokeLinecap="round"
        />

        {/* antennae */}
        <g fill="none" stroke={INK.stroke} strokeWidth={2.2} strokeLinecap="round">
          <path d="M60 43 Q50 22 45 13" />
          <path d="M75 42 Q85 22 93 15" />
          <g strokeWidth={1.5} opacity={0.7}>
            <path d="M53 30 l-5 -2 M50 24 l-5 -2 M82 28 l5 -3 M85 22 l5 -3" />
          </g>
        </g>
        <circle cx={45} cy={13} r={3} style={petrol()} />
        <circle cx={93} cy={15} r={3} style={petrol()} />

        {/* sleep: drifting Zzz */}
        {mood === 'sleep' ? (
          <text
            className="sivri-zzz"
            x={104}
            y={44}
            fill="currentColor"
            fontSize={18}
            fontFamily="IBM Plex Mono, monospace"
            opacity={0.7}
          >
            z
          </text>
        ) : null}
      </svg>
    </View>
  );
}
