// 画面ID: V-08 共有リンクとアクセス記録
import { useState } from "react";
import "./audit.css";
import { useScreenState } from "../../lib/router";
import { ORG, PROJECT, paths } from "../../lib/paths";
import { SHARE_STATUS } from "../../lib/vocab";
import { shareAccessLog, shareLinks } from "../../mocks/audit";
import type { ShareLink } from "../../mocks/audit";
import { daysUntil, formatDate } from "../../lib/format";
import {
  Banner,
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  ExternalActor,
  IdLink,
  PageHeader,
  ProjectLayout,
  Section,
  Select,
  Skeleton,
  StatusBadge,
  Tag,
  Timestamp,
  useToast,
} from "../../ui";

export function SharesScreen({ org = ORG, project = PROJECT }: { org?: string; project?: string }) {
  const state = useScreenState();
  const toast = useToast();
  const [links, setLinks] = useState<ShareLink[]>(shareLinks);
  const [revoking, setRevoking] = useState<ShareLink | null>(null);
  const [shareFilter, setShareFilter] = useState("");
  const list = state === "empty" ? [] : links;
  const log = (state === "empty" ? [] : shareAccessLog).filter((a) => !shareFilter || a.share_id === shareFilter);
  const denied = shareAccessLog.filter((a) => a.action === "拒否").length;

  return (
    <ProjectLayout org={org} project={project} active="shares" trail={[{ label: "共有リンク" }]}>
      <PageHeader
        title="共有リンクとアクセス記録"
        description="評価者などの外部の人に、監査パックを期限付き・読み取り専用で共有します。閲覧・ダウンロード・拒否はすべて記録します。"
        actions={<Button variant="primary" icon="package" to={paths.auditExport(org, project)}>監査パックを出力して共有</Button>}
      />
      {state === "loading" ? (
        <Skeleton rows={6} />
      ) : state === "error" ? (
        <ErrorState />
      ) : (
        <>
          {state === "denied" || (state === "default" && denied) ? (
            <Banner tone="warn" title={`権限外・期限切れのアクセスを ${denied} 件拒否しました`}>
              直近は 2026-11-25 22:14 に、宛先以外のメールアドレスで SHR-0021 を開こうとした記録があります。必要なら共有を失効させてください。
            </Banner>
          ) : null}
          <Section title="共有リンク" sub="共有の範囲は監査パック単位です。他のプロジェクトや他の組織の情報は含まれません" flush>
            {list.length ? (
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>共有</th><th>宛先</th><th>範囲</th><th>期限</th><th>状態</th><th>保護</th><th className="num">閲覧／DL</th><th>最終アクセス</th><th /></tr></thead>
                  <tbody>
                    {list.map((l) => {
                      const left = daysUntil(l.expires_at);
                      return (
                        <tr key={l.id}>
                          <td><div className="stack" style={{ ["--gap" as string]: "2px" }}><span className="mono small strong">{l.id}</span><span className="tiny muted">パック {l.export_id}</span></div></td>
                          <td><div className="stack" style={{ ["--gap" as string]: "2px" }}><span className="small">{l.recipient}</span><span className="tiny muted">{l.company}</span></div></td>
                          <td className="small">{l.scope.join("、")}</td>
                          <td className="small">
                            {formatDate(l.expires_at)}
                            {l.status === "active" ? <div className="tiny muted">あと {left} 日</div> : null}
                          </td>
                          <td><StatusBadge vocab={SHARE_STATUS[l.status]} size="sm" /></td>
                          <td>
                            <div className="row" style={{ ["--gap" as string]: "4px" }}>
                              {l.email_auth ? <Tag square icon="mail">メール認証</Tag> : null}
                              <Tag square icon={l.allow_download ? "download" : "eye"}>{l.allow_download ? "DL可" : "閲覧のみ"}</Tag>
                            </div>
                          </td>
                          <td className="num small">{l.views}／{l.downloads}</td>
                          <td className="small">{l.last_access_at ? <Timestamp at={l.last_access_at} /> : "—"}</td>
                          <td>
                            <div className="row nowrap">
                              <Button size="sm" variant="ghost" onClick={() => setShareFilter(l.id)}>記録</Button>
                              {l.status === "active" ? <Button size="sm" variant="danger" onClick={() => setRevoking(l)}>失効</Button> : null}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState icon="share" title="共有リンクはまだありません" description="監査パックを出力すると、評価者向けの期限付きリンクを発行できます。" action={<Button variant="primary" to={paths.auditExport(org, project)}>監査パックの出力</Button>} />
            )}
            <div className="small muted" style={{ padding: "10px 16px" }}>
              期限の延長は新しい共有として発行し、発行者と承認者を記録します。作成者: <ExternalActor userId="u-yamamoto" />
            </div>
          </Section>

          <div className="stack" style={{ ["--gap" as string]: "10px" }}>
            <div className="row between">
              <div>
                <h2 className="section-title">アクセス記録</h2>
                <p className="section-sub">閲覧、ダウンロード、拒否（期限切れ・失効・認証失敗・範囲外）の記録。追記のみです</p>
              </div>
              <div style={{ minWidth: 200 }}>
                <Select label="共有" value={shareFilter} onChange={setShareFilter} options={[{ value: "", label: "すべての共有" }, ...links.map((l) => ({ value: l.id, label: l.id }))]} />
              </div>
            </div>
            <div className="card flush table-wrap">
              {log.length ? (
                <table className="table">
                  <thead><tr><th>日時</th><th>共有</th><th>操作</th><th>アクセスした人</th><th>対象</th><th>結果</th><th>接続元</th></tr></thead>
                  <tbody>
                    {log.map((a) => (
                      <tr key={a.id}>
                        <td><Timestamp at={a.at} mode="absolute" /></td>
                        <td><IdLink id={a.share_id} /></td>
                        <td>{a.action === "拒否" ? <Tag tone="fail" icon="xCircle">拒否</Tag> : a.action === "ダウンロード" ? <Tag tone="info" icon="download">ダウンロード</Tag> : <Tag icon="eye">閲覧</Tag>}</td>
                        <td className="small">{a.who}</td>
                        <td className="small">{a.target}</td>
                        <td className={a.action === "拒否" ? "small text-fail" : "small"}>{a.result}</td>
                        <td className="mono tiny">{a.ip}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <EmptyState icon="history" title="アクセスの記録はありません" />
              )}
            </div>
          </div>
        </>
      )}
      <ConfirmDialog
        open={revoking !== null}
        onClose={() => setRevoking(null)}
        danger
        title={`${revoking?.id ?? ""} を失効させますか`}
        message="失効後はリンクを開けなくなります。失効の操作と、その後のアクセスの試みは記録されます。元に戻すには新しい共有を発行してください。"
        confirmLabel="失効させる"
        onConfirm={() => {
          setLinks((xs) => xs.map((x) => (x.id === revoking?.id ? { ...x, status: "revoked" } : x)));
          toast({ kind: "success", message: `${revoking?.id} を失効させました` });
        }}
      />
    </ProjectLayout>
  );
}
