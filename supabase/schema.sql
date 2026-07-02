-- Dijital Muhtar — database schema
-- Single source of truth for the migration. Mirrors PRD.md §10 — keep in sync.
-- Three tables, no auth: channels is seed data; reports and confirmations
-- are the only user-writable tables.

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
