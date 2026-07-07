import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState, type DependencyList } from 'react';

export type LoadState<T> =
  | { status: 'loading' }
  // Carries the original thrown value so callers can type-check it
  // (e.g. friendlyDbError's SupabaseConfigError branch) — never rewrap it.
  | { status: 'error'; error: unknown }
  | { status: 'ready'; data: T };

type Options = {
  // Re-run on every screen focus (expo-router), not just on mount/dep change —
  // for lists that must reflect writes made on screens pushed above them.
  refetchOnFocus?: boolean;
  // Stale-while-revalidate: keep showing the previous data during a reload
  // instead of flashing back to the spinner.
  keepDataWhileReloading?: boolean;
};

// The one async-load state machine for all data screens. Guards against
// stale responses: when deps change (or reload/focus re-fires) while an older
// request is still in flight, the older result is discarded.
export function useLoad<T>(
  fn: () => Promise<T>,
  deps: DependencyList,
  { refetchOnFocus = false, keepDataWhileReloading = false }: Options = {}
): { state: LoadState<T>; reload: () => void; mutate: (data: T) => void } {
  const [state, setState] = useState<LoadState<T>>({ status: 'loading' });
  const requestSeq = useRef(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const load = useCallback(async () => {
    const seq = ++requestSeq.current;
    setState((prev) =>
      keepDataWhileReloading && prev.status === 'ready' ? prev : { status: 'loading' }
    );
    try {
      const data = await fn();
      if (seq === requestSeq.current) setState({ status: 'ready', data });
    } catch (err) {
      if (seq === requestSeq.current) {
        // Stale-while-revalidate: a failed reload keeps the data already on
        // screen instead of blanking it to an error (mirrors the loading path
        // above). Prevents a transient refetch blip on refocus from wiping a
        // good list; it self-heals on the next focus or retry.
        setState((prev) =>
          keepDataWhileReloading && prev.status === 'ready' ? prev : { status: 'error', error: err }
        );
      }
    }
  }, deps);

  useEffect(() => {
    if (!refetchOnFocus) load();
  }, [refetchOnFocus, load]);

  useFocusEffect(
    useCallback(() => {
      if (refetchOnFocus) load();
    }, [refetchOnFocus, load])
  );

  const mutate = useCallback((data: T) => {
    requestSeq.current++; // invalidate any in-flight request
    setState({ status: 'ready', data });
  }, []);

  return { state, reload: load, mutate };
}
