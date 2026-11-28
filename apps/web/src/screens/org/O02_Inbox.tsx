// 画面ID: O-02 経営判断（受信箱）
// 経営層が判断すべき項目を、期限・影響額・重大度の順に並べる。
// PM 等が行う実務の承認（要求・設計・例外など）は「参照のみ」として分けて示す。
import "../executive/executive.css";
import { useMemo, useState } from "react";
import { useRoute, useScreenState } from "../../lib/router";
import { ORG, paths } from "../../lib/paths";
import { APPROVAL_KIND } from "../../lib/types";
import type { ApprovalKind, Decision } from "../../lib/types";
import type { Role } from "../../lib/vocab";
import { approvalRequests, userById } from "../../mocks/core";
import { decisions } from "../../mocks/portfolio";
import { DECISION_KIND, delegatedDecisions, sortDecisions } from "../../mocks/executive";
import { AppLayout, Button, crumbs, DataTable, DeadlineIndicator, EmptyState, ErrorState, ExternalActor, FilterBar, Modal, PageHeader, Section, Skeleton, Tabs, Tag, TextArea, useToast } from "../../ui";
import { DecisionCard } from "../executive/parts";

type TabKey = "pending" | "delegated" | "decided";

function actorRoleFor(kind: ApprovalKind): Role {
  return kind === "release" ? "リリース管理者" : kind === "design" ? "設計者" : kind === "verification" ? "QA" : kind === "tailoring" ? "ポリシー管理者" : kind === "acceptance" ? "顧客" : "PM";
}

export function Inbox() {
  const state = useScreenState();
  const toast = useToast();
  const org = useRoute().params.org ?? ORG;
  const [tab, setTab] = useState<TabKey>("pending");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [routing, setRouting] = useState<Decision | null>(null);
  const [routeNote, setRouteNote] = useState("");
  const [routed, setRouted] = useState<string[]>([]);

  const empty = state === "empty";
  const all: Decision[] = empty ? [] : [...decisions, ...delegatedDecisions];
  const byTab: Record<TabKey, Decision[]> = {
    pending: sortDecisions(all.filter((d) => d.status === "pending" && !routed.includes(d.id))),
    delegated: sortDecisions([...all.filter((d) => d.status === "delegated"), ...all.filter((d) => routed.includes(d.id)).map((d) => ({ ...d, status: "delegated" as const }))]),
    decided: [...all.filter((d) => ["approved", "conditional", "rejected", "onHold"].includes(d.status))].sort((a, b) => (b.decided_at ?? "").localeCompare(a.decided_at ?? "")),
  };
  const list = useMemo(
    () => byTab[tab].filter((d) => (!filters.kind || d.kind === filters.kind) && (!filters.project || (filters.project === "org" ? !d.project : d.project === filters.project))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tab, filters, routed, state],
  );
  const practical = empty ? [] : approvalRequests;

  return (
    <AppLayout org={org} active="inbox" breadcrumb={crumbs(org, undefined, { label: "経営判断" })}>
      <PageHeader
        title="経営判断"
        description="経営層が判断すべき項目です。期限・影響額・重大度の順に並びます。実務上の承認者が別にいる項目は、その人へ回付できます。"
        actions={<Button icon="history" to={paths.decisions(org)}>判断ログ</Button>}
      />
      <Tabs
        value={tab}
        onChange={(v) => setTab(v as TabKey)}
        tabs={[
          { value: "pending", label: "判断待ち", count: byTab.pending.length },
          { value: "delegated", label: "担当者へ回付済み", count: byTab.delegated.length },
          { value: "decided", label: "判断済み", count: byTab.decided.length },
        ]}
      />
      <FilterBar
        filters={[
          { key: "kind", label: "種類", options: Object.entries(DECISION_KIND).map(([value, label]) => ({ value, label })) },
          { key: "project", label: "案件", options: [{ value: "order-renewal", label: "受発注システム刷新" }, { value: "member-app-api", label: "会員アプリ API 開発" }, { value: "legacy-migration", label: "旧基幹データ移行" }, { value: "org", label: "組織全体（案件なし）" }] },
        ]}
        values={filters}
        onChange={(k, v) => setFilters((f) => ({ ...f, [k]: v }))}
      />
      {state === "loading" ? (
        <Skeleton variant="card" rows={3} />
      ) : state === "error" ? (
        <ErrorState />
      ) : list.length === 0 ? (
        <div className="card">
          {byTab[tab].length === 0 ? (
            <EmptyState icon="checkCircle" title={tab === "pending" ? "判断待ちはありません" : "該当する判断はありません"} description="新しい判断の依頼が届くと、ここと通知（チャット・メール）に表示されます。" />
          ) : (
            <EmptyState variant="filtered" title="条件に合う判断はありません" description="絞り込み条件を変更してください。" action={<Button size="sm" onClick={() => setFilters({})}>条件をクリア</Button>} />
          )}
        </div>
      ) : (
        <div className="grid cols-2">
          {list.map((d) => (
            <DecisionCard
              key={d.id}
              org={org}
              d={d}
              footer={
                <div className="row end" style={{ ["--gap" as string]: "8px" }}>
                  {tab === "pending" && d.practical_approver ? (
                    <Button size="sm" icon="route" onClick={() => { setRouting(d); setRouteNote(""); }}>正しい承認者へ回付</Button>
                  ) : null}
                  {tab === "delegated" ? <span className="tiny muted">回付先: {d.practical_approver ?? "—"}</span> : null}
                  <Button size="sm" variant={tab === "pending" ? "primary" : "secondary"} to={paths.decision(org, d.id)}>{tab === "pending" ? "内容を確認して判断" : "記録を見る"}</Button>
                </div>
              }
            />
          ))}
        </div>
      )}

      {state === "loading" || state === "error" ? null : (
        <Section title="実務の承認状況（参照のみ）" sub="要求・設計・例外・リリースなどの承認は、担当者が既存のツールや期限付きの承認リンクで行います。ここでは状況だけを確認できます">
          {practical.length === 0 ? (
            <p className="small muted">進行中の実務の承認はありません。</p>
          ) : (
            <DataTable
              bare
              compact
              rows={practical}
              rowKey={(r) => r.id}
              columns={[
                { key: "kind", header: "種類", render: (r) => <Tag square>{APPROVAL_KIND[r.kind]}</Tag> },
                { key: "title", header: "内容", render: (r) => <span className="stack" style={{ ["--gap" as string]: "2px" }}><span className="small strong">{r.title}</span><span className="tiny muted">{r.project_name}</span></span>, hideable: false },
                { key: "approver", header: "承認する人", render: (r) => <Tag square>{actorRoleFor(r.kind)}</Tag> },
                { key: "requester", header: "依頼者", render: (r) => { const u = userById(r.requester_id); return u ? <ExternalActor userId={u.id} role={u.roles.join("・")} /> : "—"; } },
                { key: "due", header: "期限", render: (r) => <DeadlineIndicator date={r.due_at} />, sortValue: (r) => r.due_at },
              ]}
            />
          )}
        </Section>
      )}

      <Modal
        open={routing !== null}
        onClose={() => setRouting(null)}
        title="正しい承認者へ回付"
        description="この判断は実務上の承認者の合意が必要です。回付すると、経営判断の受信箱からは「回付済み」に移り、回付の記録が監査記録に残ります。"
        footer={
          <>
            <Button onClick={() => setRouting(null)}>キャンセル</Button>
            <Button
              variant="primary"
              icon="send"
              disabled={!routeNote.trim()}
              disabledReason="回付の理由を入力してください"
              onClick={() => {
                if (routing) setRouted((r) => [...r, routing.id]);
                setRouting(null);
                toast({ kind: "success", message: "回付しました。承認者に期限付きの承認リンクと通知を送りました" });
              }}
            >
              回付する
            </Button>
          </>
        }
      >
        {routing ? (
          <div className="stack">
            <div className="small"><span className="muted">対象: </span>{routing.title}</div>
            <div className="exec-route-note small">回付先: {routing.practical_approver}</div>
            <TextArea label="回付の理由" required rows={3} value={routeNote} onChange={setRouteNote} placeholder="例: 顧客への説明は PM と顧客の合意事項のため" />
          </div>
        ) : null}
      </Modal>
    </AppLayout>
  );
}
