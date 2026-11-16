-- =============================================================================
-- POCHI MA BUONI — Row Level Security, privileges, storage and realtime
-- Principle: clients (anon/authenticated) get the narrowest access that the UI
-- needs. Anything privileged (application decisions, entitlements, billing,
-- audit logs) is written only by the service role from verified server code.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Enable RLS everywhere
-- ---------------------------------------------------------------------------
alter table public.users enable row level security;
alter table public.sports enable row level security;
alter table public.referral_codes enable row level security;
alter table public.membership_applications enable row level security;
alter table public.member_profiles enable row level security;
alter table public.member_sports enable row level security;
alter table public.member_availability enable row level security;
alter table public.subscriptions enable row level security;
alter table public.stripe_events enable row level security;
alter table public.connections enable row level security;
alter table public.invitations enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;
alter table public.blocks enable row level security;
alter table public.reports enable row level security;
alter table public.audit_logs enable row level security;
alter table public.data_export_requests enable row level security;
alter table public.app_settings enable row level security;
alter table public.rate_limits enable row level security;

-- ---------------------------------------------------------------------------
-- Table privileges. Start from nothing and grant precisely.
-- ---------------------------------------------------------------------------
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

grant select on public.sports to anon, authenticated;

grant select on public.users to authenticated;
grant select on public.membership_applications to authenticated;
grant select, insert, update on public.member_profiles to authenticated;
grant select, insert, delete on public.member_sports to authenticated;
grant update (skill_level, formats) on public.member_sports to authenticated;
grant select, insert, delete on public.member_availability to authenticated;
grant select on public.subscriptions to authenticated;
grant select, insert on public.connections to authenticated;
grant update (status) on public.connections to authenticated;
grant select, insert on public.invitations to authenticated;
grant update (status) on public.invitations to authenticated;
grant select on public.conversations to authenticated;
grant select on public.conversation_participants to authenticated;
grant update (last_read_at) on public.conversation_participants to authenticated;
grant select, insert on public.messages to authenticated;
grant select, insert, delete on public.blocks to authenticated;
grant select, insert on public.reports to authenticated;
grant update (status, resolution_note, reviewed_by, resolved_at) on public.reports to authenticated;
grant select on public.audit_logs to authenticated;
grant select, insert on public.data_export_requests to authenticated;
grant select on public.app_settings to authenticated;
grant select, insert, update on public.referral_codes to authenticated;
grant insert, update, delete on public.sports to authenticated; -- admin-only via RLS

-- Service role keeps full access (bypasses RLS) for webhooks and admin actions.
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;

-- ---------------------------------------------------------------------------
-- Function privileges
-- ---------------------------------------------------------------------------
revoke execute on all functions in schema public from public, anon;
grant execute on function public.is_admin(uuid) to authenticated;
grant execute on function public.is_active_member(uuid) to authenticated;
grant execute on function public.can_use_community(uuid) to authenticated;
grant execute on function public.is_blocked_between(uuid, uuid) to authenticated;
grant execute on function public.are_connected(uuid, uuid) to authenticated;
grant execute on function public.can_view_member(uuid, uuid) to authenticated;
grant execute on function public.is_conversation_participant(uuid, uuid) to authenticated;
grant execute on function public.can_message(uuid, uuid) to authenticated;
grant execute on function public.get_or_create_conversation(uuid) to authenticated;
grant execute on function public.my_unread_counts() to authenticated;
-- Server-only utilities
revoke execute on function public.rate_limit_hit(text, int, int) from authenticated;
revoke execute on function public.consume_referral_code(text) from authenticated;
grant execute on all functions in schema public to service_role;

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------
create policy users_select_self_or_admin on public.users
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- sports (public catalogue, admin-managed)
-- ---------------------------------------------------------------------------
create policy sports_select_active_anon on public.sports
  for select to anon
  using (is_active);
create policy sports_select_active on public.sports
  for select to authenticated
  using (is_active or public.is_admin());
create policy sports_admin_insert on public.sports
  for insert to authenticated with check (public.is_admin());
create policy sports_admin_update on public.sports
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy sports_admin_delete on public.sports
  for delete to authenticated using (public.is_admin());

-- ---------------------------------------------------------------------------
-- referral codes (admin only; applicants redeem through a server function)
-- ---------------------------------------------------------------------------
create policy referral_codes_admin_select on public.referral_codes
  for select to authenticated using (public.is_admin());
create policy referral_codes_admin_insert on public.referral_codes
  for insert to authenticated with check (public.is_admin());
create policy referral_codes_admin_update on public.referral_codes
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- membership applications: read own; decisions are service-role only
-- ---------------------------------------------------------------------------
create policy applications_select_own_or_admin on public.membership_applications
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- member profiles, sports and availability
-- ---------------------------------------------------------------------------
create policy profiles_select_visible on public.member_profiles
  for select to authenticated
  using (public.can_view_member(auth.uid(), user_id));
create policy profiles_insert_own on public.member_profiles
  for insert to authenticated
  with check (user_id = auth.uid() and public.can_use_community());
create policy profiles_update_own on public.member_profiles
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy member_sports_select_visible on public.member_sports
  for select to authenticated
  using (public.can_view_member(auth.uid(), user_id));
create policy member_sports_insert_own on public.member_sports
  for insert to authenticated
  with check (user_id = auth.uid() and public.can_use_community());
create policy member_sports_update_own on public.member_sports
  for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy member_sports_delete_own on public.member_sports
  for delete to authenticated using (user_id = auth.uid());

create policy availability_select_visible on public.member_availability
  for select to authenticated
  using (public.can_view_member(auth.uid(), user_id));
create policy availability_insert_own on public.member_availability
  for insert to authenticated
  with check (user_id = auth.uid() and public.can_use_community());
create policy availability_delete_own on public.member_availability
  for delete to authenticated using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- subscriptions: read-only for the owner; webhook writes with service role
-- ---------------------------------------------------------------------------
create policy subscriptions_select_own_or_admin on public.subscriptions
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- connections
-- ---------------------------------------------------------------------------
create policy connections_select_participant on public.connections
  for select to authenticated
  using (auth.uid() in (requester_id, addressee_id) or public.is_admin());
create policy connections_insert_requester on public.connections
  for insert to authenticated
  with check (
    requester_id = auth.uid()
    and status = 'PENDING'
    and public.is_active_member(auth.uid())
    and public.can_view_member(auth.uid(), addressee_id)
    and not public.is_blocked_between(auth.uid(), addressee_id)
  );
-- Allowed transitions are enforced by the connections_guard trigger.
create policy connections_update_participant on public.connections
  for update to authenticated
  using (auth.uid() in (requester_id, addressee_id))
  with check (auth.uid() in (requester_id, addressee_id));

-- ---------------------------------------------------------------------------
-- invitations
-- ---------------------------------------------------------------------------
create policy invitations_select_participant on public.invitations
  for select to authenticated
  using (auth.uid() in (sender_id, recipient_id) or public.is_admin());
create policy invitations_insert_sender on public.invitations
  for insert to authenticated
  with check (
    sender_id = auth.uid()
    and status = 'PENDING'
    and proposed_date >= (now() at time zone 'America/New_York')::date
    and public.is_active_member(auth.uid())
    and public.can_view_member(auth.uid(), recipient_id)
    and not public.is_blocked_between(auth.uid(), recipient_id)
    and exists (select 1 from public.sports s where s.id = sport_id and s.is_active)
  );
create policy invitations_update_participant on public.invitations
  for update to authenticated
  using (auth.uid() in (sender_id, recipient_id))
  with check (auth.uid() in (sender_id, recipient_id));

-- ---------------------------------------------------------------------------
-- messaging
-- ---------------------------------------------------------------------------
create policy conversations_select_participant on public.conversations
  for select to authenticated
  using (public.is_conversation_participant(id));

create policy participants_select_same_conversation on public.conversation_participants
  for select to authenticated
  using (public.is_conversation_participant(conversation_id));
create policy participants_update_own on public.conversation_participants
  for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy messages_select_participant on public.messages
  for select to authenticated
  using (public.is_conversation_participant(conversation_id));
create policy messages_insert_allowed on public.messages
  for insert to authenticated
  with check (sender_id = auth.uid() and public.can_message(conversation_id));

-- ---------------------------------------------------------------------------
-- blocks and reports
-- ---------------------------------------------------------------------------
create policy blocks_select_own on public.blocks
  for select to authenticated
  using (blocker_id = auth.uid() or public.is_admin());
create policy blocks_insert_own on public.blocks
  for insert to authenticated
  with check (blocker_id = auth.uid());
create policy blocks_delete_own on public.blocks
  for delete to authenticated using (blocker_id = auth.uid());

create policy reports_insert_own on public.reports
  for insert to authenticated
  with check (reporter_id = auth.uid() and status = 'OPEN' and public.can_use_community());
create policy reports_select_own_or_admin on public.reports
  for select to authenticated
  using (reporter_id = auth.uid() or public.is_admin());
create policy reports_update_admin on public.reports
  for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- operations
-- ---------------------------------------------------------------------------
create policy audit_logs_select_admin on public.audit_logs
  for select to authenticated using (public.is_admin());

create policy data_export_select_own on public.data_export_requests
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy data_export_insert_own on public.data_export_requests
  for insert to authenticated with check (user_id = auth.uid() and status = 'PENDING');

create policy app_settings_select on public.app_settings
  for select to authenticated using (public.can_use_community());

-- stripe_events and rate_limits intentionally have no client policies.

-- =============================================================================
-- Storage: private buckets, signed URLs only
-- =============================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', false, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('application-photos', 'application-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Members may manage files only inside a folder named after their user id.
create policy avatars_owner_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy avatars_owner_update on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy avatars_owner_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
-- Only community participants can read (sign) avatars.
create policy avatars_members_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'avatars'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.can_use_community())
  );
-- application-photos: no client policies; uploads and admin reads use the
-- service role from server code.

-- =============================================================================
-- Realtime: stream new messages (RLS applies to realtime subscriptions)
-- =============================================================================
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.messages;
  end if;
end;
$$;
