-- GuptaNotes Timeline Schema
-- Run this in your Supabase SQL Editor

-- Post type enum
create type post_type as enum ('text', 'image', 'video', 'checkin', 'voice');

-- Posts table
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  type post_type not null default 'text',

  -- Text content (used by all types: body text, caption, note)
  body text,

  -- Media fields (for image, video, voice types)
  media_url text,
  media_type text,
  media_size_bytes bigint,

  -- Optional thumbnail for videos
  thumbnail_url text,

  -- Location fields (for checkin type, but any post can have location)
  location_name text,
  location_lat double precision,
  location_lng double precision,

  -- Flexible metadata (duration, dimensions, etc.)
  metadata jsonb default '{}',

  -- Timestamps
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable Row Level Security
alter table posts enable row level security;

-- RLS policies: users can only CRUD their own posts
create policy "Users can view own posts"
  on posts for select
  using (auth.uid() = user_id);

create policy "Users can insert own posts"
  on posts for insert
  with check (auth.uid() = user_id);

create policy "Users can update own posts"
  on posts for update
  using (auth.uid() = user_id);

create policy "Users can delete own posts"
  on posts for delete
  using (auth.uid() = user_id);

-- Indexes
create index if not exists idx_posts_user_id on posts(user_id);
create index if not exists idx_posts_created_at on posts(created_at desc);
create index if not exists idx_posts_type on posts(type);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger posts_updated_at
  before update on posts
  for each row
  execute function update_updated_at();

-- Storage: Create a public 'media' bucket
-- Run this separately or create via the Supabase dashboard:
--   insert into storage.buckets (id, name, public) values ('media', 'media', true);

-- Storage RLS policies
-- create policy "Users can upload own media"
--   on storage.objects for insert
--   with check (
--     bucket_id = 'media' AND
--     auth.uid()::text = (storage.foldername(name))[1]
--   );

-- create policy "Users can view own media"
--   on storage.objects for select
--   using (
--     bucket_id = 'media' AND
--     auth.uid()::text = (storage.foldername(name))[1]
--   );

-- create policy "Users can delete own media"
--   on storage.objects for delete
--   using (
--     bucket_id = 'media' AND
--     auth.uid()::text = (storage.foldername(name))[1]
--   );
