import { SHIFT_TYPE_LABELS } from "@/lib/shiftConstants";
import { isValidDateKey } from "@/lib/shiftUtils";
import type { ShiftRecord, ShiftStorage } from "@/types/shift";

export const STORAGE_KEY = "nurse-shift-manager:shifts:v1";

function getBrowserStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function isTime(value: unknown): value is string | null {
  return value === null || (typeof value === "string" && /^\d{2}:\d{2}$/.test(value));
}

function isShiftRecord(value: unknown): value is ShiftRecord {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Partial<ShiftRecord>;
  return (
    typeof record.id === "string" &&
    record.id.length > 0 &&
    typeof record.date === "string" &&
    isValidDateKey(record.date) &&
    typeof record.type === "string" &&
    record.type in SHIFT_TYPE_LABELS &&
    isTime(record.startTime) &&
    isTime(record.endTime) &&
    typeof record.endsNextDay === "boolean" &&
    typeof record.note === "string" &&
    typeof record.createdAt === "string" &&
    typeof record.updatedAt === "string"
  );
}

export function loadShifts(storage: Storage | null = getBrowserStorage()): ShiftRecord[] {
  if (!storage) {
    return [];
  }

  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return [];
    }

    const data = parsed as Partial<ShiftStorage>;
    if (data.version !== 1 || !Array.isArray(data.shifts)) {
      return [];
    }

    return data.shifts.filter(isShiftRecord);
  } catch {
    return [];
  }
}

export function saveShifts(
  shifts: ShiftRecord[],
  storage: Storage | null = getBrowserStorage(),
): boolean {
  if (!storage) {
    return false;
  }

  try {
    const data: ShiftStorage = { version: 1, shifts };
    storage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function clearShifts(
  storage: Storage | null = getBrowserStorage(),
): boolean {
  if (!storage) {
    return false;
  }

  try {
    storage.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}
