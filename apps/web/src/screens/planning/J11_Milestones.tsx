// 画面ID: J-11 マイルストーン・納入物
// 成果物ごとに予定・実績日、提出先、提出版、受領・受入、差戻し、再提出を一元的に確認する。
// 提出・受入は文書リポジトリ、リリース、顧客の承認リンクから記録される。
import { useState } from "react";
import {
  Button,
  DataTable,
  Drawer,
  ExternalActor,
  FilterBar,
  HashDisplay,
  KeyValueList,
  PageHeader,
  PlanDates,
  ProjectLayout,
  Section,
  SourceTag,
  StatCard,
  Tag,
  Timeline,
} from "../../ui";
import { useScreenState } from "../../lib/router";
import { paths } from "../../lib/paths";
import { formatDate } from "../../lib/format";
import { userById } from "../../mocks/core";
import { milestones } from "../../mocks/portfolio";
import { DOC_SOURCE, deliverables } from "../../mocks/planning";
import type { Deliverable, DeliverableStatus } from "../../mocks/planning";
import { LIST_STATES, SourceBar, listStateView, orgOf, projectOf } from "./shared";

export const J11_STATES = [...LIST_STATES, "詳細を表示"];

export const DELIVERABLE_STATUS: Record<DeliverableStatus, { label: string; tone: "neutral" | "info" | "pass" | "fail" | "warn" }> = {
  notSubmitted: { label: "未提出", tone: "neutral" },
  submitted: { label: "提出済み", tone: "info" },
  received: { label: "受領済み", tone: "info" },
  accepted: { label: "受入済み", tone: "pass" },
  returned: { label: "差戻し", tone: "fail" },
  resubmitted: { label: "再提出", tone: "warn" },
};

export function J11Milestones({ params }: { params: Record<string, string> }) {
  const state = useScreenState();
  const org = orgOf(params);
  const pr = projectOf(params);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<Deliverable | null>(state === "詳細を表示" ? deliverables.find((d) => d.id === "DLV-06")! : null);
  const msOf = (id: string) => milestones.find((m) => m.id === id);
  const rows = deliverables.filter((d) => (!filters.status || d.status === filters.status) && (!filters.ms || d.milestone === filters.ms) && (!q || `${d.id}${d.title}${d.recipient}`.includes(q)));
  const alt = listStateView(state, { icon: "target", emptyTitle: "納入物はまだ登録されていません", emptyDescription: "計画の納入物とマイルストーンが同期されると、ここに表示されます。", emptyAction: <Button icon="external">計画管理で開く</Button> });
  const overdue = deliverables.filter((d) => d.status === "notSubmitted" && d.planned < "2026-11-27").length;

  return (
    <ProjectLayout org={org} project={pr} active="milestones" trail={[{ label: "マイルストーン・納入物" }]}>
      <PageHeader title="マイルストーン・納入物" description="成果物の予定と実績、提出先と提出版、顧客の受領・受入・差戻し・再提出を一元的に確認します。" actions={<Button icon="calendar" to={paths.schedule(org, pr)}>スケジュール</Button>} />
      <SourceBar source={DOC_SOURCE} note="提出物は文書リポジトリとリリース、受入は顧客の承認リンクから記録" />
      {alt ?? (
        <>
          <div className="grid auto-fit">
            <StatCard label="受入済み" value={deliverables.filter((d) => d.status === "accepted").length} unit={`/ ${deliverables.length}件`} tone="good" />
            <StatCard label="差戻し中" value={deliverables.filter((d) => d.status === "returned").length} unit="件" tone={deliverables.some((d) => d.status === "returned") ? "danger" : undefined} />
            <StatCard label="受領済み・受入待ち" value={deliverables.filter((d) => d.status === "received" || d.status === "submitted" || d.status === "resubmitted").length} unit="件" />
            <StatCard label="予定日を過ぎた未提出" value={overdue} unit="件" tone={overdue ? "warn" : undefined} />
          </div>
          <FilterBar
            search={q}
            onSearch={setQ}
            values={filters}
            onChange={(k, v) => setFilters((f) => ({ ...f, [k]: v }))}
            filters={[
              { key: "status", label: "状態", options: Object.entries(DELIVERABLE_STATUS).map(([value, v]) => ({ value, label: v.label })) },
              { key: "ms", label: "マイルストーン", options: milestones.filter((m) => m.project === pr).map((m) => ({ value: m.id, label: m.title })) },
            ]}
          />
          <DataTable<Deliverable>
            rows={rows}
            rowKey={(d) => d.id}
            onRowClick={setOpen}
            empty={listStateView("0件（絞り込み）", { emptyTitle: "" })}
            columns={[
              { key: "title", header: "納入物", render: (d) => <div className="stack" style={{ ["--gap" as string]: "2px" }}><span className="strong" style={{ fontWeight: 500 }}>{d.title}</span><span className="tiny muted mono">{d.id}</span></div>, hideable: false },
              { key: "ms", header: "マイルストーン", render: (d) => <span className="small">{msOf(d.milestone)?.title ?? d.milestone}</span> },
              { key: "dates", header: "予定・実績", render: (d) => <PlanDates baseline={d.planned} actual={d.actual} compact />, sortValue: (d) => d.planned },
              { key: "recipient", header: "提出先", render: (d) => <span className="small">{d.recipient}</span> },
              { key: "version", header: "提出版", render: (d) => (d.version ? <span className="mono small">{d.version}</span> : <span className="tiny muted">—</span>) },
              { key: "status", header: "状態", render: (d) => <Tag square tone={DELIVERABLE_STATUS[d.status].tone}>{DELIVERABLE_STATUS[d.status].label}</Tag> },
              { key: "last", header: "最後の出来事", render: (d) => { const h = d.history[d.history.length - 1]; return h ? <span className="small">{h.event} · {formatDate(h.at)}</span> : <span className="tiny muted">—</span>; } },
            ]}
          />
          <Section title="マイルストーンと納入物の対応">
            <div className="stack" style={{ ["--gap" as string]: "10px" }}>
              {milestones.filter((m) => m.project === pr).map((m) => {
                const ds = deliverables.filter((d) => d.milestone === m.id);
                return (
                  <div key={m.id} className="row between" style={{ flexWrap: "wrap" }}>
                    <span className="stack" style={{ ["--gap" as string]: "2px" }}><span className="strong" style={{ fontWeight: 500 }}>{m.title}</span><PlanDates baseline={m.baseline} revised={m.revised} forecast={m.forecast} actual={m.actual} compact /></span>
                    <span className="row" style={{ ["--gap" as string]: "6px" }}>{ds.length ? ds.map((d) => <Tag key={d.id} square tone={DELIVERABLE_STATUS[d.status].tone}>{d.title}</Tag>) : <span className="tiny muted">納入物なし</span>}</span>
                  </div>
                );
              })}
            </div>
          </Section>
        </>
      )}
      <Drawer open={Boolean(open)} onClose={() => setOpen(null)} title={open?.title ?? ""} subtitle={open?.id}>
        {open ? (
          <div className="stack">
            <KeyValueList
              stacked
              items={[
                { label: "状態", value: <Tag square tone={DELIVERABLE_STATUS[open.status].tone}>{DELIVERABLE_STATUS[open.status].label}</Tag> },
                { label: "予定・実績", value: <PlanDates baseline={open.planned} actual={open.actual} compact /> },
                { label: "提出先", value: open.recipient },
                { label: "提出版", value: open.version ?? "—" },
                { label: "ハッシュ（SHA-256）", value: open.sha256 ? <HashDisplay value={open.sha256} /> : "—" },
                { label: "出典", value: <SourceTag source={open.source} compact /> },
              ]}
            />
            <Section title="提出・受領・受入の履歴">
              {open.history.length ? (
                <Timeline
                  compact
                  items={open.history.map((h, i) => ({ id: String(i), actor: { kind: "human" as const, name: userById(h.by)?.name ?? "" }, action: h.event, at: h.at, detail: h.note, kind: h.event === "受入" ? ("approval" as const) : undefined }))}
                />
              ) : (
                <span className="small muted">まだ提出されていません。</span>
              )}
            </Section>
            {open.status === "returned" ? (
              <div className="pl-decision">
                <span className="strong" style={{ fontWeight: 500 }}>差戻しの対応</span>
                <span className="small">再提出は作成者が文書リポジトリで行います。再提出されると状態が「再提出」になり、顧客に受入を再依頼します。</span>
                <span className="row" style={{ ["--gap" as string]: "6px" }}><span className="tiny muted">作成者</span><ExternalActor userId={open.history[0]?.by} /></span>
              </div>
            ) : null}
          </div>
        ) : null}
      </Drawer>
    </ProjectLayout>
  );
}
