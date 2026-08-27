import type { ShiftTemplates } from "@/types/shiftTemplate";

export interface ShiftTemplateRepository {
  load(): Promise<ShiftTemplates>;
  save(templates: ShiftTemplates): Promise<boolean>;
  reset(): Promise<ShiftTemplates | null>;
  getLastError?(): string | null;
}
