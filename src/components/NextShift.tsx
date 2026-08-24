import { SHIFT_TYPE_LABELS } from "@/lib/shiftConstants";
import { formatLongDate, formatShiftTimeRange } from "@/lib/shiftUtils";
import type { ShiftRecord } from "@/types/shift";

interface NextShiftProps {
  shift: ShiftRecord | null;
}

export default function NextShift({ shift }: NextShiftProps) {
  return (
    <section className="info-card next-shift-card" aria-labelledby="next-shift-title">
      <div className="card-heading-row">
        <div>
          <p className="card-kicker">UP NEXT</p>
          <h2 id="next-shift-title">次の勤務</h2>
        </div>
        <span className="card-icon" aria-hidden="true">→</span>
      </div>
      {shift ? (
        <div className="next-shift-content">
          <p className="next-shift-date">{formatLongDate(shift.date)}</p>
          <p className={`next-shift-type type-${shift.type}`}>{SHIFT_TYPE_LABELS[shift.type]}</p>
          <p className="next-shift-time">{formatShiftTimeRange(shift)}</p>
          {shift.note && <p className="next-shift-note">{shift.note}</p>}
        </div>
      ) : (
        <div className="empty-card-message">
          <span className="empty-card-mark" aria-hidden="true">✓</span>
          <p>これからの勤務はありません</p>
        </div>
      )}
    </section>
  );
}
