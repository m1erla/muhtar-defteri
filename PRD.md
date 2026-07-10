# Mahalle Defteri — Product Requirements Document

**Status:** Draft for build · **Context:** TRT Geleceğin İletişimcileri Yarışması, Dijital Ürün Geliştirme category · **Deadline:** July 17, 2026

---

## 1. Overview

Mahalle Defteri is a mobile-friendly web app that tells Adana residents exactly which official channel handles a local civic problem, and makes visible — on a public, community-maintained map — how many times the same problem has been reported and whether it's actually been resolved. It is a routing and transparency layer sitting on top of existing official infrastructure, not a replacement for it.

## 2. Problem

Turkey already has extensive complaint infrastructure: Alo 181 (environment), 112 (police/traffic — the single emergency line that absorbed the former Alo 155), EGM Mobil (photo-based parking violation reports), CİMER (universal government router), and Adana Büyükşehir Belediyesi's own ALO 153 line and e-belediye web form. The gap isn't intake, it's two things:

1. **Routing confusion.** Citizens don't reliably know which channel handles which problem — confusing enough that it's taught as a school civics exercise in Turkey generally.
2. **No accountability layer.** Once something is reported, there's no visibility into what happens next. Recurring, unresolved complaints about the same spot (potholes, blocked sidewalks, pest problems) are common on public complaint sites and go nowhere visible.

Mahalle Defteri closes both gaps without duplicating any existing intake system.

## 3. Competition constraints that shape this PRD

These aren't preferences — they're pass/fail requirements from the category rules:

- Must be a genuinely new work, designed and built within the 2025–2026 academic year.
- Must be "fully functional or include a working prototype" — not a static mockup.
- Must be mobile-friendly and stay live and accessible from application through the end of judging.
- Project description (used in the submission, not the app itself) must be Turkish, 140+ characters, contain no name or university (anonymized judging), and state purpose, audience, and sources.
- Content must comply with TRT's broadcasting principles and public order rules — no advocacy on contested political issues, no impersonation of an official government channel.
- Judged on: Idea & Problem-Solving (30%), UX/UI (20%), Innovation & Originality (20%), Technical Feasibility (15%), Presentation & Communication (15%).

## 4. Goals

- Ship a working, deployed, testable product — not a prototype that only works on one machine.
- Make the routing recommendation feel obviously correct and trustworthy on the first try.
- Make the transparency layer legible at a glance: a user should understand "this spot has been a problem for a while" within a second of looking at it.
- Keep the build achievable solo, inside the remaining timeline.

## 5. Non-goals

Explicitly out of scope — resist adding these even if they seem like natural extensions:

- Coverage outside Adana province.
- Any claim to replace, integrate with, or officially represent Alo 181 / 112 / CİMER / ALO 153 / e-belediye. The app routes to them; it is not them.
- User accounts or authentication. Anonymous per-device session identity is sufficient.
- Guaranteeing resolution of any reported issue. The product's promise is visibility and correct routing, not outcomes.
- Real-time chat, push notifications, or any messaging layer.
- AI free-text problem classification as the primary interaction. Category selection is a tap, not a paragraph.

## 6. Users

**Primary:** an Adana resident who has hit a local problem (illegal parking blocking a sidewalk, an overflowing bin, a broken curb near a school) and doesn't know who to tell, or has told someone before and nothing happened.

**Secondary:** a resident browsing the map with general civic curiosity, or checking whether a problem they already reported has picked up more reports since.

No persona requires technical sophistication. Copy and interaction design should assume a first-time, non-technical user throughout.

## 7. User stories

1. As a resident who sees a problem, I want to describe it in a few taps so that I know within seconds which official number or form to use.
2. As that same resident, I want a checklist of what to bring (photo, address, plate number) so I don't waste a call or a trip.
3. As a resident who wants to do more than just get routed, I want to optionally log the problem to a public map so others can see it's been reported.
4. As a resident browsing my neighborhood, I want to see how many times a specific spot has been reported and for how long, so I can judge whether it's actually being handled.
5. As any user, I want a plain "what this is and isn't" explanation so I don't mistake this for an official municipal channel.

## 8. Functional requirements, by screen

| Screen | Requirements |
|---|---|
| **Home** | Primary CTA to start a report. Preview list of the most recent community reports (read-only, no auth needed to view). Adana-only, so no location gate — "nearby" would add landing-screen geolocation friction against the scored first load. |
| **Report — category** | Four tappable categories: cleanliness, parking, infrastructure, school-zone safety. This is the primary classification mechanism — reliable and instant, not dependent on AI inference. |
| **Report — details** | Optional free-text description, optional photo upload, location (auto-detected via browser geolocation, manually adjustable pin). |
| **Routing result** | Shows the matched channel(s) from the `channels` table: name, phone, URL, and a required-info checklist. Includes a one-tap copy of the key details. |
| **Add to map (opt-in)** | A clearly separate, optional step. Confirms the same report also gets written to the public `reports` table. Not bundled silently into the routing flow. |
| **Map / list view** | Public reports shown as a map (desktop/larger screens) or list (fallback and default on narrow viewports), filterable by category and status. Density of reports at the same rough location should be visually obvious. |
| **Report detail** | Description, photo if present, first-reported date, confirmation count, and two actions: "I see this too" / "this got fixed" — both write to `confirmations`. |
| **How it works** | States plainly: this is a community information and routing layer, not an official government channel, and doesn't guarantee any outcome. |

## 9. Non-functional requirements

- **Performance:** first load under ~3 seconds on a typical mobile connection. Loading speed is an explicitly scored criterion — don't ship an unoptimized bundle.
- **Mobile-first:** every screen must work correctly on a phone browser before it's considered done. Desktop is secondary.
- **No PII beyond what's user-submitted.** No accounts, no tracked identity beyond an anonymous local session id used only to rate-limit duplicate confirmations.
- **Content accuracy over completeness.** A smaller, verified channel list beats a larger, unverified one. Wrong routing information is worse than no tool.
- **Graceful empty states.** A neighborhood with zero reports should look intentional, not broken.

## 10. Data model

Three tables, no auth required. Core DDL below; `supabase/schema.sql` is the authoritative migration and additionally carries the RLS policies, integrity constraints, and storage rules summarised after it.

```sql
create table channels (
  id uuid primary key default gen_random_uuid(),
  category text not null,        -- 'cleanliness' | 'parking' | 'infrastructure' | 'school_safety'
  name text not null,
  scope text not null,           -- 'national' | 'adana'
  description text,
  contact_phone text,
  contact_url text,
  required_info text[],
  notes text
);

create table reports (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  description text,
  photo_url text,
  latitude float8 not null,
  longitude float8 not null,
  neighborhood text,
  status text default 'open',    -- 'open' | 'resolved'
  session_id text not null,
  created_at timestamptz default now()
);

create table confirmations (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references reports(id),
  type text not null,            -- 'still_open' | 'resolved'
  session_id text not null,
  created_at timestamptz default now()
);
```

`channels` is seed data, populated once from the researched Adana + national routing list, not user-generated. `reports` and `confirmations` are the live community layer.

**Row level security.** The Supabase anon key ships inside the public web bundle by design, so RLS — not key secrecy — is what protects the data. `supabase/schema.sql` enables RLS on all three tables and grants the anonymous role exactly:

- `channels` — select only. All write privileges are revoked from the anon role (belt-and-suspenders with the absence of any write policy), so the seed list cannot be edited through the API.
- `reports` — select; insert scoped by column-level `GRANT` to exactly the seven fields the client sends (`category`, `description`, `photo_url`, `latitude`, `longitude`, `neighborhood`, `session_id`). `id`/`status`/`created_at` are server-defaulted and cannot be supplied, so reports can't be created pre-"resolved" or backdated. Update is likewise narrowed to the `status` column, so the "Bu Düzeldi" flow can't rewrite someone else's description, photo, or coordinates. No delete.
- `confirmations` — select and insert (scoped to `report_id`, `type`, `session_id`), with `unique (report_id, session_id)` enforcing one confirmation per anonymous session per report. No update or delete.
- `report-photos` storage bucket — public read via object URL (no listing), anonymous insert only, capped at 5 MB and image MIME types. `reports.photo_url` carries a check constraint pinning it to this bucket's public path, so the map can't be pointed at an arbitrary external image.

Text columns the public insert path writes (`category`, `type`) carry check constraints, `status` is constrained to `open`/`resolved`, and `description` is capped at the 500 characters the UI enforces.

Two things remain intentionally open, as accepted consequences of the anonymous, no-accounts design in §5 (not failures RLS can fix): anyone can mark any report resolved, and anyone can file or confirm reports without attribution. These surface as `RLS Policy Always True` advisor warnings on the two "anyone can …" policies and are expected.

## 11. Content dependencies

The `channels` table needs to be populated before the report flow means anything. Source list:

- **National:** Alo 181 (environment); 112 (the single emergency line that absorbed the former Alo 155) plus 112 Online İhbar (`ihbar.ng112.gov.tr`, photo-based); EGM Mobil (parking, photo-based, lands on the same 112 form); CİMER (catch-all). *(Verified 2026-07-03: Alo 155 no longer exists standalone in Adana; see CLAUDE.md gotchas.)*
- **Adana:** ALO 153 Çağrı Merkezi (24/7, WhatsApp photo submission) and the e-belediye web form (`ebelediye.adana.bel.tr/SikayetOneri`) — both route internally to the correct district (Seyhan, Yüreğir, Çukurova, Sarıçam), so no separate district-level entries are needed.
- Adana Büyükşehir Belediyesi's stated response window (15 business days, 30 if cross-department) should be stored alongside the channel record and surfaced in the report-detail screen as the benchmark for "past due."

Two items need a final currency check before this table goes live: the ALO 153 WhatsApp number, and confirming Adana's "153" line isn't being conflated with unrelated "153"-style numbers used elsewhere in Turkey.

## 12. Success criteria, mapped to how this gets scored

- **Idea & Problem-Solving (30%):** the problem statement in section 2 should be recognizable and specific, not generic — reviewers should be able to picture the exact experience of not knowing who to call.
- **UX/UI (20%):** the report flow should take under 60 seconds end to end on a phone; the map/list should communicate "this is a repeat problem" without requiring the user to read anything.
- **Innovation & Originality (20%):** the pitch is the routing + transparency layer, explicitly distinct from being another intake channel — this framing needs to be obvious in the app's own copy, not just in this document.
- **Technical Feasibility (15%):** demoed live, on a phone, cold — not narrated from a laptop.
- **Presentation & Communication (15%):** the project description should state the purpose, audience, and the specific Adana channels it routes to, with the "how this grows" extensibility line included.

## 13. Risks & open questions

- ALO 153 WhatsApp number currency — unverified, sourced from an older article.
- Possible naming overlap between Adana's municipal "153" and other "153"-pattern numbers elsewhere — needs a clean disambiguation in-app.
- Map rendering on Expo's web target requires `react-leaflet`, not `react-native-maps` (see FRONTEND.md and CLAUDE.md) — this is a known trap, not an open question, but worth restating here since it affects screen 6's feasibility.

## 14. Timeline

Competition deadline: July 17, 2026. Day-to-day execution is tracked in the working task list rather than a separate spec file; this document defines *what* to build, not the order.
