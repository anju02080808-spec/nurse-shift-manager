import { CONFIGURABLE_SHIFT_TYPES } from "@/lib/shiftTemplates";
import type { Database } from "@/types/database";
import type { ShiftRecord, ShiftType } from "@/types/shift";
import type {
  ConfigurableShiftType,
  ShiftTemplates,
} from "@/types/shiftTemplate";

type ShiftRow = Database["public"]["Tables"]["shifts"]["Row"];
type ShiftInsert = Database["public"]["Tables"]["shifts"]["Insert"];
type TemplateRow = Database["public"]["Tables"]["shift_templates"]["Row"];
type TemplateInsert = Database["public"]["Tables"]["shift_templates"]["Insert"];

function toMinuteTime(value: string | null): string | null {
  return value === null ? null : value.slice(0, 5);
}

export function mapShiftRow(row: ShiftRow): ShiftRecord {
  return {
    id: row.client_id,
    date: row.date,
    type: row.type as ShiftType,
    startTime: toMinuteTime(row.start_time),
    endTime: toMinuteTime(row.end_time),
    endsNextDay: row.ends_next_day,
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapShiftInsert(shift: ShiftRecord): ShiftInsert {
  return {
    client_id: shift.id,
    date: shift.date,
    type: shift.type,
    start_time: shift.startTime,
    end_time: shift.endTime,
    ends_next_day: shift.endsNextDay,
    note: shift.note,
    created_at: shift.createdAt,
    updated_at: shift.updatedAt,
  };
}

export function mapTemplateRows(
  rows: TemplateRow[],
  defaults: ShiftTemplates,
): ShiftTemplates {
  const templates = structuredClone(defaults);

  for (const row of rows) {
    if (
      CONFIGURABLE_SHIFT_TYPES.includes(
        row.shift_type as ConfigurableShiftType,
      )
    ) {
      templates[row.shift_type as ConfigurableShiftType] = {
        startTime: toMinuteTime(row.start_time) ?? "",
        endTime: toMinuteTime(row.end_time) ?? "",
      };
    }
  }

  return templates;
}

export function mapTemplateInserts(
  templates: ShiftTemplates,
): TemplateInsert[] {
  return CONFIGURABLE_SHIFT_TYPES.map((shiftType) => ({
    shift_type: shiftType,
    start_time: templates[shiftType].startTime,
    end_time: templates[shiftType].endTime,
  }));
}
