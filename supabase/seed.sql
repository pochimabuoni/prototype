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

-- Matchmaking preferences for demo members ------------------------------------
-- Dates of birth normally come from the approved application (see the
-- member_profiles_sync_birth_date trigger); demo members get them directly.
insert into public.member_private (user_id, date_of_birth) values
  ('00000000-0000-4000-8000-000000000001', '1986-02-20'),
  ('00000000-0000-4000-8000-000000000002', '1991-04-12'),
  ('00000000-0000-4000-8000-000000000003', '1988-11-30'),
  ('00000000-0000-4000-8000-000000000004', '1990-06-08'),
  ('00000000-0000-4000-8000-000000000005', '1993-01-17')
on conflict (user_id) do nothing;

update public.member_profiles set partner_age_min = 28, partner_age_max = 45, play_styles = array['one_on_one','small_group']
  where user_id = '00000000-0000-4000-8000-000000000002';
update public.member_profiles set play_styles = array['one_on_one','small_group','large_group']
  where user_id = '00000000-0000-4000-8000-000000000003';
update public.member_profiles set show_age = false, play_styles = array['small_group','large_group']
  where user_id = '00000000-0000-4000-8000-000000000004';
update public.member_profiles set play_styles = array['small_group']
  where user_id = '00000000-0000-4000-8000-000000000005';

-- Théo also plays Saturday mornings, so Giulia, Marcus and Théo can form a group.
insert into public.member_availability (user_id, day_of_week, time_block) values
  ('00000000-0000-4000-8000-000000000005', 5, 'MORNING')
on conflict do nothing;

-- Venue directory ---------------------------------------------------------------
-- Real, publicly known places to play. Informational only: Pochi Ma Buoni does
-- not own, operate or book any of them. VERIFY details (access, seasons,
-- websites) before launch; operators change.
insert into public.venues (slug, name, neighborhood, location, description, access, access_note, indoor, seasonal, website, sort_order) values
  ('central-park-tennis-center', 'Central Park Tennis Center', 'upper-west-side', 'Central Park, mid-park near West 94th–96th Streets',
   'Public clay and hard courts in the middle of Central Park, run by NYC Parks.', 'PERMIT_OR_RESERVATION',
   'NYC Parks tennis permit or single-play ticket. Reserve through NYC Parks.', false, true, 'https://www.centralparknyc.org', 10),
  ('riverside-park-clay-courts', 'Riverside Park Clay Courts', 'upper-west-side', 'Riverside Park at West 96th Street',
   'Public clay courts beside the Hudson.', 'PERMIT_OR_RESERVATION', 'NYC Parks tennis permit required.', false, true, null, 20),
  ('sportime-randalls-island', 'SPORTIME Randall''s Island', 'harlem', 'Randall''s Island Park, across the footbridge from East Harlem',
   'Private racquet club with indoor and outdoor tennis courts and padel courts.', 'PAID_OR_MEMBERSHIP',
   'Court fees or club membership. Book directly with the club.', true, false, 'https://www.sportimeny.com', 30),
  ('reserve-padel-upper-east-side', 'Reserve Padel Upper East Side', 'upper-east-side', 'Upper East Side',
   'Indoor padel club.', 'PAID_OR_MEMBERSHIP', 'Book and pay directly with the club.', true, false, null, 40),
  ('citypickle-wollman-rink', 'CityPickle at Wollman Rink', 'midtown', 'Wollman Rink, Central Park, near East 59th Street & Fifth Avenue',
   'Pickleball courts set up at Wollman Rink outside the skating season.', 'PAID_OR_MEMBERSHIP',
   'Court booking fees. Seasonal.', false, true, null, 50),
  ('carl-schurz-park', 'Carl Schurz Park', 'upper-east-side', 'East End Avenue at East 86th Street',
   'Neighbourhood park with outdoor courts used for pickleball.', 'FREE_PUBLIC', 'First come, first served.', false, false, null, 60),
  ('chelsea-piers-golf-club', 'Chelsea Piers Golf Club', 'chelsea', 'Pier 59, Hudson River Park at West 23rd Street',
   'Multi-level, all-weather driving range on the Hudson.', 'PAID_OR_MEMBERSHIP', 'Pay per session.', false, false, 'https://www.chelseapiers.com', 70),
  ('randalls-island-golf-center', 'Randall''s Island Golf Center', 'harlem', 'Randall''s Island Park',
   'Driving range and practice facilities.', 'PAID_OR_MEMBERSHIP', 'Pay per session.', false, false, null, 80),
  ('west-4th-street-courts', 'West 4th Street Courts', 'greenwich-village', 'Sixth Avenue at West 4th Street',
   'The Cage: fenced outdoor courts known for fast, competitive pickup games.', 'FREE_PUBLIC', 'First come, first served.', false, false, null, 90),
  ('holcombe-rucker-park', 'Holcombe Rucker Park', 'harlem', 'West 155th Street & Frederick Douglass Boulevard',
   'Historic outdoor courts, home of storied summer leagues.', 'FREE_PUBLIC', 'First come, first served outside league events.', false, false, null, 100),
  ('chelsea-waterside-park', 'Chelsea Waterside Park', 'chelsea', 'Eleventh Avenue at West 22nd Street',
   'Hudson River Park space with a turf field and outdoor basketball courts.', 'FREE_PUBLIC',
   'Courts are first come, first served. Organised field use may need a permit.', false, false, 'https://hudsonriverpark.org', 110),
  ('pier-40-fields', 'Pier 40 Fields', 'west-village', 'Pier 40, Hudson River Park at West Houston Street',
   'Large turf fields used for leagues and organised play.', 'PERMIT_OR_RESERVATION',
   'Field time is permitted through Hudson River Park.', false, false, 'https://hudsonriverpark.org', 120),
  ('randalls-island-fields', 'Randall''s Island Park Fields', 'harlem', 'Randall''s Island Park',
   'Dozens of grass and turf fields.', 'PERMIT_OR_RESERVATION', 'Field permits required for organised games.', false, false, null, 130),
  ('central-park-reservoir', 'Central Park Reservoir Loop', 'upper-east-side', 'Engineers'' Gate, East 90th Street & Fifth Avenue',
   'A 1.58-mile soft-surface loop around the Jacqueline Kennedy Onassis Reservoir.', 'FREE_PUBLIC', null, false, false, 'https://www.centralparknyc.org', 140),
  ('central-park-drive', 'Central Park Drive', 'upper-west-side', 'The full loop of Central Park''s drives',
   'A 6.1-mile car-free loop with rolling hills, popular for long runs and group rides.', 'FREE_PUBLIC', null, false, false, 'https://www.centralparknyc.org', 150),
  ('hudson-river-greenway', 'Hudson River Greenway', 'tribeca', 'Along the Hudson on Manhattan''s west side',
   'Waterfront path running most of the length of Manhattan.', 'FREE_PUBLIC', null, false, false, null, 160),
  ('east-river-esplanade', 'East River Esplanade', 'upper-east-side', 'Along the East River, Upper East Side to East Harlem',
   'Riverside path for easy runs.', 'FREE_PUBLIC', null, false, false, null, 170),
  ('asphalt-green-upper-east-side', 'Asphalt Green Upper East Side', 'upper-east-side', 'York Avenue at East 90th Street',
   'Nonprofit sports centre with an Olympic-size indoor pool.', 'PAID_OR_MEMBERSHIP', 'Membership or day pass.', true, false, 'https://www.asphaltgreen.org', 180),
  ('hamilton-fish-park-pool', 'Hamilton Fish Park Pool', 'lower-east-side', 'Pitt Street at East Houston Street',
   'Large outdoor public pool.', 'FREE_PUBLIC', 'Free in the summer season. Follow NYC Parks pool rules.', false, true, null, 190),
  ('tony-dapolito-recreation-center', 'Tony Dapolito Recreation Center', 'west-village', 'Clarkson Street at Seventh Avenue South',
   'NYC Parks recreation centre with indoor and outdoor pools.', 'PAID_OR_MEMBERSHIP', 'NYC Parks recreation centre membership.', true, false, null, 200),
  ('pier-25-volleyball', 'Pier 25 Sand Volleyball Courts', 'tribeca', 'Pier 25, Hudson River Park at North Moore Street',
   'Sand courts on the river used for leagues and open play.', 'PERMIT_OR_RESERVATION',
   'Leagues have priority. Open play when courts are free.', false, true, 'https://hudsonriverpark.org', 210),
  ('printing-house', 'Printing House', 'west-village', 'Hudson Street, West Village',
   'Private gym and squash club.', 'PAID_OR_MEMBERSHIP', 'Membership club.', true, false, null, 220),
  ('cityview-racquet-club', 'CityView Racquet Club', 'long-island-city', 'Long Island City, Queens',
   'Large squash club across the river from Midtown.', 'PAID_OR_MEMBERSHIP', 'Membership or court fees.', true, false, null, 230)
on conflict (slug) do nothing;

insert into public.venue_sports (venue_id, sport_id, note)
select v.id, s.id, x.note
from (values
  ('central-park-tennis-center', 'tennis', 'Clay and hard courts'),
  ('riverside-park-clay-courts', 'tennis', 'Clay courts'),
  ('sportime-randalls-island', 'tennis', 'Indoor and outdoor courts'),
  ('sportime-randalls-island', 'padel', null),
  ('reserve-padel-upper-east-side', 'padel', null),
  ('citypickle-wollman-rink', 'pickleball', 'Seasonal'),
  ('carl-schurz-park', 'pickleball', null),
  ('chelsea-piers-golf-club', 'golf', 'Driving range'),
  ('randalls-island-golf-center', 'golf', 'Driving range'),
  ('west-4th-street-courts', 'basketball', 'Pickup games'),
  ('holcombe-rucker-park', 'basketball', null),
  ('chelsea-waterside-park', 'basketball', null),
  ('chelsea-waterside-park', 'soccer', 'Turf field'),
  ('pier-40-fields', 'soccer', 'Turf fields'),
  ('randalls-island-fields', 'soccer', null),
  ('central-park-reservoir', 'running', '1.58-mile loop'),
  ('central-park-drive', 'running', '6.1-mile loop'),
  ('central-park-drive', 'cycling', 'Park loops'),
  ('hudson-river-greenway', 'running', null),
  ('hudson-river-greenway', 'cycling', 'Long, flat road rides'),
  ('east-river-esplanade', 'running', null),
  ('asphalt-green-upper-east-side', 'swimming', 'Olympic-size indoor pool'),
  ('hamilton-fish-park-pool', 'swimming', 'Outdoor, summer only'),
  ('tony-dapolito-recreation-center', 'swimming', 'Indoor and outdoor pools'),
  ('pier-25-volleyball', 'volleyball', 'Beach 2s and 4s'),
  ('printing-house', 'squash', null),
  ('cityview-racquet-club', 'squash', null)
) as x(venue, sport, note)
join public.venues v on v.slug = x.venue
join public.sports s on s.slug = x.sport
on conflict do nothing;
