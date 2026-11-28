// 画面ID: A-01 サインイン
import { useState } from "react";
import { useScreenState, Link } from "../../lib/router";
import { paths } from "../../lib/paths";
import { Banner, Button, CenterLayout, Icon, TextField } from "../../ui";

export function SignIn() {
  const state = useScreenState();
  const [sso, setSso] = useState(false);
  const [domain, setDomain] = useState("");
  const authenticating = state === "authenticating";
  return (
    <CenterLayout>
      <div className="stack" style={{ ["--gap" as string]: "6px" }}>
        <h1 style={{ fontSize: "var(--text-xl)", color: "var(--text-strong)" }}>サインイン</h1>
        <p className="small muted">複数案件の計画・実績・リスク・判断事項と、証跡の準備状況を確認します。</p>
      </div>

      {state === "failed" ? (
        <Banner tone="fail" title="サインインできませんでした">
          IdP での認証がキャンセルされたか、時間切れになりました。もう一度お試しください。5 回続けて失敗すると、15 分間サインインできなくなります。
        </Banner>
      ) : null}
      {state === "noOrg" ? (
        <Banner tone="warn" title="所属している組織がありません">
          kimura@sample-soft.example としてサインインしましたが、参加している組織がありません。組織の管理者に招待を依頼するか、新しく組織を作成してください。
          <div className="row" style={{ marginTop: 10 }}>
            <Button size="sm" variant="primary" to={paths.onboardingOrg()} icon="plus">組織を作成</Button>
            <Button size="sm" variant="ghost" to={paths.signin()}>別のアカウントでサインイン</Button>
          </div>
        </Banner>
      ) : null}

      {state === "mfa" ? (
        <form className="stack" style={{ ["--gap" as string]: "10px" }} onSubmit={(e) => e.preventDefault()}>
          <Banner tone="info">認証アプリに表示された 6 桁のコードを入力してください。</Banner>
          <TextField label="確認コード" placeholder="123456" icon="key" />
          <Button variant="primary" block to={paths.orgs()}>確認してサインイン</Button>
          <Button variant="ghost" block>セキュリティキーを使う</Button>
        </form>
      ) : (
        <>
          <form className="stack" style={{ ["--gap" as string]: "10px" }} onSubmit={(e) => e.preventDefault()}>
            <TextField label="会社のメールアドレス" placeholder="kimura@sample-soft.example" value={domain} onChange={setDomain} icon="building" help="組織で SSO を設定している場合は、会社の IdP の画面に移動します" />
            <Button variant="primary" size="lg" block loading={authenticating} disabled={!domain.trim() && !authenticating} to={domain.trim() && !authenticating ? paths.orgs() : undefined} iconRight="arrowRight">
              {authenticating ? "IdP で認証しています…" : "続ける"}
            </Button>
          </form>

          <div className="divider-text">または</div>

          {sso ? (
            <div className="stack" style={{ ["--gap" as string]: "8px" }}>
              <Button variant="secondary" block icon="github" to={paths.orgs()}>GitHub でサインイン</Button>
              <p className="tiny muted">組織管理者など、GitHub のアカウントを持つ人向けです。PM・開発者がサインインする必要はありません。</p>
            </div>
          ) : (
            <Button variant="secondary" block icon="more" onClick={() => setSso(true)} disabled={authenticating}>ほかの方法でサインイン</Button>
          )}
        </>
      )}

      <p className="tiny muted" style={{ textAlign: "center" }}>
        続行すると <Link to={paths.terms()}>利用規約</Link> と <Link to={paths.privacy()}>プライバシーポリシー</Link> に同意したものとみなします。
      </p>
      <p className="tiny muted row" style={{ justifyContent: "center", ["--gap" as string]: "6px" }}>
        <Icon name="lock" size={12} />
        SSO の組織ではパスワードを保存しません。MFA が必須の組織では確認コードを求めます。
      </p>
    </CenterLayout>
  );
}
