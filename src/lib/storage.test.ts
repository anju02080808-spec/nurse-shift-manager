import { describe, expect, it } from "vitest";
import { STORAGE_KEY, loadShifts, saveShifts } from "@/lib/storage";
import { createShiftRecord } from "@/lib/shiftUtils";

function memoryStorage(initialValue?: string): Storage {
  let value = initialValue ?? null;
  return {
    getItem: () => value,
    setItem: (_key, nextValue) => {
      value = nextValue;
    },
    removeItem: () => {
      value = null;
    },
    clear: () => {
      value = null;
    },
    key: () => null,
    get length() {
      return value === null ? 0 : 1;
    },
  } as Storage;
}

describe("shift storage", () => {
  it("loads and saves the versioned storage format", () => {
    const storage = memoryStorage();
    const shifts = [createShiftRecord("2026-08-25", "night")];

    expect(saveShifts(shifts, storage)).toBe(true);
    expect(loadShifts(storage)).toEqual(shifts);
    expect(storage.getItem(STORAGE_KEY)).toContain('"version":1');
  });

  it("returns an empty list for broken or unexpected JSON", () => {
    expect(loadShifts(memoryStorage("not-json"))).toEqual([]);
    expect(loadShifts(memoryStorage(JSON.stringify({ version: 1, shifts: "nope" })))).toEqual([]);
    expect(
      loadShifts(
        memoryStorage(
          JSON.stringify({
            version: 1,
            shifts: [{ id: "bad", type: "day" }],
          }),
        ),
      ),
    ).toEqual([]);
  });
});
