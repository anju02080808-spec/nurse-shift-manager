import { addDays } from "@/lib/shiftUtils";
import type { ShiftRecord } from "@/types/shift";

export const AUTO_POST_NIGHT_NOTE = "前日の夜勤から自動登録";

export interface NightShiftSavePlan {
  shiftsToUpsert: ShiftRecord[];
  shiftIdsToRemove: string[];
  addedPostNightDate: string | null;
  blockedPostNightDate: string | null;
}

export function getAutoPostNightId(nightShiftId: string): string {
  return `auto-post-night:${nightShiftId}`;
}

export function createAutoPostNightShift(
  nightShift: ShiftRecord,
  timestamp = new Date().toISOString(),
): ShiftRecord {
  return {
    id: getAutoPostNightId(nightShift.id),
    date: addDays(nightShift.date, 1),
    type: "postNight",
    startTime: null,
    endTime: null,
    endsNextDay: false,
    note: AUTO_POST_NIGHT_NOTE,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function findLinkedPostNight(
  nightShift: ShiftRecord,
  shifts: ShiftRecord[],
): ShiftRecord | null {
  const linkedId = getAutoPostNightId(nightShift.id);
  return (
    shifts.find(
      (shift) => shift.id === linkedId && shift.type === "postNight",
    ) ?? null
  );
}

export function planNightShiftSave(
  shifts: ShiftRecord[],
  previousShift: ShiftRecord | null,
  savedShift: ShiftRecord,
  timestamp = new Date().toISOString(),
): NightShiftSavePlan {
  const plan: NightShiftSavePlan = {
    shiftsToUpsert: [savedShift],
    shiftIdsToRemove: [],
    addedPostNightDate: null,
    blockedPostNightDate: null,
  };

  if (previousShift?.type === "night" && savedShift.type !== "night") {
    const linkedPostNight = findLinkedPostNight(previousShift, shifts);
    if (linkedPostNight) {
      plan.shiftIdsToRemove.push(linkedPostNight.id);
    }
  }

  if (savedShift.type !== "night") {
    return plan;
  }

  const postNightDate = addDays(savedShift.date, 1);
  const linkedId = getAutoPostNightId(savedShift.id);
  const nextDayShift = shifts.find((shift) => shift.date === postNightDate);

  if (!nextDayShift) {
    plan.shiftsToUpsert.push(
      createAutoPostNightShift(savedShift, timestamp),
    );
    plan.addedPostNightDate = postNightDate;
  } else if (
    nextDayShift.id !== linkedId ||
    nextDayShift.type !== "postNight"
  ) {
    plan.blockedPostNightDate = postNightDate;
  }

  return plan;
}

export function planNightShiftDeletion(
  shifts: ShiftRecord[],
  shiftToDelete: ShiftRecord,
): string[] {
  const ids = [shiftToDelete.id];
  if (shiftToDelete.type !== "night") {
    return ids;
  }

  const linkedPostNight = findLinkedPostNight(shiftToDelete, shifts);
  if (linkedPostNight) {
    ids.push(linkedPostNight.id);
  }

  return ids;
}

export function applyShiftChanges(
  shifts: ShiftRecord[],
  shiftsToUpsert: ShiftRecord[],
  shiftIdsToRemove: string[],
): ShiftRecord[] {
  const removedIds = new Set(shiftIdsToRemove);
  const shiftsById = new Map(
    shifts
      .filter((shift) => !removedIds.has(shift.id))
      .map((shift) => [shift.id, shift]),
  );

  for (const shift of shiftsToUpsert) {
    shiftsById.set(shift.id, shift);
  }

  return [...shiftsById.values()];
}
