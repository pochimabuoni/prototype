-- =============================================================================
-- Row Level Security & business-rule integration tests.
-- Runs against the seeded database (see scripts/test-db.sh). Each check raises
-- an exception on failure, which aborts the run with a non-zero exit code.
-- Seed ids:  ...0001 admin · ...0002 Giulia · ...0003 Marcus · ...0004 Amara
--            ...0005 Théo (connected to Giulia) · ...0006 Sofia (applicant)
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

-- ---------------------------------------------------------------------------
-- Anonymous visitors
-- ---------------------------------------------------------------------------
begin;
select pg_temp.act_as(null);
select pg_temp.expect((select count(*) from public.sports) = 11, 'anon can read active sports catalogue');
do $$ begin
  perform 1 from public.member_profiles;
  raise exception 'FAILED: anon read member_profiles';
exception when insufficient_privilege then raise notice 'ok - anon cannot read member profiles';
end $$;
do $$ begin
  perform 1 from public.membership_applications;
  raise exception 'FAILED: anon read applications';
exception when insufficient_privilege then raise notice 'ok - anon cannot read applications';
end $$;
do $$ begin
  insert into public.membership_applications (email, full_name, date_of_birth, neighborhood, introduction, motivation)
  values ('x@example.com', 'X Y', '1990-01-01', 'tribeca', repeat('a', 50), repeat('b', 50));
  raise exception 'FAILED: anon inserted application directly';
exception when insufficient_privilege then raise notice 'ok - anon cannot insert applications directly';
end $$;
rollback;

-- ---------------------------------------------------------------------------
-- Applicants (approved or not) cannot reach the community
-- ---------------------------------------------------------------------------
begin;
select pg_temp.act_as('00000000-0000-4000-8000-000000000006');
select pg_temp.expect((select count(*) from public.member_profiles) = 0, 'applicant sees no member profiles');
select pg_temp.expect((select count(*) from public.membership_applications) = 1, 'applicant sees only own application');
select pg_temp.expect((select count(*) from public.users) = 1, 'applicant sees only own user row');
do $$ begin
  update public.membership_applications set status = 'APPROVED';
  raise exception 'FAILED: applicant updated application';
exception when insufficient_privilege then raise notice 'ok - applicant cannot change application decision';
end $$;
do $$ begin
  update public.users set role = 'ADMIN';
  raise exception 'FAILED: applicant escalated role';
exception when insufficient_privilege then raise notice 'ok - applicant cannot change own role';
end $$;
do $$ begin
  insert into public.subscriptions (user_id, stripe_customer_id, stripe_subscription_id, status)
  values ('00000000-0000-4000-8000-000000000006', 'cus_x', 'sub_x', 'active');
  raise exception 'FAILED: applicant granted self a subscription';
exception when insufficient_privilege then raise notice 'ok - applicant cannot grant self an entitlement';
end $$;
select pg_temp.expect(not public.is_active_member('00000000-0000-4000-8000-000000000006'), 'applicant is not an active member');
rollback;

-- ---------------------------------------------------------------------------
-- Members: profile visibility, privacy, entitlements
-- ---------------------------------------------------------------------------
begin;
select pg_temp.act_as('00000000-0000-4000-8000-000000000003'); -- Marcus
select pg_temp.expect((select count(*) from public.member_profiles) = 4, 'member sees completed profiles of active members only');
select pg_temp.expect((select count(*) from public.users) = 1, 'member cannot read other users (emails)');
select pg_temp.expect((select count(*) from public.subscriptions) = 1, 'member sees only own subscription');
do $$ begin
  update public.subscriptions set status = 'active', current_period_end = now() + interval '10 years';
  raise exception 'FAILED: member modified subscription';
exception when insufficient_privilege then raise notice 'ok - member cannot modify own subscription entitlement';
end $$;
do $$ begin
  update public.member_profiles set bio = 'hacked' where user_id = '00000000-0000-4000-8000-000000000002';
  if found then raise exception 'FAILED: member edited another profile'; end if;
  raise notice 'ok - member cannot edit another profile';
end $$;
update public.member_profiles set bio = 'Updated bio' where user_id = '00000000-0000-4000-8000-000000000003';
select pg_temp.expect((select bio from public.member_profiles where user_id = '00000000-0000-4000-8000-000000000003') = 'Updated bio', 'member can edit own profile');
do $$ begin
  perform 1 from public.audit_logs;
  if found then raise exception 'FAILED: member read audit logs'; end if;
  raise notice 'ok - member cannot read audit logs';
end $$;
rollback;

-- Hidden profiles disappear from discovery; CONNECTIONS-only requires a connection
begin;
update public.member_profiles set visibility = 'CONNECTIONS' where user_id = '00000000-0000-4000-8000-000000000005';
select pg_temp.act_as('00000000-0000-4000-8000-000000000003'); -- Marcus, not connected to Théo
select pg_temp.expect(not exists (select 1 from public.member_profiles where user_id = '00000000-0000-4000-8000-000000000005'),
  'connections-only profile hidden from non-connections');
select pg_temp.act_as('00000000-0000-4000-8000-000000000002'); -- Giulia, connected to Théo
select pg_temp.expect(exists (select 1 from public.member_profiles where user_id = '00000000-0000-4000-8000-000000000005'),
  'connections-only profile visible to connections');
rollback;

-- Lapsed subscriptions revoke access
begin;
update public.subscriptions set status = 'canceled' where user_id = '00000000-0000-4000-8000-000000000003';
select pg_temp.act_as('00000000-0000-4000-8000-000000000003');
select pg_temp.expect((select count(*) from public.member_profiles) = 1, 'canceled member sees only own profile');
rollback;

begin;
update public.subscriptions set status = 'past_due', current_period_end = now() - interval '1 day'
 where user_id = '00000000-0000-4000-8000-000000000003';
select pg_temp.expect(public.is_active_member('00000000-0000-4000-8000-000000000003'), 'past_due within grace keeps access');
update public.subscriptions set current_period_end = now() - interval '5 days'
 where user_id = '00000000-0000-4000-8000-000000000003';
select pg_temp.expect(not public.is_active_member('00000000-0000-4000-8000-000000000003'), 'past_due beyond grace revokes access');
rollback;

begin;
update public.users set account_status = 'SUSPENDED' where id = '00000000-0000-4000-8000-000000000003';
select pg_temp.expect(not public.is_active_member('00000000-0000-4000-8000-000000000003'), 'suspension revokes access');
rollback;

-- ---------------------------------------------------------------------------
-- Connections, blocking and messaging
-- ---------------------------------------------------------------------------
begin;
select pg_temp.act_as('00000000-0000-4000-8000-000000000003'); -- Marcus
do $$ begin
  perform public.get_or_create_conversation('00000000-0000-4000-8000-000000000004');
  raise exception 'FAILED: messaging without connection';
exception when insufficient_privilege then raise notice 'ok - cannot open conversation without a connection';
end $$;
insert into public.connections (requester_id, addressee_id, note)
values ('00000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000004', 'Tennis on Saturday?');
do $$ begin
  update public.connections set status = 'ACCEPTED'
   where requester_id = '00000000-0000-4000-8000-000000000003';
  raise exception 'FAILED: requester accepted own request';
exception when insufficient_privilege then raise notice 'ok - requester cannot accept own request';
end $$;
select pg_temp.act_as('00000000-0000-4000-8000-000000000004'); -- Amara accepts
update public.connections set status = 'ACCEPTED'
 where requester_id = '00000000-0000-4000-8000-000000000003' and addressee_id = '00000000-0000-4000-8000-000000000004';
select pg_temp.expect((select status from public.connections where requester_id = '00000000-0000-4000-8000-000000000003') = 'ACCEPTED', 'addressee can accept a connection');
select public.get_or_create_conversation('00000000-0000-4000-8000-000000000003') as cid \gset
insert into public.messages (conversation_id, sender_id, body) values (:'cid', '00000000-0000-4000-8000-000000000004', 'Hello Marcus');
select pg_temp.expect((select count(*) from public.messages where conversation_id = :'cid') = 1, 'connected members can message');

-- Outsider (Giulia) cannot read the conversation
select pg_temp.act_as('00000000-0000-4000-8000-000000000002');
select pg_temp.expect((select count(*) from public.messages where conversation_id = :'cid') = 0, 'non-participant cannot read messages');
select pg_temp.expect((select count(*) from public.conversations where id = :'cid') = 0, 'non-participant cannot see conversation');
do $$ begin
  insert into public.messages (conversation_id, sender_id, body)
  select id, '00000000-0000-4000-8000-000000000002', 'intrusion' from public.conversations limit 1;
  raise notice 'ok - no conversation visible to inject into';
end $$;

-- Marcus blocks Amara; neither side can continue
select pg_temp.act_as('00000000-0000-4000-8000-000000000003');
insert into public.blocks (blocker_id, blocked_id) values ('00000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000004');
select pg_temp.act_as('00000000-0000-4000-8000-000000000004');
do $$
declare c uuid;
begin
  select conversation_id into c from public.conversation_participants where user_id = auth.uid() limit 1;
  insert into public.messages (conversation_id, sender_id, body) values (c, auth.uid(), 'still there?');
  raise exception 'FAILED: blocked member continued conversation';
exception when insufficient_privilege then raise notice 'ok - blocked member cannot continue a conversation';
end $$;
select pg_temp.expect(not exists (select 1 from public.member_profiles where user_id = '00000000-0000-4000-8000-000000000003'),
  'blocked member no longer sees blocker profile');
select pg_temp.expect((select count(*) from public.blocks) = 0, 'blocked member cannot see who blocked them');
rollback;

-- ---------------------------------------------------------------------------
-- Invitations
-- ---------------------------------------------------------------------------
begin;
select pg_temp.act_as('00000000-0000-4000-8000-000000000003');
insert into public.invitations (sender_id, recipient_id, sport_id, proposed_date, proposed_time, location_note)
select '00000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000002', id, current_date + 3, '08:00', 'Hudson River Park courts'
from public.sports where slug = 'tennis';
select pg_temp.expect((select count(*) from public.invitations) = 1, 'member can invite another member to play');
do $$ begin
  insert into public.invitations (sender_id, recipient_id, sport_id, proposed_date, proposed_time, location_note)
  select '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000003', id, current_date + 3, '08:00', 'Forged sender'
  from public.sports where slug = 'tennis';
  raise exception 'FAILED: forged invitation sender';
exception when insufficient_privilege then raise notice 'ok - cannot send an invitation as someone else';
end $$;
do $$ begin
  update public.invitations set status = 'ACCEPTED';
  raise exception 'FAILED: sender accepted own invitation';
exception when insufficient_privilege then raise notice 'ok - sender cannot accept own invitation';
end $$;
select pg_temp.act_as('00000000-0000-4000-8000-000000000004'); -- Amara is not a participant
select pg_temp.expect((select count(*) from public.invitations) = 0, 'non-participants cannot read invitations');
select pg_temp.act_as('00000000-0000-4000-8000-000000000002'); -- Giulia accepts
update public.invitations set status = 'ACCEPTED';
select pg_temp.expect((select status from public.invitations limit 1) = 'ACCEPTED', 'recipient can accept invitation');
do $$ begin
  update public.invitations set status = 'COMPLETED';
  raise exception 'FAILED: completed future invitation';
exception when insufficient_privilege then raise notice 'ok - cannot complete an activity before it happens';
end $$;
select pg_temp.act_as('00000000-0000-4000-8000-000000000001'); -- admin
select pg_temp.expect((select count(*) from public.invitations) = 1, 'admin can read invitations');
rollback;

-- ---------------------------------------------------------------------------
-- Administrators
-- ---------------------------------------------------------------------------
begin;
select pg_temp.act_as('00000000-0000-4000-8000-000000000001');
select pg_temp.expect((select count(*) from public.membership_applications) = 2, 'admin can read all applications');
select pg_temp.expect((select count(*) from public.users) = 6, 'admin can read all users');
insert into public.sports (slug, name, skill_levels, formats) values ('rowing', 'Rowing', '{Novice,Club,Elite}', '{Single scull,Eight}');
select pg_temp.expect(exists (select 1 from public.sports where slug = 'rowing'), 'admin can add a sport');
select pg_temp.act_as('00000000-0000-4000-8000-000000000002');
do $$ begin
  insert into public.sports (slug, name, skill_levels, formats) values ('chess', 'Chess', '{A,B}', '{Blitz}');
  raise exception 'FAILED: member added a sport';
exception when insufficient_privilege then raise notice 'ok - members cannot manage sports';
end $$;
rollback;

-- ---------------------------------------------------------------------------
-- Business rules
-- ---------------------------------------------------------------------------
begin;
do $$ begin
  insert into public.membership_applications (email, full_name, date_of_birth, neighborhood, introduction, motivation)
  values ('young@example.com', 'Too Young', current_date - interval '17 years', 'tribeca', repeat('a', 50), repeat('b', 50));
  raise exception 'FAILED: under-18 application accepted';
exception when check_violation then raise notice 'ok - applicants under 18 are rejected by the database';
end $$;
do $$ begin
  insert into public.member_sports (user_id, sport_id, skill_level)
  select '00000000-0000-4000-8000-000000000003', id, 'Grandmaster' from public.sports where slug = 'squash';
  raise exception 'FAILED: invalid skill level accepted';
exception when check_violation then raise notice 'ok - skill levels must match the sport configuration';
end $$;
select pg_temp.expect(public.consume_referral_code('founding-circle') is not null, 'valid referral code is consumed');
select pg_temp.expect(public.consume_referral_code('NOPE-0000') is null, 'unknown referral code is rejected');
select pg_temp.expect(public.rate_limit_hit('test:key', 2, 60), 'rate limit allows first hit');
select pg_temp.expect(public.rate_limit_hit('test:key', 2, 60), 'rate limit allows second hit');
select pg_temp.expect(not public.rate_limit_hit('test:key', 2, 60), 'rate limit blocks third hit');
rollback;

-- New sign-ups are linked to their application; approval grants MEMBER role
begin;
insert into public.membership_applications (email, full_name, date_of_birth, neighborhood, introduction, motivation, status)
values ('newmember@example.com', 'New Member', '1990-05-05', 'soho', repeat('a', 50), repeat('b', 50), 'APPROVED');
insert into auth.users (id, email) values ('00000000-0000-4000-8000-0000000000aa', 'NewMember@example.com');
select pg_temp.expect((select role from public.users where id = '00000000-0000-4000-8000-0000000000aa') = 'MEMBER',
  'approved applicant becomes MEMBER on sign-up');
select pg_temp.expect((select user_id from public.membership_applications where email = 'newmember@example.com') = '00000000-0000-4000-8000-0000000000aa',
  'application linked to new account by email');
select pg_temp.expect(not public.is_active_member('00000000-0000-4000-8000-0000000000aa'), 'approved but unpaid member has no community access');
rollback;
