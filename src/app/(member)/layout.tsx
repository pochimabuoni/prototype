import { requireCommunityAccess } from "@/lib/auth/viewer";
import { createClient } from "@/lib/supabase/server";
import { AppHeader, SimpleFooter } from "@/components/app/app-header";

/**
 * Private community area. Access is decided SERVER-SIDE from database state
 * (role, suspension, webhook-synced subscription, completed profile).
 */
export default async function MemberLayout({ children }: LayoutProps<"/">) {
  const viewer = await requireCommunityAccess();
  const supabase = await createClient();
  const [{ data: unread }, { count: pendingInvites }, { count: pendingConnections }] = await Promise.all([
    supabase.rpc("my_unread_counts"),
    supabase.from("invitations").select("id", { count: "exact", head: true }).eq("recipient_id", viewer.id).eq("status", "PENDING"),
    supabase.from("connections").select("id", { count: "exact", head: true }).eq("addressee_id", viewer.id).eq("status", "PENDING"),
  ]);
  const unreadTotal = (unread ?? []).reduce((s, r) => s + Number(r.unread), 0);
  return (
    <>
      <AppHeader isAdmin={viewer.role === "ADMIN"} unread={unreadTotal} pendingInvites={(pendingInvites ?? 0) + (pendingConnections ?? 0)} />
      {children}
      <SimpleFooter />
    </>
  );
}
