-- Only the existing shared room tables are published. RLS and RPC permissions remain in force.
begin;
do $$
begin
 if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='theater_seats') then
  alter publication supabase_realtime add table public.theater_seats;
 end if;
 if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='theater_queue') then
  alter publication supabase_realtime add table public.theater_queue;
 end if;
end $$;
commit;
