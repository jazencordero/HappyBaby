-- Table grants matching hosted-Supabase defaults so local and prod behave
-- identically. RLS (0002) is the security boundary; these grants only let
-- PostgREST reach the tables at all. anon gets select-only grants: every
-- policy references auth.uid(), which is null for anon, so anon sees 0 rows.
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on all tables in schema public to anon;
grant execute on all functions in schema public to anon, authenticated;
