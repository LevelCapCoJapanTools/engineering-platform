// 画面ID: J-08 変更要求の詳細
// 影響（要求・設計・テスト・費用・スケジュール）を確認する。AI の影響候補は参考で、確定はアナリスト・設計者が正本で行う。
// 承認は実務の承認者（PM・顧客）が行い、費用や納期の判断が必要なものは経営判断（M-02）へ回る。
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
  ExternalActor,
  IdLink,
  KeyValueList,
  MetaSection,
  PageHeader,
  ProjectLayout,
  ResponsibilitySplit,
  Section,
  Skeleton,
  StatCard,
  StateFlow,
  StatusBadge,
  Tabs,
  Tag,
  Timeline,
  TraceGraph,
  TraceLegend,
  useToast,
} from "../../ui";
import type { TraceEdge, TraceNode } from "../../ui";
import { Link, useScreenState } from "../../lib/router";
import { paths } from "../../lib/paths";
import { CHANGE_STATUS } from "../../lib/vocab";
import type { ChangeStatus } from "../../lib/vocab";
import type { AiFinding, Approver } from "../../lib/types";
import { aiFindings, changes, userById } from "../../mocks/core";
import { PLAN_SOURCE, changeDetails, changeImpacts } from "../../mocks/planning";
import { DecisionLink, SourceBar, orgOf, projectOf } from "./shared";
import { changeAgreements } from "../../mocks/desk";
import { yen } from "../../lib/format";

export const J08_STATES = ["影響分析中", "承認待ち", "承認済み", "反映済み", "却下", "AI分析中", "AI無効", "読み込み中", "取得失敗"];

const STATE_TO_STATUS: Record<string, ChangeStatus> = { 影響分析中: "analyzing", 承認待ち: "pending", 承認済み: "approved", 反映済み: "applied", 却下: "rejected" };

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
  void toast;

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

  const impact = changeImpacts[cr.id] ?? changeImpacts["CR-0004"];
  const agreement = changeAgreements.find((a) => a.id === cr.id);
  const primary = impact.decision ? <Button variant="primary" icon="inbox" to={paths.decision(org, impact.decision)}>経営判断を開く</Button> : null;

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
            {primary}
            <Button icon="external">正本で開く</Button>
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
              {status === "applied" ? <Banner tone="pass" title="この変更は反映済みです">{impact.result ?? "REQ-0012 v2 に反映されました。"}</Banner> : null}
              <SourceBar source={PLAN_SOURCE} note="起票・承認は顧客ポータルと課題・計画管理から同期" />
              <Section title="影響の内訳" sub="アナリスト・設計者・PM が確定した値">
                <div className="grid auto-fit">
                  <StatCard label="要求" value={impact.requirements} unit="件" />
                  <StatCard label="設計" value={impact.designs} unit="件" />
                  <StatCard label="テスト" value={impact.tests} unit="件" />
                  <StatCard label="費用" value={impact.cost_yen === 0 ? "なし" : `${impact.cost_yen > 0 ? "+" : ""}${(impact.cost_yen / 10000).toLocaleString("ja-JP")}`} unit={impact.cost_yen === 0 ? undefined : "万円"} tone={impact.cost_yen >= 1_000_000 ? "warn" : undefined} />
                  <StatCard label="スケジュール" value={impact.schedule_days === 0 ? "影響なし" : `+${impact.schedule_days}`} unit={impact.schedule_days === 0 ? undefined : "日"} tone={impact.schedule_days > 0 ? "warn" : undefined} />
                </div>
              </Section>
              <Section title="責任の分担">
                <ResponsibilitySplit
                  decide={impact.decision ? <DecisionLink org={org} id={impact.decision} /> : <span className="small">経営判断は不要（費用・納期の影響がしきい値未満）</span>}
                  act={<span className="row" style={{ ["--gap" as string]: "8px" }}>{d.approvers.map((a) => <ExternalActor key={a.role} userId={a.user_id} role={a.role} />)}</span>}
                  note="変更の承認は PM と顧客が行います。経営層は追加費用の受け入れなど投資の判断を行います"
                />
              </Section>
              <Section
                title="顧客との条件と委託条件"
                sub="顧客との契約と、受託者（フリーエンジニア）への委託条件は別々に合意します。顧客だけが同意しても委託範囲は増えません"
                actions={agreement ? <Button size="sm" icon="message" to={paths.deskChange(org, agreement.id)}>窓口で再合意を進める</Button> : undefined}
              >
                {agreement ? (
                  <div className="table-wrap">
                    <table className="table compact">
                      <thead><tr><th>契約</th><th>金額</th><th>期限への影響</th><th>状態</th></tr></thead>
                      <tbody>
                        <tr><td className="small">顧客との条件（{agreement.customer.contract_ref}）</td><td className="small">{yen(agreement.customer.price)}</td><td className="small">{agreement.customer.due_impact}</td><td><Tag square tone={agreement.customer.status === "agreed" ? "pass" : "warn"}>{agreement.customer.status === "agreed" ? "合意済み" : "回答待ち"}</Tag></td></tr>
                        <tr><td className="small">委託条件（{agreement.commission.contract_ref}）</td><td className="small">{yen(agreement.commission.extra_fee)}（社内のみ）</td><td className="small">{agreement.commission.due_impact}</td><td><Tag square tone={agreement.commission.status === "agreed" ? "pass" : "warn"}>{agreement.commission.status === "agreed" ? "合意済み" : "回答待ち"}</Tag></td></tr>
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="stack" style={{ ["--gap" as string]: "6px" }}>
                    <span className="small">この変更は、受託者への発注の範囲・報酬・期限に影響しません。委託条件の再合意は不要です。</span>
                    <span className="tiny muted">受託者への発注に影響する変更は、案件窓口が両方の条件を回収します（例: <Link to={paths.deskChange(org, changeAgreements[0].id)}>{changeAgreements[0].id} {changeAgreements[0].title}</Link>）。</span>
                  </div>
                )}
              </Section>
              <Tabs value={tab} onChange={setTab} tabs={[{ value: "content", label: "内容" }, { value: "impact", label: "影響分析", count: d.confirmed.length + findings.length }, { value: "history", label: "履歴" }, { value: "comments", label: "コメント", count: 1 }]} />
              {tab === "content" ? (
                <Section title="変更の内容">
                  <KeyValueList
                    items={[
                      { label: "変更内容", value: d.description },
                      { label: "理由", value: d.reason },
                      { label: "起票者", value: <ExternalActor userId={cr.filed_by} /> },
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
                              <td><ExternalActor userId="u-takahashi" /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Section>
                  <Section title="AIの影響候補" sub="参考情報です。確定はアナリスト・設計者が正本で行います（ここでは参照のみ）">
                    {state === "AI分析中" ? (
                      <div className="row"><span className="spinner" /><span className="muted">影響を分析しています…</span></div>
                    ) : state === "AI無効" ? (
                      <AIUnavailableNotice reason="orgDisabled" />
                    ) : (
                      <div className="stack" style={{ ["--gap" as string]: "10px" }}>
                        <AISectionHead count={findings.length} note="AI の候補だけの項目は「確定」に含めません" />
                        {findings.map((f) => <AIFindingCard key={f.id} finding={f} />)}
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
                    { label: "起票者", value: <ExternalActor userId={cr.filed_by} /> },
                    { label: "起票日時", value: "2026-11-26 15:20 JST" },
                    { label: "影響範囲", value: `確定 ${d.confirmed.length}件 · AI候補 ${findings.length}件` },
                  ]}
                />
              </MetaSection>
              <MetaSection title="実務の承認（参照のみ）">
                {status === "analyzing" ? <span className="small muted">影響分析の完了後に、PM が承認を依頼します。</span> : null}
                <ApprovalPanel approvers={approvers} canDecide={false} blockedReason="承認は PM と顧客が行います。顧客には期限付きの承認リンクで依頼されます" />
              </MetaSection>
              {impact.result ? (
                <MetaSection title="反映結果">
                  <span className="small">{impact.result}</span>
                </MetaSection>
              ) : null}
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
