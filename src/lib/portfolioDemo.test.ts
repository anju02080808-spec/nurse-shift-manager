import { describe, expect, it } from "vitest";
import { loadShifts } from "@/lib/storage";
import {
  createPortfolioDemoShifts,
  createPortfolioDemoStorage,
} from "@/lib/portfolioDemo";

describe("portfolio demo", () => {
  it("creates representative shifts and an upcoming shift", () => {
    const referenceDate = new Date(2026, 7, 30);
    const shifts = createPortfolioDemoShifts(referenceDate);

    expect(new Set(shifts.map((shift) => shift.type))).toEqual(
      new Set(["day", "night", "postNight", "early", "late", "off", "paidLeave"]),
    );
    expect(shifts.some((shift) => shift.date > "2026-08-30")).toBe(true);
    expect(shifts.find((shift) => shift.type === "night")).toMatchObject({
      startTime: "16:30",
      endTime: "09:00",
      endsNextDay: true,
    });
    expect(shifts.find((shift) => shift.type === "postNight")?.date).toBe(
      "2026-08-04",
    );
  });

  it("stores demo data only in the supplied in-memory storage", () => {
    const storage = createPortfolioDemoStorage(new Date(2026, 7, 30));
    const shifts = loadShifts(storage);

    expect(shifts.length).toBeGreaterThan(0);
    storage.clear();
    expect(loadShifts(storage)).toEqual([]);
  });
});
