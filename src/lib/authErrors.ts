export function getAuthErrorMessage(code?: string): string {
  switch (code) {
    case "invalid_credentials":
      return "メールアドレスまたはパスワードが正しくありません。";
    case "email_not_confirmed":
      return "確認メールのリンクを開いてからログインしてください。";
    case "user_already_exists":
    case "user_already_registered":
      return "このメールアドレスは登録済みです。ログインをお試しください。";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "操作が続いたため一時的に制限されています。少し待ってから再試行してください。";
    case "weak_password":
      return "より安全なパスワードを設定してください。";
    default:
      return "認証処理に失敗しました。通信状態を確認して再試行してください。";
  }
}
