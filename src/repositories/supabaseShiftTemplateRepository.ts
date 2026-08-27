import type { SupabaseClient } from "@supabase/supabase-js";
import {
  mapTemplateInserts,
  mapTemplateRows,
} from "@/lib/supabase/mappers";
import {
  CONFIGURABLE_SHIFT_TYPES,
  createDefaultShiftTemplates,
} from "@/lib/shiftTemplates";
import type { ShiftTemplateRepository } from "@/repositories/shiftTemplateRepository";
import type { Database } from "@/types/database";
import type { ShiftTemplates } from "@/types/shiftTemplate";

const CLOUD_ERROR =
  "クラウドの勤務テンプレートを処理できませんでした。通信状態を確認して再試行してください。";

function getCloudError(code?: string): string {
  return code ? `${CLOUD_ERROR} (${code})` : CLOUD_ERROR;
}

export class SupabaseShiftTemplateRepository
  implements ShiftTemplateRepository
{
  private lastError: string | null = null;

  constructor(private readonly client: SupabaseClient<Database>) {}

  async load(): Promise<ShiftTemplates> {
    this.lastError = null;
    try {
      const { data, error } = await this.client
        .from("shift_templates")
        .select("*");

      if (error) {
        this.lastError = getCloudError(error.code);
        return createDefaultShiftTemplates();
      }

      return mapTemplateRows(data, createDefaultShiftTemplates());
    } catch {
      this.lastError = CLOUD_ERROR;
      return createDefaultShiftTemplates();
    }
  }

  async save(templates: ShiftTemplates): Promise<boolean> {
    this.lastError = null;
    try {
      const { error } = await this.client
        .from("shift_templates")
        .upsert(mapTemplateInserts(templates), {
          onConflict: "user_id,shift_type",
        });

      if (error) {
        this.lastError = getCloudError(error.code);
        return false;
      }

      return true;
    } catch {
      this.lastError = CLOUD_ERROR;
      return false;
    }
  }

  async reset(): Promise<ShiftTemplates | null> {
    this.lastError = null;
    try {
      const { error } = await this.client
        .from("shift_templates")
        .delete()
        .in("shift_type", CONFIGURABLE_SHIFT_TYPES);

      if (error) {
        this.lastError = getCloudError(error.code);
        return null;
      }

      return createDefaultShiftTemplates();
    } catch {
      this.lastError = CLOUD_ERROR;
      return null;
    }
  }

  getLastError(): string | null {
    return this.lastError;
  }
}
