import type { SupabaseClient } from "@supabase/supabase-js";
import { mapShiftInsert, mapShiftRow } from "@/lib/supabase/mappers";
import type { ShiftRepository } from "@/repositories/shiftRepository";
import type { Database } from "@/types/database";
import type { ShiftRecord } from "@/types/shift";

const CLOUD_ERROR =
  "クラウド勤務データを処理できませんでした。通信状態を確認して再試行してください。";

function getCloudError(code?: string): string {
  return code ? `${CLOUD_ERROR} (${code})` : CLOUD_ERROR;
}

export class SupabaseShiftRepository implements ShiftRepository {
  private lastError: string | null = null;

  constructor(private readonly client: SupabaseClient<Database>) {}

  async list(): Promise<ShiftRecord[]> {
    this.lastError = null;
    try {
      const { data, error } = await this.client
        .from("shifts")
        .select("*")
        .order("date", { ascending: true });

      if (error) {
        this.lastError = getCloudError(error.code);
        return [];
      }

      return data.map(mapShiftRow);
    } catch {
      this.lastError = CLOUD_ERROR;
      return [];
    }
  }

  async upsert(shift: ShiftRecord): Promise<boolean> {
    return this.upsertMany([shift]);
  }

  async upsertMany(shifts: ShiftRecord[]): Promise<boolean> {
    this.lastError = null;
    if (shifts.length === 0) {
      return true;
    }

    try {
      const { error } = await this.client
        .from("shifts")
        .upsert(shifts.map(mapShiftInsert), {
          onConflict: "user_id,client_id",
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

  async remove(shiftId: string): Promise<boolean> {
    this.lastError = null;
    try {
      const { error } = await this.client
        .from("shifts")
        .delete()
        .eq("client_id", shiftId);

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

  async clear(): Promise<boolean> {
    this.lastError = null;
    try {
      const { error } = await this.client
        .from("shifts")
        .delete()
        .neq("client_id", "");

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

  getLastError(): string | null {
    return this.lastError;
  }
}
