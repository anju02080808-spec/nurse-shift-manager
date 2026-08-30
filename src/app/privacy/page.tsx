import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "プライバシーポリシー | Nurse Shift Manager",
  description: "Nurse Shift Managerにおける利用者情報の取り扱い方針です。",
};

export default function PrivacyPage() {
  return (
    <main className="legal-shell">
      <header className="legal-header">
        <Link className="legal-back" href="/">
          ← 勤務表へ戻る
        </Link>
        <p className="brand-overline">PRIVACY</p>
        <h1>プライバシーポリシー</h1>
        <p>最終更新日：2026年8月30日</p>
      </header>

      <article className="legal-card">
        <section>
          <h2>1. 取得する情報</h2>
          <p>
            クラウド同期を利用する場合、認証に必要なメールアドレス、ユーザー識別子、Googleログインで提供される基本プロフィール情報を取得します。また、利用者が登録した勤務、メモ、勤務テンプレートを保存します。
          </p>
          <p>
            ログインせず端末内モードを利用する場合、勤務データは利用中のブラウザのlocalStorageに保存されます。ポートフォリオデモの変更内容はメモリ内だけで処理され、ページを再読み込みすると初期化されます。
          </p>
        </section>

        <section>
          <h2>2. 利用目的</h2>
          <ul>
            <li>本人確認とログイン機能の提供</li>
            <li>勤務表の保存、表示および複数端末間の同期</li>
            <li>不具合調査、セキュリティ維持および問い合わせ対応</li>
          </ul>
        </section>

        <section>
          <h2>3. 外部サービス</h2>
          <p>
            本サービスは、認証とデータ保存にSupabase、アプリ配信にVercelを利用します。Googleログインを選択した場合はGoogleの認証サービスを利用します。各事業者による情報の取り扱いには、それぞれのプライバシーポリシーが適用されます。
          </p>
        </section>

        <section>
          <h2>4. 安全管理</h2>
          <p>
            クラウド上の勤務データはユーザーIDに関連付け、Row Level Security（RLS）により本人のデータだけを読み書きできるよう制限しています。認証用の秘密鍵やservice_roleキーはブラウザへ配布しません。
          </p>
        </section>

        <section>
          <h2>5. データの削除</h2>
          <p>
            勤務データはアプリ内から削除できます。アカウント自体の削除を希望する場合は、下記の連絡先へお問い合わせください。本人確認後に対応します。
          </p>
        </section>

        <section>
          <h2>6. 方針の変更</h2>
          <p>
            機能追加や法令の変更などに応じて本方針を更新することがあります。重要な変更がある場合は、本ページで分かりやすくお知らせします。
          </p>
        </section>

        <section>
          <h2>7. お問い合わせ</h2>
          <p>
            <a href="mailto:lumeriqo.dev@gmail.com">lumeriqo.dev@gmail.com</a>
          </p>
        </section>
      </article>
    </main>
  );
}
