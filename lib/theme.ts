// Design tokens from FRONTEND.md §1 — the full 5-color palette.
// Use these, never ad-hoc hex values in screens.
export const colors = {
  ink: '#2B2620', // primary text, structure
  paper: '#EDE6D8', // background
  petrol: '#1F5C5C', // primary actions, links
  terracotta: '#BC5A3C', // status: open / needs attention
  moss: '#5B7052', // status: resolved / handled
  // Text-safe darkened variants: terracotta on paper is ~3.6:1 and moss ~4.4:1,
  // both under WCAG AA (4.5:1) for small text. Use these for text/labels;
  // keep the originals for non-text marks (stamp dots, map pins).
  terracottaText: '#9A4830',
  mossText: '#47593F',
  // Muted body/placeholder text — a SOLID ink at ~6:1 on paper. Prefer this
  // over `opacity` dimming for helper text, which can fall under WCAG AA.
  inkMuted: '#5C574E',
} as const;

// FRONTEND.md §1: mono for "logged" moments (counts, dates, IDs, contact
// details), humanist sans for everything else. Families loaded in app/_layout.
export const fonts = {
  sans: 'WorkSans_400Regular',
  sansSemiBold: 'WorkSans_600SemiBold',
  mono: 'IBMPlexMono_400Regular',
  monoMedium: 'IBMPlexMono_500Medium',
} as const;
