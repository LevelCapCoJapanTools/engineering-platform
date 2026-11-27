// 画面ID: A-05 GitHub App のインストール（オンボーディング 2/7）
import { useScreenState, setScreenState } from "../../lib/router";
import { paths } from "../../lib/paths";
import { Banner, Button, Icon, OnboardingLayout, Tag } from "../../ui";

const PERMS = [
  { name: "Pull requests", access: "読み取り", use: "PR の作成者、レビュー、関連する要求 ID を取得する" },
  { name: "Checks", access: "読み取り・書き込み", use: "ゲート A〜D の結果を PR のチェックとして表示する" },
  { name: "Commit statuses", access: "読み取り・書き込み", use: "必須ステータスチェックとして登録する" },
  { name: "Contents", access: "読み取り", use: "要求、設計、trace/edges.yaml などの文書を読む（書き込みはしない）" },
  { name: "Metadata", access: "読み取り", use: "リポジトリ名、既定ブランチを取得する" },
  { name: "Administration", access: "読み取り", use: "ブランチ保護ルールの状態を確認する" },
];

export function GitHubInstall() {
  const state = useScreenState();
  return (
    <OnboardingLayout
      step={1}
      title="GitHub App をインストール"
      description="開発で使っている GitHub に App を入れると、PR にゲートの結果と証跡がつきます。コードの書き換えやマージは行いません。"
      back={paths.onboardingOrg()}
      next={paths.onboardingRepos()}
      nextDisabled={state !== "done"}
      nextDisabledReason="GitHub App のインストールを完了してください"
      errorAt={state === "failed" ? 1 : undefined}
    >
      <div className="card flush">
        <div className="card-header">
          <div>
            <h2 className="section-title">App が要求する権限</h2>
            <p className="section-sub">書き込み権限はチェック結果の表示にだけ使います</p>
          </div>
          <Icon name="github" size={22} className="muted" />
        </div>
        <div className="table-wrap">
          <table className="table compact">
            <thead><tr><th>権限</th><th>アクセス</th><th>用途</th></tr></thead>
            <tbody>
              {PERMS.map((p) => (
                <tr key={p.name}>
                  <td className="mono small">{p.name}</td>
                  <td><Tag tone={p.access.includes("書き込み") ? "warn" : "neutral"} square>{p.access}</Tag></td>
                  <td className="small">{p.use}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {state === "notInstalled" ? (
        <div className="row">
          <Button variant="primary" size="lg" icon="github" onClick={() => setScreenState("installing")}>GitHub でインストール</Button>
          <span className="small muted">GitHub の画面に移動し、インストール先のアカウントを選びます</span>
        </div>
      ) : null}
      {state === "installing" ? (
        <div className="card tight row" style={{ ["--gap" as string]: "12px" }}>
          <span className="spinner" />
          <div className="stack grow" style={{ ["--gap" as string]: "2px" }}>
            <span className="strong">GitHub から戻るのを待っています…</span>
            <span className="small muted">別のタブで GitHub の画面が開いています。インストールが終わると自動で次に進めます。</span>
          </div>
          <Button size="sm" variant="ghost" onClick={() => setScreenState("done")}>インストールを確認</Button>
        </div>
      ) : null}
      {state === "done" ? (
        <Banner tone="pass" title="インストールが完了しました">
          インストール先: <span className="mono">sample-soft</span>（Organization）· 対象リポジトリ: 選択したリポジトリのみ
        </Banner>
      ) : null}
      {state === "failed" ? (
        <Banner tone="fail" title="インストールできませんでした" action={<Button size="sm" icon="refresh" onClick={() => setScreenState("installing")}>再試行</Button>}>
          GitHub の Organization で App をインストールする権限（Owner）がありません。Organization の Owner にインストールを依頼するか、権限を付与してもらってください。
        </Banner>
      ) : null}
    </OnboardingLayout>
  );
}
