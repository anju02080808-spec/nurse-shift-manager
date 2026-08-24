import { SUMMARY_TYPES } from "@/lib/shiftConstants";
import type { MonthlySummaryShiftType } from "@/types/shift";

interface MonthlySummaryProps {
  summary: Record<MonthlySummaryShiftType, number>;
}

export default function MonthlySummary({ summary }: MonthlySummaryProps) {
  return (
    <section className="info-card summary-card" aria-labelledby="summary-title">
      <div className="card-heading-row">
        <div>
          <p className="card-kicker">THIS MONTH</p>
          <h2 id="summary-title">月間サマリー</h2>
        </div>
        <span className="card-icon" aria-hidden="true">#</span>
      </div>
      <div className="summary-list">
        {SUMMARY_TYPES.map(({ type, label }) => (
          <div className="summary-item" key={type}>
            <span className={`summary-dot dot-${type}`} aria-hidden="true" />
            <span>{label}</span>
            <strong>{summary[type]}</strong>
            <span className="summary-unit">件</span>
          </div>
        ))}
      </div>
    </section>
  );
}
