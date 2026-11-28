// 画面ID: V-05 監査ログ
import { useState } from "react";
import { useScreenState } from "../../lib/router";
import { ORG, PROJECT } from "../../lib/paths";
import { auditChain } from "../../mocks/audit";
import type { ChainedEvent } from "../../mocks/audit";
import "./audit.css";
import {
  ActorLabel,
  Banner,
  Button,
  HashDisplay,
  DataTable,
  EmptyState,
  ErrorState,
  FilterBar,
  IdLink,
  PageHeader,
  ProjectLayout,
  Segmented,
  Skeleton,
  Timeline,
  Timestamp,
  useToast,
} from "../../ui";
import type { Column } from "../../ui";

const ACTION_KINDS: Record<string, (a: string) => boolean> = {
  approval: (a) => a.includes("承認") || a.includes("受入"),
  gate: (a) => a.includes("判定"),
  ai: (a) => a.includes("所見"),
  evidence: (a) => a.includes("Manifest"),
  change: (a) => a.includes("作成") || a.includes("申請") || a.includes("起票"),
};

export function AuditLog({ org = ORG, project = PROJECT }: { org?: string; project?: string }) {
  const state = useScreenState();
  const toast = useToast();
  const [view, setView] = useState("table");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const tampered = state === "tampered";
  const chain = auditChain(tampered);
  const broken = chain.filter((e) => !e.chain_ok);
  const rows = state === "empty" ? [] : chain.filter((e) => {
    if (filters.actor && e.actor.kind !== filters.actor) return false;
    if (filters.action && !ACTION_KINDS[filters.action]?.(e.action)) return false;
    if (filters.period === "today" && !e.at.startsWith("2026-11-27")) return false;
    if (filters.period === "week" && e.at < "2026-11-20") return false;
    if (search && !`${e.target} ${e.action} ${e.actor.name}`.includes(search)) return false;
    return true;
  });
  const columns: Column<ChainedEvent>[] = [
    { key: "seq", header: "連番", render: (e) => <span className={e.chain_ok ? "mono small" : "mono small text-fail strong"}>{e.seq.toLocaleString("ja-JP")}</span>, sortValue: (e) => e.seq, hideable: false },
    { key: "at", header: "日時", render: (e) => <Timestamp at={e.at} mode="absolute" />, sortValue: (e) => e.at },
    { key: "actor", header: "主体", render: (e) => <ActorLabel kind={e.actor.kind} name={e.actor.name} size="sm" />, sortValue: (e) => e.actor.kind },
    { key: "action", header: "操作", render: (e) => e.action, sortValue: (e) => e.action },
    { key: "target", header: "対象", render: (e) => <IdLink id={e.target} /> },
    {
      key: "change",
      header: "変更前 → 変更後",
      render: (e) => (e.before || e.after ? <span className="small">{e.before ?? "—"} <span className="muted">→</span> {e.after ?? "—"}</span> : <span className="small muted">—</span>),
    },
    {
      key: "hash",
      header: "連鎖ハッシュ",
      render: (e) => (
        <span className="audit-hash-cell" style={{ display: "inline-block" }}>
          <HashDisplay value={e.hash} verified={e.chain_ok ? "match" : "mismatch"} />
        </span>
      ),
    },
    {
      key: "detail",
      header: "詳細",
      render: (e) =>
        open === e.id ? (
          <div className="stack small" style={{ ["--gap" as string]: "2px" }}>
            <span>{e.detail ?? "追加情報はありません"}</span>
            <span className="mono tiny muted">event_id: {e.id}</span>
            <span className="mono tiny muted">prev_hash: {e.prev_hash.slice(0, 24)}…</span>
            <button type="button" className="btn ghost sm" onClick={(ev) => { ev.stopPropagation(); setOpen(null); }}>閉じる</button>
          </div>
        ) : (
          <button type="button" className="btn ghost sm" onClick={(ev) => { ev.stopPropagation(); setOpen(e.id); }}>展開</button>
        ),
    },
  ];
  const exportAs = (fmt: string) => toast({ kind: "success", message: `${rows.length}件の監査ログを ${fmt} で出力しました（モック）` });
  return (
    <ProjectLayout org={org} project={project} active="auditLog" trail={[{ label: "監査ログ" }]}>
      <PageHeader
        title="監査ログ"
        description="判断と操作の記録です。追記のみで、更新・削除はできません。各記録は連番と前の記録のハッシュでつながっており、欠番や書き換えを検出します。"
        actions={
          <>
            <Button icon="download" onClick={() => exportAs("CSV")}>CSV 出力</Button>
            <Button icon="download" onClick={() => exportAs("JSON")}>JSON 出力</Button>
          </>
        }
      />
      {state === "default" || tampered ? (
        tampered ? (
          <Banner tone="fail" title={`連番 ${broken.map((b) => b.seq.toLocaleString("ja-JP")).join("、")} の記録で連鎖ハッシュが一致しません`}>
            データベース上の記録が書き換えられた可能性があります。WORM 保管先の写しと照合し、組織管理者と CTO に通知しました。この区間の記録は監査パックで「検証失敗」と表示されます。
          </Banner>
        ) : (
          <Banner tone="pass" title="連鎖ハッシュを検証しました">連番 1〜128,400 に欠番・不一致はありません（最終検証 2026-11-27 10:25、WORM 保管先の写しと一致）。</Banner>
        )
      ) : null}
      <FilterBar
        search={search}
        onSearch={setSearch}
        searchPlaceholder="対象や主体で絞り込み"
        values={filters}
        onChange={(k, v) => setFilters((f) => ({ ...f, [k]: v }))}
        filters={[
          { key: "period", label: "期間", options: [{ value: "today", label: "今日" }, { value: "week", label: "過去7日" }] },
          { key: "actor", label: "主体の種類", options: [{ value: "human", label: "人間" }, { value: "ci", label: "CI" }, { value: "ai", label: "AI" }, { value: "system", label: "システム" }] },
          { key: "action", label: "操作の種類", options: [{ value: "approval", label: "承認・受入" }, { value: "gate", label: "ゲート判定" }, { value: "ai", label: "AI所見" }, { value: "evidence", label: "証跡・署名" }, { value: "change", label: "作成・申請" }] },
        ]}
        actions={<Segmented value={view} onChange={setView} options={[{ value: "table", label: "表" }, { value: "timeline", label: "タイムライン" }]} />}
      />
      {state === "loading" ? (
        <Skeleton rows={8} />
      ) : state === "error" ? (
        <ErrorState />
      ) : view === "timeline" ? (
        rows.length ? (
          <div className="card">
            <Timeline items={rows.map((e) => ({ id: e.id, actor: e.actor, action: e.action, target: <IdLink id={e.target} />, at: e.at, detail: e.detail }))} />
          </div>
        ) : (
          <div className="card"><EmptyState variant={state === "empty" ? "initial" : "filtered"} icon="history" title={state === "empty" ? "監査ログはまだありません" : "条件に合う記録はありません"} /></div>
        )
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(e) => e.id}
          total={state === "empty" ? 0 : rows.length === chain.length ? 128400 : rows.length}
          empty={state === "empty" ? <EmptyState icon="history" title="監査ログはまだありません" description="承認やゲートの判定が行われると、ここに記録されます。" /> : <EmptyState variant="filtered" title="条件に合う記録はありません" />}
        />
      )}
    </ProjectLayout>
  );
}
