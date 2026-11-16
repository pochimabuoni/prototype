import { createClient } from "@/lib/supabase/server";
import { AdminHeader, Table } from "@/components/admin/admin-ui";

export const metadata = { title: "Audit log" };

export default async function AdminAudit() {
  const supabase = await createClient();
  const { data: logs } = await supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(200);
  const actorIds = [...new Set((logs ?? []).map((l) => l.actor_id).filter((x): x is string => !!x))];
  const { data: actors } = actorIds.length ? await supabase.from("users").select("id, email").in("id", actorIds) : { data: [] };
  const email = new Map((actors ?? []).map((a) => [a.id, a.email]));
  return (
    <>
      <AdminHeader title="Audit log" description="Every administrative action, most recent first. Entries are append-only for administrators." />
      <Table>
        <thead><tr><th>When</th><th>Administrator</th><th>Action</th><th>Target</th><th>Details</th></tr></thead>
        <tbody>
          {(logs ?? []).map((l) => (
            <tr key={l.id}>
              <td className="whitespace-nowrap text-xs">{new Date(l.created_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</td>
              <td className="text-xs">{l.actor_id ? email.get(l.actor_id) ?? l.actor_id : "system"}</td>
              <td className="font-mono text-xs">{l.action}</td>
              <td className="text-xs">{l.target_type}{l.target_id ? ` · ${l.target_id.slice(0, 12)}` : ""}</td>
              <td className="max-w-xs truncate font-mono text-[0.6875rem] text-muted-foreground" title={JSON.stringify(l.metadata)}>{JSON.stringify(l.metadata)}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}
