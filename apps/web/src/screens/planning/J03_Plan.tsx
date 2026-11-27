// 画面ID: J-03 プロジェクト計画
import { useEffect, useState } from "react";
import {
  AIDraftBanner,
  ApprovalPanel,
  Banner,
  Button,
  ChecklistPanel,
  ConfirmDialog,
  DetailLayout,
  Icon,
  KeyValueList,
  MarkdownEditor,
  MarkdownViewer,
  MetaSection,
  MoreMenu,
  PageHeader,
  ProjectLayout,
  StatusBadge,
  Tag,
  Timeline,
  UserChip,
  membersWithRole,
  useToast,
  cx,
} from "../../ui";
import { useScreenState } from "../../lib/router";
import { paths } from "../../lib/paths";
import { APPROVAL_STATUS, ARTIFACT_STATUS } from "../../lib/vocab";
import type { Approver } from "../../lib/types";
import { requirements, userById } from "../../mocks/core";
import { planApprovers, planSections } from "../../mocks/planning";
import { orgOf, projectOf } from "./shared";

const AI_DRAFTS: Record<string, string> = {
  versioning: "- main ブランチは保護し、PR とゲート A〜D の通過を必須とする\n- リリースは `vX.Y.Z` のタグを付け、タグは変更不可とする\n- 設計書・要求は docs/ 配下で版管理する",
  agreements: "- 要求の承認は顧客ポータルで行う\n- 変更要求は影響分析のうえ PM と顧客が承認する\n- 受入は各リリースの納入後10営業日以内に行う",
};

export const J03_STATES = ["承認待ち", "下書き", "承認済み", "承認後の変更中", "顧客として表示", "AI下書きを挿入済み"];

export function J03Plan({ params }: { params: Record<string, string> }) {
  const state = useScreenState();
  const org = orgOf(params);
  const pr = projectOf(params);
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [bodies, setBodies] = useState<Record<string, string>>(() => Object.fromEntries(planSections.map((s) => [s.key, s.body])));
  const [aiDrafted, setAiDrafted] = useState<string[]>([]);
  const [confirmEdit, setConfirmEdit] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [leave, setLeave] = useState(false);

  useEffect(() => {
    if (state === "AI下書きを挿入済み") {
      setEditing(true);
      setBodies((b) => ({ ...b, ...AI_DRAFTS }));
      setAiDrafted(Object.keys(AI_DRAFTS));
    } else {
      setEditing(state === "下書き" || state === "承認後の変更中");
      setAiDrafted([]);
      setBodies(Object.fromEntries(planSections.map((s) => [s.key, s.body])));
    }
  }, [state]);

  const status =
    state === "下書き" ? ARTIFACT_STATUS.draft : state === "承認済み" ? ARTIFACT_STATUS.approved : state === "承認後の変更中" ? ARTIFACT_STATUS.changing : ARTIFACT_STATUS.pending;
  const approvers: Approver[] =
    state === "承認済み"
      ? planApprovers.map((a) => ({ ...a, status: "approved", decided_at: a.decided_at ?? "2026-11-20T15:00:00+09:00" }))
      : state === "下書き" || state === "承認後の変更中"
        ? planApprovers.map((a) => ({ role: a.role, user_id: a.user_id, status: "draft" }))
        : planApprovers;
  const missing = planSections.filter((s) => s.required && !bodies[s.key]?.trim());
  const checklist = planSections.map((s) => ({
    id: s.key,
    title: s.title,
    state: (bodies[s.key]?.trim() ? "ok" : s.required ? "ng" : "pending") as "ok" | "ng" | "pending",
    detail: bodies[s.key]?.trim() ? (aiDrafted.includes(s.key) ? "AIの下書きを含む（未確認）" : "記入済み") : s.required ? "必須項目が未記入" : "任意項目",
    actor: "ci" as const,
  }));

  const startEdit = () => (status === ARTIFACT_STATUS.approved ? setConfirmEdit(true) : setEditing(true));
  const draftAll = () => {
    setBodies((b) => ({ ...b, ...Object.fromEntries(Object.entries(AI_DRAFTS).filter(([k]) => !b[k]?.trim())) }));
    setAiDrafted(Object.keys(AI_DRAFTS));
    setEditing(true);
    setDirty(true);
    toast({ kind: "info", message: "未記入のセクションにAIの下書きを挿入しました。確認して編集してください" });
  };

  return (
    <ProjectLayout org={org} project={pr} active="plan" trail={[{ label: "プロジェクト計画" }]}>
      <PageHeader
        title="プロジェクト計画"
        id="PLAN-v3"
        status={status}
        description="SOW v3 を作業範囲とする計画です。顧客の承認で確定します。"
        actions={
          editing ? (
            <>
              <Button icon="sparkles" onClick={draftAll}>AIで下書き</Button>
              <Button variant="ghost" onClick={() => (dirty ? setLeave(true) : setEditing(false))}>編集をやめる</Button>
              <Button variant="primary" icon="check" onClick={() => { setEditing(false); setDirty(false); setAiDrafted([]); toast({ kind: "success", message: "計画を保存しました" }); }}>保存</Button>
            </>
          ) : (
            <>
              <Button icon="edit" onClick={startEdit} disabled={state === "顧客として表示"} disabledReason="顧客は計画を編集できません">編集</Button>
              <Button variant="primary" icon="mail" disabled={missing.length > 0 || status !== ARTIFACT_STATUS.draft} disabledReason={missing.length > 0 ? `必須項目が ${missing.length} 件未記入です` : "すでに承認を依頼しています"} onClick={() => toast({ kind: "success", message: "顧客に承認を依頼しました" })}>承認を依頼</Button>
              <MoreMenu items={[{ label: "PDF で出力", icon: "download" }, { label: "版の履歴", icon: "history" }]} />
            </>
          )
        }
      />
      {status === ARTIFACT_STATUS.changing ? (
        <Banner tone="warn" title="承認済みの計画を変更しています">保存すると状態が「変更中」になり、顧客の再承認が必要です。</Banner>
      ) : null}
      {missing.length ? (
        <Banner tone="warn" title={`必須項目が ${missing.length} 件未記入です`}>{missing.map((m) => m.title).join("、")} を記入すると承認を依頼できます。</Banner>
      ) : null}
      <DetailLayout
        main={
          <>
            <nav className="pl-plan-toc" aria-label="計画のセクション">
              {planSections.map((s) => (
                <a key={s.key} href={`#plan-${s.key}`} onClick={(e) => { e.preventDefault(); document.getElementById(`plan-${s.key}`)?.scrollIntoView({ behavior: "smooth" }); }} className={cx(s.required && !bodies[s.key]?.trim() && "ng")}>
                  {s.required && !bodies[s.key]?.trim() ? <Icon name="alert" size={11} /> : null}
                  {s.title}
                </a>
              ))}
            </nav>
            {aiDrafted.length && editing ? <AIDraftBanner /> : null}
            {planSections.map((s) => {
              const empty = !bodies[s.key]?.trim();
              return (
                <section key={s.key} id={`plan-${s.key}`} className="card pl-plan-section stack" style={{ ["--gap" as string]: "12px" }}>
                  <div className="row between">
                    <h2 className="section-title">{s.title}</h2>
                    <span className="row" style={{ ["--gap" as string]: "6px" }}>
                      {aiDrafted.includes(s.key) ? <Tag tone="special" dashed icon="sparkles">AI下書き</Tag> : null}
                      {s.required ? <Tag square>必須</Tag> : <Tag square>任意</Tag>}
                      {empty && s.required ? <Tag tone="warn" icon="alert">未記入</Tag> : null}
                    </span>
                  </div>
                  {editing ? (
                    <MarkdownEditor
                      value={bodies[s.key]}
                      onChange={(v) => { setBodies((b) => ({ ...b, [s.key]: v })); setDirty(true); }}
                      suggestions={requirements.map((r) => ({ id: r.id, title: r.title }))}
                      aiDraft={aiDrafted.includes(s.key)}
                      onAiDraft={AI_DRAFTS[s.key] ? () => { setBodies((b) => ({ ...b, [s.key]: AI_DRAFTS[s.key] })); setAiDrafted((x) => [...x, s.key]); setDirty(true); } : undefined}
                      minHeight={120}
                    />
                  ) : empty ? (
                    <p className="small muted">{s.missing ?? "未記入です"}</p>
                  ) : (
                    <MarkdownViewer source={bodies[s.key]} />
                  )}
                </section>
              );
            })}
          </>
        }
        side={
          <>
            <MetaSection title="状態">
              <KeyValueList
                stacked
                items={[
                  { label: "状態", value: <StatusBadge vocab={status} size="sm" /> },
                  { label: "作成者", value: <UserChip user={userById("u-sato")} /> },
                  { label: "最終更新", value: "2026-11-13 10:00 JST" },
                  { label: "出典", value: "SOW v3（SOW-3）" },
                ]}
              />
            </MetaSection>
            <MetaSection title="必須項目の充足">
              <ChecklistPanel items={checklist} />
            </MetaSection>
            <MetaSection title="承認">
              <ApprovalPanel
                approvers={approvers}
                canDecide={state === "顧客として表示"}
                blockedReason={state === "承認待ち" ? "顧客の承認待ちです。あなた（PM）はすでに承認しています" : undefined}
                eligible={state === "承認待ち" ? membersWithRole("顧客") : undefined}
                onDecide={(d) => toast({ kind: d === "approved" ? "success" : "info", message: d === "approved" ? "計画を承認しました" : "計画を差し戻しました" })}
              />
              {status === ARTIFACT_STATUS.approved ? <span className="tiny muted">全員の承認で {APPROVAL_STATUS.approved.label} になりました</span> : null}
            </MetaSection>
            <MetaSection title="履歴" defaultOpen={false}>
              <Timeline
                compact
                items={[
                  { id: "h1", actor: { kind: "human", name: "佐藤 美咲" }, action: "計画を承認", at: "2026-11-13T10:00:00+09:00" },
                  { id: "h2", actor: { kind: "ai", name: "計画下書き" }, action: "2セクションの下書きを作成", at: "2026-11-12T11:00:00+09:00" },
                  { id: "h3", actor: { kind: "human", name: "佐藤 美咲" }, action: "SOW v3 を反映して更新", at: "2026-11-12T10:30:00+09:00" },
                ]}
              />
            </MetaSection>
            <MetaSection title="関連" defaultOpen={false}>
              <a href={`#${paths.sow(org, pr)}`} className="small">SOW の版一覧</a>
              <a href={`#${paths.risks(org, pr)}`} className="small">リスク台帳</a>
            </MetaSection>
          </>
        }
      />
      <ConfirmDialog open={confirmEdit} onClose={() => setConfirmEdit(false)} onConfirm={() => setEditing(true)} title="承認済みの計画を編集しますか？" message="編集を保存すると状態が「変更中」に戻り、顧客の再承認が必要になります。" confirmLabel="編集を始める" />
      <ConfirmDialog open={leave} onClose={() => setLeave(false)} onConfirm={() => { setEditing(false); setDirty(false); setBodies(Object.fromEntries(planSections.map((s) => [s.key, s.body]))); }} title="保存していない変更があります" message="編集をやめると、保存していない変更は失われます。" confirmLabel="変更を破棄" danger />
    </ProjectLayout>
  );
}
