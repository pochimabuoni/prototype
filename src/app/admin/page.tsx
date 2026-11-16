import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AdminHeader, Metric } from "@/components/admin/admin-ui";
import { daysAgoIso } from "@/lib/domain/format";

export const metadata = { title: "Overview" };

export default async function AdminOverview() {
  const supabase = await createClient();
  const since30 = daysAgoIso(30);
  const since7 = daysAgoIso(7);
  const count = (q: PromiseLike<{ count: number | null }>) => Promise.resolve(q).then((r) => r.count ?? 0);

  const [
    totalApps, pendingApps, approvedApps, members, activeSubs, pastDue, cancelled, cancelled30,
    activeMembers7, invitations30, invitationsAll, completed, openReports, liveSubs,
  ] = await Promise.all([
    count(supabase.from("membership_applications").select("id", { count: "exact", head: true })),
    count(supabase.from("membership_applications").select("id", { count: "exact", head: true }).eq("status", "PENDING")),
    count(supabase.from("membership_applications").select("id", { count: "exact", head: true }).eq("status", "APPROVED")),
    count(supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "MEMBER")),
    count(supabase.from("subscriptions").select("id", { count: "exact", head: true }).in("status", ["active", "trialing"])),
    count(supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "past_due")),
    count(supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "canceled")),
    count(supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "canceled").gte("updated_at", since30)),
    count(supabase.from("users").select("id", { count: "exact", head: true }).gte("last_active_at", since7)),
    count(supabase.from("invitations").select("id", { count: "exact", head: true }).gte("created_at", since30)),
    count(supabase.from("invitations").select("id", { count: "exact", head: true })),
    count(supabase.from("invitations").select("id", { count: "exact", head: true }).eq("status", "COMPLETED")),
    count(supabase.from("reports").select("id", { count: "exact", head: true }).in("status", ["OPEN", "REVIEWING"])),
    supabase.from("subscriptions").select("unit_amount, status").in("status", ["active", "trialing", "past_due"]),
  ]);
  const mrrCents = (liveSubs.data ?? []).filter((s) => s.status !== "trialing").reduce((s, r) => s + (r.unit_amount ?? 0), 0);
  const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

  return (
    <>
      <AdminHeader title="Overview" description="Live figures from the database. Billing figures reflect verified Stripe webhooks." />
      <h2 className="eyebrow mb-3">Admissions</h2>
      <div className="grid gap-px border border-border bg-border sm:grid-cols-3">
        <Metric label="Total applications" value={totalApps} />
        <Metric label="Pending review" value={pendingApps} hint={pendingApps ? "Awaiting a decision" : "All caught up"} />
        <Metric label="Approved applications" value={approvedApps} hint={`${members} approved member accounts`} />
      </div>
      <h2 className="eyebrow mb-3 mt-10">Membership & revenue</h2>
      <div className="grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Active paying subscribers" value={activeSubs} />
        <Metric label="Monthly recurring revenue" value={usd.format(mrrCents / 100)} hint="Active + past-due, excl. trials" />
        <Metric label="Past due" value={pastDue} />
        <Metric label="Cancellations" value={cancelled} hint={`${cancelled30} in the last 30 days`} />
      </div>
      <h2 className="eyebrow mb-3 mt-10">Community</h2>
      <div className="grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Members active (7 days)" value={activeMembers7} hint="Signed in during the last week" />
        <Metric label="Invitations created" value={invitationsAll} hint={`${invitations30} in the last 30 days`} />
        <Metric label="Completed activities" value={completed} />
        <Metric label="Open reports" value={openReports} hint={openReports ? "Needs attention" : "None outstanding"} className={openReports ? "bg-destructive/5" : ""} />
      </div>
      <div className="mt-10 flex flex-wrap gap-6 text-sm">
        <Link href="/admin/applications?status=PENDING" className="underline underline-offset-4">Review pending applications →</Link>
        <Link href="/admin/reports" className="underline underline-offset-4">Review reports →</Link>
      </div>
    </>
  );
}
