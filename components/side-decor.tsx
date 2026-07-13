import { Platform } from 'react-native';

// Decorative side panels for wide screens — the AI-generated Adana margin art
// (public/decor/margin-left|right.webp): ledger page-edge + the Adana skyline,
// palms and Taşköprü, bottom-weighted and fading to transparent toward the
// content. The centred column is untouched: these two fixed panels sit only in
// the empty gutters (positioned via calc in app/+html.tsx), pointer-events:none,
// aria-hidden. Web-only. Hidden ≤980px (phones/tablets) and in dark mode (the
// art is light-theme cream paper — a dark variant can be dropped in later).
export default function SideDecor() {
  if (Platform.OS !== 'web') return null;
  return (
    <>
      <div className="mdr-side mdr-side-l" aria-hidden="true" />
      <div className="mdr-side mdr-side-r" aria-hidden="true" />
    </>
  );
}
