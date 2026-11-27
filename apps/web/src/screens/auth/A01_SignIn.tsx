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
        <p className="small muted">開発のゲートと証跡をひとつの場所で確認します。</p>
      </div>

      {state === "failed" ? (
        <Banner tone="fail" title="サインインできませんでした">
          GitHub での認証がキャンセルされたか、時間切れになりました。もう一度お試しください。
        </Banner>
      ) : null}
      {state === "noOrg" ? (
        <Banner tone="warn" title="所属している組織がありません">
          msato-dev としてサインインしましたが、参加している組織がありません。組織の管理者に招待を依頼するか、新しく組織を作成してください。
          <div className="row" style={{ marginTop: 10 }}>
            <Button size="sm" variant="primary" to={paths.onboardingOrg()} icon="plus">組織を作成</Button>
            <Button size="sm" variant="ghost" to={paths.signin()}>別のアカウントでサインイン</Button>
          </div>
        </Banner>
      ) : null}

      <Button variant="primary" size="lg" block icon="github" loading={authenticating} to={authenticating ? undefined : paths.orgs()}>
        {authenticating ? "GitHub で認証しています…" : "GitHub でサインイン"}
      </Button>

      <div className="divider-text">または</div>

      {sso ? (
        <form className="stack" style={{ ["--gap" as string]: "10px" }} onSubmit={(e) => e.preventDefault()}>
          <TextField label="会社のメールアドレスまたはドメイン" placeholder="sample-soft.example" value={domain} onChange={setDomain} icon="building" help="組織で SSO（SAML）を設定している場合に使えます" />
          <Button variant="secondary" block disabled={!domain.trim()} to={domain.trim() ? paths.orgs() : undefined} iconRight="arrowRight">SSO で続ける</Button>
        </form>
      ) : (
        <Button variant="secondary" block icon="key" onClick={() => setSso(true)} disabled={authenticating}>SSO でサインイン</Button>
      )}

      <p className="tiny muted" style={{ textAlign: "center" }}>
        続行すると <Link to={paths.terms()}>利用規約</Link> と <Link to={paths.privacy()}>プライバシーポリシー</Link> に同意したものとみなします。
      </p>
      <p className="tiny muted row" style={{ justifyContent: "center", ["--gap" as string]: "6px" }}>
        <Icon name="lock" size={12} />
        パスワードは保存しません。認証は GitHub または組織の IdP が行います。
      </p>
    </CenterLayout>
  );
}
