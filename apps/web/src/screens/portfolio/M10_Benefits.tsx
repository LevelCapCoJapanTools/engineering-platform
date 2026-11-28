// 画面ID: M-10 便益・成果
import { useRoute, useScreenState, navigate } from "../../lib/router";
import { ORG, paths } from "../../lib/paths";
import { formatDate, yenM } from "../../lib/format";
import { benefits } from "../../mocks/investment";
import type { BenefitKpi } from "../../mocks/investment";
import { AppLayout, Button, crumbs, DataTable, EmptyState, ErrorState, PageHeader, Skeleton, StatCard, Tag } from "../../ui";
import type { Column } from "../../ui";
import { RoleNote, userName } from "./parts";

type Benefit = (typeof benefits)[number];

export const BENEFIT_STATUS: Record<Benefit["status"], { label: string; tone: "pass" | "warn" | "fail" | "info" | "neutral" }> = {
  measuring: { label: "測定中", tone: "info" },
  notStarted: { label: "測定前", tone: "neutral" },
  achieved: { label: "達成", tone: "pass" },
  behind: { label: "想定を下回る", tone: "fail" },
};

export const NEXT_DECISION: Record<Benefit["next_decision"], string> = {
  continue: "継続",
  change: "方針変更を検討",
  stop: "終了を検討",
  undecided: "未定",
};

export function kpiProgress(k: BenefitKpi) {
  if (k.actual === undefined) return undefined;
  const span = k.target - k.baseline;
  if (span === 0) return k.higherIsBetter ? (k.actual >= k.target ? 100 : 0) : k.actual <= k.target ? 100 : 0;
  return Math.round(((k.actual - k.baseline) / span) * 100);
}

export function Benefits() {
  const state = useScreenState();
  const org = useRoute().params.org ?? ORG;
  const trail = crumbs(org, undefined, { label: "便益・成果" });
  const rows = state === "empty" ? [] : benefits;

  const cols: Column<Benefit>[] = [
    { key: "title", header: "案件・投資", render: (b) => <span className="stack" style={{ ["--gap" as string]: "2px" }}><span className="strong">{b.title}</span><span className="tiny muted">{b.case_id}・スポンサー {userName(b.sponsor)}</span></span>, hideable: false },
    { key: "status", header: "状況", render: (b) => <Tag tone={BENEFIT_STATUS[b.status].tone} square>{BENEFIT_STATUS[b.status].label}</Tag>, sortValue: (b) => b.status },
    {
      key: "kpi", header: "KPI（期待値 → 実績）",
      render: (b) => (
        <span className="stack" style={{ ["--gap" as string]: "2px" }}>
          {b.kpis.map((k) => (
            <span key={k.name} className="small">
              {k.name}: {k.target}{k.unit} → {k.actual !== undefined ? <strong>{k.actual}{k.unit}</strong> : <span className="muted">未測定</span>}
              {k.source_kind === "manual" ? <span className="tiny muted">（手入力）</span> : null}
            </span>
          ))}
        </span>
      ),
    },
    { key: "measured", header: "測定日", render: (b) => { const d = b.kpis.map((k) => k.measured_at).filter(Boolean).sort().pop(); return d ? formatDate(d) : <span className="muted">—</span>; } },
    { key: "invested", header: "投資額", render: (b) => yenM(b.invested), sortValue: (b) => b.invested, align: "right" },
    { key: "next", header: "次の判断", render: (b) => <span className="stack" style={{ ["--gap" as string]: "2px" }}><span className="small strong">{NEXT_DECISION[b.next_decision]}</span><span className="tiny muted">{formatDate(b.next_review)}</span></span>, sortValue: (b) => b.next_review },
  ];

  return (
    <AppLayout org={org} active="benefits" breadcrumb={trail}>
      <PageHeader title="便益・成果" description="事業ケースで決めた成功指標（KPI）を、開始後・リリース後も追跡します。期待値と実績を比べ、継続・方針変更・終了の判断につなげます。" />
      {state === "loading" ? (
        <Skeleton />
      ) : state === "error" ? (
        <ErrorState />
      ) : (
        <div className="stack">
          <div className="grid auto-fit">
            <StatCard label="追跡中の投資" icon="trendingUp" value={rows.length} unit="件" />
            <StatCard label="想定を下回る" icon="alert" value={rows.filter((b) => b.status === "behind").length} unit="件" delta="在庫管理ダッシュボード" tone={rows.some((b) => b.status === "behind") ? "danger" : undefined} />
            <StatCard label="30日以内に見直し" icon="calendar" value={rows.filter((b) => b.next_review <= "2026-12-27").length} unit="件" />
          </div>
          <RoleNote>測定値は連携先（PagerDuty など）から同期した値と、担当者が手入力した値があります。手入力の値は出典と更新日を確認してください。</RoleNote>
          <DataTable
            columns={cols}
            rows={rows}
            rowKey={(b) => b.id}
            onRowClick={(b) => navigate(paths.benefit(org, b.id))}
            empty={<EmptyState icon="trendingUp" title="追跡中の便益はありません" description="事業ケースの開始を承認すると、成功指標がここに表示されます。" action={<Button to={paths.intake(org)}>案件受付へ</Button>} />}
          />
        </div>
      )}
    </AppLayout>
  );
}
