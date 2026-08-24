export type ConfigurableShiftType = "day" | "night" | "early" | "late";

export interface ShiftTimeTemplate {
  startTime: string;
  endTime: string;
}

export type ShiftTemplates = Record<ConfigurableShiftType, ShiftTimeTemplate>;

export interface ShiftTemplateStorage {
  version: 1;
  templates: ShiftTemplates;
  updatedAt: string;
}
