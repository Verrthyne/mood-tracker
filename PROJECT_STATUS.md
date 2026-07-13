# PROJECT_STATUS.md

最終調査日: 2026-07-14

この文書は、実際のコード、localhostでの動作確認、現在の公開版および公開GitHubリポジトリの調査結果をまとめたものである。
旧開発チャットの記述と異なる場合は、この文書と現在のコードを優先する。

## アプリの目的

個人用のムード・状態記録アプリ。

1日に複数回、気分や状態を0～100で記録し、外出、時間帯、複数タグ、CBTメモなどを付加できる。
保存した記録を、時系列グラフ、曜日、時間帯、タグ、外出有無などの観点から振り返る。

データはサーバーへ送信せず、ブラウザの `localStorage` に保存する。

## 現在の構成

正式な開発用cloneは `mood-tracker-dev` ディレクトリで管理する。
調査に使用したZIP展開物は別ディレクトリに原本として残している。

```text
mood-tracker-dev/
├─ .git/
├─ .gitignore
├─ AGENTS.md
├─ PROJECT_STATUS.md
├─ README.md
├─ app.js
├─ download
├─ fixtures/
│  ├─ README.md
│  └─ synthetic-backup-2026-04-01-to-2026-07-13.json
├─ index.html
├─ scripts/
│  └─ generate-synthetic-backup.mjs
└─ styles.css
```

### 各ファイルの役割

- `index.html`
  - 画面構造
  - 入力、グラフ、記録、設定の4タブ
  - Chart.js 4.4.3をjsDelivrから読み込む
- `styles.css`
  - 全画面のスタイル
  - レスポンシブ表示
  - フォーカス表示
  - モーション軽減
  - 画面下部の固定保存バー
- `app.js`
  - 状態管理
  - `localStorage`への保存
  - 記録の新規作成、編集、削除
  - グラフと分析
  - CSV・JSONバックアップ
  - 画面描画とイベント処理
- `README.md`
  - 合格版としての仕様説明
  - GitHub Pagesへの手動アップロード説明
- `AGENTS.md`
  - Codexが継続的に守る開発ルール
- `PROJECT_STATUS.md`
  - 現在の実装、確認結果、既知の問題
- `.gitignore`
  - 個人記録を含み得るJSON・CSVバックアップの誤追加を防止
- `fixtures/README.md`
  - 開発用合成データの目的と再生成方法
- `fixtures/synthetic-backup-2026-04-01-to-2026-07-13.json`
  - JSONインポートと分析の動作確認に使う、個人情報を含まない合成バックアップ
- `scripts/generate-synthetic-backup.mjs`
  - 固定シードで同じ合成バックアップを再生成するスクリプト
- `download`
  - 公開リポジトリに存在する0バイトのファイル。用途は未確認

以下は存在しない。

- `package.json`
- lockfile
- ビルド設定
- 自動テスト
- リポジトリ所有のGitHub Actionsワークフロー
- サーバー側処理
- データベース
- Service Worker
- PWA manifest

## 技術構成

- HTML
- CSS
- Vanilla JavaScript
- Chart.js 4.4.3
- `localStorage`
- GitHub Pages

ビルド工程はなく、静的ファイルをそのまま配信する。

## 実装済み機能

### 記録

- 日付入力
- 時刻入力
- 1日に複数件の記録
- 既存記録の編集
- 記録の削除
- 30分以上の外出有無
- 朝、昼、夜の時間帯区分
- 1件への複数タグ
- タグテンプレート
- 自由メモ

### 気分・状態

標準指標は次の3項目。

- `fatigue`: しんどさ
- `interest`: 関心
- `heaviness`: 気分の重さ

各指標は0～100。

入力方法は以下。

- スライダー
- 数値入力
- `-20`
- `-10`
- `-1`
- 50へリセット
- `+1`
- `+10`
- `+20`

設定画面からカスタム指標を追加・削除できる。

### CBTメモ

- 状況
- 自動思考
- 適応思考
- 自由メモ

### 入力モード

- クイック入力ON
  - 指標入力を中心に表示
  - 記録状況とCBTメモを非表示
- クイック入力OFF
  - 記録状況とCBTメモを表示

クイック入力は表示を切り替えるもので、保存形式は共通。

### グラフ・分析

- 時系列折れ線グラフ
- 表示指標の切り替え
- 外出記録の点線系列
- 直近7件の標準指標平均
- 直近7件の外出数
- 直近7件とその前の7件の比較
- 外出記録と非外出記録の平均比較
- 曜日別平均
- 時間帯別平均
- 使用回数上位8タグの分析
- 追加指標と関心の簡易相関表示

### バックアップ

- CSVエクスポート
- JSONエクスポート
- JSONインポート
- JSON読込前の形式検証と内容プレビュー
- 現在データがある場合の事前バックアップ必須化
- 全置換前の最終確認
- 保存失敗時の読み込み前状態への復旧

CSVインポートはない。

## 保存場所

保存先は、アプリを開いているブラウザの `localStorage`。

Cookie、IndexedDB、サーバー、GitHubリポジトリには記録を保存しない。

`localStorage` はURLの生成元ごとに分離される。
旧GitHub Pages URLの保存データは、現在の公開URLへ自動移行されない。

## 保存キー

### 現行キー

```text
mood-tracker-records-v6
mood-tracker-custom-metrics-v6
mood-tracker-visible-metrics-v6
mood-tracker-tag-presets-v4
```

### 読み込み対象の旧キー

記録:

```text
mood-tracker-records-v5
mood-tracker-records-v4
mood-tracker-records-v3
```

追加指標:

```text
mood-tracker-custom-metrics-v5
mood-tracker-custom-metrics-v4
mood-tracker-custom-metrics-v3
```

表示指標:

```text
mood-tracker-visible-metrics-v5
mood-tracker-visible-metrics-v4
mood-tracker-visible-metrics-v3
```

タグテンプレート:

```text
mood-tracker-tag-presets-v3
mood-tracker-tag-presets-v2
mood-tracker-tag-presets-v1
```

## 記録データの構造

```json
{
  "id": "timestamp-random",
  "date": "YYYY-MM-DD",
  "clockTime": "HH:MM",
  "scores": {
    "fatigue": 50,
    "interest": 50,
    "heaviness": 50,
    "custom-metric-id": 50
  },
  "wentOut": false,
  "timeBucket": "morning",
  "tags": ["仕事", "雨"],
  "cbt": {
    "situation": "",
    "automaticThought": "",
    "adaptiveThought": ""
  },
  "memo": ""
}
```

### その他の保存データ

```text
customMetrics    = [{ id, label, description }]
visibleMetricIds = [metricId, ...]
tagPresets       = [tag, ...]
```

クイック入力状態、現在のタブ、未保存のフォーム内容は永続化されない。

## 古い保存データとの互換処理

- 現行キーから順に旧キーを検索する。
- 読み込んだ記録を現行構造へ正規化する。
- ID、日付、時刻、スコア、時間帯、タグ、CBT、メモの不足値を補完する。
- 時刻がなければ `12:00`。
- 時間帯がなければ `morning`。
- 指標値がなければ50。

制限:

- 読み込んだだけでは旧キーから現行キーへ書き直さない。
- 現行キーに空配列がある場合、旧キーのデータは使用されない。
- 旧版でデータ構造自体が異なる場合の個別変換処理はない。

## 新規作成・編集・削除

### 新規作成

- タイムスタンプとランダム文字列からIDを生成する。
- 記録配列へ追加する。
- 日付、時刻、IDの文字列で昇順ソートする。
- `localStorage`へ保存する。
- 新規保存後は入力フォームを初期化する。

### 編集

- 記録一覧から対象記録を選ぶ。
- IDを保持した状態で入力フォームへ読み込む。
- 保存時に同じIDの要素を置換する。
- 編集では記録件数を増やさない。

### 削除

- 対象ID以外の記録だけを残す。
- 即座に `localStorage`へ保存する。
- 削除確認、Undo、ごみ箱はない。

## 複数記録と複数タグ

- 記録IDが異なるため、同じ日付に複数件保存できる。
- 記録一覧は新しい日時から表示する。
- タグ入力は半角カンマ区切り。
- 前後の空白を除去する。
- 完全一致する重複タグを除去する。
- タグの大文字・小文字や表記揺れは統合しない。
- `、`や全角カンマは区切りとして扱わない。

## 分析処理の定義

- 「直近7件」は7日間ではなく、日時順の最新7レコード。
- 「週次サマリー」は暦週ではなく、最新7レコードとその前の7レコードの比較。
- 曜日別分析は全記録を記録日の曜日でグループ化する。
- 時間帯別分析は時刻から自動判定せず、保存された `timeBucket` を使用する。
- タグ分析は使用回数上位8タグを対象にする。
- 外出比較は標準3指標のみを対象にする。
- 簡易相関は追加指標の最初の6項目を対象にする。
- 追加指標が60以上の記録と40以下の記録について、関心の平均を比較する。
- 統計的な相関係数ではない。

## CSV形式

列は以下。

```text
entry_id
date
clock_time
各標準・追加指標
went_out_30min
time_bucket
tags
situation
automatic_thought
adaptive_thought
memo
```

タグは `|` 区切りで1セルに保存する。

## JSON形式

```json
{
  "exportedAt": "ISO日時",
  "records": [],
  "customMetrics": [],
  "visibleMetricIds": [],
  "tagPresets": []
}
```

JSONインポートは既存データとのマージではなく全置換。

ファイル選択時はまだ保存データを変更せず、次を検証・表示する。

- トップレベルと各配列の型
- 記録、追加指標、タグ、CBT、メモの型
- 日付と時刻の形式
- スコアが0～100の有限数値か
- 記録IDと追加指標IDの重複・危険な名前
- 読み込む件数、期間、追加指標数、タグテンプレート数
- 旧形式から補完する項目と警告件数

現在の記録・カスタム設定がある場合、事前バックアップ操作を行うまで置換ボタンは無効になる。
置換時にも最終確認を行い、`localStorage`への途中保存に失敗した場合は、4つの現行保存キーと画面状態を読み込み前へ戻す。
不明なスコアIDは警告して除外し、不足する旧形式の項目は現行の既定値で補完する。

## ローカル起動方法

アプリ本体のディレクトリへ移動し、静的HTTPサーバーを起動する。

```powershell
Set-Location .\mood-tracker-dev
python -m http.server 8765 --bind 127.0.0.1
```

ブラウザで以下を開く。

```text
http://127.0.0.1:8765/
```

今回のCodex環境では、通常の `python` がPATH上で利用できなかったため、Codex付属Pythonで動作確認した。

```powershell
& "$env:USERPROFILE\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe" `
  -m http.server 8765 --bind 127.0.0.1
```

停止は `Ctrl+C`。

`index.html` の直接起動より、HTTPサーバー経由を推奨する。

## 公開方法

現在の公開版:

```text
https://verrthyne.github.io/mood-tracker/
```

公開リポジトリ:

```text
https://github.com/Verrthyne/mood-tracker
```

確認できた事実:

- 公開リポジトリはPublic。
- 既定ブランチは `main`。
- GitHub Pagesが有効。
- GitHub管理の `pages-build-deployment` が実行されている。
- 2026-05-21の2回のデプロイは成功。
- 2026-07-13の開発引継ぎ文書・合成fixture追加後のデプロイも成功。
- 独自のGitHub Actionsワークフローファイルはない。
- 静的ファイルがGitHub Pagesから配信されている。

未確認:

- GitHub Pages設定画面上の正確なsource branch/folder。

## 開発用clone、公開版、ZIP原本の差分

開発用cloneの追跡対象ファイルは `origin/main` と一致している。

調査に使用したZIP原本と公開版のSHA-256比較では以下を確認した。

- `app.js`: 一致
- `styles.css`: 一致
- `README.md`: 一致
- `index.html`: 1行だけ不一致

差分:

```text
ローカル:
合格版：複数記録 / CBT / 記録状況

公開版:
GitHub Pages
```

ZIP原本と公開リポジトリにはさらに以下の差がある。

- ローカルには `.nojekyll` がある。
- 公開リポジトリには `.nojekyll` がない。
- 公開リポジトリには0バイトの `download` というファイルがある。
- ローカルには `download` がない。

## Gitの現在の状態

- 開発用clone: `mood-tracker-dev`
- 現在ブランチ: `main`
- upstream: `origin/main`
- origin: `https://github.com/Verrthyne/mood-tracker.git`
- 2026-07-14に、JSONインポートの事前検証、プレビュー、バックアップ必須化、保存失敗時の復旧を実装・確認した。
- `AGENTS.md`、`PROJECT_STATUS.md`、`.gitignore`、`fixtures/`、`scripts/` はGit管理下にある。
- 2026-07-13に開発再開時点の基準としてcommit・pushした。
- Gitの作者名は `Verrthyne`、メールはGitHubのnoreplyアドレスをリポジトリ単位で設定している。

ZIP展開物はGitリポジトリではなく、比較用原本として残している。

## バックアップと開発用合成データ

2026-07-13に現在の公開URLから取得したJSONバックアップは、記録0件だった。
元ファイルと同一のコピーを、Git管理外の次の場所へ保管している。

```text
../private-backups/mood-tracker-current-origin-2026-07-13-empty.json
```

SHA-256:

```text
00dee8507a4660f43b674f804fe376c9112b98201faf6e7ec63cd928952ed230
```

開発・動作確認用として、2026-04-01から2026-07-13までの合成データを固定シードで生成した。
実在する人物、出来事、医療情報、CBTメモは含まない。

- 記録数: 151件
- 記録日数: 104日（期間内の全日）
- 複数記録のある日: 44日
- 複数タグ付き記録: 151件
- CBT付き記録: 33件
- 時間帯: 朝、昼、夜の3区分
- タグ: 既定8種
- スコア: 標準3指標、すべて0～100

Gitで管理する再現可能なfixture:

```text
fixtures/synthetic-backup-2026-04-01-to-2026-07-13.json
```

Git管理外の私用バックアップコピー:

```text
../private-backups/mood-tracker-synthetic-2026-04-01-to-2026-07-13.json
```

両ファイルのSHA-256:

```text
d1d7e667af7b2c5b55be8953bdfb1759efb8632402ded1a4696c0caa484c7944
```

合成データは公開版やlocalhostへ自動インポートしていない。

## 今回実行して確認した動作

実データと分離したlocalhostの保存領域で以下を確認した。

- 初期表示
- クイック入力ON/OFF
- 詳細入力の表示
- 新規記録
- 同日2件の保存
- 複数タグ
- 外出状態
- CBTメモ
- 記録一覧
- 記録の編集
- 編集時に件数が増えないこと
- localhost上のテスト記録の削除
- カスタム指標
- 曜日別分析
- 時間帯別分析
- タグ分析
- 外出比較
- 簡易相関
- Chart.jsによるキャンバス描画
- 390×844でのスマートフォン表示
- 保存、タブ切替、タグ操作などのライブリージョン通知
- JavaScript構文確認
- 主要操作中にアプリ由来のエラー表示がないこと

現在の公開URLからJSONエクスポートを実行し、JSONとして解析でき、必要なトップレベル項目が揃うことを確認した。
取得したバックアップの記録件数は0件だった。これが想定外の場合、別ブラウザ・別プロフィールまたは旧URL側の保存データを追加確認する必要がある。
CSVエクスポートは未実行。

JSONインポート安全化について、localhostの既存テストデータを退避・復元しながら次を確認した。

- 不正JSONを拒否し、既存データを変更しない
- 合成バックアップ151件を警告なしで検証する
- 確定前は既存データを変更しない
- 既存データがある場合は事前バックアップまで置換できない
- キャンセル時に既存データを維持する
- 置換後に151件を保存する
- 再読み込み後も151件を保持する
- 記録一覧に151件を描画する
- 曜日、時間帯、タグ分析を描画する
- 不正日付、範囲外スコア、重複ID、危険な追加指標IDを拒否する
- 旧形式の不足項目を警告付きで補完する
- 未知のスコアIDを警告して除外する
- HTMLを含む追加指標名をコードとして実行せず文字として扱う
- `localStorage`の途中保存失敗時に、画面状態と4つの保存キーを復旧する
- 390×844で横スクロールがなく、確認ボタンが画面内に収まる

ブラウザ試験終了時に、アプリのソースには存在しない`MutationObserver`関連エラーがブラウザ制御側ログへ1件記録された。
一時iframeの終了に伴う計測側エラーと推測されるが、発生元URLを取得できなかったため厳密な帰属は未確認。

開発用合成バックアップについて、次を機械的に確認した。

- JSONとして解析できる
- アプリのJSONバックアップと同じトップレベル構造を持つ
- IDが151件すべて一意
- 2026-04-01から2026-07-13までの全日を含む
- 日付、時刻、時間帯、タグ、CBT、スコアの型と値域が妥当
- すべての自由メモと空でないCBT欄に架空データの表示がある
- fixtureとGit管理外バックアップの内容・SHA-256が一致する

## スマートフォン対応

実装:

- `viewport`メタタグ
- 900px以下のレイアウト変更
- 640px以下のモバイルレイアウト
- 統計、入力指標、分析の1列化
- ヘッダーの縦配置
- モバイル用CSVボタン
- 記録削除ボタンの全幅化
- 固定保存バー
- 比較的大きなボタンと入力欄

390×844のビューポートで主要レイアウトを確認済み。

## アクセシビリティ実装

実装済み:

- `lang="ja"`
- スキップリンク
- `aria-live`
- ラベルと入力欄の関連付け
- タブの `role`、`aria-selected`、`aria-controls`
- タブの矢印、Home、End、Enter、Space操作
- 外出ボタンの `aria-pressed`
- `focus-visible`
- `prefers-reduced-motion`
- グラフを色と線種で区別
- 操作結果のスクリーンリーダー向け通知

完全なWCAG監査やスクリーンリーダー実機試験は未実施。

## 既知の問題

### データ・安全性

- 旧公開URLの `localStorage` は現在のURLへ自動移行されない。
- 削除に確認、Undo、ごみ箱がない。
- 通常の新規記録・編集では、`localStorage`の容量超過や保存失敗を利用者へ通知しない。

### セキュリティ

- Chart.jsを外部CDNから読み込むが、SRIがない。

### グラフ・分析

- `pointRadius: 0`のため、記録が1件だけの場合はデータ位置が見えない。
- 孤立した外出記録が点として表示されない。
- 「週次サマリー」という名称だが暦週ではなく7レコード単位。
- 時間帯は実時刻ではなく手動選択値。
- 簡易相関は統計的相関ではない。

### CSV

- カスタム指標名を含むヘッダーをCSVエスケープしていない。
- UTF-8 BOMがない。
- Excelなどで数式として解釈される文字列への対策がない。

### アクセシビリティ

- タブの親に `role="tablist"` がない。
- クイック入力、タグ、表示指標ボタンに `aria-pressed` がない。
- 記録一覧の削除ボタンがすべて同じアクセシブル名。
- canvasの代替データ表がない。

### Git・公開

- ZIP原本はGitリポジトリではない。正式な開発は別のcloneで行う。
- ZIP原本と公開リポジトリは完全一致していない。
- 公開リポジトリに空の `download` がある。
- 公開リポジトリに `.nojekyll` がない。
- 公開されている2コミットに、GitHub noreplyではないGmailアドレスが作者情報として含まれている。

## 未確認事項

- 別ブラウザ・別プロフィールに過去の保存データがないか
- 旧公開URLと旧URL側の実データ
- 旧GitHubユーザー名を指定した検索
- CSVの実ダウンロード結果
- 大量記録時の性能
- iPhone Safari
- Android Chrome
- 他のデスクトップブラウザ
- スクリーンリーダー実機
- 200%ズーム
- 高コントラストモード
- 完全なWCAG適合
- CDN障害時の挙動
- GitHub Pages設定画面上の正確な公開元設定

## 完了した改善

- JSONインポートの事前検証、プレビュー、バックアップ必須化、最終確認
- JSONインポート保存失敗時の状態復旧
- インポート可能なカスタム指標名・説明の安全なHTML表示

## 今後の改善候補

優先度の高い順。

1. 実データのあるブラウザ・プロフィール・旧URLが見つかった場合は、変更前にJSONバックアップを追加取得する。
2. GitHubアカウント側のメール非公開設定を確認する（ローカルcloneはnoreply設定済み）。
3. 公開コミットのメール情報を除去する履歴修正計画を作る。
4. 削除に確認またはUndoを追加する。
5. 単独記録と外出記録が見えるようにグラフ表示を改善する。
6. 「週次サマリー」の名称または集計方法を実態に合わせる。
7. CSVヘッダー、BOM、数式注入対策を改善する。
8. タブ、トグル、削除ボタン、canvasのアクセシビリティを改善する。
9. CDN取得失敗時の表示とフォールバックを追加する。
10. 通常の記録保存失敗時のエラー処理を追加する。
11. 自動テストまたは最低限の回帰確認手順を整備する。
12. `.nojekyll` と空の `download` の扱いを整理する。
