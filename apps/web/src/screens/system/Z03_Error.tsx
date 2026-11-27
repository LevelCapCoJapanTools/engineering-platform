// 画面ID: Z-03 エラー
import { useState } from "react";
import { Button, CenterLayout, HashDisplay, Icon } from "../../ui";
import { useScreenState } from "../../lib/router";
import { ORG, paths } from "../../lib/paths";

export function ErrorScreen() {
  const state = useScreenState();
  const [retrying, setRetrying] = useState(state === "再試行中");
  const retry = () => {
    setRetrying(true);
    window.setTimeout(() => setRetrying(false), 1500);
  };
  return (
    <CenterLayout>
      <div className="empty" style={{ padding: "8px 0" }}>
        <span className="empty-icon" style={{ background: "var(--tone-fail-bg)", color: "var(--tone-fail)" }}><Icon name="alertCircle" /></span>
        <p className="mono muted" style={{ fontSize: "var(--text-xs)" }}>500</p>
        <h3 style={{ fontSize: "var(--text-lg)" }}>問題が発生しました</h3>
        <p>
          ページを表示できませんでした。入力内容やゲートの判定結果は失われていません。
          時間をおいて再試行してください。
        </p>
      </div>
      <div className="card tight stack" style={{ ["--gap" as string]: "6px", background: "var(--bg-subtle)" }}>
        <span className="label">問い合わせ用ID</span>
        <HashDisplay value="req-7f3a91c2-4b1e-4d0a-9c55-0e21aa13f6b0" full />
        <span className="tiny muted">お問い合わせの際はこのIDを添えてください。発生時刻: 2026/11/27 10:30 JST</span>
      </div>
      <div className="stack" style={{ ["--gap" as string]: "8px" }}>
        <Button variant="primary" icon="refresh" block loading={retrying} onClick={retry}>{retrying ? "再試行しています…" : "再試行"}</Button>
        <Button variant="secondary" icon="external" block onClick={() => undefined}>稼働状況ページを見る</Button>
        <Button variant="ghost" icon="home" block to={paths.orgHome(ORG)}>ダッシュボードへ戻る</Button>
      </div>
      <p className="tiny muted" style={{ textAlign: "center" }}>稼働状況: status.example（モックでは外部に遷移しません）</p>
    </CenterLayout>
  );
}
