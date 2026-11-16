import { requireAdmin } from "@/lib/auth/viewer";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AdminHeader, Table, statusVariant } from "@/components/admin/admin-ui";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { neighborhoodName } from "@/lib/domain/neighborhoods";
import { cn } from "@/lib/utils";

export const metadata = { title: "Applications" };

const STATUSES = ["PENDING", "WAITLISTED", "APPROVED", "REJECTED"] as const;

export default async function AdminApplications({ searchParams }: PageProps<"/admin/applications">) {
  // Re-check per page (layouts and pages render concurrently).
  await requireAdmin();
  const sp = await searchParams;
  const status = STATUSES.find((s) => s === sp.status) ?? "PENDING";
  const supabase = await createClient();
  const [{ data: apps }, ...counts] = await Promise.all([
    supabase
      .from("membership_applications")
      .select("id, full_name, email, neighborhood, sports, status, created_at, referral_code_id")
      .eq("status", status)
      .order("created_at", { ascending: status === "PENDING" })
      .limit(200),
    ...STATUSES.map((s) => supabase.from("membership_applications").select("id", { count: "exact", head: true }).eq("status", s)),
  ]);

  return (
    <>
      <AdminHeader title="Applications" description="Review applicants. Decisions are logged and can notify the applicant by email." />
      <nav aria-label="Filter by status" className="mb-6 flex flex-wrap gap-2">
        {STATUSES.map((s, i) => (
          <Link key={s} href={`/admin/applications?status=${s}`} aria-current={s === status ? "page" : undefined}
            className={cn("border px-3 py-1.5 text-xs uppercase tracking-[0.14em]", s === status ? "border-ink bg-ink text-paper" : "border-sand hover:border-ink")}>
            {s.toLowerCase()} · {counts[i]?.count ?? 0}
          </Link>
        ))}
      </nav>
      {!apps?.length ? (
        <EmptyState title={`No ${status.toLowerCase()} applications`} />
      ) : (
        <Table>
          <thead><tr><th>Applicant</th><th>Neighbourhood</th><th>Sports</th><th>Submitted</th><th>Status</th></tr></thead>
          <tbody>
            {apps.map((a) => (
              <tr key={a.id} className="hover:bg-ivory">
                <td>
                  <Link href={`/admin/applications/${a.id}`} className="font-medium underline-offset-4 hover:underline">{a.full_name}</Link>
                  <div className="text-xs text-muted-foreground">{a.email}</div>
                </td>
                <td>{neighborhoodName(a.neighborhood)}</td>
                <td className="text-xs">{(Array.isArray(a.sports) ? (a.sports as { sport: string; level: string }[]) : []).map((s) => `${s.sport} (${s.level})`).join(", ")}</td>
                <td className="whitespace-nowrap text-xs">{new Date(a.created_at).toLocaleDateString("en-US", { dateStyle: "medium" })}</td>
                <td><Badge variant={statusVariant[a.status]}>{a.status.toLowerCase()}</Badge>{a.referral_code_id ? <Badge variant="steel" className="ml-1">referred</Badge> : null}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}
