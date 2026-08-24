"use client";

import { useEffect, useMemo, useState } from "react";
import Calendar from "@/components/Calendar";
import CsvExportButton from "@/components/CsvExportButton";
import MonthlySummary from "@/components/MonthlySummary";
import NextShift from "@/components/NextShift";
import ShiftEditor from "@/components/ShiftEditor";
import ShiftTemplateSettings from "@/components/ShiftTemplateSettings";
import {
  loadShiftTemplates,
  resetShiftTemplates,
  saveShiftTemplates,
} from "@/lib/shiftTemplateStorage";
import { createDefaultShiftTemplates } from "@/lib/shiftTemplates";
import { clearShifts, loadShifts, saveShifts } from "@/lib/storage";
import {
  addMonths,
  createShiftRecord,
  findNextShift,
  formatMonthTitle,
  getCalendarDays,
  getMonthKey,
  getMonthlySummary,
  getTodayKey,
} from "@/lib/shiftUtils";
import type { ShiftRecord } from "@/types/shift";
import type { ShiftTemplates } from "@/types/shiftTemplate";

export default function ShiftManager() {
  const [currentMonth, setCurrentMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [shifts, setShifts] = useState<ShiftRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [storageWarning, setStorageWarning] = useState(false);
  const [shiftTemplates, setShiftTemplates] = useState(
    createDefaultShiftTemplates,
  );
  const [isTemplateSettingsOpen, setIsTemplateSettingsOpen] = useState(false);
  const [toolMessage, setToolMessage] = useState("");

  useEffect(() => {
    const load = () => {
      setShifts(loadShifts());
      setShiftTemplates(loadShiftTemplates());
      setIsHydrated(true);
    };
    const timer = window.setTimeout(load, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const selectedShift = selectedDate
    ? shifts.find((shift) => shift.date === selectedDate) ?? null
    : null;
  const monthKey = getMonthKey(currentMonth);
  const summary = useMemo(
    () => getMonthlySummary(shifts, monthKey),
    [monthKey, shifts],
  );
  const nextShift = useMemo(
    () => findNextShift(shifts, getTodayKey()),
    [shifts],
  );

  function updateShifts(nextShifts: ShiftRecord[]) {
    setShifts(nextShifts);
    setStorageWarning(!saveShifts(nextShifts));
  }

  function handleSave(shift: ShiftRecord) {
    const nextShifts = shifts.some((item) => item.id === shift.id)
      ? shifts.map((item) => (item.id === shift.id ? shift : item))
      : [...shifts, shift];
    updateShifts(nextShifts);
    setSelectedDate(null);
  }

  function handleDelete(shiftId: string) {
    if (!window.confirm("この勤務を削除しますか？")) {
      return;
    }

    updateShifts(shifts.filter((shift) => shift.id !== shiftId));
    setSelectedDate(null);
  }

  function handleAddDemo() {
    const existingDates = new Set(shifts.map((shift) => shift.date));
    const demoDefinitions = [
      { day: 1, type: "day" as const },
      { day: 3, type: "night" as const },
      { day: 6, type: "off" as const },
      { day: 10, type: "early" as const },
      { day: 14, type: "late" as const },
      { day: 20, type: "paidLeave" as const },
    ];
    const daysInMonth = getCalendarDays(currentMonth).length;
    const demoShifts = demoDefinitions
      .filter(({ day }) => day <= daysInMonth)
      .map(({ day, type }) => createShiftRecord(`${monthKey}-${String(day).padStart(2, "0")}`, type, "デモ勤務"))
      .filter((shift) => !existingDates.has(shift.date));

    if (demoShifts.length > 0) {
      updateShifts([...shifts, ...demoShifts]);
    }
  }

  function handleClearAll() {
    if (!window.confirm("すべての勤務を削除しますか？この操作は元に戻せません。")) {
      return;
    }

    const didClear = clearShifts();
    setShifts([]);
    setStorageWarning(!didClear);
  }

  function handleSaveTemplates(templates: ShiftTemplates) {
    const didSave = saveShiftTemplates(templates);
    setShiftTemplates(templates);
    setStorageWarning(!didSave);
    setToolMessage(
      didSave
        ? "勤務テンプレートを保存しました。"
        : "設定を保存できませんでした。ブラウザ設定を確認してください。",
    );
    setIsTemplateSettingsOpen(false);
  }

  function handleResetTemplates() {
    if (!window.confirm("勤務テンプレートを標準時刻に戻しますか？")) {
      return;
    }

    const defaults = createDefaultShiftTemplates();
    const didReset = resetShiftTemplates();
    setShiftTemplates(defaults);
    setStorageWarning(!didReset);
    setToolMessage(
      didReset
        ? "勤務テンプレートを標準設定に戻しました。"
        : "設定をリセットできませんでした。ブラウザ設定を確認してください。",
    );
    setIsTemplateSettingsOpen(false);
  }

  function goToToday() {
    const today = new Date();
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true">NS</div>
          <div>
            <p className="brand-overline">PERSONAL SHIFT PLANNER</p>
            <h1>勤務表</h1>
          </div>
        </div>
        <span className="phase-badge">PHASE 1</span>
      </header>

      <section className="intro-row">
        <div>
          <p className="intro-greeting">今日もおつかれさまです。</p>
          <p className="intro-description">自分の勤務を、すばやく記録。</p>
        </div>
        <button className="demo-button" onClick={handleAddDemo} type="button">
          <span aria-hidden="true">✦</span> デモ勤務を追加
        </button>
      </section>

      {storageWarning && (
        <p className="storage-warning" role="status">
          ブラウザにデータを保存できません。ブラウザ設定を確認してください。
        </p>
      )}

      <section className="calendar-section" aria-labelledby="month-title">
        <div className="month-toolbar">
          <div>
            <p className="card-kicker">SCHEDULE</p>
            <h2 id="month-title">{formatMonthTitle(currentMonth)}</h2>
          </div>
          <div className="month-actions">
            <button
              className="month-nav-button"
              onClick={() => setCurrentMonth((month) => addMonths(month, -1))}
              type="button"
              aria-label="前月"
            >
              ‹
            </button>
            <button className="today-button" onClick={goToToday} type="button">今月へ戻る</button>
            <button
              className="month-nav-button"
              onClick={() => setCurrentMonth((month) => addMonths(month, 1))}
              type="button"
              aria-label="翌月"
            >
              ›
            </button>
          </div>
        </div>
        <Calendar month={currentMonth} shifts={shifts} onSelectDate={setSelectedDate} />
        <p className="calendar-hint"><span aria-hidden="true">＋</span> 日付をタップして勤務を登録・編集</p>
      </section>

      <div className="dashboard-grid">
        <NextShift shift={nextShift} />
        <MonthlySummary summary={summary} />
      </div>

      <section className="manage-card" aria-labelledby="manage-title">
        <div className="manage-copy">
          <p className="card-kicker">TOOLS</p>
          <h2 id="manage-title">勤務データ</h2>
          <p>この端末のブラウザに保存しています。</p>
          {toolMessage && <p className="tool-message" role="status">{toolMessage}</p>}
        </div>
        <div className="manage-actions">
          <CsvExportButton
            monthKey={monthKey}
            onMessage={setToolMessage}
            shifts={shifts}
          />
          <button
            className="tool-button template-button"
            onClick={() => setIsTemplateSettingsOpen(true)}
            type="button"
          >
            <span aria-hidden="true">◷</span>
            勤務テンプレート設定
          </button>
          <button
            className="clear-button"
            onClick={handleClearAll}
            type="button"
            disabled={!isHydrated || shifts.length === 0}
          >
            すべての勤務を削除
          </button>
        </div>
      </section>

      <footer className="app-footer">Nurse Shift Manager <span>·</span> localStorage mode</footer>

      {selectedDate && (
        <ShiftEditor
          key={`${selectedDate}-${selectedShift?.id ?? "new"}`}
          date={selectedDate}
          existingShift={selectedShift}
          templates={shiftTemplates}
          onClose={() => setSelectedDate(null)}
          onDelete={handleDelete}
          onSave={handleSave}
        />
      )}

      {isTemplateSettingsOpen && (
        <ShiftTemplateSettings
          key={JSON.stringify(shiftTemplates)}
          templates={shiftTemplates}
          onClose={() => setIsTemplateSettingsOpen(false)}
          onReset={handleResetTemplates}
          onSave={handleSaveTemplates}
        />
      )}
    </main>
  );
}
