import { describe, expect, it } from "vitest";
import {
  createDefaultShiftTemplates,
  getTemplateTimes,
  normalizeShiftTemplates,
  validateShiftTemplates,
} from "@/lib/shiftTemplates";

describe("shift templates", () => {
  it("creates independent default template objects", () => {
    const first = createDefaultShiftTemplates();
    const second = createDefaultShiftTemplates();
    first.day.startTime = "09:00";

    expect(second.day.startTime).toBe("08:30");
  });

  it("keeps valid values and fills invalid or missing values with defaults", () => {
    const templates = normalizeShiftTemplates({
      day: { startTime: "09:00", endTime: "18:00" },
      night: { startTime: "99:00", endTime: "09:00" },
    });

    expect(templates.day).toEqual({ startTime: "09:00", endTime: "18:00" });
    expect(templates.night).toEqual({ startTime: "16:30", endTime: "09:00" });
    expect(templates.early).toEqual({ startTime: "07:00", endTime: "15:45" });
  });

  it("rejects equal start and end times", () => {
    const templates = createDefaultShiftTemplates();
    templates.late = { startTime: "10:30", endTime: "10:30" };

    expect(validateShiftTemplates(templates).late).toBeDefined();
  });

  it("uses templates only for configurable shift types", () => {
    const templates = createDefaultShiftTemplates();
    templates.night = { startTime: "17:00", endTime: "08:30" };

    expect(getTemplateTimes("night", templates)).toEqual({
      startTime: "17:00",
      endTime: "08:30",
    });
    expect(getTemplateTimes("off", templates)).toEqual({
      startTime: null,
      endTime: null,
    });
  });
});
