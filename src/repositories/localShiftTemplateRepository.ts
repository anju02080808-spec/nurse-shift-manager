import {
  loadShiftTemplates,
  resetShiftTemplates,
  saveShiftTemplates,
} from "@/lib/shiftTemplateStorage";
import { createDefaultShiftTemplates } from "@/lib/shiftTemplates";
import type { ShiftTemplateRepository } from "@/repositories/shiftTemplateRepository";
import type { ShiftTemplates } from "@/types/shiftTemplate";

export class LocalShiftTemplateRepository
  implements ShiftTemplateRepository
{
  constructor(private readonly storage?: Storage | null) {}

  async load(): Promise<ShiftTemplates> {
    return loadShiftTemplates(this.storage);
  }

  async save(templates: ShiftTemplates): Promise<boolean> {
    return saveShiftTemplates(templates, this.storage);
  }

  async reset(): Promise<ShiftTemplates | null> {
    const didReset = resetShiftTemplates(this.storage);
    return didReset ? createDefaultShiftTemplates() : null;
  }
}
