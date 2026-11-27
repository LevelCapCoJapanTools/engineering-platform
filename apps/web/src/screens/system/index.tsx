import type { ScreenDef } from "../../lib/router";
import { paths } from "../../lib/paths";
import { NotFoundScreen } from "./Z01_NotFound";
import { ForbiddenScreen } from "./Z02_Forbidden";
import { ErrorScreen } from "./Z03_Error";
import { MaintenanceScreen } from "./Z04_Maintenance";
import { SessionExpiredScreen } from "./Z05_SessionExpired";
import { GithubCheckScreen } from "./W01_GithubCheck";
import { EmailScreen } from "./W02_Email";

const Z = "6.12 共通の状態画面";
const W = "6.13 Web以外の表示面";

export const systemScreens: ScreenDef[] = [
  { id: "Z-01", title: "見つからない", path: paths.notFound(), group: Z, priority: "Must", render: () => <NotFoundScreen /> },
  { id: "Z-02", title: "権限がない", path: paths.forbidden(), group: Z, priority: "Must", states: ["ロール不足", "職務分離", "プロジェクト外"], render: () => <ForbiddenScreen /> },
  { id: "Z-03", title: "エラー", path: paths.error(), group: Z, priority: "Must", states: ["エラー", "再試行中"], render: () => <ErrorScreen /> },
  { id: "Z-04", title: "メンテナンス", path: paths.maintenance(), group: Z, priority: "Should", states: ["予定どおり", "延長"], render: () => <MaintenanceScreen /> },
  { id: "Z-05", title: "セッション切れ", path: paths.sessionExpired(), group: Z, priority: "Must", states: ["通常", "入力途中あり"], render: () => <SessionExpiredScreen /> },
  { id: "W-01", title: "GitHub のチェック結果", path: paths.checkRun(), group: W, priority: "Must", states: ["ブロック", "通過", "警告のみ", "例外適用中"], render: () => <GithubCheckScreen /> },
  { id: "W-02", title: "通知メール", path: paths.emails(), group: W, priority: "Should", states: ["承認の依頼", "承認・差戻しの結果", "例外の期限", "ゲートのブロック", "受入の依頼", "共有リンクの発行"], render: () => <EmailScreen /> },
];
