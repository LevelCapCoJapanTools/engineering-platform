// 画面ID: Z-05 セッション切れ
import { Banner, Button, CenterLayout, Icon } from "../../ui";
import { useScreenState } from "../../lib/router";
import { paths } from "../../lib/paths";

export function SessionExpiredScreen() {
  const state = useScreenState();
  const hasDraft = state === "入力途中あり";
  return (
    <CenterLayout>
      <div className="empty" style={{ padding: "8px 0" }}>
        <span className="empty-icon"><Icon name="clock" /></span>
        <h3 style={{ fontSize: "var(--text-lg)" }}>セッションの有効期限が切れました</h3>
        <p>安全のため、一定時間操作がなかったのでサインアウトしました。もう一度サインインしてください。</p>
      </div>
      {hasDraft ? (
        <Banner tone="warn" title="入力途中の内容が失われる可能性があります">
          「REQ-0007 の編集」で保存していない変更があります。サインイン後に同じ画面へ戻りますが、保存していない内容は復元できない場合があります。
        </Banner>
      ) : (
        <Banner tone="info">サインイン後、直前に開いていた画面に戻ります。</Banner>
      )}
      <div className="stack" style={{ ["--gap" as string]: "8px" }}>
        <Button variant="primary" icon="github" block to={paths.signin()}>再サインイン</Button>
      </div>
      <p className="tiny muted" style={{ textAlign: "center" }}>セッションの有効期間は組織の「セキュリティ」設定で変更できます。</p>
    </CenterLayout>
  );
}
