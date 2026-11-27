// 画面ID: J-06 リスク・是正の詳細
import { useState } from "react";
import {
  ActorLabel,
  Button,
  Combobox,
  CommentThread,
  DeadlineIndicator,
  DetailLayout,
  EmptyState,
  ErrorState,
  EvidenceItem,
  IdLink,
  KeyValueList,
  MetaSection,
  Modal,
  MoreMenu,
  PageHeader,
  ProjectLayout,
  Section,
  Select,
  Skeleton,
  StatusBadge,
  Tabs,
  Tag,
  TextArea,
  Timeline,
  Timestamp,
  UserChip,
  useToast,
} from "../../ui";
import { useScreenState } from "../../lib/router";
import { paths } from "../../lib/paths";
import { RISK_STATUS } from "../../lib/vocab";
import type { RiskStatus } from "../../lib/vocab";
import { evidence, risks, userById, users } from "../../mocks/core";
import { orgOf, projectOf } from "./shared";

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
  return undefined;
}

export function J06RiskDetail({ params }: { params: Record<string, string> }) {
  const state = useScreenState();
  const org = orgOf(params);
  const pr = projectOf(params);
  const toast = useToast();
  const base = risks.find((r) => r.id === params.id) ?? risks[0];
  const [status, setStatus] = useState<RiskStatus>(state === "完了済み" ? "done" : base.status);
  const [owner, setOwner] = useState<string[]>([base.owner_id]);
  const [tab, setTab] = useState("content");
  const [decide, setDecide] = useState(false);
  const d = DETAILS[base.id] ?? { content: base.title, cause: "（未記入）", impact: "（未記入）", plan: "（未記入）" };
  const ev = evidence.slice(0, 2);
  const isDone = state === "完了済み" || status === "done";

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
            <Button icon="pen" onClick={() => setDecide(true)}>判断を記録</Button>
            <Button variant="primary" icon="check" disabled={isDone} disabledReason="すでに完了しています" onClick={() => { setStatus("done"); toast({ kind: "success", message: `${base.id} を完了にしました`, undo: () => setStatus(base.status) }); }}>完了にする</Button>
            <MoreMenu items={[{ label: "編集", icon: "edit" }, { label: "変更要求を起票", icon: "compare" }]} />
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
              <Tabs value={tab} onChange={setTab} tabs={[{ value: "content", label: "内容" }, { value: "related", label: "関連", count: base.related.length }, { value: "history", label: "履歴" }, { value: "comments", label: "コメント", count: 2 }]} />
              {tab === "content" ? (
                <>
                  <Section title="内容">
                    <KeyValueList items={[{ label: "内容", value: d.content }, { label: "原因", value: d.cause }, { label: "影響", value: d.impact }, { label: "対応策", value: d.plan }]} />
                  </Section>
                  <Section title="判断" sub="誰がいつ何を決めたかを記録します" actions={<Button size="sm" icon="plus" onClick={() => setDecide(true)}>判断を記録</Button>}>
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
                <Section title="関連する項目">
                  {base.related.length ? (
                    <div className="stack" style={{ ["--gap" as string]: "8px" }}>
                      {base.related.map((id) => <div key={id} className="row"><IdLink id={id} to={relLink(org, pr, id)} /></div>)}
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
                <Select label="状態" value={isDone ? "done" : status} onChange={(v) => { setStatus(v as RiskStatus); toast({ kind: "success", message: `状態を「${RISK_STATUS[v as RiskStatus].label}」に変更しました` }); }} options={Object.entries(RISK_STATUS).map(([value, v]) => ({ value, label: v.label }))} />
                <Combobox label="担当者" value={owner} onChange={(v) => { setOwner(v); toast({ kind: "success", message: "担当者を変更しました" }); }} options={users.filter((u) => u.kind === "member" && u.status === "active").map((u) => ({ value: u.id, label: u.name, hint: u.roles[0] }))} />
                <div className="stack" style={{ ["--gap" as string]: "4px" }}>
                  <span className="label">期限</span>
                  {isDone ? <span className="small muted">{base.due_at}（完了済み）</span> : <DeadlineIndicator date={base.due_at} />}
                </div>
              </MetaSection>
              <MetaSection title="属性">
                <KeyValueList
                  stacked
                  items={[
                    { label: "作成者", value: <UserChip user={userById("u-sato")} /> },
                    { label: "作成日時", value: "2026-11-10 10:00 JST" },
                    { label: "更新者", value: <UserChip user={userById(owner[0])} /> },
                    { label: "更新日時", value: "2026-11-21 17:10 JST" },
                    { label: "状態", value: <StatusBadge vocab={RISK_STATUS[isDone ? "done" : status]} size="sm" /> },
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
      <Modal
        open={decide}
        onClose={() => setDecide(false)}
        title="判断を記録"
        description="判断は監査ログと証跡に残ります。"
        footer={<><Button variant="ghost" onClick={() => setDecide(false)}>キャンセル</Button><Button variant="primary" onClick={() => { setDecide(false); toast({ kind: "success", message: "判断を記録しました" }); }}>記録する</Button></>}
      >
        <div className="stack">
          <TextArea label="判断の内容" required rows={4} placeholder="例: 対応期限を 12/5 に前倒しする" />
          <Select label="判断に伴う状態" defaultValue={status} options={Object.entries(RISK_STATUS).map(([value, v]) => ({ value, label: v.label }))} />
        </div>
      </Modal>
    </ProjectLayout>
  );
}
