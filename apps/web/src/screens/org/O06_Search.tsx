// 画面ID: O-06 横断検索
import { useState } from "react";
import type { ReactNode } from "react";
import { useScreenState, useRoute, Link } from "../../lib/router";
import { ORG, PROJECT, paths } from "../../lib/paths";
import { ARTIFACT_STATUS, CHANGE_STATUS, EXCEPTION_STATUS, GATE_STATUS, RELEASE_STATUS, EVIDENCE_STATUS } from "../../lib/vocab";
import type { StatusVocab } from "../../lib/vocab";
import { AppLayout, crumbs, EmptyState, ErrorState, PageHeader, SearchBox, Skeleton, StatusBadge, Tabs } from "../../ui";
import { changes, designs, evidence, exceptions, gateRuns, releases, requirements } from "../../mocks/core";

type Hit = { kind: string; id: string; title: string; status: StatusVocab; to: string; project: string };

function highlight(text: string, q: string): ReactNode {
  if (!q) return text;
  const i = text.indexOf(q);
  if (i < 0) return text;
  return (
    <>
      {text.slice(0, i)}
      <mark style={{ background: "var(--tone-warn-bg)", color: "var(--tone-warn)", padding: "0 2px" }}>{q}</mark>
      {text.slice(i + q.length)}
    </>
  );
}

export function Search() {
  const state = useScreenState();
  const org = useRoute().params.org ?? ORG;
  const [q, setQ] = useState(state === "empty" ? "請求書" : state === "initial" ? "" : "発注");
  const [tab, setTab] = useState("all");
  const pj = "受発注システム刷新";
  const all: Hit[] = [
    ...requirements.map((r) => ({ kind: "要求", id: r.id, title: r.title, status: ARTIFACT_STATUS[r.status], to: paths.requirement(org, PROJECT, r.id), project: pj })),
    ...designs.map((d) => ({ kind: "設計", id: d.id, title: d.title, status: ARTIFACT_STATUS[d.status], to: paths.design(org, PROJECT, d.id), project: pj })),
    ...changes.map((c) => ({ kind: "変更", id: c.id, title: c.title, status: CHANGE_STATUS[c.status], to: paths.change(org, PROJECT, c.id), project: pj })),
    ...exceptions.map((e) => ({ kind: "例外", id: e.id, title: `${e.target} — ${e.reason}`, status: EXCEPTION_STATUS[e.status], to: paths.exception(org, PROJECT, e.id), project: pj })),
    ...releases.map((r) => ({ kind: "リリース", id: r.version, title: r.title, status: RELEASE_STATUS[r.status], to: paths.release(org, PROJECT, r.id), project: pj })),
    ...evidence.filter((e) => !e.missing).map((e) => ({ kind: "証跡", id: e.id, title: e.title, status: EVIDENCE_STATUS[e.status], to: paths.manifests(org, PROJECT), project: pj })),
    ...gateRuns.filter((g) => g.pr_number).map((g) => ({ kind: "PR", id: `#${g.pr_number}`, title: g.pr_title, status: GATE_STATUS[g.verdict], to: paths.gate(org, PROJECT, g.id), project: pj })),
  ];
  const matched = q ? all.filter((h) => `${h.id} ${h.title}`.includes(q)) : [];
  const kinds = ["要求", "設計", "変更", "例外", "リリース", "証跡", "PR"];
  const list = matched.filter((h) => tab === "all" || h.kind === tab);
  return (
    <AppLayout org={org} active="dashboard" breadcrumb={crumbs(org, undefined, { label: "検索" })}>
      <PageHeader title="横断検索" description="要求、設計、変更、例外、リリース、証跡、PR を ID や語で検索します。" />
      <SearchBox placeholder="例: REQ-0012、発注、PR #142" value={q} onChange={setQ} width="min(560px, 100%)" />
      <Tabs value={tab} onChange={setTab} tabs={[{ value: "all", label: "すべて", count: matched.length }, ...kinds.map((k) => ({ value: k, label: k, count: matched.filter((h) => h.kind === k).length }))]} />
      {state === "loading" ? (
        <Skeleton rows={5} />
      ) : state === "error" ? (
        <ErrorState />
      ) : !q ? (
        <div className="card"><EmptyState icon="search" title="検索語を入力してください" description="ID（REQ-0012、ADR-0003、EXC-0007 など）やタイトルの一部で検索できます。" /></div>
      ) : list.length === 0 ? (
        <div className="card"><EmptyState variant="filtered" title={`「${q}」に一致する項目はありません`} description="別の語やIDで検索してください。閲覧権限のないプロジェクトの項目は表示されません。" /></div>
      ) : (
        <div className="card flush">
          {list.map((h) => (
            <Link key={h.kind + h.id} to={h.to} className="row" style={{ ["--gap" as string]: "14px", padding: "12px 18px", borderBottom: "1px solid var(--border)", textDecoration: "none", color: "inherit" }}>
              <span className="badge square tone-neutral" style={{ minWidth: 56, justifyContent: "center" }}>{h.kind}</span>
              <span className="id-link" style={{ color: "var(--primary)", minWidth: 80 }}>{highlight(h.id, q)}</span>
              <span className="grow truncate">{highlight(h.title, q)}</span>
              <span className="tiny muted desktop-only">{h.project}</span>
              <StatusBadge vocab={h.status} size="sm" />
            </Link>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
