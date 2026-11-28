// 画面ID: Z-01 見つからない
import { Button, CenterLayout, Icon } from "../../ui";
import { ORG, paths } from "../../lib/paths";

export function NotFoundScreen() {
  return (
    <CenterLayout>
      <div className="empty" style={{ padding: "8px 0" }}>
        <span className="empty-icon"><Icon name="search" /></span>
        <p className="mono muted" style={{ fontSize: "var(--text-xs)" }}>404</p>
        <h3 style={{ fontSize: "var(--text-lg)" }}>ページが見つかりません</h3>
        <p>
          URL が間違っているか、ページが移動・削除された可能性があります。
          共有されたリンクの場合は、共有元に新しいリンクを依頼してください。
        </p>
      </div>
      <div className="stack" style={{ ["--gap" as string]: "8px" }}>
        <Button variant="primary" icon="home" block to={paths.orgHome(ORG)}>ダッシュボードへ戻る</Button>
        <Button variant="ghost" icon="arrowLeft" block onClick={() => window.history.back()}>前のページに戻る</Button>
      </div>
    </CenterLayout>
  );
}
