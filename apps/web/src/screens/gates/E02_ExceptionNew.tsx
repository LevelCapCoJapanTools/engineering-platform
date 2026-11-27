// 画面ID: E-02 例外の申請
import { useState } from "react";
import { navigate, useRoute, useScreenState } from "../../lib/router";
import { paths } from "../../lib/paths";
import { GATE_LABELS } from "../../lib/types";
import { currentUser, gateRuns, users } from "../../mocks/core";
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
      ? { reason: "", risk: "", mitigation: "", due: "2026-12-31", approver: [] as string[] }
      : { reason: "", risk: "", mitigation: "", due: "2026-12-11", approver: [] as string[] },
  );
  const [submitted, setSubmitted] = useState(state === "error");
  const [sending, setSending] = useState(state === "submitting");

  const errors = {
    reason: !form.reason.trim() ? "理由を入力してください" : "",
    risk: !form.risk.trim() ? "リスクと影響を入力してください" : "",
    due: form.due > "2026-12-11" ? `期限は申請日から最大${MAX_DAYS}日（2026-12-11）までです` : !form.due ? "期限を選択してください" : "",
    approver: form.approver.length === 0 ? "承認者を選択してください" : "",
  };
  const hasError = Object.values(errors).some(Boolean);

  const approverOptions = users
    .filter((u) => u.kind === "member" && u.status === "active")
    .map((u) => ({
      value: u.id,
      label: u.name,
      hint: u.roles.join("・"),
      disabled: u.id === currentUser.id,
      disabledReason: u.id === currentUser.id ? "申請者本人は承認者に選べません" : undefined,
    }));

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
      <PageHeader title="例外の申請" description="ゲートの失敗を、期限付きで通過させるための申請です。独立した承認者の承認が必要です。" />

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
          {submitted && hasError ? <Banner tone="fail" title="入力内容を確認してください">必須項目が未入力か、期限が上限を超えています。</Banner> : null}
          <TextArea label="理由" required rows={3} value={form.reason} onChange={(v) => setForm((f) => ({ ...f, reason: v }))} placeholder="例: 結合テスト環境の準備が 12/1 になるため、それまでテストを追加できない" error={submitted ? errors.reason : undefined} maxLength={1000} />
          <TextArea label="リスクと影響" required rows={3} value={form.risk} onChange={(v) => setForm((f) => ({ ...f, risk: v }))} placeholder="例: 不具合を結合テストまで検出できない" error={submitted ? errors.risk : undefined} maxLength={1000} />
          <TextArea label="代替の対策" rows={2} value={form.mitigation} onChange={(v) => setForm((f) => ({ ...f, mitigation: v }))} placeholder="例: 単体テストで主要なロジックを確認済み" help="任意" />
          <div className="grid cols-2">
            <DatePicker label="期限" required value={form.due} min="2026-11-28" max="2026-12-11" onChange={(v) => setForm((f) => ({ ...f, due: v }))} help={`最大${MAX_DAYS}日。期限が来ると自動で再審査され、例外は失効します`} error={submitted ? errors.due : undefined} />
            <Combobox label="承認者" required options={approverOptions} value={form.approver} onChange={(v) => setForm((f) => ({ ...f, approver: v }))} help="申請者本人は選べません" error={submitted ? errors.approver : undefined} />
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
