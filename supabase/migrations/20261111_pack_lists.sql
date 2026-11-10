-- Saved pack lists (trip plans + packing ticks), one row per list.
-- Additive only: creates a new table; nothing existing is changed.
-- Run once in Supabase Dashboard -> SQL Editor. Safe to re-run.

create table if not exists public.pack_lists (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title       text not null,
  location    text,
  species     text[] not null default '{}',
  conditions  text,
  trip_date   date,
  plan        jsonb not null,
  checked     text[] not null default '{}',
  added_gaps  text[] not null default '{}',
  is_favorite boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists pack_lists_user_id_idx on public.pack_lists (user_id);

-- Keep updated_at current on every edit.
create or replace function public.pack_lists_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists pack_lists_touch_updated_at on public.pack_lists;
create trigger pack_lists_touch_updated_at
  before update on public.pack_lists
  for each row execute function public.pack_lists_touch_updated_at();

-- Each user sees and edits only their own lists.
alter table public.pack_lists enable row level security;

drop policy if exists "pack_lists_select_own" on public.pack_lists;
create policy "pack_lists_select_own" on public.pack_lists
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "pack_lists_insert_own" on public.pack_lists;
create policy "pack_lists_insert_own" on public.pack_lists
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "pack_lists_update_own" on public.pack_lists;
create policy "pack_lists_update_own" on public.pack_lists
  for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "pack_lists_delete_own" on public.pack_lists;
create policy "pack_lists_delete_own" on public.pack_lists
  for delete to authenticated using (auth.uid() = user_id);
