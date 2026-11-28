// 画面ID: Z-04 メンテナンス
import { CenterLayout, Icon, KeyValueList, Banner } from "../../ui";
import { Link, useScreenState } from "../../lib/router";
import { paths } from "../../lib/paths";

export function MaintenanceScreen() {
  const state = useScreenState();
  const extended = state === "延長";
  return (
    <CenterLayout>
      <div className="empty" style={{ padding: "8px 0" }}>
        <span className="empty-icon"><Icon name="wrench" /></span>
        <h3 style={{ fontSize: "var(--text-lg)" }}>メンテナンス中です</h3>
        <p>サービスの更新作業を行っています。終了までお待ちください。</p>
      </div>
      {extended ? (
        <Banner tone="warn" title="終了予定を延長しました">作業に時間がかかっているため、終了予定を 30 分延長しました。</Banner>
      ) : null}
      <KeyValueList
        items={[
          { label: "開始", value: "2026/11/28 02:00 JST" },
          { label: "終了予定", value: <strong>{extended ? "2026/11/28 04:30 JST" : "2026/11/28 04:00 JST"}</strong> },
          { label: "影響", value: "画面の操作、経営判断の記録、承認リンク、監査パックの出力" },
          { label: "影響しないもの", value: "Webhook と同期の受付は続け、終了後に順に処理します。ゲートは「未実行」として返し、通過扱いにはしません。記録済みの証跡は失われません。" },
        ]}
      />
      <p className="tiny muted" style={{ textAlign: "center" }}>このページは終了後に自動で再読み込みされます。最新の状況は <Link to={paths.status()}>稼働状況</Link> で確認できます。</p>
    </CenterLayout>
  );
}
