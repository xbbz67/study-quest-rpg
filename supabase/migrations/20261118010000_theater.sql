begin;
create table if not exists public.theater_seats (
 user_id uuid primary key references auth.users(id) on delete cascade,
 seat text not null unique check (seat ~ '^[A-F][1-8]$'),
 display_name text not null check (length(display_name) between 1 and 40),
 updated_at timestamptz not null default now()
);
alter table public.theater_seats enable row level security;
revoke all on public.theater_seats from anon, authenticated;
grant select on public.theater_seats to authenticated;
drop policy if exists "Room members see seat nicknames" on public.theater_seats;
create policy "Room members see seat nicknames" on public.theater_seats for select to authenticated using (true);
create or replace function public.choose_theater_seat(chosen_seat text, nickname text default 'Bạn học')
returns void language plpgsql security definer set search_path = '' as $$
declare account_id uuid := auth.uid();
begin
 if account_id is null then raise exception 'Login required' using errcode='42501'; end if;
 if chosen_seat is null then delete from public.theater_seats where user_id=account_id; return; end if;
 if chosen_seat !~ '^[A-F][1-8]$' then raise exception 'Invalid seat' using errcode='22023'; end if;
 perform pg_catalog.pg_advisory_xact_lock(718223);
 delete from public.theater_seats where updated_at < now()-interval '120 seconds';
 insert into public.theater_seats(user_id,seat,display_name) values(account_id,chosen_seat,left(coalesce(nullif(trim(nickname),''),'Bạn học'),40))
 on conflict (user_id) do update set seat=excluded.seat,display_name=excluded.display_name,updated_at=now();
exception when unique_violation then raise exception 'Seat already occupied' using errcode='PT409';
end; $$;
revoke all on function public.choose_theater_seat(text,text) from public;
grant execute on function public.choose_theater_seat(text,text) to authenticated;
commit;
