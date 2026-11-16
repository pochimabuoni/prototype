import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AdminHeader, Table } from "@/components/admin/admin-ui";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MemberAdminActions } from "@/components/admin/member-admin-actions";
import { neighborhoodName } from "@/lib/domain/neighborhoods";
import { displayName } from "@/lib/data/members";

export const metadata = { title: "Members" };

export default async function AdminMembers({ searchParams }: PageProps<"/admin/members">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().toLowerCase().slice(0, 100) : "";
  const supabase = await createClient();
  let query = supabase.from("users").select("id, email, role, account_status, suspended_reason, last_active_at, created_at").in("role", ["MEMBER", "ADMIN"]).order("created_at", { ascending: false }).limit(300);
  // Escape LIKE wildcards in the search term.
  if (q) query = query.ilike("email", `%${q.replace(/[%_\\]/g, (c) => `\\${c}`)}%`);
  const { data: users } = await query;
  const ids = (users ?? []).map((u) => u.id);
  const [{ data: profiles }, { data: subs }] = ids.length
    ? await Promise.all([
        supabase.from("member_profiles").select("user_id, first_name, last_name, show_last_name, neighborhood").in("user_id", ids),
        supabase.from("subscriptions").select("user_id, status, current_period_end, cancel_at_period_end").in("user_id", ids),
      ])
    : [{ data: [] }, { data: [] }];
  const profileBy = new Map((profiles ?? []).map((p) => [p.user_id, p]));
  const subBy = new Map((subs ?? []).map((s) => [s.user_id, s]));

  return (
    <>
      <AdminHeader title="Members" description="Approved members and administrators, with subscription state from Stripe webhooks." />
      <form className="mb-6 flex max-w-md gap-3" method="get">
        <label htmlFor="q" className="sr-only">Search by email</label>
        <Input id="q" name="q" defaultValue={q} placeholder="Search by email" />
        <Button type="submit" variant="outline" size="sm">Search</Button>
      </form>
      <Table>
        <thead><tr><th>Member</th><th>Neighbourhood</th><th>Subscription</th><th>Last active</th><th>Status</th><th /></tr></thead>
        <tbody>
          {(users ?? []).map((u) => {
            const p = profileBy.get(u.id);
            const s = subBy.get(u.id);
            const name = p ? displayName({ ...p, show_last_name: true }) : "Profile not completed";
            return (
              <tr key={u.id}>
                <td>
                  {p ? <Link href={`/members/${u.id}`} className="font-medium underline-offset-4 hover:underline">{name}</Link> : <span className="text-muted-foreground">{name}</span>}
                  <div className="text-xs text-muted-foreground">{u.email}{u.role === "ADMIN" ? " · admin" : ""}</div>
                </td>
                <td>{p ? neighborhoodName(p.neighborhood) : "—"}</td>
                <td>
                  {s ? <Badge variant={s.status === "active" ? "success" : s.status === "past_due" ? "gold" : "muted"}>{s.status}</Badge> : <span className="text-xs text-muted-foreground">none</span>}
                  {s?.cancel_at_period_end ? <div className="mt-1 text-xs text-muted-foreground">cancels {s.current_period_end ? new Date(s.current_period_end).toLocaleDateString() : ""}</div> : null}
                </td>
                <td className="text-xs">{u.last_active_at ? new Date(u.last_active_at).toLocaleDateString("en-US", { dateStyle: "medium" }) : "—"}</td>
                <td>
                  <Badge variant={u.account_status === "ACTIVE" ? "outline" : "destructive"}>{u.account_status.toLowerCase()}</Badge>
                  {u.suspended_reason ? <div className="mt-1 max-w-48 truncate text-xs text-muted-foreground" title={u.suspended_reason}>{u.suspended_reason}</div> : null}
                </td>
                <td className="text-right">{u.role !== "ADMIN" ? <MemberAdminActions userId={u.id} name={p?.first_name ?? u.email} suspended={u.account_status === "SUSPENDED"} hasSubscription={!!s && s.status !== "canceled"} /> : null}</td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </>
  );
}
