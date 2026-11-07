-- Milestone C: per-user gear partitioning
-- Run in Supabase Dashboard -> SQL Editor, in TWO steps.
--
-- STEP 1 can run any time. It adds the column and auto-stamps new rows.
-- STEP 2 must run only AFTER the owner has signed up in the app,
-- otherwise the existing inventory has no owner to be assigned to.

-- =====================================================================
-- STEP 1: add user_id (nullable for now) with auth.uid() default
-- =====================================================================
alter table public.gear_items
  add column if not exists user_id uuid references auth.users (id) on delete cascade;

alter table public.gear_items
  alter column user_id set default auth.uid();

create index if not exists gear_items_user_id_idx on public.gear_items (user_id);


-- =====================================================================
-- STEP 2: backfill owner, lock down with RLS
-- Replace the email below with the owner's sign-up email first.
-- =====================================================================
update public.gear_items
set user_id = (select id from auth.users where email = 'OWNER_EMAIL_HERE')
where user_id is null;

-- Fails loudly if any row is still unowned (e.g. email typo above).
alter table public.gear_items
  alter column user_id set not null;

alter table public.gear_items enable row level security;

-- Drop any pre-existing permissive policies (names vary; list them with:
--   select policyname from pg_policies where tablename = 'gear_items';
-- and drop each one before continuing).

create policy "gear_items_select_own" on public.gear_items
  for select to authenticated using (auth.uid() = user_id);

create policy "gear_items_insert_own" on public.gear_items
  for insert to authenticated with check (auth.uid() = user_id);

create policy "gear_items_update_own" on public.gear_items
  for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "gear_items_delete_own" on public.gear_items
  for delete to authenticated using (auth.uid() = user_id);


-- ---------------------------------------------------------------------
-- Storage: tackle-vault-images stays a PUBLIC bucket (read by URL),
-- but writes are limited to the user's own "<uid>/..." folder.
-- Drop any old anon insert/update/delete policies on storage.objects
-- for this bucket first (Dashboard -> Storage -> Policies).
-- ---------------------------------------------------------------------
create policy "tv_images_insert_own_folder" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'tackle-vault-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "tv_images_update_own_folder" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'tackle-vault-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "tv_images_delete_own_folder" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'tackle-vault-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
