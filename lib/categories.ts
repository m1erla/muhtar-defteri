// The four report categories — PRD §8. The tap-to-select picker is the primary
// classification mechanism; these slugs match the channels.category values in
// supabase/schema.sql.
export const CATEGORIES = [
  { slug: 'cleanliness', label: 'Temizlik / Çöp', emoji: '🗑️' },
  { slug: 'parking', label: 'Hatalı Park', emoji: '🚗' },
  { slug: 'infrastructure', label: 'Kaldırım / Altyapı', emoji: '🚧' },
  { slug: 'school_safety', label: 'Okul Çevresi Güvenliği', emoji: '🏫' },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]['slug'];

export function getCategory(slug: string | undefined | null) {
  return CATEGORIES.find((c) => c.slug === slug) ?? null;
}
