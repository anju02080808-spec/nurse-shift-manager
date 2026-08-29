import { describe, expect, it } from "vitest";
import {
  applyShiftChanges,
  AUTO_POST_NIGHT_NOTE,
  getAutoPostNightId,
  planNightShiftDeletion,
  planNightShiftSave,
} from "@/lib/nightShiftAutomation";
import { createShiftRecord } from "@/lib/shiftUtils";
import type { ShiftRecord, ShiftType } from "@/types/shift";

function shift(
  date: string,
  type: ShiftType,
  overrides: Partial<ShiftRecord> = {},
): ShiftRecord {
  return { ...createShiftRecord(date, type), ...overrides };
}

describe("night shift automation", () => {
  it("夜勤を登録すると翌日に夜勤明けを追加する", () => {
    const night = shift("2026-08-31", "night", { id: "night-1" });
    const plan = planNightShiftSave(
      [],
      null,
      night,
      "2026-08-29T00:00:00.000Z",
    );

    expect(plan.addedPostNightDate).toBe("2026-09-01");
    expect(plan.blockedPostNightDate).toBeNull();
    expect(plan.shiftsToUpsert).toHaveLength(2);
    expect(plan.shiftsToUpsert[1]).toMatchObject({
      id: getAutoPostNightId(night.id),
      date: "2026-09-01",
      type: "postNight",
      startTime: null,
      endTime: null,
      endsNextDay: false,
      note: AUTO_POST_NIGHT_NOTE,
    });
  });

  it("翌日に別の勤務がある場合は上書きしない", () => {
    const night = shift("2026-08-25", "night", { id: "night-2" });
    const nextDay = shift("2026-08-26", "day");
    const plan = planNightShiftSave([nextDay], null, night);

    expect(plan.shiftsToUpsert).toEqual([night]);
    expect(plan.addedPostNightDate).toBeNull();
    expect(plan.blockedPostNightDate).toBe("2026-08-26");
  });

  it("夜勤を別区分へ変更すると連動した夜勤明けだけを削除する", () => {
    const night = shift("2026-08-25", "night", { id: "night-3" });
    const linkedPostNight = shift("2026-08-26", "postNight", {
      id: getAutoPostNightId(night.id),
    });
    const changed = { ...night, type: "day" as const };
    const plan = planNightShiftSave(
      [night, linkedPostNight],
      night,
      changed,
    );

    expect(plan.shiftIdsToRemove).toEqual([linkedPostNight.id]);
  });

  it("自動勤務が別区分へ編集済みなら連動削除しない", () => {
    const night = shift("2026-08-25", "night", { id: "night-4" });
    const editedNextDay = shift("2026-08-26", "day", {
      id: getAutoPostNightId(night.id),
    });
    const changed = { ...night, type: "off" as const };
    const plan = planNightShiftSave(
      [night, editedNextDay],
      night,
      changed,
    );

    expect(plan.shiftIdsToRemove).toEqual([]);
  });

  it("夜勤の削除時は連動した夜勤明けも削除対象にする", () => {
    const night = shift("2026-12-31", "night", { id: "night-5" });
    const linkedPostNight = shift("2027-01-01", "postNight", {
      id: getAutoPostNightId(night.id),
    });

    expect(planNightShiftDeletion([night, linkedPostNight], night)).toEqual([
      night.id,
      linkedPostNight.id,
    ]);
    expect(
      applyShiftChanges([night, linkedPostNight], [], [night.id, linkedPostNight.id]),
    ).toEqual([]);
  });
});
