-- Shareable restock-list snapshots, viewed at tackleboxiq.com/list/<id>.
-- Additive only: a new table plus one read function. Safe to re-run.
--
-- Privacy: the table itself is private (owners only). Anyone with a link can
-- read exactly one unexpired snapshot through get_shared_list(); there is no
-- way to list or browse other snapshots. A snapshot holds item names only.

create table if not exists public.shared_lists (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind        text not null default 'restock',
  title       text not null default 'Restock list',
  items       jsonb not null default '[]'::jsonb,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default (now() + interval '30 days')
);

create index if not exists shared_lists_user_id_idx on public.shared_lists (user_id);

alter table public.shared_lists enable row level security;

drop policy if exists "shared_lists_select_own" on public.shared_lists;
create policy "shared_lists_select_own" on public.shared_lists
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "shared_lists_insert_own" on public.shared_lists;
create policy "shared_lists_insert_own" on public.shared_lists
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "shared_lists_delete_own" on public.shared_lists;
create policy "shared_lists_delete_own" on public.shared_lists
  for delete to authenticated using (auth.uid() = user_id);

-- Public read of a single snapshot by its (unguessable) id.
create or replace function public.get_shared_list(list_id uuid)
returns table (title text, kind text, items jsonb, created_at timestamptz, expires_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select s.title, s.kind, s.items, s.created_at, s.expires_at
  from public.shared_lists s
  where s.id = list_id and s.expires_at > now();
$$;

revoke all on function public.get_shared_list(uuid) from public;
grant execute on function public.get_shared_list(uuid) to anon, authenticated;
