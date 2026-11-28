// 画面群: 6.16 連携と同期（2026-11-28 追加）
import type { ScreenDef } from "../../lib/router";
import { paths } from "../../lib/paths";
import { K01Connectors } from "./K01_Connectors";
import { K02ConnectorNew } from "./K02_ConnectorNew";
import { K03ConnectorDetail } from "./K03_ConnectorDetail";
import { K04Capabilities } from "./K04_Capabilities";
import { K05Mapping } from "./K05_Mapping";
import { K06Sources } from "./K06_Sources";
import { K07Deliveries } from "./K07_Deliveries";
import { K08ImportDiag } from "./K08_ImportDiag";
import { K09ReferenceMatching } from "./K09_ReferenceMatching";

const group = "6.16 連携と同期";

export const connectorScreens: ScreenDef[] = [
  { id: "K-01", title: "連携と同期", path: paths.connectors(":org"), group, priority: "Must", states: ["default", "empty", "loading", "error"], render: () => <K01Connectors /> },
  { id: "K-02", title: "連携の追加", path: paths.connectorNew(":org"), group, priority: "Must", states: ["種類", "サービス", "接続先", "権限と取得データ", "対象範囲", "正本", "確認", "権限不足", "接続失敗"], render: () => <K02ConnectorNew /> },
  { id: "K-03", title: "連携の詳細", path: paths.connector(":org", ":id"), group, priority: "Must", states: ["default", "healthy", "delayed", "authExpired", "failing", "initialSync", "loading", "error"], render: (p) => <K03ConnectorDetail key={p.id} id={p.id} /> },
  { id: "K-04", title: "プロバイダー能力マトリクス", path: paths.capabilities(":org"), group, priority: "Must", states: ["default", "loading", "error"], render: () => <K04Capabilities /> },
  { id: "K-05", title: "外部データの対応付け", path: paths.mapping(":org"), group, priority: "Must", states: ["default", "empty", "loading", "error"], render: () => <K05Mapping /> },
  { id: "K-06", title: "正本と同期ルール", path: paths.sources(":org"), group, priority: "Must", states: ["default", "conflict", "loading", "error"], render: () => <K06Sources /> },
  { id: "K-07", title: "受信イベントと再同期", path: paths.deliveries(":org"), group, priority: "Must", states: ["default", "empty", "loading", "error"], render: () => <K07Deliveries /> },
  { id: "K-08", title: "初期インポートと診断", path: paths.importDiag(":org"), group, priority: "Should", states: ["default", "running", "clean", "loading", "error"], render: () => <K08ImportDiag /> },
  { id: "K-09", title: "成果参照の照合（提供元別）", path: paths.referenceMatching(":org"), group, priority: "Must", states: ["default", "mismatch", "empty", "loading", "error"], render: () => <K09ReferenceMatching /> },
];
