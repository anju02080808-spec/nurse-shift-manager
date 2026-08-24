import {
  DEFAULT_SHIFT_TIMES,
  NEXT_SHIFT_EXCLUDED_TYPES,
  SHIFT_TYPE_LABELS,
} from "@/lib/shiftConstants";
import type {
  MonthlySummaryShiftType,
  ShiftRecord,
  ShiftType,
} from "@/types/shift";

export interface CalendarDay {
  dateKey: string;
  dayNumber: number;
}

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isValidDateKey(dateKey: string): boolean {
  if (!DATE_KEY_PATTERN.test(dateKey)) {
    return false;
  }

  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

export function dateToKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function keyToDate(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function getTodayKey(date = new Date()): string {
  return dateToKey(date);
}

export function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function addDays(dateKey: string, amount: number): string {
  const date = keyToDate(dateKey);
  date.setDate(date.getDate() + amount);
  return dateToKey(date);
}

export function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

export function getCalendarDays(month: Date): CalendarDay[] {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  return Array.from({ length: daysInMonth }, (_, index) => {
    const dayNumber = index + 1;
    return {
      dateKey: dateToKey(new Date(year, monthIndex, dayNumber)),
      dayNumber,
    };
  });
}

export function getMonthStartWeekday(month: Date): number {
  return new Date(month.getFullYear(), month.getMonth(), 1).getDay();
}

export function formatMonthTitle(month: Date): string {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
  }).format(month);
}

export function formatLongDate(dateKey: string): string {
  return new Intl.DateTimeFormat("ja-JP", {
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(keyToDate(dateKey));
}

export function formatShortDate(dateKey: string): string {
  const date = keyToDate(dateKey);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export function inferEndsNextDay(
  startTime: string | null,
  endTime: string | null,
): boolean {
  return Boolean(startTime && endTime && endTime < startTime);
}

export function getShiftEndDate(record: ShiftRecord): string {
  return record.endsNextDay ? addDays(record.date, 1) : record.date;
}

export function formatShiftTimeRange(record: ShiftRecord): string {
  if (!record.startTime || !record.endTime) {
    return "時間指定なし";
  }

  if (record.endsNextDay) {
    return `${formatShortDate(record.date)} ${record.startTime} - ${formatShortDate(getShiftEndDate(record))} ${record.endTime}`;
  }

  return `${record.startTime} - ${record.endTime}`;
}

export function formatShiftCompactTime(record: ShiftRecord): string {
  if (!record.startTime || !record.endTime) {
    return "";
  }

  return record.endsNextDay
    ? `${record.startTime} → ${record.endTime}`
    : `${record.startTime} - ${record.endTime}`;
}

export function getDefaultTimes(type: ShiftType): {
  startTime: string | null;
  endTime: string | null;
} {
  const times = DEFAULT_SHIFT_TIMES[type];
  return times
    ? { startTime: times.startTime, endTime: times.endTime }
    : { startTime: null, endTime: null };
}

export function createShiftId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `shift-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createShiftRecord(
  date: string,
  type: ShiftType,
  note = "",
): ShiftRecord {
  const times = getDefaultTimes(type);
  const now = new Date().toISOString();
  return {
    id: createShiftId(),
    date,
    type,
    startTime: times.startTime,
    endTime: times.endTime,
    endsNextDay: inferEndsNextDay(times.startTime, times.endTime),
    note,
    createdAt: now,
    updatedAt: now,
  };
}

export function findNextShift(
  shifts: ShiftRecord[],
  todayKey: string,
): ShiftRecord | null {
  return (
    shifts
      .filter(
        (shift) =>
          shift.date >= todayKey &&
          !NEXT_SHIFT_EXCLUDED_TYPES.includes(shift.type),
      )
      .sort((a, b) => {
        const dateOrder = a.date.localeCompare(b.date);
        if (dateOrder !== 0) {
          return dateOrder;
        }

        return (a.startTime ?? "99:99").localeCompare(b.startTime ?? "99:99");
      })[0] ?? null
  );
}

export function getMonthlySummary(
  shifts: ShiftRecord[],
  monthKey: string,
): Record<MonthlySummaryShiftType, number> {
  const summary: Record<MonthlySummaryShiftType, number> = {
    day: 0,
    night: 0,
    early: 0,
    late: 0,
    off: 0,
    paidLeave: 0,
  };

  for (const shift of shifts) {
    if (shift.date.startsWith(`${monthKey}-`) && shift.type in summary) {
      summary[shift.type as MonthlySummaryShiftType] += 1;
    }
  }

  return summary;
}

export function getShiftLabel(type: ShiftType): string {
  return SHIFT_TYPE_LABELS[type];
}
