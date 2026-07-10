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

**Type:**
- Numeric and "logged" moments — report counts, dates, IDs, the routing result's contact details — use a monospace face (`IBM Plex Mono` or system mono). This is the one place the ledger metaphor shows up in type, and it should feel deliberate, not decorative.
- Everything else — body copy, buttons, headings — uses a warm humanist sans (`Work Sans` or similar). Legible first; this app needs to work for people who aren't comfortable with technology.
- No display serif. It's the expected choice for this kind of "heritage-adjacent" direction and would read as generic here rather than specific.

**Signature element:** report list rows are styled as ledger entries, not cards — a thin rule between rows, tabular alignment (category · neighborhood · date · confirmation count), and status shown as a small circular stamp mark rather than a rounded pill badge. This is the one place the design takes a real position; everything else (forms, buttons, the routing result screen) stays quiet and standard so the ledger rows read as intentional rather than as one choice among many competing ones.

Spend the visual budget there. The report/category-picker screen, the routing result, and the how-it-works screen should all be plain, clear, and fast — no decoration competing with the one job those screens have.

---

## 2. Screens

Matches `PRD.md` §8. Notes below are structural, not exhaustive specs.

**Home** — CTA button (petrol, full width on mobile) plus a compact preview list (ledger-row style) of the 3–5 most recent nearby reports. Empty state if there's no location permission: a plain prompt to enable it, not a dead screen.

**Report — category** — four large tap targets (min 64px tall on mobile), one per category, icon + label. This is the highest-traffic screen; it should be reachable in one tap from Home.

**Report — details** — optional description field, optional photo (native camera/file picker), map pin defaulting to detected location with a drag handle. Nothing here is required except the category already chosen.

**Routing result** — the channel name and contact info in monospace (the "stamped" treatment), a checklist of required info as plain checkboxes (visual only, not saved state), and a copy-to-clipboard button for the contact block.

**Add to map** — a distinct screen, not a checkbox tacked onto the details form. Explicit opt-in with a one-line explanation of what becomes public (photo and approximate location, no personal info).

**Map / list view** — list is the default and the fallback; map is progressive enhancement for wider viewports. Filter chips for category and status sit above both. On list rows, use the ledger-entry treatment described above.

**Report detail** — description, photo, first-reported date, confirmation count as a simple number (not a chart), two buttons: "I see this too" (terracotta outline) and "this got fixed" (moss outline).

**How it works** — plain text, no illustration needed. This screen exists to do one job clearly: state what the app is and isn't.

---

## 3. Component conventions

- **Category chip** — used in the picker and as filters. Icon + label, `petrol` fill when selected, `ink` outline when not.
- **Status stamp** — small circular mark, `terracotta` for open, `moss` for resolved. Always paired with a text label, never color alone.
- **Ledger row** — the signature list treatment described in §1. One component, reused on Home's preview and the full map/list view.
- **Primary button** — `petrol` fill, `paper` text, full-width on mobile, standard width on larger viewports.
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

## 8. Performance notes

Loading speed is directly scored — treat it as a requirement, not a nice-to-have.

- Compress photo uploads client-side before writing to Supabase storage; don't ship full-resolution camera photos.
- Lazy-load the map library — it's the heaviest dependency in the app and only screen 6 needs it.
- No animation libraries for a product this scoped. CSS/RN transitions are enough.
