// 画面ID: S-03 連携
import { useScreenState } from "../../lib/router";
import { ORG } from "../../lib/paths";
import { repos } from "../../mocks/core";
import { githubInstallation } from "../../mocks/settings";
import { Banner, Button, CodeRef, ErrorState, Icon, Section, SettingsLayout, Skeleton, Tag, Timestamp } from "../../ui";

export function S03Integrations({ org = ORG }: { org?: string }) {
  const state = useScreenState();
  const connected = state !== "切断";
  const lacking = state === "権限不足";
  const webhookError = state === "Webhookエラー";
  const targetRepos = repos.slice(0, 4);

  const statusTag = !connected ? (
    <Tag tone="fail" icon="xCircle">切断</Tag>
  ) : lacking ? (
    <Tag tone="warn" icon="alert">権限不足</Tag>
  ) : webhookError ? (
    <Tag tone="warn" icon="alert">Webhook の受信エラー</Tag>
  ) : (
    <Tag tone="pass" icon="checkCircle">接続済み</Tag>
  );

  return (
    <SettingsLayout org={org} active="integrations" title="連携" description="Git サービスと接続し、PR のイベントを受け取ってゲートの判定を返します。">
      {state === "読み込み中" ? (
        <Skeleton variant="detail" />
      ) : state === "エラー" ? (
        <ErrorState />
      ) : (
        <>
          {!connected ? (
            <Banner tone="fail" title="GitHub App との接続が切れています" action={<Button variant="primary" icon="github">GitHub で再インストール</Button>}>
              2026-11-26 に App がアンインストールされました。新しい PR にはゲートの判定が表示されません。過去の判定と証跡は保持されています。
            </Banner>
          ) : null}
          {lacking ? (
            <Banner tone="warn" title="App に必要な権限が不足しています" action={<Button variant="primary" icon="external">権限を承認する</Button>}>
              「Commit statuses」の書き込み権限が承認されていないため、必須ステータスチェックへ判定を登録できません。GitHub の組織管理者が権限の更新を承認してください。
            </Banner>
          ) : null}
          {webhookError ? (
            <Banner tone="warn" title="直近の Webhook 2件の受信に失敗しました">
              署名の検証に失敗しています（HTTP 401）。Webhook シークレットが更新された可能性があります。「GitHub で設定を変更」から再設定してください。
            </Banner>
          ) : null}

          <Section
            title={
              <span className="row" style={{ ["--gap" as string]: "10px" }}>
                <Icon name="github" size={20} />
                GitHub
                {statusTag}
              </span>
            }
            sub={connected ? `インストール先: ${githubInstallation.account} · ${targetRepos.length} リポジトリを対象` : "未接続"}
            actions={connected ? <Button icon="external">GitHub で設定を変更</Button> : <Button variant="primary" icon="github">GitHub でインストール</Button>}
          >
            {connected ? (
              <div className="stack">
                <div className="grid cols-3">
                  <div className="stat"><span className="stat-label"><Icon name="building" size={14} />インストール先</span><span className="strong">{githubInstallation.account}</span><span className="stat-delta">インストール <Timestamp at={githubInstallation.installed_at} mode="date" /></span></div>
                  <div className="stat"><span className="stat-label"><Icon name="refresh" size={14} />最終同期</span><span className="strong"><Timestamp at={githubInstallation.last_synced_at} /></span><span className="stat-delta">リポジトリ・ブランチ保護設定</span></div>
                  <div className={webhookError ? "stat warn" : "stat"}><span className="stat-label"><Icon name="bell" size={14} />Webhook の受信</span><span className="strong">{webhookError ? "失敗 2件" : "正常"}</span><span className="stat-delta">直近24時間 {webhookError ? "126件中 2件失敗" : "124件"}</span></div>
                </div>

                <div className="stack" style={{ ["--gap" as string]: "8px" }}>
                  <span className="label">権限と用途</span>
                  <div className="table-wrap">
                    <table className="table compact">
                      <thead><tr><th>権限</th><th>アクセス</th><th>用途</th><th>状態</th></tr></thead>
                      <tbody>
                        {githubInstallation.permissions.map((p) => {
                          const missing = lacking && p.name === "Commit statuses";
                          return (
                            <tr key={p.name}>
                              <td className="strong">{p.name}</td>
                              <td><Tag tone={p.access.includes("書き込み") ? "warn" : "neutral"} square>{p.access}</Tag></td>
                              <td className="small muted">{p.purpose}</td>
                              <td>{missing ? <Tag tone="fail" icon="xCircle">未承認</Tag> : <Tag tone="pass" icon="check">承認済み</Tag>}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="stack" style={{ ["--gap" as string]: "8px" }}>
                  <span className="label">対象リポジトリ</span>
                  {targetRepos.map((r) => (
                    <div key={r.id} className="row between" style={{ padding: "8px 12px", border: "1px solid var(--border)", borderRadius: 8 }}>
                      <span className="row" style={{ ["--gap" as string]: "8px" }}>
                        <CodeRef kind="repo" value={r.full_name} />
                        <Tag square>{r.visibility === "private" ? "非公開" : r.visibility === "internal" ? "組織内" : "公開"}</Tag>
                        <span className="tiny muted">既定ブランチ: {r.default_branch}</span>
                      </span>
                      <span className="row small" style={{ ["--gap" as string]: "6px" }}>
                        <Icon name="shieldCheck" size={14} className="text-pass" />
                        必須チェック登録済み
                      </span>
                    </div>
                  ))}
                </div>

                <div className="stack" style={{ ["--gap" as string]: "8px" }}>
                  <span className="label">最近の Webhook</span>
                  <div className="table-wrap">
                    <table className="table compact">
                      <thead><tr><th>配信ID</th><th>イベント</th><th>受信</th><th>結果</th></tr></thead>
                      <tbody>
                        {[...(webhookError ? githubInstallation.failed_deliveries : []), ...githubInstallation.deliveries].map((d) => (
                          <tr key={d.id}>
                            <td className="mono small">{d.id}</td>
                            <td className="mono small">{d.event}</td>
                            <td className="small"><Timestamp at={d.at} /></td>
                            <td>{d.status === 200 ? <Tag tone="pass">200 受信</Tag> : <Tag tone="fail">{d.status} 署名検証失敗</Tag>}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="stack" style={{ ["--gap" as string]: "8px" }}>
                <p className="muted">GitHub App をインストールすると、PR ごとにゲート A〜D の判定が GitHub のチェックとして表示されます。</p>
              </div>
            )}
          </Section>

          <Section title={<span className="row" style={{ ["--gap" as string]: "10px" }}><Icon name="branch" size={20} />GitLab<Tag icon="clock">準備中</Tag></span>} sub="GitHub での検証後に提供予定です">
            <div className="row between">
              <p className="small muted">マージリクエストの承認・外部ステータスチェックと連携する予定です。提供開始時にお知らせを受け取れます。</p>
              <Button disabled disabledReason="準備中です">接続する</Button>
            </div>
          </Section>
        </>
      )}
    </SettingsLayout>
  );
}
