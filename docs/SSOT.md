# Engineering Platform SSOT

## 目的と対象

小規模なソフトウェア開発チームが、変更内容を検証し、CIゲートの判定と判断材料を追跡できる基盤をつくる。将来はAI支援を開発ワークフローに組み込み、レビューと承認の経緯を記録する。ISO/IEC 29110は将来の要件調査の候補。

初期版の対象は、開発者がローカルでサンプルを選び、CIゲートを通過できる条件と判定理由を確認すること。実装の起点は [LevelCapCoJapanTools/engineering-platform](https://github.com/LevelCapCoJapanTools/engineering-platform) の非公開リポジトリ。利用方法は [README](../README.md)、HTTPの入出力は [OpenAPI](openapi.yaml) を正本とする。

## 採用した構成

| 領域 | 採用構成 | 理由 |
| --- | --- | --- |
| リポジトリ | Rust 2024 Cargo workspaceとReact／TypeScriptのモノレポ | API、Web、DBの変更を同じPRで検証する |
| API | Axum／Tokio、`crates/server` | HTTP、入力制約、稼働・準備確認を扱う |
| 共通ロジック | `crates/platform` | ワークフロー、ゲート、監査、GitHub形式の境界を共有する |
| Worker | Tokio、`crates/worker` の別プロセス | APIから独立してキューを処理する |
| 永続化 | PostgreSQL 17／SQLx | キュー、判定、監査イベントをトランザクションで整合させる |
| 開発とCI | Docker Compose、GitHub Actions | ローカルとCIで同じ一連の動作を検証する |

## ローカルデモの仕様

1. Web画面がシナリオを送信する。APIはGitHub Checksに合わせた固定サンプルと受付イベントを同じトランザクションで保存し、実行IDを返す。
2. Workerは `FOR UPDATE SKIP LOCKED` で未処理の行を1件取得する。同じコミットSHAの `Rust` と `Web` に対応するチェックがそれぞれ1件あり、どちらも `completed` かつ `success` のときに通過とする。それ以外は理由付きでブロックする。別コミットの結果は判定対象から外す。
3. Workerはポリシーバージョン、判定結果、監査イベントを同時に確定する。処理中にトランザクションが中断された場合は未処理行として残る。記録済みの判定は再処理しない。
4. Web画面は判定と監査ログを取得する。監査イベントには実行IDに対応する受付・判定の時刻と処理主体を記録する。

| デモシナリオ | Webチェック | 期待結果 |
| --- | --- | --- |
| すべて成功 | 成功 | 通過 |
| チェック失敗 | 失敗 | ブロック |
| チェック実行中 | 未完了 | ブロック |
| チェックが欠落 | 欠落 | ブロック |

デモポリシーの識別子は `demo-ci-v1`。対象は `example/demo-project` のサンプルスナップショット。デモ用HTTPルートとWorkerは `EP_DEMO_MODE=1` で有効になる。APIが起動時にSQLxマイグレーションを実行してからWorkerを起動する。監査イベントの保存先は開発用PostgreSQLで、DB管理者の更新や削除を防ぐ機能は今後の設計対象。監査時刻はDBで記録し、UIはブラウザのローカル時刻で表示する。

## 開発リポジトリのCIゲート

GitHub Actionsの `CI` が `main` へのpushおよび `main` 向けPRで動く。`Rust` は整形、Clippy、PostgreSQL統合テスト、ビルドを実行し、`Web` はテスト、型検査、ビルドを実行する。`Compose smoke` は4つのサンプルが監査ログまで到達することを検証する。`CI Gate` は3ジョブすべてが成功した場合のみ通過する。GitHub側の `main` 保護ルールで `CI Gate` を必須にする。

| 観点 | 検証先 |
| --- | --- |
| 不足・未完了・失敗・重複・別コミットの扱い | [ゲート単体テスト](../crates/platform/src/gate.rs) |
| 並行Workerと監査記録 | [PostgreSQL統合テスト](../crates/platform/tests/workflow.rs) |
| Webプロキシから判定と監査記録まで | [Composeスモークテスト](../scripts/smoke.mjs) |
| リポジトリの必須チェック | [CIワークフロー](../.github/workflows/ci.yml) |

## 保留事項

| 領域 | 現状と判断が必要なこと |
| --- | --- |
| 認証・認可 | デモはローカル専用。利用者、組織、ロール、テナント境界を設計する |
| GitHub連携 | チェック結果のデータモデルとサンプルを実装。GitHub App、権限、Webhook検証、対象リポジトリ・チェック提供元の確認は未実装 |
| AIエージェント | キューと独立Workerを実装。モデル接続、エージェント実行、承認フロー、顧客コードの実行環境は未実装 |
| CIポリシー | 初期デモはRustの決定論的なルール。OPA／Regoの採否とルール配布を別途判断する |
| 監査証跡の保護 | 保存と閲覧を実装。保持期間、閲覧権限、改ざん対策、外部保管を設計する |
| ISO/IEC 29110 | 対象プロファイル、要求事項と証跡の対応、評価方法を調査する。適合性の判定は未実装 |
| 本番インフラ | ローカルComposeのみ。公開先、契約、構築、デプロイは保留 |

次の設計作業は、認証・認可とGitHub Appの権限境界を決め、検証済みの実チェック結果を同じ判定経路に渡すこと。規格調査の結果は、プロファイルと根拠を確認した段階でこの文書に反映する。
