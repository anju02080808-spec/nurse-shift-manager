import { SHIFT_TYPE_LABELS } from "@/lib/shiftConstants";
import { keyToDate } from "@/lib/shiftUtils";
import type { ShiftRecord } from "@/types/shift";

export const CSV_HEADERS = [
  "日付",
  "曜日",
  "勤務区分",
  "開始時刻",
  "終了時刻",
  "翌日終了",
  "メモ",
] as const;

const UTF8_BOM = "\uFEFF";
const CSV_LINE_BREAK = "\r\n";
const FORMULA_PREFIX_PATTERN = /^[=+\-@]/;
const JAPANESE_WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

export function protectCsvCell(value: string): string {
  return FORMULA_PREFIX_PATTERN.test(value) ? `'${value}` : value;
}

export function escapeCsvCell(value: string): string {
  const protectedValue = protectCsvCell(value);
  if (/[,"\r\n]/.test(protectedValue)) {
    return `"${protectedValue.replaceAll('"', '""')}"`;
  }

  return protectedValue;
}

export function getJapaneseWeekday(dateKey: string): string {
  return JAPANESE_WEEKDAYS[keyToDate(dateKey).getDay()];
}

export function generateShiftCsv(
  shifts: ShiftRecord[],
  monthKey: string,
): string {
  const rows = shifts
    .filter((shift) => shift.date.startsWith(`${monthKey}-`))
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((shift) => [
      shift.date,
      getJapaneseWeekday(shift.date),
      SHIFT_TYPE_LABELS[shift.type],
      shift.startTime ?? "",
      shift.endTime ?? "",
      shift.endsNextDay ? "はい" : "いいえ",
      shift.note,
    ]);

  return (
    UTF8_BOM +
    [CSV_HEADERS, ...rows]
      .map((row) => row.map((cell) => escapeCsvCell(cell)).join(","))
      .join(CSV_LINE_BREAK)
  );
}

export function getShiftCsvFilename(monthKey: string): string {
  return `nurse-shifts-${monthKey}.csv`;
}
