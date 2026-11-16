import { requireAdmin } from "@/lib/auth/viewer";
import { createClient } from "@/lib/supabase/server";
import { AdminHeader } from "@/components/admin/admin-ui";
import { Badge } from "@/components/ui/badge";
import { SportForm, SportToggle } from "@/components/admin/sport-form";

export const metadata = { title: "Sports" };

export default async function AdminSports() {
  // Re-check per page (layouts and pages render concurrently).
  await requireAdmin();
  const supabase = await createClient();
  const { data: sports } = await supabase.from("sports").select("id, name, slug, skill_levels, formats, sort_order, is_active").order("sort_order").order("name");
  return (
    <>
      <AdminHeader title="Sports" description="Each sport defines its own ordered skill levels and playing formats. Deactivated sports are hidden from new applications and profiles." />
      <section className="mb-12 border border-border bg-ivory p-6">
        <h2 className="mb-6 font-serif text-2xl">Add a sport</h2>
        <SportForm />
      </section>
      <ul className="flex flex-col gap-4">
        {(sports ?? []).map((s) => (
          <li key={s.id}>
            <details className="group border border-border bg-card">
              <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 p-5">
                <span className="flex items-center gap-3">
                  <span className="font-serif text-2xl">{s.name}</span>
                  {!s.is_active ? <Badge variant="muted">inactive</Badge> : null}
                </span>
                <span className="text-xs text-muted-foreground">{s.skill_levels.length} levels · {s.formats.length} formats · edit</span>
              </summary>
              <div className="border-t border-border p-5">
                <SportForm sport={s} />
                <div className="mt-6 border-t border-border pt-4"><SportToggle id={s.id} active={s.is_active} /></div>
              </div>
            </details>
          </li>
        ))}
      </ul>
    </>
  );
}
