// 画面ID: E-03 例外の詳細・承認
import { useState } from "react";
import { navigate, useScreenState } from "../../lib/router";
import { paths } from "../../lib/paths";
import { DECISION_STATUS, EXCEPTION_STATUS, SEVERITY } from "../../lib/vocab";
import type { ExceptionStatus } from "../../lib/vocab";
import type { Approver, ExceptionRecord } from "../../lib/types";
import { formatDate } from "../../lib/format";
import { currentUser, exceptionById, exceptions, gateRuns, userById } from "../../mocks/core";
import { exceptionMeta, exceptionTimeline } from "../../mocks/gates";
import { decisions } from "../../mocks/portfolio";
import {
  ApprovalPanel,
  Banner,
  Button,
  CommentThread,
  ConfirmDialog,
  DeadlineIndicator,
  DetailLayout,
  ExceptionSummary,
  ExternalActor,
  ResponsibilitySplit,
  StatusBadge,
  Tag,
  TextArea,
  Timestamp,
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
  if (state === "requester") return { ...exceptionById("EXC-0008"), requester_id: "u-kimura", approver_id: "u-mori" };
  if (state === "approver") return { ...exceptionById("EXC-0008"), approver_id: "u-kimura" };
  if (state === "revoked" || state === "extended") return exceptionById("EXC-0007");
  if (state === "riskAcceptance") return exceptionById("EXC-0006");
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
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [revoked, setRevoked] = useState(state === "revoked");
  const [revokeReason, setRevokeReason] = useState("");
  const ex = { ...base, status };
  const run = gateRuns.find((g) => g.exception_id === ex.id) ?? gateRuns.find((g) => g.reasons.some((r) => r.rule_id === ex.rule_id)) ?? gateRuns[0];
  const reason = run.reasons.find((r) => r.rule_id === ex.rule_id) ?? run.reasons[0];
  const isApprover = ex.approver_id === currentUser.id;
  const isRequester = ex.requester_id === currentUser.id;
  const meta = exceptionMeta[ex.id] ?? { severity: "medium" as const, records: [] };
  const severe = meta.severity === "high" || meta.severity === "critical";
  const decision = decisions.find((d) => d.evidence.includes(ex.id)) ?? (severe ? decisions.find((d) => d.kind === "riskAcceptance") : undefined);
  const approverUser = userById(ex.approver_id);
  const records = state === "revoked" || revoked
    ? [...meta.records, { id: "rv", kind: "取消" as const, by: currentUser.id, at: "2026-11-27T10:30:00+09:00", note: revokeReason || "修正版の提供が早まったため。ゲートは再びブロックします" }]
    : meta.records;

  const approvers: Approver[] = [
    {
      role: approverUser?.roles[0] ?? "PM",
      user_id: ex.approver_id,
      status: status === "applying" ? "pending" : status === "rejected" ? "returned" : status === "withdrawn" ? "withdrawn" : "approved",
      decided_at: status === "applying" || status === "withdrawn" ? undefined : ex.requested_at,
      comment: status === "rejected" ? "lint 警告は修正可能な範囲のため、例外ではなく修正で対応してください。" : status === "active" || status === "expired" ? "期限内に結合テストを追加すること。" : undefined,
    },
  ];

  const flowLabel = EXCEPTION_STATUS[status].label;
  const headerStatus = revoked ? { label: "取消", tone: "fail" as const } : EXCEPTION_STATUS[status];

  const main = (
    <>
      {status === "expired" ? (
        <Banner tone="warn" title="この例外は期限切れです">期限 {formatDate(ex.expires_at)} に自動で再審査され、失効しました。対象のゲートは再びブロックされます。継続が必要な場合は新しい申請を作成してください。</Banner>
      ) : null}
      {revoked ? (
        <Banner tone="fail" title="この例外は取り消されました">取消は新しい記録として残ります。対象のゲートは次の判定から再びブロックします。</Banner>
      ) : status === "active" ? (
        <Banner tone="info" title="この例外は有効です">期限が来ると自動で再審査されます。それまでに原因を修正してください。</Banner>
      ) : null}
      {state === "extended" ? (
        <Banner tone="info" title="延長は新しい申請（EXC-0009）として審議中です">元の例外（{ex.id}）の期限は延長されません。EXC-0009 が承認されるまで、元の期限で再審査します。</Banner>
      ) : null}
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
              <li>取消は承認者または案件スポンサーが行い、理由を記録します。取消後は次の判定から再びブロックします。</li>
            </ul>
          </Section>
          <Section title="判断と対応の分担">
            <ResponsibilitySplit
              decide={
                <span className="stack" style={{ ["--gap" as string]: "4px" }}>
                  <span>独立承認者: <ExternalActor userId={ex.approver_id} /></span>
                  {severe ? <span className="small">リスク受容: 案件スポンサー（経営判断）</span> : null}
                </span>
              }
              act={<span>原因の修正: <ExternalActor userId={ex.requester_id} /></span>}
              note="承認者は申請者と別の人です。アカウントを持たない承認者は、期限付きの承認リンクで承認し、外部IDとともに記録されます。"
            />
          </Section>
          {severe || decision ? (
            <Section title="経営判断（リスク受容）" sub={`重大度: ${SEVERITY[meta.severity].label}。組織として受け入れるリスクは経営判断として記録します`}>
              {decision ? (
                <div className="row between">
                  <span className="stack" style={{ ["--gap" as string]: "4px" }}>
                    <span className="row" style={{ ["--gap" as string]: "8px" }}><IdLink id={decision.id} to={paths.decision(org, decision.id)} /><StatusBadge vocab={DECISION_STATUS[decision.status]} size="sm" /></span>
                    <span className="small">{decision.title}</span>
                    {decision.conditions ? <span className="small muted">条件: {decision.conditions}</span> : null}
                  </span>
                  <Button size="sm" iconRight="arrowRight" to={paths.decision(org, decision.id)}>判断を開く</Button>
                </div>
              ) : (
                <p className="small muted">まだ経営判断が依頼されていません。</p>
              )}
            </Section>
          ) : null}
          <Section title="承認と変更の記録" sub="申請・承認・延長・取消・再審査は、上書きせずにそれぞれ新しい記録として残します" flush>
            <div className="table-wrap">
              <table className="table compact">
                <thead><tr><th>記録</th><th>実施者</th><th>日時</th><th>内容</th></tr></thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r.id}>
                      <td><Tag square tone={r.kind === "取消" || r.kind === "再ブロック" || r.kind === "却下" ? "fail" : r.kind === "承認" ? "pass" : r.kind.startsWith("延長") ? "special" : "neutral"}>{r.kind}</Tag></td>
                      <td>{r.by === "system" ? <span className="small">システム</span> : <ExternalActor userId={r.by} />}</td>
                      <td><Timestamp at={r.at} mode="absolute" /></td>
                      <td className="small">{r.note ?? "—"}{r.ref ? <> · <span className="mono">{r.ref}</span></> : null}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
          blockedReason={status === "applying" && isRequester ? "あなたはこの例外の申請者のため承認できません。" : status === "applying" && !isApprover ? `承認は独立承認者（${approverUser?.name ?? "未指定"}）が行います。アカウントがない場合は期限付きの承認リンクで承認します。` : undefined}
          eligible={status === "applying" && isRequester ? membersWithRole("CTO").concat(membersWithRole("PM")) : undefined}
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
            { label: "重大度", value: <StatusBadge vocab={SEVERITY[meta.severity]} size="sm" /> },
            { label: "申請者", value: <ExternalActor userId={ex.requester_id} /> },
            { label: "独立承認者", value: <ExternalActor userId={ex.approver_id} /> },
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
        status={headerStatus}
        description={`ゲート${ex.gate} · ${ex.rule_id}`}
        actions={
          <>
            {(status === "active" || status === "expired") && !revoked ? <Button icon="refresh" onClick={() => navigate(`${paths.exceptionNew(org, project)}?run=${run.id}&rule=${ex.rule_id}`)}>延長を申請（新しい申請）</Button> : null}
            {status === "active" && !revoked ? <Button variant="secondary" icon="xCircle" onClick={() => setRevokeOpen(true)}>取り消す</Button> : null}
            {isRequester && status === "applying" ? <Button variant="secondary" icon="x" onClick={() => setWithdraw(true)}>取り下げ</Button> : null}
            <MoreMenu items={[{ label: "ゲート実行を開く", icon: "shield", onClick: () => navigate(paths.gate(org, project, run.id)) }, { label: "監査ログで見る", icon: "history", onClick: () => navigate(paths.auditLog(org, project)) }]} />
          </>
        }
      />
      <DetailLayout main={main} side={side} />
      <ConfirmDialog
        open={revokeOpen}
        onClose={() => setRevokeOpen(false)}
        title="例外を取り消しますか"
        danger
        message={
          <div className="stack">
            <span>取り消すと、次の判定から対象のゲートは再びブロックします。取消は新しい記録として残り、元に戻せません。</span>
            <TextArea label="理由" required rows={2} value={revokeReason} onChange={setRevokeReason} placeholder="例: 修正版の提供が早まったため" />
          </div>
        }
        confirmLabel="取り消す"
        onConfirm={() => { setRevoked(true); toast({ kind: "success", message: `例外 ${ex.id} を取り消しました` }); }}
      />
      <ConfirmDialog open={withdraw} onClose={() => setWithdraw(false)} title="例外の申請を取り下げますか" message="取り下げた申請は承認できなくなります。履歴には残ります。" confirmLabel="取り下げる" onConfirm={() => { setStatus("withdrawn"); toast({ kind: "success", message: "申請を取り下げました" }); }} />
    </ProjectLayout>
  );
}
