import { CONFIGURABLE_SHIFT_TYPES } from "@/lib/shiftTemplates";
import type { ShiftRecord } from "@/types/shift";
import type { ShiftTemplates } from "@/types/shiftTemplate";

export type MigrationConflictChoice = "cloud" | "local";

export interface ShiftMigrationPlan {
  conflicts: number;
  identical: number;
  imported: number;
  shiftsToUpsert: ShiftRecord[];
}

function hasSameShiftContents(a: ShiftRecord, b: ShiftRecord): boolean {
  return (
    a.date === b.date &&
    a.type === b.type &&
    a.startTime === b.startTime &&
    a.endTime === b.endTime &&
    a.endsNextDay === b.endsNextDay &&
    a.note === b.note
  );
}

export function buildShiftMigrationPlan(
  localShifts: ShiftRecord[],
  cloudShifts: ShiftRecord[],
  choice: MigrationConflictChoice,
  now: string = new Date().toISOString(),
): ShiftMigrationPlan {
  const cloudByDate = new Map(
    cloudShifts.map((shift) => [shift.date, shift]),
  );
  const shiftsToUpsert: ShiftRecord[] = [];
  let conflicts = 0;
  let identical = 0;
  let imported = 0;

  for (const localShift of localShifts) {
    const cloudShift = cloudByDate.get(localShift.date);
    if (!cloudShift) {
      shiftsToUpsert.push(localShift);
      imported += 1;
      continue;
    }

    if (hasSameShiftContents(localShift, cloudShift)) {
      identical += 1;
      continue;
    }

    conflicts += 1;
    if (choice === "local") {
      shiftsToUpsert.push({
        ...localShift,
        id: cloudShift.id,
        createdAt: cloudShift.createdAt,
        updatedAt: now,
      });
      imported += 1;
    }
  }

  return { conflicts, identical, imported, shiftsToUpsert };
}

export function countShiftConflicts(
  localShifts: ShiftRecord[],
  cloudShifts: ShiftRecord[],
): number {
  return buildShiftMigrationPlan(localShifts, cloudShifts, "cloud").conflicts;
}

export function areShiftTemplatesEqual(
  a: ShiftTemplates,
  b: ShiftTemplates,
): boolean {
  return CONFIGURABLE_SHIFT_TYPES.every(
    (type) =>
      a[type].startTime === b[type].startTime &&
      a[type].endTime === b[type].endTime,
  );
}
