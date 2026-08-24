"use client";

import { generateShiftCsv, getShiftCsvFilename } from "@/lib/csvExport";
import { downloadCsvFile } from "@/lib/csvDownload";
import type { ShiftRecord } from "@/types/shift";

interface CsvExportButtonProps {
  shifts: ShiftRecord[];
  monthKey: string;
  onMessage: (message: string) => void;
}

export default function CsvExportButton({
  shifts,
  monthKey,
  onMessage,
}: CsvExportButtonProps) {
  const hasShifts = shifts.some((shift) =>
    shift.date.startsWith(`${monthKey}-`),
  );

  function handleDownload() {
    const csv = generateShiftCsv(shifts, monthKey);
    const didStart = downloadCsvFile(csv, getShiftCsvFilename(monthKey));
    onMessage(
      didStart
        ? `${monthKey.replace("-", "年")}月のCSVダウンロードを開始しました。`
        : "CSVをダウンロードできませんでした。ブラウザ設定を確認してください。",
    );
  }

  return (
    <button
      className="tool-button export-button"
      disabled={!hasShifts}
      onClick={handleDownload}
      type="button"
    >
      <span aria-hidden="true">↓</span>
      表示月をCSV出力
    </button>
  );
}
