import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminHeader } from "@/components/admin/admin-ui";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ReportReview } from "@/components/admin/report-review";
import { REPORT_REASONS } from "@/lib/validation/community";
import { cn } from "@/lib/utils";

export const metadata = { title: "Reports" };

export default async function AdminReports({ searchParams }: PageProps<"/admin/reports">) {
  const sp = await searchParams;
  const showClosed = sp.view === "closed";
  const supabase = await createClient();
  const { data: reports } = await supabase
    .from("reports")
    .select("*")
    .in("status", showClosed ? ["RESOLVED", "DISMISSED"] : ["OPEN", "REVIEWING"])
    .order("created_at", { ascending: showClosed ? false : true })
    .limit(100);

  const userIds = [...new Set((reports ?? []).flatMap((r) => [r.reporter_id, r.reported_user_id]).filter((x): x is string => !!x))];
  const messageIds = (reports ?? []).map((r) => r.message_id).filter((x): x is string => !!x);
  // Message content is private to participants; admins see ONLY reported messages, via the service role.
  const admin = createAdminClient();
  const [{ data: users }, { data: profiles }, { data: messages }] = await Promise.all([
    userIds.length ? supabase.from("users").select("id, email, account_status").in("id", userIds) : Promise.resolve({ data: [] }),
    userIds.length ? supabase.from("member_profiles").select("user_id, first_name, last_name").in("user_id", userIds) : Promise.resolve({ data: [] }),
    messageIds.length ? admin.from("messages").select("id, body, created_at").in("id", messageIds) : Promise.resolve({ data: [] }),
  ]);
  const label = (id: string | null) => {
    if (!id) return "Deleted account";
    const p = (profiles ?? []).find((x) => x.user_id === id);
    const u = (users ?? []).find((x) => x.id === id);
    return `${p ? `${p.first_name} ${p.last_name ?? ""}`.trim() : "Member"}${u ? ` (${u.email})` : ""}`;
  };
  const reasonLabel = (r: string) => REPORT_REASONS.find((x) => x.value === r)?.label ?? r;

  return (
    <>
      <AdminHeader title="Reports" description="Confidential member reports. Resolve, dismiss, and suspend members from the Members page if needed." />
      <nav className="mb-6 flex gap-2">
        {[{ v: "", l: "Open" }, { v: "closed", l: "Closed" }].map((t) => (
          <Link key={t.l} href={t.v ? `/admin/reports?view=${t.v}` : "/admin/reports"} className={cn("border px-3 py-1.5 text-xs uppercase tracking-[0.14em]", (t.v === "closed") === showClosed ? "border-ink bg-ink text-paper" : "border-sand")}>{t.l}</Link>
        ))}
      </nav>
      {!reports?.length ? (
        <EmptyState title={showClosed ? "No closed reports" : "No open reports"} description="Reports from members will appear here." />
      ) : (
        <ul className="flex flex-col gap-4">
          {reports.map((r) => {
            const msg = (messages ?? []).find((m) => m.id === r.message_id);
            return (
              <li key={r.id} className="grid gap-6 border border-border bg-card p-6 lg:grid-cols-[1fr_20rem]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={r.status === "OPEN" ? "destructive" : "outline"}>{r.status.toLowerCase()}</Badge>
                    <Badge variant="muted">{reasonLabel(r.reason)}</Badge>
                    <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</span>
                  </div>
                  <p className="mt-4 text-sm"><span className="text-stone">Reported:</span> {label(r.reported_user_id)}</p>
                  <p className="text-sm"><span className="text-stone">By:</span> {label(r.reporter_id)}</p>
                  {r.details ? <p className="mt-3 whitespace-pre-line text-sm leading-relaxed">{r.details}</p> : null}
                  {msg ? <blockquote className="mt-4 border-l-2 border-sand pl-4 text-sm italic">&ldquo;{msg.body}&rdquo;</blockquote> : null}
                </div>
                <ReportReview reportId={r.id} status={r.status} note={r.resolution_note} />
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
