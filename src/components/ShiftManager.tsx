"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { User } from "@supabase/supabase-js";
import AccountStatus from "@/components/AccountStatus";
import AuthDialog from "@/components/AuthDialog";
import Calendar from "@/components/Calendar";
import CloudMigrationCard from "@/components/CloudMigrationCard";
import CsvExportButton from "@/components/CsvExportButton";
import MonthlySummary from "@/components/MonthlySummary";
import NextShift from "@/components/NextShift";
import ShiftEditor from "@/components/ShiftEditor";
import ShiftTemplateSettings from "@/components/ShiftTemplateSettings";
import {
  areShiftTemplatesEqual,
  buildShiftMigrationPlan,
  countShiftConflicts,
  type MigrationConflictChoice,
} from "@/lib/cloudMigration";
import {
  hasCompletedCloudMigration,
  markCloudMigrationCompleted,
} from "@/lib/cloudMigrationStorage";
import { createDefaultShiftTemplates } from "@/lib/shiftTemplates";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";
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
import { LocalShiftRepository } from "@/repositories/localShiftRepository";
import { LocalShiftTemplateRepository } from "@/repositories/localShiftTemplateRepository";
import type { ShiftRepository } from "@/repositories/shiftRepository";
import type { ShiftTemplateRepository } from "@/repositories/shiftTemplateRepository";
import { SupabaseShiftRepository } from "@/repositories/supabaseShiftRepository";
import { SupabaseShiftTemplateRepository } from "@/repositories/supabaseShiftTemplateRepository";
import type { ShiftRecord } from "@/types/shift";
import type { ShiftTemplates } from "@/types/shiftTemplate";

type DataMode = "local" | "cloud";

export default function ShiftManager() {
  const [localShiftRepository] = useState(() => new LocalShiftRepository());
  const [localShiftTemplateRepository] = useState(
    () => new LocalShiftTemplateRepository(),
  );
  const [supabaseClient] = useState(createSupabaseClient);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(() => Boolean(supabaseClient));
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [shifts, setShifts] = useState<ShiftRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [dataWarning, setDataWarning] = useState("");
  const [shiftTemplates, setShiftTemplates] = useState(
    createDefaultShiftTemplates,
  );
  const [isTemplateSettingsOpen, setIsTemplateSettingsOpen] = useState(false);
  const [toolMessage, setToolMessage] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [localMigrationShifts, setLocalMigrationShifts] = useState<ShiftRecord[]>([]);
  const [localMigrationTemplates, setLocalMigrationTemplates] = useState(
    createDefaultShiftTemplates,
  );
  const [isMigrationOpen, setIsMigrationOpen] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const loadRequestId = useRef(0);

  const userId = user?.id ?? null;
  const cloudShiftRepository = useMemo(
    () =>
      supabaseClient && userId
        ? new SupabaseShiftRepository(supabaseClient)
        : null,
    [supabaseClient, userId],
  );
  const cloudShiftTemplateRepository = useMemo(
    () =>
      supabaseClient && userId
        ? new SupabaseShiftTemplateRepository(supabaseClient)
        : null,
    [supabaseClient, userId],
  );
  const dataMode: DataMode =
    userId && cloudShiftRepository && cloudShiftTemplateRepository
      ? "cloud"
      : "local";
  const shiftRepository: ShiftRepository =
    cloudShiftRepository ?? localShiftRepository;
  const shiftTemplateRepository: ShiftTemplateRepository =
    cloudShiftTemplateRepository ?? localShiftTemplateRepository;

  const loadData = useCallback(async () => {
    const requestId = ++loadRequestId.current;
    setIsHydrated(false);
    const [loadedShifts, loadedTemplates] = await Promise.all([
      shiftRepository.list(),
      shiftTemplateRepository.load(),
    ]);
    if (requestId !== loadRequestId.current) {
      return false;
    }

    const warning =
      shiftRepository.getLastError?.() ??
      shiftTemplateRepository.getLastError?.() ??
      "";

    setShifts(loadedShifts);
    setShiftTemplates(loadedTemplates);
    setDataWarning(warning);
    setIsHydrated(true);
    return warning.length === 0;
  }, [shiftRepository, shiftTemplateRepository]);

  useEffect(() => {
    if (!supabaseClient) {
      return;
    }

    let isCancelled = false;
    let hasReceivedAuthEvent = false;
    void supabaseClient.auth.getUser().then(({ data, error }) => {
      if (!isCancelled && !hasReceivedAuthEvent) {
        setUser(error ? null : data.user);
        setAuthLoading(false);
      }
    });

    const { data } = supabaseClient.auth.onAuthStateChange((event, session) => {
      if (!isCancelled) {
        hasReceivedAuthEvent = true;
        if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
          loadRequestId.current += 1;
          setShifts([]);
          setShiftTemplates(createDefaultShiftTemplates());
          setSelectedDate(null);
          setIsTemplateSettingsOpen(false);
          setIsMigrationOpen(false);
          setDataWarning("");
          setIsHydrated(false);
        }
        setUser(session?.user ?? null);
        setAuthLoading(false);
      }
    });

    return () => {
      isCancelled = true;
      data.subscription.unsubscribe();
    };
  }, [supabaseClient]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    let isCancelled = false;
    const timer = window.setTimeout(() => {
      if (!isCancelled) {
        void loadData();
      }
    }, 0);

    return () => {
      isCancelled = true;
      window.clearTimeout(timer);
    };
  }, [authLoading, loadData]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    let isCancelled = false;
    void Promise.all([
      localShiftRepository.list(),
      localShiftTemplateRepository.load(),
    ]).then(([localShifts, localTemplates]) => {
      if (isCancelled) {
        return;
      }

      setLocalMigrationShifts(localShifts);
      setLocalMigrationTemplates(localTemplates);
      const hasLocalTemplates = !areShiftTemplatesEqual(
        localTemplates,
        createDefaultShiftTemplates(),
      );
      setIsMigrationOpen(
        !hasCompletedCloudMigration(userId) &&
          (localShifts.length > 0 || hasLocalTemplates),
      );
    });

    return () => {
      isCancelled = true;
    };
  }, [localShiftRepository, localShiftTemplateRepository, userId]);

  useEffect(() => {
    const authResult = new URLSearchParams(window.location.search).get("auth");
    if (!authResult) {
      return;
    }

    const timer = window.setTimeout(() => {
      setToolMessage(
        authResult === "confirmed"
          ? "メール確認が完了しました。クラウド同期を利用できます。"
          : "メール確認を完了できませんでした。リンクの期限を確認してください。",
      );
      window.history.replaceState({}, "", window.location.pathname);
    }, 0);

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
  const defaultTemplates = useMemo(() => createDefaultShiftTemplates(), []);
  const hasLocalMigrationData =
    localMigrationShifts.length > 0 ||
    !areShiftTemplatesEqual(localMigrationTemplates, defaultTemplates);
  const templateMigrationDifference = !areShiftTemplatesEqual(
    localMigrationTemplates,
    shiftTemplates,
  );
  const migrationConflictCount = useMemo(
    () => countShiftConflicts(localMigrationShifts, shifts),
    [localMigrationShifts, shifts],
  );

  async function handleSave(shift: ShiftRecord) {
    const didSave = await shiftRepository.upsert(shift);
    if (!didSave && dataMode === "cloud") {
      setDataWarning(
        shiftRepository.getLastError?.() ??
          "クラウドへ保存できませんでした。再試行してください。",
      );
      return;
    }

    const nextShifts = shifts.some((item) => item.id === shift.id)
      ? shifts.map((item) => (item.id === shift.id ? shift : item))
      : [...shifts, shift];
    setShifts(nextShifts);
    setDataWarning(
      didSave
        ? ""
        : "ブラウザにデータを保存できません。ブラウザ設定を確認してください。",
    );
    setSelectedDate(null);
  }

  async function handleDelete(shiftId: string) {
    if (!window.confirm("この勤務を削除しますか？")) {
      return;
    }

    const didRemove = await shiftRepository.remove(shiftId);
    if (!didRemove && dataMode === "cloud") {
      setDataWarning(
        shiftRepository.getLastError?.() ??
          "クラウドから削除できませんでした。再試行してください。",
      );
      return;
    }

    setShifts(shifts.filter((shift) => shift.id !== shiftId));
    setDataWarning(
      didRemove
        ? ""
        : "ブラウザにデータを保存できません。ブラウザ設定を確認してください。",
    );
    setSelectedDate(null);
  }

  async function handleAddDemo() {
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
      .map(({ day, type }) =>
        createShiftRecord(
          `${monthKey}-${String(day).padStart(2, "0")}`,
          type,
          "デモ勤務",
        ),
      )
      .filter((shift) => !existingDates.has(shift.date));

    if (demoShifts.length === 0) {
      return;
    }

    const didSave = await shiftRepository.upsertMany(demoShifts);
    if (!didSave && dataMode === "cloud") {
      setDataWarning(
        shiftRepository.getLastError?.() ??
          "デモ勤務をクラウドへ保存できませんでした。",
      );
      return;
    }

    setShifts([...shifts, ...demoShifts]);
    setDataWarning(
      didSave
        ? ""
        : "ブラウザにデータを保存できません。ブラウザ設定を確認してください。",
    );
  }

  async function handleClearAll() {
    if (!window.confirm("すべての勤務を削除しますか？この操作は元に戻せません。")) {
      return;
    }

    const didClear = await shiftRepository.clear();
    if (!didClear && dataMode === "cloud") {
      setDataWarning(
        shiftRepository.getLastError?.() ??
          "クラウド勤務を削除できませんでした。",
      );
      return;
    }

    setShifts([]);
    setDataWarning(
      didClear
        ? ""
        : "ブラウザの勤務を削除できませんでした。ブラウザ設定を確認してください。",
    );
  }

  async function handleSaveTemplates(templates: ShiftTemplates) {
    const didSave = await shiftTemplateRepository.save(templates);
    if (!didSave && dataMode === "cloud") {
      setDataWarning(
        shiftTemplateRepository.getLastError?.() ??
          "勤務テンプレートをクラウドへ保存できませんでした。",
      );
      return;
    }

    setShiftTemplates(templates);
    setDataWarning(
      didSave
        ? ""
        : "設定を保存できませんでした。ブラウザ設定を確認してください。",
    );
    setToolMessage(
      didSave
        ? "勤務テンプレートを保存しました。"
        : "設定を保存できませんでした。ブラウザ設定を確認してください。",
    );
    setIsTemplateSettingsOpen(false);
  }

  async function handleResetTemplates() {
    if (!window.confirm("勤務テンプレートを標準時刻に戻しますか？")) {
      return;
    }

    const defaults = await shiftTemplateRepository.reset();
    if (!defaults && dataMode === "cloud") {
      setDataWarning(
        shiftTemplateRepository.getLastError?.() ??
          "勤務テンプレートをリセットできませんでした。",
      );
      return;
    }

    const didReset = defaults !== null;
    setShiftTemplates(defaults ?? createDefaultShiftTemplates());
    setDataWarning(
      didReset
        ? ""
        : "設定をリセットできませんでした。ブラウザ設定を確認してください。",
    );
    setToolMessage(
      didReset
        ? "勤務テンプレートを標準設定に戻しました。"
        : "設定をリセットできませんでした。ブラウザ設定を確認してください。",
    );
    setIsTemplateSettingsOpen(false);
  }

  async function handleRefresh() {
    setIsRefreshing(true);
    const didLoad = await loadData();
    setIsRefreshing(false);
    if (didLoad) {
      setToolMessage("クラウドの最新データを読み込みました。");
    }
  }

  async function handleLogout() {
    if (!supabaseClient) {
      return;
    }

    const { error } = await supabaseClient.auth.signOut();
    if (error) {
      setDataWarning("ログアウトできませんでした。通信状態を確認してください。");
      return;
    }

    setToolMessage("ログアウトしました。端末内モードへ切り替えました。");
  }

  async function handleMigration(choice: MigrationConflictChoice) {
    if (!userId || !cloudShiftRepository || !cloudShiftTemplateRepository) {
      return;
    }

    setIsMigrating(true);
    setDataWarning("");
    const plan = buildShiftMigrationPlan(
      localMigrationShifts,
      shifts,
      choice,
    );
    const didSaveShifts = await cloudShiftRepository.upsertMany(
      plan.shiftsToUpsert,
    );
    const shouldSaveTemplates =
      templateMigrationDifference &&
      (choice === "local" ||
        areShiftTemplatesEqual(shiftTemplates, defaultTemplates));
    const didSaveTemplates = shouldSaveTemplates
      ? await cloudShiftTemplateRepository.save(localMigrationTemplates)
      : true;

    if (!didSaveShifts || !didSaveTemplates) {
      setDataWarning(
        cloudShiftRepository.getLastError() ??
          cloudShiftTemplateRepository.getLastError() ??
          "端末データをコピーできませんでした。再試行してください。",
      );
      setIsMigrating(false);
      return;
    }

    markCloudMigrationCompleted(userId);
    setToolMessage(
      `端末の勤務${plan.imported}件をクラウドへコピーしました。端末データは残しています。`,
    );
    setIsMigrationOpen(false);
    setIsMigrating(false);
    await loadData();
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
        <span className="phase-badge">PHASE 2</span>
      </header>

      <AccountStatus
        authLoading={authLoading}
        canMigrate={Boolean(userId && hasLocalMigrationData)}
        cloudConfigured={Boolean(supabaseClient)}
        email={user?.email ?? null}
        isRefreshing={isRefreshing}
        onLogin={() => setIsAuthOpen(true)}
        onLogout={() => void handleLogout()}
        onMigrate={() => setIsMigrationOpen(true)}
        onRefresh={() => void handleRefresh()}
      />

      {isMigrationOpen && userId && hasLocalMigrationData && (
        <CloudMigrationCard
          cloudCount={shifts.length}
          conflictCount={migrationConflictCount}
          hasTemplateDifference={templateMigrationDifference}
          isMigrating={isMigrating}
          localCount={localMigrationShifts.length}
          onClose={() => setIsMigrationOpen(false)}
          onMigrate={(choice) => void handleMigration(choice)}
        />
      )}

      <section className="intro-row">
        <div>
          <p className="intro-greeting">今日もおつかれさまです。</p>
          <p className="intro-description">自分の勤務を、すばやく記録。</p>
        </div>
        <button className="demo-button" onClick={() => void handleAddDemo()} type="button">
          <span aria-hidden="true">✦</span> デモ勤務を追加
        </button>
      </section>

      {dataWarning && (
        <div className="storage-warning" role="alert">
          <span>{dataWarning}</span>
          {dataMode === "cloud" && (
            <button onClick={() => void handleRefresh()} type="button">再試行</button>
          )}
        </div>
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
          <p>
            {dataMode === "cloud"
              ? "ログイン中のアカウントへ安全に保存しています。"
              : "この端末のブラウザに保存しています。"}
          </p>
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
            onClick={() => void handleClearAll()}
            type="button"
            disabled={!isHydrated || shifts.length === 0}
          >
            すべての勤務を削除
          </button>
        </div>
      </section>

      <footer className="app-footer">
        Nurse Shift Manager <span>·</span>{" "}
        {dataMode === "cloud" ? "Supabase cloud mode" : "localStorage mode"}
      </footer>

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

      {isAuthOpen && supabaseClient && (
        <AuthDialog client={supabaseClient} onClose={() => setIsAuthOpen(false)} />
      )}
    </main>
  );
}
