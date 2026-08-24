"use client";

import { SHIFT_TYPE_LABELS } from "@/lib/shiftConstants";
import {
  formatShiftCompactTime,
  getCalendarDays,
  getMonthStartWeekday,
  getTodayKey,
} from "@/lib/shiftUtils";
import type { ShiftRecord } from "@/types/shift";

interface CalendarProps {
  month: Date;
  shifts: ShiftRecord[];
  onSelectDate: (date: string) => void;
}

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

export default function Calendar({ month, shifts, onSelectDate }: CalendarProps) {
  const days = getCalendarDays(month);
  const leadingDays = getMonthStartWeekday(month);
  const shiftsByDate = new Map(shifts.map((shift) => [shift.date, shift]));

  return (
    <section className="calendar-card" aria-label="月間カレンダー">
      <div className="weekday-row" role="row">
        {WEEKDAYS.map((weekday, index) => (
          <div
            className={`weekday weekday-${index}`}
            key={weekday}
            role="columnheader"
          >
            {weekday}
          </div>
        ))}
      </div>
      <div className="calendar-grid" role="grid">
        {Array.from({ length: leadingDays }, (_, index) => (
          <div className="calendar-empty" key={`empty-${index}`} aria-hidden="true" />
        ))}
        {days.map((day) => {
          const shift = shiftsByDate.get(day.dateKey);
          const isToday = day.dateKey === getTodayKey();

          return (
            <button
              className={`calendar-day${isToday ? " is-today" : ""}${shift ? " has-shift" : ""}`}
              key={day.dateKey}
              onClick={() => onSelectDate(day.dateKey)}
              type="button"
              role="gridcell"
              aria-label={`${day.dateKey}の勤務${shift ? ` ${SHIFT_TYPE_LABELS[shift.type]}` : "を登録"}`}
            >
              <span className="day-number">{day.dayNumber}</span>
              {shift ? (
                <span className={`shift-chip shift-${shift.type}`}>
                  <span className="shift-chip-label">{SHIFT_TYPE_LABELS[shift.type]}</span>
                  {formatShiftCompactTime(shift) && (
                    <span className="shift-chip-time">{formatShiftCompactTime(shift)}</span>
                  )}
                </span>
              ) : (
                <span className="day-placeholder">＋</span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
