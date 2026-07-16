# Operations — owner's runbook

Mahalle Defteri deliberately has **no admin panel and no accounts** (CLAUDE.md).
The admin surface is the **Supabase dashboard** (data + moderation) and the
**Cloudflare dashboard** (hosting). This file is the manual for both — every
task an "admin panel" would do, done the honest way for a no-auth product.

All SQL below runs in the Supabase **SQL Editor** as the project owner
(service role bypasses RLS, which is what makes moderation possible — the
public anon key can't touch `status`, `created_at`, or other rows' data).

## The moderation model (what's automatic vs. what's yours)

There is no server and no AI layer — **the database enforces the deterministic
rules** (schema.sql "Deterministic moderation layer", live since 2026-07-12),
and everything judgment-based is yours via the SQL below. What the DB blocks
automatically, per anonymous session:

- **Report floods**: max 5 reports / 10 min, 15 / day (`MDR_RATE_LIMIT`).
- **Double submits**: identical category+spot+description within 10 minutes
  (`MDR_DUPLICATE` — the app tells the user to confirm instead). Deliberately
  narrow: coords are ~110m-rounded and descriptions optional, so a wider
  window would reject real, distinct reports.
- **Confirmation floods**: max 20 / hour, 60 / day (`MDR_RATE_LIMIT_CONFIRM`)
  — protects the ×N count.
- **Fake resolving**: `status` can only flip open→resolved when a `resolved`
  confirmation row exists; no reopening via the API (`MDR_STATUS`).
- **Out-of-Adana pins** (lat 35.5–38.7, lng 34.0–37.0) are rejected, and
  descriptions containing **explicit URL prefixes** (`http(s)://`, `www.`) are
  rejected — bare domains/shorteners ("bit.ly/x") pass and are yours to clean.
- **Uploads**: storage bucket caps at 5 MB, jpeg/png/webp only; the map only
  renders `photo_url`s pointing at our own bucket.

**Honest limit:** every per-session rule keys on the *client-generated*
session id. That stops accidental misuse and lazy spam — the realistic threats
at this scale — but a determined attacker rotating session ids per raw REST
request bypasses the limits, can inflate ×N counts, and can even mass-resolve
open reports (insert a `resolved` confirmation per report, then flip status;
reopening via the API is blocked, so victims can't undo it). With no accounts
there is nothing stronger to bind to; the backstop is you:

```sql
-- Undo a suspicious mass-resolve: reopen everything "resolved" after time T
-- (owner bypasses the status trigger). Review before running broadly.
update reports set status = 'open'
where status = 'resolved' and id in (
  select r.id from reports r
  join confirmations c on c.report_id = r.id and c.type = 'resolved'
  group by r.id
  having min(c.created_at) > '2026-07-12T00:00:00Z'  -- attack window
);
```

The app shows neutral Turkish messages for all of these (never "spam"/"fake" —
see `friendlyDbError` in lib/supabase.ts). **Owner writes from the SQL editor
skip the triggers**, so seeding and the commands below always work. Independent
reports of the same issue from *different* sessions are deliberately NOT
blocked — that's the ⟳ repeat signal, the product's whole point.

## Flags — how user reports work, and how you review them

### What happens when a user flags a report (behind the scenes)

1. On a report's detail page the user taps **"Bir sorun bildir"**, picks one
   reason (radio), optionally writes a note (≤500 chars, no links), and submits.
2. The app inserts **one row** into the private `flags` table
   (`report_id`, `reason`, `detail`, `session_id`). Before it lands, the DB runs
   deterministic guards (no server, no AI): one flag per session per report
   (re-flagging is silently treated as "already flagged"), a per-session rate
   limit (10/hour, 30/day → `MDR_FLAG_RATE`), note length ≤500, and no URLs in
   the note.
3. The user sees a **neutral** confirmation ("teşekkürler, incelenmek üzere
   iletildi"). No score is shown, and **nothing is promised** about removal.
4. **That is the entire automatic behaviour.** The report stays exactly as it
   was — same text, same photo, still public. Flags are **private signals for
   you only**; the public never sees them, and a report is **never** hidden or
   deleted because it collected N flags. Many flags can mean a real problem OR
   coordinated abuse — the DB refuses to guess, so **you decide** everything
   below.

### The reasons a user can pick

| slug | shown to user | typically means |
|---|---|---|
| `spam` | Spam ya da reklam | advertising / junk |
| `duplicate` | Zaten var / tekrar kayıt | same issue already logged |
| `wrong_info` | Yanlış ya da yanıltıcı bilgi | description is wrong/misleading |
| `wrong_location` | Yanlış konum | pin is in the wrong place |
| `wrong_category` | Yanlış kategori | filed under the wrong type |
| `offensive` | Uygunsuz ya da saldırgan içerik | abusive / inappropriate |
| `personal_info` | Kişisel bilgi görünüyor | a face/plate/phone is visible |
| `resolved` | Sorun zaten çözülmüş | already fixed in real life |
| `other` | Diğer | see the note |

### How you control it — the review queue

Flags are **private** (RLS: anon may `INSERT` only, cannot read). Only **you**,
in the Supabase **SQL editor** (service role), read and manage them. There is no
in-app admin — this SQL *is* the queue.

**Open flags, most-flagged first, with the report they target:**
```sql
select r.id as report_id, r.category, r.neighborhood, left(r.description,60) as description,
       count(*) filter (where f.status = 'open') as open_flags,
       count(distinct f.session_id) as distinct_sources,
       array_agg(distinct f.reason) as reasons
from flags f join reports r on r.id = f.report_id
where f.status = 'open'
group by r.id order by open_flags desc;
```
`distinct_sources` matters: many flags from ONE session is weak (possible abuse);
a few from DIFFERENT sessions is a stronger signal. Read the notes:
```sql
select reason, detail, session_id, created_at
from flags where report_id = '<report-id>' order by created_at desc;
```

**Act on a flag** (all reversible — you decide, the DB never did):
```sql
-- Dismiss (no violation found): keep the report, close the flags.
update flags set status = 'dismissed' where report_id = '<report-id>' and status = 'open';
-- Confirmed problem: mark the flags reviewed, then act on the REPORT with the
-- moderation commands below (strip photo / take down / resolve).
update flags set status = 'reviewed' where report_id = '<report-id>' and status = 'open';
```
(Taking down / redacting the report itself uses the report commands below —
flags are only the signal.)

## Retention & freshness (keeping reports current)

There is no official municipal status feed, so a report's freshness is defined
as **time since the last *community* confirmation**. The app derives all of this
at render — no cron, no background writes:

- Every "Ben de Gördüm" / "Bu Düzeldi" is a verification. The detail screen shows
  **"Son doğrulama: N gün önce"**.
- **Open + no verification for `STALE_DAYS` (45)** → a *"Bu kayıt bir süredir
  doğrulanmadı — hâlâ duruyor mu?"* prompt on the detail screen. **Anyone** who
  passes the spot can re-verify. (There are no accounts, so we can't notify the
  original reporter — community re-verification is the replacement, and it's more
  robust: it doesn't depend on one absent person returning.)
- **Open + never verified + `ARCHIVE_DAYS` (60) old** → the report drops off the
  default map (`isArchivable` in lib/reports.ts), behind an *"N eski kayıt gizli
  · Göster"* toggle. It is **hidden, not deleted**. Thresholds live in
  `lib/format.ts` (`STALE_DAYS` / `ARCHIVE_DAYS`) — change them there.

**No automatic deletion.** Civic records are durable by design (CLAUDE.md never
auto-deletes), and there's no server to run a purge. Deletion is a deliberate
owner act. When you want to purge genuinely dead reports (old, never verified,
and you know they're gone) — set whatever retention window you like:

```sql
-- 1. Review candidates (open, 180+ days, never confirmed):
select id, category, neighborhood, created_at from reports r
where status = 'open' and created_at < now() - interval '180 days'
  and not exists (select 1 from confirmations c where c.report_id = r.id);
-- 2. Delete the ones you've decided are dead (confirmations first — FK).
--    Take a backup first (see Backups).
delete from confirmations where report_id in ('<id>', ...);
delete from reports where id in ('<id>', ...);
```

## Moderation

The community writes only two tables directly editable by them: `reports` and
`confirmations` (and append-only `flags`, above).
Statuses are `'open' | 'resolved'`; confirmation types `'still_open' | 'resolved'`.

**Inspect the newest reports:**
```sql
select id, category, neighborhood, left(description, 80) as description,
       status, created_at
from reports order by created_at desc limit 50;
```

**Take down an abusive/spam report** (delete its confirmations first — FK):
```sql
delete from confirmations where report_id = '<report-id>';
delete from reports where id = '<report-id>';
```

**Remove just an inappropriate photo, keep the report:**
```sql
update reports set photo_url = null where id = '<report-id>';
```
Then delete the underlying file in **Storage → report-photos** (the DB column
only stores the URL; the object stays until removed).

**Manually resolve / reopen a report:**
```sql
update reports set status = 'resolved' where id = '<report-id>';  -- or 'open'
```

**Correct a report** (the fix for `wrong_category` / `wrong_location` /
`wrong_info` flags — the owner edits fields the app won't let the public change):
```sql
update reports set category = 'infrastructure' where id = '<report-id>'; -- must be a valid slug
update reports set neighborhood = 'Çukurova'   where id = '<report-id>'; -- fix the label
update reports set latitude = 37.058, longitude = 35.284 where id = '<report-id>'; -- fix the pin
update reports set description = '<düzeltilmiş metin>' where id = '<report-id>'; -- fix / redact text
```
The `CHECK` constraints still apply even to you: `category` must be one of the
8 valid slugs and the coordinates must sit inside the Adana box (lat 35.5–38.7,
lng 34.0–37.0), or the update is rejected. Everything is reversible — take a
backup first (see Backups) if you're editing many rows.

**Spot a flooding session** (no accounts, but every write carries an anonymous
`session_id`, so a spammer's device groups together):
```sql
select session_id, count(*) as n, max(created_at) as last_seen
from reports group by session_id order by n desc limit 20;
-- then, if clearly abusive:
delete from confirmations where report_id in (select id from reports where session_id = '<session-id>');
delete from reports where session_id = '<session-id>';
```

## Demo data

`supabase/seed/demo-reports.sql` seeds the jury-walkthrough records (Çukurova
repeat-cluster, overdue Sinanpaşa row). All demo rows use recognizable session
ids, so cleanup before a real launch is two statements (also kept commented at
the bottom of that file):
```sql
delete from confirmations where session_id like 'seed-%' or session_id like 'demo-%' or session_id = 'rls-verify-0001';
delete from reports       where session_id in ('seed-demo', 'rls-verify-0001');
```

## Routing channels

`channels` is **seed data, not user-editable** (by design). To fix a phone
number or URL, edit `supabase/seed/channels.sql`, commit it, and re-run the
changed statement in the SQL editor. Keep the file and the table in sync —
the file is the source of truth.

## Hosting (Cloudflare Workers)

- **Deploy = `git push origin main`.** Workers Builds builds and deploys the
  `muhtar-defteri` Worker. Manual fallback: `npm run deploy`.
- **Build command must be `npm run build:web`** (Worker → Settings → Builds).
  The default `npx expo export -p web` skips `--clear` (stale-env risk) and
  the `404.html` copy (unbranded not-found page). See README §Build & deploy.
- **Env vars** (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`)
  live in the Worker's build settings. They are baked into the JS bundle at
  build time — changing them requires a rebuild, and removing them ships a
  keyless build ("database not set up" notice).
- **Cache purge** after a bad deploy: Cloudflare dashboard → the
  muhtar-defteri.com zone → Caching → Purge Everything.

## Key rotation (if the anon key ever leaks meaningfully)

The anon key is public by design (it's in the shipped bundle; RLS is the
security boundary). If Supabase support ever advises rotation: Supabase
dashboard → Settings → API → rotate, then update the Worker's build env vars
and push any commit to rebuild.

## Backups

Supabase free tier keeps daily backups (7 days). Before risky data surgery,
take a manual snapshot of the two mutable tables:
```sql
create table reports_backup_YYYYMMDD as select * from reports;
create table confirmations_backup_YYYYMMDD as select * from confirmations;
```
Drop the snapshot tables when done — they're visible to nothing but the owner.

## Reklamlar (ad system — enable by setting build env vars)

Implemented 2026-07-15. With `EXPO_PUBLIC_ADS` unset (or the AdSense ids
missing), every ad component renders `null`, no ad script exists on any page,
and the site behaves exactly like the pre-ads app. Ads add ~200-300KB of
third-party JS and a KVKK consent banner, so keep them off unless they're
actually earning.

**Honest economics first** (2026-07 research): Turkey is a bottom-tier AdSense
market (~$0.10-0.15 CPC; realistic page RPM $0.30-1.50, and a task-completion
civic tool sits at the LOW end). Expect ~$3-15/month at 5-20k pageviews/month;
AdSense pays out at $100, so the first payout is months-to-years away. A local
sponsorship or a small grant likely beats display ads at this scale.

### Enabling (config-only — no code changes)

The `/gizlilik` privacy/cookie page (KVKK aydınlatma) is live and linked from
how-it-works and the consent banner — AdSense approval requires it.

1. Apply at adsense.google.com with muhtar-defteri.com (site must be live with
   the ads code enabled; approval typically days to 2-4 weeks; low-value-content
   rejection is a real risk for a 12-screen tool — the how-it-works guide and
   about-sivri page are the "content" reviewers will see).
2. In the AdSense dashboard create three display units and note their slot ids:
   a medium rectangle (rect), a horizontal in-feed (infeed), a 300x600 (sky).
3. In Cloudflare Workers → muhtar-defteri → Settings → Build → environment
   variables, add:
   - `EXPO_PUBLIC_ADS=1`
   - `EXPO_PUBLIC_ADSENSE_CLIENT=ca-pub-XXXXXXXXXXXXXXXX`
   - `EXPO_PUBLIC_ADSENSE_SLOT_RECT=…` / `…_SLOT_INFEED=…` / `…_SLOT_SKY=…`
4. Push any commit (or re-run the build). Metro inlines `EXPO_PUBLIC_*` at
   build time — a plain redeploy without a build won't pick them up.

### What turns on

Five placements only (2026-07-15 placement analysis — the harm-free set):
end of report-detail (below all civic actions), map-list in-feed (1 per 10
rows, never before row 10), end of how-it-works, home below the ledger preview,
and the desktop right gutter (replaces the right margin art; left art stays).
Every unit: fixed reserved height (zero CLS), lazy via IntersectionObserver,
labelled "Reklam", never styled like app content.

**Hard do-not list** (trust/safety — do not add slots here later): anywhere in
the report flow (category → details → routing-result → add-to-map), beside any
official channel number (an ad next to ALO 153 reads as a paid listing — or
gets called), mobile sticky anchors (overlap the bottom action rows), and
anything shaped like a ledger row or channel card.

### Consent (KVKK)

KVKK requires prior explicit opt-in for ad cookies. The banner
(components/ads-consent.tsx) appears once per device with equal-prominence
accept/decline; **decline = the ad script never loads for that device** (the
clean reading — no "legitimate interest" games). Consent is stored in
localStorage (`mdr:ads-consent`); users can clear site data to reset it. If ads
are ever enabled for EEA visitors too, Google requires a certified CMP — the
custom banner is only defensible for TR-targeted traffic.

### Copy that flips automatically with the flag

The funding note in how-it-works and the "Reklamlar ve çerezler" section of
/gizlilik are gated on the same flag — an ads-on build discloses them, an
ads-off build never claims cookies it doesn't set. No manual copy edits needed
in either direction.

### Kill switch

Remove `EXPO_PUBLIC_ADS` from the build env and push. Everything (slots,
banner, script, consent) vanishes; stored consents become inert.
