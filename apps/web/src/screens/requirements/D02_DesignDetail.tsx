// 画面ID: D-02 設計・ADR の詳細
// 正本は Git リポジトリ（docs/design）と設計 PR のレビュー。ここでは代替案・判断理由・結果・改訂・レビュー・承認を閲覧する。
import { useState } from "react";
import { useScreenState } from "../../lib/router";
import { paths } from "../../lib/paths";
import type { AiFinding, Approver, Design } from "../../lib/types";
import { ARTIFACT_STATUS } from "../../lib/vocab";
import { designById, designs, requirements, userById } from "../../mocks/core";
import { designBodies, designComments, designMeta, reqSource } from "../../mocks/requirements";
import type { DesignAlternative, DesignReview } from "../../mocks/requirements";
import {
  AIFindingCard,
  AISectionHead,
  ApprovalPanel,
  Banner,
  CommentThread,
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
  StateFlow,
  StatusBadge,
  Tabs,
  Tag,
  Timeline,
  Timestamp,
} from "../../ui";
import { ARTIFACT_FLOW_LABEL, ChainTable, DESIGN_KIND, designFile, designPath, OpenInSource, org, project, reqPath, ViewOnlyNote } from "./common";
import type { ChainLink } from "./common";

function bodyOf(d: Design) {
  return designBodies[d.id] ?? `## 背景\n${d.title}に関する検討。対象の要求: ${d.requirement_ids.join("、")}。\n\n## 決定\n本書のとおり設計する。\n\n## 結果\n- 関連する要求の受入基準を満たす\n- 詳細は各モジュールの設計を参照`;
}

function designFindings(d: Design): AiFinding[] {
  return [
    { id: "AIF-310", kind: "missing", severity: "medium", confidence: 0.77, target_id: d.id, excerpt: "失敗の通知先は REQ-0003 の受入基準で定める", highlight: "通知先", explanation: "REQ-0003 の受入基準「失敗時は担当者にメールで通知される」に対し、設計側で通知の仕組み（送信元、宛先の管理方法）が記述されていません。", suggestion: "「結果」に、通知は運用担当グループのメーリングリストへ送信し、宛先は設定画面で管理する旨を追加する。", model: "model-family-a / 2026-10", template_version: "design-review@0.8.0", status: "unconfirmed", created_at: "2026-11-21T09:30:00+09:00" },
    { id: "AIF-311", kind: "conflict", severity: "low", confidence: 0.58, target_id: d.id, excerpt: "送信済みファイルは 30 日間保持し", highlight: "30 日間", explanation: "REQ-0006（操作ログを7年間保存）と保持期間の考え方が異なります。連携ファイルが監査対象かどうかを明確にしてください。", model: "model-family-a / 2026-10", template_version: "design-review@0.8.0", status: "unconfirmed", created_at: "2026-11-21T09:30:00+09:00" },
  ];
}

const REVIEW_RESULT: Record<DesignReview["result"], { label: string; tone: "pass" | "fail" | "neutral" }> = {
  approved: { label: "承認", tone: "pass" },
  changesRequested: { label: "変更を要求", tone: "fail" },
  commented: { label: "コメント", tone: "neutral" },
};

function defaultAlternatives(): DesignAlternative[] {
  return [{ name: "本書の方式", pros: "要求の受入基準を満たす", cons: "—", chosen: true }];
}

export function DesignDetail({ id }: { id: string }) {
  const state = useScreenState();
  const base = state === "approved" ? designById("ADR-0004") : designs.find((d) => d.id === id) ?? designById("ADR-0003");
  const design = base;
  const [tab, setTab] = useState(state === "changesRequested" || state === "sod" ? "reviews" : "content");

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

  const meta = designMeta[design.id] ?? {};
  const body = bodyOf(design);
  const alternatives = meta.alternatives ?? defaultAlternatives();
  const reviews: DesignReview[] = state === "sod"
    ? [{ reviewer_id: design.author_id, at: "2026-11-22T09:00:00+09:00", result: "approved", via: `GitHub PR #${meta.pr ?? "—"} レビュー`, note: "作成者本人の承認" }, ...(meta.reviews ?? [])]
    : meta.reviews ?? design.reviewer_ids.map((rid) => ({ reviewer_id: rid, at: design.updated_at, result: design.status === "approved" ? "approved" as const : "commented" as const, via: "GitHub PR レビュー" }));
  const revisions = meta.revisions ?? [{ version: 1, at: design.updated_at, by: design.author_id, note: "作成" }];
  const findings = design.status === "approved" ? [] : designFindings(design);
  const approvers: Approver[] = design.reviewer_ids.map((rid) => {
    const r = reviews.find((x) => x.reviewer_id === rid);
    return { role: "設計者" as const, user_id: rid, status: r?.result === "approved" ? "approved" as const : r?.result === "changesRequested" ? "returned" as const : "pending" as const, decided_at: r?.at, comment: r?.note };
  });
  const changesRequested = state === "changesRequested" || reviews.some((r) => r.result === "changesRequested");
  const links: ChainLink[] = design.requirement_ids.map((rid) => ({ id: rid, title: requirements.find((r) => r.id === rid)?.title ?? "", stage: "設計", prov: { via: "trace/edges.yaml", provider: "github", confirmed_by: design.author_id, confirmed_at: design.updated_at }, to: reqPath(rid) }));
  if (design.id === "ADR-0003") links.push({ id: "REQ-0006", title: requirements.find((r) => r.id === "REQ-0006")!.title, stage: "設計", ai: true, confidence: 0.62, to: reqPath("REQ-0006") });

  return (
    <ProjectLayout active="design" trail={[{ label: "設計・ADR", to: paths.designs(org, project) }, { label: design.id }]}>
      <PageHeader
        id={design.id}
        title={design.title}
        status={<StatusBadge vocab={ARTIFACT_STATUS[design.status]} />}
        meta={
          <>
            <Tag square>{DESIGN_KIND[design.kind]}</Tag>
            <span className="small muted">v{revisions[revisions.length - 1].version}</span>
            <SourceTag source={reqSource(designFile(design.id))} />
          </>
        }
        actions={<OpenInSource label="設計 PR を開く" />}
        tabs={
          <Tabs
            value={tab}
            onChange={setTab}
            tabs={[
              { value: "content", label: "判断の内容" },
              { value: "links", label: "要求への対応", count: links.length },
              { value: "reviews", label: "レビューと承認", count: reviews.length },
              { value: "ai", label: "AIの所見", count: findings.filter((f) => f.status === "unconfirmed").length, icon: "sparkles" },
              { value: "history", label: "改訂", count: revisions.length },
            ]}
          />
        }
      />
      {changesRequested && state !== "sod" ? (
        <Banner tone="warn" title="レビューで変更が要求されています">設計者が正本で修正し、再レビューを受けるまで承認されません。</Banner>
      ) : null}
      {state === "sod" ? (
        <SoDNotice reason={<>作成者（<ExternalActor userId={design.author_id} />）本人のレビュー承認は、承認として数えていません。別の設計者またはテックリードの承認が必要です。</>} />
      ) : null}
      <DetailLayout
        main={
          tab === "content" ? (
            <div className="stack">
              <div className="card stack">
                {["背景", "決定"].map((h) => {
                  const m = body.split(/^## /m).find((s) => s.startsWith(h));
                  if (!m) return null;
                  return (
                    <div key={h} className="adr-section">
                      <h3>{h}</h3>
                      <MarkdownViewer source={m.slice(h.length).trim()} />
                    </div>
                  );
                })}
              </div>
              <div className="card flush">
                <div className="card-header"><span className="section-title">代替案</span></div>
                <div className="table-wrap">
                  <table className="table compact">
                    <thead><tr><th>案</th><th>長所</th><th>短所</th><th>採否</th></tr></thead>
                    <tbody>
                      {alternatives.map((a) => (
                        <tr key={a.name}>
                          <td className="strong small">{a.name}</td>
                          <td className="small">{a.pros}</td>
                          <td className="small">{a.cons}</td>
                          <td>{a.chosen ? <Tag tone="pass" square icon="check">採用</Tag> : <Tag square>不採用</Tag>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="card stack">
                <div className="adr-section"><h3>判断理由</h3><p className="small">{meta.reason ?? "本書の「決定」を参照。"}</p></div>
                <div className="adr-section"><h3>結果（受け入れる影響）</h3><p className="small">{meta.outcome ?? "関連する要求の受入基準を満たす。"}</p></div>
                <ViewOnlyNote />
              </div>
            </div>
          ) : tab === "links" ? (
            <div className="card stack">
              <span className="section-title">要求への対応</span>
              <p className="small muted">記録された場所と確定者を示します。AI の候補は確定するまでトレーサビリティに数えません。</p>
              <ChainTable links={links} />
            </div>
          ) : tab === "reviews" ? (
            <div className="stack">
              <div className="card flush">
                <div className="card-header"><span className="section-title">レビューの記録</span></div>
                <div className="table-wrap">
                  <table className="table compact">
                    <thead><tr><th>レビュー者</th><th>結果</th><th>記録された場所</th><th>日時</th></tr></thead>
                    <tbody>
                      {reviews.map((r, i) => (
                        <tr key={i}>
                          <td><ExternalActor userId={r.reviewer_id} /></td>
                          <td>
                            <Tag tone={r.reviewer_id === design.author_id ? "fail" : REVIEW_RESULT[r.result].tone} square>{r.reviewer_id === design.author_id ? "無効（作成者）" : REVIEW_RESULT[r.result].label}</Tag>
                            {r.note ? <div className="tiny muted" style={{ marginTop: 4 }}>{r.note}</div> : null}
                          </td>
                          <td className="tiny muted">{r.via}</td>
                          <td className="tiny muted"><Timestamp at={r.at} mode="absolute" /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="card stack">
                <span className="section-title">レビューコメント（正本から同期）</span>
                <CommentThread comments={designComments} />
              </div>
            </div>
          ) : tab === "ai" ? (
            <div className="stack">
              <AISectionHead count={findings.length} note="要求への対応漏れ・矛盾の候補。判定には使われません" />
              {findings.length ? findings.map((f) => <AIFindingCard key={f.id} finding={f} />) : <p className="small muted">AIの所見はありません。</p>}
            </div>
          ) : (
            <div className="card">
              <Timeline
                items={revisions
                  .slice()
                  .reverse()
                  .map((r) => ({ id: `v${r.version}`, actor: { kind: "human" as const, name: nameOf(r.by) }, action: `v${r.version} を保存`, at: r.at, detail: r.note, kind: "status" as const }))}
              />
            </div>
          )
        }
        side={
          <>
            <MetaSection title="状態">
              <StatusBadge vocab={ARTIFACT_STATUS[design.status]} />
              <StateFlow flow="design" current={ARTIFACT_FLOW_LABEL[design.status]} />
            </MetaSection>
            <MetaSection title="承認">
              <ApprovalPanel title="設計者・テックリードの承認" approvers={approvers} canDecide={false} />
              <p className="tiny muted"><Icon name="info" size={12} /> 承認は正本の設計 PR のレビューで行われます。作成者本人の承認は数えません。</p>
            </MetaSection>
            <MetaSection title="属性">
              <KeyValueList
                stacked
                items={[
                  { label: "種類", value: <Tag square>{DESIGN_KIND[design.kind]}</Tag> },
                  { label: "作成者", value: <ExternalActor userId={design.author_id} role="設計者" /> },
                  { label: "対応する要求", value: <span className="row" style={{ ["--gap" as string]: "6px" }}>{design.requirement_ids.map((r) => <IdLink key={r} id={r} to={reqPath(r)} />)}</span> },
                  { label: "正本", value: <span className="mono tiny">{designFile(design.id)}</span> },
                  { label: "設計 PR", value: meta.pr ? <span className="mono small">#{meta.pr}</span> : <span className="muted">—</span> },
                  { label: "更新日時", value: <Timestamp at={design.updated_at} mode="absolute" /> },
                ]}
              />
            </MetaSection>
          </>
        }
      />
    </ProjectLayout>
  );
}

function nameOf(id: string) {
  return userById(id)?.name ?? id;
}

export { designPath };
