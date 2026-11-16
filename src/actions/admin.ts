"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient, type AdminSupabase } from "@/lib/supabase/admin";
import { assertAdmin, AuthorizationError, type Viewer } from "@/lib/auth/viewer";
import { logAdminAction } from "@/lib/audit";
import { sportSchema, venueSchema, referralSchema, reportUpdateSchema, suspendSchema } from "@/lib/validation/admin";
import { uuidSchema } from "@/lib/validation/common";
import { weightsSchema } from "@/lib/matching/weights";
import { getStripe } from "@/lib/billing/stripe";
import { isStripeConfigured } from "@/lib/env.server";
import { type ActionResult, fail, zodFieldErrors, GENERIC_ERROR } from "@/lib/action-result";

/**
 * Every administrative mutation:
 *  1. re-verifies the caller is an ACTIVE ADMIN from the database,
 *  2. validates input,
 *  3. writes with the service role,
 *  4. records an audit log entry.
 */
async function withAdmin<T>(fn: (ctx: { actor: Viewer; db: AdminSupabase }) => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  let actor: Viewer;
  try {
    actor = await assertAdmin();
  } catch (e) {
    if (e instanceof AuthorizationError) return fail(e.message);
    throw e;
  }
  try {
    return await fn({ actor, db: createAdminClient() });
  } catch (e) {
    console.error("[admin] action failed", e);
    return fail(GENERIC_ERROR);
  }
}

export async function suspendMember(input: unknown) {
  return withAdmin(async ({ actor, db }) => {
    const p = suspendSchema.safeParse(input);
    if (!p.success) return fail("Invalid request.", zodFieldErrors(p.error.issues));
    if (p.data.userId === actor.id) return fail("You can't suspend your own account.");
    const { error } = await db.from("users").update({ account_status: "SUSPENDED", suspended_reason: p.data.reason }).eq("id", p.data.userId);
    if (error) return fail(GENERIC_ERROR);
    let billing = "unchanged";
    if (p.data.cancelSubscription) {
      const { data: sub } = await db.from("subscriptions").select("stripe_subscription_id, status").eq("user_id", p.data.userId).maybeSingle();
      if (sub && isStripeConfigured() && !sub.stripe_subscription_id.startsWith("sub_seed_") && sub.status !== "canceled") {
        await getStripe().subscriptions.update(sub.stripe_subscription_id, { cancel_at_period_end: true });
        billing = "cancel_at_period_end";
      }
    }
    await logAdminAction(db, { actorId: actor.id, action: "member.suspend", targetType: "user", targetId: p.data.userId, metadata: { reason: p.data.reason, billing } });
    revalidatePath("/admin/members");
    return { ok: true, message: "Member suspended." };
  });
}

export async function reinstateMember(userId: string) {
  return withAdmin(async ({ actor, db }) => {
    if (!uuidSchema.safeParse(userId).success) return fail("Invalid request.");
    const { error } = await db.from("users").update({ account_status: "ACTIVE", suspended_reason: null }).eq("id", userId);
    if (error) return fail(GENERIC_ERROR);
    await logAdminAction(db, { actorId: actor.id, action: "member.reinstate", targetType: "user", targetId: userId });
    revalidatePath("/admin/members");
    return { ok: true, message: "Member reinstated." };
  });
}

export async function updateReport(input: unknown) {
  return withAdmin(async ({ actor, db }) => {
    const p = reportUpdateSchema.safeParse(input);
    if (!p.success) return fail("Invalid request.");
    const done = p.data.status === "RESOLVED" || p.data.status === "DISMISSED";
    const { error } = await db
      .from("reports")
      .update({ status: p.data.status, resolution_note: p.data.note ?? null, reviewed_by: actor.id, resolved_at: done ? new Date().toISOString() : null })
      .eq("id", p.data.reportId);
    if (error) return fail(GENERIC_ERROR);
    await logAdminAction(db, { actorId: actor.id, action: `report.${p.data.status.toLowerCase()}`, targetType: "report", targetId: p.data.reportId, metadata: { note: p.data.note ?? null } });
    revalidatePath("/admin/reports");
    revalidatePath("/admin");
    return { ok: true, message: "Report updated." };
  });
}

export async function saveSport(_prev: ActionResult | null, formData: FormData) {
  return withAdmin(async ({ actor, db }) => {
    const p = sportSchema.safeParse({
      id: formData.get("id") || undefined,
      name: formData.get("name"),
      slug: formData.get("slug"),
      skillLevels: formData.get("skillLevels") ?? "",
      formats: formData.get("formats") ?? "",
      sortOrder: formData.get("sortOrder") || 100,
    });
    if (!p.success) return fail("Please review the sport.", zodFieldErrors(p.error.issues));
    const row = { name: p.data.name, slug: p.data.slug, skill_levels: p.data.skillLevels, formats: p.data.formats, sort_order: p.data.sortOrder };
    if (p.data.id) {
      // Prevent orphaning member preferences: removed levels must be unused.
      const { data: inUse } = await db.from("member_sports").select("skill_level").eq("sport_id", p.data.id);
      const removed = [...new Set((inUse ?? []).map((r) => r.skill_level))].filter((l) => !p.data.skillLevels.includes(l));
      if (removed.length) return fail(`These levels are in use by members and can't be removed: ${removed.join(", ")}.`);
      const { error } = await db.from("sports").update(row).eq("id", p.data.id);
      if (error) return fail(error.code === "23505" ? "That slug is already used." : GENERIC_ERROR);
    } else {
      const { error } = await db.from("sports").insert(row);
      if (error) return fail(error.code === "23505" ? "That slug is already used." : GENERIC_ERROR);
    }
    await logAdminAction(db, { actorId: actor.id, action: p.data.id ? "sport.update" : "sport.create", targetType: "sport", targetId: p.data.id ?? p.data.slug, metadata: row });
    revalidatePath("/admin/sports");
    return { ok: true, message: "Sport saved." };
  });
}

export async function setSportActive(sportId: string, active: boolean) {
  return withAdmin(async ({ actor, db }) => {
    if (!uuidSchema.safeParse(sportId).success) return fail("Invalid request.");
    const { error } = await db.from("sports").update({ is_active: active }).eq("id", sportId);
    if (error) return fail(GENERIC_ERROR);
    await logAdminAction(db, { actorId: actor.id, action: active ? "sport.activate" : "sport.deactivate", targetType: "sport", targetId: sportId });
    revalidatePath("/admin/sports");
    return { ok: true };
  });
}

export async function saveVenue(_prev: ActionResult | null, formData: FormData) {
  return withAdmin(async ({ actor, db }) => {
    const p = venueSchema.safeParse({
      id: formData.get("id") || undefined,
      name: formData.get("name"),
      slug: formData.get("slug"),
      neighborhood: formData.get("neighborhood"),
      location: formData.get("location"),
      description: formData.get("description") ?? undefined,
      access: formData.get("access"),
      accessNote: formData.get("accessNote") ?? undefined,
      indoor: formData.get("indoor") === "on",
      seasonal: formData.get("seasonal") === "on",
      website: formData.get("website") ?? undefined,
      sortOrder: formData.get("sortOrder") || 100,
      sportIds: formData.getAll("sportIds").map(String),
    });
    if (!p.success) return fail("Please review the venue.", zodFieldErrors(p.error.issues));
    const d = p.data;
    const row = {
      name: d.name,
      slug: d.slug,
      neighborhood: d.neighborhood,
      location: d.location,
      description: d.description ?? null,
      access: d.access,
      access_note: d.accessNote ?? null,
      indoor: d.indoor,
      seasonal: d.seasonal,
      website: d.website ?? null,
      sort_order: d.sortOrder,
    };

    let venueId = d.id;
    if (venueId) {
      const { error } = await db.from("venues").update(row).eq("id", venueId);
      if (error) return fail(error.code === "23505" ? "That slug is already used." : GENERIC_ERROR);
    } else {
      const { data, error } = await db.from("venues").insert(row).select("id").single();
      if (error || !data) return fail(error?.code === "23505" ? "That slug is already used." : GENERIC_ERROR);
      venueId = data.id;
    }

    // Sync sports, keeping any notes on sports that stay linked.
    const { data: existing } = await db.from("venue_sports").select("sport_id, note").eq("venue_id", venueId);
    const keep = new Set(d.sportIds);
    const removed = (existing ?? []).filter((e) => !keep.has(e.sport_id)).map((e) => e.sport_id);
    const added = d.sportIds.filter((id) => !(existing ?? []).some((e) => e.sport_id === id));
    if (removed.length) {
      const { error } = await db.from("venue_sports").delete().eq("venue_id", venueId).in("sport_id", removed);
      if (error) return fail(GENERIC_ERROR);
    }
    if (added.length) {
      const { error } = await db.from("venue_sports").insert(added.map((sport_id) => ({ venue_id: venueId!, sport_id })));
      if (error) return fail(error.code === "23503" ? "One of the sports no longer exists." : GENERIC_ERROR);
    }

    await logAdminAction(db, {
      actorId: actor.id,
      action: d.id ? "venue.update" : "venue.create",
      targetType: "venue",
      targetId: venueId,
      metadata: { ...row, sportIds: d.sportIds },
    });
    revalidatePath("/admin/venues");
    revalidatePath("/venues", "layout");
    return { ok: true, message: "Venue saved." };
  });
}

export async function setVenueActive(venueId: string, active: boolean) {
  return withAdmin(async ({ actor, db }) => {
    if (!uuidSchema.safeParse(venueId).success) return fail("Invalid request.");
    const { error } = await db.from("venues").update({ is_active: active }).eq("id", venueId);
    if (error) return fail(GENERIC_ERROR);
    await logAdminAction(db, { actorId: actor.id, action: active ? "venue.activate" : "venue.deactivate", targetType: "venue", targetId: venueId });
    revalidatePath("/admin/venues");
    revalidatePath("/venues", "layout");
    return { ok: true };
  });
}

export async function createReferralCode(_prev: ActionResult | null, formData: FormData) {
  return withAdmin(async ({ actor, db }) => {
    const p = referralSchema.safeParse({
      code: formData.get("code"),
      description: formData.get("description") ?? undefined,
      maxUses: formData.get("maxUses"),
      expiresAt: formData.get("expiresAt"),
    });
    if (!p.success) return fail("Please review the code.", zodFieldErrors(p.error.issues));
    const { error } = await db.from("referral_codes").insert({
      code: p.data.code,
      description: p.data.description ?? null,
      max_uses: p.data.maxUses ?? null,
      expires_at: p.data.expiresAt ? `${p.data.expiresAt}T23:59:59-05:00` : null,
      created_by: actor.id,
    });
    if (error) return fail(error.code === "23505" ? "That code already exists." : GENERIC_ERROR);
    await logAdminAction(db, { actorId: actor.id, action: "referral.create", targetType: "referral_code", targetId: p.data.code, metadata: { maxUses: p.data.maxUses ?? null } });
    revalidatePath("/admin/referrals");
    return { ok: true, message: "Referral code created." };
  });
}

export async function setReferralActive(id: string, active: boolean) {
  return withAdmin(async ({ actor, db }) => {
    if (!uuidSchema.safeParse(id).success) return fail("Invalid request.");
    const { error } = await db.from("referral_codes").update({ is_active: active }).eq("id", id);
    if (error) return fail(GENERIC_ERROR);
    await logAdminAction(db, { actorId: actor.id, action: active ? "referral.activate" : "referral.deactivate", targetType: "referral_code", targetId: id });
    revalidatePath("/admin/referrals");
    return { ok: true };
  });
}

export async function updateMatchingWeights(input: unknown) {
  return withAdmin(async ({ actor, db }) => {
    const p = weightsSchema.safeParse(input);
    if (!p.success) return fail("Weights must be between 0 and 1 and not all zero.");
    const { error } = await db.from("app_settings").upsert({ key: "matching_weights", value: p.data, updated_by: actor.id, updated_at: new Date().toISOString() });
    if (error) return fail(GENERIC_ERROR);
    await logAdminAction(db, { actorId: actor.id, action: "settings.matching_weights", targetType: "app_settings", targetId: "matching_weights", metadata: p.data });
    revalidatePath("/admin/settings");
    return { ok: true, message: "Matching weights saved." };
  });
}
