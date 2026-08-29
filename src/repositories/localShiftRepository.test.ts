import { describe, expect, it } from "vitest";
import { LocalShiftRepository } from "@/repositories/localShiftRepository";
import { createShiftRecord } from "@/lib/shiftUtils";

function memoryStorage(): Storage {
  const values = new Map<string, string>();

  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
    clear: () => values.clear(),
    key: (index) => [...values.keys()][index] ?? null,
    get length() {
      return values.size;
    },
  } as Storage;
}

describe("LocalShiftRepository", () => {
  it("supports listing, inserting, updating, and removing shifts", async () => {
    const repository = new LocalShiftRepository(memoryStorage());
    const dayShift = createShiftRecord("2026-08-25", "day");
    const nightShift = createShiftRecord("2026-08-26", "night");

    expect(await repository.list()).toEqual([]);
    expect(await repository.upsert(dayShift)).toBe(true);
    expect(await repository.upsertMany([nightShift])).toBe(true);

    const updatedDayShift = { ...dayShift, note: "更新済み" };
    expect(await repository.upsert(updatedDayShift)).toBe(true);
    expect(await repository.list()).toEqual([updatedDayShift, nightShift]);

    expect(await repository.remove(dayShift.id)).toBe(true);
    expect(await repository.list()).toEqual([nightShift]);
  });

  it("removes linked shifts together", async () => {
    const repository = new LocalShiftRepository(memoryStorage());
    const nightShift = createShiftRecord("2026-08-25", "night");
    const postNightShift = createShiftRecord("2026-08-26", "postNight");
    const dayShift = createShiftRecord("2026-08-27", "day");

    await repository.upsertMany([nightShift, postNightShift, dayShift]);
    expect(
      await repository.removeMany([nightShift.id, postNightShift.id]),
    ).toBe(true);
    expect(await repository.list()).toEqual([dayShift]);
  });

  it("clears all shifts without affecting the repository contract", async () => {
    const repository = new LocalShiftRepository(memoryStorage());
    const shift = createShiftRecord("2026-08-25", "day");

    await repository.upsert(shift);
    expect(await repository.clear()).toBe(true);
    expect(await repository.list()).toEqual([]);
  });

  it("reports unavailable storage without throwing", async () => {
    const repository = new LocalShiftRepository(null);
    const shift = createShiftRecord("2026-08-25", "day");

    expect(await repository.list()).toEqual([]);
    expect(await repository.upsert(shift)).toBe(false);
    expect(await repository.remove(shift.id)).toBe(false);
    expect(await repository.clear()).toBe(false);
  });
});
