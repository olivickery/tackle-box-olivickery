-- Pack list edits: tackle-box items the user removed from a list, and the
-- user's own added items. Additive only (two new columns with defaults);
-- existing rows get empty values. Safe to re-run.

alter table public.pack_lists
  add column if not exists hidden_items text[] not null default '{}';

alter table public.pack_lists
  add column if not exists custom_items jsonb not null default '[]'::jsonb;
