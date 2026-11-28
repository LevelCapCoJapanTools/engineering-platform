// 画面ID: J-05 リスク・是正の一覧
// リスク台帳の正本は課題・計画管理。経営層は影響・残余リスク・必要な経営判断を確認する。
import { useEffect, useState } from "react";
import {
  Button,
  Combobox,
  DataTable,
  DatePicker,
  DeadlineIndicator,
  FilterBar,
  Modal,
  PageHeader,
  ProjectLayout,
  Section,
  Select,
  StatusBadge,
  ExternalActor,
  IdLink,
  Tag,
  TextArea,
  TextField,
  cx,
  useToast,
} from "../../ui";
import { navigate, useScreenState } from "../../lib/router";
import { paths } from "../../lib/paths";
import { RISK_STATUS } from "../../lib/vocab";
import type { Risk } from "../../lib/types";
import { risks, users } from "../../mocks/core";
import { PLAN_SOURCE, riskExtras } from "../../mocks/planning";
import { LIST_STATES, SourceBar, listStateView, orgOf, projectOf } from "./shared";

export const J05_STATES = [...LIST_STATES, "手動登録モーダル"];

function heatTone(score: number) {
  if (score >= 15) return { background: "var(--tone-fail-bg)", color: "var(--tone-fail)" };
  if (score >= 8) return { background: "var(--tone-warn-bg)", color: "var(--tone-warn)" };
  return { background: "var(--tone-pass-bg)", color: "var(--tone-pass)" };
}

export function RiskRegisterModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const toast = useToast();
  const [owner, setOwner] = useState<string[]>(["u-sato"]);
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="リスク・是正処置を手動で登録"
      size="md"
      footer={<><Button variant="ghost" onClick={onClose}>キャンセル</Button><Button variant="primary" onClick={() => { onClose(); toast({ kind: "success", message: "RSK-013 を登録しました" }); }}>登録する</Button></>}
    >
      <div className="stack">
        <Select label="種類" required defaultValue="risk" options={[{ value: "risk", label: "リスク" }, { value: "corrective", label: "是正処置" }]} />
        <TextField label="タイトル" required placeholder="例: 外部APIの仕様変更" maxLength={80} />
        <div className="grid cols-2">
          <Select label="影響度" required defaultValue="3" options={[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `${n}` }))} />
          <Select label="発生可能性" required defaultValue="3" options={[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `${n}` }))} />
        </div>
        <div className="grid cols-2">
          <Combobox label="担当者" required options={users.filter((u) => u.kind === "member" && u.status === "active").map((u) => ({ value: u.id, label: u.name, hint: u.roles[0] }))} value={owner} onChange={setOwner} />
          <DatePicker label="期限" required defaultValue="2026-12-15" min="2026-11-27" />
        </div>
        <TextArea label="内容・原因" rows={3} />
        <span className="tiny muted">通常は課題・計画管理で登録したものが同期されます。経営会議で挙がったリスクなど、正本にないものだけを登録します。</span>
      </div>
    </Modal>
  );
}

export function J05Risks({ params }: { params: Record<string, string> }) {
  const state = useScreenState();
  const org = orgOf(params);
  const pr = projectOf(params);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [q, setQ] = useState("");
  const [cell, setCell] = useState<{ i: number; l: number } | null>(null);
  const [modal, setModal] = useState(false);
  useEffect(() => setModal(state === "手動登録モーダル"), [state]);
  const open = modal;
  const rows = risks.filter(
    (r) =>
      (!filters.kind || r.kind === filters.kind) &&
      (!filters.status || r.status === filters.status) &&
      (!filters.owner || r.owner_id === filters.owner) &&
      (!cell || (r.impact === cell.i && r.likelihood === cell.l)) &&
      (!q || `${r.id}${r.title}`.includes(q)),
  );
  const alt = listStateView(state, { icon: "alert", emptyTitle: "登録されたリスク・是正処置はありません", emptyDescription: "プロジェクトのリスクや是正処置を登録すると、完了まで追跡できます。", emptyAction: <Button icon="external">課題・計画管理で開く</Button> });
  const open_ = risks.filter((r) => r.status !== "done");

  return (
    <ProjectLayout org={org} project={pr} active="risks" trail={[{ label: "リスク・是正" }]}>
      <PageHeader title="リスク・是正" description="リスクと是正処置を、影響度・発生可能性・残余リスクで確認し、必要な経営判断につなげます。" actions={<Button icon="plus" onClick={() => setModal(true)}>手動で登録</Button>} />
      <SourceBar source={PLAN_SOURCE} note="ラベル「risk」「corrective」の作業項目を同期" />
      {alt ?? (
        <>
          <div className="grid side-420">
            <Section title="影響度 × 発生可能性" sub="セルを押すと一覧を絞り込みます（未完了のみ）">
              <div className="stack" style={{ ["--gap" as string]: "8px" }}>
                <div className="heatmap" role="grid" aria-label="リスクのヒートマップ">
                  {[5, 4, 3, 2, 1].map((impact) => (
                    <div key={impact} style={{ display: "contents" }} role="row">
                      <span className="axis">{impact}</span>
                      {[1, 2, 3, 4, 5].map((l) => {
                        const n = open_.filter((r) => r.impact === impact && r.likelihood === l).length;
                        const active = cell?.i === impact && cell.l === l;
                        return (
                          <button key={l} type="button" role="gridcell" className={cx("hm", active && "active")} style={{ ...heatTone(impact * l), opacity: n ? 1 : 0.45, border: active ? undefined : "1px solid transparent" }} onClick={() => setCell(active ? null : { i: impact, l })} aria-label={`影響度${impact} 発生可能性${l}: ${n}件`}>
                            {n || ""}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                  <span />
                  {[1, 2, 3, 4, 5].map((l) => <span key={l} className="axis">{l}</span>)}
                </div>
                <div className="row between tiny muted"><span>縦: 影響度 / 横: 発生可能性</span>{cell ? <button type="button" className="btn ghost sm" onClick={() => setCell(null)}>セルの絞り込みを解除</button> : null}</div>
                <div className="pl-heat-legend"><span><i style={{ background: "var(--tone-fail-bg)", border: "1px solid var(--tone-fail-border)" }} />高（15以上）</span><span><i style={{ background: "var(--tone-warn-bg)", border: "1px solid var(--tone-warn-border)" }} />中（8〜14）</span><span><i style={{ background: "var(--tone-pass-bg)", border: "1px solid var(--tone-pass-border)" }} />低</span></div>
              </div>
            </Section>
            <div className="grid cols-2">
              {(["open", "inProgress", "monitoring", "done"] as const).map((s) => (
                <button key={s} type="button" className="stat" onClick={() => setFilters((f) => ({ ...f, status: f.status === s ? "" : s }))}>
                  <span className="stat-label"><StatusBadge vocab={RISK_STATUS[s]} size="sm" /></span>
                  <span className="stat-value">{risks.filter((r) => r.status === s).length}<span className="unit">件</span></span>
                </button>
              ))}
            </div>
          </div>
          <FilterBar
            search={q}
            onSearch={setQ}
            values={filters}
            onChange={(k, v) => setFilters((f) => ({ ...f, [k]: v }))}
            filters={[
              { key: "kind", label: "種類", options: [{ value: "risk", label: "リスク" }, { value: "corrective", label: "是正処置" }] },
              { key: "status", label: "状態", options: Object.entries(RISK_STATUS).map(([value, v]) => ({ value, label: v.label })) },
              { key: "owner", label: "対応責任者", options: users.filter((u) => u.kind === "member" && u.account === false).map((u) => ({ value: u.id, label: u.name })) },
            ]}
          />
          <DataTable<Risk>
            rows={rows}
            rowKey={(r) => r.id}
            onRowClick={(r) => navigate(paths.risk(org, pr, r.id))}
            empty={listStateView("0件（絞り込み）", { emptyTitle: "" })}
            columns={[
              { key: "id", header: "ID", render: (r) => <span className="id-link" style={{ color: "var(--primary)" }}>{r.id}</span>, sortValue: (r) => r.id, hideable: false },
              { key: "kind", header: "種類", render: (r) => <Tag square tone={r.kind === "risk" ? "warn" : "info"}>{r.kind === "risk" ? "リスク" : "是正処置"}</Tag> },
              { key: "title", header: "タイトル", render: (r) => <span className="strong" style={{ fontWeight: 500 }}>{r.title}</span> },
              { key: "impact", header: "影響度", align: "right", render: (r) => r.impact, sortValue: (r) => r.impact },
              { key: "likelihood", header: "発生可能性", align: "right", render: (r) => r.likelihood, sortValue: (r) => r.likelihood },
              { key: "status", header: "状態", render: (r) => <StatusBadge vocab={RISK_STATUS[r.status]} size="sm" /> },
              { key: "residual", header: "残余リスク", render: (r) => <span className="small">{riskExtras[r.id]?.residual ?? <span className="muted">未評価</span>}</span> },
              { key: "owner", header: "対応責任者", render: (r) => <ExternalActor userId={r.owner_id} /> },
              { key: "decision", header: "経営判断", render: (r) => (riskExtras[r.id]?.decision ? <span onClick={(e) => e.stopPropagation()}><IdLink id={riskExtras[r.id]!.decision!} to={paths.decision(org, riskExtras[r.id]!.decision!)} /></span> : <span className="tiny muted">—</span>) },
              { key: "due", header: "期限", render: (r) => (r.status === "done" ? <span className="small muted">{r.due_at}</span> : <DeadlineIndicator date={r.due_at} />), sortValue: (r) => r.due_at },
              { key: "related", header: "関連", align: "right", render: (r) => r.related.length, sortValue: (r) => r.related.length },
            ]}
          />
        </>
      )}
      <RiskRegisterModal open={open} onClose={() => setModal(false)} />
    </ProjectLayout>
  );
}
