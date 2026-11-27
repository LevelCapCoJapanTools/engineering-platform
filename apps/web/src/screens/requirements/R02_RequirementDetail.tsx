// 画面ID: R-02 要求の詳細・編集
import { useState } from "react";
import { navigate, useScreenState } from "../../lib/router";
import { paths } from "../../lib/paths";
import type { Requirement } from "../../lib/types";
import { ARTIFACT_STATUS } from "../../lib/vocab";
import { aiFindings, requirementById, requirements, userById, users } from "../../mocks/core";
import { requirementComments, requirementHistory } from "../../mocks/requirements";
import {
  AIDraftBanner,
  ApprovalPanel,
  Banner,
  Button,
  Combobox,
  CommentThread,
  ConfirmDialog,
  DataClassBadge,
  DetailLayout,
  DiffViewer,
  ErrorState,
  Icon,
  IdLink,
  KeyValueList,
  MarkdownEditor,
  MarkdownViewer,
  membersWithRole,
  MetaSection,
  MoreMenu,
  PageHeader,
  ProjectLayout,
  Segmented,
  Select,
  Skeleton,
  StateFlow,
  StatusBadge,
  Tabs,
  Tag,
  TextField,
  Timeline,
  Timestamp,
  TraceLinkEditor,
  useToast,
  UserChip,
} from "../../ui";
import type { Approver } from "../../lib/types";
import { AiReviewPanel } from "./R03_AiReview";
import { ARTIFACT_FLOW_LABEL, KIND_LABEL, linkCandidates, linksOf, org, PriorityTag, project, reqPath, requirementCandidates } from "./common";

const NEW_REQ: Requirement = {
  id: "REQ-0013",
  title: "",
  kind: "functional",
  priority: "medium",
  status: "draft",
  owner_id: "u-takahashi",
  body: "",
  acceptance_criteria: [""],
  source: "",
  design_ids: [],
  pr_numbers: [],
  test_ids: [],
  ai_open_findings: 0,
  version: 1,
  updated_at: "2026-11-27T10:30:00+09:00",
  data_class: "confidential",
};

const AI_DRAFT_BODY = "購買担当者は、納期を過ぎた発注をダッシュボードの先頭に赤色の帯で表示し、件数をバッジで示す。\n\n- 対象: 状態が「発注済み」で納期が本日より前の発注\n- 並び順: 納期の古い順";

function approversOf(r: Requirement): Approver[] {
  if (r.status === "approved") {
    return [
      { role: "顧客", user_id: "u-nakamura", status: "approved", decided_at: "2026-10-22T15:00:00+09:00", comment: "内容を確認しました。" },
      { role: "PM", user_id: "u-sato", status: "approved", decided_at: "2026-10-22T11:00:00+09:00" },
    ];
  }
  if (r.status === "pending") {
    return [
      { role: "PM", user_id: "u-sato", status: "pending" },
      { role: "顧客", user_id: "u-nakamura", status: "pending" },
    ];
  }
  return [
    { role: "PM", user_id: "u-sato", status: "draft" },
    { role: "顧客", user_id: "u-nakamura", status: "draft" },
  ];
}

const NEXT_STATUS: Partial<Record<Requirement["status"], { label: string; to: Requirement["status"] }>> = {
  draft: { label: "レビューに出す", to: "inReview" },
  inReview: { label: "承認を依頼", to: "pending" },
  changing: { label: "再承認を依頼", to: "pending" },
};

export function RequirementDetail({ id }: { id: string }) {
  const state = useScreenState();
  const toast = useToast();
  const isNew = id === "new" || state === "new";
  const base = isNew
    ? NEW_REQ
    : state === "approvedEdit"
      ? requirementById("REQ-0001")
      : state === "aiDraft"
        ? requirementById("REQ-0010")
        : state === "pendingApproval" || state === "sod"
          ? requirementById("REQ-0012")
        : requirements.find((r) => r.id === id) ?? requirementById("REQ-0007");
  const [req, setReq] = useState<Requirement>(base);
  const [editing, setEditing] = useState(isNew || state === "editing" || state === "aiDraft");
  const [approvedNotice, setApprovedNotice] = useState(state === "approvedEdit");
  const [aiDraft, setAiDraft] = useState(state === "aiDraft");
  const [body, setBody] = useState(state === "aiDraft" ? AI_DRAFT_BODY : base.body);
  const [title, setTitle] = useState(base.title);
  const [criteria, setCriteria] = useState<string[]>(base.acceptance_criteria.length ? base.acceptance_criteria : [""]);
  const [dirty, setDirty] = useState(false);
  const [tab, setTab] = useState("content");
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [obsoleteOpen, setObsoleteOpen] = useState(false);
  const [diffVersion, setDiffVersion] = useState("prev");
  const [titleError, setTitleError] = useState("");

  if (state === "loading") {
    return (
      <ProjectLayout active="requirements" trail={[{ label: "要求", to: paths.requirements(org, project) }, { label: "読み込み中" }]}>
        <Skeleton variant="detail" rows={8} />
      </ProjectLayout>
    );
  }
  if (state === "error") {
    return (
      <ProjectLayout active="requirements" trail={[{ label: "要求", to: paths.requirements(org, project) }, { label: id }]}>
        <ErrorState title="要求を読み込めませんでした" />
      </ProjectLayout>
    );
  }

  const findings = aiFindings.filter((f) => f.target_id === req.id);
  const openFindings = findings.filter((f) => f.status === "unconfirmed").length;
  const history = requirementHistory[req.id] ?? [{ version: req.version, at: req.updated_at, by: req.owner_id, note: "作成", body: req.body }];
  const prev = history.length > 1 ? history[history.length - 2] : undefined;
  const isOwner = state === "sod" || req.owner_id === "u-sato";
  const next = NEXT_STATUS[req.status];

  const startEdit = () => {
    if (req.status === "approved") setApprovedNotice(true);
    setEditing(true);
  };
  const save = () => {
    if (!title.trim()) {
      setTitleError("タイトルを入力してください");
      return;
    }
    setReq((r) => ({ ...r, title, body, acceptance_criteria: criteria.filter((c) => c.trim()), status: r.status === "approved" ? "changing" : r.status, version: r.status === "approved" ? r.version + 1 : r.version }));
    setEditing(false);
    setDirty(false);
    setAiDraft(false);
    toast({ kind: "success", message: isNew ? `${req.id} を作成しました` : req.status === "approved" ? `${req.id} を保存し、状態を「変更中」に戻しました` : `${req.id} を保存しました` });
  };
  const mark = () => setDirty(true);

  const trail = [{ label: "要求", to: paths.requirements(org, project) }, { label: isNew ? "新規作成" : req.id }];

  const contentEdit = (
    <div className="card stack">
      {aiDraft ? <AIDraftBanner /> : null}
      <TextField label="タイトル" required value={title} onChange={(v) => { setTitle(v); setTitleError(""); mark(); }} maxLength={80} placeholder="例: 取引先ごとに発注書を作成できる" error={titleError || undefined} />
      <MarkdownEditor
        label="本文"
        required
        value={body}
        onChange={(v) => { setBody(v); mark(); }}
        suggestions={[...requirementCandidates, ...linkCandidates.filter((c) => !c.id.startsWith("PR"))].map((c) => ({ id: c.id, title: c.title }))}
        aiDraft={aiDraft}
        onAiDraft={() => { setBody(AI_DRAFT_BODY); setAiDraft(true); mark(); }}
        minHeight={160}
      />
      <div className="field">
        <span className="field-label">受入基準 <span className="tiny muted">（並べ替え・追加・削除できます）</span></span>
        <ol className="criteria-list">
          {criteria.map((c, i) => (
            <li key={i}>
              <span className="num">{i + 1}</span>
              <input value={c} placeholder="検証可能な条件を1つ書く" onChange={(e) => { const next2 = [...criteria]; next2[i] = e.target.value; setCriteria(next2); mark(); }} aria-label={`受入基準 ${i + 1}`} />
              <span className="row nowrap" style={{ ["--gap" as string]: "2px" }}>
                <Button size="sm" variant="ghost" iconOnly icon="chevronUp" label="上へ" disabled={i === 0} onClick={() => { const n = [...criteria]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; setCriteria(n); mark(); }} />
                <Button size="sm" variant="ghost" iconOnly icon="chevronDown" label="下へ" disabled={i === criteria.length - 1} onClick={() => { const n = [...criteria]; [n[i + 1], n[i]] = [n[i], n[i + 1]]; setCriteria(n); mark(); }} />
                <Button size="sm" variant="ghost" iconOnly icon="trash" label="削除" disabled={criteria.length === 1} onClick={() => { setCriteria(criteria.filter((_, j) => j !== i)); mark(); }} />
              </span>
            </li>
          ))}
        </ol>
        <div><Button size="sm" icon="plus" onClick={() => { setCriteria([...criteria, ""]); mark(); }}>受入基準を追加</Button></div>
      </div>
      <div className="grid cols-3">
        <Select label="種類" defaultValue={req.kind} options={[{ value: "functional", label: "機能" }, { value: "nonFunctional", label: "非機能" }]} onChange={mark} />
        <Select label="優先度" defaultValue={req.priority} options={[{ value: "high", label: "高" }, { value: "medium", label: "中" }, { value: "low", label: "低" }]} onChange={mark} />
        <Select label="出典" defaultValue={req.source || ""} placeholder="選択してください" options={[{ value: "SOW v2 §3.1", label: "SOW v2 §3.1" }, { value: "SOW v2 §3.3", label: "SOW v2 §3.3" }, { value: "CR-0003", label: "CR-0003（変更要求）" }, { value: "定例会 2026-11-20", label: "定例会 2026-11-20" }, ...(req.source && !["SOW v2 §3.1", "SOW v2 §3.3", "CR-0003", "定例会 2026-11-20"].includes(req.source) ? [{ value: req.source, label: req.source }] : [])]} onChange={mark} />
      </div>
      <div className="row end">
        <Button variant="ghost" onClick={() => (dirty ? setLeaveOpen(true) : isNew ? navigate(paths.requirements(org, project)) : setEditing(false))}>キャンセル</Button>
        <Button variant="primary" icon="check" onClick={save}>{isNew ? "作成する" : "保存する"}</Button>
      </div>
    </div>
  );

  const contentView = (
    <div className="card stack">
      <MarkdownViewer source={req.body} />
      <div className="stack" style={{ ["--gap" as string]: "8px" }}>
        <span className="label">受入基準</span>
        {req.acceptance_criteria.length ? (
          <ol className="criteria-list">
            {req.acceptance_criteria.map((c, i) => (
              <li key={i}><span className="num">{i + 1}</span><span>{c}</span><span /></li>
            ))}
          </ol>
        ) : (
          <Banner tone="warn" title="受入基準がありません">承認を依頼する前に、検証可能な受入基準を1件以上追加してください。</Banner>
        )}
      </div>
      <KeyValueList
        cols={2}
        items={[
          { label: "種類", value: <Tag square>{KIND_LABEL[req.kind]}</Tag> },
          { label: "優先度", value: <PriorityTag value={req.priority} /> },
          { label: "出典", value: req.source.split(" / ").map((s) => (s.startsWith("CR-") ? <IdLink key={s} id={s} to={paths.change(org, project, s)} /> : <span key={s}>{s} </span>)) },
          { label: "版", value: `v${req.version}` },
        ]}
      />
    </div>
  );

  const links = linksOf(req);

  return (
    <ProjectLayout active="requirements" trail={trail}>
      <PageHeader
        id={isNew ? undefined : req.id}
        title={isNew ? "要求を作成" : req.title}
        status={isNew ? undefined : <StatusBadge vocab={ARTIFACT_STATUS[req.status]} />}
        meta={isNew ? undefined : <><span className="small muted">v{req.version} · 更新 <Timestamp at={req.updated_at} /></span>{openFindings ? <span className="ai-count">未確認のAI所見 {openFindings}</span> : null}</>}
        actions={
          isNew ? null : (
            <>
              {editing ? null : <Button icon="edit" onClick={startEdit} disabled={req.status === "obsolete"} disabledReason="廃止された要求は編集できません">編集</Button>}
              <Button icon="sparkles" to={paths.requirementReview(org, project, req.id)}>AIでレビュー</Button>
              {next && !editing ? (
                <Button
                  variant="primary"
                  icon="arrowRight"
                  disabled={next.to === "pending" && req.acceptance_criteria.length === 0}
                  disabledReason="受入基準がないため承認を依頼できません"
                  onClick={() => (next.to === "pending" ? navigate(`${paths.requirementApproval(org, project)}?ids=${req.id}`) : (setReq((r) => ({ ...r, status: next.to })), toast({ kind: "success", message: `状態を「${ARTIFACT_FLOW_LABEL[next.to]}」にしました` })))}
                >
                  {next.label}
                </Button>
              ) : null}
              <MoreMenu
                items={[
                  { label: "リンクをコピー", icon: "link" },
                  { label: "履歴を表示", icon: "history", onClick: () => setTab("history") },
                  "separator",
                  { label: "廃止する", icon: "trash", danger: true, disabled: req.status === "obsolete", onClick: () => setObsoleteOpen(true) },
                ]}
              />
            </>
          )
        }
        tabs={
          isNew ? undefined : (
            <Tabs
              value={tab}
              onChange={setTab}
              tabs={[
                { value: "content", label: "内容" },
                { value: "links", label: "関連", count: links.length },
                { value: "ai", label: "AIレビュー", count: openFindings, icon: "sparkles" },
                { value: "history", label: "履歴", count: history.length },
                { value: "comments", label: "コメント", count: requirementComments.length },
              ]}
            />
          )
        }
      />
      {approvedNotice ? (
        <Banner tone="warn" title="承認済みの要求を編集しています" onClose={() => setApprovedNotice(false)}>
          保存すると状態が「変更中」に戻り、顧客の再承認が必要になります。関連する設計・テストへの影響も確認してください。
        </Banner>
      ) : null}
      <DetailLayout
        main={
          tab === "content" || isNew ? (
            editing ? contentEdit : contentView
          ) : tab === "links" ? (
            <div className="card stack">
              <div className="row between">
                <span className="section-title">設計・コード・テストへのリンク</span>
                <Button size="sm" variant="ghost" icon="trace" to={paths.trace(org, project)}>グラフで見る</Button>
              </div>
              <TraceLinkEditor links={links} candidates={linkCandidates} onChange={() => toast({ kind: "success", message: "リンクを更新しました" })} />
            </div>
          ) : tab === "ai" ? (
            <AiReviewPanel req={req} embedded />
          ) : tab === "history" ? (
            <div className="stack">
              <div className="card stack">
                <div className="row between">
                  <span className="section-title">版の差分</span>
                  {prev ? <Segmented value={diffVersion} onChange={setDiffVersion} options={[{ value: "prev", label: `v${prev.version} → v${history[history.length - 1].version}` }]} /> : null}
                </div>
                {prev ? <DiffViewer before={prev.body} after={history[history.length - 1].body} beforeLabel={`v${prev.version}`} afterLabel={`v${history[history.length - 1].version}`} /> : <p className="small muted">この要求の版は1つだけです。</p>}
              </div>
              <div className="card">
                <Timeline
                  items={[
                    ...history.slice().reverse().map((h) => ({ id: `v${h.version}`, actor: { kind: "human" as const, name: userById(h.by)?.name ?? "" }, action: `v${h.version} を保存`, at: h.at, detail: h.note, kind: "status" as const })),
                    ...findings.filter((f) => f.status !== "unconfirmed").map((f) => ({ id: f.id, actor: { kind: "human" as const, name: userById(f.decided_by)?.name ?? "" }, action: f.status === "adopted" ? "AI所見を採用" : "AI所見を却下", target: f.id, at: f.created_at })),
                    ...findings.slice(0, 1).map((f) => ({ id: `run-${f.id}`, actor: { kind: "ai" as const, name: "要求レビュー" }, action: `所見を${findings.length}件記録`, at: f.created_at })),
                  ]}
                />
              </div>
            </div>
          ) : (
            <div className="card">
              <CommentThread comments={requirementComments} />
            </div>
          )
        }
        side={
          <>
            <MetaSection title="状態">
              <StatusBadge vocab={ARTIFACT_STATUS[req.status]} />
              <StateFlow flow="requirement" current={ARTIFACT_FLOW_LABEL[req.status]} />
            </MetaSection>
            <MetaSection title="担当者">
              <Combobox options={users.filter((u) => u.roles.includes("アナリスト") || u.roles.includes("PM")).map((u) => ({ value: u.id, label: u.name, hint: u.roles.join("・") }))} value={[req.owner_id]} />
            </MetaSection>
            {isNew ? null : (
              <MetaSection title="承認">
                <ApprovalPanel
                  title="必要な承認"
                  approvers={approversOf(req)}
                  canDecide={req.status === "pending" && !isOwner}
                  blockedReason={req.status === "pending" && isOwner ? "あなたはこの要求の作成者のため承認できません" : undefined}
                  eligible={membersWithRole("PM", req.owner_id)}
                  onDecide={(d) => toast({ kind: "success", message: d === "approved" ? "承認しました" : "差し戻しました" })}
                />
                {req.status !== "pending" && req.status !== "approved" ? <p className="tiny muted">承認の依頼後に、承認者が判断できるようになります。</p> : null}
              </MetaSection>
            )}
            <MetaSection title="属性">
              <KeyValueList
                stacked
                items={[
                  { label: "データ分類", value: <DataClassBadge value={req.data_class} /> },
                  { label: "作成者", value: <UserChip user={userById(req.owner_id)} plain /> },
                  { label: "更新日時", value: <Timestamp at={req.updated_at} mode="absolute" /> },
                  { label: "関連する変更要求", value: req.source.includes("CR-") ? <IdLink id={req.source.match(/CR-\d+/)![0]} to={paths.change(org, project, req.source.match(/CR-\d+/)![0])} /> : <span className="muted">なし</span> },
                ]}
              />
            </MetaSection>
            {!isNew && openFindings ? (
              <div className="card tight row" style={{ ["--gap" as string]: "8px" }}>
                <Icon name="sparkles" className="text-special" />
                <span className="small grow">未確認のAI所見が {openFindings}件あります</span>
                <Button size="sm" onClick={() => setTab("ai")}>確認</Button>
              </div>
            ) : null}
          </>
        }
      />
      <ConfirmDialog open={leaveOpen} onClose={() => setLeaveOpen(false)} onConfirm={() => { setDirty(false); setEditing(false); if (isNew) navigate(paths.requirements(org, project)); }} title="保存していない変更があります" message="このまま移動すると、編集内容は失われます。" confirmLabel="破棄して移動" danger />
      <ConfirmDialog open={obsoleteOpen} onClose={() => setObsoleteOpen(false)} onConfirm={() => { setReq((r) => ({ ...r, status: "obsolete" })); toast({ kind: "success", message: `${req.id} を廃止しました` }); }} title="要求を廃止しますか" message={`${req.id} を廃止すると、トレーサビリティの集計から外れます。リンクは履歴として残ります。この操作は取り消せません。`} confirmLabel="廃止する" danger requireText={req.id} />
    </ProjectLayout>
  );
}

export { reqPath };
