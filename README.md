# Nurse Shift Manager

看護師がスマートフォンから自分の勤務表を登録・確認できるWebアプリです。現在の画面はブラウザの`localStorage`へ保存する端末内モードで動作し、Phase 2の認証・クラウド同期基盤を段階的に追加しています。

## 主な機能

- 月間カレンダーで勤務の登録・編集・削除
- 日勤、夜勤、夜勤明け、早出、遅出、休み、有給、その他の勤務区分
- 勤務区分に応じた標準時刻の自動入力
- 夜勤などの日付またぎ表示
- 次回勤務の表示
- 今月の勤務区分別サマリー
- 表示中の月をUTF-8 BOM付きCSVとして出力
- 日勤・夜勤・早出・遅出の標準時刻をユーザー設定
- デモ勤務の追加と、確認付きの全勤務削除
- 壊れた保存データや`localStorage`が使えない環境への安全なフォールバック

## 使用技術

- Next.js 16.3.0 / React 19
- TypeScript
- CSS（Tailwind CSSのリセットを利用し、画面スタイルは`globals.css`に定義）
- Vitest
- Supabase（Phase 2基盤。認証UIとクラウド同期は実装途中）
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

勤務データの保存キーは`nurse-shift-manager:shifts:v1`です。保存形式は次のバージョン付きJSONです。

```ts
interface ShiftStorage {
  version: 1;
  shifts: ShiftRecord[];
}
```

勤務テンプレートは別のキー`nurse-shift-manager:shift-templates:v1`へ保存します。テンプレートを変更しても登録済み勤務は書き換えず、新規登録時の初期時刻だけに反映します。

日付は`YYYY-MM-DD`、時刻は`HH:mm`で管理します。勤務保存処理は`src/lib/storage.ts`、テンプレート保存処理は`src/lib/shiftTemplateStorage.ts`、勤務ロジックは`src/lib/shiftUtils.ts`に分離しています。

CSVは表示中の月の勤務を対象に、UTF-8 BOMとCRLF改行を使用して出力します。CSV文字列生成とブラウザのダウンロード処理は別モジュールです。

## Phase 1の制限

- ログイン、ユーザー管理、クラウド同期はありません
- データは端末・ブラウザごとに保存されます
- 給与計算、夜勤手当計算はありません
- 1日につき1勤務を基本としています

## Phase 2開発環境

Supabaseを設定していない環境でも、端末内モードの起動、テスト、buildは可能です。クラウド機能を開発する場合は`.env.example`を参考に、公開可能なProject URLとPublishable keyを`.env.local`へ設定します。Secret key、legacy `service_role`、DBパスワードはアプリへ設定しません。

ローカルDBを利用する場合は、Supabase CLIに加えてDocker互換環境が必要です。

```bash
fnm exec --using 24 npm run supabase:start
fnm exec --using 24 npm run supabase:reset
fnm exec --using 24 npm run supabase:test
fnm exec --using 24 npm run supabase:lint
```

DBスキーマ、制約、RLSポリシーは`supabase/migrations`を正本とします。Dashboardで先にテーブルを手作業作成しないでください。

## Phase 2構想

- Supabaseへのデータ移行
- ユーザー認証とクラウド同期
- 給与・夜勤手当計算
- PWA対応
- 複数端末同期
