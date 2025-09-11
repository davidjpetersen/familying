-- Soundscapes tables
create table if not exists public.soundscape_favorite (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  family_id uuid not null,
  child_id uuid null,
  mix_id text not null,
  created_at timestamptz default now(),
  unique (user_id, child_id, mix_id)
);

create table if not exists public.soundscape_session (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  family_id uuid not null,
  child_id uuid null,
  mix_id text not null,
  started_at timestamptz not null default now(),
  ended_at timestamptz null,
  duration_seconds int generated always as (extract(epoch from coalesce(ended_at, now()) - started_at)) stored
);

-- Row Level Security
alter table public.soundscape_favorite enable row level security;
alter table public.soundscape_session enable row level security;

-- Example helper: a function to check membership; replace with your org membership logic
-- Assuming a table or claim-based check exists; here we allow self user_id for simplicity
create policy if not exists "favorites_self_rw" on public.soundscape_favorite
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy if not exists "sessions_self_rw" on public.soundscape_session
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Optional: allow parents to read child rows within same family
-- Replace with your organization membership validation
-- create policy "favorites_family_read" on public.soundscape_favorite for select using (
--   exists(select 1 from public.family_members fm where fm.user_id = auth.uid() and fm.family_id = soundscape_favorite.family_id)
-- );

