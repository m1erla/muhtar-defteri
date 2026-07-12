// The eight report categories — PRD §8. The tap-to-select picker is the primary
// classification mechanism; these slugs match the channels.category values in
// supabase/schema.sql. Each category carries its own visual identity here (the
// data-driven source of truth, not scattered across components): the hand-drawn
// Riso icon of the same slug in components/icon.tsx, plus a soft accent `tint`
// used as the icon-container fill by components/category-mark.tsx.
//
// The tints are a disciplined palette extension (FRONTEND.md §1): one calm,
// paper-friendly colour per category so the marks read as colour-CODED, not
// just decorated. Ink icon on every tint clears ~8.7:1 (WCAG non-text ≥3:1),
// and colour is never the sole cue — the label always rides alongside and the
// silhouettes are distinct.
export const CATEGORIES = [
  { slug: 'cleanliness', label: 'Temizlik / Çöp', tint: '#BFDCB0' },
  { slug: 'parking', label: 'Hatalı Park', tint: '#B4CFE6' },
  { slug: 'infrastructure', label: 'Kaldırım / Altyapı', tint: '#F0C48C' },
  { slug: 'school_safety', label: 'Okul Çevresi Güvenliği', tint: '#D3C3E6' },
  { slug: 'street_lighting', label: 'Sokak Aydınlatması', tint: '#E7DA7E' },
  { slug: 'water_sewage', label: 'Su / Kanalizasyon', tint: '#ADD8D2' },
  { slug: 'stray_animals', label: 'Sokak Hayvanları', tint: '#DCC29E' },
  { slug: 'noise', label: 'Gürültü', tint: '#F0BAC2' },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]['slug'];

// Neutral tint for the fallback mark (a report whose category isn't in the set,
// e.g. a DB slug added before an app deploy — see components/category-mark.tsx).
export const FALLBACK_TINT = '#C9D6D3';

export function getCategory(slug: string | undefined | null) {
  return CATEGORIES.find((c) => c.slug === slug) ?? null;
}
