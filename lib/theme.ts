// Design tokens from FRONTEND.md §1. The app is web-only, so theming runs on
// CSS custom properties: `colors` below are `var(--x)` references that resolve
// to whichever palette is active (light / dark / high-contrast), swapped by a
// `data-theme` / `data-contrast` attribute on the root element (see
// app/+html.tsx and lib/display-settings.tsx). Use these tokens, never ad-hoc
// hex in screens.
export const colors = {
  ink: 'var(--ink)', // primary text, structure
  paper: 'var(--paper)', // background
  petrol: 'var(--petrol)', // primary actions, links
  terracotta: 'var(--terracotta)', // status mark: open (non-text)
  moss: 'var(--moss)', // status mark: resolved (non-text)
  terracottaText: 'var(--terracotta-text)', // status LABEL: open (AA text)
  mossText: 'var(--moss-text)', // status LABEL: resolved (AA text)
  inkMuted: 'var(--ink-muted)', // muted/helper text — solid, AA (never opacity)
  pressOverlay: 'var(--press-overlay)', // pressed-row wash
  stampOpen: 'var(--stamp-open)', // faint fill inside the open stamp ring
  stampResolved: 'var(--stamp-resolved)', // faint fill inside the resolved ring
  // ADANA scope badge — a constant deep-teal chip with light text in BOTH
  // themes (like the category tints, its look doesn't flip). Dedicated tokens so
  // the fill stays dark enough for the light/white label to clear AA.
  scopeAdanaBg: 'var(--scope-adana-bg)',
  scopeAdanaText: 'var(--scope-adana-text)',
} as const;

// Concrete palettes behind the variables. LIGHT is the original FRONTEND.md
// palette unchanged — after the var swap, light mode must render pixel-identical
// (the regression gate). DARK is a "night ledger"; HC boosts contrast on light.
// Every text pair here clears WCAG AA (verified: ink/paper ≥12, links ≥6,
// status labels ≥5, muted ≥5.7 in light; all higher in dark/HC).
export type Palette = {
  ink: string; paper: string; petrol: string;
  terracotta: string; moss: string;
  terracottaText: string; mossText: string; inkMuted: string;
  pressOverlay: string; stampOpen: string; stampResolved: string;
  scopeAdanaBg: string; scopeAdanaText: string;
};

export const PALETTES: Record<'light' | 'dark' | 'hc', Palette> = {
  light: {
    ink: '#2B2620', paper: '#EDE6D8', petrol: '#1F5C5C',
    terracotta: '#BC5A3C', moss: '#5B7052',
    terracottaText: '#9A4830', mossText: '#47593F', inkMuted: '#5C574E',
    pressOverlay: 'rgba(43,38,32,0.06)',
    stampOpen: 'rgba(188,90,60,0.13)', stampResolved: 'rgba(91,112,82,0.13)',
    scopeAdanaBg: '#1F5C5C', scopeAdanaText: '#EDE6D8', // cream on deep petrol
  },
  dark: {
    ink: '#E8E1D3', paper: '#201C17', petrol: '#63ADAD',
    terracotta: '#D3866B', moss: '#8CA37F',
    terracottaText: '#E6A088', mossText: '#A6BE9A', inkMuted: '#ABA394',
    pressOverlay: 'rgba(231,224,210,0.09)',
    stampOpen: 'rgba(211,134,107,0.20)', stampResolved: 'rgba(140,163,127,0.20)',
    // Deep teal (not the bright link-petrol) so white text clears AA (~5.4:1).
    scopeAdanaBg: '#2A6E6E', scopeAdanaText: '#FFFFFF',
  },
  hc: {
    ink: '#161310', paper: '#F4EFE4', petrol: '#0F3F3F',
    terracotta: '#B4491F', moss: '#3A4D2E',
    terracottaText: '#7A2A12', mossText: '#2E3F22', inkMuted: '#38342B',
    pressOverlay: 'rgba(22,19,16,0.12)',
    stampOpen: 'rgba(180,73,31,0.18)', stampResolved: 'rgba(58,77,46,0.18)',
    scopeAdanaBg: '#0F3F3F', scopeAdanaText: '#FFFFFF',
  },
};

// Concrete light values for contexts that cannot resolve a CSS variable: the
// hand-drawn icon SVGs are baked into data: URIs (components/icon.tsx), so they
// use these fixed hex. Icons only ever sit on a light surface (the always-light
// category chip, or the light-mode page) or switch to the `paper` tone on dark
// surfaces — so the ink/petrol/paper here are correct for every rendered case.
export const RAW = PALETTES.light;

// FRONTEND.md §1: mono for "logged" moments (counts, dates, IDs, contact
// details), humanist sans for everything else. Families loaded in app/_layout.
export const fonts = {
  sans: 'WorkSans_400Regular',
  sansSemiBold: 'WorkSans_600SemiBold',
  mono: 'IBMPlexMono_400Regular',
  monoMedium: 'IBMPlexMono_500Medium',
} as const;
