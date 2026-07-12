// Turkish-aware search normalization: lowercase with the tr locale (so İ/I map
// correctly) then fold the diacritics, so a user typing without Turkish letters
// still finds the official spelling — "cukurova" matches "Çukurova", "saricam"
// matches "Sarıçam". Display always keeps the official name; this is only for
// matching.
const FOLD: Record<string, string> = {
  ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u', â: 'a', î: 'i', û: 'u',
};

export function trNormalize(s: string): string {
  return s
    .toLocaleLowerCase('tr')
    .replace(/[çğıöşüâîû]/g, (c) => FOLD[c] ?? c)
    .trim();
}

// True if `query` matches `text` (Turkish-folded, case-insensitive substring).
export function trMatch(text: string, query: string): boolean {
  const q = trNormalize(query);
  return q.length === 0 || trNormalize(text).includes(q);
}
