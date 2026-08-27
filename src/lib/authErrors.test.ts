import { describe, expect, it } from "vitest";
import { getAuthErrorMessage } from "@/lib/authErrors";

describe("getAuthErrorMessage", () => {
  it("認証エラーを安全な日本語へ変換する", () => {
    expect(getAuthErrorMessage("invalid_credentials")).toContain(
      "メールアドレス",
    );
    expect(getAuthErrorMessage("email_not_confirmed")).toContain("確認メール");
  });

  it("未知の内部エラーをそのまま表示しない", () => {
    expect(getAuthErrorMessage("database_error_secret_detail")).toBe(
      "認証処理に失敗しました。通信状態を確認して再試行してください。",
    );
  });
});
