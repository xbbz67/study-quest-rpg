begin;
create table if not exists public.study_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  revision bigint not null default 1 check (revision > 0),
  updated_at timestamptz not null default now()
);
alter table public.study_progress enable row level security;
revoke all on public.study_progress from anon, authenticated;
grant select on public.study_progress to authenticated;
drop policy if exists "Read own progress" on public.study_progress;
create policy "Read own progress" on public.study_progress for select to authenticated using ((select auth.uid()) = user_id);

create or replace function public.save_study_progress(expected_revision bigint, new_payload jsonb, expected_account uuid)
returns table(revision bigint, updated_at timestamptz)
language plpgsql security definer set search_path = '' as $$
declare
  account_id uuid := auth.uid();
  changed integer;
begin
  if account_id is null or account_id is distinct from expected_account then raise exception 'Login required' using errcode = '42501'; end if;
  if expected_revision < 0 or expected_revision is null or new_payload is null
     or jsonb_typeof(new_payload) <> 'object'
     or jsonb_typeof(new_payload->'character') is distinct from 'object'
     or jsonb_typeof(new_payload->'quests') is distinct from 'array'
     or jsonb_typeof(new_payload->'level') is distinct from 'number'
     or octet_length(new_payload::text) > 1048576 then
    raise exception 'Invalid progress data' using errcode = '22023';
  end if;
  if expected_revision = 0 then
    insert into public.study_progress(user_id, payload) values(account_id, new_payload)
    on conflict (user_id) do nothing;
  else
    update public.study_progress as p set payload = new_payload, revision = p.revision + 1, updated_at = now()
    where p.user_id = account_id and p.revision = expected_revision;
  end if;
  get diagnostics changed = row_count;
  if changed = 0 then raise exception 'Progress changed on another device' using errcode = 'PT409'; end if;
  return query select p.revision, p.updated_at from public.study_progress p where p.user_id = account_id;
end;
$$;
revoke all on function public.save_study_progress(bigint,jsonb,uuid) from public;
grant execute on function public.save_study_progress(bigint,jsonb,uuid) to authenticated;
commit;
