// 画面ID: R-02 要求の詳細
// 要求の正本は Git リポジトリ（docs/requirements）。この画面は同期した内容・状態遷移・承認記録を閲覧する。
// 経営層は作成・レビュー・承認を代行しない。承認は承認者本人が正本または期限付き承認リンクで行う。
import { useState } from "react";
import { navigate, useScreenState } from "../../lib/router";
import { paths } from "../../lib/paths";
import type { Approver, Requirement } from "../../lib/types";
import { ARTIFACT_STATUS } from "../../lib/vocab";
import { aiFindings, requirementById, requirements, userById } from "../../mocks/core";
import { requirementComments } from "../../mocks/requirements";
import {
  ApprovalPanel,
  Banner,
  Button,
  CommentThread,
  DataClassBadge,
  DetailLayout,
  ErrorState,
  ExternalActor,
  Icon,
  IdLink,
  KeyValueList,
  MarkdownViewer,
  MetaSection,
  PageHeader,
  ProjectLayout,
  Skeleton,
  SoDNotice,
  SourceTag,
  StaleDataNotice,
  StateFlow,
  StatusBadge,
  Tabs,
  Tag,
  Timeline,
  Timestamp,
} from "../../ui";
import { AiReviewPanel } from "./R03_AiReview";
import {
  ApprovalRecords,
  ApprovedPin,
  ARTIFACT_FLOW_LABEL,
  ChainTable,
  chainOf,
  KIND_LABEL,
  OpenInSource,
  org,
  PriorityTag,
  project,
  reqFile,
  reqMeta,
  reqPath,
  reqSourceOf,
  versionsOf,
  ViewOnlyNote,
} from "./common";

/** 状態ごとの見本 */
function pick(id: string, state: string): Requirement {
  if (state === "approved") return requirementById("REQ-0001");
  if (state === "changing") return requirementById("REQ-0008");
  if (state === "pendingApproval" || state === "sod") return requirementById("REQ-0012");
  if (state === "returned") return requirementById("REQ-0005");
  if (state === "obsolete") return requirementById("REQ-0011");
  return requirements.find((r) => r.id === id) ?? requirementById("REQ-0007");
}

export function RequirementDetail({ id }: { id: string }) {
  const state = useScreenState();
  const req = pick(id, state);
  const [tab, setTab] = useState(state === "sod" || state === "returned" ? "approvals" : "content");

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

  const meta = reqMeta(req);
  const findings = aiFindings.filter((f) => f.target_id === req.id);
  const openFindings = findings.filter((f) => f.status === "unconfirmed").length;
  const versions = versionsOf(req);
  const links = chainOf(req);
  const current = meta.approvals.filter((a) => a.version === req.version);
  const panelApprovers: Approver[] = current.filter((a) => a.status !== "invalid").map((a) => ({ role: a.role, user_id: a.user_id, status: a.status === "returned" ? "returned" : a.status === "approved" ? "approved" : "pending", decided_at: a.at, comment: a.comment }));
  const invalid = meta.approvals.filter((a) => a.status === "invalid");
  const reapproval = meta.approved_version !== undefined && meta.approved_version !== req.version;
  const source = state === "stale" ? { ...reqSourceOf(req), synced_at: "2026-11-26T18:00:00+09:00", status: "delayed" as const } : reqSourceOf(req);
  const lastReturn = meta.transitions.filter((t) => t.via.includes("差戻し") || t.via.includes("変更を要求")).slice(-1)[0];

  return (
    <ProjectLayout active="requirements" trail={[{ label: "要求", to: paths.requirements(org, project) }, { label: req.id }]}>
      <PageHeader
        id={req.id}
        title={req.title}
        status={<StatusBadge vocab={ARTIFACT_STATUS[req.status]} />}
        meta={
          <>
            <span className="small muted">v{req.version}</span>
            {meta.approved_version ? <Tag tone={reapproval ? "warn" : "pass"} square icon="lock">承認版 v{meta.approved_version}</Tag> : null}
            {openFindings ? <span className="ai-count">未確認のAI所見 {openFindings}</span> : null}
            <SourceTag source={source} />
          </>
        }
        actions={
          <>
            <OpenInSource />
            <Button icon="compare" to={paths.requirementDiff(org, project, req.id)} disabled={versions.length < 2} disabledReason="比較できる版がありません">版を比較</Button>
            <Button icon="sparkles" to={paths.requirementReview(org, project, req.id)}>AIの所見</Button>
            {req.status === "pending" || req.status === "changing" ? (
              <Button variant="primary" icon="send" onClick={() => navigate(`${paths.requirementApproval(org, project)}?ids=${req.id}`)}>承認者に依頼</Button>
            ) : null}
          </>
        }
        tabs={
          <Tabs
            value={tab}
            onChange={setTab}
            tabs={[
              { value: "content", label: "内容" },
              { value: "links", label: "トレース", count: links.length },
              { value: "approvals", label: "承認と状態遷移", count: meta.approvals.length },
              { value: "ai", label: "AIの所見", count: openFindings, icon: "sparkles" },
              { value: "comments", label: "コメント", count: requirementComments.length },
            ]}
          />
        }
      />
      {state === "stale" ? <StaleDataNotice sources={[{ name: "要求の正本", source }]} /> : null}
      {reapproval ? (
        <Banner tone="warn" title={`承認版は v${meta.approved_version} のままです。v${req.version} は再承認待ちです`} action={<Button size="sm" to={paths.requirementDiff(org, project, req.id)}>差分を見る</Button>}>
          設計・テスト・ゲートは承認版 v{meta.approved_version} を基準に扱います。v{meta.approved_version} の内容と承認記録は証跡として保持されています。
        </Banner>
      ) : null}
      {state === "returned" && lastReturn ? (
        <Banner tone="fail" title="承認者から差し戻されました">
          {lastReturn.note ?? "理由は承認記録を確認してください。"}（<Timestamp at={lastReturn.at} mode="absolute" />・{lastReturn.via}）。修正版で再依頼されています。
        </Banner>
      ) : null}
      {req.status === "obsolete" ? <Banner tone="info" title="この要求は廃止されています">トレーサビリティの集計から外れています。リンクと承認記録は履歴として残っています。</Banner> : null}
      {invalid.length ? (
        <SoDNotice reason={<>作成者（<ExternalActor userId={req.owner_id} />）による承認が記録されましたが、作成者と承認者は別の人である必要があるため、承認として数えていません。</>} />
      ) : null}
      <DetailLayout
        main={
          tab === "content" ? (
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
                  <Banner tone="warn" title="受入基準がありません">受入基準がない要求は承認を依頼できません。担当者が正本で追加します。</Banner>
                )}
              </div>
              <KeyValueList
                cols={2}
                items={[
                  { label: "種類", value: <Tag square>{KIND_LABEL[req.kind]}</Tag> },
                  { label: "優先度", value: <PriorityTag value={req.priority} /> },
                  { label: "出典", value: req.source.split(" / ").map((s) => (s.startsWith("CR-") ? <IdLink key={s} id={s} to={paths.change(org, project, s)} /> : <span key={s}>{s} </span>)) },
                  { label: "版", value: `v${req.version}（版は ${versions.length} つ）` },
                  { label: "正本ファイル", value: <span className="mono small">{reqFile(req.id)}</span> },
                  { label: "関連する課題", value: meta.issue ? <span className="mono small">{meta.issue}</span> : <span className="muted">なし</span> },
                ]}
              />
              <ViewOnlyNote />
            </div>
          ) : tab === "links" ? (
            <div className="card stack">
              <div className="row between">
                <span className="section-title">要求から下流へのつながり</span>
                <Button size="sm" variant="ghost" icon="trace" to={paths.trace(org, project)}>グラフで見る</Button>
              </div>
              <p className="small muted">設計・コード・テスト・実行結果・検証・妥当性確認・リリース成果物へのリンクと、その記録場所・確定者です。AI 候補は確定するまで集計に含めません。</p>
              <ChainTable links={links} />
            </div>
          ) : tab === "approvals" ? (
            <div className="stack">
              <div className="card stack">
                <span className="section-title">承認の記録（版ごと）</span>
                <ApprovalRecords approvals={meta.approvals} />
              </div>
              <div className="card stack">
                <span className="section-title">状態遷移</span>
                <Timeline
                  items={meta.transitions
                    .slice()
                    .reverse()
                    .map((t, i) => ({
                      id: `t${i}`,
                      actor: { kind: "human" as const, name: `${requirementActor(t.by)}` },
                      action: `${t.from ? ARTIFACT_FLOW_LABEL[t.from] : "作成"} → ${ARTIFACT_FLOW_LABEL[t.to]}（v${t.version}）`,
                      at: t.at,
                      detail: [t.via, t.note].filter(Boolean).join("・"),
                      kind: "status" as const,
                    }))}
                />
              </div>
            </div>
          ) : tab === "ai" ? (
            <AiReviewPanel req={req} embedded />
          ) : (
            <div className="card stack">
              <p className="tiny muted">正本（GitHub PR #{meta.issue?.slice(1) ?? "—"} のコメント）から同期しています。返信は正本で行います。</p>
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
            <MetaSection title="承認版の固定">
              <ApprovedPin version={meta.approved_version} at={meta.approved_at} hash={meta.approved_hash} />
            </MetaSection>
            <MetaSection title="担当">
              <KeyValueList
                stacked
                items={[
                  { label: "担当者（作成者）", value: <ExternalActor userId={req.owner_id} role="アナリスト" /> },
                  { label: "更新日時", value: <Timestamp at={req.updated_at} mode="absolute" /> },
                ]}
              />
            </MetaSection>
            <MetaSection title={`現在の版（v${req.version}）の承認`}>
              {panelApprovers.length ? (
                <ApprovalPanel title="必要な承認" approvers={panelApprovers} canDecide={false} />
              ) : (
                <p className="small muted">まだ承認を依頼していません。</p>
              )}
              <p className="tiny muted"><Icon name="info" size={12} /> 承認は承認者本人が正本のレビューまたは期限付き承認リンクで行います。経営層は代行しません。</p>
            </MetaSection>
            <MetaSection title="属性">
              <KeyValueList
                stacked
                items={[
                  { label: "データ分類", value: <DataClassBadge value={req.data_class} /> },
                  { label: "関連する変更要求", value: req.source.includes("CR-") ? <IdLink id={req.source.match(/CR-\d+/)![0]} to={paths.change(org, project, req.source.match(/CR-\d+/)![0])} /> : <span className="muted">なし</span> },
                ]}
              />
            </MetaSection>
          </>
        }
      />
    </ProjectLayout>
  );
}

function requirementActor(id: string) {
  const u = userById(id);
  return u ? `${u.name}${u.kind === "external" ? "（顧客）" : ""}` : id;
}

export { reqPath };
