# Backup and recovery

このプロジェクトは、次の2か所を復元元として使います。

1. GitHubの `main` ブランチ：ソースコードと変更履歴の正式な保管先
2. `/Users/komatubarayukino/Documents/Codex/backups/nurse-shift-manager/latest`：ローカルの追加退避先

## バックアップ

プロジェクトルートで次を実行します。

```bash
npm run backup
```

バックアップにはソースコードと設定例だけを含め、`node_modules`、`.next`、`.env`、`.env.local`、`.vercel`などはコピーしません。依存関係やビルド成果物は復元時に再生成します。

別の保存先を指定することもできます。

```bash
bash scripts/backup-project.sh /path/to/backup/nurse-shift-manager
```

## 復元

GitHubから復元する場合：

```bash
git clone git@github.com:anju02080808-spec/nurse-shift-manager.git nurse-shift-manager
cd nurse-shift-manager
npm ci
```

ローカル退避から復元する場合は、`latest`の内容を新しい作業フォルダへコピーし、依存関係を再生成します。`.env.local`はバックアップ対象外なので、必要な環境変数は安全な保管場所から再設定してください。

復元後は次で状態を確認します。

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
```
