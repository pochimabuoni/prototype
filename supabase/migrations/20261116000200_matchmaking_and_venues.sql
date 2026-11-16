-- =============================================================================
-- Matchmaking preferences (age range, play style, group size), group
-- invitations, and the venue directory.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Private member data: date of birth.
-- Kept out of member_profiles so that no member-facing grant can ever expose
-- it. Only the service role and SECURITY DEFINER helpers read this table.
-- ---------------------------------------------------------------------------
create table public.member_private (
  user_id uuid primary key references public.users (id) on delete cascade,
  date_of_birth date not null check (date_of_birth >= date '1900-01-01'),
  updated_at timestamptz not null default now()
);
alter table public.member_private enable row level security;
revoke all on public.member_private from anon, authenticated;

-- Copy the date of birth from the member's approved application.
create or replace function public.sync_member_birth_date()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  dob date;
begin
  select a.date_of_birth into dob
  from public.membership_applications a
  where a.user_id = new.user_id and a.status = 'APPROVED'
  order by a.reviewed_at desc nulls last, a.created_at desc
  limit 1;
  if dob is not null then
    insert into public.member_private (user_id, date_of_birth)
    values (new.user_id, dob)
    on conflict (user_id) do nothing;
  end if;
  return new;
end;
$$;

create trigger member_profiles_sync_birth_date
  after insert on public.member_profiles
  for each row execute function public.sync_member_birth_date();

insert into public.member_private (user_id, date_of_birth)
select distinct on (a.user_id) a.user_id, a.date_of_birth
from public.membership_applications a
join public.member_profiles p on p.user_id = a.user_id
where a.status = 'APPROVED'
order by a.user_id, a.reviewed_at desc nulls last
on conflict (user_id) do nothing;

-- ---------------------------------------------------------------------------
-- Matchmaking preferences on the profile (all member-chosen).
-- ---------------------------------------------------------------------------
alter table public.member_profiles
  add column show_age boolean not null default true,
  add column partner_age_min smallint check (partner_age_min is null or partner_age_min between 18 and 99),
  add column partner_age_max smallint check (partner_age_max is null or partner_age_max between 18 and 99),
  add column play_styles text[] not null default array['one_on_one', 'small_group']::text[],
  add constraint member_profiles_age_range_order check (
    partner_age_min is null or partner_age_max is null or partner_age_min <= partner_age_max
  ),
  add constraint member_profiles_play_styles_valid check (
    cardinality(play_styles) between 1 and 3
    and play_styles <@ array['one_on_one', 'small_group', 'large_group']::text[]
  );

create or replace function public.age_on(dob date, on_date date default current_date)
returns int
language sql
immutable
as $$
  select extract(year from age(on_date, dob))::int
$$;

-- Ages and two-way age-preference compatibility for the members the caller
-- can see. A member's age is returned only when they show it (or it's the
-- caller's own). Compatibility uses real ages without revealing them, so
-- hiding your age never sidesteps someone else's preference.
create or replace function public.member_age_info(p_ids uuid[])
returns table (user_id uuid, age int, i_accept boolean, they_accept boolean)
language sql
stable
security definer
set search_path = public
as $$
  with me as (
    select p.partner_age_min as mn, p.partner_age_max as mx,
           public.age_on(mp.date_of_birth, (now() at time zone 'America/New_York')::date) as age
    from public.member_profiles p
    left join public.member_private mp on mp.user_id = p.user_id
    where p.user_id = auth.uid()
  )
  select
    t.user_id,
    case when t.user_id = auth.uid() or t.show_age then ta.age end,
    -- the caller's preference about the target (unknown age never excludes)
    (ta.age is null or ((me.mn is null or ta.age >= me.mn) and (me.mx is null or ta.age <= me.mx))),
    -- the target's preference about the caller
    (me.age is null or ((t.partner_age_min is null or me.age >= t.partner_age_min)
                        and (t.partner_age_max is null or me.age <= t.partner_age_max)))
  from public.member_profiles t
  left join public.member_private tp on tp.user_id = t.user_id
  cross join lateral (
    select public.age_on(tp.date_of_birth, (now() at time zone 'America/New_York')::date) as age
  ) ta
  left join me on true
  where t.user_id = any (p_ids)
    and public.can_view_member(auth.uid(), t.user_id);
$$;

revoke all on function public.member_age_info(uuid[]) from public, anon;
grant execute on function public.member_age_info(uuid[]) to authenticated;
revoke all on function public.sync_member_birth_date() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Group invitations: one invitation row per invitee, linked by group_id.
-- ---------------------------------------------------------------------------
alter table public.invitations add column group_id uuid;
create index invitations_group_idx on public.invitations (group_id) where group_id is not null;

-- ---------------------------------------------------------------------------
-- Venue directory. Informational only: Pochi Ma Buoni does not own, operate,
-- manage or book any of these venues.
-- ---------------------------------------------------------------------------
create type public.venue_access as enum ('FREE_PUBLIC', 'PERMIT_OR_RESERVATION', 'PAID_OR_MEMBERSHIP');

create table public.venues (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{2,80}$'),
  name text not null check (char_length(name) between 2 and 120),
  neighborhood text not null,
  location text not null check (char_length(location) between 2 and 200),
  description text check (description is null or char_length(description) <= 600),
  access public.venue_access not null,
  access_note text check (access_note is null or char_length(access_note) <= 300),
  indoor boolean not null default false,
  seasonal boolean not null default false,
  website text check (website is null or website ~ '^https://'),
  is_active boolean not null default true,
  sort_order int not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger venues_updated_at before update on public.venues
  for each row execute function public.set_updated_at();

create table public.venue_sports (
  venue_id uuid not null references public.venues (id) on delete cascade,
  sport_id uuid not null references public.sports (id) on delete cascade,
  note text check (note is null or char_length(note) <= 160),
  primary key (venue_id, sport_id)
);
create index venue_sports_sport_idx on public.venue_sports (sport_id);

alter table public.venues enable row level security;
alter table public.venue_sports enable row level security;

grant select on public.venues, public.venue_sports to anon, authenticated;
grant insert, update, delete on public.venues, public.venue_sports to authenticated; -- admin-only via RLS

create policy venues_select_active_anon on public.venues
  for select to anon using (is_active);
create policy venues_select on public.venues
  for select to authenticated using (is_active or public.is_admin());
create policy venues_admin_insert on public.venues
  for insert to authenticated with check (public.is_admin());
create policy venues_admin_update on public.venues
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy venues_admin_delete on public.venues
  for delete to authenticated using (public.is_admin());

create policy venue_sports_select_anon on public.venue_sports
  for select to anon
  using (exists (select 1 from public.venues v where v.id = venue_id and v.is_active));
create policy venue_sports_select on public.venue_sports
  for select to authenticated
  using (public.is_admin() or exists (select 1 from public.venues v where v.id = venue_id and v.is_active));
create policy venue_sports_admin_insert on public.venue_sports
  for insert to authenticated with check (public.is_admin());
create policy venue_sports_admin_update on public.venue_sports
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy venue_sports_admin_delete on public.venue_sports
  for delete to authenticated using (public.is_admin());
