import { describe, expect, it } from "vitest";
import { describeSlots, parseSlotKey } from "@/lib/domain/availability";

describe("availability helpers", () => {
  it("parses slot keys strictly", () => {
    expect(parseSlotKey("5:MORNING")).toEqual({ day: 5, block: "MORNING" });
    expect(parseSlotKey("7:MORNING")).toBeNull();
    expect(parseSlotKey("1:BRUNCH")).toBeNull();
  });
  it("describes slots in plain language", () => {
    expect(describeSlots(["5:MORNING", "6:MORNING"])).toBe("weekend mornings");
    expect(describeSlots(["0:EVENING", "1:EVENING", "2:EVENING", "3:EVENING", "4:EVENING"])).toBe("weekday evenings");
    expect(describeSlots(["1:EVENING", "3:EVENING"])).toBe("Tue & Thu evenings");
    expect(describeSlots([])).toBe("");
  });
});
