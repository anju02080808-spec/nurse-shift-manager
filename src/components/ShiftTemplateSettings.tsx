"use client";

import { useEffect, useState } from "react";
import { SHIFT_TYPE_LABELS } from "@/lib/shiftConstants";
import {
  cloneShiftTemplates,
  CONFIGURABLE_SHIFT_TYPES,
  validateShiftTemplates,
} from "@/lib/shiftTemplates";
import { inferEndsNextDay } from "@/lib/shiftUtils";
import type {
  ConfigurableShiftType,
  ShiftTemplates,
  ShiftTimeTemplate,
} from "@/types/shiftTemplate";

interface ShiftTemplateSettingsProps {
  templates: ShiftTemplates;
  onClose: () => void;
  onReset: () => void;
  onSave: (templates: ShiftTemplates) => void;
}

export default function ShiftTemplateSettings({
  templates,
  onClose,
  onReset,
  onSave,
}: ShiftTemplateSettingsProps) {
  const [draft, setDraft] = useState(() => cloneShiftTemplates(templates));
  const [errors, setErrors] = useState(
    () => validateShiftTemplates(templates),
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function updateTime(
    type: ConfigurableShiftType,
    field: keyof ShiftTimeTemplate,
    value: string,
  ) {
    setDraft((current) => ({
      ...current,
      [type]: { ...current[type], [field]: value },
    }));
    setErrors((current) => ({ ...current, [type]: undefined }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateShiftTemplates(draft);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    onSave(cloneShiftTemplates(draft));
  }

  return (
    <div
      className="editor-backdrop"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        className="editor-sheet template-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="template-settings-title"
      >
        <div className="sheet-handle" aria-hidden="true" />
        <div className="sheet-header">
          <div>
            <p className="card-kicker">SHIFT TEMPLATES</p>
            <h2 id="template-settings-title">勤務テンプレート設定</h2>
            <p className="editor-date">新しく登録する勤務の初期時刻に反映します。</p>
          </div>
          <button
            className="icon-button"
            type="button"
            onClick={onClose}
            aria-label="閉じる"
          >
            ×
          </button>
        </div>

        <form className="template-form" onSubmit={handleSubmit}>
          <div className="template-list">
            {CONFIGURABLE_SHIFT_TYPES.map((type) => {
              const template = draft[type];
              const endsNextDay = inferEndsNextDay(
                template.startTime,
                template.endTime,
              );

              return (
                <fieldset className="template-row" key={type}>
                  <legend>
                    <span className={`summary-dot dot-${type}`} aria-hidden="true" />
                    {SHIFT_TYPE_LABELS[type]}
                    {endsNextDay && <em>翌日終了</em>}
                  </legend>
                  <div className="template-time-fields">
                    <label>
                      <span>開始</span>
                      <input
                        aria-label={`${SHIFT_TYPE_LABELS[type]}の開始時刻`}
                        onChange={(event) =>
                          updateTime(type, "startTime", event.target.value)
                        }
                        type="time"
                        value={template.startTime}
                      />
                    </label>
                    <span className="time-separator" aria-hidden="true">→</span>
                    <label>
                      <span>終了</span>
                      <input
                        aria-label={`${SHIFT_TYPE_LABELS[type]}の終了時刻`}
                        onChange={(event) =>
                          updateTime(type, "endTime", event.target.value)
                        }
                        type="time"
                        value={template.endTime}
                      />
                    </label>
                  </div>
                  {errors[type] && (
                    <p className="template-error" role="alert">{errors[type]}</p>
                  )}
                </fieldset>
              );
            })}
          </div>

          <p className="template-notice">
            設定を変更しても、すでに登録済みの勤務時刻は変わりません。
          </p>

          <div className="editor-actions template-actions">
            <button className="reset-button" onClick={onReset} type="button">
              標準設定に戻す
            </button>
            <button className="primary-button" type="submit">設定を保存</button>
          </div>
        </form>
      </section>
    </div>
  );
}
