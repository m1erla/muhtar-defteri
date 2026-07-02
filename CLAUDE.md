# CLAUDE.md

Instructions for Claude Code working in this repository. Full product context lives in `PRD.md`, UI/design direction in `FRONTEND.md`, and the execution timeline in `dijital-muhtar-build-spec.md` — read those for depth, treat this file as the operating rules.

## Project snapshot

Dijital Muhtar: a web app (Expo, deployed to web) that routes Adana residents to the correct official channel for a local civic problem, and logs an optional public report to a community transparency map. Solo build, competition deadline July 17, 2026. See `PRD.md` §1–2 for the full problem statement.

## Stack

- Expo (React Native), **web is the primary deploy target** — not a native app store submission.
- Supabase (Postgres + REST client). No realtime subscriptions needed.
- `react-leaflet` for maps. **Not `react-native-maps`** — see Gotchas below, this is not optional.
- No auth. Identity is an anonymous UUID generated client-side and persisted locally.

## Non-negotiable rules

- **Adana only.** Never add multi-city logic, city selectors, or "expand to other provinces" scaffolding unless explicitly asked. This is the single most common way this project accidentally grows out of scope.
- **Category picker is the primary classification UI**, not free-text AI parsing. If adding AI-assisted suggestions, they must be optional and sit alongside the tap-to-select flow, never replace it.
- **Never write copy implying this is an official government channel.** "Muhtar" is a metaphor, not a claim of authority. Every screen touching the routing result should read as helpful, not official.
- **Don't build user accounts.** If a feature seems to need identity beyond the anonymous session id, that's a signal to simplify the feature, not add auth.
- **channels is seed data**, not user-editable through the app UI. Reports and confirmations are the only user-writable tables.

## Architecture at a glance

```
app/
  (screens)/
    home.tsx
    report-category.tsx
    report-details.tsx
    routing-result.tsx
    add-to-map.tsx
    map-list.tsx
    report-detail.tsx
    how-it-works.tsx
components/            -- sibling of app/, NOT inside it — expo-router
lib/                   -- treats files under app/ as routes
  supabase.ts
  session.ts           -- anonymous session id, local persistence
supabase/
  schema.sql           -- mirrors PRD.md §10, keep in sync
  seed/
    channels.sql        -- Adana + national routing data, see PRD.md §11
```

## Commands

```
npx expo start --web       # local dev
npx expo export --platform web   # production web build
```

Deploy the exported `dist/` output to any static host (Vercel, Netlify, Cloudflare Pages) — get this live on day 1 with an empty shell, don't leave first deploy for late in the build.

## Data model

Three tables — `channels`, `reports`, `confirmations`. Full DDL and field-level rationale in `PRD.md` §10. Keep `supabase/schema.sql` as the single source of truth for the actual migration; PRD.md is the readable reference, not the other way around.

## Gotchas

- **Maps on web:** `react-native-maps` wraps native iOS/Android SDKs and renders nothing on Expo's web target. Use `react-leaflet` with OpenStreetMap tiles — free, no API key, works immediately on web.
- **Adana's "153" line:** ALO 153 is Adana Büyükşehir Belediyesi's own municipal call center, not to be confused with unrelated "153"-pattern numbers used by other institutions. Don't let in-app copy conflate them.
- **The ALO 153 WhatsApp number in seed data is unverified** — sourced from an older article. Flag it, don't silently trust it in production copy.
- **Don't add complex geo-clustering.** Group nearby reports by the `neighborhood` text field or a coarse coordinate rounding, not a spatial radius query — full PostGIS clustering is scope this project doesn't need.
- **Photo picker on web must fire from a direct user interaction** (a button's onPress), not from a `useEffect` or after an `await`. Browsers silently block `ImagePicker.launchImageLibraryAsync()` otherwise — no error, it just does nothing.
- **Test camera and location flows on real iOS Safari, not just Android Chrome.** Safari has historically been the pickier of the two for file-input capture and geolocation behavior.

## Definition of done

A screen isn't done until it's been checked on an actual phone browser, cold — not just resized in a desktop browser. The competition rules score loading speed and stability directly.
