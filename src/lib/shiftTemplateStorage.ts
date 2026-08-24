import {
  createDefaultShiftTemplates,
  normalizeShiftTemplates,
} from "@/lib/shiftTemplates";
import type {
  ShiftTemplates,
  ShiftTemplateStorage,
} from "@/types/shiftTemplate";

export const SHIFT_TEMPLATE_STORAGE_KEY =
  "nurse-shift-manager:shift-templates:v1";

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

export function loadShiftTemplates(
  storage: Storage | null = getBrowserStorage(),
): ShiftTemplates {
  if (!storage) {
    return createDefaultShiftTemplates();
  }

  try {
    const raw = storage.getItem(SHIFT_TEMPLATE_STORAGE_KEY);
    if (!raw) {
      return createDefaultShiftTemplates();
    }

    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return createDefaultShiftTemplates();
    }

    const data = parsed as Partial<ShiftTemplateStorage>;
    if (data.version !== 1) {
      return createDefaultShiftTemplates();
    }

    return normalizeShiftTemplates(data.templates);
  } catch {
    return createDefaultShiftTemplates();
  }
}

export function saveShiftTemplates(
  templates: ShiftTemplates,
  storage: Storage | null = getBrowserStorage(),
): boolean {
  if (!storage) {
    return false;
  }

  try {
    const data: ShiftTemplateStorage = {
      version: 1,
      templates: normalizeShiftTemplates(templates),
      updatedAt: new Date().toISOString(),
    };
    storage.setItem(SHIFT_TEMPLATE_STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function resetShiftTemplates(
  storage: Storage | null = getBrowserStorage(),
): boolean {
  if (!storage) {
    return false;
  }

  try {
    storage.removeItem(SHIFT_TEMPLATE_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}
