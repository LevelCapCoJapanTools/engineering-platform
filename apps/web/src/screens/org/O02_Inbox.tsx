// 画面ID: O-02 承認待ち（受信箱）
import { useMemo, useState } from "react";
import { useScreenState, useRoute } from "../../lib/router";
import { ORG, paths } from "../../lib/paths";
import { APPROVAL_KIND } from "../../lib/types";
import type { ApprovalKind, ApprovalRequest, Approver } from "../../lib/types";
import type { Role } from "../../lib/vocab";
import { AppLayout, ApprovalPanel, ApprovalRequestCard, Button, crumbs, DeadlineIndicator, Drawer, EmptyState, ErrorState, FilterBar, KeyValueList, MarkdownViewer, PageHeader, Skeleton, Tabs, Tag, Timestamp, UserChip, useToast } from "../../ui";
import { approvalRequests, changes, exceptions, requirements, userById } from "../../mocks/core";
import { daysUntil } from "../../lib/format";

const TAB_KINDS: (ApprovalKind | "all")[] = ["all", "requirement", "design", "change", "exception", "release", "acceptance", "tailoring"];

function roleFor(kind: ApprovalKind): Role {
  return kind === "release" ? "リリース管理者" : kind === "design" ? "設計者" : kind === "verification" ? "QA" : kind === "tailoring" ? "ポリシー管理者" : "PM";
}

function Body({ req }: { req: ApprovalRequest }) {
  if (req.kind === "exception") {
    const ex = exceptions.find((e) => e.id === req.target_id) ?? exceptions[0];
    return (
      <KeyValueList
        items={[
          { label: "対象", value: <span className="mono small">{ex.target}</span> },
          { label: "ルール", value: <span className="mono small">ゲート{ex.gate} · {ex.rule_id}</span> },
          { label: "理由", value: ex.reason },
          { label: "リスク", value: ex.risk },
          { label: "代替の対策", value: ex.mitigation ?? <span className="muted">記載なし</span> },
          { label: "期限", value: <DeadlineIndicator date={ex.expires_at} /> },
        ]}
      />
    );
  }
  if (req.kind === "requirement") {
    const r = requirements.find((x) => x.id === req.target_id) ?? requirements[0];
    return (
      <div className="stack" style={{ ["--gap" as string]: "10px" }}>
        <MarkdownViewer source={r.body} />
        <div className="stack" style={{ ["--gap" as string]: "4px" }}>
          <span className="label">受入基準</span>
          {r.acceptance_criteria.length ? (
            <ul className="small" style={{ margin: 0, paddingLeft: 18 }}>{r.acceptance_criteria.map((a) => <li key={a}>{a}</li>)}</ul>
          ) : (
            <span className="small text-warn">受入基準がありません</span>
          )}
        </div>
        <KeyValueList items={[{ label: "出典", value: r.source }, { label: "版", value: `v${r.version}` }]} />
      </div>
    );
  }
  if (req.kind === "change") {
    const c = changes.find((x) => x.id === req.target_id) ?? changes[0];
    return <KeyValueList items={[{ label: "変更内容", value: c.title }, { label: "起票者", value: <UserChip user={userById(c.filed_by)} /> }, { label: "影響範囲", value: `${c.impact_count}件（要求・設計・テスト）` }, { label: "起票日時", value: <Timestamp at={c.filed_at} mode="absolute" /> }]} />;
  }
  return <p className="small muted">{APPROVAL_KIND[req.kind]}の内容は詳細画面で確認できます。</p>;
}

export function Inbox() {
  const state = useScreenState();
  const toast = useToast();
  const org = useRoute().params.org ?? ORG;
  const [tab, setTab] = useState<string>("all");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [open, setOpen] = useState<ApprovalRequest | null>(null);
  const [done, setDone] = useState<string[]>([]);
  const base = state === "empty" ? [] : approvalRequests.filter((r) => !done.includes(r.id));
  const list = useMemo(
    () =>
      base.filter((r) => (tab === "all" || r.kind === tab) && (!filters.project || r.project_slug === filters.project) && (!filters.due || (filters.due === "overdue" ? daysUntil(r.due_at) < 0 : daysUntil(r.due_at) <= 3))),
    [base, tab, filters],
  );
  const detailPath = (r: ApprovalRequest) => {
    const p = r.project_slug;
    switch (r.kind) {
      case "exception": return paths.exception(org, p, r.target_id);
      case "change": return paths.change(org, p, r.target_id);
      case "requirement": return paths.requirement(org, p, r.target_id);
      case "design": return paths.design(org, p, r.target_id);
      case "release": return paths.release(org, p, r.target_id);
      default: return paths.project(org, p);
    }
  };
  const self = open ? open.requester_id === "u-sato" : false;
  const approvers: Approver[] = open ? [{ role: roleFor(open.kind), user_id: "u-sato", status: "pending" }] : [];

  return (
    <AppLayout org={org} active="inbox" breadcrumb={crumbs(org, undefined, { label: "承認待ち" })}>
      <PageHeader title="承認待ち" description="あなたが判断する必要がある項目です。カードを押すと、その場で内容を確認して承認・差戻しできます。" />
      <Tabs value={tab} onChange={setTab} tabs={TAB_KINDS.map((k) => ({ value: k, label: k === "all" ? "すべて" : APPROVAL_KIND[k], count: base.filter((r) => k === "all" || r.kind === k).length }))} />
      <FilterBar
        filters={[
          { key: "project", label: "プロジェクト", options: [{ value: "order-renewal", label: "受発注システム刷新" }, { value: "inventory-dashboard", label: "在庫管理ダッシュボード" }] },
          { key: "due", label: "期限", options: [{ value: "overdue", label: "期限超過" }, { value: "soon", label: "3日以内" }] },
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
          {base.length === 0 ? (
            <EmptyState icon="checkCircle" title="承認待ちはありません" description="新しい承認依頼が届くと、ここと通知に表示されます。" />
          ) : (
            <EmptyState variant="filtered" title="条件に合う承認待ちはありません" description="タブや絞り込み条件を変更してください。" action={<Button size="sm" onClick={() => { setTab("all"); setFilters({}); }}>条件をクリア</Button>} />
          )}
        </div>
      ) : (
        <div className="grid cols-2">
          {list.map((r) => <ApprovalRequestCard key={r.id} req={r} onOpen={() => setOpen(r)} />)}
        </div>
      )}

      <Drawer
        open={Boolean(open)}
        onClose={() => setOpen(null)}
        width={720}
        title={open ? <span className="row"><Tag tone="primary" square>{APPROVAL_KIND[open.kind]}</Tag><span className="id-link">{open.target_id}</span>{open.title}</span> : ""}
        subtitle={open ? <span className="row">{open.project_name} · 依頼者 <UserChip user={userById(open.requester_id)} plain /> · <Timestamp at={open.requested_at} /> · <DeadlineIndicator date={open.due_at} /></span> : null}
        footer={open ? <Button variant="ghost" icon="external" to={detailPath(open)}>詳細画面を開く</Button> : null}
      >
        {open ? (
          <div className="stack">
            <section className="card tight"><Body req={open} /></section>
            <ApprovalPanel
              approvers={approvers}
              canDecide={!self}
              blockedReason={self ? "あなたはこの項目の依頼者のため承認できません" : undefined}
              onDecide={(d) => {
                toast({ kind: "success", message: d === "approved" ? `${open.target_id} を承認しました` : `${open.target_id} を差し戻しました`, undo: () => setDone((x) => x.filter((y) => y !== open.id)) });
                setDone((x) => [...x, open.id]);
                setOpen(null);
              }}
            />
          </div>
        ) : null}
      </Drawer>
    </AppLayout>
  );
}
