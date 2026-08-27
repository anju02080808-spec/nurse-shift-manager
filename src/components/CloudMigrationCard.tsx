"use client";

import { useState } from "react";
import type { MigrationConflictChoice } from "@/lib/cloudMigration";

interface CloudMigrationCardProps {
  cloudCount: number;
  conflictCount: number;
  hasTemplateDifference: boolean;
  isMigrating: boolean;
  localCount: number;
  onClose: () => void;
  onMigrate: (choice: MigrationConflictChoice) => void;
}

export default function CloudMigrationCard({
  cloudCount,
  conflictCount,
  hasTemplateDifference,
  isMigrating,
  localCount,
  onClose,
  onMigrate,
}: CloudMigrationCardProps) {
  const [choice, setChoice] = useState<MigrationConflictChoice>("cloud");

  return (
    <section className="migration-card" aria-labelledby="migration-title">
      <div className="migration-heading">
        <div>
          <p className="card-kicker">ONE-TIME COPY</p>
          <h2 id="migration-title">端末データをクラウドへ移行</h2>
        </div>
        <button className="icon-button" onClick={onClose} type="button" aria-label="閉じる">×</button>
      </div>
      <p>
        端末の勤務{localCount}件とクラウドの勤務{cloudCount}件を確認しました。
        コピー後も端末データは削除されません。
      </p>
      {hasTemplateDifference && (
        <p className="migration-template-note">勤務テンプレートにも差分があります。</p>
      )}
      {conflictCount > 0 && (
        <fieldset className="migration-options">
          <legend>同じ日付の競合が{conflictCount}件あります</legend>
          <label>
            <input
              checked={choice === "cloud"}
              name="conflict-choice"
              onChange={() => setChoice("cloud")}
              type="radio"
            />
            <span><strong>クラウドを残す</strong><small>競合日の端末勤務はコピーしません（推奨）</small></span>
          </label>
          <label>
            <input
              checked={choice === "local"}
              name="conflict-choice"
              onChange={() => setChoice("local")}
              type="radio"
            />
            <span><strong>端末の内容を優先</strong><small>競合日のクラウド勤務を端末内容で更新します</small></span>
          </label>
        </fieldset>
      )}
      <div className="migration-actions">
        <button className="account-secondary" onClick={onClose} type="button">あとで</button>
        <button
          className="primary-button"
          disabled={isMigrating}
          onClick={() => onMigrate(choice)}
          type="button"
        >
          {isMigrating ? "コピー中…" : "端末データを保持したままコピー"}
        </button>
      </div>
    </section>
  );
}
