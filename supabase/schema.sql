-- Mahalle Defteri — database schema
-- Single source of truth for the migration. PRD.md §10 mirrors this — keep in sync.
--
-- Three tables, no auth. The Supabase anon key ships publicly inside the web
-- bundle by design, so RLS is the only thing standing between a visitor and the
-- data. The policies below enforce CLAUDE.md's invariant at the database level:
-- `channels` is read-only seed data; `reports` and `confirmations` are the only
-- user-writable tables, and nothing is user-deletable.
--
-- Idempotent: safe to re-run. Run as the project owner (SQL editor / service
-- role) — the owner bypasses RLS, which is what lets the seed script write to
-- `channels`.

-- ── Tables ───────────────────────────────────────────────────────────────────

create table if not exists channels (
  id uuid primary key default gen_random_uuid(),
  category text not null,        -- see reports_category_check below for the slug list
  name text not null,
  scope text not null,           -- 'national' | 'adana'
  description text,
  contact_phone text,
  contact_url text,
  contact_whatsapp text,         -- tappable wa.me line (ALO 153); null for most
  required_info text[],
  notes text
);
-- Added after the initial table shipped; keep for existing databases.
alter table channels add column if not exists contact_whatsapp text;

create table if not exists reports (
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

create table if not exists confirmations (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references reports(id),
  type text not null,            -- 'still_open' | 'resolved'
  session_id text not null,
  created_at timestamptz default now()
);

-- ── Integrity constraints ────────────────────────────────────────────────────
-- The insert paths below are open to anyone holding the public anon key, so the
-- enum-ish text columns need real constraints or the table fills with junk.
-- (drop-then-add keeps this file re-runnable.)

alter table reports drop constraint if exists reports_category_check;
alter table reports add constraint reports_category_check
  check (category in (
    'cleanliness', 'parking', 'infrastructure', 'school_safety',
    -- extended 2026-07-11 (lib/categories.ts is the UI-side mirror):
    'street_lighting', 'water_sewage', 'stray_animals', 'noise'
  ));

alter table reports drop constraint if exists reports_status_check;
alter table reports add constraint reports_status_check
  check (status in ('open', 'resolved'));

-- Matches the 500-char cap the details screen enforces client-side.
alter table reports drop constraint if exists reports_description_len;
alter table reports add constraint reports_description_len
  check (description is null or char_length(description) <= 500);

alter table confirmations drop constraint if exists confirmations_type_check;
alter table confirmations add constraint confirmations_type_check
  check (type in ('still_open', 'resolved'));

-- One confirmation per anonymous session per report. Until now this was only
-- enforced client-side, so two tabs could inflate a report's count.
-- lib/reports.ts treats the resulting unique violation (23505) as success.
alter table confirmations drop constraint if exists confirmations_one_per_session;
alter table confirmations add constraint confirmations_one_per_session
  unique (report_id, session_id);

-- ── Deterministic moderation layer (2026-07-12) ─────────────────────────────
-- No AI, no server: the database is the only trusted tier in this no-auth
-- architecture, so rate limits and validity checks live here. Owner/SQL-editor
-- writes (postgres role) skip the triggers, which is what keeps seeding and
-- OPERATIONS.md moderation working. Guard failures raise 'MDR_*' messages that
-- lib/supabase.ts friendlyDbError() maps to neutral Turkish copy.
--
-- HONEST LIMIT: everything below keys on the client-generated session_id.
-- That stops accidental misuse and lazy spam (the realistic threats at this
-- scale), NOT a determined attacker who rotates session ids per raw REST
-- request — with no accounts there is no stronger identity to bind to. The
-- backstop for that case is the owner's cleanup runbook (OPERATIONS.md), and
-- user-facing copy must describe these limits as per-device/best-effort, never
-- as per-person guarantees.

create index if not exists reports_session_created_idx on reports (session_id, created_at);
create index if not exists confirmations_session_created_idx on confirmations (session_id, created_at);

-- Reports must be inside Adana province. Snug box (all 15 district centres fit
-- with margin) so it excludes the open sea to the south and most of neighbouring
-- Mersin/Tarsus — the hard "Adana only" invariant. KEEP IN SYNC with the same
-- box in lib/geocode.ts (BBOX), which bounds the address search to these limits.
alter table reports drop constraint if exists reports_within_adana;
alter table reports add constraint reports_within_adana
  check (latitude between 36.35 and 38.5 and longitude between 34.7 and 36.5);

-- Civic reports don't need URLs; spam does.
alter table reports drop constraint if exists reports_description_no_links;
alter table reports add constraint reports_description_no_links
  check (description is null or description !~* '(https?://|www\.)');

-- `neighborhood` is in the anon INSERT grant below, so it is user-writable even
-- though the app only ever fills it from a reverse-geocode. It was the one
-- writable text column with NO bound at all: a crafted POST could park an
-- arbitrarily long spam string in it, and it renders verbatim on the map, the
-- ledger rows and the report detail. Same two guards `description` already has —
-- a real Adana mahalle name is comfortably inside 80 chars.
alter table reports drop constraint if exists reports_neighborhood_sane;
alter table reports add constraint reports_neighborhood_sane
  check (
    neighborhood is null
    or (char_length(neighborhood) <= 80 and neighborhood !~* '(https?://|www\.)')
  );

-- Per-session flood + double-submit guard on report inserts.
create or replace function moderate_report_insert() returns trigger
language plpgsql as $$
begin
  if current_user not in ('anon', 'authenticated') then
    return new; -- owner/seed/moderation writes are exempt
  end if;
  if (select count(*) from reports
      where session_id = new.session_id
        and created_at > now() - interval '10 minutes') >= 5 then
    raise exception 'MDR_RATE_LIMIT: too many reports from this session in 10 minutes';
  end if;
  if (select count(*) from reports
      where session_id = new.session_id
        and created_at > now() - interval '24 hours') >= 15 then
    raise exception 'MDR_RATE_LIMIT: daily report limit reached for this session';
  end if;
  -- Double-submit guard only: 10 minutes, not longer. Coordinates arrive
  -- rounded to a ~110m cell and description is optional, so a wider window
  -- would reject a resident reporting two DISTINCT same-category issues on
  -- the same street the same day.
  if exists (select 1 from reports
      where session_id = new.session_id
        and category = new.category
        and latitude = new.latitude and longitude = new.longitude
        and coalesce(description, '') = coalesce(new.description, '')
        and created_at > now() - interval '10 minutes') then
    raise exception 'MDR_DUPLICATE: identical report from this session within 10 minutes';
  end if;
  return new;
end $$;

drop trigger if exists reports_moderation on reports;
create trigger reports_moderation
  before insert on reports
  for each row execute function moderate_report_insert();

-- Per-session flood guard on confirmations (protects the ×N credibility count).
create or replace function moderate_confirmation_insert() returns trigger
language plpgsql as $$
begin
  if current_user not in ('anon', 'authenticated') then
    return new;
  end if;
  -- Own code (not MDR_RATE_LIMIT): the client shows confirmation-specific
  -- copy — the user was confirming, not submitting reports.
  if (select count(*) from confirmations
      where session_id = new.session_id
        and created_at > now() - interval '1 hour') >= 20 then
    raise exception 'MDR_RATE_LIMIT_CONFIRM: too many confirmations from this session in 1 hour';
  end if;
  if (select count(*) from confirmations
      where session_id = new.session_id
        and created_at > now() - interval '24 hours') >= 60 then
    raise exception 'MDR_RATE_LIMIT_CONFIRM: daily confirmation limit reached for this session';
  end if;
  return new;
end $$;

drop trigger if exists confirmations_moderation on confirmations;
create trigger confirmations_moderation
  before insert on confirmations
  for each row execute function moderate_confirmation_insert();

-- Status transitions: the only community transition is open -> resolved, and it
-- must be backed by at least one 'resolved' confirmation row (the app inserts
-- the confirmation first — lib/reports.ts confirmReport). Blocks reopening via
-- the API and raises the cost of raw-REST "resolving" (a confirmation row must
-- exist first — which the attacker CAN insert themselves, so this is friction,
-- not a guarantee; see the HONEST LIMIT note above). Owner restores via SQL
-- (role-exempt): update reports set status = 'open' where id = '<id>';
create or replace function moderate_report_status_update() returns trigger
language plpgsql as $$
begin
  if current_user not in ('anon', 'authenticated') then
    return new;
  end if;
  if new.status = 'resolved' and old.status = 'open' then
    if not exists (select 1 from confirmations
        where report_id = new.id and type = 'resolved') then
      raise exception 'MDR_STATUS: resolving requires a resolved confirmation';
    end if;
  elsif new.status is distinct from old.status then
    raise exception 'MDR_STATUS: unsupported status transition';
  end if;
  return new;
end $$;

drop trigger if exists reports_status_guard on reports;
create trigger reports_status_guard
  before update on reports
  for each row execute function moderate_report_status_update();

-- ── Row level security ───────────────────────────────────────────────────────

alter table channels enable row level security;
alter table reports enable row level security;
alter table confirmations enable row level security;

-- Supabase grants anon/authenticated broad table privileges by default and
-- relies on RLS as the gate. That's one layer; we also revoke the privileges
-- the app never needs, so a future RLS mistake can't expose writes, and we
-- scope INSERT to exactly the columns the client sets (RLS gates rows, not
-- columns) so server-defaulted fields like status/created_at can't be forged.

-- channels: seed data. Readable by everyone, writable by nobody through the API.
drop policy if exists "channels are publicly readable" on channels;
create policy "channels are publicly readable" on channels
  for select to anon, authenticated using (true);
revoke insert, update, delete, truncate, references, trigger on channels from anon, authenticated;

-- reports: public map. Anyone may read, file, and flip status; nobody deletes.
drop policy if exists "reports are publicly readable" on reports;
create policy "reports are publicly readable" on reports
  for select to anon, authenticated using (true);

-- New reports must start open (with the status column revoke below, status is
-- server-defaulted to 'open' and this check simply enforces the invariant).
drop policy if exists "anyone can file a report" on reports;
create policy "anyone can file a report" on reports
  for insert to anon, authenticated with check (status = 'open');

drop policy if exists "anyone can update report status" on reports;
create policy "anyone can update report status" on reports
  for update to anon, authenticated using (true) with check (true);

-- INSERT: only the 7 columns lib/reports.ts sends. id/status/created_at are
-- omitted, so they default server-side and cannot be forged (no pre-resolved
-- reports, no backdated timestamps).
-- UPDATE: only status — without this the update policy above would let anyone
-- rewrite another person's description, photo, or coordinates.
revoke insert, update, delete, truncate, references, trigger on reports from anon, authenticated;
grant insert (category, description, photo_url, latitude, longitude, neighborhood, session_id)
  on reports to anon, authenticated;
grant update (status) on reports to anon, authenticated;

-- photo_url is client-supplied (the app passes the uploaded URL), so constrain
-- it to our own storage bucket — the map can't be made to render an arbitrary
-- external image or tracking pixel injected via the REST API.
alter table reports drop constraint if exists reports_photo_url_own_storage;
alter table reports add constraint reports_photo_url_own_storage
  check (photo_url is null or photo_url like
    'https://xtwszbwjikpkrqazxufe.supabase.co/storage/v1/object/public/report-photos/%');

-- confirmations: append-only. The unique constraint caps it at one per session
-- per report; INSERT is scoped to the 3 app columns; no update/delete policy.
drop policy if exists "confirmations are publicly readable" on confirmations;
create policy "confirmations are publicly readable" on confirmations
  for select to anon, authenticated using (true);

drop policy if exists "anyone can confirm a report once" on confirmations;
create policy "anyone can confirm a report once" on confirmations
  for insert to anon, authenticated with check (true);

revoke insert, update, delete, truncate, references, trigger on confirmations from anon, authenticated;
grant insert (report_id, type, session_id) on confirmations to anon, authenticated;

-- ── Flags: user-reported problems with a report (2026-07-12) ─────────────────
-- Anyone can flag a bad report (spam/offensive/wrong/personal-info/...) with a
-- reason + optional note. Append-only like confirmations, but PRIVATE: flags
-- are moderation signals, so there is NO public SELECT — only the owner reads
-- and acts on them (OPERATIONS.md is the review queue). No AI, and flags NEVER
-- auto-delete anything (many flags != proof of a violation); the owner decides.

create table if not exists flags (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references reports(id),
  reason text not null,            -- see flags_reason_check
  detail text,
  status text not null default 'open',  -- 'open' | 'reviewed' | 'dismissed' (owner-managed)
  session_id text not null,
  created_at timestamptz default now()
);

alter table flags drop constraint if exists flags_reason_check;
alter table flags add constraint flags_reason_check
  check (reason in (
    'spam', 'duplicate', 'wrong_info', 'wrong_location', 'wrong_category',
    'offensive', 'personal_info', 'resolved', 'other'
  ));

alter table flags drop constraint if exists flags_status_check;
alter table flags add constraint flags_status_check
  check (status in ('open', 'reviewed', 'dismissed'));

alter table flags drop constraint if exists flags_detail_len;
alter table flags add constraint flags_detail_len
  check (detail is null or char_length(detail) <= 500);

alter table flags drop constraint if exists flags_detail_no_links;
alter table flags add constraint flags_detail_no_links
  check (detail is null or detail !~* '(https?://|www\.)');

-- One flag per session per report (dedup; the app treats 23505 as "already
-- flagged"). Independent sessions flagging the same report is a real signal.
alter table flags drop constraint if exists flags_one_per_session;
alter table flags add constraint flags_one_per_session unique (report_id, session_id);

create index if not exists flags_session_created_idx on flags (session_id, created_at);
create index if not exists flags_report_idx on flags (report_id, status);

-- Per-session flood guard (deterministic; owner/SQL-editor writes skip it).
create or replace function moderate_flag_insert() returns trigger
language plpgsql as $$
begin
  if current_user not in ('anon', 'authenticated') then
    return new;
  end if;
  if (select count(*) from flags
      where session_id = new.session_id
        and created_at > now() - interval '1 hour') >= 10 then
    raise exception 'MDR_FLAG_RATE: too many flags from this session in 1 hour';
  end if;
  if (select count(*) from flags
      where session_id = new.session_id
        and created_at > now() - interval '24 hours') >= 30 then
    raise exception 'MDR_FLAG_RATE: daily flag limit reached for this session';
  end if;
  return new;
end $$;

drop trigger if exists flags_moderation on flags;
create trigger flags_moderation
  before insert on flags
  for each row execute function moderate_flag_insert();

-- RLS: flags are private. Anon may INSERT only (scoped columns; status/id/
-- created_at default server-side and can't be forged). No SELECT/UPDATE/DELETE
-- for anon — only the owner (service role) reads and manages flags.
alter table flags enable row level security;

drop policy if exists "anyone can flag a report once" on flags;
create policy "anyone can flag a report once" on flags
  for insert to anon, authenticated with check (status = 'open');

-- Belt-and-suspenders: revoke SELECT too, so flags stay private even if a future
-- edit disabled RLS or added a permissive policy. flags carry free-text detail
-- that may quote the personal info being reported — the owner reads them via
-- OPERATIONS.md (service role, which bypasses these grants), never the anon key.
revoke select, insert, update, delete, truncate, references, trigger on flags from anon, authenticated;
grant insert (report_id, reason, detail, session_id) on flags to anon, authenticated;

-- ── Storage: report photos ───────────────────────────────────────────────────
-- Public bucket (objects served by URL straight from the CDN), anonymous insert
-- only. Capped at 5 MB and image types — anon can hit the storage API directly,
-- so without server-side limits it could host arbitrary large/non-image files.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('report-photos', 'report-photos', true, 5242880,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = true,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- No SELECT policy on storage.objects: a public bucket serves object URLs
-- without one, and adding it would let anyone LIST every uploaded photo.
drop policy if exists "report photos are publicly readable" on storage.objects;

drop policy if exists "anyone can upload a report photo" on storage.objects;
create policy "anyone can upload a report photo" on storage.objects
  for insert to anon, authenticated with check (bucket_id = 'report-photos');
