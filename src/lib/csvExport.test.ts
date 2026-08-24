import { describe, expect, it } from "vitest";
import {
  CSV_HEADERS,
  escapeCsvCell,
  generateShiftCsv,
  getJapaneseWeekday,
} from "@/lib/csvExport";
import { createShiftRecord } from "@/lib/shiftUtils";
import type { ShiftRecord } from "@/types/shift";

function shift(overrides: Partial<ShiftRecord>): ShiftRecord {
  return {
    ...createShiftRecord("2026-08-01", "day"),
    ...overrides,
  };
}

describe("CSV export", () => {
  it("creates a BOM-prefixed Japanese CSV for the displayed month", () => {
    const csv = generateShiftCsv(
      [
        shift({
          date: "2026-08-26",
          type: "night",
          startTime: "16:30",
          endTime: "09:00",
          endsNextDay: true,
        }),
        shift({ date: "2026-07-31", type: "day" }),
        shift({ date: "2026-08-01", type: "off", startTime: null, endTime: null }),
      ],
      "2026-08",
    );

    expect(csv.startsWith(`\uFEFF${CSV_HEADERS.join(",")}\r\n`)).toBe(true);
    expect(csv).toContain("2026-08-01,土,休み,,,いいえ,");
    expect(csv).toContain("2026-08-26,水,夜勤,16:30,09:00,はい,");
    expect(csv).not.toContain("2026-07-31");
    expect(csv.indexOf("2026-08-01")).toBeLessThan(csv.indexOf("2026-08-26"));
  });

  it("escapes commas, line breaks, and double quotes", () => {
    expect(escapeCsvCell('要確認,次回\n"再検"')).toBe(
      '"要確認,次回\n""再検"""',
    );
  });

  it.each(["=SUM(A1:A2)", "+cmd", "-1+2", "@SUM(A1)"])(
    "protects a formula-like cell without mutating the source: %s",
    (note) => {
      const record = shift({ date: "2026-08-02", note });
      const csv = generateShiftCsv([record], "2026-08");

      expect(csv).toContain(`'${note}`);
      expect(record.note).toBe(note);
    },
  );

  it("derives weekdays from local calendar dates", () => {
    expect(getJapaneseWeekday("2026-08-26")).toBe("水");
  });
});
