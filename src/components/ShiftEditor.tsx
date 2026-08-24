"use client";

import { useEffect, useState } from "react";
import { DEFAULT_SHIFT_TIMES, SHIFT_TYPE_LABELS, SHIFT_TYPES } from "@/lib/shiftConstants";
import {
  createShiftId,
  formatLongDate,
  getDefaultTimes,
  inferEndsNextDay,
} from "@/lib/shiftUtils";
import type { ShiftRecord, ShiftType } from "@/types/shift";

interface ShiftEditorProps {
  date: string;
  existingShift: ShiftRecord | null;
  onClose: () => void;
  onSave: (shift: ShiftRecord) => void;
  onDelete: (shiftId: string) => void;
}

function getInitialValues(existingShift: ShiftRecord | null) {
  if (existingShift) {
    return {
      type: existingShift.type,
      startTime: existingShift.startTime ?? "",
      endTime: existingShift.endTime ?? "",
      note: existingShift.note,
    };
  }

  const times = getDefaultTimes("day");
  return {
    type: "day" as ShiftType,
    startTime: times.startTime ?? "",
    endTime: times.endTime ?? "",
    note: "",
  };
}

export default function ShiftEditor({
  date,
  existingShift,
  onClose,
  onSave,
  onDelete,
}: ShiftEditorProps) {
  const initialValues = getInitialValues(existingShift);
  const [type, setType] = useState<ShiftType>(initialValues.type);
  const [startTime, setStartTime] = useState(initialValues.startTime);
  const [endTime, setEndTime] = useState(initialValues.endTime);
  const [note, setNote] = useState(initialValues.note);
  const [error, setError] = useState("");

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const isTimeDisabled = type === "off" || type === "paidLeave" || type === "postNight";

  function handleTypeChange(nextType: ShiftType) {
    setType(nextType);
    const standardTimes = DEFAULT_SHIFT_TIMES[nextType];
    if (standardTimes) {
      setStartTime(standardTimes.startTime);
      setEndTime(standardTimes.endTime);
    } else if (nextType === "off" || nextType === "paidLeave" || nextType === "postNight") {
      setStartTime("");
      setEndTime("");
    } else {
      setStartTime("");
      setEndTime("");
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedStart = isTimeDisabled ? null : startTime || null;
    const normalizedEnd = isTimeDisabled ? null : endTime || null;

    if ((normalizedStart && !normalizedEnd) || (!normalizedStart && normalizedEnd)) {
      setError("開始時刻と終了時刻は両方入力してください。");
      return;
    }

    const now = new Date().toISOString();
    onSave({
      id: existingShift?.id ?? createShiftId(),
      date,
      type,
      startTime: normalizedStart,
      endTime: normalizedEnd,
      endsNextDay: inferEndsNextDay(normalizedStart, normalizedEnd),
      note: note.trim(),
      createdAt: existingShift?.createdAt ?? now,
      updatedAt: now,
    });
  }

  return (
    <div className="editor-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="editor-sheet" role="dialog" aria-modal="true" aria-labelledby="editor-title">
        <div className="sheet-handle" aria-hidden="true" />
        <div className="sheet-header">
          <div>
            <p className="card-kicker">SHIFT DETAILS</p>
            <h2 id="editor-title">{existingShift ? "勤務を編集" : "勤務を登録"}</h2>
            <p className="editor-date">{formatLongDate(date)}</p>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="閉じる">×</button>
        </div>

        <form className="editor-form" onSubmit={handleSubmit}>
          <fieldset>
            <legend>勤務区分</legend>
            <div className="shift-type-options">
              {SHIFT_TYPES.map((shiftType) => (
                <label className={`type-option${type === shiftType ? " is-selected" : ""}`} key={shiftType}>
                  <input
                    checked={type === shiftType}
                    name="shiftType"
                    onChange={() => handleTypeChange(shiftType)}
                    type="radio"
                    value={shiftType}
                  />
                  <span>{SHIFT_TYPE_LABELS[shiftType]}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="time-fields">
            <label>
              <span>開始時刻</span>
              <input
                disabled={isTimeDisabled}
                onChange={(event) => setStartTime(event.target.value)}
                type="time"
                value={startTime}
              />
            </label>
            <span className="time-separator" aria-hidden="true">→</span>
            <label>
              <span>終了時刻</span>
              <input
                disabled={isTimeDisabled}
                onChange={(event) => setEndTime(event.target.value)}
                type="time"
                value={endTime}
              />
            </label>
          </div>
          {type === "night" && <p className="field-hint">終了時刻が開始時刻より早いため、翌日終了として保存します。</p>}

          <label className="note-field">
            <span>メモ <em>任意</em></span>
            <textarea
              maxLength={200}
              onChange={(event) => setNote(event.target.value)}
              placeholder="申し送りやメモを入力"
              rows={3}
              value={note}
            />
          </label>

          {error && <p className="form-error" role="alert">{error}</p>}

          <div className="editor-actions">
            {existingShift ? (
              <button className="delete-button" onClick={() => onDelete(existingShift.id)} type="button">削除</button>
            ) : <span />}
            <button className="primary-button" type="submit">保存する</button>
          </div>
        </form>
      </section>
    </div>
  );
}
