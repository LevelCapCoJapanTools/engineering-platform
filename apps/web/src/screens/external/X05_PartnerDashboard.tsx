// 画面ID: X-05 パートナーの横断ダッシュボード
import { useState } from "react";
import { useScreenState } from "../../lib/router";
import { ORG, paths } from "../../lib/paths";
import { partnerOrgs, partnerTemplates } from "../../mocks/external";
import { AppLayout, Button, EmptyState, ErrorState, Icon, Link, PageHeader, Section, Segmented, Skeleton, StatCard, Tag } from "./deps";
import "./external.css";

export function X05PartnerDashboard() {
  const state = useScreenState();
  const [view, setView] = useState("cards");
  const orgs = state === "空" ? [] : partnerOrgs;
  const total = (k: "projects" | "blocked" | "missing_evidence") => orgs.reduce((n, o) => n + o[k], 0);

  return (
    <AppLayout org={ORG} active="dashboard" breadcrumb={[{ label: "パートナー" }, { label: "管理先の組織" }]}>
      <PageHeader
        title="管理先の組織"
        description="パートナーとして支援している顧客組織の状況を横断して確認します。各組織のデータは、その組織が許可した範囲だけ表示されます。"
        actions={<Button variant="primary" icon="plus">組織を招待</Button>}
      />
      {state === "読み込み中" ? (
        <Skeleton variant="card" />
      ) : state === "エラー" ? (
        <ErrorState />
      ) : orgs.length === 0 ? (
        <div className="card">
          <EmptyState icon="building" title="管理先の組織はまだありません" description="顧客組織の管理者に招待を送り、パートナーとしての閲覧を許可してもらいましょう。" action={<Button variant="primary" icon="plus">組織を招待</Button>} />
        </div>
      ) : (
        <>
          <div className="grid cols-4">
            <StatCard label="管理先の組織" value={orgs.length} unit="組織" icon="building" />
            <StatCard label="プロジェクト" value={total("projects")} unit="件" icon="folder" />
            <StatCard label="ブロック中の PR" value={total("blocked")} unit="件" icon="shieldX" tone={total("blocked") ? "danger" : undefined} />
            <StatCard label="証跡の欠落" value={total("missing_evidence")} unit="件" icon="alertCircle" tone={total("missing_evidence") ? "warn" : undefined} />
          </div>

          <div className="stack" style={{ ["--gap" as string]: "10px" }}>
            <div className="row between">
              <h2 className="section-title">組織</h2>
              <Segmented value={view} onChange={setView} options={[{ value: "cards", label: "カード" }, { value: "table", label: "表" }]} />
            </div>
            {view === "cards" ? (
              <div className="org-card-grid">
                {orgs.map((o) => (
                  <Link key={o.slug} to={paths.orgHome(o.slug)} className="card interactive stack" style={{ textDecoration: "none", color: "inherit", ["--gap" as string]: "12px" }}>
                    <div className="row between">
                      <span className="row" style={{ ["--gap" as string]: "10px" }}>
                        <span className="org-switch" style={{ border: 0, padding: 0 }}><span className="org-logo">{o.name.slice(0, 1)}</span></span>
                        <span className="strong">{o.name}</span>
                      </span>
                      <Tag tone={o.status === "良好" ? "pass" : "warn"}>{o.status}</Tag>
                    </div>
                    <div className="grid cols-3" style={{ ["--gap" as string]: "8px" }}>
                      <div className="stack" style={{ ["--gap" as string]: "0" }}><span className="tiny muted">プロジェクト</span><span className="strong">{o.projects}</span></div>
                      <div className="stack" style={{ ["--gap" as string]: "0" }}><span className="tiny muted">ブロック中</span><span className={o.blocked ? "strong text-fail" : "strong"}>{o.blocked}</span></div>
                      <div className="stack" style={{ ["--gap" as string]: "0" }}><span className="tiny muted">証跡の欠落</span><span className={o.missing_evidence ? "strong text-warn" : "strong"}>{o.missing_evidence}</span></div>
                    </div>
                    <div className="row between small" style={{ borderTop: "1px solid var(--border)", paddingTop: 10 }}>
                      <Tag square>{o.plan}</Tag>
                      <span className="row muted" style={{ ["--gap" as string]: "4px" }}>開く <Icon name="arrowRight" size={13} /></span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="card flush">
                <div className="table-wrap">
                  <table className="table">
                    <thead><tr><th>組織名</th><th className="num">プロジェクト</th><th className="num">ブロック中の PR</th><th className="num">証跡の欠落</th><th>プラン</th><th>状況</th></tr></thead>
                    <tbody>
                      {orgs.map((o) => (
                        <tr key={o.slug}>
                          <td><Link to={paths.orgHome(o.slug)} className="strong">{o.name}</Link></td>
                          <td className="num">{o.projects}</td>
                          <td className="num">{o.blocked}</td>
                          <td className="num">{o.missing_evidence}</td>
                          <td><Tag square>{o.plan}</Tag></td>
                          <td><Tag tone={o.status === "良好" ? "pass" : "warn"}>{o.status}</Tag></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <Section title="テンプレート（組織での調整のひな形）" sub="顧客組織に配布するテーラリングのひな形です。適用には各組織のポリシー管理者の承認が必要です" actions={<Button icon="plus">テンプレートを作成</Button>} flush>
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>ID</th><th>名前</th><th className="num">調整項目</th><th className="num">適用中の組織</th><th>更新日</th><th /></tr></thead>
                <tbody>
                  {partnerTemplates.map((t) => (
                    <tr key={t.id}>
                      <td className="mono small">{t.id}</td>
                      <td className="strong">{t.name}</td>
                      <td className="num">{t.items}</td>
                      <td className="num">{t.used_by}</td>
                      <td>{t.updated_at}</td>
                      <td style={{ textAlign: "right" }}><Button size="sm" variant="ghost" icon="edit">編集</Button><Button size="sm" variant="ghost" icon="share">配布</Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        </>
      )}
    </AppLayout>
  );
}
