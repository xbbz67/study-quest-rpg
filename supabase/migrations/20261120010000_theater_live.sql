begin;
create table public.theater_queue(id bigint generated always as identity primary key,link text not null check(length(link)<1000),owner uuid not null references auth.users(id) on delete cascade,status text not null check(status in ('playing','waiting','done')),started_at timestamptz,duration_seconds double precision,created_at timestamptz not null default now());
create unique index theater_one_playing on public.theater_queue(status) where status='playing';
alter table public.theater_queue enable row level security;
revoke all on public.theater_queue from anon,authenticated;
grant select on public.theater_queue to authenticated;
create policy "Room playback visible to members" on public.theater_queue for select to authenticated using(true);
create function public.theater_enqueue(media_link text) returns bigint language plpgsql security definer set search_path='' as $$
declare item bigint;
begin
if auth.uid() is null then raise exception 'Login required' using errcode='42501';end if;
if media_link !~ '^https://(www\.)?(youtube\.com/|youtu\.be/|open\.spotify\.com/)' or length(media_link)>1000 then raise exception 'Invalid media' using errcode='22023';end if;
perform pg_catalog.pg_advisory_xact_lock(718224);
if (select count(*) from public.theater_queue where owner=auth.uid() and status='waiting')>=3 then raise exception 'Queue limit: 3' using errcode='PT429';end if;
insert into public.theater_queue(link,owner,status,started_at) values(media_link,auth.uid(),case when exists(select 1 from public.theater_queue where status='playing') then 'waiting' else 'playing' end,case when exists(select 1 from public.theater_queue where status='playing') then null else now() end) returning id into item;
return item;end;$$;
create function public.theater_next(expected_id bigint) returns void language plpgsql security definer set search_path='' as $$
declare current_item public.theater_queue;next_id bigint;
begin
if auth.uid() is null then raise exception 'Login required' using errcode='42501';end if;
perform pg_catalog.pg_advisory_xact_lock(718224);
select * into current_item from public.theater_queue where status='playing' for update;
if current_item.id is distinct from expected_id then return;end if;
if current_item.owner<>auth.uid() and (current_item.duration_seconds is null or now()<current_item.started_at+current_item.duration_seconds*interval '1 second') then raise exception 'Only host can skip' using errcode='42501';end if;
update public.theater_queue set status='done' where id=expected_id;
select id into next_id from public.theater_queue where status='waiting' order by id limit 1;
update public.theater_queue set status='playing',started_at=now() where id=next_id;
end;$$;
create function public.theater_duration(expected_id bigint,seconds double precision) returns void language plpgsql security definer set search_path='' as $$begin
if seconds>=1 and seconds<=86400 then update public.theater_queue set duration_seconds=seconds where id=expected_id and owner=auth.uid() and status='playing' and duration_seconds is null;end if;end;$$;
create function public.theater_snapshot() returns jsonb language plpgsql security definer set search_path='' as $$
declare next_id bigint; result jsonb;
begin
if auth.uid() is null then raise exception 'Login required' using errcode='42501';end if;
perform pg_catalog.pg_advisory_xact_lock(718224);
if not exists(select 1 from public.theater_queue where status='playing') then select id into next_id from public.theater_queue where status='waiting' order by id limit 1;update public.theater_queue set status='playing',started_at=now() where id=next_id;end if;
select jsonb_build_object('server_time',now(),'items',coalesce(jsonb_agg(t order by t.id),'[]'::jsonb)) into result from (select id,link,owner,status,started_at from public.theater_queue where status in ('playing','waiting')) t;
return result;end;$$;
revoke all on function public.theater_enqueue(text),public.theater_next(bigint),public.theater_duration(bigint,double precision),public.theater_snapshot() from public;
grant execute on function public.theater_enqueue(text),public.theater_next(bigint),public.theater_duration(bigint,double precision),public.theater_snapshot() to authenticated;
commit;

begin;
alter table public.theater_queue add column playback_position double precision,
 add column playback_updated_at timestamptz, add column playback_index integer,
 add column playback_uri text;
create function public.theater_heartbeat(expected_id bigint, position_seconds double precision, playlist_index integer default null, playing_uri text default null) returns void language plpgsql security definer set search_path='' as $$
begin
if position_seconds<0 or position_seconds>86400 or playlist_index<0 or playlist_index>10000 or length(playing_uri)>150 then return;end if;
if playing_uri is not null and playing_uri !~ '^spotify:(track|episode):[A-Za-z0-9]{22}$' then return;end if;
update public.theater_queue set playback_position=position_seconds,playback_updated_at=now(),playback_index=playlist_index,playback_uri=playing_uri where id=expected_id and owner=auth.uid() and status='playing';
end;$$;
create or replace function public.theater_snapshot() returns jsonb language plpgsql security definer set search_path='' as $$
declare next_id bigint; result jsonb;
begin
if auth.uid() is null then raise exception 'Login required' using errcode='42501';end if;
perform pg_catalog.pg_advisory_xact_lock(718224);
update public.theater_queue set status='done' where status='playing' and duration_seconds is not null and now()>=coalesce(playback_updated_at,started_at)+(duration_seconds-coalesce(playback_position,0))*interval '1 second';
if not exists(select 1 from public.theater_queue where status='playing') then select id into next_id from public.theater_queue where status='waiting' order by id limit 1;update public.theater_queue set status='playing',started_at=now() where id=next_id;end if;
select jsonb_build_object('server_time',now(),'items',coalesce(jsonb_agg(t order by t.id),'[]'::jsonb)) into result from (select id,link,owner,status,started_at,playback_position,playback_updated_at,playback_index,playback_uri from public.theater_queue where status in ('playing','waiting')) t;
return result;end;$$;
revoke all on function public.theater_heartbeat(bigint,double precision,integer,text) from public;
grant execute on function public.theater_heartbeat(bigint,double precision,integer,text) to authenticated;
commit;
