create table public.shifts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid()
    references auth.users (id) on delete cascade,
  client_id text not null default gen_random_uuid()::text,
  date date not null,
  type text not null,
  start_time time without time zone,
  end_time time without time zone,
  ends_next_day boolean not null default false,
  note text not null default '',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint shifts_type_check check (
    type in (
      'day',
      'night',
      'postNight',
      'early',
      'late',
      'off',
      'paidLeave',
      'other'
    )
  ),
  constraint shifts_time_pair_check check (
    (start_time is null and end_time is null)
    or (start_time is not null and end_time is not null)
  ),
  constraint shifts_next_day_check check (
    not ends_next_day or start_time is not null
  ),
  constraint shifts_note_length_check check (char_length(note) <= 200),
  constraint shifts_client_id_length_check check (
    char_length(client_id) between 1 and 128
  ),
  constraint shifts_user_date_key unique (user_id, date),
  constraint shifts_user_client_id_key unique (user_id, client_id)
);

create table public.shift_templates (
  user_id uuid not null default auth.uid()
    references auth.users (id) on delete cascade,
  shift_type text not null,
  start_time time without time zone not null,
  end_time time without time zone not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint shift_templates_pkey primary key (user_id, shift_type),
  constraint shift_templates_type_check check (
    shift_type in ('day', 'night', 'early', 'late')
  ),
  constraint shift_templates_time_check check (start_time <> end_time)
);

create function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger shifts_set_updated_at
before update on public.shifts
for each row execute function public.set_updated_at();

create trigger shift_templates_set_updated_at
before update on public.shift_templates
for each row execute function public.set_updated_at();

alter table public.shifts enable row level security;
alter table public.shift_templates enable row level security;

revoke all on table public.shifts from anon, authenticated;
revoke all on table public.shift_templates from anon, authenticated;
grant select, insert, update, delete on table public.shifts to authenticated;
grant select, insert, update, delete on table public.shift_templates to authenticated;

create policy "Users can select their own shifts"
on public.shifts
for select
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Users can insert their own shifts"
on public.shifts
for insert
to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Users can update their own shifts"
on public.shifts
for update
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Users can delete their own shifts"
on public.shifts
for delete
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Users can select their own shift templates"
on public.shift_templates
for select
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Users can insert their own shift templates"
on public.shift_templates
for insert
to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Users can update their own shift templates"
on public.shift_templates
for update
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Users can delete their own shift templates"
on public.shift_templates
for delete
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

comment on table public.shifts is
  'Nurse shifts owned by the authenticated user. Access is restricted by RLS.';
comment on table public.shift_templates is
  'Per-user time overrides for configurable shift types. Access is restricted by RLS.';
