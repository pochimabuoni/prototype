import { requireAdmin } from "@/lib/auth/viewer";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { uuidSchema, ageOn } from "@/lib/validation/common";
import { neighborhoodName } from "@/lib/domain/neighborhoods";
import { describeSlots } from "@/lib/domain/availability";
import { AdminHeader, statusVariant } from "@/components/admin/admin-ui";
import { Badge } from "@/components/ui/badge";
import { DecisionForm } from "@/components/admin/decision-form";

export const metadata = { title: "Application" };

export default async function AdminApplication({ params }: PageProps<"/admin/applications/[id]">) {
  // Re-check per page (layouts and pages render concurrently).
  await requireAdmin();
  const { id } = await params;
  if (!uuidSchema.safeParse(id).success) notFound();
  const supabase = await createClient();
  const { data: app } = await supabase.from("membership_applications").select("*").eq("id", id).maybeSingle();
  if (!app) notFound();

  // Private bucket; short-lived signed URL generated server-side for admins only.
  let photoUrl: string | null = null;
  if (app.photo_path) {
    const { data } = await createAdminClient().storage.from("application-photos").createSignedUrl(app.photo_path, 300);
    photoUrl = data?.signedUrl ?? null;
  }
  const [{ data: referral }, { data: reviewer }] = await Promise.all([
    app.referral_code_id ? supabase.from("referral_codes").select("code").eq("id", app.referral_code_id).maybeSingle() : Promise.resolve({ data: null }),
    app.reviewed_by ? supabase.from("member_profiles").select("first_name").eq("user_id", app.reviewed_by).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const sports = Array.isArray(app.sports) ? (app.sports as { sport: string; level: string }[]) : [];
  const availability = Array.isArray(app.availability) ? (app.availability as string[]) : [];

  return (
    <>
      <Link href="/admin/applications" className="text-xs uppercase tracking-[0.16em] text-stone hover:text-ink">← Applications</Link>
      <AdminHeader title={app.full_name} description={`${app.email} · submitted ${new Date(app.created_at).toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" })}`} actions={<Badge variant={statusVariant[app.status]}>{app.status.toLowerCase()}</Badge>} />
      <div className="grid gap-10 xl:grid-cols-[1fr_22rem]">
        <div className="flex flex-col gap-8">
          <div className="flex gap-6">
            {photoUrl ? (
              <Image src={photoUrl} alt={`Photo submitted by ${app.full_name}`} width={140} height={175} unoptimized className="h-44 w-36 object-cover" />
            ) : (
              <div className="flex h-44 w-36 items-center justify-center bg-linen text-xs text-stone">No photo</div>
            )}
            <dl className="grid flex-1 grid-cols-2 gap-4 text-sm">
              <Item label="Age">{ageOn(app.date_of_birth)}</Item>
              <Item label="Neighbourhood">{neighborhoodName(app.neighborhood)}</Item>
              <Item label="Occupation">{app.occupation ?? "—"}</Item>
              <Item label="Referral">{referral?.code ?? "—"}</Item>
              <Item label="Availability">{describeSlots(availability) || "—"}</Item>
              <Item label="Account linked">{app.user_id ? "Yes" : "Not yet"}</Item>
            </dl>
          </div>
          <div>
            <h2 className="eyebrow">Sports</h2>
            <ul className="mt-3 flex flex-wrap gap-2">{sports.map((s) => <li key={s.sport}><Badge variant="muted">{s.sport} · {s.level}</Badge></li>)}</ul>
          </div>
          <Prose title="Introduction">{app.introduction}</Prose>
          <Prose title="Why they want to join">{app.motivation}</Prose>
          {app.review_note ? <Prose title={`Review note${reviewer ? ` · ${reviewer.first_name}` : ""}`}>{app.review_note}</Prose> : null}
        </div>
        <aside className="h-fit border border-border bg-ivory p-6">
          <h2 className="font-serif text-2xl">Decision</h2>
          <p className="mb-6 mt-2 text-xs text-muted-foreground">Approval lets the applicant activate a paid membership. All decisions are audit-logged.</p>
          <DecisionForm applicationId={app.id} current={app.status} />
        </aside>
      </div>
    </>
  );
}

function Item({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><dt className="text-[0.6875rem] uppercase tracking-[0.14em] text-stone">{label}</dt><dd className="mt-1">{children}</dd></div>;
}
function Prose({ title, children }: { title: string; children: React.ReactNode }) {
  return <div><h2 className="eyebrow">{title}</h2><p className="mt-3 max-w-2xl whitespace-pre-line leading-relaxed">{children}</p></div>;
}
