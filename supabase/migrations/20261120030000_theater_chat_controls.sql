begin;
alter table public.theater_queue add column playback_paused boolean not null default false,
 add column control_revision bigint not null default 0,
 add column is_live boolean not null default false;

create function public.theater_control(expected_id bigint, action text, position_seconds double precision, expected_revision bigint, playlist_index integer default null, playing_uri text default null) returns jsonb
language plpgsql security definer set search_path='' as $$
declare item public.theater_queue;
begin
 if auth.uid() is null then raise exception 'Session required' using errcode='42501';end if;
 if action not in ('pause','play') or action is null or position_seconds is null or not(position_seconds between 0 and 864000) then raise exception 'Invalid control' using errcode='22023';end if;
 if playlist_index is not null and not(playlist_index between 0 and 10000) then raise exception 'Invalid index' using errcode='22023';end if;
 if playing_uri is not null and playing_uri !~ '^spotify:(track|episode):[A-Za-z0-9]{22}$' then raise exception 'Invalid URI' using errcode='22023';end if;
 perform pg_catalog.pg_advisory_xact_lock(718224);
 select * into item from public.theater_queue where id=expected_id and status='playing' for update;
 if item.id is null or item.owner<>auth.uid() then raise exception 'Only the current host can control playback' using errcode='42501';end if;
 if expected_revision is distinct from item.control_revision then raise exception 'Playback changed; refresh first' using errcode='PT409';end if;
 if item.playback_paused is distinct from (action='pause') then
  update public.theater_queue set playback_paused=(action='pause'),playback_position=position_seconds,playback_updated_at=now(),playback_index=coalesce(playlist_index,playback_index),playback_uri=coalesce(playing_uri,playback_uri),control_revision=control_revision+1 where id=expected_id returning * into item;
 end if;
 return jsonb_build_object('server_time',now(),'item',to_jsonb(item));
end;$$;

drop function public.theater_heartbeat(bigint,double precision,integer,text);
create function public.theater_heartbeat(expected_id bigint, position_seconds double precision, playlist_index integer default null, playing_uri text default null, expected_revision bigint default null, live_stream boolean default null) returns void
language plpgsql security definer set search_path='' as $$
begin
 if position_seconds is null or not(position_seconds between 0 and 864000) or playlist_index<0 or playlist_index>10000 or length(playing_uri)>150 then return;end if;
 if playing_uri is not null and playing_uri !~ '^spotify:(track|episode):[A-Za-z0-9]{22}$' then return;end if;
 update public.theater_queue set playback_position=position_seconds,playback_updated_at=now(),playback_index=playlist_index,playback_uri=playing_uri,is_live=coalesce(live_stream,is_live)
 where id=expected_id and owner=auth.uid() and status='playing' and not playback_paused and control_revision=coalesce(expected_revision,0);
end;$$;

create or replace function public.theater_snapshot() returns jsonb language plpgsql security definer set search_path='' as $$
declare next_id bigint;result jsonb;
begin
 if auth.uid() is null then raise exception 'Session required' using errcode='42501';end if;
 perform pg_catalog.pg_advisory_xact_lock(718224);
 update public.theater_queue set status='done' where status='playing' and not playback_paused and not is_live and duration_seconds is not null and now()>=coalesce(playback_updated_at,started_at)+(duration_seconds-coalesce(playback_position,0))*interval '1 second';
 if not exists(select 1 from public.theater_queue where status='playing') then
  select id into next_id from public.theater_queue where status='waiting' order by id limit 1;
  update public.theater_queue set status='playing',started_at=now(),playback_paused=false where id=next_id;
 end if;
 select jsonb_build_object('server_time',now(),'items',coalesce(jsonb_agg(t order by t.id),'[]'::jsonb)) into result from
 (select id,link,owner,status,started_at,playback_position,playback_updated_at,playback_index,playback_uri,playback_paused,control_revision,is_live from public.theater_queue where status in ('playing','waiting')) t;
 return result;
end;$$;

create or replace function public.theater_next(expected_id bigint) returns void language plpgsql security definer set search_path='' as $$
declare item public.theater_queue;next_id bigint;
begin
 if auth.uid() is null then raise exception 'Session required' using errcode='42501';end if;
 perform pg_catalog.pg_advisory_xact_lock(718224);
 select * into item from public.theater_queue where status='playing' for update;
 if item.id is distinct from expected_id then return;end if;
 if item.owner<>auth.uid() and (item.playback_paused or item.is_live or item.duration_seconds is null or now()<coalesce(item.playback_updated_at,item.started_at)+(item.duration_seconds-coalesce(item.playback_position,0))*interval '1 second') then raise exception 'Only host can skip' using errcode='42501';end if;
 update public.theater_queue set status='done' where id=expected_id;
 select id into next_id from public.theater_queue where status='waiting' order by id limit 1;
 update public.theater_queue set status='playing',started_at=now(),playback_paused=false where id=next_id;
end;$$;

create table public.theater_messages(
 id bigint generated always as identity primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 display_name text not null check(length(display_name) between 1 and 40),
 body text not null check(length(body) between 1 and 500),
 created_at timestamptz not null default now()
);
create index theater_messages_recent on public.theater_messages(created_at desc);
create index theater_messages_user_recent on public.theater_messages(user_id,created_at desc);
alter table public.theater_messages enable row level security;
revoke all on public.theater_messages from anon,authenticated;
grant select on public.theater_messages to authenticated;
create policy "Recent room chat visible to members" on public.theater_messages for select to authenticated using(created_at>now()-interval '7 days');
create function public.theater_send_message(message_text text,nickname text) returns public.theater_messages
language plpgsql security definer set search_path='' as $$
declare item public.theater_messages;name text;
begin
 if auth.uid() is null then raise exception 'Session required' using errcode='42501';end if;
 if message_text is null or length(trim(message_text)) not between 1 and 500 then raise exception 'Message must have 1-500 characters' using errcode='22023';end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(auth.uid()::text,718225));
 if exists(select 1 from public.theater_messages where user_id=auth.uid() and created_at>now()-interval '1200 milliseconds') then raise exception 'Please wait before sending again' using errcode='PT429';end if;
 name=left(coalesce(nullif(trim(nickname),''),'Bạn học'),40);
 insert into public.theater_messages(user_id,display_name,body) values(auth.uid(),name,trim(message_text)) returning * into item;
 delete from public.theater_messages where created_at<now()-interval '7 days';
 return item;
end;$$;
alter publication supabase_realtime add table public.theater_messages;
revoke all on function public.theater_control(bigint,text,double precision,bigint,integer,text),public.theater_heartbeat(bigint,double precision,integer,text,bigint,boolean),public.theater_send_message(text,text) from public;
grant execute on function public.theater_control(bigint,text,double precision,bigint,integer,text),public.theater_heartbeat(bigint,double precision,integer,text,bigint,boolean),public.theater_send_message(text,text) to authenticated;
commit;
