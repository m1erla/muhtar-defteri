import { Platform } from 'react-native';

// Decorative side panels for wide screens — the AI-generated Adana margin art
// (public/decor/margin-{left,right}[-dark].webp). Left = Sabancı Camii, Taşköprü
// and palms; right = Büyük Saat Kulesi, the Varda viadüğü, orange blossom and
// cotton — deliberately different motifs per side, each with a night-ledger dark
// variant. The centred column is untouched: these two fixed panels fill only the
// empty gutters (sized via calc in app/+html.tsx), full viewport height since the
// header bar is transparent. pointer-events:none, aria-hidden, web-only, and not
// even fetched ≤980px (phones/tablets).
export default function SideDecor() {
  if (Platform.OS !== 'web') return null;
  return (
    <>
      <div className="mdr-side mdr-side-l" aria-hidden="true" />
      <div className="mdr-side mdr-side-r" aria-hidden="true" />
    </>
  );
}
