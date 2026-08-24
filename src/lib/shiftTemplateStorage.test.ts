import { describe, expect, it } from "vitest";
import {
  SHIFT_TEMPLATE_STORAGE_KEY,
  loadShiftTemplates,
  resetShiftTemplates,
  saveShiftTemplates,
} from "@/lib/shiftTemplateStorage";
import { createDefaultShiftTemplates } from "@/lib/shiftTemplates";

function memoryStorage(initialValue?: string): Storage {
  const values = new Map<string, string>();
  if (initialValue !== undefined) {
    values.set(SHIFT_TEMPLATE_STORAGE_KEY, initialValue);
  }

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

describe("shift template storage", () => {
  it("saves and loads templates from their own versioned key", () => {
    const storage = memoryStorage();
    const templates = createDefaultShiftTemplates();
    templates.day = { startTime: "09:00", endTime: "18:00" };

    expect(saveShiftTemplates(templates, storage)).toBe(true);
    expect(loadShiftTemplates(storage).day).toEqual({
      startTime: "09:00",
      endTime: "18:00",
    });
    expect(storage.getItem(SHIFT_TEMPLATE_STORAGE_KEY)).toContain('"version":1');
  });

  it("falls back to defaults for broken data", () => {
    expect(loadShiftTemplates(memoryStorage("not-json"))).toEqual(
      createDefaultShiftTemplates(),
    );
    expect(
      loadShiftTemplates(memoryStorage(JSON.stringify({ version: 2, templates: {} }))),
    ).toEqual(createDefaultShiftTemplates());
  });

  it("removes saved templates when resetting", () => {
    const storage = memoryStorage();
    saveShiftTemplates(createDefaultShiftTemplates(), storage);

    expect(resetShiftTemplates(storage)).toBe(true);
    expect(storage.getItem(SHIFT_TEMPLATE_STORAGE_KEY)).toBeNull();
    expect(loadShiftTemplates(storage)).toEqual(createDefaultShiftTemplates());
  });

  it("handles unavailable storage without throwing", () => {
    expect(loadShiftTemplates(null)).toEqual(createDefaultShiftTemplates());
    expect(saveShiftTemplates(createDefaultShiftTemplates(), null)).toBe(false);
    expect(resetShiftTemplates(null)).toBe(false);
  });
});
