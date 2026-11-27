// 画面ID: J-08 変更要求の詳細
import { useState } from "react";
import {
  AIFindingCard,
  AISectionHead,
  AIUnavailableNotice,
  ApprovalPanel,
  Banner,
  Button,
  CommentThread,
  DetailLayout,
  ErrorState,
  IdLink,
  KeyValueList,
  MetaSection,
  MoreMenu,
  PageHeader,
  ProjectLayout,
  Section,
  Skeleton,
  StateFlow,
  StatusBadge,
  Tabs,
  Tag,
  Timeline,
  TraceGraph,
  TraceLegend,
  UserChip,
  membersWithRole,
  useToast,
} from "../../ui";
import type { TraceEdge, TraceNode } from "../../ui";
import { useScreenState } from "../../lib/router";
import { paths } from "../../lib/paths";
import { CHANGE_STATUS } from "../../lib/vocab";
import type { ChangeStatus } from "../../lib/vocab";
import type { AiFinding, Approver } from "../../lib/types";
import { aiFindings, changes, userById } from "../../mocks/core";
import { changeDetails } from "../../mocks/planning";
import { orgOf, projectOf } from "./shared";

export const J08_STATES = ["影響分析中", "承認待ち", "承認待ち（顧客として表示）", "承認済み", "反映済み", "却下", "AI分析中", "AI無効", "読み込み中", "取得失敗"];

const STATE_TO_STATUS: Record<string, ChangeStatus> = { 影響分析中: "analyzing", 承認待ち: "pending", "承認待ち（顧客として表示）": "pending", 承認済み: "approved", 反映済み: "applied", 却下: "rejected" };

const extraFindings: AiFinding[] = [
  { ...aiFindings.find((f) => f.id === "AIF-160")!, id: "AIF-161", target_id: "TC-0110", excerpt: "TC-0110 50万円以上で2段階承認になる", highlight: "50万円以上", explanation: "上限判定を税込に変えると、2段階承認の閾値判定（税抜）との整合を確認する必要があります。", suggestion: "TC-0110 に税込・税抜の境界値ケースを追加する。", confidence: 0.69 },
  { ...aiFindings.find((f) => f.id === "AIF-160")!, id: "AIF-162", target_id: "DSN-0005", excerpt: "DSN-0005 承認ワークフローの詳細設計", highlight: "承認ワークフロー", explanation: "承認ワークフローの金額判定が同じ計算モジュールを使っている可能性があります。", confidence: 0.48, severity: "low" },
];

export function J08ChangeDetail({ params }: { params: Record<string, string> }) {
  const state = useScreenState();
  const org = orgOf(params);
  const pr = projectOf(params);
  const toast = useToast();
  const cr = changes.find((c) => c.id === params.id) ?? changes[0];
  const d = changeDetails[cr.id] ?? changeDetails["CR-0004"];
  const status: ChangeStatus = STATE_TO_STATUS[state] ?? "analyzing";
  const [tab, setTab] = useState(state === "影響分析中" || state === "AI分析中" || state === "AI無効" ? "impact" : "content");
  const findings = [aiFindings.find((f) => f.id === "AIF-160")!, ...extraFindings];
  const filer = userById(cr.filed_by);

  const approvers: Approver[] =
    status === "approved" || status === "applied"
      ? d.approvers.map((a) => ({ ...a, status: "approved", decided_at: "2026-11-27T10:00:00+09:00" }))
      : status === "rejected"
        ? [{ ...d.approvers[0], status: "returned", decided_at: "2026-11-27T10:00:00+09:00", comment: "今回のリリースでは対応しない" }, d.approvers[1]]
        : status === "analyzing"
          ? d.approvers.map((a) => ({ ...a, status: "draft" }))
          : d.approvers;

  const nodes: TraceNode[] = [
    { id: "CR-0004", col: 0, title: "税込判定に変更" },
    { id: "REQ-0012", col: 0, title: "上限額の設定" },
    { id: "DSN-0005", col: 1, title: "承認WFの詳細設計" },
    { id: "設計なし", col: 1, title: "REQ-0012 の設計", missing: true },
    { id: "PR #131", col: 2, title: "承認フロー" },
    { id: "TC-0110", col: 3, title: "2段階承認" },
  ];
  const edges: TraceEdge[] = [
    { from: "CR-0004", to: "DSN-0005", ai: true },
    { from: "REQ-0012", to: "設計なし" },
    { from: "DSN-0005", to: "PR #131" },
    { from: "PR #131", to: "TC-0110" },
    { from: "CR-0004", to: "設計なし" },
  ];

  const primary =
    status === "analyzing" ? (
      <Button variant="primary" icon="mail" onClick={() => toast({ kind: "success", message: "PM と顧客に承認を依頼しました" })}>承認を依頼</Button>
    ) : status === "approved" ? (
      <Button variant="primary" icon="check" onClick={() => toast({ kind: "success", message: "反映済みにしました" })}>反映済みにする</Button>
    ) : null;

  return (
    <ProjectLayout org={org} project={pr} active="changes" trail={[{ label: "変更要求", to: paths.changes(org, pr) }, { label: cr.id }]}>
      <PageHeader
        id={cr.id}
        title={cr.title}
        status={CHANGE_STATUS[status]}
        meta={
          <>
            <Tag square tone={cr.filed_by_kind === "customer" ? "warn" : "neutral"}>{cr.filed_by_kind === "customer" ? "顧客からの起票" : "社内からの起票"}</Tag>
            <StateFlow flow="change" current={CHANGE_STATUS[status].label} />
          </>
        }
        actions={
          <>
            <Button icon="sparkles" onClick={() => { setTab("impact"); toast({ kind: "info", message: "AIによる影響分析を開始しました（参考情報）" }); }}>AIで影響を分析</Button>
            {primary}
            <MoreMenu items={[{ label: "要求を更新", icon: "edit", onClick: () => { window.location.hash = paths.requirement(org, pr, "REQ-0012"); } }, { label: "取り下げ", icon: "x", danger: true }]} />
          </>
        }
      />
      {state === "読み込み中" ? (
        <Skeleton variant="detail" />
      ) : state === "取得失敗" ? (
        <ErrorState />
      ) : (
        <DetailLayout
          main={
            <>
              {status === "applied" ? <Banner tone="pass" title="この変更は反映済みです">REQ-0012 v2 に反映されました。</Banner> : null}
              <Tabs value={tab} onChange={setTab} tabs={[{ value: "content", label: "内容" }, { value: "impact", label: "影響分析", count: d.confirmed.length + findings.length }, { value: "history", label: "履歴" }, { value: "comments", label: "コメント", count: 1 }]} />
              {tab === "content" ? (
                <Section title="変更の内容">
                  <KeyValueList
                    items={[
                      { label: "変更内容", value: d.description },
                      { label: "理由", value: d.reason },
                      { label: "起票者", value: <UserChip user={filer} /> },
                      { label: "希望時期", value: d.desired },
                      { label: "見積りへの影響", value: d.estimate },
                      { label: "スケジュールへの影響", value: d.schedule },
                    ]}
                  />
                </Section>
              ) : tab === "impact" ? (
                <>
                  <Section title="影響範囲（確定）" sub="アナリスト・設計者が確定した影響" flush>
                    <div className="table-wrap">
                      <table className="table">
                        <thead><tr><th>ID</th><th>種類</th><th>タイトル</th><th>確定者</th></tr></thead>
                        <tbody>
                          {d.confirmed.map((c) => (
                            <tr key={c.id}>
                              <td><IdLink id={c.id} to={paths.requirement(org, pr, c.id)} /></td>
                              <td><Tag square>{c.kind}</Tag></td>
                              <td>{c.title}</td>
                              <td><UserChip user={userById("u-takahashi")} plain /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Section>
                  <Section title="AIの影響候補" sub="「影響ありとして確定」または「影響なし」で判断してください">
                    {state === "AI分析中" ? (
                      <div className="row"><span className="spinner" /><span className="muted">影響を分析しています…</span></div>
                    ) : state === "AI無効" ? (
                      <AIUnavailableNotice reason="orgDisabled" />
                    ) : (
                      <div className="stack" style={{ ["--gap" as string]: "10px" }}>
                        <AISectionHead count={findings.length} note="採用すると確定した影響に追加されます" />
                        {findings.map((f) => (
                          <AIFindingCard key={f.id} finding={f} onDecide={(_, dec) => toast({ kind: "success", message: dec === "adopted" ? `${f.target_id} を影響ありとして確定しました` : `${f.target_id} は影響なしとしました` })} />
                        ))}
                      </div>
                    )}
                  </Section>
                  <Section title="影響範囲のグラフ" actions={<TraceLegend />}>
                    <TraceGraph nodes={nodes} edges={edges} selected="CR-0004" />
                  </Section>
                </>
              ) : tab === "history" ? (
                <Section title="履歴">
                  <Timeline
                    items={[
                      { id: "1", actor: { kind: "ai", name: "影響分析" }, action: "影響候補を3件記録", at: "2026-11-26T12:00:00+09:00" },
                      { id: "2", actor: { kind: "human", name: "高橋 健" }, action: "REQ-0012 を影響ありとして確定", at: "2026-11-26T16:30:00+09:00" },
                      { id: "3", actor: { kind: "human", name: filer?.name ?? "" }, action: "変更要求を起票", at: cr.filed_at },
                    ]}
                  />
                </Section>
              ) : (
                <Section title="コメント">
                  <CommentThread comments={[{ id: "c1", user_id: "u-nakamura", body: "経理規程の改定は 12/1 施行です。可能であれば v1.4.0 に含めてください。", at: "2026-11-26T15:25:00+09:00" }]} />
                </Section>
              )}
            </>
          }
          side={
            <>
              <MetaSection title="状態">
                <KeyValueList
                  stacked
                  items={[
                    { label: "状態", value: <StatusBadge vocab={CHANGE_STATUS[status]} size="sm" /> },
                    { label: "起票者", value: <UserChip user={filer} /> },
                    { label: "起票日時", value: "2026-11-26 15:20 JST" },
                    { label: "影響範囲", value: `確定 ${d.confirmed.length}件 · AI候補 ${findings.length}件` },
                  ]}
                />
              </MetaSection>
              <MetaSection title="承認">
                {status === "analyzing" ? (
                  <span className="small muted">影響分析の完了後に承認を依頼できます。</span>
                ) : null}
                <ApprovalPanel
                  approvers={approvers}
                  canDecide={state === "承認待ち（顧客として表示）"}
                  blockedReason={state === "承認待ち" ? "あなた（PM）の承認は顧客の承認後に行います" : undefined}
                  eligible={state === "承認待ち" ? membersWithRole("顧客") : undefined}
                  onDecide={(dec) => toast({ kind: dec === "approved" ? "success" : "info", message: dec === "approved" ? "変更要求を承認しました" : "変更要求を却下しました" })}
                />
              </MetaSection>
              <MetaSection title="関連">
                <IdLink id="REQ-0012" to={paths.requirement(org, pr, "REQ-0012")} title="発注金額の上限を取引先ごとに設定できる" />
                <IdLink id="CTL-PM-004" to={paths.control(org, pr, "CTL-PM-004")} title="変更要求が記録され、影響を評価したうえで承認されている" />
              </MetaSection>
            </>
          }
        />
      )}
    </ProjectLayout>
  );
}
