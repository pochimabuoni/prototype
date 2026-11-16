import { createClient } from "@/lib/supabase/server";
import { getMatchingWeights } from "@/lib/data/members";
import { AdminHeader } from "@/components/admin/admin-ui";
import { WeightsForm } from "@/components/admin/weights-form";

export const metadata = { title: "Matching" };

export default async function AdminSettings() {
  const supabase = await createClient();
  const weights = await getMatchingWeights(supabase);
  return (
    <>
      <AdminHeader title="Matching weights" description="Defaults: availability 35%, skill 30%, neighbourhood 20%, format 15%. Changes apply immediately to discovery." />
      <div className="max-w-2xl border border-border bg-card p-6"><WeightsForm initial={weights} /></div>
    </>
  );
}
