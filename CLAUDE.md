# CLAUDE.md

Instructions for Claude Code working in this repository. Full product context lives in `PRD.md` and UI/design direction in `FRONTEND.md` — read those for depth, treat this file as the operating rules. (`SUBMISSION.md` holds the competition description, `DEMO.md` the jury walkthrough, `OPERATIONS.md` the owner's moderation/hosting runbook — there is deliberately no in-app admin.)

## Project snapshot

Mahalle Defteri: a web app (Expo, deployed to web) that routes Adana residents to the correct official channel for a local civic problem, and logs an optional public report to a community transparency map. Solo build, competition deadline July 17, 2026. See `PRD.md` §1–2 for the full problem statement.

## Stack

- Expo (React Native), **web is the primary deploy target** — not a native app store submission.
- Supabase (Postgres + REST client). No realtime subscriptions needed.
- `react-leaflet` for maps. **Not `react-native-maps`** — see Gotchas below, this is not optional.
- No auth. Identity is an anonymous UUID generated client-side and persisted locally.

## Non-negotiable rules

- **Adana only.** Never add multi-city logic, city selectors, or "expand to other provinces" scaffolding unless explicitly asked. This is the single most common way this project accidentally grows out of scope. Routing channels are Adana-specific and hand-verified; a province selector would misroute other provinces to Adana's hotlines. Location has three non-map paths on report-details, all **Adana-bounded**: (1) an **address search** (`lib/geocode.ts`, Nominatim *forward* geocode constrained to the same bbox as the `reports_within_adana` guard — `viewbox`+`bounded=1`, plus a client-side re-check, so a picked result can never land outside the province; user-triggered, never per-keystroke, per Nominatim policy), (2) the **district** (İlçe) `Combobox` — Adana's 15 districts in `lib/adana-districts.ts` (the one data-driven source), the offline/keyboard/screen-reader fallback, and (3) **"Konumumu Bul"** geolocation. All three drop/move the draggable map pin, and **every pin path is Adana-bounded client-side** via the one exported `inAdana()` in `lib/geocode.ts` (same numbers as the DB guard): the picker map has `maxBounds` on the box (viscosity 1 — can't pan away) with a drag snap-back, and both geolocation paths reject an out-of-province device with an immediate message instead of failing at the DB three screens later. **The map must never be the only way to set a location**; map moves must stay reduced-motion-safe (instant `setView`). Keep the search Adana-bounded — it is a *finer* path (street/mahalle), never a wider one (no province selector).
- **Category picker is the primary classification UI**, not free-text AI parsing. If adding AI-assisted suggestions, they must be optional and sit alongside the tap-to-select flow, never replace it.
- **Theming runs on CSS variables, web-only.** `lib/theme.ts` `colors` are `var(--x)` refs; the concrete light/dark/high-contrast palettes live in `PALETTES` and are emitted as `:root` / `[data-theme]` / `[data-contrast]` blocks by `app/+html.tsx` (with a no-flash init script). Light must stay pixel-identical to the original hex (regression gate). Preferences (theme/contrast/text-size/motion) persist in localStorage via `lib/display-settings.tsx` — no account. The only colours that can't be `var()` are the icon data-URI SVGs (use `RAW`) — those switch theme by TONE (ink↔paper), since the category chip is always light. Any new colour must be a token in all three palettes, contrast-checked; never a raw hex in a screen.
- **Category visuals are data-driven and colour is never the only cue.** Each category's icon slug + accent `tint` live on its entry in `lib/categories.ts` (the single source — never hardcode category colours/lists across components); every surface renders them through the one `CategoryMark` component. A category is always identifiable by shape + label, not tint alone (colour-blind/low-vision safety), the icon stays `ink` on the tint for contrast, and `terracotta`/`moss` stay reserved for status. Keep the accent palette a small, calm extension (FRONTEND.md §1) — no neon, no per-component one-off colours.
- **Never write copy implying this is an official government channel.** The product is "Mahalle Defteri" (neighborhood ledger) — a community record, deliberately not an official portal. The name was changed from "Dijital Muhtar" precisely to avoid colliding with the official Muhtar Bilgi Sistemi / e-Muhtar services and reading as authoritative; don't reintroduce "Muhtar" in the product name or copy. The muhtar's-desk *ledger* remains the visual design metaphor (FRONTEND.md), which is fine. Every screen touching the routing result should read as helpful, not official.
- **Don't build user accounts.** If a feature seems to need identity beyond the anonymous session id, that's a signal to simplify the feature, not add auth.
- **channels is seed data**, not user-editable through the app UI. Reports and confirmations are the only user-writable tables.
- **Flagging is a private signal, never an automatic action.** Users flag a bad report (reason + optional note) via the accessible `FlagForm` on report-detail → the append-only, RLS-**private** `flags` table (anon can INSERT but not read; owner reviews via `OPERATIONS.md`). A report is NEVER auto-hidden/deleted by flag count (many flags ≠ proof — could be coordinated; independent sessions are the stronger signal). No AI decides; the owner does. Same deterministic DB guards as the rest (per-session rate limit `MDR_FLAG_RATE`, one-flag-per-report dedup, no-links/length on the note). User-facing copy stays neutral — never "fake"/"false".
- **Moderation is deterministic and DB-enforced, not AI and not server-side** — there is no server. Rate limits, the double-submit guard, the Adana bounding box, the no-links rule and the status-transition guard live in `supabase/schema.sql` (triggers + constraints, `MDR_*` error codes mapped to neutral Turkish in `lib/supabase.ts`). Owner/SQL-editor writes skip the triggers. Never add a guard that blocks *independent* sessions reporting the same issue (that's the ⟳ signal, not spam), never auto-delete anything, and keep user-facing failure copy neutral — the runbook for judgment calls is `OPERATIONS.md`.
- **Report freshness is derived, and archiving hides — never deletes.** With no official status feed and no accounts, freshness = time since the last community confirmation (computed at render; `STALE_DAYS`/`ARCHIVE_DAYS` in `lib/format.ts`, `isArchivable` in `lib/reports.ts`). Stale reports get a "hâlâ duruyor mu?" re-verification prompt that *anyone* can answer (we can't notify an anonymous reporter — community re-verification replaces per-user notifications), and old-unverified reports drop off the default map behind a toggle. No cron, no auto-deletion; purge stays a deliberate owner action (`OPERATIONS.md`).

## Architecture at a glance

```
app/
  _layout.tsx            -- root Stack, font loading, global ErrorBoundary
  +html.tsx              -- static web shell: lang, meta/OG, favicon links
  index.tsx              -- redirect to /home
  (screens)/             -- the 13 screens (home, report-category, report-details,
                            routing-result, add-to-map, map-list, report-detail,
                            how-it-works, channels = Kanal Rehberi directory,
                            settings = Görünüm/erişilebilirlik,
                            watchlist = Takip Ettiklerim, device-local,
                            about-sivri = the mascot's story,
                            gizlilik = KVKK privacy page)
components/              -- sibling of app/, NOT inside it — expo-router treats
                            files under app/ as routes. maps.tsx (the ONLY leaflet
                            import site), sivri.tsx (the mascot), side-decor.tsx +
                            adana-skyline.tsx (the Adana art), combobox.tsx,
                            flag-form.tsx, category-mark.tsx, ledger-row.tsx, …
lib/
  supabase.ts            -- lazy client + SupabaseConfigError/friendlyDbError
  session.ts             -- anonymous session id, local persistence
  reports.ts, channels.ts, categories.ts, cluster.ts, format.ts,
  report-draft.ts, theme.ts, use-load.ts, use-lazy-map.ts,
  display-settings.tsx (theme/a11y prefs), geocode.ts (Adana-bounded
  Nominatim), adana-districts.ts, tr-normalize.ts, watchlist.ts
  (device-local follows), flags.ts, flash.ts,
  ads.ts (ad system — ON by default on web, KVKK consent-gated; kill switch
  EXPO_PUBLIC_ADS=0; runbook + HARD do-not-place list in OPERATIONS.md)
public/                  -- copied verbatim to the web export root
  favicon.svg, apple-touch-icon.png, og-image.png, _headers
  decor/                 -- ~1.4MB of Adana art (margin-*, skyline-band-*,
                            sivri-hero, paper-texture; light + dark variants).
                            Desktop-only and never fetched ≤980px; cached a week
                            via _headers. NOT on the mobile critical path.
supabase/
  schema.sql             -- authoritative migration (tables + RLS + storage);
                            PRD.md §10 mirrors it, keep in sync
  seed/
    channels.sql         -- Adana + national routing data, see PRD.md §11
    demo-reports.sql     -- optional owner-run demo data for the walkthrough
```

## Commands

```
npx expo start --web    # local dev
npm run build:web       # production web build (expo export --clear + 404.html copy)
npm run deploy          # manual override: build:web + wrangler deploy (Workers)
```

**Deploy is git-connected CI on Cloudflare Workers** (Static Assets, not Pages — the
repo was converted by Cloudflare's `workers-autoconfig` PR; config in `wrangler.jsonc`,
`assets.directory` = `dist`). The `muhtar-defteri` Worker builds from
`github.com/m1erla/muhtar-defteri` on every push to `main`, so **`git push` is the
canonical deploy**; `npm run deploy` is a manual fallback. The CI build reads the
Supabase creds from the Worker's build env vars (they must stay set, or CI ships a
keyless build). **Set the Workers Builds _Build command_ to `npm run build:web`** (it
defaults to `npx expo export -p web`): `build:web` runs `--clear` (Metro inlines
`EXPO_PUBLIC_*`, so without it an `.env` change ships stale creds) and copies
`+not-found.html` → `404.html`. Unknown paths return a real 404, not an SPA 200;
`wrangler.jsonc` sets `not_found_handling: "404-page"` to show the branded `404.html`
— but that file only exists if the build ran `build:web` (a plain `expo export`
emits `+not-found.html`, not `404.html`, so the 404 stays unbranded until then). Live
at **muhtar-defteri.com**; the `*.workers.dev`/legacy `*.pages.dev` hostnames are
ISP-blocked on some Turkish networks (hence the custom domain). Vercel is retired.

## Data model

Three tables — `channels`, `reports`, `confirmations`. Full DDL and field-level rationale in `PRD.md` §10. Keep `supabase/schema.sql` as the single source of truth for the actual migration; PRD.md is the readable reference, not the other way around.

## Gotchas

- **Maps on web:** `react-native-maps` wraps native iOS/Android SDKs and renders nothing on Expo's web target. Use `react-leaflet` with OpenStreetMap tiles — free, no API key, works immediately on web.
- **Adana's "153" line:** ALO 153 is Adana Büyükşehir Belediyesi's own municipal call center, not to be confused with unrelated "153"-pattern numbers used by other institutions. Don't let in-app copy conflate them.
- **The ALO 153 WhatsApp number (0535 454 01 01) was verified on the official adana.bel.tr unit page on 2026-07-03** — but that page's content is old (2016-era, Word-exported HTML). Do a live send-test before the competition demo. Also verified then: Alo 155 no longer exists standalone in Adana (consolidated into 112), and EGM's online ihbar form moved to ihbar.ng112.gov.tr — don't reintroduce "Alo 155" from the PRD's older channel list.
- **Don't add complex geo-clustering.** Group nearby reports by the `neighborhood` text field or a coarse coordinate rounding, not a spatial radius query — full PostGIS clustering is scope this project doesn't need.
- **Photo picker on web must fire from a direct user interaction** (a button's onPress), not from a `useEffect` or after an `await`. Browsers silently block `ImagePicker.launchImageLibraryAsync()` otherwise — no error, it just does nothing.
- **Test camera and location flows on real iOS Safari, not just Android Chrome.** Safari has historically been the pickier of the two for file-input capture and geolocation behavior.

## Definition of done

A screen isn't done until it's been checked on an actual phone browser, cold — not just resized in a desktop browser. The competition rules score loading speed and stability directly.
