// 画面ID: L-02 リリース詳細・リリースゲート
import { useState } from "react";
import { navigate, useScreenState } from "../../lib/router";
import { paths } from "../../lib/paths";
import { APPROVAL_STATUS, GATE_STATUS, RELEASE_STATUS } from "../../lib/vocab";
import type { ReleaseStatus } from "../../lib/vocab";
import type { Approver } from "../../lib/types";
import { formatDate } from "../../lib/format";
import { exceptionById, releaseById, releases } from "../../mocks/core";
import { artifacts, includedChanges, knownIssues, releaseChecklist, releaseNotes } from "../../mocks/releases";
import {
  ApprovalPanel,
  Banner,
  Button,
  ChecklistPanel,
  ConfirmDialog,
  DetailLayout,
  ExceptionSummary,
  HashDisplay,
  IdLink,
  KeyValueList,
  MarkdownEditor,
  MetaSection,
  MoreMenu,
  PageHeader,
  ProjectLayout,
  Section,
  SignatureBadge,
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
  const [notes, setNotes] = useState(releaseNotes);
  const [aiDraft, setAiDraft] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const released = status === "released" || status === "accepted";
  const checklist = releaseChecklist(ready);
  const unmet = checklist.filter((c) => c.state !== "ok").length;
  const arts = artifacts(released);
  const gate = ready ? "pass" : base.gate;

  const approvers: Approver[] = [
    { role: "リリース管理者", user_id: "u-watanabe", status: released ? "approved" : "pending", decided_at: released ? "2026-11-05T16:30:00+09:00" : undefined },
    { role: "PM", user_id: "u-sato", status: released ? "approved" : "pending", decided_at: released ? "2026-11-05T16:35:00+09:00" : undefined },
  ];
  const approveReason = unmet ? `リリースゲートのチェックが ${unmet} 件未充足のため承認できません` : undefined;

  const main = (
    <>
      {!ready ? (
        <Banner tone="fail" title={`リリースゲート: ${unmet}件が未充足です`}>すべての項目を満たすと「リリースを承認」できます。</Banner>
      ) : !released ? (
        <Banner tone="pass" title="リリースゲートのチェックをすべて満たしています">リリース管理者と PM の承認後に、成果物へ署名して Evidence Manifest を保管します。</Banner>
      ) : null}
      <Section title="リリースゲート" sub="判定の主体（CI／人間）を項目ごとに表示します" actions={<StatusBadge vocab={GATE_STATUS[gate]} />}>
        <ChecklistPanel items={checklist} title="チェック項目" />
      </Section>
      <Section title="成果物" sub="ダイジェストと署名" flush>
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
      <Section title="含まれる変更" flush>
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
      <Section title="リリースノート">
        <MarkdownEditor
          value={notes}
          onChange={(v) => { setNotes(v); setAiDraft(false); }}
          aiDraft={aiDraft}
          onAiDraft={() => { setNotes(`${releaseNotes}\n\n## 移行手順\n\n- 特別な移行作業は不要です`); setAiDraft(true); }}
          minHeight={200}
        />
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
          canDecide={ready && !released}
          blockedReason={!ready ? approveReason : undefined}
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
            <Button variant="primary" icon="check" disabled={!ready || released} disabledReason={approveReason ?? (released ? "承認済みです" : undefined)} onClick={() => setConfirm(true)}>リリースを承認</Button>
            <Button icon="mail" disabled={!released} disabledReason="リリース後に依頼できます" onClick={() => { toast({ kind: "success", message: "顧客に受入を依頼しました" }); navigate(paths.acceptance(org, project, base.id)); }}>受入を依頼</Button>
            <MoreMenu items={[{ label: "ゲート実行を開く", icon: "shield", onClick: () => navigate(paths.gates(org, project)) }, { label: "納入物一覧を出力", icon: "download" }]} />
          </>
        }
      />
      <DetailLayout main={main} side={side} />
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
