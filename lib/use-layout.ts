import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

// Responsive breakpoints. Mobile-first, but on tablet/desktop the wider screens
// reflow (grids, side-by-side) instead of staying a single phone column.
//   phone   < 768   single column (the base design)
//   tablet ≥ 768   2 columns / side-by-side
//   desktop ≥ 1024  roomier: 3-up grids, wider content
//
// We read window.innerWidth directly (not RN's useWindowDimensions) and reconcile
// once on mount: the static web export prerenders at a default width and a purely
// static screen (e.g. the category picker) never re-renders on its own, so
// useWindowDimensions would stay stuck at that default. Starting from the mobile
// base and reconciling on mount keeps SSR markup consistent (no hydration
// mismatch) — desktop reflows in on load, like the lazy map.
const hasWindow = typeof window !== 'undefined';

export function useLayout() {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (Platform.OS !== 'web' || !hasWindow) return;
    const onResize = () => setWidth(window.innerWidth);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // width 0 = pre-measure (SSR / first paint) → treat as phone (the base layout).
  return {
    width,
    isTablet: width >= 768,
    isDesktop: width >= 1024,
  };
}
