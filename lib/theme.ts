// Design tokens from FRONTEND.md §1 — the full 5-color palette.
// Use these, never ad-hoc hex values in screens.
export const colors = {
  ink: '#2B2620', // primary text, structure
  paper: '#EDE6D8', // background
  petrol: '#1F5C5C', // primary actions, links
  terracotta: '#BC5A3C', // status: open / needs attention
  moss: '#5B7052', // status: resolved / handled
} as const;

// FRONTEND.md §1: mono for "logged" moments (counts, dates, IDs, contact
// details), humanist sans for everything else. Families loaded in app/_layout.
export const fonts = {
  sans: 'WorkSans_400Regular',
  sansSemiBold: 'WorkSans_600SemiBold',
  mono: 'IBMPlexMono_400Regular',
  monoMedium: 'IBMPlexMono_500Medium',
} as const;
