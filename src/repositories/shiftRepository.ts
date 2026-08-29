import type { ShiftRecord } from "@/types/shift";

export interface ShiftRepository {
  list(): Promise<ShiftRecord[]>;
  upsert(shift: ShiftRecord): Promise<boolean>;
  upsertMany(shifts: ShiftRecord[]): Promise<boolean>;
  remove(shiftId: string): Promise<boolean>;
  removeMany(shiftIds: string[]): Promise<boolean>;
  clear(): Promise<boolean>;
  getLastError?(): string | null;
}
