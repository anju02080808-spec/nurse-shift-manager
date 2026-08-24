# Nurse Shift Manager

看護師がスマートフォンから自分の勤務表を登録・確認できる、Phase 1のWebアプリです。ログインやクラウド同期は行わず、ブラウザの`localStorage`に勤務データを保存します。

## 主な機能

- 月間カレンダーで勤務の登録・編集・削除
- 日勤、夜勤、夜勤明け、早出、遅出、休み、有給、その他の勤務区分
- 勤務区分に応じた標準時刻の自動入力
- 夜勤などの日付またぎ表示
- 次回勤務の表示
- 今月の勤務区分別サマリー
- デモ勤務の追加と、確認付きの全勤務削除
- 壊れた保存データや`localStorage`が使えない環境への安全なフォールバック

## 使用技術

- Next.js 16.3.0 / React 19
- TypeScript
- CSS（Tailwind CSSのリセットを利用し、画面スタイルは`globals.css`に定義）
- Vitest
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

保存キーは`nurse-shift-manager:shifts:v1`です。保存形式は次のバージョン付きJSONです。

```ts
interface ShiftStorage {
  version: 1;
  shifts: ShiftRecord[];
}
```

日付は`YYYY-MM-DD`、時刻は`HH:mm`で管理します。保存処理は`src/lib/storage.ts`、勤務ロジックは`src/lib/shiftUtils.ts`に分離しています。

## Phase 1の制限

- ログイン、ユーザー管理、クラウド同期はありません
- データは端末・ブラウザごとに保存されます
- 給与計算、夜勤手当計算、CSV出力はありません
- 1日につき1勤務を基本としています

## 今後のPhase 2構想

- Supabaseへのデータ移行
- ユーザー認証とクラウド同期
- 勤務テンプレート設定
- 給与・夜勤手当計算
- CSV出力
- PWA対応
- 複数端末同期
