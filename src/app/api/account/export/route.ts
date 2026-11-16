import { NextResponse } from "next/server";
import { getViewer } from "@/lib/auth/viewer";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Data export: returns a JSON file of everything we hold about the signed-in
 * user, read with THEIR client (RLS guarantees nothing about others leaks),
 * and records the request.
 */
export async function GET() {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (!(await rateLimit("dataExport", viewer.id))) {
    return NextResponse.json({ error: "Export limit reached. Please try again tomorrow." }, { status: 429 });
  }
  const supabase = await createClient();
  const uid = viewer.id;
  const { data: request } = await supabase.from("data_export_requests").insert({ user_id: uid }).select("id").single();

  const [account, applications, profile, sports, availability, subscription, connections, invitations, participants, sentMessages, blocks, reports, privateData] =
    await Promise.all([
      supabase.from("users").select("id, email, role, account_status, created_at").eq("id", uid).single(),
      supabase.from("membership_applications").select("email, full_name, date_of_birth, neighborhood, occupation, sports, availability, introduction, motivation, status, created_at").eq("user_id", uid),
      supabase.from("member_profiles").select("*").eq("user_id", uid).maybeSingle(),
      supabase.from("member_sports").select("sport_id, skill_level, formats").eq("user_id", uid),
      supabase.from("member_availability").select("day_of_week, time_block").eq("user_id", uid),
      supabase.from("subscriptions").select("status, current_period_end, cancel_at_period_end, created_at").eq("user_id", uid).maybeSingle(),
      supabase.from("connections").select("requester_id, addressee_id, status, note, created_at"),
      supabase.from("invitations").select("sender_id, recipient_id, sport_id, proposed_date, proposed_time, location_note, message, status, group_id, created_at"),
      supabase.from("conversation_participants").select("conversation_id, last_read_at").eq("user_id", uid),
      supabase.from("messages").select("conversation_id, body, created_at").eq("sender_id", uid),
      supabase.from("blocks").select("blocked_id, created_at").eq("blocker_id", uid),
      supabase.from("reports").select("reported_user_id, reason, details, status, created_at").eq("reporter_id", uid),
      // Date of birth is never readable by member sessions; read the caller's own row with the service role.
      createAdminClient().from("member_private").select("date_of_birth").eq("user_id", uid).maybeSingle(),
    ]);

  const body = {
    exported_at: new Date().toISOString(),
    note: "Personal data held by Pochi Ma Buoni. Card details are held by Stripe and are not included.",
    account: account.data,
    applications: applications.data,
    profile: profile.data,
    date_of_birth: privateData.data?.date_of_birth ?? null,
    sports: sports.data,
    availability: availability.data,
    subscription: subscription.data,
    connections: connections.data,
    invitations: invitations.data,
    conversations: participants.data,
    messages_sent: sentMessages.data,
    blocks: blocks.data,
    reports_filed: reports.data,
    export_request_id: request?.id ?? null,
  };
  if (request?.id) {
    await createAdminClient().from("data_export_requests").update({ status: "COMPLETED", completed_at: new Date().toISOString() }).eq("id", request.id);
  }
  return new NextResponse(JSON.stringify(body, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="pochi-ma-buoni-data-${new Date().toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
