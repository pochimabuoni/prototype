import type { Metadata } from "next";
import { requireCommunityAccess } from "@/lib/auth/viewer";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AppMain, AppPageHeader } from "@/components/app/app-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { DeleteAccountForm } from "@/components/settings/delete-account-form";
import { UnblockButton } from "@/components/settings/unblock-button";
import { openBillingPortal } from "@/actions/billing";
import { displayName } from "@/lib/data/members";

export const metadata: Metadata = { title: "Settings", robots: { index: false } };

export default async function SettingsPage({ searchParams }: PageProps<"/settings">) {
  const viewer = await requireCommunityAccess("/settings");
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: blocks } = await supabase.from("blocks").select("blocked_id, created_at").eq("blocker_id", viewer.id);
  // Blocked members are invisible through RLS by design; read names with the
  // service role, limited to people this viewer blocked.
  const blockedIds = (blocks ?? []).map((b) => b.blocked_id);
  const { data: blockedProfiles } = blockedIds.length
    ? await createAdminClient().from("member_profiles").select("user_id, first_name, last_name, show_last_name").in("user_id", blockedIds)
    : { data: [] };
  const sub = viewer.subscription;

  return (
    <AppMain className="max-w-4xl">
      <AppPageHeader eyebrow="Settings" title="Account & privacy." />
      <div className="flex flex-col gap-14">
        <Section id="billing" title="Membership & billing">
          {sp.billing === "unconfigured" ? <Alert variant="destructive" className="mb-4">Billing is not configured in this environment.</Alert> : null}
          <dl className="grid gap-4 text-sm sm:grid-cols-3">
            <div><dt className="eyebrow">Status</dt><dd className="mt-2"><Badge variant={sub?.status === "active" ? "success" : "steel"}>{sub?.status ?? (viewer.role === "ADMIN" ? "Administrator" : "None")}</Badge></dd></div>
            <div><dt className="eyebrow">Plan</dt><dd className="mt-2">$60 / month</dd></div>
            <div>
              <dt className="eyebrow">{sub?.cancel_at_period_end ? "Ends" : "Renews"}</dt>
              <dd className="mt-2">{sub?.current_period_end ? new Date(sub.current_period_end).toLocaleDateString("en-US", { dateStyle: "long" }) : "—"}</dd>
            </div>
          </dl>
          {sub ? (
            <form action={openBillingPortal} className="mt-6">
              <Button type="submit" variant="outline">Manage billing, invoices &amp; cancellation</Button>
              <p className="mt-2 text-xs text-muted-foreground">Opens the secure Stripe customer portal.</p>
            </form>
          ) : null}
        </Section>

        <Section title="Your data">
          <p className="text-sm text-muted-foreground">Download a copy of the personal data we hold about you, in JSON format.</p>
          <Button asChild variant="outline" className="mt-4">
            <a href="/api/account/export" download>Download my data</a>
          </Button>
        </Section>

        <Section title="Blocked members">
          {(blockedProfiles ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">You haven&apos;t blocked anyone.</p>
          ) : (
            <ul className="divide-y divide-border border-y border-border">
              {(blockedProfiles ?? []).map((p) => (
                <li key={p.user_id} className="flex items-center justify-between py-3">
                  <span>{displayName(p)}</span>
                  <UnblockButton memberId={p.user_id} />
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Delete account">
          <p className="mb-6 text-sm text-muted-foreground">
            Permanently deletes your account, profile, connections, invitations and messages, and cancels your subscription
            immediately. This cannot be undone.
          </p>
          <DeleteAccountForm />
        </Section>
      </div>
    </AppMain>
  );
}

function Section({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="grid gap-6 border-t border-border pt-8 md:grid-cols-[14rem_1fr]">
      <h2 className="font-serif text-2xl">{title}</h2>
      <div>{children}</div>
    </section>
  );
}
