import { clearShifts, loadShifts, saveShifts } from "@/lib/storage";
import type { ShiftRepository } from "@/repositories/shiftRepository";
import type { ShiftRecord } from "@/types/shift";

export class LocalShiftRepository implements ShiftRepository {
  private shifts: ShiftRecord[] | null = null;

  constructor(private readonly storage?: Storage | null) {}

  async list(): Promise<ShiftRecord[]> {
    this.shifts = loadShifts(this.storage);
    return [...this.shifts];
  }

  async upsert(shift: ShiftRecord): Promise<boolean> {
    const shifts = this.getCachedShifts();
    this.shifts = shifts.some((item) => item.id === shift.id)
      ? shifts.map((item) => (item.id === shift.id ? shift : item))
      : [...shifts, shift];

    return saveShifts(this.shifts, this.storage);
  }

  async upsertMany(nextShifts: ShiftRecord[]): Promise<boolean> {
    const shiftsById = new Map(
      this.getCachedShifts().map((shift) => [shift.id, shift]),
    );

    for (const shift of nextShifts) {
      shiftsById.set(shift.id, shift);
    }

    this.shifts = [...shiftsById.values()];
    return saveShifts(this.shifts, this.storage);
  }

  async remove(shiftId: string): Promise<boolean> {
    return this.removeMany([shiftId]);
  }

  async removeMany(shiftIds: string[]): Promise<boolean> {
    const ids = new Set(shiftIds);
    this.shifts = this.getCachedShifts().filter(
      (shift) => !ids.has(shift.id),
    );
    return saveShifts(this.shifts, this.storage);
  }

  async clear(): Promise<boolean> {
    this.shifts = [];
    return clearShifts(this.storage);
  }

  private getCachedShifts(): ShiftRecord[] {
    if (this.shifts === null) {
      this.shifts = loadShifts(this.storage);
    }

    return this.shifts;
  }
}
