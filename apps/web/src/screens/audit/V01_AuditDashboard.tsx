// 画面ID: V-01 監査ダッシュボード
import { useState } from "react";
import { navigate, useScreenState } from "../../lib/router";
import { ORG, PROJECT, paths } from "../../lib/paths";
import { CONTROL_STATUS } from "../../lib/vocab";
import type { Control } from "../../lib/types";
import { controls, evidence, exceptions, manifests } from "../../mocks/core";
import { processCoverage } from "../../mocks/audit";
import { formatDate, percent } from "../../lib/format";
import {
  ActorLabel,
  Button,
  ControlLayerTag,
  DataTable,
  EmptyState,
  ErrorState,
  FilterBar,
  IdLink,
  PageHeader,
  ProjectLayout,
  Section,
  Skeleton,
  StatCard,
  StatusBadge,
} from "../../ui";
import type { Column } from "../../ui";

export function AuditDashboard({ org = ORG, project = PROJECT }: { org?: string; project?: string }) {
  const state = useScreenState();
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const satisfied = controls.filter((c) => c.status === "satisfied").length;
  const missingEvidence = evidence.filter((e) => e.missing).length;
  const failedSig = manifests.filter((m) => m.signature === "failed").length;
  const activeEx = exceptions.filter((e) => e.status === "active").length;

  const rows = state === "empty" ? [] : controls.filter((c) => {
    if (filters.process && c.process !== filters.process) return false;
    if (filters.status && c.status !== filters.status) return false;
    if (filters.layer && c.layer !== filters.layer) return false;
    if (search && !`${c.id} ${c.description}`.includes(search)) return false;
    return true;
  });

  const columns: Column<Control>[] = [
    { key: "id", header: "統制項目", render: (c) => <IdLink id={c.id} to={paths.control(org, project, c.id)} />, sortValue: (c) => c.id, hideable: false },
    { key: "desc", header: "説明（自社）", render: (c) => <span className="truncate" style={{ display: "block", maxWidth: 360 }} title={c.description}>{c.description}</span> },
    { key: "layer", header: "層", render: (c) => <ControlLayerTag layer={c.layer} />, sortValue: (c) => c.layer },
    { key: "status", header: "充足状態", render: (c) => <StatusBadge vocab={CONTROL_STATUS[c.status]} size="sm" />, sortValue: (c) => c.status },
    { key: "machine", header: "機械検証", render: (c) => (c.machine_rule_ids.length ? <ActorLabel kind="ci" name={`${c.machine_rule_ids.length}ルール`} size="sm" /> : <span className="muted small">なし</span>) },
    { key: "human", header: "人間承認", render: (c) => (c.human_role ? <ActorLabel kind="human" name={c.human_role} size="sm" /> : <span className="muted small">不要</span>) },
    { key: "count", header: "証跡数", align: "right", render: (c) => c.evidence_count, sortValue: (c) => c.evidence_count },
    { key: "updated", header: "最終更新", render: (c) => <span className="small">{formatDate(c.updated_at)}</span>, sortValue: (c) => c.updated_at },
  ];

  return (
    <ProjectLayout org={org} project={project} active="audit" trail={[{ label: "監査ダッシュボード" }]}>
      <PageHeader
        title="監査ダッシュボード"
        description="統制項目ごとに、証跡がそろっているかを確認します。判定は自動ルールと人間の承認の記録に基づきます。"
        actions={
          <>
            <Button icon="history" to={paths.auditLog(org, project)}>監査ログ</Button>
            <Button variant="primary" icon="package" to={paths.auditExport(org, project)}>監査パックを出力</Button>
          </>
        }
      />
      {state === "error" ? (
        <ErrorState />
      ) : (
        <>
          <div className="grid cols-4">
            <StatCard label="統制項目の充足率" icon="checkCircle" loading={state === "loading"} value={state === "empty" ? "—" : percent(satisfied, controls.length)} unit={state === "empty" ? undefined : "%"} delta={state === "empty" ? "統制項目がありません" : `${satisfied}/${controls.length} 項目が充足`} tone={state === "empty" ? undefined : "good"} />
            <StatCard label="欠落している証跡" icon="alertCircle" loading={state === "loading"} value={state === "empty" ? 0 : missingEvidence} unit="件" tone={missingEvidence && state !== "empty" ? "danger" : undefined} delta="必要だが未取得の証跡" to={paths.manifests(org, project)} />
            <StatCard label="検証に失敗した署名" icon="shieldX" loading={state === "loading"} value={state === "empty" ? 0 : failedSig} unit="件" tone={failedSig && state !== "empty" ? "danger" : undefined} delta="Evidence Manifest の署名" to={paths.manifests(org, project)} />
            <StatCard label="有効な例外" icon="flag" loading={state === "loading"} value={state === "empty" ? 0 : activeEx} unit="件" tone={activeEx && state !== "empty" ? "warn" : undefined} delta="期限付きで通過を許可" to={paths.exceptions(org, project)} />
          </div>

          <Section title="プロセス別の充足状況" sub="Project Management（PM）の4活動と Software Implementation（SI）の6活動">
            {state === "loading" ? (
              <Skeleton variant="detail" rows={4} />
            ) : state === "empty" ? (
              <p className="muted small">表示する統制項目がありません。</p>
            ) : (
              <div className="grid cols-2">
                {(["PM", "SI"] as const).map((proc) => (
                  <div key={proc} className="stack" style={{ ["--gap" as string]: "10px" }}>
                    <span className="label">{proc === "PM" ? "PM: プロジェクト管理" : "SI: ソフトウェア実装"}</span>
                    <div className="bars">
                      {processCoverage.filter((p) => p.process === proc).map((p) => {
                        const pct = percent(p.satisfied, p.total);
                        return (
                          <div key={p.label} className="hbar">
                            <span className="truncate">{p.label}</span>
                            <span className="bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${p.label} の充足率`}>
                              <span style={{ width: `${pct}%`, background: pct === 100 ? "var(--tone-pass)" : pct === 0 ? "var(--tone-fail)" : "var(--tone-warn)" }} />
                            </span>
                            <span className="small num" style={{ textAlign: "right" }}>{p.satisfied}/{p.total}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <div className="stack" style={{ ["--gap" as string]: "10px" }}>
            <h2 className="section-title">統制項目</h2>
            <FilterBar
              search={search}
              onSearch={setSearch}
              searchPlaceholder="CTL-ID や説明で絞り込み"
              values={filters}
              onChange={(k, v) => setFilters((f) => ({ ...f, [k]: v }))}
              filters={[
                { key: "process", label: "プロセス", options: [{ value: "PM", label: "PM" }, { value: "SI", label: "SI" }] },
                { key: "status", label: "充足状態", options: Object.entries(CONTROL_STATUS).map(([value, v]) => ({ value, label: v.label })) },
                { key: "layer", label: "層", options: [{ value: "normative", label: "規範" }, { value: "guidance", label: "ガイド" }, { value: "tailoring", label: "組織調整" }, { value: "automated", label: "自動ルール" }] },
              ]}
            />
            {state === "loading" ? (
              <Skeleton rows={6} />
            ) : (
              <DataTable
                columns={columns}
                rows={rows}
                rowKey={(c) => c.id}
                onRowClick={(c) => navigate(paths.control(org, project, c.id))}
                empty={
                  state === "empty" ? (
                    <EmptyState icon="layers" title="統制項目がまだありません" description="プロジェクトに Control Pack を適用すると、統制項目と証跡の対応がここに表示されます。" action={<Button variant="primary" to={paths.policies(org)}>Control Pack を確認</Button>} />
                  ) : (
                    <EmptyState variant="filtered" title="条件に合う統制項目はありません" description="絞り込み条件を変更してください。" />
                  )
                }
              />
            )}
          </div>
        </>
      )}
    </ProjectLayout>
  );
}
