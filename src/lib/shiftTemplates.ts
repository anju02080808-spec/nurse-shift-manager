import { DEFAULT_SHIFT_TIMES } from "@/lib/shiftConstants";
import type { ShiftType } from "@/types/shift";
import type {
  ConfigurableShiftType,
  ShiftTemplates,
  ShiftTimeTemplate,
} from "@/types/shiftTemplate";

export const CONFIGURABLE_SHIFT_TYPES: ConfigurableShiftType[] = [
  "day",
  "night",
  "early",
  "late",
];

const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

export function isValidTime(value: unknown): value is string {
  return typeof value === "string" && TIME_PATTERN.test(value);
}

export function isConfigurableShiftType(
  type: ShiftType,
): type is ConfigurableShiftType {
  return CONFIGURABLE_SHIFT_TYPES.includes(type as ConfigurableShiftType);
}

export function createDefaultShiftTemplates(): ShiftTemplates {
  return Object.fromEntries(
    CONFIGURABLE_SHIFT_TYPES.map((type) => {
      const defaultTimes = DEFAULT_SHIFT_TIMES[type];
      if (!defaultTimes) {
        throw new Error(`Missing default times for ${type}`);
      }

      return [type, { ...defaultTimes }];
    }),
  ) as ShiftTemplates;
}

export function cloneShiftTemplates(templates: ShiftTemplates): ShiftTemplates {
  return Object.fromEntries(
    CONFIGURABLE_SHIFT_TYPES.map((type) => [type, { ...templates[type] }]),
  ) as ShiftTemplates;
}

function isShiftTimeTemplate(value: unknown): value is ShiftTimeTemplate {
  if (!value || typeof value !== "object") {
    return false;
  }

  const template = value as Partial<ShiftTimeTemplate>;
  return isValidTime(template.startTime) && isValidTime(template.endTime);
}

export function normalizeShiftTemplates(value: unknown): ShiftTemplates {
  const defaults = createDefaultShiftTemplates();
  if (!value || typeof value !== "object") {
    return defaults;
  }

  const input = value as Partial<Record<ConfigurableShiftType, unknown>>;
  for (const type of CONFIGURABLE_SHIFT_TYPES) {
    if (isShiftTimeTemplate(input[type])) {
      defaults[type] = { ...input[type] };
    }
  }

  return defaults;
}

export type ShiftTemplateValidationErrors = Partial<
  Record<ConfigurableShiftType, string>
>;

export function validateShiftTemplates(
  templates: ShiftTemplates,
): ShiftTemplateValidationErrors {
  const errors: ShiftTemplateValidationErrors = {};

  for (const type of CONFIGURABLE_SHIFT_TYPES) {
    const template = templates[type];
    if (!isValidTime(template.startTime) || !isValidTime(template.endTime)) {
      errors[type] = "開始・終了時刻を正しく入力してください。";
    } else if (template.startTime === template.endTime) {
      errors[type] = "開始時刻と終了時刻は異なる時刻にしてください。";
    }
  }

  return errors;
}

export function getTemplateTimes(
  type: ShiftType,
  templates: ShiftTemplates,
): { startTime: string | null; endTime: string | null } {
  if (!isConfigurableShiftType(type)) {
    return { startTime: null, endTime: null };
  }

  return { ...templates[type] };
}
