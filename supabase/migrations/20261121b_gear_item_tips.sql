-- "Tips for using this item": AI tactics the user keeps on a gear item,
-- shown in the details sheet. Additive only: one new nullable column; existing
-- rows are untouched. Covered by the existing gear_items RLS policies (owners
-- only). Safe to re-run.
--
-- Shape: [{"id": "...", "title": "Retrieve", "tip": "One or two sentences."}]

alter table public.gear_items
  add column if not exists tips jsonb;
