export type ShiftType =
  | "day"
  | "night"
  | "postNight"
  | "early"
  | "late"
  | "off"
  | "paidLeave"
  | "other";

export interface ShiftRecord {
  id: string;
  date: string;
  type: ShiftType;
  startTime: string | null;
  endTime: string | null;
  endsNextDay: boolean;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShiftStorage {
  version: 1;
  shifts: ShiftRecord[];
}

export type MonthlySummaryShiftType =
  | "day"
  | "night"
  | "early"
  | "late"
  | "off"
  | "paidLeave";
