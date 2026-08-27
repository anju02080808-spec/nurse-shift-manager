import { describe, expect, it } from "vitest";
import { createDefaultShiftTemplates } from "@/lib/shiftTemplates";
import { LocalShiftTemplateRepository } from "@/repositories/localShiftTemplateRepository";

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

describe("LocalShiftTemplateRepository", () => {
  it("loads, saves, and resets templates", async () => {
    const repository = new LocalShiftTemplateRepository(memoryStorage());
    const templates = createDefaultShiftTemplates();
    templates.day = { startTime: "09:00", endTime: "18:00" };

    expect(await repository.save(templates)).toBe(true);
    expect((await repository.load()).day).toEqual(templates.day);

    expect(await repository.reset()).toEqual(createDefaultShiftTemplates());
    expect(await repository.load()).toEqual(createDefaultShiftTemplates());
  });

  it("reports a failed reset when storage is unavailable", async () => {
    const repository = new LocalShiftTemplateRepository(null);

    expect(await repository.load()).toEqual(createDefaultShiftTemplates());
    expect(await repository.save(createDefaultShiftTemplates())).toBe(false);
    expect(await repository.reset()).toBeNull();
  });
});
