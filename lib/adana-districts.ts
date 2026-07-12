// Adana's 15 districts (ilçe) — the one place this list lives (data-driven, not
// hardcoded across components; CLAUDE.md). Adana-only by design: this app never
// grows a province selector. `zoom` is the map level to jump to when the
// district is chosen — tighter for the dense metro cores, wider for the large
// rural districts. Centres are the district administrative centres (~town
// level); the user fine-tunes with the map pin from there.
//
// Names carry Turkish characters on purpose (official spelling); search folds
// them (lib/tr-normalize.ts) so "cukurova" still finds "Çukurova".
export type District = {
  slug: string;
  name: string;
  latitude: number;
  longitude: number;
  zoom: number;
};

export const ADANA_DISTRICTS: District[] = [
  { slug: 'seyhan', name: 'Seyhan', latitude: 36.9908, longitude: 35.3253, zoom: 14 },
  { slug: 'cukurova', name: 'Çukurova', latitude: 37.0589, longitude: 35.2836, zoom: 14 },
  { slug: 'yuregir', name: 'Yüreğir', latitude: 36.9686, longitude: 35.3800, zoom: 13 },
  { slug: 'saricam', name: 'Sarıçam', latitude: 37.0715, longitude: 35.4290, zoom: 13 },
  { slug: 'ceyhan', name: 'Ceyhan', latitude: 37.0247, longitude: 35.8175, zoom: 13 },
  { slug: 'kozan', name: 'Kozan', latitude: 37.4520, longitude: 35.8150, zoom: 13 },
  { slug: 'imamoglu', name: 'İmamoğlu', latitude: 37.2680, longitude: 35.6580, zoom: 13 },
  { slug: 'karaisali', name: 'Karaisalı', latitude: 37.2560, longitude: 35.0640, zoom: 13 },
  { slug: 'pozanti', name: 'Pozantı', latitude: 37.4290, longitude: 34.8720, zoom: 13 },
  { slug: 'karatas', name: 'Karataş', latitude: 36.5690, longitude: 35.3760, zoom: 13 },
  { slug: 'yumurtalik', name: 'Yumurtalık', latitude: 36.7670, longitude: 35.7890, zoom: 13 },
  { slug: 'aladag', name: 'Aladağ', latitude: 37.5470, longitude: 35.3990, zoom: 12 },
  { slug: 'feke', name: 'Feke', latitude: 37.8190, longitude: 35.9160, zoom: 12 },
  { slug: 'saimbeyli', name: 'Saimbeyli', latitude: 37.9930, longitude: 36.0870, zoom: 12 },
  { slug: 'tufanbeyli', name: 'Tufanbeyli', latitude: 38.2660, longitude: 36.2210, zoom: 12 },
];

export function getDistrict(slug: string | null | undefined): District | null {
  return ADANA_DISTRICTS.find((d) => d.slug === slug) ?? null;
}
