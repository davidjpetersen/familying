-- 0001_init.sql
-- Initial schema and RLS policies

create extension if not exists "pgcrypto";

create table public.users (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text unique,
  email text,
  created_at timestamptz default now()
);

create table public.families (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references public.users(id),
  name text,
  created_at timestamptz default now()
);

create table public.family_members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references public.families(id),
  type text check (type in ('adult','child')),
  display_name text,
  birthdate date null,
  tags jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id),
  status text,
  plan text,
  current_period_end timestamptz,
  created_at timestamptz default now()
);

create table public.features (
  key text primary key,
  label text not null,
  tier text check (tier in ('free','pro')),
  enabled boolean default true,
  rollout jsonb default '{}'::jsonb
);

create table public.microservice_access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id),
  feature_key text references public.features(key),
  has_access boolean default false,
  created_at timestamptz default now()
);

create table public.quiz_responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id),
  payload jsonb not null,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.users enable row level security;
alter table public.families enable row level security;
alter table public.family_members enable row level security;
alter table public.subscriptions enable row level security;
alter table public.microservice_access enable row level security;
alter table public.quiz_responses enable row level security;

-- Users policies
create policy "Users select own" on public.users
  for select using (clerk_user_id = auth.jwt()->>'sub');
create policy "Users update own" on public.users
  for update using (clerk_user_id = auth.jwt()->>'sub');

-- Families policies (owner-only for now)
create policy "Family owners manage families" on public.families
  for all using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());

-- Family members policies (owner-only for now)
create policy "Family owners manage members" on public.family_members
  for all using (
    exists (
      select 1 from public.families f
      where f.id = family_members.family_id
        and f.owner_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.families f
      where f.id = family_members.family_id
        and f.owner_user_id = auth.uid()
    )
  );

-- Subscriptions policies
create policy "Users manage own subscriptions" on public.subscriptions
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Microservice access policies
create policy "Users manage own microservice access" on public.microservice_access
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Quiz responses policies (owner-only for now)
create policy "Users manage own quiz responses" on public.quiz_responses
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Seed features
insert into public.features (key, label, tier, enabled) values
  ('book_summaries', 'Book Summaries', 'free', true),
  ('activities', 'Activities', 'free', true),
  ('conversation_starters', 'Conversation Starters', 'free', true),
  ('sleep_sounds', 'Sleep Sounds', 'pro', true),
  ('bedtime_stories', 'Bedtime Story Generator', 'pro', true),
  ('meal_planner', 'Meal Planner', 'pro', true)
on conflict (key) do nothing;

