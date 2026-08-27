const MIGRATION_STORAGE_PREFIX =
  "nurse-shift-manager:cloud-migration:v1";

type MigrationStorage = {
  completedAt: string;
  version: 1;
};

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

function getKey(userId: string): string {
  return `${MIGRATION_STORAGE_PREFIX}:${userId}`;
}

export function hasCompletedCloudMigration(
  userId: string,
  storage: Storage | null = getBrowserStorage(),
): boolean {
  if (!storage) {
    return false;
  }

  try {
    const raw = storage.getItem(getKey(userId));
    if (!raw) {
      return false;
    }

    const value: unknown = JSON.parse(raw);
    return (
      typeof value === "object" &&
      value !== null &&
      "version" in value &&
      value.version === 1 &&
      "completedAt" in value &&
      typeof value.completedAt === "string"
    );
  } catch {
    return false;
  }
}

export function markCloudMigrationCompleted(
  userId: string,
  storage: Storage | null = getBrowserStorage(),
): boolean {
  if (!storage) {
    return false;
  }

  try {
    const value: MigrationStorage = {
      version: 1,
      completedAt: new Date().toISOString(),
    };
    storage.setItem(getKey(userId), JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
