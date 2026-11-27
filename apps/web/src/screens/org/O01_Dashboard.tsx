// 画面ID: O-01 組織ダッシュボード
import { useScreenState, navigate, useRoute } from "../../lib/router";
import { ORG, paths } from "../../lib/paths";
import { PHASES } from "../../lib/types";
import type { Project } from "../../lib/types";
import { AppLayout, ApprovalRequestCard, Button, CoverageMeter, crumbs, DataTable, EmptyState, ErrorState, GateSummaryStrip, PageHeader, Section, Skeleton, StatCard, Tag, Timeline } from "../../ui";
import type { Column } from "../../ui";
import { approvalRequests, auditEvents, exceptions, orgs, projects, releases } from "../../mocks/core";
import { daysUntil, formatDate } from "../../lib/format";

const OPS_METRICS: { label: string; value: string; unit: string; note: string; tone?: "warn" | "good" }[] = [
  { label: "例外で通過した割合", value: "3.1", unit: "%", note: "ゲート実行 412件中 13件", tone: "good" },
  { label: "取り消されたブロック", value: "6.8", unit: "%", note: "ルールの誤りで再実行・取消したもの", tone: "warn" },
  { label: "リリース時の証跡欠落", value: "0", unit: "件", note: "直近リリース 9件", tone: "good" },
  { label: "PR のリードタイムの増分", value: "+4.2", unit: "%", note: "ゲート導入前の30日と比較" },
  { label: "AI所見の採用率", value: "61", unit: "%", note: "採用 88件／判断済み 144件" },
  { label: "承認済み要求のトレース網羅率", value: "92", unit: "%", note: "テストまでつながった要求の割合" },
];

export function Dashboard() {
  const state = useScreenState();
  const org = useRoute().params.org ?? ORG;
  const orgName = (orgs.find((o) => o.slug === org) ?? orgs[0]).name;
  const active = projects.filter((p) => !p.archived);
  const expiring = exceptions.filter((e) => e.status === "active" && daysUntil(e.expires_at) <= 7).length;
  const blocked = active.reduce((n, p) => n + p.blocked_prs, 0);
  const missingEvidence = releases.filter((r) => r.status === "released" || r.status === "gateChecking").length;

  const cols: Column<Project>[] = [
    { key: "name", header: "プロジェクト", render: (p) => <span className="stack" style={{ ["--gap" as string]: "2px" }}><span className="strong">{p.name}</span><span className="tiny muted">{p.customer}</span></span>, sortValue: (p) => p.name, hideable: false },
    { key: "phase", header: "フェーズ", render: (p) => <Tag square>{PHASES.find((x) => x.key === p.phase)?.label}</Tag>, sortValue: (p) => PHASES.findIndex((x) => x.key === p.phase) },
    { key: "gates", header: "直近の main", render: (p) => <GateSummaryStrip gates={p.main_gates} /> },
    { key: "trace", header: "トレーサビリティ", render: (p) => <CoverageMeter value={p.trace_linked} total={p.trace_total} compact />, sortValue: (p) => p.trace_linked / p.trace_total },
    { key: "risks", header: "未解決リスク", render: (p) => (p.open_risks ? <span className="strong">{p.open_risks}</span> : <span className="muted">0</span>), sortValue: (p) => p.open_risks, align: "right" },
    { key: "release", header: "次のリリース", render: (p) => (p.next_release ? <span className="small"><span className="mono">{p.next_release.version}</span> · {formatDate(p.next_release.date)}</span> : <span className="muted">—</span>), sortValue: (p) => p.next_release?.date ?? "9" },
  ];

  return (
    <AppLayout org={org} active="dashboard" breadcrumb={crumbs(org, undefined, { label: "ダッシュボード" })}>
      <PageHeader title="ダッシュボード" description={`${orgName} で対応が必要なこと`} actions={<Button variant="primary" icon="plus" to={paths.projectNew(org)}>プロジェクトを作成</Button>} />
      {state === "error" ? (
        <ErrorState />
      ) : (
        <>
          <div className="grid cols-4">
            <StatCard label="自分の承認待ち" icon="inbox" value={state === "empty" ? 0 : approvalRequests.length} unit="件" delta="うち期限超過 1件" tone={state === "empty" ? undefined : "warn"} to={paths.inbox(org)} loading={state === "loading"} />
            <StatCard label="ブロック中の PR" icon="shieldX" value={state === "empty" ? 0 : blocked} unit="件" delta="ゲート B（トレーサビリティ）が最多" tone={state === "empty" || blocked === 0 ? undefined : "danger"} to={paths.gates(org, "order-renewal")} loading={state === "loading"} />
            <StatCard label="7日以内に期限が来る例外" icon="flag" value={state === "empty" ? 0 : expiring} unit="件" delta="期限後は自動で再審査" to={paths.exceptions(org, "order-renewal")} loading={state === "loading"} />
            <StatCard label="証跡が欠落しているリリース" icon="archive" value={state === "empty" ? 0 : missingEvidence} unit="件" delta="受入記録・署名待ち" tone={state === "empty" ? undefined : "warn"} to={paths.audit(org, "order-renewal")} loading={state === "loading"} />
          </div>

          <div className="grid main-side">
            <div className="stack">
              {state === "loading" ? (
                <Skeleton rows={4} />
              ) : state === "empty" ? (
                <div className="card">
                  <EmptyState icon="folder" title="まだプロジェクトがありません" description="プロジェクトを作成すると、ゲートの状況やトレーサビリティがここに表示されます。" action={<Button variant="primary" icon="plus" to={paths.projectNew(org)}>プロジェクトを作成</Button>} />
                </div>
              ) : (
                <div className="stack" style={{ ["--gap" as string]: "10px" }}>
                  <div className="row between">
                    <h2 className="section-title">プロジェクトの状況</h2>
                    <Button size="sm" variant="ghost" to={paths.projects(org)} iconRight="arrowRight">すべてのプロジェクト</Button>
                  </div>
                  <DataTable columns={cols} rows={active} rowKey={(p) => p.id} onRowClick={(p) => navigate(paths.project(org, p.slug))} />
                </div>
              )}
              {state === "loading" || state === "empty" ? null : (
                <Section title="ゲート運用の指標" sub="直近30日・全プロジェクト。導入効果の確認に使います">
                  <div className="grid auto-fit">
                    {OPS_METRICS.map((m) => (
                      <StatCard key={m.label} label={m.label} value={m.value} unit={m.unit} delta={m.note} tone={m.tone} />
                    ))}
                  </div>
                </Section>
              )}
            </div>
            <div className="stack">
              <Section title="自分の承認待ち" sub={state === "empty" ? undefined : `${approvalRequests.length}件`} actions={<Button size="sm" variant="ghost" to={paths.inbox(org)}>すべて見る</Button>}>
                {state === "loading" ? (
                  <div className="stack">{[0, 1, 2].map((i) => <span key={i} className="skeleton" style={{ height: 72 }} />)}</div>
                ) : state === "empty" ? (
                  <p className="small muted">承認待ちはありません。</p>
                ) : (
                  <div className="stack" style={{ ["--gap" as string]: "8px" }}>
                    {approvalRequests.slice(0, 5).map((r) => <ApprovalRequestCard key={r.id} req={r} to={paths.inbox(org)} />)}
                  </div>
                )}
              </Section>
              <Section title="最近の出来事">
                {state === "loading" ? (
                  <div className="stack">{[0, 1, 2, 3].map((i) => <span key={i} className="skeleton" style={{ height: 32 }} />)}</div>
                ) : state === "empty" ? (
                  <p className="small muted">出来事はまだありません。</p>
                ) : (
                  <Timeline compact items={auditEvents.slice(0, 10).map((e) => ({ id: e.id, actor: e.actor, action: e.action, target: <span className="mono small">{e.target}</span>, at: e.at }))} />
                )}
              </Section>
            </div>
          </div>
        </>
      )}
    </AppLayout>
  );
}
