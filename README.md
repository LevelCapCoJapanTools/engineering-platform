# Engineering Platform

ソフトウェア開発のCI結果を判定し、判断根拠と証跡を追跡するための基盤です。初期版では、GitHub Checksの形式に合わせたサンプルを使い、React画面からAxum API、PostgreSQL、独立Workerを通る一連の流れをローカルで確認できます。

- [プロジェクトのSSOT](docs/SSOT.md) — 範囲、設計判断、実装状況、今後の作業
- [API仕様](docs/openapi.yaml) — OpenAPI 3.1
- [開発時のルール](AGENTS.md)

## 開発環境を起動する

Docker EngineとDocker Compose v2以降を使います。

```sh
docker compose up --build --detach --wait
```

ブラウザで [http://127.0.0.1:5173/#/demo](http://127.0.0.1:5173/#/demo) を開きます。「すべて成功」「チェック失敗」「チェック実行中」「チェックが欠落」のいずれかを選び、判定結果と監査ログを確認します。APIの既定ポートは8080、PostgreSQLのホスト側ポートは55432です。ポートを変更する場合は `.env.example` を `.env` にコピーして編集してください。

製品の全画面のモックは [http://127.0.0.1:5173/#/screens](http://127.0.0.1:5173/#/screens) から開けます。部品の一覧は `#/catalog` です。モックはサンプルデータだけで動き、APIには接続しません。各画面の左下の切替で、空・エラー・権限なしなどの状態を表示できます。画面の直接の利用者は経営層で、PM や開発者の活動は既存システムから同期した値として表示します。画面仕様は [Webデザイン依頼書](docs/design/design-request.md)、[機能ギャップ調査](docs/reserch/gap-analysis-vse-iso29110.md)の各項目と画面の対応は [ギャップ対応表](docs/design/gap-coverage.md) を参照してください。

```sh
docker compose ps
docker compose logs api worker
docker compose down
```

開発用DBはボリュームに保持されます。検証データも削除して初期化する場合は `docker compose down --volumes` を使います。サンプル用の固定DBアカウントを使用しており、公開ポートはループバックに限定しています。

## テストとビルド

Rustは `rust-toolchain.toml`、Node.jsは `.node-version` のバージョンを使います。

```sh
cargo fmt --all -- --check
cargo clippy --workspace --all-targets --locked -- -D warnings
cargo test --workspace --locked
cargo build --workspace --locked

cd apps/web
npm ci
npm test
npm run build
```

PostgreSQL統合テストは、開発用DBを起動した状態でリポジトリのルートから実行します。このテストは接続先に一時データベースを作成するため、開発用インスタンスの `CREATEDB` 権限を持つユーザーを使用します。

```sh
docker compose up --detach --wait db
DATABASE_URL=postgres://engineering:local-dev-only@127.0.0.1:55432/engineering \
  cargo test --workspace --locked -- --include-ignored
```

全サービスの起動後、ルートで `node scripts/smoke.mjs` を実行すると、Webプロキシ経由で4シナリオを処理し、証跡まで検証します。ポートを変えた場合は `API_URL` と `WEB_URL` を指定してください。

ComposeをDBだけに使う場合は、上記の `DATABASE_URL` と `EP_DEMO_MODE=1` を設定し、別ターミナルで `cargo run --locked -p server` と `cargo run --locked -p worker` を順に起動します。最後に `apps/web` で `npm run dev` を起動します。
