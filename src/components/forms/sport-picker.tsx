"use client";

import { NativeSelect } from "@/components/ui/native-select";
import { cn } from "@/lib/utils";

export interface SportOption {
  slug: string;
  name: string;
  skill_levels: string[];
  formats: string[];
}

export interface SportSelection {
  sport: string;
  level: string;
  formats?: string[];
}

/**
 * Choose sports, a level per sport and (optionally) preferred formats.
 * Levels/formats come from the admin-configured catalogue.
 */
export function SportPicker({
  sports,
  value,
  onChange,
  withFormats = false,
  max = 6,
  errors,
}: {
  sports: SportOption[];
  value: SportSelection[];
  onChange: (next: SportSelection[]) => void;
  withFormats?: boolean;
  max?: number;
  errors?: Record<string, string>;
}) {
  const bySlug = new Map(value.map((v) => [v.sport, v]));
  const toggleSport = (slug: string) => {
    if (bySlug.has(slug)) onChange(value.filter((v) => v.sport !== slug));
    else if (value.length < max) onChange([...value, { sport: slug, level: "", formats: withFormats ? [] : undefined }]);
  };
  const update = (slug: string, patch: Partial<SportSelection>) =>
    onChange(value.map((v) => (v.sport === slug ? { ...v, ...patch } : v)));

  return (
    <div className="flex flex-col gap-6">
      <div role="group" aria-label="Sports" className="flex flex-wrap gap-2">
        {sports.map((s) => {
          const on = bySlug.has(s.slug);
          return (
            <button
              key={s.slug}
              type="button"
              aria-pressed={on}
              onClick={() => toggleSport(s.slug)}
              disabled={!on && value.length >= max}
              className={cn(
                "border px-4 py-2 text-sm transition-colors disabled:opacity-40",
                on ? "border-ink bg-ink text-paper" : "border-sand bg-card text-ink hover:border-ink",
              )}
            >
              {s.name}
            </button>
          );
        })}
      </div>
      {value.length > 0 ? (
        <ul className="divide-y divide-border border-y border-border">
          {value.map((sel, i) => {
            const sport = sports.find((s) => s.slug === sel.sport);
            if (!sport) return null;
            const levelError = errors?.[`sports.${i}.level`];
            return (
              <li key={sel.sport} className="grid gap-4 py-5 sm:grid-cols-[10rem_1fr] sm:items-start">
                <p className="pt-2 font-serif text-xl">{sport.name}</p>
                <div className="flex flex-col gap-4">
                  <div>
                    <label htmlFor={`level-${sel.sport}`} className="sr-only">
                      {sport.name} level
                    </label>
                    <NativeSelect
                      id={`level-${sel.sport}`}
                      value={sel.level}
                      aria-invalid={levelError ? true : undefined}
                      onChange={(e) => update(sel.sport, { level: e.target.value })}
                    >
                      <option value="">Your level…</option>
                      {sport.skill_levels.map((l) => (
                        <option key={l} value={l}>
                          {l}
                        </option>
                      ))}
                    </NativeSelect>
                    {levelError ? <p className="mt-1 text-xs text-destructive">{levelError}</p> : null}
                  </div>
                  {withFormats ? (
                    <div role="group" aria-label={`${sport.name} formats`} className="flex flex-wrap gap-2">
                      {sport.formats.map((f) => {
                        const on = sel.formats?.includes(f) ?? false;
                        return (
                          <button
                            key={f}
                            type="button"
                            aria-pressed={on}
                            onClick={() =>
                              update(sel.sport, {
                                formats: on ? (sel.formats ?? []).filter((x) => x !== f) : [...(sel.formats ?? []), f],
                              })
                            }
                            className={cn(
                              "border px-3 py-1 text-xs transition-colors",
                              on ? "border-steel bg-steel/10 text-ink" : "border-sand text-graphite hover:border-ink",
                            )}
                          >
                            {f}
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
