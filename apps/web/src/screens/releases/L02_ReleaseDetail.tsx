// 画面ID: L-02 リリース詳細・リリースゲート
import "../delivery/delivery.css";
import { useState } from "react";
import { navigate, useScreenState } from "../../lib/router";
import { paths } from "../../lib/paths";
import { APPROVAL_STATUS, DECISION_STATUS, DEPLOY_STATUS, GATE_STATUS, RELEASE_STATUS } from "../../lib/vocab";
import type { DeployStatus } from "../../lib/vocab";
import { candidateFixed, permitPinned } from "../../mocks/delivery";
import type { ReleaseStatus } from "../../lib/vocab";
import type { Approver } from "../../lib/types";
import { formatDate } from "../../lib/format";
import { exceptionById, releaseById, releases, userById } from "../../mocks/core";
import { decisions } from "../../mocks/portfolio";
import { artifacts, goNoGoCriteria, includedChanges, knownIssues, postReview, releaseChecklist, releaseNotes } from "../../mocks/releases";
import {
  ApprovalPanel,
  Banner,
  Button,
  ChecklistPanel,
  ConfirmDialog,
  DetailLayout,
  ExceptionSummary,
  ExternalActor,
  HashDisplay,
  IdLink,
  KeyValueList,
  MarkdownViewer,
  MetaSection,
  Modal,
  MoreMenu,
  OptionCard,
  PageHeader,
  ProjectLayout,
  ResponsibilitySplit,
  Section,
  SignatureBadge,
  SourceTag,
  TextArea,
  StateFlow,
  StatusBadge,
  Tag,
  membersWithRole,
  useToast,
} from "../../ui";

export function ReleaseDetailScreen({ org, project, id }: { org: string; project: string; id: string }) {
  const state = useScreenState();
  const toast = useToast();
  const base = state === "released" ? releaseById("rel-130") : releases.find((r) => r.id === id) ?? releases[0];
  const ready = state === "ready" || state === "released";
  const [status, setStatus] = useState<ReleaseStatus>(state === "ready" ? "pending" : base.status);
  const [confirm, setConfirm] = useState(false);
  const [decideOpen, setDecideOpen] = useState(false);
  const [choice, setChoice] = useState("conditional");
  const [reason, setReason] = useState("");
  const [conditions, setConditions] = useState("");
  const [decided, setDecided] = useState<string | null>(state === "decided" ? "conditional" : null);
  const decision = decisions.find((d) => d.id === "DEC-0033");
  const criteria = goNoGoCriteria(ready);
  const released = status === "released" || status === "accepted";
  const checklist = releaseChecklist(ready);
  const unmet = checklist.filter((c) => c.state !== "ok").length;
  const arts = artifacts(released);
  const gate = ready ? "pass" : base.gate;
  // 配備の状態。外部の実行結果を照合するまで「公開済み」と表示しない（改修 27）
  const deploy: DeployStatus = state === "released" ? "succeeded" : state === "ready" ? "permitted" : state === "decided" ? "notReady" : "notReady";
  const candidateIsFixed = state !== "default";
  const permitIssued = state === "ready" || state === "released";

  const approvers: Approver[] = [
    { role: "リリース管理者", user_id: "u-watanabe", status: released ? "approved" : "pending", decided_at: released ? "2026-11-05T16:30:00+09:00" : undefined },
    { role: "PM", user_id: "u-sato", status: released ? "approved" : "pending", decided_at: released ? "2026-11-05T16:35:00+09:00" : undefined },
  ];
  const approveReason = unmet ? `リリースゲートのチェックが ${unmet} 件未充足のため承認できません` : undefined;
  const CHOICES = [
    { value: "go", title: "Go", description: "条件なしでリリースを認める" },
    { value: "conditional", title: "条件付き Go", description: "条件を満たした場合にリリースを認める（条件は必須）" },
    { value: "noGo", title: "No-Go", description: "リリースを認めない。再判断の日を決める" },
  ];
  const decisionLabel = (v: string) => CHOICES.find((c) => c.value === v)?.title ?? v;

  const main = (
    <>
      {!ready ? (
        <Banner tone="fail" title={`リリースゲート: ${unmet}件が未充足です`}>すべての項目を満たすと「リリースを承認」できます。</Banner>
      ) : !released ? (
        <Banner tone="pass" title="リリースゲートのチェックをすべて満たしています">リリース管理者と PM の承認後に、成果物へ署名して Evidence Manifest を保管します。</Banner>
      ) : null}
      {released && deploy !== "succeeded" ? (
        <Banner tone="warn" title="リリースは承認済みですが、配備の結果を確認していません">外部の実行IDで配備の結果を照合するまで「公開済み」とは表示せず、顧客への完了通知も送りません。</Banner>
      ) : null}
      <Section title="配備までの流れ" sub="候補の固定 → 実行許可 → 配備依頼と完了確認。各段階は別の記録です">
        <div className="dl-flow">
          <div>
            <span className="tiny muted">1. リリース候補</span>
            {candidateIsFixed ? <Tag tone="pass" icon="lock">{candidateFixed.id} を固定済み</Tag> : <Tag tone="warn">選択中</Tag>}
            <span className="tiny muted">受託者の提出と社内の変更から、入れるものだけを選びます</span>
            <Button size="sm" variant="ghost" iconRight="arrowRight" to={paths.releaseCandidate(org, project, base.id)}>候補を開く</Button>
          </div>
          <div>
            <span className="tiny muted">2. 実行許可</span>
            {permitIssued ? <Tag tone="pass" icon="shieldCheck">{permitPinned.id} 発行済み</Tag> : <Tag tone="warn">回収中</Tag>}
            <span className="tiny muted">承認・判断・成果版・ルール版・環境がそろうと発行します</span>
            <Button size="sm" variant="ghost" iconRight="arrowRight" to={paths.executionPermit(org, project, base.id)}>実行許可を開く</Button>
          </div>
          <div>
            <span className="tiny muted">3. 配備</span>
            <StatusBadge vocab={DEPLOY_STATUS[deploy]} size="sm" />
            <span className="tiny muted">事前登録した外部の手順だけを起動し、結果を照合します</span>
            <Button size="sm" variant="ghost" iconRight="arrowRight" to={paths.deployment(org, project, base.id)}>配備を開く</Button>
          </div>
        </div>
      </Section>
      <Section title="リリースゲート" sub="判定の主体（CI／人間）を項目ごとに表示します" actions={<StatusBadge vocab={GATE_STATUS[gate]} />}>
        <ChecklistPanel items={checklist} title="チェック項目" />
      </Section>
      <Section
        title="Go/No-Go の判断"
        sub="根拠と条件を記録します。リリースの承認（実務）とは別に、影響の大きいリリースは案件スポンサーが判断します"
        actions={decided ? <Tag tone={decided === "noGo" ? "fail" : decided === "go" ? "pass" : "special"}>{decisionLabel(decided)}（判断済み）</Tag> : decision ? <StatusBadge vocab={DECISION_STATUS[decision.status]} size="sm" /> : null}
      >
        <div className="stack">
          <div className="table-wrap">
            <table className="table compact">
              <thead><tr><th>判断基準</th><th>状態</th><th>根拠</th></tr></thead>
              <tbody>
                {criteria.map((c) => (
                  <tr key={c.id}>
                    <td className="small strong">{c.title}</td>
                    <td>{c.state === "ok" ? <Tag tone="pass" icon="check">充足</Tag> : c.state === "ng" ? <Tag tone="fail" icon="xCircle">未充足</Tag> : <Tag tone="warn" icon="clock">確認中</Tag>}</td>
                    <td className="small">{c.basis}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ResponsibilitySplit
            decide={<span>案件スポンサー: <ExternalActor userId="u-kimura" /></span>}
            act={<span>リリースの準備・承認: <ExternalActor userId="u-watanabe" role="リリース管理者" /></span>}
            note="Go/No-Go は経営判断として記録し、判断の結果と条件を Evidence Manifest に含めます。"
          />
          {decided ? (
            <Banner tone={decided === "noGo" ? "fail" : "info"} title={`${decisionLabel(decided)} と判断しました（${userById("u-kimura")?.name}・2026-11-27 10:30）`}>
              {decided === "conditional" ? `条件: ${conditions || "EXC-0007 の原因を 12/3 までに修正し、ゲートB を通過すること"}` : decided === "noGo" ? "再判断の日: 2026-12-04" : "条件はありません。"}
            </Banner>
          ) : decision ? (
            <div className="row between">
              <span className="small">関連する経営判断: <IdLink id={decision.id} to={paths.decision(org, decision.id)} /> {decision.title}</span>
              <Button size="sm" variant="ghost" iconRight="arrowRight" to={paths.decision(org, decision.id)}>経営判断を開く</Button>
            </div>
          ) : null}
        </div>
      </Section>
      <Section title="成果物" sub="ダイジェスト・署名・SBOM" flush>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>名前</th><th>SHA-256</th><th>署名</th><th>SBOM</th><th className="num">サイズ</th></tr></thead>
            <tbody>
              {arts.map((a) => (
                <tr key={a.name}>
                  <td className="mono small">{a.name}</td>
                  <td><HashDisplay value={a.sha256} /></td>
                  <td><SignatureBadge state={a.signature} /></td>
                  <td>{a.sbom ? <Tag tone="pass" icon="check">あり</Tag> : <Tag>対象外</Tag>}</td>
                  <td className="num small">{a.size}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
      <Section title="リリース範囲" sub="このリリースに含まれる要求・変更要求・PR" flush>
        <div className="table-wrap">
          <table className="table compact">
            <tbody>
              {includedChanges.map((c) => (
                <tr key={c.id}>
                  <td style={{ width: 100 }}><Tag square>{c.kind}</Tag></td>
                  <td style={{ width: 110 }}>{c.id.startsWith("REQ") ? <IdLink id={c.id} to={paths.requirement(org, project, c.id)} /> : c.id.startsWith("CR") ? <IdLink id={c.id} to={paths.change(org, project, c.id)} /> : <span className="mono small">{c.id}</span>}</td>
                  <td>{c.title}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
      <Section title="リリースノート" actions={<SourceTag source={{ provider: "github", label: "docs/release-notes.md", synced_at: "2026-11-27T10:28:00+09:00", status: "healthy" }} />}>
        <MarkdownViewer source={releaseNotes} />
      </Section>
      <Section title="未解決事項">
        <div className="stack">
          <span className="label">既知の不具合</span>
          {knownIssues.map((k) => (
            <div key={k.id} className="row" style={{ ["--gap" as string]: "8px" }}>
              <span className="mono small">{k.id}</span>
              <span>{k.title}</span>
              <Tag tone="neutral">重要度: {k.severity}</Tag>
            </div>
          ))}
          <span className="label" style={{ marginTop: 8 }}>有効な例外</span>
          <div className="grid cols-2">
            <ExceptionSummary ex={exceptionById("EXC-0006")} compact />
            <ExceptionSummary ex={exceptionById("EXC-0007")} compact />
          </div>
        </div>
      </Section>
      {released ? (
        <Section title="事後レビュー" sub={`実施日 ${formatDate(postReview.held_at)}`}>
          <div className="grid cols-2">
            <div className="stack" style={{ ["--gap" as string]: "6px" }}>
              <span className="label">よかったこと</span>
              <ul className="small" style={{ margin: 0, paddingLeft: 18 }}>{postReview.good.map((g) => <li key={g}>{g}</li>)}</ul>
            </div>
            <div className="stack" style={{ ["--gap" as string]: "6px" }}>
              <span className="label">課題</span>
              <ul className="small" style={{ margin: 0, paddingLeft: 18 }}>{postReview.issues.map((g) => <li key={g}>{g}</li>)}</ul>
            </div>
          </div>
          <div className="table-wrap" style={{ marginTop: 12 }}>
            <table className="table compact">
              <thead><tr><th>改善の対応</th><th>担当</th><th>期限</th><th>状態</th></tr></thead>
              <tbody>
                {postReview.actions.map((a) => (
                  <tr key={a.title}>
                    <td className="small">{a.title}</td>
                    <td><ExternalActor userId={a.owner} /></td>
                    <td className="small">{formatDate(a.due)}</td>
                    <td>{a.done ? <Tag tone="pass" icon="check">完了</Tag> : <Tag icon="clock">対応中</Tag>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      ) : null}
    </>
  );

  const side = (
    <>
      <MetaSection title="状態">
        <StateFlow flow="release" current={RELEASE_STATUS[status].label} />
      </MetaSection>
      <MetaSection title="リリース承認">
        <ApprovalPanel
          approvers={approvers}
          canDecide={false}
          blockedReason={!ready ? approveReason : released ? undefined : "リリースの承認は、リリース管理者と PM が Git サービス上で行い、外部IDで記録します。"}
          eligible={!ready ? membersWithRole("リリース管理者") : undefined}
          onDecide={(d) => {
            if (d === "approved") { setStatus("released"); toast({ kind: "success", message: `${base.version} をリリースしました。Manifest に署名します` }); }
            else { setStatus("returned"); toast({ kind: "info", message: "リリースを差し戻しました" }); }
          }}
        />
      </MetaSection>
      <MetaSection title="受入の状況">
        <div className="row between">
          {base.acceptance === "notRequested" && !released ? <Tag>未依頼</Tag> : <StatusBadge vocab={APPROVAL_STATUS[base.acceptance === "notRequested" ? "pending" : base.acceptance]} size="sm" />}
          <Button size="sm" variant="ghost" iconRight="arrowRight" to={paths.acceptance(org, project, base.id)}>詳細</Button>
        </div>
      </MetaSection>
      <MetaSection title="属性">
        <KeyValueList
          stacked
          items={[
            { label: "予定日", value: formatDate(base.planned_at) },
            { label: "Evidence Manifest", value: base.manifest_id ? <IdLink id={base.manifest_id} to={paths.manifest(org, project, base.manifest_id)} /> : <span className="muted">リリース承認後に作成</span> },
            { label: "署名", value: <SignatureBadge state={released ? "verified" : "unsigned"} /> },
            { label: "配備", value: <StatusBadge vocab={DEPLOY_STATUS[deploy]} size="sm" /> },
            { label: "公開", value: deploy === "succeeded" ? <Tag tone="pass" icon="check">公開済み（配備確認済み）</Tag> : <Tag icon="clock">配備の確認後に表示</Tag> },
          ]}
        />
      </MetaSection>
    </>
  );

  return (
    <ProjectLayout org={org} project={project} active="releases" trail={[{ label: "リリースと受入", to: paths.releases(org, project) }, { label: base.version }]}>
      <PageHeader
        id={base.version}
        title={base.title}
        status={RELEASE_STATUS[status]}
        actions={
          <>
            <Button variant="primary" icon="flag" disabled={released || !!decided} disabledReason={released ? "リリース済みです" : "判断済みです"} onClick={() => setDecideOpen(true)}>Go/No-Go を判断</Button>
            <Button icon="arrowRight" to={paths.acceptance(org, project, base.id)}>受入の状況</Button>
            <MoreMenu items={[{ label: "ゲート実行を開く", icon: "shield", onClick: () => navigate(paths.gates(org, project)) }, { label: "構成管理（ベースライン）", icon: "commit", onClick: () => navigate(paths.baselines(org, project)) }, { label: "納入物一覧を出力", icon: "download" }]} />
          </>
        }
      />
      <DetailLayout main={main} side={side} />
      <Modal
        open={decideOpen}
        onClose={() => setDecideOpen(false)}
        title={`${base.version} の Go/No-Go`}
        description="判断は経営判断として記録され、取り消せません。条件付きの場合は条件が必須です。"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDecideOpen(false)}>キャンセル</Button>
            <Button
              variant="primary"
              disabled={!reason.trim() || (choice === "conditional" && !conditions.trim())}
              disabledReason={!reason.trim() ? "理由を入力してください" : "条件を入力してください"}
              onClick={() => { setDecided(choice); setDecideOpen(false); toast({ kind: "success", message: `${decisionLabel(choice)} と判断しました。リリース管理者と PM に通知しました` }); }}
            >
              判断を記録
            </Button>
          </>
        }
      >
        <div className="stack">
          <div className="stack" style={{ ["--gap" as string]: "8px" }}>
            {CHOICES.map((c) => <OptionCard key={c.value} name="gonogo" value={c.value} checked={choice === c.value} onChange={setChoice} title={c.title} description={c.description} />)}
          </div>
          <TextArea label="理由" required rows={3} value={reason} onChange={setReason} placeholder="例: 遅延は 7 日以内で、顧客の確約日の範囲内のため" />
          {choice === "conditional" ? <TextArea label="条件" required rows={2} value={conditions} onChange={setConditions} placeholder="例: EXC-0007 の原因を 12/3 までに修正し、ゲートB を通過すること" /> : null}
        </div>
      </Modal>
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title={`${base.version} をリリースしますか`}
        message="承認すると成果物に署名し、Evidence Manifest を WORM の保管先へ保存します。この操作は取り消せません。"
        confirmLabel="リリースを承認"
        onConfirm={() => { setStatus("released"); toast({ kind: "success", message: `${base.version} を承認しました` }); }}
      />
    </ProjectLayout>
  );
}
