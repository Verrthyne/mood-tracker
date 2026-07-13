# 開発用合成データ

このディレクトリのJSONは、ムードトラッカーの開発・動作確認用に生成した架空データである。

- 実在する人物、出来事、医療情報、CBTメモを含まない。
- アプリのJSONバックアップ形式と同じ構造を使用する。
- 公開版や実データの保存領域へ自動ではインポートしない。
- 再生成には `scripts/generate-synthetic-backup.mjs` を使用する。

生成対象期間:

```text
2026-04-01 ～ 2026-07-13
```

生成コマンド:

```powershell
node scripts/generate-synthetic-backup.mjs
```
