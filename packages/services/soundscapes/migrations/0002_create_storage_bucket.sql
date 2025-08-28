-- Create plugin_soundscapes storage bucket and set up RLS policies
-- This migration creates the storage bucket for soundscape audio files and thumbnails

-- Create the storage bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'plugin_soundscapes',
  'plugin_soundscapes',
  true, -- Public bucket for reading
  52428800, -- 50MB file size limit
  array['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/m4a', 'audio/ogg', 'image/jpeg', 'image/png', 'image/webp']
);

-- Enable RLS on storage.objects
alter table storage.objects enable row level security;

-- Policy: Allow authenticated users to read all files in plugin_soundscapes bucket
create policy "Allow authenticated users to read soundscape files" on storage.objects
  for select using (
    bucket_id = 'plugin_soundscapes' 
    and auth.role() = 'authenticated'
  );

-- Policy: Allow admins to upload files to plugin_soundscapes bucket
create policy "Allow admins to upload soundscape files" on storage.objects
  for insert with check (
    bucket_id = 'plugin_soundscapes'
    and auth.role() = 'authenticated'
    -- Admin check will be handled at the application layer
    -- This assumes admin status is verified before reaching storage operations
  );

-- Policy: Allow admins to update files in plugin_soundscapes bucket
create policy "Allow admins to update soundscape files" on storage.objects
  for update using (
    bucket_id = 'plugin_soundscapes'
    and auth.role() = 'authenticated'
    -- Admin check will be handled at the application layer
  );

-- Policy: Allow admins to delete files in plugin_soundscapes bucket
create policy "Allow admins to delete soundscape files" on storage.objects
  for delete using (
    bucket_id = 'plugin_soundscapes'
    and auth.role() = 'authenticated'
    -- Admin check will be handled at the application layer
  );

-- Create a function to check if a user is an admin (to be used in future policies if needed)
create or replace function public.is_admin(user_id uuid default auth.uid())
returns boolean as $$
begin
  -- This function can be enhanced to check against an admins table
  -- For now, it returns true for authenticated users (app-level admin check)
  return auth.role() = 'authenticated';
end;
$$ language plpgsql security definer;

-- Grant execute permission on the function
grant execute on function public.is_admin to authenticated;

-- Create indexes for efficient storage queries
create index if not exists idx_storage_objects_bucket_id on storage.objects(bucket_id);
create index if not exists idx_storage_objects_bucket_path on storage.objects(bucket_id, name);
