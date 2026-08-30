import { createAutoPostNightShift } from "@/lib/nightShiftAutomation";
import {
  addDays,
  dateToKey,
  getDefaultTimes,
  getMonthKey,
  inferEndsNextDay,
} from "@/lib/shiftUtils";
import { saveShifts } from "@/lib/storage";
import { createMemoryStorage } from "@/lib/memoryStorage";
import type { ShiftRecord, ShiftType } from "@/types/shift";

const DEMO_TIMESTAMP = "2026-01-01T00:00:00.000Z";

function createDemoShift(
  date: string,
  type: ShiftType,
  note: string,
): ShiftRecord {
  const times = getDefaultTimes(type);

  return {
    id: `portfolio-demo:${date}:${type}`,
    date,
    type,
    startTime: times.startTime,
    endTime: times.endTime,
    endsNextDay: inferEndsNextDay(times.startTime, times.endTime),
    note,
    createdAt: DEMO_TIMESTAMP,
    updatedAt: DEMO_TIMESTAMP,
  };
}

export function createPortfolioDemoShifts(referenceDate: Date): ShiftRecord[] {
  const monthKey = getMonthKey(referenceDate);
  const definitions: Array<{ day: number; type: ShiftType; note: string }> = [
    { day: 1, type: "day", note: "病棟勤務" },
    { day: 3, type: "night", note: "夜勤サンプル" },
    { day: 7, type: "off", note: "" },
    { day: 10, type: "early", note: "早出サンプル" },
    { day: 14, type: "late", note: "遅出サンプル" },
    { day: 20, type: "paidLeave", note: "" },
    { day: 25, type: "day", note: "リーダー業務" },
  ];
  const daysInMonth = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth() + 1,
    0,
  ).getDate();
  const shifts = definitions
    .filter(({ day }) => day <= daysInMonth)
    .map(({ day, type, note }) =>
      createDemoShift(
        `${monthKey}-${String(day).padStart(2, "0")}`,
        type,
        note,
      ),
    );
  const nightShift = shifts.find((shift) => shift.type === "night");

  if (nightShift) {
    shifts.push(createAutoPostNightShift(nightShift, DEMO_TIMESTAMP));
  }

  const occupiedDates = new Set(shifts.map((shift) => shift.date));
  let nextDate = addDays(dateToKey(referenceDate), 1);
  while (occupiedDates.has(nextDate)) {
    nextDate = addDays(nextDate, 1);
  }
  shifts.push(createDemoShift(nextDate, "day", "次の勤務サンプル"));

  return shifts.sort((a, b) => a.date.localeCompare(b.date));
}

export function createPortfolioDemoStorage(referenceDate = new Date()): Storage {
  const storage = createMemoryStorage();
  saveShifts(createPortfolioDemoShifts(referenceDate), storage);
  return storage;
}
