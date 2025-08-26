-- Soundscapes table for storing ambient sounds and metadata
create table public.soundscapes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text check (category in ('Sleep', 'Nature', 'White Noise', 'Focus')) default 'Sleep',
  audio_url text not null,
  thumbnail_url text not null,
  is_published boolean default true,
  sort_order int default 0,
  duration_seconds int, -- Optional: track audio duration
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create index for efficient querying
create index idx_soundscapes_category on public.soundscapes(category);
create index idx_soundscapes_published on public.soundscapes(is_published);
create index idx_soundscapes_sort_order on public.soundscapes(sort_order);

-- Enable RLS
alter table public.soundscapes enable row level security;

-- Allow read access to all authenticated users
create policy "Soundscapes are viewable by authenticated users" on public.soundscapes
  for select using (auth.role() = 'authenticated');

-- Allow full access to admin users (will be handled at app level)
create policy "Soundscapes are manageable by admins" on public.soundscapes
  for all using (true); -- Admin check will be handled in the application layer

-- Function to update the updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to automatically update updated_at
create trigger handle_soundscapes_updated_at
  before update on public.soundscapes
  for each row execute function public.handle_updated_at();
