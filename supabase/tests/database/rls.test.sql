begin;

create extension if not exists pgtap with schema extensions;

select plan(31);

select has_table('public', 'shifts', 'shifts table exists');
select has_table('public', 'shift_templates', 'shift_templates table exists');
select ok(
  (select relrowsecurity from pg_class where oid = 'public.shifts'::regclass),
  'RLS is enabled on shifts'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.shift_templates'::regclass),
  'RLS is enabled on shift_templates'
);
select is(
  has_table_privilege('anon', 'public.shifts', 'select'),
  false,
  'anon has no shifts select grant'
);
select is(
  has_table_privilege('anon', 'public.shift_templates', 'select'),
  false,
  'anon has no shift_templates select grant'
);
select is(
  has_table_privilege('authenticated', 'public.shifts', 'select'),
  true,
  'authenticated has the required shifts select grant'
);
select is(
  has_table_privilege('authenticated', 'public.shift_templates', 'select'),
  true,
  'authenticated has the required shift_templates select grant'
);

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-1111-1111-111111111111',
    'authenticated',
    'authenticated',
    'user-a@example.com',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '22222222-2222-2222-2222-222222222222',
    'authenticated',
    'authenticated',
    'user-b@example.com',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now()
  );

insert into public.shifts (user_id, client_id, date, type, start_time, end_time)
values
  (
    '11111111-1111-1111-1111-111111111111',
    'user-a-existing',
    '2026-08-25',
    'day',
    '08:30',
    '17:15'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'user-b-existing',
    '2026-08-26',
    'night',
    '16:30',
    '09:00'
  );

insert into public.shift_templates (user_id, shift_type, start_time, end_time)
values
  ('11111111-1111-1111-1111-111111111111', 'day', '08:30', '17:15'),
  ('22222222-2222-2222-2222-222222222222', 'night', '16:30', '09:00');

set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}',
  true
);

select results_eq(
  $$select client_id from public.shifts order by client_id$$,
  $$values ('user-a-existing'::text)$$,
  'user A can select only their shifts'
);
select lives_ok(
  $$insert into public.shifts (client_id, date, type) values ('user-a-new', '2026-08-27', 'off')$$,
  'user A can insert their shift with auth.uid default'
);
select throws_ok(
  $$insert into public.shifts (user_id, client_id, date, type) values ('22222222-2222-2222-2222-222222222222', 'forged', '2026-08-28', 'day')$$,
  '42501',
  null,
  'user A cannot insert a shift for user B'
);
select lives_ok(
  $$update public.shifts set note = 'updated' where client_id = 'user-a-existing'$$,
  'user A can update their shift'
);
select is(
  (select note from public.shifts where client_id = 'user-a-existing'),
  'updated',
  'the owned shift was updated'
);
select throws_ok(
  $$update public.shifts set user_id = '22222222-2222-2222-2222-222222222222' where client_id = 'user-a-existing'$$,
  '42501',
  null,
  'user A cannot transfer a shift to user B'
);
select lives_ok(
  $$update public.shifts set note = 'forged' where client_id = 'user-b-existing'$$,
  'updating an invisible shift affects no rows without exposing it'
);
select lives_ok(
  $$delete from public.shifts where client_id = 'user-a-new'$$,
  'user A can delete their shift'
);
select lives_ok(
  $$delete from public.shifts where client_id = 'user-b-existing'$$,
  'deleting an invisible shift affects no rows without exposing it'
);
select is(
  (select count(*) from public.shifts where client_id = 'user-b-existing'),
  0::bigint,
  'user B shift remains invisible to user A'
);

select results_eq(
  $$select shift_type from public.shift_templates order by shift_type$$,
  $$values ('day'::text)$$,
  'user A can select only their templates'
);
select lives_ok(
  $$insert into public.shift_templates (shift_type, start_time, end_time) values ('early', '07:00', '15:45')$$,
  'user A can insert their template with auth.uid default'
);
select throws_ok(
  $$insert into public.shift_templates (user_id, shift_type, start_time, end_time) values ('22222222-2222-2222-2222-222222222222', 'day', '09:00', '18:00')$$,
  '42501',
  null,
  'user A cannot insert a template for user B'
);
select lives_ok(
  $$update public.shift_templates set start_time = '09:00' where shift_type = 'day'$$,
  'user A can update their template'
);
select lives_ok(
  $$update public.shift_templates set start_time = '17:00' where shift_type = 'night'$$,
  'updating an invisible template affects no rows without exposing it'
);
select throws_ok(
  $$update public.shift_templates set user_id = '22222222-2222-2222-2222-222222222222' where shift_type = 'day'$$,
  '42501',
  null,
  'user A cannot transfer a template to user B'
);
select lives_ok(
  $$delete from public.shift_templates where shift_type = 'early'$$,
  'user A can delete their template'
);
select lives_ok(
  $$delete from public.shift_templates where shift_type = 'night'$$,
  'deleting an invisible template affects no rows without exposing it'
);

select throws_ok(
  $$insert into public.shifts (client_id, date, type) values ('invalid-type', '2026-08-29', 'invalid')$$,
  '23514',
  null,
  'invalid shift types are rejected'
);
select throws_ok(
  $$insert into public.shifts (client_id, date, type, start_time) values ('unpaired-time', '2026-08-29', 'day', '08:30')$$,
  '23514',
  null,
  'unpaired shift times are rejected'
);
select throws_ok(
  $$insert into public.shift_templates (shift_type, start_time, end_time) values ('late', '10:30', '10:30')$$,
  '23514',
  null,
  'templates with identical start and end times are rejected'
);

reset role;

select is(
  (select note from public.shifts where client_id = 'user-b-existing'),
  '',
  'user B shift was not modified or deleted by user A'
);
select is(
  (
    select start_time::text
    from public.shift_templates
    where user_id = '22222222-2222-2222-2222-222222222222'
      and shift_type = 'night'
  ),
  '16:30:00',
  'user B template was not modified or deleted by user A'
);

select * from finish();
rollback;
