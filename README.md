# Nurse Shift Manager

看護師がスマートフォンから自分の勤務表を登録・確認できるWebアプリです。未ログイン時はブラウザ内だけに保存する端末内モード、ログイン時はSupabaseへ保存するクラウドモードで動作します。

## 主な機能

- 月間カレンダーで勤務の登録・編集・削除
- 日勤、夜勤、夜勤明け、早出、遅出、休み、有給、その他の勤務区分
- 勤務区分に応じた標準時刻の自動入力
- 夜勤などの日付またぎ表示
- 夜勤登録時に翌日の夜勤明けを自動登録（登録済み勤務は上書きしません）
- 次回勤務の表示
- 今月の勤務区分別サマリー
- 表示中の月をUTF-8 BOM付きCSVとして出力
- 日勤・夜勤・早出・遅出の標準時刻をユーザー設定
- メールアドレスとパスワードによる新規登録・ログイン・ログアウト
- ユーザーごとに分離された勤務・テンプレートのクラウド保存
- 端末内データを確認付きでクラウドへコピー（競合時の優先データを選択可能）
- クラウドデータの手動再読込と通信エラー表示
- スマートフォンやPCのホーム画面へ追加できるPWA対応
- iPhone向けホーム画面追加案内とオフライン状態の表示
- デモ勤務の追加と、確認付きの全勤務削除
- 壊れた保存データや`localStorage`が使えない環境への安全なフォールバック

## 使用技術

- Next.js 16.3.0 / React 19
- TypeScript
- CSS（Tailwind CSSのリセットを利用し、画面スタイルは`globals.css`に定義）
- Vitest
- Supabase Auth / PostgreSQL / Row Level Security
- Web App Manifest / PWA
- Node.js 24.19.0

## セットアップ

Node.js 24を使用してください。`fnm`を利用する場合は、次のコマンドでプロジェクト指定のバージョンを使えます。

```bash
fnm exec --using 24 npm install
```

## 開発サーバー起動方法

```bash
fnm exec --using 24 npm run dev
```

ブラウザで`http://localhost:3000`を開きます。

## テスト方法

```bash
fnm exec --using 24 npm run lint
fnm exec --using 24 npm run typecheck
fnm exec --using 24 npm test
```

## build方法

通常のNext.js buildはTurbopackを使用します。Codexなど実行環境の制限を避けて確認する場合はWebpackを明示します。

```bash
fnm exec --using 24 npm run build -- --webpack
```

## データ保存方式

### 端末内モード

勤務データの保存キーは`nurse-shift-manager:shifts:v1`です。保存形式は次のバージョン付きJSONです。

```ts
interface ShiftStorage {
  version: 1;
  shifts: ShiftRecord[];
}
```

勤務テンプレートは別のキー`nurse-shift-manager:shift-templates:v1`へ保存します。テンプレートを変更しても登録済み勤務は書き換えず、新規登録時の初期時刻だけに反映します。

日付は`YYYY-MM-DD`、時刻は`HH:mm`で管理します。勤務保存処理は`src/lib/storage.ts`、テンプレート保存処理は`src/lib/shiftTemplateStorage.ts`、勤務ロジックは`src/lib/shiftUtils.ts`に分離しています。

夜勤を保存すると、翌日が空いている場合だけ夜勤明けを自動登録します。夜勤を別区分へ変更または削除した際は、その夜勤から自動作成された夜勤明けだけを連動削除し、手入力・手編集した勤務は残します。

CSVは表示中の月の勤務を対象に、UTF-8 BOMとCRLF改行を使用して出力します。CSV文字列生成とブラウザのダウンロード処理は別モジュールです。

### クラウドモード

ログイン中は勤務を`public.shifts`、勤務テンプレートを`public.shift_templates`へ保存します。両テーブルは`auth.users.id`に紐づき、Row Level Security（RLS）により本人の行だけをSELECT・INSERT・UPDATE・DELETEできます。ブラウザにはPublishable keyだけを設定し、Secret key、legacy `service_role` key、DBパスワードは含めません。

端末内データのクラウド移行は自動実行しません。ログイン後に件数と競合を確認し、「クラウドを優先」または「端末を優先」を選んでコピーします。コピー後も端末内データは削除しません。

## 現在の制限

- 給与計算、夜勤手当計算はありません
- 1日につき1勤務を基本としています
- オフライン中のクラウド編集キューと自動再送はありません
- PWAはインストールと通信状態表示に対応していますが、オフラインでの新規登録・編集には対応していません
- Googleログイン、リアルタイム同期、複数ユーザー共同編集はありません
- 端末内モードとクラウドモードは別データとして保持されます

## Supabase開発環境

Supabaseを設定していない環境でも、端末内モードの起動、テスト、buildは可能です。クラウド機能を使う場合は`.env.example`をコピーして、公開可能なProject URL、Publishable key、アプリURLを`.env.local`へ設定します。

```bash
cp .env.example .env.local
```

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Supabase DashboardのAuthenticationでメール認証を有効にし、Site URLを`http://localhost:3000`、Redirect URLを`http://localhost:3000/auth/callback`に設定します。本番では両方をHTTPSの公開URLへ変更・追加してください。Secret key、legacy `service_role` key、DBパスワードはアプリへ設定しません。

ローカルDBを利用する場合は、Supabase CLIに加えてDocker互換環境が必要です。

```bash
fnm exec --using 24 npm run supabase:start
fnm exec --using 24 npm run supabase:reset
fnm exec --using 24 npm run supabase:test
fnm exec --using 24 npm run supabase:lint
```

DBスキーマ、制約、RLSポリシーは`supabase/migrations`を正本とします。Dashboardで先にテーブルを手作業作成しないでください。

## Vercelへデプロイする場合

VercelのProject Settings > Environment Variablesへ、`.env.local`と同じ3変数を登録します。`NEXT_PUBLIC_SITE_URL`はVercelの本番URLにします。Supabase側にも同じ本番URLと`/auth/callback`を許可URLとして追加してください。秘密鍵はVercelにも不要です。

## 今後の構想

- Googleログイン
- オフライン編集キューと自動再同期
- クラウドデータのリアルタイム更新
- 給与・夜勤手当計算
- CSVインポート
