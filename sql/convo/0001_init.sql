create extension if not exists "pgcrypto";

-- CARDS
create table public.convo_cards (
  id uuid primary key default gen_random_uuid(),
  prompt_text text not null,
  follow_ups jsonb default '[]'::jsonb,
  age_variants jsonb default '{}'::jsonb,
  type text check (type in ('question','would_you_rather','story_starter','game','gratitude','emotion_coach','repair')) not null,
  tags jsonb default '{}'::jsonb,
  tone text check (tone in ('silly','thoughtful','deep','mindful')),
  sensitivity_flags jsonb default '[]'::jsonb,
  status text check (status in ('draft','published','retired')) default 'draft',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- DECKS
create table public.convo_decks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  hero_image_url text,
  tags jsonb default '{}'::jsonb,
  status text check (status in ('draft','published','retired')) default 'draft',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- DECK <-> CARD mapping
create table public.convo_deck_cards (
  deck_id uuid references public.convo_decks(id) on delete cascade,
  card_id uuid references public.convo_cards(id) on delete cascade,
  position int,
  primary key (deck_id, card_id)
);

-- PER-USER INTERACTIONS
create table public.convo_card_interactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  card_id uuid not null references public.convo_cards(id) on delete cascade,
  favorite boolean default false,
  hidden boolean default false,
  rating int check (rating between 1 and 5),
  used_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- BASIC INDEXES
create index on public.convo_cards ((tags->>'context'));
create index on public.convo_cards (status);
create index on public.convo_deck_cards (deck_id, position);
create index on public.convo_card_interactions (user_id, card_id);

-- RLS
alter table public.convo_cards enable row level security;
alter table public.convo_decks enable row level security;
alter table public.convo_deck_cards enable row level security;
alter table public.convo_card_interactions enable row level security;

create policy "read_published_cards" on public.convo_cards
for select using (status = 'published');

create policy "read_published_decks" on public.convo_decks
for select using (status = 'published');

create policy "read_deck_cards" on public.convo_deck_cards
for select using (exists (select 1 from public.convo_decks d where d.id = deck_id and d.status='published'));

create policy "own_interactions_select" on public.convo_card_interactions
for select using (user_id = auth.uid());

create policy "own_interactions_write" on public.convo_card_interactions
for insert with check (user_id = auth.uid())
,  update using (user_id = auth.uid())
,  delete using (user_id = auth.uid());
