# FRONTEND.md

UI architecture and design direction for Mahalle Defteri. Product requirements live in `PRD.md`; this file covers how it should look, feel, and be structured.

---

## 1. Design direction

The obvious reference for a civic app is generic trust-blue and a rounded sans-serif — skip it. The more specific, ownable world here is the *muhtar's own desk*: a ledger (kayıt defteri) with lined pages, a rubber stamp and ink pad, entries logged in order. That's a better fit for what this product actually does — logging, stamping, tracking — than a generic government-blue dashboard, and it reads as warmer and more human than an official portal, which matters given the app has to avoid looking like one.

**Palette** (5 colors, used with restraint):

| Token | Hex | Use |
|---|---|---|
| `ink` | `#2B2620` | primary text, structure — a warm near-black, not pure black |
| `paper` | `#EDE6D8` | background — aged ledger paper, not stark cream |
| `petrol` | `#1F5C5C` | primary actions, links, trust — evokes the Seyhan river, distinct from corporate blue |
| `terracotta` | `#BC5A3C` | status: open / needs attention — Adana brick and roof tile |
| `moss` | `#5B7052` | status: resolved / handled |

**Category accent tints** (added 2026-07-12) — a disciplined extension, NOT a
free-for-all: one soft, paper-friendly tint per category, living as data on
each entry in `lib/categories.ts` (never hardcoded in components). They fill the
rounded icon container (`CategoryMark`) so the eight categories read as
colour-*coded* and scannable — real Risograph work is vivid, so "colourful" and
"on-brand" aren't in tension here. Rules that keep it calm: the icon stays `ink`
on the tint (≈8.7:1, far past WCAG's 3:1 non-text bar), colour is never the sole
cue (a label always sits beside the mark and the silhouettes differ), and the
status colours (`terracotta`/`moss`) are reserved for status — a category never
borrows them. Tints: cleanliness `#BFDCB0`, parking `#B4CFE6`, infrastructure
`#F0C48C`, school_safety `#D3C3E6`, street_lighting `#E7DA7E`, water_sewage
`#ADD8D2`, stray_animals `#DCC29E`, noise `#F0BAC2` (neutral fallback `#C9D6D3`).

**Type:**
- Numeric and "logged" moments — report counts, dates, IDs, the routing result's contact details — use a monospace face (`IBM Plex Mono` or system mono). This is the one place the ledger metaphor shows up in type, and it should feel deliberate, not decorative.
- Everything else — body copy, buttons, headings — uses a warm humanist sans (`Work Sans` or similar). Legible first; this app needs to work for people who aren't comfortable with technology.
- No display serif. It's the expected choice for this kind of "heritage-adjacent" direction and would read as generic here rather than specific.

**Adana visual layer** (added 2026-07-13) — a subtle sense of place, drawn in the
same Riso ink language as the icons, never decoration for its own sake:
- **"Sivri"** (`components/sivri.tsx`) — the neighbourhood mosquito, Adana's
  self-deprecating local emblem reimagined *friendly*: he **writes reports (a
  pencil for a nose) instead of biting**. Pure inline SVG (web-only escape hatch,
  like `app/+html.tsx`), a few KB, no libraries. Ink linework is `currentColor`
  (`var(--ink)`), petrol/paper via `var()` styles, so he flips light/dark with
  everything. Three moods — `idle` (Home hero, how-it-works, add-to-map),
  `sleep` (empty states, closed eyes + drifting Zzz), `happy` (add-to-map
  success, waves his pencil). Decorative by rule → `aria-hidden`, a text label
  always beside him.
- **Adana skyline** (`components/adana-skyline.tsx`) — a thin footer line-art of
  the Sabancı Merkez Camii (its six minarets are the city's signature), the
  Taşköprü arches, palms and the Seyhan (in petrol). Faint, decorative.
- Motion is CSS-only keyframes in `app/+html.tsx` (float, wing flutter, wave,
  Zzz), automatically frozen by the existing `prefers-reduced-motion` /
  `data-motion="reduce"` kill switch — so it's a still drawing for anyone who
  opts out, and adds nothing to the scored cold-load. **No 3D/WebGL** (would
  bloat the bundle, sit outside the theming/a11y system, and read as a generic
  template — the opposite of the point).

**Signature element:** report list rows are styled as ledger entries, not cards — a thin rule between rows, tabular alignment (category · neighborhood · date · confirmation count), and status shown as a small circular stamp mark rather than a rounded pill badge. This is the one place the design takes a real position; everything else (forms, buttons, the routing result screen) stays quiet and standard so the ledger rows read as intentional rather than as one choice among many competing ones.

Spend the visual budget there. The report/category-picker screen, the routing result, and the how-it-works screen should all be plain, clear, and fast — no decoration competing with the one job those screens have.

---

## 2. Screens

Matches `PRD.md` §8. Notes below are structural, not exhaustive specs.

**Home** — CTA button (petrol, full width on mobile) plus a compact preview list (ledger-row style) of the 3–4 most recent reports. Adana-only, so there's no location gate (requesting geolocation on the landing screen would hurt the scored first load). Two distinct quiet states: a "no reports yet" empty state, and a separate tap-to-retry line if the fetch fails — a failed load must not read as "no reports".

**Report — category** — eight large tap targets (min 64px tall on mobile), one per category, icon + label. This is the highest-traffic screen; it should be reachable in one tap from Home.

**Report — details** — optional description field, optional photo (native camera/file picker), map pin defaulting to detected location with a drag handle. Nothing here is required except the category already chosen.

**Routing result** — the channel name and contact info in monospace (the "stamped" treatment), a checklist of required info as plain checkboxes (visual only, not saved state), and a copy-to-clipboard button for the contact block.

**Add to map** — a distinct screen, not a checkbox tacked onto the details form. Explicit opt-in with a one-line explanation of what becomes public (photo and approximate location, no personal info).

**Map / list view** — list is the default and the fallback; map is progressive enhancement for wider viewports. Filter chips for category and status sit above both. On list rows, use the ledger-entry treatment described above.

**Report detail** — description, photo, first-reported date, confirmation count as a simple number (not a chart), two buttons: "I see this too" (terracotta outline) and "this got fixed" (moss outline).

**How it works** — plain text, no illustration needed. This screen exists to do one job clearly: state what the app is and isn't.

---

## 3. Component conventions

- **Category chip** — used in the picker and as filters. Icon + label, `petrol` fill when selected, `ink` outline when not.
- **Category mark** (`components/category-mark.tsx`) — the one component for every category-icon appearance (picker tiles, ledger rows, Kanal Rehberi headers, report-detail header): the Riso icon inside a soft accent-tinted rounded container (per-category `tint`, hairline ink edge). Handles the pressed state (chip drops out, icon prints in `paper` tone on the petrol tile) and an unknown-slug fallback. Keeps the colour identity in one place.
- **Icon set** (`components/icon.tsx`) — hand-drawn Riso-style marks (one per category + camera + pin), NOT emoji and not an icon library. Two "print layers" each: a petrol accent silhouette offset ~2px under wobbly ink linework (the misregistration of a real Riso print), authored as inline SVG data-URIs. The `paper` tone is a single-color print for petrol surfaces (pressed tiles). Icons are always decorative — a text label rides alongside, same rule as the stamp.
- **Status stamp** — small circular mark, `terracotta` for open, `moss` for resolved. Always paired with a text label, never color alone.
- **Ledger row** — the signature list treatment described in §1. One component, reused on Home's preview and the full map/list view.
- **Primary button** — `petrol` fill, `paper` text, full-width on mobile, standard width on larger viewports.
- **Combobox** (`components/combobox.tsx`) — accessible searchable select: a labelled trigger expands to a Turkish-aware search field + filtered option-button list (type to filter, Enter selects first, Escape closes; every option a focusable button with selected state). Theme-token colours. Used for the Adana **district** selector on report-details — the non-map, keyboard/screen-reader way to set a report's location (picking a district jumps+zooms the map pin there via `lib/adana-districts.ts`). The hierarchy is Adana-scoped: province is always Adana, so it's district-level only; neighbourhood stays reverse-geocoded from the pin.
- **Disclosure** — animation-free expand/collapse row (ledger-ruled bottom hairline, mono `+`/`−` mark in `petrol`). Used for the guide screen's FAQ/troubleshooting lists — the mobile-friendly form of "a table of guidance". Carries `aria-expanded` and a 48px header.
- Keep the component set small. This app has roughly 8 screens and doesn't need a large shared library — resist building generic abstractions for one-off UI.

## 4. Navigation

Simple stack navigation (Expo Router or React Navigation stack, either is fine) — no tabs, no drawer. The flow is linear enough that a bottom-tab structure would add complexity without adding clarity: Home → category → details → routing result → (optional) add to map, and a separate Home → map/list → report detail branch.

## 5. State management

Local component state plus a small context for the anonymous session id. Nothing here justifies Redux or a global store — resist adding one.

## 6. Responsive rules

Mobile-first, always. Build every screen at a ~375px viewport first, then check it scales up. The map component specifically needs testing at mobile width early — it's the screen most likely to break first when adapted from a desktop-first build.

## 7. Accessibility baseline

- Minimum 44px tap targets throughout, 64px for the category picker specifically (see §2).
- Status must never be color-only — the stamp always carries a text label alongside color.
- Text scales with system font size settings; nothing is set in fixed pixel units that ignores user preferences.
- Contrast: `ink` on `paper` and `paper` on `petrol` both need verification against WCAG AA before shipping — check, don't assume.
- Helper/dim text uses the solid `inkMuted` token, never `opacity` dimming (opacity can silently drop below AA).
- Web shell (`app/+html.tsx`) carries three global touches: a 4%-opacity monochrome paper-grain overlay (the Riso print feel — far too faint to affect contrast), a `petrol` `:focus-visible` ring for keyboard users, and a `prefers-reduced-motion` kill switch for residual animation.
- **Theming** (added 2026-07-12): `colors` in `lib/theme.ts` are CSS `var()` tokens; the concrete light / dark ("night ledger") / high-contrast palettes live in `PALETTES` and are emitted as `:root` / `[data-theme="dark"]` / `[data-contrast="hc"]` variable blocks in the web shell, swapped by a `data-*` attribute on `<html>`. A no-flash inline script applies the saved choice before first paint. All three palettes are WCAG-AA-checked (light unchanged from the original hex). The **Settings** screen (`lib/display-settings.tsx`) persists theme / high-contrast / text-size (a `zoom` step) / reduced-motion in localStorage — no account. Icons are the one non-var surface (baked into data-URIs): they switch by TONE (ink↔paper) because the category chip stays light in both themes.

## 8. Performance notes

Loading speed is directly scored — treat it as a requirement, not a nice-to-have.

- Compress photo uploads client-side before writing to Supabase storage; don't ship full-resolution camera photos.
- Lazy-load the map library — it's the heaviest dependency in the app and only screen 6 needs it.
- No animation libraries for a product this scoped. CSS/RN transitions are enough.
