-- Schema for the Gupta Notes mobile app's optional sync.
-- Run this in the Supabase SQL Editor (same project as the web app is fine —
-- it uses its own table and doesn't touch the web app's tables).

create table if not exists public.mobile_notes (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  payload jsonb,
  updated_at bigint not null,
  deleted boolean not null default false
);

create index if not exists mobile_notes_user_idx on public.mobile_notes (user_id);

alter table public.mobile_notes enable row level security;

drop policy if exists "Users read own notes" on public.mobile_notes;
create policy "Users read own notes"
  on public.mobile_notes for select
  using (auth.uid() = user_id);

drop policy if exists "Users insert own notes" on public.mobile_notes;
create policy "Users insert own notes"
  on public.mobile_notes for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users update own notes" on public.mobile_notes;
create policy "Users update own notes"
  on public.mobile_notes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users delete own notes" on public.mobile_notes;
create policy "Users delete own notes"
  on public.mobile_notes for delete
  using (auth.uid() = user_id);
