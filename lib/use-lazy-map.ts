import { useCallback, useEffect, useState, type ComponentType } from 'react';
import { Platform } from 'react-native';

type MapsModule = typeof import('@/components/maps');

// The maps module (the app's only leaflet chunk) must NEVER be imported
// statically — leaflet touches `window` at import time and breaks the static
// web export. This hook owns that invariant, the web-only gate, and the
// failed-chunk-load state (a flaky connection must not strand the screen on a
// forever-loading placeholder).
export function useLazyMap<K extends keyof MapsModule>(
  exportName: K,
  enabled = true
): { Map: ComponentType<any> | null; failed: boolean; retry: () => void } {
  const shouldLoad = enabled && Platform.OS === 'web';
  const [Map, setMap] = useState<ComponentType<any> | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!shouldLoad || Map) return;
    let live = true;
    import('@/components/maps').then(
      (mod) => {
        if (live) setMap(() => mod[exportName] as ComponentType<any>);
      },
      () => {
        if (live) setFailed(true);
      }
    );
    return () => {
      live = false;
    };
  }, [shouldLoad, Map, exportName, attempt]);

  const retry = useCallback(() => {
    setFailed(false);
    setAttempt((n) => n + 1);
  }, []);

  return { Map, failed, retry };
}
