import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

// Client-side display preferences (web-only), persisted to localStorage and
// applied to <html> as data-attributes that drive the CSS variables in
// app/+html.tsx. A no-flash inline script there applies the same values before
// first paint; this provider owns them for the rest of the session and lets the
// settings screen change them. Keys are shared with that script.

export type ThemePref = 'system' | 'light' | 'dark';
export type TextScale = 'md' | 'lg' | 'xl';

const KEY = { theme: 'mdr:theme', contrast: 'mdr:contrast', scale: 'mdr:textscale', motion: 'mdr:motion' };

type Ctx = {
  themePref: ThemePref;
  setThemePref: (v: ThemePref) => void;
  contrast: boolean;
  setContrast: (v: boolean) => void;
  textScale: TextScale;
  setTextScale: (v: TextScale) => void;
  reducedMotion: boolean;
  setReducedMotion: (v: boolean) => void;
  // Resolved 'light' | 'dark' for the few JS spots that can't use a CSS var
  // (the data-URI icons, the spinner colour).
  resolvedTheme: 'light' | 'dark';
};

const DisplayContext = createContext<Ctx | null>(null);

const hasWindow = typeof window !== 'undefined';
const read = (k: string) => (hasWindow ? window.localStorage.getItem(k) : null);
const systemDark = () => hasWindow && window.matchMedia('(prefers-color-scheme: dark)').matches;

export function DisplaySettingsProvider({ children }: PropsWithChildren) {
  // Initial state matches the server-rendered default (light/off) to avoid a
  // hydration mismatch; the mount effect below reconciles with localStorage.
  const [themePref, setTheme] = useState<ThemePref>('system');
  const [contrast, setContrastState] = useState(false);
  const [textScale, setScaleState] = useState<TextScale>('md');
  const [reducedMotion, setMotionState] = useState(false);
  const [systemIsDark, setSystemIsDark] = useState(false);
  // Gates the reflect effect below until the mount reconcile has committed the
  // saved prefs. Without it, the reflect effect fires once with the still-default
  // render state (light/system) and rewrites <html> data-theme + localStorage
  // before reconcile lands — a light flash for dark-mode users that defeats the
  // no-flash script in +html.tsx. The inline script already set the correct
  // pre-paint value, so skipping that first write loses nothing.
  const [ready, setReady] = useState(false);

  // Reconcile with saved prefs on mount, and follow the OS scheme for 'system'.
  useEffect(() => {
    const t = read(KEY.theme);
    if (t === 'light' || t === 'dark' || t === 'system') setTheme(t);
    setContrastState(read(KEY.contrast) === '1');
    const s = read(KEY.scale);
    if (s === 'lg' || s === 'xl' || s === 'md') setScaleState(s);
    setMotionState(read(KEY.motion) === '1');

    setSystemIsDark(systemDark());
    setReady(true);
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setSystemIsDark(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const resolvedTheme: 'light' | 'dark' =
    themePref === 'system' ? (systemIsDark ? 'dark' : 'light') : themePref;

  // Reflect state onto <html> + localStorage. Runs on the client only, and only
  // after the mount reconcile (ready) so the first write can't clobber saved
  // prefs with the default render state.
  useEffect(() => {
    if (!hasWindow || !ready) return;
    const d = document.documentElement;
    d.dataset.theme = resolvedTheme;
    window.localStorage.setItem(KEY.theme, themePref);

    if (contrast) d.dataset.contrast = 'hc';
    else delete d.dataset.contrast;
    window.localStorage.setItem(KEY.contrast, contrast ? '1' : '0');

    if (textScale === 'md') delete d.dataset.textscale;
    else d.dataset.textscale = textScale;
    window.localStorage.setItem(KEY.scale, textScale);

    if (reducedMotion) d.dataset.motion = 'reduce';
    else delete d.dataset.motion;
    window.localStorage.setItem(KEY.motion, reducedMotion ? '1' : '0');
  }, [ready, resolvedTheme, themePref, contrast, textScale, reducedMotion]);

  // useState setters are already stable identities, so the context object only
  // needs to change when a displayed value does. (Never wrap these in useCallback
  // *inside* this factory — a hook nested in the useMemo callback isn't run on
  // renders where the deps are unchanged, which crashes with "rendered fewer
  // hooks than expected".)
  const value = useMemo<Ctx>(
    () => ({
      themePref,
      setThemePref: setTheme,
      contrast,
      setContrast: setContrastState,
      textScale,
      setTextScale: setScaleState,
      reducedMotion,
      setReducedMotion: setMotionState,
      resolvedTheme,
    }),
    [themePref, contrast, textScale, reducedMotion, resolvedTheme]
  );

  return <DisplayContext.Provider value={value}>{children}</DisplayContext.Provider>;
}

export function useDisplaySettings(): Ctx {
  const ctx = useContext(DisplayContext);
  if (!ctx) throw new Error('useDisplaySettings must be used within DisplaySettingsProvider');
  return ctx;
}

// Lightweight reader for components that only need the resolved theme (icons,
// spinners) and shouldn't crash if rendered outside the provider (defaults light).
export function useResolvedTheme(): 'light' | 'dark' {
  return useContext(DisplayContext)?.resolvedTheme ?? 'light';
}
