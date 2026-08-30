"use client";

import { useState, type FormEvent } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAuthErrorMessage } from "@/lib/authErrors";
import { isGoogleAuthEnabled } from "@/lib/supabase/config";
import type { Database } from "@/types/database";

interface AuthDialogProps {
  client: SupabaseClient<Database>;
  onClose: () => void;
}

type AuthMode = "login" | "signup";

export default function AuthDialog({ client, onClose }: AuthDialogProps) {
  const googleAuthEnabled = isGoogleAuthEnabled();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  function changeMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError("");
    setNotice("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (password.length < 8) {
      setError("パスワードは8文字以上で入力してください。");
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === "login") {
        const { error: authError } = await client.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (authError) {
          setError(getAuthErrorMessage(authError.code));
          return;
        }

        onClose();
        return;
      }

      const { data, error: authError } = await client.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (authError) {
        setError(getAuthErrorMessage(authError.code));
        return;
      }

      if (data.session) {
        onClose();
      } else {
        setNotice(
          "確認メールを送りました。メール内のリンクを開くと登録が完了します。",
        );
      }
    } catch {
      setError(getAuthErrorMessage());
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleSignIn() {
    setError("");
    setNotice("");
    setIsGoogleSubmitting(true);

    try {
      const { error: authError } = await client.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (authError) {
        setError(getAuthErrorMessage(authError.code));
      }
    } catch {
      setError(getAuthErrorMessage());
    } finally {
      setIsGoogleSubmitting(false);
    }
  }

  return (
    <div className="editor-backdrop" role="presentation">
      <section
        className="editor-sheet auth-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
      >
        <div className="sheet-handle" aria-hidden="true" />
        <div className="sheet-header">
          <div>
            <p className="card-kicker">SECURE CLOUD</p>
            <h2 id="auth-title">クラウド同期</h2>
          </div>
          <button
            className="icon-button"
            onClick={onClose}
            type="button"
            aria-label="閉じる"
          >
            ×
          </button>
        </div>

        <div className="auth-tabs" role="tablist" aria-label="認証方法">
          <button
            aria-selected={mode === "login"}
            className={mode === "login" ? "is-active" : ""}
            onClick={() => changeMode("login")}
            role="tab"
            type="button"
          >
            ログイン
          </button>
          <button
            aria-selected={mode === "signup"}
            className={mode === "signup" ? "is-active" : ""}
            onClick={() => changeMode("signup")}
            role="tab"
            type="button"
          >
            新規登録
          </button>
        </div>

        {googleAuthEnabled && (
          <>
            <button
              className="google-auth-button"
              disabled={isSubmitting || isGoogleSubmitting}
              onClick={() => void handleGoogleSignIn()}
              type="button"
            >
              <span className="google-auth-mark" aria-hidden="true">G</span>
              {isGoogleSubmitting ? "Googleへ移動中…" : "Googleで続ける"}
            </button>
            <div className="auth-divider" aria-hidden="true">
              <span>または</span>
            </div>
          </>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            <span>メールアドレス</span>
            <input
              autoComplete="email"
              inputMode="email"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </label>
          <label>
            <span>パスワード</span>
            <input
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              minLength={8}
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>
          <p className="auth-hint">
            {mode === "signup"
              ? "8文字以上で設定してください。登録後に確認メールが届きます。"
              : "登録時のメールアドレスとパスワードを入力してください。"}
          </p>
          {error && <p className="form-error" role="alert">{error}</p>}
          {notice && <p className="auth-notice" role="status">{notice}</p>}
          <button
            className="primary-button auth-submit"
            disabled={isSubmitting || isGoogleSubmitting}
            type="submit"
          >
            {isSubmitting
              ? "処理中…"
              : mode === "login"
                ? "ログインする"
                : "アカウントを作成"}
          </button>
        </form>
      </section>
    </div>
  );
}
