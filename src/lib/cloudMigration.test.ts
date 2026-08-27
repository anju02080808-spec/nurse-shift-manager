import { describe, expect, it } from "vitest";
import {
  areShiftTemplatesEqual,
  buildShiftMigrationPlan,
  countShiftConflicts,
} from "@/lib/cloudMigration";
import { createDefaultShiftTemplates } from "@/lib/shiftTemplates";
import type { ShiftRecord } from "@/types/shift";

function createShift(
  id: string,
  date: string,
  note = "",
): ShiftRecord {
  return {
    id,
    date,
    type: "day",
    startTime: "08:30",
    endTime: "17:15",
    endsNextDay: false,
    note,
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
  };
}

describe("cloud migration", () => {
  it("競合しない端末勤務だけを追加する", () => {
    const local = [createShift("local-1", "2026-08-01")];
    const cloud = [createShift("cloud-1", "2026-08-02")];

    expect(buildShiftMigrationPlan(local, cloud, "cloud")).toMatchObject({
      conflicts: 0,
      identical: 0,
      imported: 1,
      shiftsToUpsert: local,
    });
  });

  it("クラウド優先では同じ日付の競合を変更しない", () => {
    const local = [createShift("local-1", "2026-08-01", "端末")];
    const cloud = [createShift("cloud-1", "2026-08-01", "クラウド")];

    expect(buildShiftMigrationPlan(local, cloud, "cloud")).toMatchObject({
      conflicts: 1,
      imported: 0,
      shiftsToUpsert: [],
    });
    expect(countShiftConflicts(local, cloud)).toBe(1);
  });

  it("端末優先ではクラウド側IDを維持して内容を上書きする", () => {
    const local = [createShift("local-1", "2026-08-01", "端末")];
    const cloud = [createShift("cloud-1", "2026-08-01", "クラウド")];
    const plan = buildShiftMigrationPlan(
      local,
      cloud,
      "local",
      "2026-08-27T12:00:00.000Z",
    );

    expect(plan.shiftsToUpsert[0]).toMatchObject({
      id: "cloud-1",
      note: "端末",
      updatedAt: "2026-08-27T12:00:00.000Z",
    });
  });

  it("内容が同じ勤務は再送しない", () => {
    const local = [createShift("local-1", "2026-08-01")];
    const cloud = [createShift("cloud-1", "2026-08-01")];

    expect(buildShiftMigrationPlan(local, cloud, "local")).toMatchObject({
      conflicts: 0,
      identical: 1,
      imported: 0,
    });
  });

  it("テンプレートの差分を判定する", () => {
    const defaults = createDefaultShiftTemplates();
    const changed = structuredClone(defaults);
    changed.day.startTime = "09:00";

    expect(areShiftTemplatesEqual(defaults, defaults)).toBe(true);
    expect(areShiftTemplatesEqual(defaults, changed)).toBe(false);
  });
});
