-- Phase 3: gift / hand-over links for single gear cards, claimed at
-- tackleboxiq.com/claim/<id>. Additive only: one new table, one new nullable
-- column on gear_items and two functions. Safe to re-run.
--
-- How it works
-- * The sender creates a row holding a snapshot of the card (card_payload).
--   Only the sender can see or delete their own rows.
-- * Anyone with the link can read ONE unexpired snapshot through
--   get_shared_card(); there is no way to list or browse other links.
-- * A signed-in user claims it through claim_shared_card(), which copies the
--   card into their own gear_items (as them) and marks the link used. Links
--   are single-claim and expire after 30 days.
-- * A hand-over (is_transfer) also marks the sender's original card as
--   "to replace", with a note saying who it went to, when it is claimed.

-- Who a card came from, shown as a "From Ben" tag. Null for normal gear.
alter table public.gear_items
  add column if not exists gifted_from text;

create table if not exists public.shared_cards (
  id            uuid primary key default gen_random_uuid(),
  sender_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  sender_name   text not null default '',
  gear_item_id  uuid references public.gear_items (id) on delete set null,
  card_payload  jsonb not null,
  is_transfer   boolean not null default false,
  is_claimed    boolean not null default false,
  claimed_by    uuid references auth.users (id) on delete set null,
  claimed_at    timestamptz,
  created_at    timestamptz not null default now(),
  expires_at    timestamptz not null default (now() + interval '30 days')
);

create index if not exists shared_cards_sender_id_idx on public.shared_cards (sender_id);

alter table public.shared_cards enable row level security;

drop policy if exists "shared_cards_select_own" on public.shared_cards;
create policy "shared_cards_select_own" on public.shared_cards
  for select to authenticated using (auth.uid() = sender_id);

drop policy if exists "shared_cards_insert_own" on public.shared_cards;
create policy "shared_cards_insert_own" on public.shared_cards
  for insert to authenticated with check (auth.uid() = sender_id);

drop policy if exists "shared_cards_delete_own" on public.shared_cards;
create policy "shared_cards_delete_own" on public.shared_cards
  for delete to authenticated using (auth.uid() = sender_id);

-- Public preview of a single link by its (unguessable) id. Returns expired
-- and claimed links too, so the page can say so instead of "not found".
create or replace function public.get_shared_card(card_id uuid)
returns table (
  sender_name text, card_payload jsonb, is_transfer boolean,
  is_claimed boolean, is_expired boolean, is_mine boolean, created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select s.sender_name, s.card_payload, s.is_transfer,
         s.is_claimed, s.expires_at <= now(), s.sender_id = auth.uid(), s.created_at
  from public.shared_cards s
  where s.id = card_id;
$$;

revoke all on function public.get_shared_card(uuid) from public;
grant execute on function public.get_shared_card(uuid) to anon, authenticated;

-- Claim a link: copy the card into the caller's tackle box. Returns the new
-- gear_items id. Errors (as text) the page turns into friendly messages:
-- not_signed_in, not_found, expired, already_claimed, own_card.
create or replace function public.claim_shared_card(card_id uuid)
returns uuid
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  me        uuid := auth.uid();
  card      public.shared_cards%rowtype;
  p         jsonb;
  new_id    uuid;
  my_name   text;
begin
  if me is null then
    raise exception 'not_signed_in';
  end if;

  select * into card from public.shared_cards where id = card_id for update;
  if not found then raise exception 'not_found'; end if;
  if card.sender_id = me then raise exception 'own_card'; end if;
  if card.is_claimed then raise exception 'already_claimed'; end if;
  if card.expires_at <= now() then raise exception 'expired'; end if;

  -- Defaults, then the sender's snapshot, then fields the recipient always
  -- gets fresh. jsonb_populate_record converts each value to whatever type
  -- the gear_items column actually uses (text[], jsonb, ...).
  p := jsonb_build_object(
         'name', 'Gifted gear', 'brand', '', 'type', 'Accessory', 'depth', '',
         'color', '', 'notes', '', 'image_url', '',
         'species', '[]'::jsonb, 'environment_tags', '[]'::jsonb, 'image_urls', '[]'::jsonb)
       || jsonb_strip_nulls(card.card_payload)
       || jsonb_build_object(
         'user_id', me, 'is_favorite', false, 'is_ghost', false,
         'gifted_from', nullif(card.sender_name, ''));

  insert into public.gear_items (
    user_id, name, brand, type, depth, color, notes,
    species, environment_tags, image_url, image_urls,
    is_favorite, is_ghost, gifted_from
  )
  select r.user_id, r.name, r.brand, r.type, r.depth, r.color, r.notes,
         r.species, r.environment_tags, r.image_url, r.image_urls,
         r.is_favorite, r.is_ghost, r.gifted_from
  from jsonb_populate_record(null::public.gear_items, p) r
  returning id into new_id;

  update public.shared_cards
  set is_claimed = true, claimed_by = me, claimed_at = now()
  where id = card.id;

  -- Hand-over: the sender's card goes on their restock list, with a note.
  if card.is_transfer and card.gear_item_id is not null then
    select nullif(trim(coalesce(u.raw_user_meta_data->>'first_name', u.raw_user_meta_data->>'display_name', '')), '')
      into my_name
      from auth.users u where u.id = me;

    update public.gear_items g
    set is_ghost = true,
        notes = trim(both E'\n' from coalesce(g.notes, '') || E'\n\n' ||
                'Handed over to ' || coalesce(my_name, 'a friend') || ' on ' || to_char(now() at time zone 'Australia/Sydney', 'DD Mon YYYY'))
    where g.id = card.gear_item_id and g.user_id = card.sender_id;
  end if;

  return new_id;
end;
$$;

revoke all on function public.claim_shared_card(uuid) from public;
grant execute on function public.claim_shared_card(uuid) to authenticated;
