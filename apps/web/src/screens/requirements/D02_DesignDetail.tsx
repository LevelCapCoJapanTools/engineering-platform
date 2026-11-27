// 画面ID: D-02 設計・ADR の詳細
import { useState } from "react";
import { useScreenState } from "../../lib/router";
import { paths } from "../../lib/paths";
import type { AiFinding, Approver, Design } from "../../lib/types";
import { ARTIFACT_STATUS } from "../../lib/vocab";
import { designById, designs, requirements, userById } from "../../mocks/core";
import { designBodies, designComments } from "../../mocks/requirements";
import {
  AIFindingCard,
  AISectionHead,
  ApprovalPanel,
  Button,
  CommentThread,
  DetailLayout,
  ErrorState,
  KeyValueList,
  MarkdownEditor,
  MarkdownViewer,
  membersWithRole,
  MetaSection,
  PageHeader,
  ProjectLayout,
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
import type { TraceLink } from "../../ui";
import { ARTIFACT_FLOW_LABEL, DESIGN_KIND, designPath, org, project, requirementCandidates } from "./common";

const NEW_DESIGN: Design = { id: "ADR-0005", title: "", kind: "adr", status: "draft", requirement_ids: [], author_id: "u-sato", reviewer_ids: [], updated_at: "2026-11-27T10:30:00+09:00" };

const ADR_TEMPLATE = "## 背景\n\n## 決定\n\n## 選択肢\n\n## 結果\n";

function bodyOf(d: Design) {
  return designBodies[d.id] ?? `## 背景\n${d.title}に関する検討。対象の要求: ${d.requirement_ids.join("、")}。\n\n## 決定\n本書のとおり設計する。\n\n## 結果\n- 関連する要求の受入基準を満たす\n- 詳細は各モジュールの設計を参照`;
}

function designFindings(d: Design): AiFinding[] {
  return [
    { id: "AIF-310", kind: "missing", severity: "medium", confidence: 0.77, target_id: d.id, excerpt: "失敗の通知先は REQ-0003 の受入基準で定める", highlight: "通知先", explanation: "REQ-0003 の受入基準「失敗時は担当者にメールで通知される」に対し、設計側で通知の仕組み（送信元、宛先の管理方法）が記述されていません。", suggestion: "「結果」に、通知は運用担当グループのメーリングリストへ送信し、宛先は設定画面で管理する旨を追加する。", model: "model-family-a / 2026-10", template_version: "design-review@0.8.0", status: "unconfirmed", created_at: "2026-11-21T09:30:00+09:00" },
    { id: "AIF-311", kind: "conflict", severity: "low", confidence: 0.58, target_id: d.id, excerpt: "送信済みファイルは 30 日間保持し", highlight: "30 日間", explanation: "REQ-0006（操作ログを7年間保存）と保持期間の考え方が異なります。連携ファイルが監査対象かどうかを明確にしてください。", model: "model-family-a / 2026-10", template_version: "design-review@0.8.0", status: "unconfirmed", created_at: "2026-11-21T09:30:00+09:00" },
  ];
}

export function DesignDetail({ id }: { id: string }) {
  const state = useScreenState();
  const toast = useToast();
  const isNew = id === "new";
  const base = isNew ? NEW_DESIGN : state === "approved" ? designById("ADR-0004") : designs.find((d) => d.id === id) ?? designById("ADR-0003");
  const [design, setDesign] = useState(base);
  const [editing, setEditing] = useState(isNew || state === "editing");
  const [title, setTitle] = useState(base.title);
  const [body, setBody] = useState(isNew ? ADR_TEMPLATE : bodyOf(base));
  const [tab, setTab] = useState("content");
  const [reviewRunning, setReviewRunning] = useState(false);
  const isAuthor = state === "sod" || design.author_id === "u-sato";

  if (state === "loading") {
    return (
      <ProjectLayout active="design" trail={[{ label: "設計・ADR", to: paths.designs(org, project) }, { label: "読み込み中" }]}>
        <Skeleton variant="detail" />
      </ProjectLayout>
    );
  }
  if (state === "error") {
    return (
      <ProjectLayout active="design" trail={[{ label: "設計・ADR", to: paths.designs(org, project) }, { label: id }]}>
        <ErrorState title="設計を読み込めませんでした" />
      </ProjectLayout>
    );
  }

  const links: TraceLink[] = [
    ...design.requirement_ids.map((rid) => ({ id: rid, title: requirements.find((r) => r.id === rid)?.title ?? "", kind: "要求", relation: "refines" })),
    ...(design.id === "ADR-0003" ? [{ id: "REQ-0006", title: requirements.find((r) => r.id === "REQ-0006")!.title, kind: "要求", relation: "refines", ai: true, confidence: 0.62 }] : []),
  ];
  const findings = design.status === "approved" ? [] : designFindings(design);
  const approvers: Approver[] = design.status === "approved"
    ? design.reviewer_ids.map((rid) => ({ role: "設計者" as const, user_id: rid, status: "approved" as const, decided_at: design.updated_at, comment: "要求との対応を確認しました。" }))
    : [{ role: "設計者", user_id: design.reviewer_ids[0] ?? "u-sato", status: design.status === "inReview" || design.status === "pending" ? "pending" : "draft" }];
  const canDecide = (design.status === "inReview" || design.status === "pending") && !isAuthor && design.reviewer_ids.includes("u-sato");

  return (
    <ProjectLayout active="design" trail={[{ label: "設計・ADR", to: paths.designs(org, project) }, { label: isNew ? "新規作成" : design.id }]}>
      <PageHeader
        id={isNew ? undefined : design.id}
        title={isNew ? "設計・ADR を作成" : design.title}
        status={isNew ? undefined : <StatusBadge vocab={ARTIFACT_STATUS[design.status]} />}
        meta={isNew ? undefined : <><Tag square>{DESIGN_KIND[design.kind]}</Tag><span className="small muted">作成 {userById(design.author_id)?.name} · 更新 <Timestamp at={design.updated_at} /></span></>}
        actions={
          isNew ? null : (
            <>
              {editing ? (
                <Button variant="primary" icon="check" onClick={() => { setDesign((d) => ({ ...d, title })); setEditing(false); toast({ kind: "success", message: "保存しました" }); }}>保存</Button>
              ) : (
                <Button icon="edit" onClick={() => setEditing(true)}>編集</Button>
              )}
              <Button icon="sparkles" loading={reviewRunning} onClick={() => { setReviewRunning(true); window.setTimeout(() => { setReviewRunning(false); setTab("review"); }, 1200); }}>AIでレビュー</Button>
              {design.status === "draft" || design.status === "changing" ? (
                <Button variant="primary" icon="arrowRight" onClick={() => { setDesign((d) => ({ ...d, status: "inReview" })); toast({ kind: "success", message: "レビューを依頼しました" }); }}>レビュー依頼</Button>
              ) : null}
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
                { value: "review", label: "レビュー", count: findings.filter((f) => f.status === "unconfirmed").length + designComments.length },
                { value: "history", label: "履歴" },
              ]}
            />
          )
        }
      />
      <DetailLayout
        main={
          tab === "content" || isNew ? (
            <div className="card stack">
              {editing ? (
                <>
                  <TextField label="タイトル" required value={title} onChange={setTitle} placeholder="例: 基幹連携はファイル連携とする" />
                  <MarkdownEditor label="本文" required value={body} onChange={setBody} suggestions={requirementCandidates} minHeight={280} />
                  {isNew ? (
                    <div className="row end">
                      <Button variant="ghost" to={paths.designs(org, project)}>キャンセル</Button>
                      <Button variant="primary" icon="check" onClick={() => toast({ kind: "success", message: "ADR-0005 を作成しました" })}>作成する</Button>
                    </div>
                  ) : null}
                </>
              ) : design.kind === "adr" ? (
                ["背景", "決定", "選択肢", "結果"].map((h) => {
                  const m = body.split(/^## /m).find((s) => s.startsWith(h));
                  if (!m) return null;
                  return (
                    <div key={h} className="adr-section">
                      <h3>{h}</h3>
                      <MarkdownViewer source={m.slice(h.length).trim()} />
                    </div>
                  );
                })
              ) : (
                <MarkdownViewer source={body} collapsible />
              )}
            </div>
          ) : tab === "links" ? (
            <div className="card stack">
              <span className="section-title">要求への対応</span>
              <p className="small muted">点線は AI の候補です。確定するまでトレーサビリティに数えません。</p>
              <TraceLinkEditor links={links} candidates={requirementCandidates} onChange={() => toast({ kind: "success", message: "要求への対応を更新しました" })} />
            </div>
          ) : tab === "review" ? (
            <div className="stack">
              {reviewRunning ? <div className="card row"><span className="spinner" /> <span className="muted">AIが要求への対応漏れと矛盾を確認しています…</span></div> : null}
              <AISectionHead count={findings.length} note="要求への対応漏れ・矛盾の候補。判定には使われません" />
              {findings.length ? findings.map((f) => <AIFindingCard key={f.id} finding={f} />) : <p className="small muted">AIの所見はありません。</p>}
              <div className="card stack">
                <span className="section-title">レビューコメント</span>
                <CommentThread comments={designComments} />
              </div>
            </div>
          ) : (
            <div className="card">
              <Timeline
                items={[
                  { id: "h3", actor: { kind: "ai", name: "設計レビュー" }, action: "所見を2件記録", at: "2026-11-21T09:30:00+09:00" },
                  { id: "h2", actor: { kind: "human", name: userById(design.author_id)?.name ?? "" }, action: "レビューを依頼", at: "2026-11-20T10:00:00+09:00" },
                  { id: "h1", actor: { kind: "human", name: userById(design.author_id)?.name ?? "" }, action: "作成", at: "2026-11-18T15:00:00+09:00" },
                ]}
              />
            </div>
          )
        }
        side={
          <>
            <MetaSection title="状態">
              <StatusBadge vocab={ARTIFACT_STATUS[design.status]} />
              <StateFlow flow="requirement" current={ARTIFACT_FLOW_LABEL[design.status]} />
            </MetaSection>
            {isNew ? null : (
              <MetaSection title="レビューと承認">
                <ApprovalPanel
                  title="設計者・テックリードの承認"
                  approvers={approvers}
                  canDecide={canDecide}
                  blockedReason={isAuthor && design.status !== "approved" ? "あなたはこの設計の作成者のため承認できません" : undefined}
                  eligible={membersWithRole("設計者", "u-sato").concat(membersWithRole("PM", "u-sato"))}
                  onDecide={(d) => { setDesign((x) => ({ ...x, status: d === "approved" ? "approved" : "draft" })); toast({ kind: "success", message: d === "approved" ? "承認しました" : "差し戻しました" }); }}
                />
              </MetaSection>
            )}
            <MetaSection title="属性">
              <KeyValueList
                stacked
                items={[
                  { label: "種類", value: <Tag square>{DESIGN_KIND[design.kind]}</Tag> },
                  { label: "作成者", value: <UserChip user={userById(design.author_id)} plain /> },
                  { label: "レビュー者", value: design.reviewer_ids.length ? design.reviewer_ids.map((rid) => <UserChip key={rid} user={userById(rid)} plain />) : <span className="muted">未割当</span> },
                  { label: "対応する要求", value: <span className="row" style={{ ["--gap" as string]: "6px" }}>{design.requirement_ids.map((r) => <a key={r} className="id-link" href={`#${paths.requirement(org, project, r)}`}>{r}</a>)}</span> },
                ]}
              />
            </MetaSection>
          </>
        }
      />
    </ProjectLayout>
  );
}

export { designPath };
