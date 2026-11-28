// 画面ID: N-06 インシデント一覧
import { useState } from "react";
import { navigate, useScreenState } from "../../lib/router";
import { paths } from "../../lib/paths";
import { INCIDENT_STATUS, SEVERITY } from "../../lib/vocab";
import type { IncidentStatus, Severity } from "../../lib/vocab";
import type { Incident } from "../../lib/types";
import { NOW } from "../../lib/format";
import { AppLayout, crumbs, DataTable, ErrorState, ExternalActor, FilterBar, PageHeader, Skeleton, SourceTag, StatCard, StatusBadge, Tag, Timestamp } from "../../ui";
import { incidents } from "../../mocks/portfolio";
import { OncallTabs, SeverityBadge, useOrg } from "./parts";
import { MaintenanceSection } from "./oncall2";

const REPO: Record<string, string> = { "受発注 API": "sample-soft/order-api", "会員アプリ API": "member-app/api", "証跡の保管": "—" };

function elapsed(i: Incident) {
  const end = i.resolved_at ? new Date(i.resolved_at) : NOW;
  const m = Math.round((end.getTime() - new Date(i.triggered_at).getTime()) / 60000);
  return m < 60 ? `${m}分` : `${Math.floor(m / 60)}時間${m % 60}分`;
}

export function N06Incidents() {
  const state = useScreenState();
  const org = useOrg();
  const [f, setF] = useState<Record<string, string>>({});
  const rows = (state === "空" ? [] : incidents).filter((i) => (!f.status || i.status === f.status) && (!f.severity || i.severity === f.severity));
  const open = incidents.filter((i) => i.status !== "resolved");

  return (
    <AppLayout org={org} active="incidents" breadcrumb={crumbs(org, undefined, { label: "インシデント" })}>
      <PageHeader
        title="インシデント"
        description="オンコール管理サービスで起票されたインシデントです。受領（Ack）と解決（Resolve）は別の記録として扱います。"
        meta={<SourceTag source={{ provider: "pagerduty", synced_at: "2026-11-27T10:26:00+09:00", status: "healthy" }} />}
      />
      <OncallTabs org={org} active="incidents" />
      {state === "読み込み中" ? (
        <Skeleton rows={5} />
      ) : state === "エラー" ? (
        <ErrorState />
      ) : (
        <>
          <div className="grid auto-fit">
            <StatCard label="未受領" value={open.filter((i) => i.status === "triggered").length} unit="件" tone="danger" delta="エスカレーション中" />
            <StatCard label="受領済み・対応中" value={open.filter((i) => i.status === "acknowledged").length} unit="件" tone="warn" />
            <StatCard label="解決（7日間）" value={incidents.filter((i) => i.status === "resolved").length} unit="件" tone="good" />
            <StatCard label="受領までの中央値" value="5" unit="分" delta="直近 30 日" />
          </div>
          <DataTable
            rows={rows}
            rowKey={(i) => i.id}
            onRowClick={(i) => navigate(paths.incident(org, i.id))}
            toolbar={
              <FilterBar
                values={f}
                onChange={(k, v) => setF((x) => ({ ...x, [k]: v }))}
                filters={[
                  { key: "status", label: "状態", options: (Object.keys(INCIDENT_STATUS) as IncidentStatus[]).map((k) => ({ value: k, label: INCIDENT_STATUS[k].label })) },
                  { key: "severity", label: "重大度", options: (Object.keys(SEVERITY) as Severity[]).map((k) => ({ value: k, label: SEVERITY[k].label })) },
                ]}
              />
            }
            columns={[
              { key: "id", header: "ID", render: (i) => <span className="mono small">{i.id}</span>, hideable: false },
              { key: "title", header: "内容", render: (i) => <div className="stack" style={{ ["--gap" as string]: "2px" }}><span className="strong small">{i.title}</span><span className="tiny muted">重複キー {i.dedup_key}</span></div> },
              { key: "sev", header: "重大度", render: (i) => <SeverityBadge value={i.severity} />, sortValue: (i) => ["critical", "high", "medium", "low", "info"].indexOf(i.severity) },
              { key: "status", header: "状態", render: (i) => <div className="stack" style={{ ["--gap" as string]: "2px" }}><StatusBadge vocab={INCIDENT_STATUS[i.status]} size="sm" />{i.status === "triggered" ? <span className="tiny muted">段階 {i.escalation_level}</span> : null}</div> },
              { key: "service", header: "サービス・環境", render: (i) => <span className="small">{i.service}<div className="tiny muted">{i.environment}</div></span> },
              { key: "project", header: "案件", render: (i) => (i.project ? <Tag square>{i.project}</Tag> : <span className="muted">—</span>) },
              { key: "repo", header: "リポジトリ", render: (i) => <span className="tiny mono">{REPO[i.service] ?? "—"}</span>, defaultHidden: true },
              { key: "release", header: "関連リリース", render: (i) => (i.related_release ? <span className="mono small">{i.related_release}</span> : <span className="muted">—</span>) },
              { key: "ack", header: "受領", render: (i) => (i.acknowledged_by ? <span className="small"><ExternalActor userId={i.acknowledged_by} /></span> : <Tag tone="fail" square>未受領</Tag>) },
              { key: "at", header: "発生", render: (i) => <Timestamp at={i.triggered_at} />, sortValue: (i) => i.triggered_at },
              { key: "dur", header: "経過", render: (i) => <span className="small">{elapsed(i)}</span> },
            ]}
            empty={<div className="empty"><h3>インシデントはありません</h3><p>オンコール管理サービスで起票されると表示されます。</p></div>}
          />
          <MaintenanceSection />
        </>
      )}
    </AppLayout>
  );
}
