// 画面ID: E-02 例外の申請
import { useState } from "react";
import { navigate, useRoute, useScreenState } from "../../lib/router";
import { paths } from "../../lib/paths";
import { GATE_LABELS } from "../../lib/types";
import { currentUser, gateRuns, userById, users } from "../../mocks/core";
import { SEVERITY } from "../../lib/vocab";
import {
  Banner,
  Button,
  Combobox,
  DatePicker,
  EnforcementBadge,
  GateResultPanel,
  PageHeader,
  ProjectLayout,
  Section,
  Select,
  SoDNotice,
  TextArea,
  useToast,
} from "../../ui";

const MAX_DAYS = 14;

export function ExceptionNewScreen({ org, project }: { org: string; project: string }) {
  const state = useScreenState();
  const { query } = useRoute();
  const toast = useToast();
  const hard = state === "hard";
  const baseRun = gateRuns.find((g) => g.id === (query.get("run") ?? "run-5821")) ?? gateRuns[0];
  const run = hard ? { ...baseRun, enforcement: "hard" as const } : baseRun;
  const ruleId = query.get("rule") ?? "TRC-002";
  const reason = run.reasons.find((r) => r.rule_id === ruleId) ?? run.reasons[0];

  const [form, setForm] = useState(
    state === "error"
      ? { reason: "", risk: "", mitigation: "", due: "2026-12-31", approver: [] as string[], requester: "", severity: "medium" }
      : { reason: "", risk: "", mitigation: "", due: "2026-12-11", approver: [] as string[], requester: run.author.user_id ?? "u-suzuki", severity: "medium" },
  );
  const [submitted, setSubmitted] = useState(state === "error");
  const [sending, setSending] = useState(state === "submitting");

  const errors = {
    reason: !form.reason.trim() ? "理由を入力してください" : "",
    risk: !form.risk.trim() ? "リスクと影響を入力してください" : "",
    mitigation: !form.mitigation.trim() ? "代替策を入力してください。ない場合は「なし」と理由を書きます" : "",
    requester: !form.requester ? "申請者を選択してください" : "",
    due: form.due > "2026-12-11" ? `期限は申請日から最大${MAX_DAYS}日（2026-12-11）までです` : !form.due ? "期限を選択してください" : "",
    approver: form.approver.length === 0 ? "承認者を選択してください" : "",
  };
  const hasError = Object.values(errors).some(Boolean);

  const approverOptions = users
    .filter((u) => u.kind === "member" && u.status === "active")
    .filter((u) => u.id !== "u-agent")
    .map((u) => {
      const self = u.id === form.requester || u.id === currentUser.id;
      return {
        value: u.id,
        label: u.name,
        hint: `${u.roles.join("・")}${u.account === false ? "（承認リンクで承認）" : ""}`,
        disabled: self,
        disabledReason: u.id === form.requester ? "申請者本人は承認者に選べません" : u.id === currentUser.id ? "起票者は承認者に選べません" : undefined,
      };
    });
  const requesterOptions = users.filter((u) => u.kind === "member" && u.status === "active" && u.id !== "u-agent").map((u) => ({ value: u.id, label: `${u.name}（${u.roles.join("・")}）` }));
  const severe = form.severity === "high" || form.severity === "critical";

  const submit = () => {
    setSubmitted(true);
    if (hasError) return;
    setSending(true);
    window.setTimeout(() => {
      toast({ kind: "success", message: "例外を申請しました。承認者に通知しました" });
      navigate(paths.exception(org, project, "EXC-0008"));
    }, 600);
  };

  return (
    <ProjectLayout org={org} project={project} active="exceptions" trail={[{ label: "例外", to: paths.exceptions(org, project) }, { label: "例外の申請" }]}>
      <PageHeader title="例外の申請" description="ゲートの失敗を、期限付きで通過させるための申請です。独立した承認者の承認が必要です。通常は PR／MR のコメントやチャットから申請され、ここには同期されます。この画面では経営層が代わりに起票でき、申請者と起票者を分けて記録します。" />

      <Section title="対象のゲート失敗" sub={`${run.pr_number ? `PR #${run.pr_number} ` : ""}${run.pr_title} · ${run.id}（読み取り専用）`} actions={<EnforcementBadge level={run.enforcement} />}>
        <GateResultPanel letter={reason?.gate ?? "B"} status="block" reasons={reason ? [{ ...reason, exception_allowed: false }] : []} enforcement={run.enforcement} policyVersion={run.policy_version} />
      </Section>

      {hard ? (
        <div className="card stack">
          <Banner tone="fail" title="このゲートには例外を申請できません">
            プロジェクトの強制レベルが「ハード」のため、ゲート{reason?.gate}（{reason ? GATE_LABELS[reason.gate] : ""}）の失敗は例外で通過できません。失敗の原因を修正してください。
          </Banner>
          <SoDNotice reason="強制レベルの変更はポリシー管理者が行います。変更にはポリシー管理者の承認が必要です。" />
          <div className="row">
            <Button variant="primary" icon="arrowLeft" to={paths.gate(org, project, run.id)}>ゲート実行の詳細に戻る</Button>
          </div>
        </div>
      ) : (
        <section className="card stack" aria-label="申請内容">
          {submitted && hasError ? <Banner tone="fail" title="入力内容を確認してください">必須項目（理由・リスク・代替策・申請者・独立承認者）が未入力か、期限が上限を超えています。</Banner> : null}
          <TextArea label="理由" required rows={3} value={form.reason} onChange={(v) => setForm((f) => ({ ...f, reason: v }))} placeholder="例: 結合テスト環境の準備が 12/1 になるため、それまでテストを追加できない" error={submitted ? errors.reason : undefined} maxLength={1000} />
          <TextArea label="リスクと影響" required rows={3} value={form.risk} onChange={(v) => setForm((f) => ({ ...f, risk: v }))} placeholder="例: 不具合を結合テストまで検出できない" error={submitted ? errors.risk : undefined} maxLength={1000} />
          <TextArea label="代替策" required rows={2} value={form.mitigation} onChange={(v) => setForm((f) => ({ ...f, mitigation: v }))} placeholder="例: 単体テストで主要なロジックを確認済み" error={submitted ? errors.mitigation : undefined} />
          <div className="grid cols-2">
            <Select label="申請者（実務の責任者）" required value={form.requester} onChange={(v) => setForm((f) => ({ ...f, requester: v, approver: f.approver.filter((a) => a !== v) }))} options={requesterOptions} help={`起票者: ${currentUser.name}（記録されます）`} error={submitted ? errors.requester : undefined} />
            <Select label="重大度" required value={form.severity} onChange={(v) => setForm((f) => ({ ...f, severity: v }))} options={Object.entries(SEVERITY).map(([value, v]) => ({ value, label: v.label }))} help="高・緊急は、承認に加えて経営判断（リスク受容）が必要です" />
          </div>
          {severe ? (
            <Banner tone="warn" title="経営判断（リスク受容）が必要です">
              重大度が{SEVERITY[form.severity as "high"].label}のため、独立承認者の承認に加えて、案件スポンサー（{userById("u-kimura")?.name}）によるリスク受容の判断を経営判断として依頼します。判断されるまで例外は有効になりません。
            </Banner>
          ) : null}
          <div className="grid cols-2">
            <DatePicker label="期限" required value={form.due} min="2026-11-28" max="2026-12-11" onChange={(v) => setForm((f) => ({ ...f, due: v }))} help={`最大${MAX_DAYS}日。期限が来ると自動で再審査され、例外は失効します`} error={submitted ? errors.due : undefined} />
            <Combobox label="独立承認者" required options={approverOptions} value={form.approver} onChange={(v) => setForm((f) => ({ ...f, approver: v }))} help="申請者と起票者は選べません。アカウントのない承認者には期限付きの承認リンクを送ります" error={submitted ? errors.approver : undefined} />
          </div>
          <div className="row end" style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
            <Button variant="ghost" to={paths.gate(org, project, run.id)}>キャンセル</Button>
            <Button variant="primary" icon="flag" loading={sending} onClick={submit}>申請する</Button>
          </div>
        </section>
      )}
    </ProjectLayout>
  );
}
