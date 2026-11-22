begin;
create table public.focus_scores(user_id uuid not null references auth.users(id) on delete cascade,day date not null,seconds integer not null check(seconds between 0 and 86400),primary key(user_id,day));
alter table public.focus_scores enable row level security;
revoke all on public.focus_scores from anon,authenticated;
create function public.report_focus_score(study_day date,focus_seconds integer) returns void language plpgsql security definer set search_path='' as $$begin
 perform public.theater_member_name();
 if study_day<>(now() at time zone 'Asia/Ho_Chi_Minh')::date or focus_seconds is null or focus_seconds not between 0 and 86400 then raise exception 'Invalid focus day or duration' using errcode='22023';end if;
 insert into public.focus_scores values(auth.uid(),study_day,focus_seconds) on conflict(user_id,day) do update set seconds=greatest(public.focus_scores.seconds,excluded.seconds);
end;$$;
create function public.focus_leaderboard() returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;begin
 perform public.theater_member_name();
 select coalesce(jsonb_agg(t),'[]'::jsonb) into result from (
 select p.display_name,not coalesce(u.is_anonymous,false) as registered,
 case when coalesce(u.is_anonymous,false) then coalesce(s.today,0) else greatest(coalesce(s.total,0),coalesce(case when (g.payload->>'totalMinutesStudied') ~ '^[0-9]{1,12}$' then (g.payload->>'totalMinutesStudied')::bigint*60 else 0 end,0)) end as seconds,
 p.user_id=auth.uid() as is_me
 from public.theater_profiles p join auth.users u on u.id=p.user_id
 left join (select user_id,sum(seconds)::bigint total,sum(seconds) filter(where day=(now() at time zone 'Asia/Ho_Chi_Minh')::date)::bigint today from public.focus_scores group by user_id) s on s.user_id=p.user_id
 left join public.study_progress g on g.user_id=p.user_id
 where (not coalesce(u.is_anonymous,false) and greatest(coalesce(s.total,0),coalesce(case when (g.payload->>'totalMinutesStudied') ~ '^[0-9]{1,12}$' then (g.payload->>'totalMinutesStudied')::bigint*60 else 0 end,0))>0) or (coalesce(u.is_anonymous,false) and coalesce(s.today,0)>0)
 order by registered desc,seconds desc,p.display_name limit 100
 ) t;
 return jsonb_build_object('day',(now() at time zone 'Asia/Ho_Chi_Minh')::date,'rows',result);
end;$$;
revoke all on function public.report_focus_score(date,integer),public.focus_leaderboard() from public;
grant execute on function public.report_focus_score(date,integer),public.focus_leaderboard() to authenticated;
commit;
