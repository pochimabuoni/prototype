-- =============================================================================
-- POCHI MA BUONI — core schema
-- Normalized PostgreSQL schema for applications, membership, matching,
-- invitations, messaging, safety tooling and administration.
-- Row Level Security policies live in the following migration.
-- =============================================================================

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Enumerated types
-- ---------------------------------------------------------------------------
create type public.user_role as enum ('ADMIN', 'MEMBER', 'APPLICANT');
create type public.account_status as enum ('ACTIVE', 'SUSPENDED');
create type public.application_status as enum ('PENDING', 'APPROVED', 'REJECTED', 'WAITLISTED');
create type public.connection_status as enum ('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED');
create type public.invitation_status as enum ('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED', 'COMPLETED');
create type public.profile_visibility as enum ('MEMBERS', 'CONNECTIONS', 'HIDDEN');
create type public.time_block as enum ('EARLY_MORNING', 'MORNING', 'MIDDAY', 'AFTERNOON', 'EVENING');
create type public.report_reason as enum ('HARASSMENT', 'INAPPROPRIATE_CONTENT', 'SAFETY_CONCERN', 'SPAM', 'FAKE_PROFILE', 'NO_SHOW', 'OTHER');
create type public.report_status as enum ('OPEN', 'REVIEWING', 'RESOLVED', 'DISMISSED');
create type public.subscription_status as enum (
  'incomplete', 'incomplete_expired', 'trialing', 'active', 'past_due', 'canceled', 'unpaid', 'paused'
);
create type public.data_request_status as enum ('PENDING', 'COMPLETED');

-- Generic updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- users: one row per authenticated account (mirrors auth.users)
-- Role and account status are NEVER writable by the account owner.
-- ---------------------------------------------------------------------------
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  role public.user_role not null default 'APPLICANT',
  account_status public.account_status not null default 'ACTIVE',
  suspended_reason text,
  stripe_customer_id text unique,
  last_active_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index users_email_lower_idx on public.users (lower(email));
create trigger users_updated_at before update on public.users
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- sports: administrator-configurable catalogue.
-- skill_levels is ORDERED from least to most experienced; the array index is
-- used as a rank by the matching engine.
-- ---------------------------------------------------------------------------
create table public.sports (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{2,40}$'),
  name text not null check (char_length(name) between 2 and 60),
  skill_levels text[] not null check (cardinality(skill_levels) between 2 and 8),
  formats text[] not null check (cardinality(formats) between 1 and 10),
  is_active boolean not null default true,
  sort_order int not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger sports_updated_at before update on public.sports
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- referral_codes
-- ---------------------------------------------------------------------------
create table public.referral_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z0-9-]{4,32}$'),
  description text,
  owner_id uuid references public.users (id) on delete set null,
  created_by uuid references public.users (id) on delete set null,
  max_uses int check (max_uses is null or max_uses > 0),
  use_count int not null default 0 check (use_count >= 0),
  is_active boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- membership_applications
-- Submitted without an account; linked to a user by email when the applicant
-- signs in. Only administrators (via audited server actions) change status.
-- ---------------------------------------------------------------------------
create table public.membership_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users (id) on delete set null,
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  full_name text not null check (char_length(full_name) between 2 and 120),
  date_of_birth date not null,
  neighborhood text not null,
  occupation text check (occupation is null or char_length(occupation) <= 120),
  sports jsonb not null default '[]'::jsonb check (jsonb_typeof(sports) = 'array'),
  availability jsonb not null default '[]'::jsonb check (jsonb_typeof(availability) = 'array'),
  introduction text not null check (char_length(introduction) between 40 and 1200),
  motivation text not null check (char_length(motivation) between 40 and 1200),
  referral_code_id uuid references public.referral_codes (id) on delete set null,
  photo_path text,
  status public.application_status not null default 'PENDING',
  reviewed_by uuid references public.users (id) on delete set null,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index membership_applications_status_idx on public.membership_applications (status, created_at desc);
create index membership_applications_email_idx on public.membership_applications (lower(email));
create index membership_applications_user_idx on public.membership_applications (user_id);
-- At most one open (pending / waitlisted / approved) application per email.
create unique index membership_applications_one_open_per_email
  on public.membership_applications (lower(email))
  where status in ('PENDING', 'WAITLISTED', 'APPROVED');
create trigger membership_applications_updated_at before update on public.membership_applications
  for each row execute function public.set_updated_at();

-- Applicants must be 18+ at submission time. (A trigger rather than a CHECK,
-- because the rule depends on the current date.)
create or replace function public.enforce_applicant_age()
returns trigger
language plpgsql
as $$
begin
  if new.date_of_birth > (current_date - interval '18 years')::date then
    raise exception 'Applicants must be at least 18 years old' using errcode = '23514';
  end if;
  if new.date_of_birth < date '1900-01-01' then
    raise exception 'Invalid date of birth' using errcode = '23514';
  end if;
  return new;
end;
$$;
create trigger membership_applications_age
  before insert or update of date_of_birth on public.membership_applications
  for each row execute function public.enforce_applicant_age();

-- ---------------------------------------------------------------------------
-- member_profiles: what other members may see. Never contains email, DOB or
-- an exact location — neighbourhood only.
-- ---------------------------------------------------------------------------
create table public.member_profiles (
  user_id uuid primary key references public.users (id) on delete cascade,
  first_name text not null check (char_length(first_name) between 1 and 60),
  last_name text check (last_name is null or char_length(last_name) <= 60),
  show_last_name boolean not null default false,
  bio text check (bio is null or char_length(bio) <= 600),
  neighborhood text not null,
  occupation text check (occupation is null or char_length(occupation) <= 120),
  show_occupation boolean not null default true,
  photo_path text,
  visibility public.profile_visibility not null default 'MEMBERS',
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index member_profiles_neighborhood_idx on public.member_profiles (neighborhood);
create trigger member_profiles_updated_at before update on public.member_profiles
  for each row execute function public.set_updated_at();

create table public.member_sports (
  user_id uuid not null references public.users (id) on delete cascade,
  sport_id uuid not null references public.sports (id) on delete cascade,
  skill_level text not null,
  formats text[] not null default '{}',
  created_at timestamptz not null default now(),
  primary key (user_id, sport_id)
);
create index member_sports_sport_idx on public.member_sports (sport_id, skill_level);

-- Skill level and formats must belong to the sport's configured vocabulary.
create or replace function public.validate_member_sport()
returns trigger
language plpgsql
as $$
declare
  s public.sports;
begin
  select * into s from public.sports where id = new.sport_id;
  if not found then
    raise exception 'Unknown sport' using errcode = '23503';
  end if;
  if not (new.skill_level = any (s.skill_levels)) then
    raise exception 'Invalid skill level % for %', new.skill_level, s.name using errcode = '23514';
  end if;
  if not (new.formats <@ s.formats) then
    raise exception 'Invalid playing format for %', s.name using errcode = '23514';
  end if;
  return new;
end;
$$;
create trigger member_sports_validate before insert or update on public.member_sports
  for each row execute function public.validate_member_sport();

create table public.member_availability (
  user_id uuid not null references public.users (id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6), -- 0 = Monday
  time_block public.time_block not null,
  primary key (user_id, day_of_week, time_block)
);

-- ---------------------------------------------------------------------------
-- Billing. Written ONLY by the Stripe webhook (service role).
-- ---------------------------------------------------------------------------
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users (id) on delete cascade,
  stripe_customer_id text not null,
  stripe_subscription_id text not null unique,
  stripe_price_id text,
  status public.subscription_status not null,
  unit_amount int, -- cents
  currency text default 'usd',
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  canceled_at timestamptz,
  ended_at timestamptz,
  stripe_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index subscriptions_status_idx on public.subscriptions (status);
create trigger subscriptions_updated_at before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- Processed Stripe webhook events (idempotency ledger).
create table public.stripe_events (
  id text primary key,
  type text not null,
  received_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Connections (request-to-connect)
-- ---------------------------------------------------------------------------
create table public.connections (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.users (id) on delete cascade,
  addressee_id uuid not null references public.users (id) on delete cascade,
  status public.connection_status not null default 'PENDING',
  note text check (note is null or char_length(note) <= 300),
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (requester_id <> addressee_id)
);
-- One live connection row per unordered pair.
create unique index connections_pair_idx on public.connections (
  least(requester_id, addressee_id), greatest(requester_id, addressee_id)
) where status in ('PENDING', 'ACCEPTED');
create index connections_addressee_idx on public.connections (addressee_id, status);
create index connections_requester_idx on public.connections (requester_id, status);
create trigger connections_updated_at before update on public.connections
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Sports invitations. The platform never reserves venues.
-- ---------------------------------------------------------------------------
create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.users (id) on delete cascade,
  recipient_id uuid not null references public.users (id) on delete cascade,
  sport_id uuid not null references public.sports (id),
  proposed_date date not null,
  proposed_time time not null,
  location_note text not null check (char_length(location_note) between 2 and 160),
  message text check (message is null or char_length(message) <= 500),
  status public.invitation_status not null default 'PENDING',
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (sender_id <> recipient_id)
);
create index invitations_recipient_idx on public.invitations (recipient_id, status);
create index invitations_sender_idx on public.invitations (sender_id, status);
create trigger invitations_updated_at before update on public.invitations
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Messaging
-- ---------------------------------------------------------------------------
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  -- Ordered pair key so that two members share exactly one conversation.
  pair_key text not null unique,
  last_message_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.conversation_participants (
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  last_read_at timestamptz,
  joined_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);
create index conversation_participants_user_idx on public.conversation_participants (user_id);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.users (id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index messages_conversation_idx on public.messages (conversation_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Safety: blocks and reports
-- ---------------------------------------------------------------------------
create table public.blocks (
  blocker_id uuid not null references public.users (id) on delete cascade,
  blocked_id uuid not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
create index blocks_blocked_idx on public.blocks (blocked_id);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.users (id) on delete set null,
  reported_user_id uuid references public.users (id) on delete set null,
  message_id uuid references public.messages (id) on delete set null,
  invitation_id uuid references public.invitations (id) on delete set null,
  reason public.report_reason not null,
  details text check (details is null or char_length(details) <= 2000),
  status public.report_status not null default 'OPEN',
  reviewed_by uuid references public.users (id) on delete set null,
  resolution_note text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (reporter_id is null or reporter_id <> reported_user_id)
);
create index reports_status_idx on public.reports (status, created_at desc);
create trigger reports_updated_at before update on public.reports
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Operations
-- ---------------------------------------------------------------------------
create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.users (id) on delete set null,
  action text not null,
  target_type text not null,
  target_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_logs_created_idx on public.audit_logs (created_at desc);

create table public.data_export_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  status public.data_request_status not null default 'PENDING',
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

-- Key/value configuration editable by administrators (e.g. matching weights).
create table public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_by uuid references public.users (id) on delete set null,
  updated_at timestamptz not null default now()
);

-- Fixed-window rate limiter usable from serverless functions.
create table public.rate_limits (
  key text not null,
  window_start timestamptz not null,
  hits int not null default 0,
  primary key (key, window_start)
);

-- =============================================================================
-- Helper functions (SECURITY DEFINER, fixed search_path)
-- =============================================================================

create or replace function public.is_admin(uid uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.users
    where id = uid and role = 'ADMIN' and account_status = 'ACTIVE'
  );
$$;

-- Membership entitlement: approved MEMBER, not suspended, and a subscription
-- in good standing as last reported by a VERIFIED Stripe webhook.
-- past_due keeps access for a 3-day grace window after the period end while
-- Stripe retries the card; any other status revokes access.
create or replace function public.is_active_member(uid uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users u
    join public.subscriptions s on s.user_id = u.id
    where u.id = uid
      and u.role = 'MEMBER'
      and u.account_status = 'ACTIVE'
      and (
        s.status in ('active', 'trialing')
        or (s.status = 'past_due' and s.current_period_end > now() - interval '3 days')
      )
  );
$$;

-- Community participant: an active member, or an administrator.
create or replace function public.can_use_community(uid uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_active_member(uid) or public.is_admin(uid);
$$;

create or replace function public.is_blocked_between(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.blocks
    where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a)
  );
$$;

create or replace function public.are_connected(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.connections
    where status = 'ACCEPTED'
      and ((requester_id = a and addressee_id = b) or (requester_id = b and addressee_id = a))
  );
$$;

-- Can `viewer` see `target`'s member profile?
create or replace function public.can_view_member(viewer uuid, target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    viewer = target
    or public.is_admin(viewer)
    or (
      public.is_active_member(viewer)
      and public.is_active_member(target)
      and not public.is_blocked_between(viewer, target)
      and exists (
        select 1 from public.member_profiles p
        where p.user_id = target
          and p.completed_at is not null
          and (
            p.visibility = 'MEMBERS'
            -- Existing relationships survive narrower visibility settings, so
            -- members can still see who they're connected to or dealing with.
            or exists (
              select 1 from public.connections c
              where c.status in ('PENDING', 'ACCEPTED')
                and ((c.requester_id = viewer and c.addressee_id = target)
                  or (c.requester_id = target and c.addressee_id = viewer))
            )
            or exists (
              select 1 from public.invitations i
              where i.status in ('PENDING', 'ACCEPTED')
                and ((i.sender_id = viewer and i.recipient_id = target)
                  or (i.sender_id = target and i.recipient_id = viewer))
            )
          )
      )
    );
$$;

create or replace function public.is_conversation_participant(cid uuid, uid uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.conversation_participants
    where conversation_id = cid and user_id = uid
  );
$$;

-- A member may post in a conversation only if they participate, both sides are
-- active members, they are connected, and neither has blocked the other.
create or replace function public.can_message(cid uuid, uid uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_conversation_participant(cid, uid)
    and public.is_active_member(uid)
    and exists (
      select 1 from public.conversation_participants other
      where other.conversation_id = cid
        and other.user_id <> uid
        and public.is_active_member(other.user_id)
        and public.are_connected(uid, other.user_id)
        and not public.is_blocked_between(uid, other.user_id)
    );
$$;

-- =============================================================================
-- Account lifecycle
-- =============================================================================

-- Create a public.users row for every new auth user and link any application
-- submitted with the same email. Approved applicants become MEMBER (pending
-- subscription activation).
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  approved boolean;
begin
  insert into public.users (id, email)
  values (new.id, lower(new.email))
  on conflict (id) do nothing;

  update public.membership_applications
     set user_id = new.id
   where lower(email) = lower(new.email) and user_id is null;

  select exists (
    select 1 from public.membership_applications
    where user_id = new.id and status = 'APPROVED'
  ) into approved;

  if approved then
    update public.users set role = 'MEMBER' where id = new.id and role = 'APPLICANT';
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- =============================================================================
-- State-transition guards (enforced in the database, not just in the app)
-- =============================================================================

create or replace function public.guard_connection_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
begin
  -- Service role / migrations (no JWT) are trusted.
  if actor is null then
    return new;
  end if;
  if new.requester_id <> old.requester_id or new.addressee_id <> old.addressee_id
     or new.created_at <> old.created_at then
    raise exception 'Connection participants are immutable' using errcode = '42501';
  end if;
  if new.status = old.status then
    if new.note is distinct from old.note then
      raise exception 'Connection note is immutable' using errcode = '42501';
    end if;
    return new;
  end if;
  if old.status = 'PENDING' and new.status in ('ACCEPTED', 'DECLINED') and actor = old.addressee_id then
    new.responded_at := now();
    return new;
  end if;
  if old.status = 'PENDING' and new.status = 'CANCELLED' and actor = old.requester_id then
    return new;
  end if;
  if old.status = 'ACCEPTED' and new.status = 'CANCELLED' and actor in (old.requester_id, old.addressee_id) then
    return new;
  end if;
  raise exception 'Invalid connection transition % -> %', old.status, new.status using errcode = '42501';
end;
$$;
create trigger connections_guard before update on public.connections
  for each row execute function public.guard_connection_update();

create or replace function public.guard_invitation_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
begin
  if actor is null then
    return new;
  end if;
  if new.sender_id <> old.sender_id or new.recipient_id <> old.recipient_id
     or new.sport_id <> old.sport_id or new.proposed_date <> old.proposed_date
     or new.proposed_time <> old.proposed_time or new.location_note <> old.location_note
     or new.message is distinct from old.message then
    raise exception 'Invitation details are immutable once sent' using errcode = '42501';
  end if;
  if new.status = old.status then
    return new;
  end if;
  if old.status = 'PENDING' and new.status in ('ACCEPTED', 'DECLINED') and actor = old.recipient_id then
    new.responded_at := now();
    return new;
  end if;
  if old.status in ('PENDING', 'ACCEPTED') and new.status = 'CANCELLED' and actor in (old.sender_id, old.recipient_id) then
    return new;
  end if;
  if old.status = 'ACCEPTED' and new.status = 'COMPLETED' and actor in (old.sender_id, old.recipient_id)
     and (old.proposed_date + old.proposed_time) <= (now() at time zone 'America/New_York') then
    return new;
  end if;
  raise exception 'Invalid invitation transition % -> %', old.status, new.status using errcode = '42501';
end;
$$;
create trigger invitations_guard before update on public.invitations
  for each row execute function public.guard_invitation_update();

-- Members can edit their own profile but never set completed_at directly back
-- to null once complete through the API, nor change ownership.
create or replace function public.guard_profile_update()
returns trigger
language plpgsql
as $$
begin
  if new.user_id <> old.user_id then
    raise exception 'Profile owner is immutable' using errcode = '42501';
  end if;
  return new;
end;
$$;
create trigger member_profiles_guard before update on public.member_profiles
  for each row execute function public.guard_profile_update();

-- Keep conversations.last_message_at fresh for ordering and unread badges.
create or replace function public.touch_conversation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations set last_message_at = new.created_at where id = new.conversation_id;
  update public.conversation_participants set last_read_at = new.created_at
   where conversation_id = new.conversation_id and user_id = new.sender_id;
  return new;
end;
$$;
create trigger messages_touch_conversation after insert on public.messages
  for each row execute function public.touch_conversation();

-- =============================================================================
-- RPCs callable by authenticated members
-- =============================================================================

-- Returns the conversation shared with `other`, creating it if necessary.
create or replace function public.get_or_create_conversation(other uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  key text;
  cid uuid;
begin
  if me is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;
  if me = other then
    raise exception 'Cannot message yourself' using errcode = '22023';
  end if;
  if not public.is_active_member(me) or not public.is_active_member(other) then
    raise exception 'Messaging requires an active membership' using errcode = '42501';
  end if;
  if public.is_blocked_between(me, other) then
    raise exception 'Messaging unavailable' using errcode = '42501';
  end if;
  if not public.are_connected(me, other) then
    raise exception 'You can message members once connected' using errcode = '42501';
  end if;

  key := least(me, other)::text || ':' || greatest(me, other)::text;
  select id into cid from public.conversations where pair_key = key;
  if cid is null then
    insert into public.conversations (pair_key) values (key)
    on conflict (pair_key) do update set pair_key = excluded.pair_key
    returning id into cid;
    insert into public.conversation_participants (conversation_id, user_id)
    values (cid, me), (cid, other)
    on conflict do nothing;
  end if;
  return cid;
end;
$$;

-- Unread counts per conversation for the current user.
create or replace function public.my_unread_counts()
returns table (conversation_id uuid, unread bigint)
language sql
stable
security definer
set search_path = public
as $$
  select cp.conversation_id, count(m.id)
  from public.conversation_participants cp
  join public.messages m
    on m.conversation_id = cp.conversation_id
   and m.sender_id <> cp.user_id
   and (cp.last_read_at is null or m.created_at > cp.last_read_at)
  where cp.user_id = auth.uid()
  group by cp.conversation_id;
$$;

-- Fixed-window rate limiter. Returns TRUE when the call is allowed.
create or replace function public.rate_limit_hit(p_key text, p_limit int, p_window_seconds int)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  win timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  current_hits int;
begin
  insert into public.rate_limits as rl (key, window_start, hits)
  values (p_key, win, 1)
  on conflict (key, window_start) do update set hits = rl.hits + 1
  returning hits into current_hits;

  -- Opportunistic cleanup of stale windows.
  if random() < 0.01 then
    delete from public.rate_limits where window_start < now() - interval '1 day';
  end if;

  return current_hits <= p_limit;
end;
$$;

-- Atomically consume a referral code. Returns its id, or NULL if unusable.
create or replace function public.consume_referral_code(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  rid uuid;
begin
  update public.referral_codes
     set use_count = use_count + 1
   where code = upper(btrim(p_code))
     and is_active
     and (expires_at is null or expires_at > now())
     and (max_uses is null or use_count < max_uses)
  returning id into rid;
  return rid;
end;
$$;
