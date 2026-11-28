// 画面ID: A-05 コードホスティングの接続（オンボーディング 2/10）
// GitHub／GitLab／AWS CodeCommit／Azure Repos から選び、必要な権限と取得するデータを示してから接続する。
import { useState } from "react";
import { useScreenState, setScreenState } from "../../lib/router";
import type { ProviderKey } from "../../lib/vocab";
import { PROVIDERS } from "../../lib/vocab";
import { Banner, Button, OptionCard, ProviderBadge, Select, Tag } from "../../ui";
import { ExecOnboarding, SkipButton } from "./parts";

type ScmKey = Extract<ProviderKey, "github" | "gitlab" | "codecommit" | "azureRepos">;

const HOSTING: Record<ScmKey, { value: string; label: string }[]> = {
  github: [{ value: "cloud", label: "GitHub.com／Enterprise Cloud" }, { value: "server", label: "GitHub Enterprise Server（社内設置）" }],
  gitlab: [{ value: "cloud", label: "GitLab.com" }, { value: "self", label: "GitLab Self-Managed（社内設置）" }],
  codecommit: [{ value: "tokyo", label: "AWS アカウント・ap-northeast-1（東京）" }, { value: "osaka", label: "AWS アカウント・ap-northeast-3（大阪）" }],
  azureRepos: [{ value: "services", label: "Azure DevOps Services" }, { value: "server", label: "Azure DevOps Server（社内設置）" }],
};

const PERMS: Record<ScmKey, { name: string; access: string; use: string }[]> = {
  github: [
    { name: "Pull requests", access: "読み取り", use: "PR の作成者、レビュー、関連する要求 ID を取得する" },
    { name: "Checks", access: "読み取り・書き込み", use: "ゲート A〜D の結果を PR のチェックとして表示する" },
    { name: "Contents", access: "読み取り", use: "要求、設計、トレースの文書を読む（書き込みはしない）" },
    { name: "Administration", access: "読み取り", use: "ブランチ保護ルールの設定漏れ・変更を検知する" },
  ],
  gitlab: [
    { name: "read_api", access: "読み取り", use: "MR、パイプライン、レビュー、保護ブランチを取得する" },
    { name: "External Status Check", access: "書き込み", use: "MR の HEAD SHA ごとにゲートの結果を返す" },
    { name: "Webhook", access: "受信", use: "Push、MR、パイプラインのイベントを受け取る（共有トークンで検証）" },
  ],
  codecommit: [
    { name: "IAM ロール（読み取り）", access: "読み取り", use: "リポジトリ、コミット、プルリクエストを取得する" },
    { name: "承認ルール", access: "読み取り・書き込み", use: "ゲートの結果をプルリクエストの承認ルールに反映する" },
    { name: "EventBridge 連携", access: "受信", use: "プルリクエストとコミットのイベントを受け取る" },
  ],
  azureRepos: [
    { name: "Code (Read)", access: "読み取り", use: "リポジトリ、PR、レビューを取得する" },
    { name: "PR Status", access: "書き込み", use: "ゲートの結果を genre/name 形式の状態として PR に投稿する" },
    { name: "Service Hooks", access: "受信", use: "PR、ビルドのイベントを受け取る" },
  ],
};

const SCMS: ScmKey[] = ["github", "gitlab", "codecommit", "azureRepos"];

export function GitHubInstall() {
  const state = useScreenState();
  const [provider, setProvider] = useState<ScmKey>("github");
  const [hosting, setHosting] = useState(HOSTING.github[0].value);
  return (
    <ExecOnboarding
      step={1}
      title="コードホスティングを接続"
      description="開発で使っているコードホスティングを接続すると、PR/MR・レビュー・CI の結果を取り込み、ゲートの結果を返します。コードの書き換えやマージは行いません。接続の作業は組織管理者や開発責任者に任せることもできます。"
      nextDisabled={state !== "done"}
      nextDisabledReason="接続を完了するか「あとで設定」を選んでください"
      errorAt={state === "failed" ? 1 : undefined}
      extra={<SkipButton step={1} />}
    >
      <div className="grid cols-2" style={{ ["--gap" as string]: "8px" }}>
        {SCMS.map((k) => (
          <OptionCard
            key={k}
            name="scm"
            value={k}
            checked={provider === k}
            onChange={(v) => { setProvider(v as ScmKey); setHosting(HOSTING[v as ScmKey][0].value); }}
            title={<ProviderBadge provider={k} showStatus />}
            description={PROVIDERS[k].note}
          />
        ))}
      </div>

      <Select label="接続先" value={hosting} onChange={setHosting} options={HOSTING[provider]} help="対象の範囲（クラウド／社内設置、アカウント・リージョン）を明記して接続します" />
      {provider === "codecommit" ? (
        <Banner tone="warn" title="AWS CodeCommit には計画管理の機能がありません">計画・予定の情報は、次の「計画・カレンダー」で GitHub Projects や Jira などを別途接続してください。接続しないと、経営ダッシュボードの計画情報が欠けます。</Banner>
      ) : null}

      <div className="card flush">
        <div className="card-header">
          <div>
            <h2 className="section-title">必要な権限と用途</h2>
            <p className="section-sub">書き込みはゲートの結果の表示にだけ使います。接続の資格情報は暗号化して保管します</p>
          </div>
        </div>
        <div className="table-wrap">
          <table className="table compact">
            <thead><tr><th>権限</th><th>アクセス</th><th>用途</th></tr></thead>
            <tbody>
              {PERMS[provider].map((p) => (
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
          <Button variant="primary" size="lg" icon="plug" onClick={() => setScreenState("installing")}>{PROVIDERS[provider].label} に接続</Button>
          <span className="small muted">{PROVIDERS[provider].label} の画面で、接続先と対象を選びます</span>
        </div>
      ) : null}
      {state === "installing" ? (
        <div className="card tight row" style={{ ["--gap" as string]: "12px" }}>
          <span className="spinner" />
          <div className="stack grow" style={{ ["--gap" as string]: "2px" }}>
            <span className="strong">{PROVIDERS[provider].label} から戻るのを待っています…</span>
            <span className="small muted">別のタブで認可の画面が開いています。完了すると自動で次に進めます。</span>
          </div>
          <Button size="sm" variant="ghost" onClick={() => setScreenState("done")}>接続を確認</Button>
        </div>
      ) : null}
      {state === "done" ? (
        <Banner tone="pass" title="接続しました">
          接続先: <span className="mono">sample-soft</span>（{HOSTING[provider].find((h) => h.value === hosting)?.label}）· 対象: 選択したリポジトリのみ · Webhook の署名検証: 有効
        </Banner>
      ) : null}
      {state === "failed" ? (
        <Banner tone="fail" title="接続できませんでした" action={<Button size="sm" icon="refresh" onClick={() => setScreenState("installing")}>再試行</Button>}>
          接続先で App をインストールする権限（Organization の Owner など）がありません。権限を持つ人に接続を依頼するか、権限を付与してもらってください。
        </Banner>
      ) : null}
    </ExecOnboarding>
  );
}
