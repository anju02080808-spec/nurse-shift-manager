import { describe, expect, it } from "vitest";
import { createShiftRecord, findNextShift, getMonthlySummary, inferEndsNextDay } from "@/lib/shiftUtils";
import type { ShiftRecord } from "@/types/shift";

function shift(overrides: Partial<ShiftRecord>): ShiftRecord {
  return {
    ...createShiftRecord("2026-08-01", "day"),
    ...overrides,
  };
}

describe("shift utilities", () => {
  it("calculates monthly summary counts", () => {
    const shifts = [
      shift({ date: "2026-08-01", type: "day" }),
      shift({ date: "2026-08-02", type: "day" }),
      shift({ date: "2026-08-03", type: "night" }),
      shift({ date: "2026-08-04", type: "off" }),
      shift({ date: "2026-07-31", type: "day" }),
      shift({ date: "2026-08-05", type: "other" }),
    ];

    expect(getMonthlySummary(shifts, "2026-08")).toEqual({
      day: 2,
      night: 1,
      early: 0,
      late: 0,
      off: 1,
      paidLeave: 0,
    });
  });

  it("finds the nearest eligible future shift", () => {
    const shifts = [
      shift({ date: "2026-08-22", type: "day" }),
      shift({ date: "2026-08-24", type: "off" }),
      shift({ date: "2026-08-25", type: "night" }),
      shift({ date: "2026-08-25", type: "postNight" }),
    ];

    expect(findNextShift(shifts, "2026-08-23")?.type).toBe("night");
    expect(findNextShift(shifts, "2026-08-26")).toBeNull();
  });

  it("detects a shift that ends the next day", () => {
    expect(inferEndsNextDay("16:30", "09:00")).toBe(true);
    expect(inferEndsNextDay("08:30", "17:15")).toBe(false);
    expect(inferEndsNextDay(null, null)).toBe(false);
  });
});
