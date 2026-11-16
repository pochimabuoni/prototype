/**
 * How a member likes to play. Members pick one or more; matchmaking only
 * suggests someone for a mode they have opted into.
 */
export const PLAY_STYLES = [
  { value: "one_on_one", label: "One-on-one", description: "A partner or opponent: singles, a hitting session, a run together." },
  { value: "small_group", label: "Small group (3–6)", description: "Doubles, a foursome, an Americano, a small run crew." },
  { value: "large_group", label: "Larger group (7+)", description: "Pickup games, 5-a-side, team sessions, group rides." },
] as const;

export type PlayStyle = (typeof PLAY_STYLES)[number]["value"];
export const PLAY_STYLE_VALUES = PLAY_STYLES.map((p) => p.value) as [PlayStyle, ...PlayStyle[]];

export const GROUP_SIZE_MIN = 3;
export const GROUP_SIZE_MAX = 10;

/** The play style a group of `size` people (including the organiser) falls under. */
export function styleForGroupSize(size: number): PlayStyle {
  if (size <= 2) return "one_on_one";
  return size <= 6 ? "small_group" : "large_group";
}

export function playStyleLabel(value: string): string {
  return PLAY_STYLES.find((p) => p.value === value)?.label ?? value;
}

export const AGE_MIN = 18;
export const AGE_MAX = 99;
