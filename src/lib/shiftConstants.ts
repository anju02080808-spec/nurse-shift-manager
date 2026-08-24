import type { ShiftType } from "@/types/shift";

export const SHIFT_TYPE_LABELS: Record<ShiftType, string> = {
  day: "日勤",
  night: "夜勤",
  postNight: "夜勤明け",
  early: "早出",
  late: "遅出",
  off: "休み",
  paidLeave: "有給",
  other: "その他",
};

export const SHIFT_TYPES: ShiftType[] = [
  "day",
  "night",
  "postNight",
  "early",
  "late",
  "off",
  "paidLeave",
  "other",
];

export const DEFAULT_SHIFT_TIMES: Partial<
  Record<ShiftType, { startTime: string; endTime: string }>
> = {
  day: { startTime: "08:30", endTime: "17:15" },
  night: { startTime: "16:30", endTime: "09:00" },
  early: { startTime: "07:00", endTime: "15:45" },
  late: { startTime: "10:30", endTime: "19:15" },
};

export const SUMMARY_TYPES: Array<{
  type: "day" | "night" | "early" | "late" | "off" | "paidLeave";
  label: string;
}> = [
  { type: "day", label: "日勤" },
  { type: "night", label: "夜勤" },
  { type: "early", label: "早出" },
  { type: "late", label: "遅出" },
  { type: "off", label: "休み" },
  { type: "paidLeave", label: "有給" },
];

export const NEXT_SHIFT_EXCLUDED_TYPES: ShiftType[] = [
  "off",
  "paidLeave",
  "postNight",
];
