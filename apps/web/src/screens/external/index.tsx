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
import { X06ApprovalLink } from "./X06_ApprovalLink";
import { X07PortalSchedule } from "./X07_PortalSchedule";
import { X08PortalRequests } from "./X08_PortalRequests";
import { X09PortalRequestDetail } from "./X09_PortalRequestDetail";
import { X10PortalRouting } from "./X10_PortalRouting";
import { X11PortalMaterials } from "./X11_PortalMaterials";
import "./external.css";

const group = "6.11 外部利用者向け";

/** 状態を切り替えたときに画面内の一時状態をリセットする */
function Keyed({ children }: { children: () => ReactNode }) {
  const state = useScreenState();
  return <Fragment key={state}>{children()}</Fragment>;
}

export const externalScreens: ScreenDef[] = [
  { id: "X-01", title: "顧客ポータル: 案件ホーム", path: paths.portal(":project"), group, priority: "Must", states: ["通常", "業務提携型", "招待直後（未公開）", "承認待ちなし", "セッション切れ間近", "他の案件", "読み込み中", "エラー"], render: (p) => <Keyed>{() => <X01PortalHome project={p.project} />}</Keyed> },
  { id: "X-01a", title: "顧客ポータル: 変更の申し出", path: paths.portalChangeNew(":project"), group, priority: "Must", states: ["入力", "入力エラー", "送信失敗", "送信完了", "条件の提示あり"], render: (p) => <Keyed>{() => <X01aPortalChangeNew project={p.project} />}</Keyed> },
  { id: "X-02", title: "顧客の承認", path: paths.portalApproval(":project", ":id"), group, priority: "Must", states: ["承認待ち", "質問を送信済み", "旧版の申請", "承認済み", "他の人が判断済み", "期限超過"], render: (p) => <Keyed>{() => <X02PortalApproval project={p.project} id={p.id} />}</Keyed> },
  { id: "X-03", title: "顧客の受入（受入試験と部分受入）", path: paths.portalAcceptance(":project", ":id"), group, priority: "Must", states: ["受入試験中", "一部受入", "修正版の再確認", "受入済み", "差戻し済み"], render: (p) => <Keyed>{() => <X03PortalAcceptance project={p.project} id={p.id} />}</Keyed> },
  { id: "X-04", title: "評価者ビュー", path: paths.review(":token"), group, priority: "Must", states: ["有効", "本人確認前", "期限切れ", "失効済み"], render: (p) => <Keyed>{() => <X04AssessorView token={p.token} />}</Keyed> },
  { id: "X-05", title: "パートナーの横断ダッシュボード", path: paths.partner(), group, priority: "Later", states: ["通常", "委任切れあり", "空", "読み込み中", "エラー"], render: () => <Keyed>{() => <X05PartnerDashboard />}</Keyed> },
  { id: "X-06", title: "期限付き承認リンク", path: paths.approvalLink(":token"), group, priority: "Must", states: ["本人確認前", "確認済み", "版が変わった", "自分が作成", "使用済み", "期限切れ"], render: (p) => <Keyed>{() => <X06ApprovalLink token={p.token} />}</Keyed> },
  { id: "X-07", title: "顧客ポータル: 予定と購読", path: paths.portalSchedule(":project"), group, priority: "Must", states: ["通常", "購読中", "購読を停止", "業務提携型", "予定なし", "読み込み中", "エラー"], render: (p) => <Keyed>{() => <X07PortalSchedule project={p.project} />}</Keyed> },
  { id: "X-08", title: "顧客ポータル: 申請・承認の受信箱", path: paths.portalRequests(":project"), group, priority: "Must", states: ["通常", "業務提携型", "空", "読み込み中", "エラー"], render: (p) => <Keyed>{() => <X08PortalRequests project={p.project} />}</Keyed> },
  { id: "X-09", title: "顧客ポータル: 申請の詳細", path: paths.portalRequest(":project", ":id"), group, priority: "Must", states: ["回答待ち", "あなたの決裁", "質問の往復", "決裁上限を超える改訂", "共同決裁", "旧版の申請", "承認済み", "権限なし", "読み込み中", "エラー"], render: (p) => <Keyed>{() => <X09PortalRequestDetail project={p.project} id={p.id} />}</Keyed> },
  { id: "X-10", title: "顧客ポータル: 社内の権限者と稟議", path: paths.portalRouting(":project"), group, priority: "Must", states: ["通常", "担当交代", "管理者以外", "読み込み中", "エラー"], render: (p) => <Keyed>{() => <X10PortalRouting project={p.project} />}</Keyed> },
  { id: "X-11", title: "顧客ポータル: 資料の提出", path: paths.portalMaterials(":project"), group, priority: "Should", states: ["通常", "提出の確認", "業務提携型", "空", "読み込み中", "エラー"], render: (p) => <Keyed>{() => <X11PortalMaterials project={p.project} />}</Keyed> },
];
