-- =============================================================================
-- Matchmaking preferences (private birth dates, age compatibility) and venues.
-- Seed ages: Giulia 1991 (prefers 28-45), Marcus 1988, Amara 1990 (age hidden),
-- Théo 1993. Giulia is ...0002, Marcus ...0003, Amara ...0004, Théo ...0005.
-- =============================================================================
\set ON_ERROR_STOP on

create or replace function pg_temp.act_as(uid uuid) returns void language plpgsql as $$
begin
  if uid is null then
    perform set_config('role', 'anon', true);
    perform set_config('request.jwt.claim.sub', '', true);
  else
    perform set_config('role', 'authenticated', true);
    perform set_config('request.jwt.claim.sub', uid::text, true);
  end if;
end $$;

create or replace function pg_temp.expect(cond boolean, label text) returns void language plpgsql as $$
begin
  if not coalesce(cond, false) then
    raise exception 'FAILED: %', label;
  end if;
  raise notice 'ok - %', label;
end $$;

-- Venues are public and admin-managed --------------------------------------------
begin;
select pg_temp.act_as(null);
select pg_temp.expect((select count(*) from public.venues) >= 20, 'anon can read the venue directory');
select pg_temp.expect((select count(*) from public.venue_sports vs join public.sports s on s.id = vs.sport_id where s.slug = 'tennis') >= 3,
  'anon can list venues for a sport');
rollback;

begin;
update public.venues set is_active = false where slug = 'printing-house';
select pg_temp.act_as(null);
select pg_temp.expect(not exists (select 1 from public.venues where slug = 'printing-house'), 'inactive venues are hidden from visitors');
select pg_temp.act_as('00000000-0000-4000-8000-000000000001');
select pg_temp.expect(exists (select 1 from public.venues where slug = 'printing-house'), 'admin still sees inactive venues');
rollback;

begin;
select pg_temp.act_as('00000000-0000-4000-8000-000000000002');
do $$ begin
  insert into public.venues (slug, name, neighborhood, location, access) values ('fake-venue', 'Fake', 'soho', 'Somewhere', 'FREE_PUBLIC');
  raise exception 'FAILED: member created a venue';
exception when insufficient_privilege then raise notice 'ok - members cannot create venues';
end $$;
rollback;

-- Dates of birth stay private --------------------------------------------------------
begin;
select pg_temp.act_as('00000000-0000-4000-8000-000000000002');
do $$ begin
  perform 1 from public.member_private;
  raise exception 'FAILED: member read member_private';
exception when insufficient_privilege then raise notice 'ok - members cannot read dates of birth';
end $$;
do $$ begin
  update public.member_profiles set first_name = first_name where user_id = auth.uid();
  insert into public.member_private (user_id, date_of_birth) values (auth.uid(), '2000-01-01');
  raise exception 'FAILED: member wrote their own date of birth';
exception when insufficient_privilege then raise notice 'ok - members cannot change their date of birth';
end $$;
rollback;

-- Age information and two-way compatibility ---------------------------------------------
begin;
select pg_temp.act_as('00000000-0000-4000-8000-000000000002'); -- Giulia, prefers 28-45
create temp table ai on commit drop as
  select * from public.member_age_info(array[
    '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000003',
    '00000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000006']::uuid[]);
select pg_temp.expect((select age from ai where user_id = '00000000-0000-4000-8000-000000000002') is not null, 'members see their own age');
select pg_temp.expect((select age from ai where user_id = '00000000-0000-4000-8000-000000000003') is not null, 'shown ages are returned');
select pg_temp.expect((select age from ai where user_id = '00000000-0000-4000-8000-000000000004') is null, 'hidden ages are not returned');
select pg_temp.expect((select i_accept and they_accept from ai where user_id = '00000000-0000-4000-8000-000000000003'), 'members within both preferences are compatible');
select pg_temp.expect(not exists (select 1 from ai where user_id = '00000000-0000-4000-8000-000000000006'), 'age info is limited to members the caller can see');
rollback;

begin;
update public.member_profiles set partner_age_min = 40, partner_age_max = 60 where user_id = '00000000-0000-4000-8000-000000000002';
update public.member_profiles set partner_age_min = 18, partner_age_max = 25 where user_id = '00000000-0000-4000-8000-000000000004';
select pg_temp.act_as('00000000-0000-4000-8000-000000000002');
select pg_temp.expect((select not i_accept from public.member_age_info(array['00000000-0000-4000-8000-000000000003']::uuid[])),
  'members outside my preferred range are flagged');
select pg_temp.expect((select not i_accept and not they_accept from public.member_age_info(array['00000000-0000-4000-8000-000000000004']::uuid[])),
  'hidden ages still count for both members preferences');
rollback;

begin;
do $$ begin
  update public.member_profiles set partner_age_min = 50, partner_age_max = 30 where user_id = '00000000-0000-4000-8000-000000000002';
  raise exception 'FAILED: inverted age range accepted';
exception when check_violation then raise notice 'ok - age range must be in order';
end $$;
do $$ begin
  update public.member_profiles set play_styles = array['speed_dating'] where user_id = '00000000-0000-4000-8000-000000000002';
  raise exception 'FAILED: unknown play style accepted';
exception when check_violation then raise notice 'ok - play styles are validated';
end $$;
rollback;

-- Birth date is copied from the approved application when the profile is created
begin;
insert into public.membership_applications (email, full_name, date_of_birth, neighborhood, introduction, motivation, status)
values ('dob@example.com', 'Dob Member', '1985-03-03', 'soho', repeat('a', 50), repeat('b', 50), 'APPROVED');
insert into auth.users (id, email) values ('00000000-0000-4000-8000-0000000000bb', 'dob@example.com');
insert into public.member_profiles (user_id, first_name, neighborhood) values ('00000000-0000-4000-8000-0000000000bb', 'Dob', 'soho');
select pg_temp.expect((select date_of_birth from public.member_private where user_id = '00000000-0000-4000-8000-0000000000bb') = '1985-03-03',
  'date of birth copied from the approved application');
rollback;
