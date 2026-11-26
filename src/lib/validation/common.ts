import { z } from "zod";
import { NEIGHBORHOOD_SLUGS, VENUE_NEIGHBORHOOD_SLUGS } from "@/lib/domain/neighborhoods";
import { SLOT_KEY_REGEX } from "@/lib/domain/availability";
import { MIN_AGE } from "@/lib/domain/constants";

/** Trimmed string; empty becomes undefined (for optional inputs). */
export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Please keep this under ${max} characters.`)
    .optional()
    .transform((v) => (v ? v : undefined));

export const neighborhoodSchema = z.enum(NEIGHBORHOOD_SLUGS, { error: "Please choose a neighbourhood." });

/** Venues can also sit in areas members do not choose from (see VENUE_ONLY_NEIGHBORHOODS). */
export const venueNeighborhoodSchema = z.enum(VENUE_NEIGHBORHOOD_SLUGS, { error: "Please choose an area." });

export const slotKeySchema = z.string().regex(SLOT_KEY_REGEX, "Invalid availability slot.");

export const uuidSchema = z.uuid({ error: "Invalid identifier." });

/** Age in whole years on `today` for an ISO date (YYYY-MM-DD). */
export function ageOn(dateOfBirth: string, today = new Date()): number {
  const [y, m, d] = dateOfBirth.split("-").map(Number);
  if (!y || !m || !d) return NaN;
  let age = today.getUTCFullYear() - y;
  const beforeBirthday = today.getUTCMonth() + 1 < m || (today.getUTCMonth() + 1 === m && today.getUTCDate() < d);
  if (beforeBirthday) age -= 1;
  return age;
}

export const dateOfBirthSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Please enter your date of birth.")
  .refine((v) => !Number.isNaN(new Date(`${v}T00:00:00Z`).getTime()), "Please enter a valid date.")
  .refine((v) => ageOn(v) >= MIN_AGE, `Members must be at least ${MIN_AGE} years old.`)
  .refine((v) => ageOn(v) <= 110, "Please enter a valid date of birth.");

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

/** Validate an uploaded image by declared type, size AND magic bytes. */
export async function validateImageFile(file: File): Promise<{ ok: true; ext: "jpg" | "png" | "webp" } | { ok: false; error: string }> {
  if (file.size === 0) return { ok: false, error: "The selected file is empty." };
  if (file.size > MAX_IMAGE_BYTES) return { ok: false, error: "Photos must be 4 MB or smaller." };
  if (!(IMAGE_TYPES as readonly string[]).includes(file.type)) return { ok: false, error: "Please upload a JPEG, PNG or WebP image." };
  const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const isJpeg = head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
  const isPng = head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47;
  const isWebp =
    head[0] === 0x52 && head[1] === 0x49 && head[2] === 0x46 && head[3] === 0x46 &&
    head[8] === 0x57 && head[9] === 0x45 && head[10] === 0x42 && head[11] === 0x50;
  if (isJpeg) return { ok: true, ext: "jpg" };
  if (isPng) return { ok: true, ext: "png" };
  if (isWebp) return { ok: true, ext: "webp" };
  return { ok: false, error: "That file doesn't appear to be a valid image." };
}
