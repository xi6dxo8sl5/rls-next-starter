-- The feed orders by (created_at desc, id desc); keep the index aligned so keyset
-- pagination stays an index scan instead of a sort over the whole table.
create index notes_feed_idx on public.notes (created_at desc, id desc);
