import { z } from "zod";
import { DEFAULT_WEIGHTS, normalizeWeights, type MatchWeights } from "./score";

export const weightsSchema = z
  .object({
    availability: z.number().min(0).max(1),
    skill: z.number().min(0).max(1),
    neighborhood: z.number().min(0).max(1),
    format: z.number().min(0).max(1),
  })
  .refine((w) => w.availability + w.skill + w.neighborhood + w.format > 0, "At least one weight must be positive.");

/** Parse weights stored in app_settings, falling back to defaults. */
export function parseStoredWeights(value: unknown): MatchWeights {
  const parsed = weightsSchema.safeParse(value);
  return parsed.success ? normalizeWeights(parsed.data) : { ...DEFAULT_WEIGHTS };
}
