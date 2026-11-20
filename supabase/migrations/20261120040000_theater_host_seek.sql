begin;
alter table public.theater_queue add column control_action text not null default 'play' check(control_action in ('play','pause','seek'));
create or replace function public.theater_control(expected_id bigint, action text, position_seconds double precision, expected_revision bigint, playlist_index integer default null, playing_uri text default null) returns jsonb
language plpgsql security definer set search_path='' as $$
declare item public.theater_queue;
begin
 if auth.uid() is null then raise exception 'Session required' using errcode='42501';end if;
 if action not in ('pause','play','seek') or action is null or position_seconds is null or not(position_seconds between 0 and 864000) then raise exception 'Invalid control' using errcode='22023';end if;
 if playlist_index is not null and not(playlist_index between 0 and 10000) then raise exception 'Invalid index' using errcode='22023';end if;
 if playing_uri is not null and playing_uri !~ '^spotify:(track|episode):[A-Za-z0-9]{22}$' then raise exception 'Invalid URI' using errcode='22023';end if;
 perform pg_catalog.pg_advisory_xact_lock(718224);
 select * into item from public.theater_queue where id=expected_id and status='playing' for update;
 if item.id is null or item.owner<>auth.uid() then raise exception 'Only the current host can control playback' using errcode='42501';end if;
 if expected_revision is distinct from item.control_revision then raise exception 'Playback changed; refresh first' using errcode='PT409';end if;
 if action='seek' or item.playback_paused is distinct from (action='pause') then
  update public.theater_queue set playback_paused=case when action='seek' then playback_paused else (action='pause') end,control_action=action,playback_position=position_seconds,playback_updated_at=now(),playback_index=coalesce(playlist_index,playback_index),playback_uri=coalesce(playing_uri,playback_uri),control_revision=control_revision+1 where id=expected_id returning * into item;
 end if;
 return jsonb_build_object('server_time',now(),'item',to_jsonb(item));
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
 (select id,link,owner,status,started_at,playback_position,playback_updated_at,playback_index,playback_uri,playback_paused,control_revision,is_live,control_action from public.theater_queue where status in ('playing','waiting')) t;
 return result;
end;$$;

commit;
