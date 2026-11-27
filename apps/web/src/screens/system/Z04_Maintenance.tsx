// 画面ID: Z-04 メンテナンス
import { CenterLayout, Icon, KeyValueList, Banner } from "../../ui";
import { useScreenState } from "../../lib/router";

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
          { label: "影響", value: "画面の操作、承認、監査パックの出力" },
          { label: "影響しないもの", value: "GitHub 側のゲート判定は継続します。判定結果は終了後に画面へ反映されます。" },
        ]}
      />
      <p className="tiny muted" style={{ textAlign: "center" }}>このページは終了後に自動で再読み込みされます。</p>
    </CenterLayout>
  );
}
