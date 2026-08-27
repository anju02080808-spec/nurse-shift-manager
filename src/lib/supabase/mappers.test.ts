import { describe, expect, it } from "vitest";
import { createDefaultShiftTemplates } from "@/lib/shiftTemplates";
import {
  mapShiftInsert,
  mapShiftRow,
  mapTemplateInserts,
  mapTemplateRows,
} from "@/lib/supabase/mappers";
import type { Database } from "@/types/database";
import type { ShiftRecord } from "@/types/shift";

describe("Supabase mappers", () => {
  it("DBの秒付き時刻をShiftRecordのHH:mmへ変換する", () => {
    const row: Database["public"]["Tables"]["shifts"]["Row"] = {
      id: "db-id",
      user_id: "user-a",
      client_id: "client-id",
      date: "2026-08-27",
      type: "night",
      start_time: "16:30:00",
      end_time: "09:00:00",
      ends_next_day: true,
      note: "夜勤",
      created_at: "2026-08-01T00:00:00.000Z",
      updated_at: "2026-08-02T00:00:00.000Z",
    };

    expect(mapShiftRow(row)).toEqual({
      id: "client-id",
      date: "2026-08-27",
      type: "night",
      startTime: "16:30",
      endTime: "09:00",
      endsNextDay: true,
      note: "夜勤",
      createdAt: "2026-08-01T00:00:00.000Z",
      updatedAt: "2026-08-02T00:00:00.000Z",
    });
  });

  it("ShiftRecordをuser_idなしのInsertへ変換する", () => {
    const shift: ShiftRecord = {
      id: "client-id",
      date: "2026-08-27",
      type: "day",
      startTime: "08:30",
      endTime: "17:15",
      endsNextDay: false,
      note: "",
      createdAt: "2026-08-01T00:00:00.000Z",
      updatedAt: "2026-08-02T00:00:00.000Z",
    };

    expect(mapShiftInsert(shift)).not.toHaveProperty("user_id");
    expect(mapShiftInsert(shift).client_id).toBe("client-id");
  });

  it("保存済みテンプレートを標準値へ安全にマージする", () => {
    const defaults = createDefaultShiftTemplates();
    const rows: Database["public"]["Tables"]["shift_templates"]["Row"][] = [
      {
        user_id: "user-a",
        shift_type: "day",
        start_time: "09:00:00",
        end_time: "18:00:00",
        created_at: "2026-08-01T00:00:00.000Z",
        updated_at: "2026-08-01T00:00:00.000Z",
      },
    ];

    expect(mapTemplateRows(rows, defaults)).toEqual({
      ...defaults,
      day: { startTime: "09:00", endTime: "18:00" },
    });
    expect(mapTemplateInserts(defaults)).toHaveLength(4);
    expect(mapTemplateInserts(defaults)[0]).not.toHaveProperty("user_id");
  });
});
