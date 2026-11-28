// 画面ID: X-08 顧客ポータル: 申請・承認の受信箱
// 受注側からの仕様・追加見積・日程・リリース・受入の依頼を集約し、何を誰がいつまでに決めるか、承認した場合の影響を示す。
import { useState } from "react";
import { navigate, useScreenState } from "../../lib/router";
import { PROJECT, paths } from "../../lib/paths";
import { formatDate, yen } from "../../lib/format";
import { customerRequests, REQUEST_KIND } from "../../mocks/external";
import type { CustomerRequestKind } from "../../mocks/external";
import { CustomerPortalLayout, DeadlineIndicator, EmptyState, ErrorState, Select, Skeleton, StatusBadge, Tabs, VersionPin } from "./deps";
import { REQUEST_STATUS, RequestKindTag } from "./portalParts";

export function X08PortalRequests({ project = PROJECT }: { project?: string }) {
  const state = useScreenState();
  const alliance = state === "業務提携型";
  const slug = alliance ? "member-app-api" : project;
  const [tab, setTab] = useState("open");
  const [kind, setKind] = useState("all");
  const all = state === "空" ? [] : customerRequests.filter((r) => r.project === slug);
  const open = all.filter((r) => r.status === "pending" || r.status === "questioned");
  const closed = all.filter((r) => r.status === "approved" || r.status === "returned");
  const rows = (tab === "open" ? open : closed).filter((r) => kind === "all" || r.kind === kind).sort((a, b) => a.due.localeCompare(b.due));

  return (
    <CustomerPortalLayout project={slug} active="requests" userId={alliance ? "u-fujii" : undefined}>
      <div className="stack" style={{ ["--gap" as string]: "4px" }}>
        <h1 style={{ fontSize: "var(--text-xl)", color: "var(--text-strong)" }}>申請・承認</h1>
        <p className="small muted">受注側からの依頼です。質問を返しても承認にはなりません。期限が近い順に並んでいます。</p>
      </div>
      {state === "読み込み中" ? <Skeleton rows={4} /> : state === "エラー" ? <ErrorState /> : (
        <>
          <div className="row between">
            <Tabs value={tab} onChange={setTab} tabs={[{ value: "open", label: "回答待ち", count: open.length }, { value: "closed", label: "完了", count: closed.length }]} />
            <div style={{ minWidth: 180 }}>
              <Select value={kind} onChange={setKind} options={[{ value: "all", label: "すべての種類" }, ...(Object.keys(REQUEST_KIND) as CustomerRequestKind[]).map((k) => ({ value: k, label: REQUEST_KIND[k] }))]} />
            </div>
          </div>
          {rows.length === 0 ? (
            <div className="card"><EmptyState icon="checkCircle" title={tab === "open" ? "回答待ちの申請はありません" : "完了した申請はありません"} description="新しい依頼が届くと、メールでお知らせします。" /></div>
          ) : (
            <div className="stack" style={{ ["--gap" as string]: "10px" }}>
              {rows.map((r) => (
                <button key={r.id} type="button" className="card cp-request" onClick={() => navigate(paths.portalRequest(slug, r.id))}>
                  <div className="row between">
                    <span className="row" style={{ ["--gap" as string]: "8px" }}><RequestKindTag kind={r.kind} /><span className="mono tiny muted">{r.id}</span><VersionPin version={r.version} latest={r.latest_version} /></span>
                    <StatusBadge vocab={REQUEST_STATUS[r.status]} size="sm" />
                  </div>
                  <span className="strong">{r.title}</span>
                  <div className="cp-request-meta">
                    <span><span className="tiny muted">決める人</span><span className="small">{r.decider}</span></span>
                    <span><span className="tiny muted">期限</span><span className="small">{formatDate(r.due)} {r.status === "pending" || r.status === "questioned" ? <DeadlineIndicator date={r.due} compact /> : null}</span></span>
                    {r.amount !== undefined ? <span><span className="tiny muted">金額（貴社のお支払い・税抜）</span><span className="small">{yen(r.amount)}</span></span> : null}
                  </div>
                  <span className="small"><span className="tiny muted">承認した場合: </span>{r.impact_if_approved}</span>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </CustomerPortalLayout>
  );
}
