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

-- NYC master directory, November 2026 ----------------------------------------
-- Sports clubs and courts from the consolidated NYC directory. Informational
-- only: confirm access, operation and fees with each venue before launch.
-- Private clubs are listed for members' reference; Pochi Ma Buoni cannot
-- arrange access to them. Climbing gyms and skating rinks are left out until
-- those sports exist.
update public.venues
set location = '43-34 32nd Place, Long Island City, Queens',
    description = 'Large racquet club across the river from Midtown, with tennis, padel and squash.'
where slug = 'cityview-racquet-club' and location = 'Long Island City, Queens';

insert into public.venues (slug, name, neighborhood, location, description, access, access_note, indoor, seasonal, website, sort_order) values
  ('racquet-and-tennis-club', 'Racquet & Tennis Club', 'midtown-east', '370 Park Avenue at East 53rd Street',
   'Historic private club with courts for squash, court tennis and racquets.', 'PAID_OR_MEMBERSHIP',
   'Private club for members and their guests. Membership is by sponsorship or nomination.', true, false, null, 300),
  ('new-york-athletic-club', 'New York Athletic Club', 'midtown', '180 Central Park South',
   'Private athletic club with a pool, squash courts, a basketball court and fitness floors.', 'PAID_OR_MEMBERSHIP',
   'Private club for members and their guests. Membership is by sponsorship or nomination.', true, false, null, 310),
  ('chelsea-piers-sports-fitness', 'Chelsea Piers Sports & Fitness', 'chelsea', 'Pier 60, Hudson River Park at West 20th Street',
   'Large members'' club on the pier with a pool, basketball and fitness floors.', 'PAID_OR_MEMBERSHIP',
   'Membership.', true, false, null, 320),
  ('chelsea-piers-field-house', 'Chelsea Piers Field House', 'chelsea', 'Pier 62, Hudson River Park',
   'Indoor turf fields and basketball courts, mostly used for leagues and programmes.', 'PAID_OR_MEMBERSHIP',
   'Programmes, leagues and court or field booking.', true, false, null, 330),
  ('equinox-hudson-yards', 'Equinox Hudson Yards', 'hudson-yards', '32 Hudson Yards',
   'Flagship Equinox club with a pool and extensive training floors.', 'PAID_OR_MEMBERSHIP',
   'Equinox membership.', true, false, null, 340),
  ('manhattan-plaza-racquet-club', 'Manhattan Plaza Racquet Club', 'midtown', '450 West 43rd Street',
   'Indoor tennis club in Hell''s Kitchen.', 'PAID_OR_MEMBERSHIP',
   'Court booking or membership.', true, false, null, 350),
  ('sutton-east-tennis', 'Sutton East Tennis', 'midtown-east', '488 East 60th Street',
   'Indoor tennis on the East Side by the Queensboro Bridge.', 'PAID_OR_MEMBERSHIP',
   'Paid court booking.', true, false, null, 360),
  ('vanderbilt-tennis-club', 'Vanderbilt Tennis Club', 'midtown-east', 'Grand Central Terminal',
   'Indoor tennis courts tucked inside Grand Central Terminal.', 'PAID_OR_MEMBERSHIP',
   'Paid court booking.', true, false, null, 370),
  ('roosevelt-island-racquet-club', 'Roosevelt Island Racquet Club', 'roosevelt-island', '281 Main Street, Roosevelt Island',
   'Indoor tennis club a short tram ride from Midtown.', 'PAID_OR_MEMBERSHIP',
   'Paid court booking.', true, false, null, 380),
  ('riverside-park-119th-street-courts', 'Riverside Park Courts at West 119th Street', 'morningside-heights', 'Riverside Park at West 119th Street',
   'Public tennis courts by the Hudson, north of the 96th Street clay courts.', 'PERMIT_OR_RESERVATION',
   'NYC Parks tennis permit or single-play ticket.', false, true, null, 390),
  ('fort-washington-park-tennis', 'Fort Washington Park Tennis Courts', 'washington-heights', 'Fort Washington Park near West 170th Street',
   'Public courts along the river below the George Washington Bridge.', 'PERMIT_OR_RESERVATION',
   'NYC Parks tennis permit or single-play ticket.', false, true, null, 400),
  ('inwood-hill-park-tennis', 'Inwood Hill Park Tennis Courts', 'inwood', 'West 207th Street & Seaman Avenue',
   'Public courts at the northern tip of Manhattan.', 'PERMIT_OR_RESERVATION',
   'NYC Parks tennis permit or single-play ticket.', false, true, null, 410),
  ('hudson-river-park-tennis', 'Hudson River Park Tennis Courts', 'west-village', 'Near Pier 40, Hudson River Park',
   'Public courts on the west side waterfront.', 'PERMIT_OR_RESERVATION',
   'Public courts. Check Hudson River Park''s current rules before you play.', false, true, null, 420),
  ('citypickle-times-square', 'CityPickle Times Square', 'midtown', '1501 Broadway, 8th floor',
   'Indoor pickleball club above Times Square.', 'PAID_OR_MEMBERSHIP',
   'Book and pay per court.', true, false, null, 430),
  ('asphalt-green-battery-park-city', 'Asphalt Green Battery Park City', 'battery-park-city', '212 North End Avenue',
   'Nonprofit sports centre with an indoor pool and fitness floors.', 'PAID_OR_MEMBERSHIP',
   'Membership or programmes.', true, false, null, 440),
  ('manhattan-youth-downtown-community-center', 'Manhattan Youth Downtown Community Center', 'tribeca', '120 Warren Street',
   'Community centre in Tribeca with an indoor pool.', 'PAID_OR_MEMBERSHIP',
   'Programmes or membership.', true, false, null, 450),
  ('92ny', '92NY', 'upper-east-side', '1395 Lexington Avenue at East 92nd Street',
   'Cultural and community centre with a pool, gym and fitness floors.', 'PAID_OR_MEMBERSHIP',
   'Membership or programmes.', true, false, null, 460),
  ('west-side-ymca', 'West Side YMCA', 'upper-west-side', '5 West 63rd Street',
   'YMCA by Central Park with indoor pools.', 'PAID_OR_MEMBERSHIP',
   'YMCA membership.', true, false, null, 470),
  ('nicol-nyc', 'Nicol NYC', 'midtown', '476 West 47th Street',
   'Squash courts with booking and coaching programmes.', 'PAID_OR_MEMBERSHIP',
   'Court booking or programmes.', true, false, null, 480),
  ('riverbank-state-park', 'Riverbank State Park', 'harlem', '679 Riverside Drive at West 145th Street',
   'State park on the Hudson with an indoor pool, a running track and sports fields.', 'PAID_OR_MEMBERSHIP',
   'Free to enter. Pools, fields and programmes may charge a fee.', false, false, null, 490),
  ('five-iron-golf', 'Five Iron Golf', 'midtown', 'Several locations across Manhattan',
   'Indoor golf simulators with food and drink, good for groups.', 'PAID_OR_MEMBERSHIP',
   'Book a simulator bay.', true, false, null, 500),
  ('gansevoort-peninsula', 'Gansevoort Peninsula', 'west-village', 'Gansevoort Street, Hudson River Park',
   'Hudson River Park''s newest space, with a sports field by the water.', 'PERMIT_OR_RESERVATION',
   'Field use may need a Hudson River Park permit.', false, false, null, 510),
  ('west-side-tennis-club', 'The West Side Tennis Club', 'queens-east', '1 Tennis Place, Forest Hills, Queens',
   'Historic private club in Forest Hills, the original home of the US Open.', 'PAID_OR_MEMBERSHIP',
   'Private club for members and their guests. Membership is by sponsorship or nomination.', false, false, null, 520),
  ('heights-casino', 'The Heights Casino', 'brooklyn-heights', '75 Montague Street, Brooklyn Heights',
   'Private club in Brooklyn Heights with squash and indoor tennis.', 'PAID_OR_MEMBERSHIP',
   'Private club for members and their guests. Membership is by sponsorship or nomination.', true, false, null, 530),
  ('park-slope-armory-ymca', 'Park Slope Armory YMCA', 'park-slope', '361 15th Street, Park Slope',
   'YMCA in a former armory with an indoor track and fitness floors.', 'PAID_OR_MEMBERSHIP',
   'YMCA membership or programmes.', true, false, null, 540),
  ('court-16-downtown-brooklyn', 'Court 16 Downtown Brooklyn', 'downtown-brooklyn', '445 Albee Square West',
   'Indoor tennis and pickleball club with programmes and open booking.', 'PAID_OR_MEMBERSHIP',
   'Court booking or programmes.', true, false, null, 550),
  ('court-16-long-island-city', 'Court 16 Long Island City', 'long-island-city', '13-06 Queens Plaza South',
   'Indoor tennis and pickleball club one stop from Midtown.', 'PAID_OR_MEMBERSHIP',
   'Court booking or programmes.', true, false, null, 560),
  ('padel-haus-williamsburg', 'Padel Haus Williamsburg', 'williamsburg', 'Williamsburg, Brooklyn',
   'Padel club in Williamsburg.', 'PAID_OR_MEMBERSHIP',
   'Book and pay per court.', true, false, null, 570),
  ('padel-haus-greenpoint', 'Padel Haus Greenpoint', 'williamsburg', 'Greenpoint, Brooklyn',
   'Padel club in Greenpoint.', 'PAID_OR_MEMBERSHIP',
   'Book and pay per court.', true, false, null, 580),
  ('mccarren-tennis-center', 'McCarren Park Tennis Center', 'williamsburg', 'McCarren Park at North 13th Street',
   'Public courts in McCarren Park, bookable for indoor play in winter.', 'PERMIT_OR_RESERVATION',
   'NYC Parks permit in season, paid booking in winter.', false, false, null, 590),
  ('prospect-park-tennis-center', 'Prospect Park Tennis Center', 'park-slope', 'Parkside Avenue, Prospect Park',
   'Public tennis centre in Prospect Park, bookable year round.', 'PERMIT_OR_RESERVATION',
   'NYC Parks permit or paid booking.', false, false, null, 600),
  ('marine-park', 'Marine Park', 'south-brooklyn', 'Fillmore Avenue & Stuart Street, Marine Park',
   'Large Brooklyn park with tennis courts and sports fields.', 'PERMIT_OR_RESERVATION',
   'NYC Parks tennis permit. Field permits for organised games.', false, false, null, 610),
  ('usta-billie-jean-king-national-tennis-center', 'USTA Billie Jean King National Tennis Center', 'queens-east', 'Flushing Meadows Corona Park, Queens',
   'Home of the US Open, with indoor and outdoor courts to book outside the tournament.', 'PAID_OR_MEMBERSHIP',
   'Paid court booking and programmes.', true, false, null, 620),
  ('cunningham-tennis-center', 'Cunningham Tennis Center', 'queens-east', '196-00 Union Turnpike, Queens',
   'Public tennis centre in eastern Queens.', 'PERMIT_OR_RESERVATION',
   'NYC Parks permit or paid booking.', false, false, null, 630),
  ('alley-pond-tennis-center', 'Alley Pond Tennis Center', 'queens-east', '79-20 Winchester Boulevard, Queens',
   'Tennis centre in Alley Pond Park.', 'PAID_OR_MEMBERSHIP',
   'Paid court booking.', false, false, null, 640),
  ('stadium-tennis-center', 'Stadium Tennis Center', 'bronx', '725 Gateway Center Boulevard, the Bronx',
   'Tennis centre by Yankee Stadium with tennis and pickleball courts.', 'PAID_OR_MEMBERSHIP',
   'Paid court booking.', true, false, null, 650),
  ('cary-leeds-center', 'Cary Leeds Center', 'bronx', 'Crotona Park, the Bronx',
   'Nonprofit tennis centre in Crotona Park.', 'PAID_OR_MEMBERSHIP',
   'Programmes and court booking.', false, false, null, 660),
  ('walker-park-tennis', 'Walker Park', 'staten-island', 'Walker Park, Staten Island',
   'Public tennis courts on Staten Island''s North Shore.', 'PERMIT_OR_RESERVATION',
   'NYC Parks tennis permit or single-play ticket.', false, true, null, 670),
  ('dodge-ymca', 'Dodge YMCA', 'downtown-brooklyn', '225 Atlantic Avenue, Brooklyn',
   'YMCA in Boerum Hill with an indoor pool.', 'PAID_OR_MEMBERSHIP',
   'YMCA membership.', true, false, null, 680),
  ('ymca-flushing', 'Flushing YMCA', 'queens-east', '138-46 Northern Boulevard, Flushing',
   'YMCA in Flushing with an indoor pool.', 'PAID_OR_MEMBERSHIP',
   'YMCA membership.', true, false, null, 690),
  ('chelsea-piers-fitness-brooklyn', 'Chelsea Piers Fitness Brooklyn', 'downtown-brooklyn', '265 Schermerhorn Street',
   'Chelsea Piers club in Downtown Brooklyn with a pool.', 'PAID_OR_MEMBERSHIP',
   'Membership.', true, false, null, 700),
  ('flushing-meadows-aquatic-center', 'Flushing Meadows Corona Park Aquatic Center', 'queens-east', '131-04 Meridian Road, Flushing Meadows Corona Park',
   'Large indoor public pool run by NYC Parks.', 'PAID_OR_MEMBERSHIP',
   'NYC Parks recreation centre membership.', true, false, null, 710),
  ('van-cortlandt-golf-course', 'Van Cortlandt Golf Course', 'bronx', 'Van Cortlandt Park, the Bronx',
   'The oldest public golf course in the United States.', 'PERMIT_OR_RESERVATION',
   'Book NYC public tee times. Green fees apply.', false, false, null, 720),
  ('pelham-bay-split-rock-golf', 'Pelham Bay & Split Rock Golf Courses', 'bronx', '870 Shore Road, Pelham Bay Park',
   'Two public courses side by side in Pelham Bay Park.', 'PERMIT_OR_RESERVATION',
   'Book NYC public tee times. Green fees apply.', false, false, null, 730),
  ('dyker-beach-golf-course', 'Dyker Beach Golf Course', 'south-brooklyn', '1030 86th Street, Brooklyn',
   'Public course in southwest Brooklyn.', 'PERMIT_OR_RESERVATION',
   'Book NYC public tee times. Green fees apply.', false, false, null, 740),
  ('forest-park-golf-course', 'Forest Park Golf Course', 'queens-east', '101 Forest Park Drive, Queens',
   'Public course in Forest Park.', 'PERMIT_OR_RESERVATION',
   'Book NYC public tee times. Green fees apply.', false, false, null, 750),
  ('silver-lake-golf-course', 'Silver Lake Golf Course', 'staten-island', '915 Victory Boulevard, Staten Island',
   'Public course in Silver Lake Park.', 'PERMIT_OR_RESERVATION',
   'Book NYC public tee times. Green fees apply.', false, false, null, 760),
  ('brooklyn-bridge-park-piers', 'Brooklyn Bridge Park, Piers 2 and 5', 'brooklyn-heights', 'Piers 2 and 5, Brooklyn Bridge Park',
   'Waterfront courts and turf fields facing Lower Manhattan.', 'PERMIT_OR_RESERVATION',
   'Courts are mostly first come, first served. Fields need a permit.', false, false, null, 770),
  ('van-cortlandt-park', 'Van Cortlandt Park', 'bronx', 'Van Cortlandt Park, the Bronx',
   'Huge park with a famous cross-country course and soccer fields.', 'FREE_PUBLIC',
   'Free to run. Field permits for organised games.', false, false, null, 780),
  ('pelham-bay-park', 'Pelham Bay Park', 'bronx', 'Pelham Bay Park, the Bronx',
   'The city''s largest park, with fields, tennis courts and long running routes.', 'FREE_PUBLIC',
   'Free to use. NYC Parks permits for tennis and organised games.', false, false, null, 790),
  ('flushing-meadows-corona-park', 'Flushing Meadows Corona Park', 'queens-east', 'Flushing Meadows Corona Park, Queens',
   'Big Queens park with soccer and cricket fields and long, flat running loops.', 'FREE_PUBLIC',
   'Free to use. Field permits for organised games.', false, false, null, 800),
  ('ocean-breeze-athletic-complex', 'Ocean Breeze Athletic Complex', 'staten-island', '625 Father Capodanno Boulevard, Staten Island',
   'NYC Parks indoor track and field centre.', 'PERMIT_OR_RESERVATION',
   'Open sessions and programmes. Check the NYC Parks schedule.', true, false, null, 810)
on conflict (slug) do nothing;

insert into public.venue_sports (venue_id, sport_id, note)
select v.id, s.id, x.note
from (values
  ('racquet-and-tennis-club', 'squash', 'Also court tennis and racquets'),
  ('new-york-athletic-club', 'swimming', null),
  ('new-york-athletic-club', 'squash', null),
  ('new-york-athletic-club', 'basketball', null),
  ('chelsea-piers-sports-fitness', 'swimming', null),
  ('chelsea-piers-sports-fitness', 'basketball', null),
  ('chelsea-piers-field-house', 'soccer', 'Indoor turf'),
  ('chelsea-piers-field-house', 'basketball', null),
  ('equinox-hudson-yards', 'swimming', null),
  ('manhattan-plaza-racquet-club', 'tennis', 'Indoor courts'),
  ('sutton-east-tennis', 'tennis', 'Indoor courts'),
  ('vanderbilt-tennis-club', 'tennis', 'Indoor courts'),
  ('roosevelt-island-racquet-club', 'tennis', 'Indoor courts'),
  ('riverside-park-119th-street-courts', 'tennis', null),
  ('fort-washington-park-tennis', 'tennis', null),
  ('inwood-hill-park-tennis', 'tennis', null),
  ('hudson-river-park-tennis', 'tennis', null),
  ('citypickle-times-square', 'pickleball', 'Indoor courts'),
  ('asphalt-green-battery-park-city', 'swimming', null),
  ('manhattan-youth-downtown-community-center', 'swimming', null),
  ('92ny', 'swimming', null),
  ('92ny', 'basketball', null),
  ('west-side-ymca', 'swimming', null),
  ('nicol-nyc', 'squash', null),
  ('riverbank-state-park', 'swimming', 'Indoor pool'),
  ('riverbank-state-park', 'running', 'Running track'),
  ('riverbank-state-park', 'soccer', null),
  ('five-iron-golf', 'golf', 'Simulators'),
  ('gansevoort-peninsula', 'soccer', null),
  ('west-side-tennis-club', 'tennis', null),
  ('heights-casino', 'squash', null),
  ('heights-casino', 'tennis', null),
  ('park-slope-armory-ymca', 'running', 'Indoor track'),
  ('court-16-downtown-brooklyn', 'tennis', null),
  ('court-16-downtown-brooklyn', 'pickleball', null),
  ('court-16-long-island-city', 'tennis', null),
  ('court-16-long-island-city', 'pickleball', null),
  ('padel-haus-williamsburg', 'padel', null),
  ('padel-haus-greenpoint', 'padel', null),
  ('mccarren-tennis-center', 'tennis', null),
  ('prospect-park-tennis-center', 'tennis', null),
  ('marine-park', 'tennis', null),
  ('marine-park', 'soccer', null),
  ('usta-billie-jean-king-national-tennis-center', 'tennis', 'Indoor and outdoor courts'),
  ('cunningham-tennis-center', 'tennis', null),
  ('alley-pond-tennis-center', 'tennis', null),
  ('stadium-tennis-center', 'tennis', null),
  ('stadium-tennis-center', 'pickleball', null),
  ('cary-leeds-center', 'tennis', null),
  ('walker-park-tennis', 'tennis', null),
  ('dodge-ymca', 'swimming', null),
  ('ymca-flushing', 'swimming', null),
  ('chelsea-piers-fitness-brooklyn', 'swimming', null),
  ('flushing-meadows-aquatic-center', 'swimming', 'Indoor pool'),
  ('van-cortlandt-golf-course', 'golf', '18 holes'),
  ('pelham-bay-split-rock-golf', 'golf', 'Two 18-hole courses'),
  ('dyker-beach-golf-course', 'golf', '18 holes'),
  ('forest-park-golf-course', 'golf', '18 holes'),
  ('silver-lake-golf-course', 'golf', '18 holes'),
  ('brooklyn-bridge-park-piers', 'basketball', null),
  ('brooklyn-bridge-park-piers', 'soccer', 'Turf fields'),
  ('brooklyn-bridge-park-piers', 'volleyball', null),
  ('van-cortlandt-park', 'running', 'Cross-country trails'),
  ('van-cortlandt-park', 'soccer', null),
  ('pelham-bay-park', 'running', null),
  ('pelham-bay-park', 'tennis', null),
  ('pelham-bay-park', 'soccer', null),
  ('flushing-meadows-corona-park', 'running', null),
  ('flushing-meadows-corona-park', 'soccer', null),
  ('ocean-breeze-athletic-complex', 'running', 'Indoor track'),
  ('cityview-racquet-club', 'tennis', null),
  ('cityview-racquet-club', 'padel', null),
  ('sportime-randalls-island', 'pickleball', null),
  ('asphalt-green-upper-east-side', 'soccer', 'Turf field'),
  ('randalls-island-fields', 'running', 'Track')
) as x(venue, sport, note)
join public.venues v on v.slug = x.venue
join public.sports s on s.slug = x.sport
on conflict do nothing;
