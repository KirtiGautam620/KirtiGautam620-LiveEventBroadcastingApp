-- Adds a creator-facing category to streams, shown on Browse cards.
-- profiles.display_name already exists (see 20260730000000_create_core_schema.sql)
-- and needs no migration.

alter table public.streams
  add column category text not null default 'General';
