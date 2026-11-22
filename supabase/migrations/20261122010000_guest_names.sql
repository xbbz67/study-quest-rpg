begin;
create table public.theater_profiles(
 user_id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null check(char_length(display_name) between 2 and 24),
 name_key text not null unique,
 is_guest boolean not null,
 updated_at timestamptz not null default now()
);
alter table public.theater_profiles enable row level security;
revoke all on public.theater_profiles from anon,authenticated;
grant select on public.theater_profiles to authenticated;
create policy "Members read their own identity" on public.theater_profiles for select to authenticated using(user_id=auth.uid());

create function public.theater_register_name(chosen_name text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare clean_name text;canonical text;guest boolean;begin
 if auth.uid() is null then raise exception 'Session required' using errcode='42501';end if;
 clean_name=pg_catalog.btrim(pg_catalog.regexp_replace(pg_catalog.normalize(chosen_name,'NFKC'),'[[:space:]]+',' ','g'));
 if clean_name is null or char_length(clean_name) not between 2 and 24 or clean_name !~ '^[[:alnum:] ._-]+$' then raise exception 'Use 2-24 letters, numbers, spaces, dots, underscores or hyphens' using errcode='22023';end if;
 canonical=pg_catalog.lower(clean_name);
 if canonical in ('chiến thần vnu','chien than vnu') then raise exception 'Choose a personal name instead of the default' using errcode='PT422';end if;
 select coalesce(is_anonymous,false) into guest from auth.users where id=auth.uid();
 perform pg_catalog.pg_advisory_xact_lock(718226);
 perform pg_catalog.pg_advisory_xact_lock(718223);
 -- Abandoned guest aliases can be reused after 30 days; account names stay reserved.
 delete from public.theater_profiles where is_guest and updated_at<now()-interval '30 days' and user_id<>auth.uid();
 insert into public.theater_profiles(user_id,display_name,name_key,is_guest) values(auth.uid(),clean_name,canonical,coalesce(guest,false))
 on conflict(user_id) do update set display_name=excluded.display_name,name_key=excluded.name_key,is_guest=excluded.is_guest,updated_at=now();
 update public.theater_seats set display_name=clean_name where user_id=auth.uid() and display_name is distinct from clean_name;
 return jsonb_build_object('display_name',clean_name);
 exception when unique_violation then raise exception 'This name is already in use' using errcode='PT409';
end;$$;

create function public.theater_member_name() returns text
language plpgsql security definer set search_path='' as $$
declare member public.theater_profiles;begin
 if auth.uid() is null then raise exception 'Session required' using errcode='42501';end if;
 select * into member from public.theater_profiles where user_id=auth.uid();
 if member.user_id is null then raise exception 'Choose your name before entering' using errcode='PT428';end if;
 if member.updated_at<now()-interval '10 minutes' then update public.theater_profiles set updated_at=now() where user_id=auth.uid();end if;
 return member.display_name;
end;$$;
revoke all on function public.theater_member_name() from public,anon,authenticated;
revoke all on function public.theater_register_name(text) from public;
grant execute on function public.theater_register_name(text) to authenticated;


alter function public.choose_theater_seat(text,text) rename to choose_theater_seat_before_names;
revoke all on function public.choose_theater_seat_before_names(text,text) from public,anon,authenticated;
create function public.choose_theater_seat(chosen_seat text,nickname text default 'Bạn học') returns void language plpgsql security definer set search_path='' as $$begin

perform public.choose_theater_seat_before_names(chosen_seat,case when chosen_seat is null then nickname else public.theater_member_name() end);
end;$$;
revoke all on function public.choose_theater_seat(text,text) from public;
grant execute on function public.choose_theater_seat(text,text) to authenticated;

alter function public.theater_send_message(text,text) rename to theater_send_message_before_names;
revoke all on function public.theater_send_message_before_names(text,text) from public,anon,authenticated;
create function public.theater_send_message(message_text text,nickname text) returns public.theater_messages language plpgsql security definer set search_path='' as $$begin

return public.theater_send_message_before_names(message_text,public.theater_member_name());
end;$$;
revoke all on function public.theater_send_message(text,text) from public;
grant execute on function public.theater_send_message(text,text) to authenticated;

alter function public.theater_enqueue(text) rename to theater_enqueue_before_names;
revoke all on function public.theater_enqueue_before_names(text) from public,anon,authenticated;
create function public.theater_enqueue(media_link text) returns bigint language plpgsql security definer set search_path='' as $$begin
perform public.theater_member_name();
return public.theater_enqueue_before_names(media_link);
end;$$;
revoke all on function public.theater_enqueue(text) from public;
grant execute on function public.theater_enqueue(text) to authenticated;

alter function public.theater_snapshot() rename to theater_snapshot_before_names;
revoke all on function public.theater_snapshot_before_names() from public,anon,authenticated;
create function public.theater_snapshot() returns jsonb language plpgsql security definer set search_path='' as $$begin
perform public.theater_member_name();
return public.theater_snapshot_before_names();
end;$$;
revoke all on function public.theater_snapshot() from public;
grant execute on function public.theater_snapshot() to authenticated;

alter function public.theater_next(bigint) rename to theater_next_before_names;
revoke all on function public.theater_next_before_names(bigint) from public,anon,authenticated;
create function public.theater_next(expected_id bigint) returns void language plpgsql security definer set search_path='' as $$begin
perform public.theater_member_name();
perform public.theater_next_before_names(expected_id);
end;$$;
revoke all on function public.theater_next(bigint) from public;
grant execute on function public.theater_next(bigint) to authenticated;

alter function public.theater_control(bigint,text,double precision,bigint,integer,text) rename to theater_control_before_names;
revoke all on function public.theater_control_before_names(bigint,text,double precision,bigint,integer,text) from public,anon,authenticated;
create function public.theater_control(expected_id bigint,action text,position_seconds double precision,expected_revision bigint,playlist_index integer default null,playing_uri text default null) returns jsonb language plpgsql security definer set search_path='' as $$begin
perform public.theater_member_name();
return public.theater_control_before_names(expected_id,action,position_seconds,expected_revision,playlist_index,playing_uri);
end;$$;
revoke all on function public.theater_control(bigint,text,double precision,bigint,integer,text) from public;
grant execute on function public.theater_control(bigint,text,double precision,bigint,integer,text) to authenticated;

alter function public.theater_heartbeat(bigint,double precision,integer,text,bigint,boolean) rename to theater_heartbeat_before_names;
revoke all on function public.theater_heartbeat_before_names(bigint,double precision,integer,text,bigint,boolean) from public,anon,authenticated;
create function public.theater_heartbeat(expected_id bigint,position_seconds double precision,playlist_index integer default null,playing_uri text default null,expected_revision bigint default null,live_stream boolean default null) returns void language plpgsql security definer set search_path='' as $$begin
perform public.theater_member_name();
perform public.theater_heartbeat_before_names(expected_id,position_seconds,playlist_index,playing_uri,expected_revision,live_stream);
end;$$;
revoke all on function public.theater_heartbeat(bigint,double precision,integer,text,bigint,boolean) from public;
grant execute on function public.theater_heartbeat(bigint,double precision,integer,text,bigint,boolean) to authenticated;

alter function public.theater_duration(bigint,double precision) rename to theater_duration_before_names;
revoke all on function public.theater_duration_before_names(bigint,double precision) from public,anon,authenticated;
create function public.theater_duration(expected_id bigint,seconds double precision) returns void language plpgsql security definer set search_path='' as $$begin
perform public.theater_member_name();
perform public.theater_duration_before_names(expected_id,seconds);
end;$$;
revoke all on function public.theater_duration(bigint,double precision) from public;
grant execute on function public.theater_duration(bigint,double precision) to authenticated;
commit;
