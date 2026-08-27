import { describe, expect, it } from "vitest";
import {
  hasCompletedCloudMigration,
  markCloudMigrationCompleted,
} from "@/lib/cloudMigrationStorage";

class MemoryStorage implements Storage {
  private values = new Map<string, string>();
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

describe("cloud migration storage", () => {
  it("ユーザーごとに移行完了を記録する", () => {
    const storage = new MemoryStorage();
    expect(hasCompletedCloudMigration("user-a", storage)).toBe(false);
    expect(markCloudMigrationCompleted("user-a", storage)).toBe(true);
    expect(hasCompletedCloudMigration("user-a", storage)).toBe(true);
    expect(hasCompletedCloudMigration("user-b", storage)).toBe(false);
  });

  it("破損データと利用不可を未完了として扱う", () => {
    const storage = new MemoryStorage();
    storage.setItem(
      "nurse-shift-manager:cloud-migration:v1:user-a",
      "broken",
    );
    expect(hasCompletedCloudMigration("user-a", storage)).toBe(false);
    expect(markCloudMigrationCompleted("user-a", null)).toBe(false);
  });
});
