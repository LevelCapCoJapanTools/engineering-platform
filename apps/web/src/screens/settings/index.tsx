import { Fragment } from "react";
import type { ReactNode } from "react";
import type { ScreenDef } from "../../lib/router";
import { useScreenState } from "../../lib/router";
import { paths } from "../../lib/paths";
import { S01OrgSettings } from "./S01_OrgSettings";
import { S02Members } from "./S02_Members";
import { S03Integrations } from "./S03_Integrations";
import { S04AiData } from "./S04_AiData";
import { S05EvidenceStorage } from "./S05_EvidenceStorage";
import { S06Security } from "./S06_Security";
import { S07Billing } from "./S07_Billing";
import { S08Profile } from "./S08_Profile";

const group = "6.10 設定";

/** 状態を切り替えたときに画面内の一時状態をリセットする */
function Keyed({ children }: { children: () => ReactNode }) {
  const state = useScreenState();
  return <Fragment key={state}>{children()}</Fragment>;
}

export const settingsScreens: ScreenDef[] = [
  { id: "S-01", title: "組織の設定", path: paths.settings(":org"), group, priority: "Must", states: ["通常", "入力エラー", "閲覧のみ", "読み込み中", "エラー"], render: (p) => <Keyed>{() => <S01OrgSettings org={p.org} />}</Keyed> },
  { id: "S-02", title: "メンバーとロール", path: paths.members(":org"), group, priority: "Must", states: ["通常", "違反なし", "空", "読み込み中", "エラー"], render: (p) => <Keyed>{() => <S02Members org={p.org} />}</Keyed> },
  { id: "S-03", title: "連携", path: paths.integrations(":org"), group, priority: "Must", states: ["接続済み", "権限不足", "切断", "Webhookエラー", "読み込み中", "エラー"], render: (p) => <Keyed>{() => <S03Integrations org={p.org} />}</Keyed> },
  { id: "S-04", title: "AIとデータ分類", path: paths.aiSettings(":org"), group, priority: "Must", states: ["通常", "AI無効", "送信ログなし", "読み込み中", "エラー"], render: (p) => <Keyed>{() => <S04AiData org={p.org} />}</Keyed> },
  { id: "S-05", title: "証跡の保管", path: paths.evidenceSettings(":org"), group, priority: "Must", states: ["正常", "保管失敗", "読み込み中", "エラー"], render: (p) => <Keyed>{() => <S05EvidenceStorage org={p.org} />}</Keyed> },
  { id: "S-06", title: "セキュリティ", path: paths.security_(":org"), group, priority: "Should", states: ["通常", "SSO未設定", "読み込み中", "エラー"], render: (p) => <Keyed>{() => <S06Security org={p.org} />}</Keyed> },
  { id: "S-07", title: "プランと請求", path: paths.billing(":org"), group, priority: "Must", states: ["通常", "上限到達", "支払い失敗", "読み込み中", "エラー"], render: (p) => <Keyed>{() => <S07Billing org={p.org} />}</Keyed> },
  { id: "S-08", title: "個人設定", path: paths.me(), group, priority: "Must", states: ["通常", "GitHub未連携", "読み込み中", "エラー"], render: () => <Keyed>{() => <S08Profile />}</Keyed> },
];
