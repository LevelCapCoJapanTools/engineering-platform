// 画面ID: J-06 リスク・是正の詳細
// 内容・対策・状態は正本（課題・計画管理）で更新される。経営層は残余リスク、判断根拠、完了確認、関連項目を確認し、リスク受容などの経営判断へ進む。
import { useState } from "react";
import {
  ActorLabel,
  Button,
  CommentThread,
  DeadlineIndicator,
  DetailLayout,
  EmptyState,
  ErrorState,
  EvidenceItem,
  ExternalActor,
  IdLink,
  KeyValueList,
  MetaSection,
  PageHeader,
  ProjectLayout,
  ResponsibilitySplit,
  Section,
  Skeleton,
  SourceTag,
  StatusBadge,
  Tabs,
  Tag,
  Timeline,
  Timestamp,
  useToast,
} from "../../ui";
import { useScreenState } from "../../lib/router";
import { paths } from "../../lib/paths";
import { RISK_STATUS } from "../../lib/vocab";
import type { RiskStatus } from "../../lib/vocab";
import { evidence, risks } from "../../mocks/core";
import { PLAN_SOURCE, riskExtras } from "../../mocks/planning";
import { DecisionLink, SourceBar, orgOf, projectOf } from "./shared";

export const J06_STATES = ["既定", "完了済み", "読み込み中", "取得失敗"];

const DETAILS: Record<string, { content: string; cause: string; impact: string; plan: string }> = {
  "RSK-011": {
    content: "基幹システム側の受信ファイル仕様が確定しておらず、連携バッチの実装とテストを完了できない。",
    cause: "顧客側の基幹システム更改プロジェクトと時期が重なり、仕様の決定者が不在。",
    impact: "REQ-0003 の結合テストが遅れ、v1.4.0 の納入（2026-12-10）に影響する可能性がある。",
    plan: "12/5 までに仕様を確定するよう顧客に依頼。確定までは現行仕様で実装し、差分は変更要求で扱う。",
  },
};

function relLink(org: string, pr: string, id: string) {
  if (id.startsWith("REQ")) return paths.requirement(org, pr, id);
  if (id.startsWith("ADR") || id.startsWith("DSN")) return paths.design(org, pr, id);
  if (id.startsWith("EXC")) return paths.exception(org, pr, id);
  if (id.startsWith("MAN")) return paths.manifest(org, pr, id);
  if (id.startsWith("CR")) return paths.change(org, pr, id);
  if (id.startsWith("run-")) return paths.gate(org, pr, id);
  if (id.startsWith("rel-")) return paths.release(org, pr, id);
  if (id.startsWith("DEC")) return paths.decision(org, id);
  return undefined;
}

export function J06RiskDetail({ params }: { params: Record<string, string> }) {
  const state = useScreenState();
  const org = orgOf(params);
  const pr = projectOf(params);
  const toast = useToast();
  const base = risks.find((r) => r.id === params.id) ?? risks[0];
  const status: RiskStatus = state === "完了済み" ? "done" : base.status;
  const [tab, setTab] = useState("content");
  const extra = riskExtras[base.id] ?? { residual: "未評価", basis: "（未記入）", source: PLAN_SOURCE };
  const completion = state === "完了済み" ? extra.completion ?? { by: base.owner_id, at: "2026-11-27T09:00:00+09:00", note: "対策の実施と効果を確認" } : extra.completion;
  const d = DETAILS[base.id] ?? { content: base.title, cause: "（未記入）", impact: "（未記入）", plan: "（未記入）" };
  const ev = evidence.slice(0, 2);
  const related = [...base.related, ...(extra.gates ?? []), ...(extra.releases ?? []), ...(extra.decision ? [extra.decision] : [])];
  const isDone = status === "done";

  return (
    <ProjectLayout org={org} project={pr} active="risks" trail={[{ label: "リスク・是正", to: paths.risks(org, pr) }, { label: base.id }]}>
      <PageHeader
        id={base.id}
        title={base.title}
        status={RISK_STATUS[isDone ? "done" : status]}
        meta={
          <>
            <Tag square tone={base.kind === "risk" ? "warn" : "info"}>{base.kind === "risk" ? "リスク" : "是正処置"}</Tag>
            <Tag square>影響度 {base.impact} × 発生可能性 {base.likelihood} = {base.impact * base.likelihood}</Tag>
          </>
        }
        actions={
          <>
            {extra.decision ? (
              <Button variant="primary" icon="inbox" to={paths.decision(org, extra.decision)}>経営判断を開く</Button>
            ) : (
              <Button icon="inbox" disabled={isDone} disabledReason="完了したリスクは判断を依頼できません" onClick={() => toast({ kind: "success", message: "リスク受容の判断を経営判断に追加しました" })}>リスク受容の判断を依頼</Button>
            )}
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
              <Tabs value={tab} onChange={setTab} tabs={[{ value: "content", label: "内容" }, { value: "related", label: "関連", count: related.length }, { value: "history", label: "履歴" }, { value: "comments", label: "コメント", count: 2 }]} />
              {tab === "content" ? (
                <>
                  <SourceBar source={extra.source} note="内容と状態は課題・計画管理で更新されます" />
                  <Section title="内容">
                    <KeyValueList items={[{ label: "内容", value: d.content }, { label: "原因", value: d.cause }, { label: "影響", value: d.impact }, { label: "対応策", value: d.plan }, { label: "残余リスク", value: extra.residual }, { label: "判断根拠", value: extra.basis }]} />
                  </Section>
                  <Section title="責任の分担">
                    <ResponsibilitySplit
                      decide={extra.decision ? <DecisionLink org={org} id={extra.decision} /> : <span className="small">重大な場合は経営層がリスク受容を判断</span>}
                      act={<ExternalActor userId={base.owner_id} role="対応責任者" />}
                      note="経営判断は判断者・理由・条件・期限とともに監査記録に残ります"
                    />
                  </Section>
                  <Section title="完了確認" sub="対策の実施と効果を誰が確認したか">
                    {completion ? (
                      <div className="pl-decision">
                        <div className="row between"><ExternalActor userId={completion.by} /><span className="tiny muted"><Timestamp at={completion.at} mode="absolute" /></span></div>
                        <span>{completion.note}</span>
                      </div>
                    ) : (
                      <span className="small muted">未確認です。対策の完了後、対応責任者以外が確認すると記録されます。</span>
                    )}
                  </Section>
                  <Section title="現場での判断の記録" sub="正本で記録された判断（誰がいつ何を決めたか）">
                    <div className="stack" style={{ ["--gap" as string]: "10px" }}>
                      <div className="pl-decision">
                        <div className="row between">
                          <ActorLabel kind="human" name="佐藤 美咲（PM）" size="sm" />
                          <span className="tiny muted"><Timestamp at="2026-11-21T17:10:00+09:00" mode="absolute" /></span>
                        </div>
                        <span>仕様確定の期限を 12/5 とし、確定までは現行仕様で実装を進める。</span>
                      </div>
                      <div className="pl-decision">
                        <div className="row between">
                          <ActorLabel kind="human" name="中村 拓也（顧客）" size="sm" />
                          <span className="tiny muted"><Timestamp at="2026-11-20T15:00:00+09:00" mode="absolute" /></span>
                        </div>
                        <span>基幹側の担当者を 11/25 までに指名する。</span>
                      </div>
                    </div>
                  </Section>
                  <Section title="証跡">
                    <div className="stack" style={{ ["--gap" as string]: "8px" }}>{ev.map((e) => <EvidenceItem key={e.id} ev={e} />)}</div>
                  </Section>
                </>
              ) : tab === "related" ? (
                <Section title="関連する項目" sub="要求・変更・ゲート・リリース・経営判断">
                  {related.length ? (
                    <div className="stack" style={{ ["--gap" as string]: "8px" }}>
                      {related.map((id) => <div key={id} className="row"><IdLink id={id} to={relLink(org, pr, id)} /></div>)}
                    </div>
                  ) : (
                    <EmptyState title="関連する項目はありません" />
                  )}
                </Section>
              ) : tab === "history" ? (
                <Section title="履歴">
                  <Timeline
                    items={[
                      { id: "1", actor: { kind: "human", name: "佐藤 美咲" }, action: "判断を記録", at: "2026-11-21T17:10:00+09:00" },
                      { id: "2", actor: { kind: "human", name: "佐藤 美咲" }, action: "状態を「対応中」に変更", at: "2026-11-15T10:00:00+09:00" },
                      { id: "3", actor: { kind: "ai", name: "遅延の予兆" }, action: "関連する遅延の予兆を記録", target: "AIF-301", at: "2026-11-14T08:00:00+09:00" },
                      { id: "4", actor: { kind: "human", name: "佐藤 美咲" }, action: "登録", at: "2026-11-10T10:00:00+09:00" },
                    ]}
                  />
                </Section>
              ) : (
                <Section title="コメント">
                  <CommentThread comments={[{ id: "c1", user_id: "u-tanaka", body: "仕様の差分が出た場合はファイルのヘッダー行で吸収できる設計にしています。", at: "2026-11-21T18:00:00+09:00" }, { id: "c2", user_id: "u-nakamura", body: "基幹側の担当を指名しました。来週から打合せに参加します。", at: "2026-11-25T09:30:00+09:00" }]} />
                </Section>
              )}
            </>
          }
          side={
            <>
              <MetaSection title="状態と担当">
                <KeyValueList
                  stacked
                  items={[
                    { label: "状態", value: <StatusBadge vocab={RISK_STATUS[status]} size="sm" /> },
                    { label: "対応責任者", value: <ExternalActor userId={base.owner_id} /> },
                    { label: "期限", value: isDone ? <span className="small muted">{base.due_at}（完了済み）</span> : <DeadlineIndicator date={base.due_at} /> },
                    { label: "残余リスク", value: extra.residual },
                  ]}
                />
              </MetaSection>
              <MetaSection title="属性">
                <KeyValueList
                  stacked
                  items={[
                    { label: "作成者", value: <ExternalActor userId="u-sato" /> },
                    { label: "作成日時", value: "2026-11-10 10:00 JST" },
                    { label: "最終更新（正本）", value: "2026-11-21 17:10 JST" },
                    { label: "出典", value: <SourceTag source={extra.source} compact /> },
                  ]}
                />
              </MetaSection>
              <MetaSection title="関連する統制項目">
                <IdLink id="CTL-PM-005" to={paths.control(org, pr, "CTL-PM-005")} title="リスクと是正処置が追跡され、完了まで管理されている" />
              </MetaSection>
            </>
          }
        />
      )}
    </ProjectLayout>
  );
}
