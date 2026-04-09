-- GuptaNotes Database Schema
-- Run this in your Supabase SQL Editor

-- Create pages table
create table if not exists pages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  parent_id uuid references pages(id) on delete cascade,
  title text default 'Untitled',
  content jsonb,
  position int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable Row Level Security
alter table pages enable row level security;

-- Users can only see their own pages
create policy "Users can view own pages"
  on pages for select
  using (auth.uid() = user_id);

-- Users can insert their own pages
create policy "Users can insert own pages"
  on pages for insert
  with check (auth.uid() = user_id);

-- Users can update their own pages
create policy "Users can update own pages"
  on pages for update
  using (auth.uid() = user_id);

-- Users can delete their own pages
create policy "Users can delete own pages"
  on pages for delete
  using (auth.uid() = user_id);

-- Index for faster lookups
create index if not exists idx_pages_user_id on pages(user_id);
create index if not exists idx_pages_parent_id on pages(parent_id);

-- Auto-update updated_at timestamp
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger pages_updated_at
  before update on pages
  for each row
  execute function update_updated_at();
