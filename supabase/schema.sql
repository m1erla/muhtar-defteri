-- Dijital Muhtar — database schema
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

-- channels: seed data. Readable by everyone, writable by nobody through the API.
-- (No insert/update/delete policy exists, so RLS denies all three.)
drop policy if exists "channels are publicly readable" on channels;
create policy "channels are publicly readable" on channels
  for select to anon, authenticated using (true);

-- reports: public map. Anyone may read and file; nobody may delete.
drop policy if exists "reports are publicly readable" on reports;
create policy "reports are publicly readable" on reports
  for select to anon, authenticated using (true);

drop policy if exists "anyone can file a report" on reports;
create policy "anyone can file a report" on reports
  for insert to anon, authenticated with check (true);

drop policy if exists "anyone can update report status" on reports;
create policy "anyone can update report status" on reports
  for update to anon, authenticated using (true) with check (true);

-- RLS gates rows, not columns — so the "status only" half of the rule above is
-- enforced with a column-level grant. Without this, the update policy would let
-- anyone rewrite another person's description, photo, or coordinates.
revoke update on reports from anon, authenticated;
grant update (status) on reports to anon, authenticated;

-- confirmations: append-only. The unique constraint above caps it at one per
-- session per report; no update or delete policy exists.
drop policy if exists "confirmations are publicly readable" on confirmations;
create policy "confirmations are publicly readable" on confirmations
  for select to anon, authenticated using (true);

drop policy if exists "anyone can confirm a report once" on confirmations;
create policy "anyone can confirm a report once" on confirmations
  for insert to anon, authenticated with check (true);

-- ── Storage: report photos ───────────────────────────────────────────────────
-- Public read (the map renders them straight from the CDN), anonymous insert,
-- and no update/delete policy so uploaded photos cannot be swapped or removed.

insert into storage.buckets (id, name, public)
values ('report-photos', 'report-photos', true)
on conflict (id) do nothing;

drop policy if exists "report photos are publicly readable" on storage.objects;
create policy "report photos are publicly readable" on storage.objects
  for select to anon, authenticated using (bucket_id = 'report-photos');

drop policy if exists "anyone can upload a report photo" on storage.objects;
create policy "anyone can upload a report photo" on storage.objects
  for insert to anon, authenticated with check (bucket_id = 'report-photos');
