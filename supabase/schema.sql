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
  category text not null,        -- 'cleanliness' | 'parking' | 'infrastructure' | 'school_safety'
  name text not null,
  scope text not null,           -- 'national' | 'adana'
  description text,
  contact_phone text,
  contact_url text,
  required_info text[],
  notes text
);

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
  check (category in ('cleanliness', 'parking', 'infrastructure', 'school_safety'));

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
