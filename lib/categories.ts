// The four report categories — PRD §8. The tap-to-select picker is the primary
// classification mechanism; these slugs match the channels.category values in
// supabase/schema.sql. Each category's visual mark is the hand-drawn Riso icon
// of the same slug in components/icon.tsx.
export const CATEGORIES = [
  { slug: 'cleanliness', label: 'Temizlik / Çöp' },
  { slug: 'parking', label: 'Hatalı Park' },
  { slug: 'infrastructure', label: 'Kaldırım / Altyapı' },
  { slug: 'school_safety', label: 'Okul Çevresi Güvenliği' },
  { slug: 'street_lighting', label: 'Sokak Aydınlatması' },
  { slug: 'water_sewage', label: 'Su / Kanalizasyon' },
  { slug: 'stray_animals', label: 'Sokak Hayvanları' },
  { slug: 'noise', label: 'Gürültü' },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]['slug'];

export function getCategory(slug: string | undefined | null) {
  return CATEGORIES.find((c) => c.slug === slug) ?? null;
}
