-- =============================================================================
-- POCHI MA BUONI — local development seed data
-- Applied by `supabase db reset`. Contains ONLY fictional demo data.
-- Demo accounts use example.com addresses and sign in with a magic link
-- delivered to the local Supabase mail viewer (http://127.0.0.1:54324).
-- Demo subscriptions are local placeholders (sub_seed_*) and do not exist in
-- Stripe; real subscriptions are only ever written by the verified webhook.
-- =============================================================================

-- Sports catalogue -----------------------------------------------------------
insert into public.sports (slug, name, skill_levels, formats, sort_order) values
  ('tennis', 'Tennis', array['Beginner','Improver','Intermediate','Advanced','Competitive'], array['Singles','Doubles','Hitting session','Drills'], 10),
  ('padel', 'Padel', array['Beginner','Intermediate','Advanced','Competitive'], array['Doubles','Americano','Drills'], 20),
  ('pickleball', 'Pickleball', array['Beginner','Intermediate','Advanced','Competitive'], array['Singles','Doubles','Open play'], 30),
  ('golf', 'Golf', array['Beginner','High handicap','Mid handicap','Low handicap','Scratch'], array['9 holes','18 holes','Driving range','Simulator'], 40),
  ('basketball', 'Basketball', array['Casual','Intermediate','Advanced','Competitive'], array['1v1','3v3','5v5','Shooting'], 50),
  ('soccer', 'Soccer', array['Casual','Intermediate','Advanced','Competitive'], array['5-a-side','7-a-side','11-a-side','Training'], 60),
  ('running', 'Running', array['Easy pace','Steady','Tempo','Competitive'], array['Easy run','Long run','Intervals','Race training'], 70),
  ('swimming', 'Swimming', array['Beginner','Intermediate','Advanced','Masters'], array['Lap swim','Open water','Technique'], 80),
  ('squash', 'Squash', array['Beginner','Intermediate','Advanced','Competitive'], array['Singles','Doubles','Drills'], 90),
  ('volleyball', 'Volleyball', array['Casual','Intermediate','Advanced','Competitive'], array['Indoor 6s','Beach 2s','Beach 4s'], 100),
  ('cycling', 'Cycling', array['Leisure','Intermediate','Fast group','Racing'], array['Road ride','Park loops','Indoor'], 110)
on conflict (slug) do nothing;

-- Matching weights (admin-configurable) ---------------------------------------
insert into public.app_settings (key, value) values
  ('matching_weights', '{"availability": 0.35, "skill": 0.30, "neighborhood": 0.20, "format": 0.15}')
on conflict (key) do nothing;

-- Referral codes --------------------------------------------------------------
insert into public.referral_codes (code, description, max_uses) values
  ('FOUNDING-CIRCLE', 'Founding members — early access', 50),
  ('FRIENDS-OF-PMB', 'Personal introductions from the team', null)
on conflict (code) do nothing;

-- Demo accounts ---------------------------------------------------------------
-- The on_auth_user_created trigger creates the matching public.users rows.
insert into auth.users (id, instance_id, aud, role, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@example.com', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'giulia@example.com', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'marcus@example.com', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-4000-8000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'amara@example.com', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-4000-8000-000000000005', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'theo@example.com', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-4000-8000-000000000006', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sofia@example.com', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now())
on conflict (id) do nothing;

update public.users set role = 'ADMIN' where id = '00000000-0000-4000-8000-000000000001';
update public.users set role = 'MEMBER'
 where id in ('00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000003',
              '00000000-0000-4000-8000-000000000004','00000000-0000-4000-8000-000000000005');
-- sofia@example.com stays an APPLICANT with a pending application.

insert into public.subscriptions (user_id, stripe_customer_id, stripe_subscription_id, status, unit_amount, current_period_end)
select id, 'cus_seed_' || right(id::text, 4), 'sub_seed_' || right(id::text, 4), 'active', 6000, now() + interval '30 days'
from public.users where role = 'MEMBER'
on conflict (user_id) do nothing;

insert into public.member_profiles (user_id, first_name, last_name, show_last_name, bio, neighborhood, occupation, completed_at) values
  ('00000000-0000-4000-8000-000000000001', 'Elena', 'Moretti', false, 'Membership director. Happy to hit on weekend mornings.', 'west-village', 'Pochi Ma Buoni', now()),
  ('00000000-0000-4000-8000-000000000002', 'Giulia', 'Ricci', true, 'Architect, Milanese, former university tennis player. Looking for consistent doubles partners and the occasional padel Americano.', 'west-village', 'Architect', now()),
  ('00000000-0000-4000-8000-000000000003', 'Marcus', 'Hale', false, 'Early riser. Long runs along the Hudson, tennis when I can find a hitting partner who enjoys long rallies.', 'tribeca', 'Private equity', now()),
  ('00000000-0000-4000-8000-000000000004', 'Amara', 'Okafor', false, 'Physician at a downtown hospital. Pickleball convert, swimmer since childhood.', 'chelsea', 'Physician', now()),
  ('00000000-0000-4000-8000-000000000005', 'Théo', 'Laurent', true, 'Parisian in New York. Padel evangelist; squash on weekday evenings.', 'upper-east-side', 'Columbia University', now())
on conflict (user_id) do nothing;

insert into public.member_sports (user_id, sport_id, skill_level, formats)
select v.user_id::uuid, s.id, v.level, v.formats::text[]
from (values
  ('00000000-0000-4000-8000-000000000001', 'tennis', 'Intermediate', '{Doubles,"Hitting session"}'),
  ('00000000-0000-4000-8000-000000000002', 'tennis', 'Advanced', '{Doubles,Singles}'),
  ('00000000-0000-4000-8000-000000000002', 'padel', 'Intermediate', '{Americano,Doubles}'),
  ('00000000-0000-4000-8000-000000000003', 'tennis', 'Intermediate', '{Singles,"Hitting session"}'),
  ('00000000-0000-4000-8000-000000000003', 'running', 'Tempo', '{"Long run",Intervals}'),
  ('00000000-0000-4000-8000-000000000004', 'pickleball', 'Intermediate', '{Doubles,"Open play"}'),
  ('00000000-0000-4000-8000-000000000004', 'swimming', 'Advanced', '{"Lap swim"}'),
  ('00000000-0000-4000-8000-000000000005', 'padel', 'Advanced', '{Doubles,Americano}'),
  ('00000000-0000-4000-8000-000000000005', 'squash', 'Intermediate', '{Singles}'),
  ('00000000-0000-4000-8000-000000000005', 'tennis', 'Advanced', '{Doubles}')
) as v(user_id, slug, level, formats)
join public.sports s on s.slug = v.slug
on conflict do nothing;

insert into public.member_availability (user_id, day_of_week, time_block)
select v.user_id::uuid, v.day, v.block::public.time_block
from (values
  ('00000000-0000-4000-8000-000000000001', 5, 'MORNING'), ('00000000-0000-4000-8000-000000000001', 6, 'MORNING'),
  ('00000000-0000-4000-8000-000000000002', 5, 'MORNING'), ('00000000-0000-4000-8000-000000000002', 6, 'MORNING'),
  ('00000000-0000-4000-8000-000000000002', 2, 'EVENING'),
  ('00000000-0000-4000-8000-000000000003', 0, 'EARLY_MORNING'), ('00000000-0000-4000-8000-000000000003', 2, 'EARLY_MORNING'),
  ('00000000-0000-4000-8000-000000000003', 5, 'MORNING'),
  ('00000000-0000-4000-8000-000000000004', 1, 'EVENING'), ('00000000-0000-4000-8000-000000000004', 3, 'EVENING'),
  ('00000000-0000-4000-8000-000000000004', 6, 'AFTERNOON'),
  ('00000000-0000-4000-8000-000000000005', 2, 'EVENING'), ('00000000-0000-4000-8000-000000000005', 3, 'EVENING'),
  ('00000000-0000-4000-8000-000000000005', 6, 'MORNING')
) as v(user_id, day, block)
on conflict do nothing;

insert into public.membership_applications
  (user_id, email, full_name, date_of_birth, neighborhood, occupation, sports, availability, introduction, motivation, status, reviewed_at)
values
  ('00000000-0000-4000-8000-000000000002', 'giulia@example.com', 'Giulia Ricci', '1991-04-12', 'west-village', 'Architect',
   '[{"sport":"tennis","level":"Advanced"},{"sport":"padel","level":"Intermediate"}]', '["5:MORNING","6:MORNING"]',
   'Architect originally from Milan, in New York for six years. I played varsity tennis and picked up padel in Madrid.',
   'I want a reliable circle of people who take the game seriously but are good company afterwards.', 'APPROVED', now()),
  ('00000000-0000-4000-8000-000000000006', 'sofia@example.com', 'Sofia Lindqvist', '1994-09-03', 'east-village', 'Product designer',
   '[{"sport":"running","level":"Steady"},{"sport":"volleyball","level":"Intermediate"}]', '["5:MORNING","2:EVENING"]',
   'Product designer from Stockholm. Weekend long runs, beach volleyball in summer, and always looking for a new route.',
   'Moving here was easy; finding people to train with consistently has not been. This feels like the right room.', 'PENDING', null)
on conflict do nothing;

insert into public.connections (requester_id, addressee_id, status, responded_at) values
  ('00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000005', 'ACCEPTED', now())
on conflict do nothing;
