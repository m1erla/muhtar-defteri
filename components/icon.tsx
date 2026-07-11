import { Image } from 'expo-image';

import type { CategorySlug } from '@/lib/categories';
import { colors } from '@/lib/theme';

// Hand-drawn Riso-style icon set (FRONTEND.md §1: the visual budget goes on
// distinctive marks, not libraries). Each icon is two "print layers": a petrol
// accent silhouette offset ~2px (the misregistration of a real Riso print) under
// wobbly ink linework. Authored by hand as inline SVG data-URIs — zero deps,
// zero network requests, crisp at any size.
//
// Icons are always decorative here — a text label rides alongside every use
// (same rule as StatusStamp: never meaning through the mark alone).

export type IconName = CategorySlug | 'camera' | 'pin';
type Tone = 'ink' | 'paper';

type Palette = { s: string; a: string; f: string }; // stroke / accent / fill

const DRAW: Record<IconName, (p: Palette) => string> = {
  // Temizlik / Çöp — wheeled bin, lid ajar, one fly
  cleanliness: ({ s, a, f }) => `
    <g stroke-linecap="round" stroke-linejoin="round" fill="none">
      <path d="M14.5 21.5 C 20 20.8, 30 20.8, 35.5 21.5 L 33.8 41 Q 33.5 43.2 31 43.2 L 19 43.2 Q 16.5 43.2 16.2 41 Z" fill="${a}" stroke="none" transform="translate(2.2,1.8)"/>
      <path d="M14.5 21.5 C 20 20.8, 30 20.8, 35.5 21.5 L 33.8 41 Q 33.5 43.2 31 43.2 L 19 43.2 Q 16.5 43.2 16.2 41 Z" fill="${f}" stroke="${s}" stroke-width="2.6"/>
      <path d="M21 26 C 20.8 30, 20.8 34, 21.2 38.5" stroke="${s}" stroke-width="2.2"/>
      <path d="M28.8 26 C 29 30, 29 34, 28.6 38.5" stroke="${s}" stroke-width="2.2"/>
      <g transform="rotate(-7 25 17)">
        <path d="M12.5 17.5 C 18 16.6, 32 16.6, 37.5 17.5" stroke="${s}" stroke-width="2.8"/>
        <path d="M21.5 13.8 Q 25 12.6 28.5 13.8" stroke="${s}" stroke-width="2.4"/>
      </g>
      <circle cx="40" cy="10.5" r="1.3" fill="${s}" stroke="none"/>
      <path d="M37.5 8 q 2 -2.5 4.5 -1" stroke="${s}" stroke-width="1.4"/>
    </g>`,
  // Hatalı Park — car with its nose up on a kerb block
  parking: ({ s, a, f }) => `
    <g stroke-linecap="round" stroke-linejoin="round" fill="none">
      <path d="M29 36 L 43.5 36 L 43.5 43.5 L 29 43.5 Z" fill="${a}" stroke="none" transform="translate(1.6,1.4)"/>
      <path d="M29 36 L 43.5 36 L 43.5 43.5 L 29 43.5 Z" fill="${f}" stroke="${s}" stroke-width="2.4"/>
      <path d="M6 43.5 C 12 42.8, 18 42.8, 24 43.5" stroke="${s}" stroke-width="2.2"/>
      <g transform="rotate(-6 21 31)">
        <path d="M5 33 Q 4.6 27.8 8.2 27 L 12.6 26.2 Q 15.5 20.5 21.5 20.5 Q 27.5 20.5 30 25.8 L 34.5 26.6 Q 38 27.2 38 30 L 38 32.5 Q 38 34.3 36 34.3 L 8 34.3 Q 5.2 34.3 5 33 Z" fill="${a}" stroke="none" transform="translate(2,1.7)"/>
        <path d="M5 33 Q 4.6 27.8 8.2 27 L 12.6 26.2 Q 15.5 20.5 21.5 20.5 Q 27.5 20.5 30 25.8 L 34.5 26.6 Q 38 27.2 38 30 L 38 32.5 Q 38 34.3 36 34.3 L 8 34.3 Q 5.2 34.3 5 33 Z" fill="${f}" stroke="${s}" stroke-width="2.6"/>
        <path d="M16.2 25.8 Q 18 21.6 21.5 21.6 Q 25.4 21.6 27.4 25.4" stroke="${s}" stroke-width="2"/>
        <circle cx="12.8" cy="34.3" r="3.5" fill="${f}" stroke="${s}" stroke-width="2.4"/>
        <circle cx="30.8" cy="34.3" r="3.5" fill="${f}" stroke="${s}" stroke-width="2.4"/>
      </g>
    </g>`,
  // Kaldırım / Altyapı — traffic cone over a cracked pavement line
  infrastructure: ({ s, a, f }) => `
    <g stroke-linecap="round" stroke-linejoin="round" fill="none">
      <path d="M24.5 9.5 Q 25.8 9.5 26.2 11.5 L 32.5 37 L 16 37 L 22.8 11.5 Q 23.2 9.5 24.5 9.5 Z" fill="${a}" stroke="none" transform="translate(2,1.6)"/>
      <path d="M24.5 9.5 Q 25.8 9.5 26.2 11.5 L 32.5 37 L 16 37 L 22.8 11.5 Q 23.2 9.5 24.5 9.5 Z" fill="${f}" stroke="${s}" stroke-width="2.6"/>
      <path d="M20 23 C 23 22.4, 25.5 22.4, 28.3 23 L 29.5 27.6 C 25.8 28.4, 22.3 28.4, 18.8 27.6 Z" fill="${a}" stroke="none"/>
      <path d="M11.5 37 C 20 36.2, 29 36.2, 37.5 37" stroke="${s}" stroke-width="2.8"/>
      <path d="M33.5 40.5 l 4 1.5 l -2.5 2 l 4.5 1.5" stroke="${s}" stroke-width="2"/>
      <path d="M10.5 41.5 l 3.5 1.2" stroke="${s}" stroke-width="2"/>
    </g>`,
  // Okul Çevresi Güvenliği — backpack with a petrol flap
  school_safety: ({ s, a, f }) => `
    <g stroke-linecap="round" stroke-linejoin="round" fill="none">
      <path d="M13.5 22 Q 13.5 14.8 20 14 L 28 14 Q 34.5 14.8 34.5 22 L 35 38 Q 35 41 32 41 L 16 41 Q 13 41 13 38 Z" fill="${a}" stroke="none" transform="translate(2,1.8)"/>
      <path d="M13.5 22 Q 13.5 14.8 20 14 L 28 14 Q 34.5 14.8 34.5 22 L 35 38 Q 35 41 32 41 L 16 41 Q 13 41 13 38 Z" fill="${f}" stroke="${s}" stroke-width="2.6"/>
      <path d="M14 23.5 Q 14 16 21 15.2 L 27 15.2 Q 34 16 34 23.5 C 27.5 25.3, 20.5 25.3, 14 23.5 Z" fill="${a}" stroke="${s}" stroke-width="2.2"/>
      <path d="M22.4 24.8 L 25.6 24.8 L 25.6 28.6 L 22.4 28.6 Z" fill="${f}" stroke="${s}" stroke-width="2"/>
      <path d="M20.5 14.6 Q 21 9.8 24 9.8 Q 27 9.8 27.5 14.6" stroke="${s}" stroke-width="2.4"/>
      <path d="M18.5 33 L 29.5 33 Q 30.5 33 30.5 34.5 L 30.5 37.5 L 17.5 37.5 L 17.5 34.5 Q 17.5 33 18.5 33 Z" fill="${f}" stroke="${s}" stroke-width="2.2"/>
    </g>`,
  // Sokak Aydınlatması — street lamp, petrol glow behind the lantern head
  street_lighting: ({ s, a, f }) => `
    <g stroke-linecap="round" stroke-linejoin="round" fill="none">
      <circle cx="31.5" cy="15.5" r="7" fill="${a}" stroke="none" transform="translate(1.6,1.6)"/>
      <path d="M15 42.5 C 14.8 32, 14.8 20, 15 14 Q 15 10.5 19 10.5 L 27 10.5" stroke="${s}" stroke-width="2.8"/>
      <path d="M27.5 10.5 L 35.5 10.5 Q 36.5 10.5 36.2 12 L 34.8 17.5 Q 34.5 18.8 33 18.8 L 30 18.8 Q 28.5 18.8 28.2 17.5 L 26.8 12 Q 26.5 10.5 27.5 10.5 Z" fill="${f}" stroke="${s}" stroke-width="2.4"/>
      <path d="M26 23.5 L 23.5 27.5 M31.5 24.5 L 31.5 29.5 M37 23.5 L 39.5 27.5" stroke="${s}" stroke-width="2.2"/>
      <path d="M10 43 C 13.5 42.4, 17 42.4, 20.5 43" stroke="${s}" stroke-width="2.4"/>
    </g>`,
  // Su / Kanalizasyon — tap with a falling petrol drop
  water_sewage: ({ s, a, f }) => `
    <g stroke-linecap="round" stroke-linejoin="round" fill="none">
      <path d="M12 20 Q 12 17.5 14.5 17.5 L 27 17.5 Q 33.5 17.5 34 24 L 34 27 L 28.5 27 L 28.5 24.5 Q 28.3 23 26.5 23 L 14.5 23 Q 12 23 12 20.5 Z" fill="${a}" stroke="none" transform="translate(1.8,1.6)"/>
      <path d="M12 20 Q 12 17.5 14.5 17.5 L 27 17.5 Q 33.5 17.5 34 24 L 34 27 L 28.5 27 L 28.5 24.5 Q 28.3 23 26.5 23 L 14.5 23 Q 12 23 12 20.5 Z" fill="${f}" stroke="${s}" stroke-width="2.5"/>
      <path d="M19 17.5 L 19 13 M15.5 12.5 C 18 12, 20.5 12, 23 12.5" stroke="${s}" stroke-width="2.6"/>
      <path d="M31.2 31.5 Q 35 36.6 31.2 39.2 Q 27.4 36.6 31.2 31.5 Z" fill="${a}" stroke="none"/>
      <path d="M22 42.5 C 27 41.8, 34 41.8, 40 42.5" stroke="${s}" stroke-width="2.2"/>
    </g>`,
  // Sokak Hayvanları — sitting street cat
  stray_animals: ({ s, a, f }) => `
    <g stroke-linecap="round" stroke-linejoin="round" fill="none">
      <path d="M17.5 41 Q 14 34 16 27.5 Q 17.5 22.5 22 20.3 L 21.5 14 L 26 19.2 Q 27.8 18.8 29.8 19.2 L 34 14 L 33.8 20.5 Q 36.5 23.5 36.5 28 Q 36.5 34 32.5 41" fill="${a}" stroke="none" transform="translate(1.8,1.6)"/>
      <path d="M17.5 41 Q 14 34 16 27.5 Q 17.5 22.5 22 20.3 L 21.5 14 L 26 19.2 Q 27.8 18.8 29.8 19.2 L 34 14 L 33.8 20.5 Q 36.5 23.5 36.5 28 Q 36.5 34 32.5 41" fill="${f}" stroke="${s}" stroke-width="2.6"/>
      <path d="M13 41.5 C 20 40.8, 30 40.8, 37 41.5" stroke="${s}" stroke-width="2.4"/>
      <circle cx="24" cy="26.5" r="1.2" fill="${s}" stroke="none"/>
      <circle cx="31" cy="26.5" r="1.2" fill="${s}" stroke="none"/>
      <path d="M26.5 30.5 Q 27.5 31.5 28.5 30.5" stroke="${s}" stroke-width="1.8"/>
      <path d="M9.5 38 Q 7.5 33 11 31.5 Q 13.5 30.8 14 34" stroke="${s}" stroke-width="2.4"/>
    </g>`,
  // Gürültü — megaphone with petrol sound arcs
  noise: ({ s, a, f }) => `
    <g stroke-linecap="round" stroke-linejoin="round" fill="none">
      <path d="M10 22 L 24 15.5 Q 26.5 14.5 26.5 17.5 L 26.5 31.5 Q 26.5 34.5 24 33.5 L 10 27 Z" fill="${a}" stroke="none" transform="translate(1.8,1.6)"/>
      <path d="M10 22 L 24 15.5 Q 26.5 14.5 26.5 17.5 L 26.5 31.5 Q 26.5 34.5 24 33.5 L 10 27 Z" fill="${f}" stroke="${s}" stroke-width="2.5"/>
      <path d="M10 22 Q 7.5 22.5 7.5 24.5 Q 7.5 26.5 10 27" fill="${f}" stroke="${s}" stroke-width="2.5"/>
      <path d="M14 28.5 L 15.5 35.5 Q 16 37.5 18 37.5 L 19.5 37.5" stroke="${s}" stroke-width="2.4"/>
      <path d="M31.5 20 Q 33.5 24.5 31.5 29" stroke="${a}" stroke-width="2.6"/>
      <path d="M35.5 17 Q 39 24.5 35.5 32" stroke="${a}" stroke-width="2.6"/>
      <path d="M39.5 14 Q 44.5 24.5 39.5 35" stroke="${a}" stroke-width="2.6"/>
    </g>`,
  // Fotoğraf Ekle — camera whose petrol lens echoes the brand stamp
  camera: ({ s, a, f }) => `
    <g stroke-linecap="round" stroke-linejoin="round" fill="none">
      <path d="M9.5 19.5 Q 9.5 17 12 17 L 17 17 L 19.5 13.5 L 28.5 13.5 L 31 17 L 36 17 Q 38.5 17 38.5 19.5 L 38.5 34 Q 38.5 36.5 36 36.5 L 12 36.5 Q 9.5 36.5 9.5 34 Z" fill="${a}" stroke="none" transform="translate(2,1.8)"/>
      <path d="M9.5 19.5 Q 9.5 17 12 17 L 17 17 L 19.5 13.5 L 28.5 13.5 L 31 17 L 36 17 Q 38.5 17 38.5 19.5 L 38.5 34 Q 38.5 36.5 36 36.5 L 12 36.5 Q 9.5 36.5 9.5 34 Z" fill="${f}" stroke="${s}" stroke-width="2.6"/>
      <circle cx="24" cy="26.5" r="6.2" fill="${f}" stroke="${s}" stroke-width="2.4"/>
      <circle cx="24" cy="26.5" r="2.8" fill="${a}" stroke="none"/>
      <circle cx="34.5" cy="21" r="1.3" fill="${s}" stroke="none"/>
    </g>`,
  // Konum — the brand stamp mark (favicon) on a stem
  pin: ({ s, a, f }) => `
    <g stroke-linecap="round" stroke-linejoin="round" fill="none">
      <circle cx="24" cy="19" r="9.5" fill="${f}" stroke="${s}" stroke-width="2.8"/>
      <circle cx="24" cy="19" r="4.6" fill="${a}" stroke="none"/>
      <path d="M24 28.5 C 23.8 32, 23.8 35, 24 38.5" stroke="${s}" stroke-width="2.6"/>
      <path d="M18 40.5 C 22 39.9, 26 39.9, 30 40.5" stroke="${s}" stroke-width="2"/>
    </g>`,
};

const PALETTES: Record<Tone, Palette> = {
  ink: { s: colors.ink, a: colors.petrol, f: colors.paper },
  // On petrol surfaces (pressed tiles): a single-color paper print, no fill.
  paper: { s: colors.paper, a: colors.paper, f: 'none' },
};

function toUri(name: IconName, tone: Tone): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">${DRAW[name](PALETTES[tone])}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Precompute all variants once at module load — renders are just <img src>.
const URIS = Object.fromEntries(
  (Object.keys(DRAW) as IconName[]).map((name) => [
    name,
    { ink: toUri(name, 'ink'), paper: toUri(name, 'paper') },
  ])
) as Record<IconName, Record<Tone, string>>;

export default function Icon({
  name,
  size = 26,
  tone = 'ink',
}: {
  name: IconName;
  size?: number;
  tone?: Tone;
}) {
  return (
    <Image
      source={{ uri: URIS[name][tone] }}
      style={{ width: size, height: size }}
      contentFit="contain"
      accessible={false}
    />
  );
}
