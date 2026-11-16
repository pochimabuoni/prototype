import { requireAdmin } from "@/lib/auth/viewer";
import { createClient } from "@/lib/supabase/server";
import { AdminHeader, Table } from "@/components/admin/admin-ui";
import { Badge } from "@/components/ui/badge";
import { ReferralForm, ReferralToggle } from "@/components/admin/referral-admin";

export const metadata = { title: "Referral codes" };

export default async function AdminReferrals() {
  // Re-check per page (layouts and pages render concurrently).
  await requireAdmin();
  const supabase = await createClient();
  const { data: codes } = await supabase.from("referral_codes").select("*").order("created_at", { ascending: false });
  return (
    <>
      <AdminHeader title="Referral codes" description="Applicants may enter a code; usage is counted atomically when an application is submitted." />
      <section className="mb-10 border border-border bg-ivory p-6"><ReferralForm /></section>
      <Table>
        <thead><tr><th>Code</th><th>Description</th><th>Uses</th><th>Expires</th><th>Status</th><th /></tr></thead>
        <tbody>
          {(codes ?? []).map((c) => {
            const expired = c.expires_at && new Date(c.expires_at) < new Date();
            const exhausted = c.max_uses !== null && c.use_count >= c.max_uses;
            return (
              <tr key={c.id}>
                <td className="font-mono text-xs">{c.code}</td>
                <td>{c.description ?? "—"}</td>
                <td className="tabular-nums">{c.use_count}{c.max_uses ? ` / ${c.max_uses}` : ""}</td>
                <td className="text-xs">{c.expires_at ? new Date(c.expires_at).toLocaleDateString() : "—"}</td>
                <td><Badge variant={c.is_active && !expired && !exhausted ? "success" : "muted"}>{!c.is_active ? "inactive" : expired ? "expired" : exhausted ? "used up" : "active"}</Badge></td>
                <td className="text-right"><ReferralToggle id={c.id} active={c.is_active} /></td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </>
  );
}
