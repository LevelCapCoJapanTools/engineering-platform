import { Fragment } from "react";
import type { ReactNode } from "react";
import type { ScreenDef } from "../../lib/router";
import { useScreenState } from "../../lib/router";
import { paths } from "../../lib/paths";
import { X01PortalHome } from "./X01_PortalHome";
import { X01aPortalChangeNew } from "./X01a_PortalChangeNew";
import { X02PortalApproval } from "./X02_PortalApproval";
import { X03PortalAcceptance } from "./X03_PortalAcceptance";
import { X04AssessorView } from "./X04_AssessorView";
import { X05PartnerDashboard } from "./X05_PartnerDashboard";

const group = "6.11 外部利用者向け";

/** 状態を切り替えたときに画面内の一時状態をリセットする */
function Keyed({ children }: { children: () => ReactNode }) {
  const state = useScreenState();
  return <Fragment key={state}>{children()}</Fragment>;
}

export const externalScreens: ScreenDef[] = [
  { id: "X-01", title: "顧客ポータルのホーム", path: paths.portal(":project"), group, priority: "Must", states: ["通常", "承認待ちなし", "読み込み中", "エラー"], render: (p) => <Keyed>{() => <X01PortalHome project={p.project} />}</Keyed> },
  { id: "X-01a", title: "顧客ポータル: 変更要求の起票", path: paths.portalChangeNew(":project"), group, priority: "Must", states: ["入力", "入力エラー", "送信失敗", "送信完了"], render: (p) => <Keyed>{() => <X01aPortalChangeNew project={p.project} />}</Keyed> },
  { id: "X-02", title: "顧客の承認", path: paths.portalApproval(":project", ":id"), group, priority: "Must", states: ["承認待ち", "承認済み", "他の人が判断済み", "期限超過"], render: (p) => <Keyed>{() => <X02PortalApproval project={p.project} id={p.id} />}</Keyed> },
  { id: "X-03", title: "顧客の受入", path: paths.portalAcceptance(":project", ":id"), group, priority: "Must", states: ["受入待ち", "受入済み", "差戻し済み"], render: (p) => <Keyed>{() => <X03PortalAcceptance project={p.project} id={p.id} />}</Keyed> },
  { id: "X-04", title: "評価者ビュー", path: paths.review(":token"), group, priority: "Must", states: ["有効", "期限切れ", "失効済み"], render: (p) => <Keyed>{() => <X04AssessorView token={p.token} />}</Keyed> },
  { id: "X-05", title: "パートナーの横断ダッシュボード", path: paths.partner(), group, priority: "Later", states: ["通常", "空", "読み込み中", "エラー"], render: () => <Keyed>{() => <X05PartnerDashboard />}</Keyed> },
];
