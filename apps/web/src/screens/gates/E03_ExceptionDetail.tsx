// 画面ID: E-03 例外の詳細・承認
import { useState } from "react";
import { navigate, useScreenState } from "../../lib/router";
import { paths } from "../../lib/paths";
import { EXCEPTION_STATUS } from "../../lib/vocab";
import type { ExceptionStatus } from "../../lib/vocab";
import type { Approver, ExceptionRecord } from "../../lib/types";
import { formatDate } from "../../lib/format";
import { exceptionById, exceptions, gateRuns, userById } from "../../mocks/core";
import { exceptionTimeline } from "../../mocks/gates";
import {
  ApprovalPanel,
  Banner,
  Button,
  CommentThread,
  ConfirmDialog,
  DeadlineIndicator,
  DetailLayout,
  ExceptionSummary,
  GateResultPanel,
  IdLink,
  KeyValueList,
  MetaSection,
  MoreMenu,
  PageHeader,
  ProjectLayout,
  Section,
  StateFlow,
  Tabs,
  Timeline,
  UserChip,
  membersWithRole,
  useToast,
} from "../../ui";

const STATE_EX: Record<string, string> = {
  applying: "EXC-0008",
  active: "EXC-0007",
  expired: "EXC-0004",
  rejected: "EXC-0005",
};

function resolveEx(state: string, id: string): ExceptionRecord {
  if (state === "withdrawn") return { ...exceptionById("EXC-0008"), status: "withdrawn" };
  if (state === "requester") return { ...exceptionById("EXC-0008"), requester_id: "u-sato", approver_id: "u-tanaka" };
  const key = STATE_EX[state];
  return key ? exceptionById(key) : exceptions.find((e) => e.id === id) ?? exceptions[0];
}

export function ExceptionDetailScreen({ org, project, id }: { org: string; project: string; id: string }) {
  const state = useScreenState();
  const toast = useToast();
  const base = resolveEx(state, id);
  const [status, setStatus] = useState<ExceptionStatus>(base.status);
  const [tab, setTab] = useState("content");
  const [withdraw, setWithdraw] = useState(false);
  const ex = { ...base, status };
  const run = gateRuns.find((g) => g.exception_id === ex.id) ?? gateRuns.find((g) => g.reasons.some((r) => r.rule_id === ex.rule_id)) ?? gateRuns[0];
  const reason = run.reasons.find((r) => r.rule_id === ex.rule_id) ?? run.reasons[0];
  const isApprover = ex.approver_id === "u-sato";
  const isRequester = ex.requester_id === "u-sato";

  const approvers: Approver[] = [
    {
      role: "PM",
      user_id: ex.approver_id,
      status: status === "applying" ? "pending" : status === "rejected" ? "returned" : status === "withdrawn" ? "withdrawn" : "approved",
      decided_at: status === "applying" || status === "withdrawn" ? undefined : ex.requested_at,
      comment: status === "rejected" ? "lint 警告は修正可能な範囲のため、例外ではなく修正で対応してください。" : status === "active" || status === "expired" ? "期限内に結合テストを追加すること。" : undefined,
    },
  ];

  const flowLabel = EXCEPTION_STATUS[status].label;

  const main = (
    <>
      {status === "expired" ? (
        <Banner tone="warn" title="この例外は期限切れです">期限 {formatDate(ex.expires_at)} に自動で再審査され、失効しました。対象のゲートは再びブロックされます。継続が必要な場合は新しい申請を作成してください。</Banner>
      ) : null}
      {status === "active" ? <Banner tone="info" title="この例外は有効です">期限が来ると自動で再審査されます。それまでに原因を修正してください。</Banner> : null}
      <Tabs value={tab} onChange={setTab} tabs={[{ value: "content", label: "内容" }, { value: "history", label: "履歴", count: exceptionTimeline.length }, { value: "comments", label: "コメント", count: 1 }]} />
      {tab === "content" ? (
        <>
          <ExceptionSummary ex={ex} />
          <Section title="対象のゲート失敗" sub={<>実行 <IdLink id={run.id} to={paths.gate(org, project, run.id)} /> · {run.pr_title}</>}>
            <GateResultPanel letter={reason?.gate ?? ex.gate} status="block" reasons={reason ? [{ ...reason, exception_allowed: false }] : []} enforcement={run.enforcement} policyVersion={run.policy_version} />
          </Section>
          <Section title="申請内容">
            <KeyValueList
              items={[
                { label: "理由", value: ex.reason },
                { label: "リスクと影響", value: ex.risk },
                { label: "代替の対策", value: ex.mitigation ?? <span className="muted">なし</span> },
                { label: "期限", value: <DeadlineIndicator date={ex.expires_at} /> },
              ]}
            />
          </Section>
          <Section title="期限到来時の扱い">
            <ul className="stack small" style={{ margin: 0, paddingLeft: 18, ["--gap" as string]: "6px" }}>
              <li>期限日の終わりに、対象のルールを自動で再審査します。</li>
              <li>原因が修正されていれば例外は役目を終えます。修正されていなければ例外は失効し、ゲートは再びブロックします。</li>
              <li>延長は認めず、新しい申請として扱います（理由・リスク・承認者を改めて記録します）。</li>
            </ul>
          </Section>
        </>
      ) : tab === "history" ? (
        <Section title="履歴">
          <Timeline items={exceptionTimeline} />
        </Section>
      ) : (
        <Section title="コメント">
          <CommentThread comments={[{ id: "c1", user_id: "u-suzuki", body: "モックは PR #144 で作成中です。12/5 にはテストを追加できる見込みです。", at: "2026-11-27T09:55:00+09:00" }]} />
        </Section>
      )}
    </>
  );

  const side = (
    <>
      <MetaSection title="状態">
        <StateFlow flow="exception" current={flowLabel} />
      </MetaSection>
      <MetaSection title="承認">
        <ApprovalPanel
          approvers={approvers}
          canDecide={status === "applying" && isApprover && !isRequester}
          blockedReason={status === "applying" && isRequester ? "あなたはこの例外の申請者のため承認できません。" : status === "applying" && !isApprover ? "この例外の承認者に指定されていません。" : undefined}
          eligible={status === "applying" && isRequester ? membersWithRole("PM", "u-sato").concat(membersWithRole("設計者")) : undefined}
          onDecide={(d) => {
            setStatus(d === "approved" ? "active" : "rejected");
            toast({ kind: "success", message: d === "approved" ? `例外 ${ex.id} を承認しました` : `例外 ${ex.id} を却下しました` });
          }}
        />
      </MetaSection>
      <MetaSection title="属性">
        <KeyValueList
          stacked
          items={[
            { label: "申請者", value: <UserChip user={userById(ex.requester_id)} /> },
            { label: "承認者", value: <UserChip user={userById(ex.approver_id)} /> },
            { label: "申請日時", value: formatDate(ex.requested_at) },
            { label: "ルール", value: <span className="mono">{ex.rule_id}</span> },
          ]}
        />
      </MetaSection>
    </>
  );

  return (
    <ProjectLayout org={org} project={project} active="exceptions" trail={[{ label: "例外", to: paths.exceptions(org, project) }, { label: ex.id }]}>
      <PageHeader
        id={ex.id}
        title={`${ex.target} の例外`}
        status={EXCEPTION_STATUS[status]}
        description={`ゲート${ex.gate} · ${ex.rule_id}`}
        actions={
          <>
            {(status === "active" || status === "expired") ? <Button icon="refresh" onClick={() => navigate(`${paths.exceptionNew(org, project)}?run=${run.id}&rule=${ex.rule_id}`)}>延長を申請（新規）</Button> : null}
            {isRequester && status === "applying" ? <Button variant="secondary" icon="x" onClick={() => setWithdraw(true)}>取り下げ</Button> : null}
            <MoreMenu items={[{ label: "ゲート実行を開く", icon: "shield", onClick: () => navigate(paths.gate(org, project, run.id)) }, { label: "監査ログで見る", icon: "history", onClick: () => navigate(paths.auditLog(org, project)) }]} />
          </>
        }
      />
      <DetailLayout main={main} side={side} />
      <ConfirmDialog open={withdraw} onClose={() => setWithdraw(false)} title="例外の申請を取り下げますか" message="取り下げた申請は承認できなくなります。履歴には残ります。" confirmLabel="取り下げる" onConfirm={() => { setStatus("withdrawn"); toast({ kind: "success", message: "申請を取り下げました" }); }} />
    </ProjectLayout>
  );
}
