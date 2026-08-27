"use client";

interface AccountStatusProps {
  authLoading: boolean;
  canMigrate: boolean;
  cloudConfigured: boolean;
  email: string | null;
  isRefreshing: boolean;
  onLogin: () => void;
  onLogout: () => void;
  onMigrate: () => void;
  onRefresh: () => void;
}

export default function AccountStatus({
  authLoading,
  canMigrate,
  cloudConfigured,
  email,
  isRefreshing,
  onLogin,
  onLogout,
  onMigrate,
  onRefresh,
}: AccountStatusProps) {
  if (authLoading) {
    return <section className="account-card is-loading">認証状態を確認中…</section>;
  }

  if (!email) {
    return (
      <section className="account-card">
        <div className="account-icon is-local" aria-hidden="true">端</div>
        <div className="account-copy">
          <strong>端末内モード</strong>
          <span>
            {cloudConfigured
              ? "ログインすると別の端末でも同じ勤務表を使えます。"
              : "この環境ではクラウド同期が設定されていません。"}
          </span>
        </div>
        {cloudConfigured && (
          <button className="account-primary" onClick={onLogin} type="button">
            ログイン・新規登録
          </button>
        )}
      </section>
    );
  }

  return (
    <section className="account-card is-cloud">
      <div className="account-icon" aria-hidden="true">✓</div>
      <div className="account-copy">
        <strong>クラウド同期中</strong>
        <span>{email}</span>
      </div>
      <div className="account-actions">
        {canMigrate && (
          <button className="account-secondary" onClick={onMigrate} type="button">
            端末データを移行
          </button>
        )}
        <button
          className="account-secondary"
          disabled={isRefreshing}
          onClick={onRefresh}
          type="button"
        >
          {isRefreshing ? "更新中…" : "同期を更新"}
        </button>
        <button className="account-logout" onClick={onLogout} type="button">
          ログアウト
        </button>
      </div>
    </section>
  );
}
