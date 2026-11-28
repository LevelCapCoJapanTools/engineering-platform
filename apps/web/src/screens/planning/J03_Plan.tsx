// 画面ID: J-03 プロジェクト計画
// 計画は課題・計画管理と文書リポジトリが正本。ここでは同期した計画、当初ベースラインと改訂履歴、顧客との合意を確認する。
// 編集は正本で行い、本サービスでは計画を上書きしない。
import { useState } from "react";
import {
  Banner,
  Button,
  ChecklistPanel,
  DetailLayout,
  ErrorState,
  ExternalActor,
  Icon,
  KeyValueList,
  MarkdownViewer,
  MetaSection,
  PageHeader,
  ProjectLayout,
  Section,
  Skeleton,
  StatusBadge,
  Tabs,
  Tag,
  Timestamp,
  cx,
} from "../../ui";
import { Link, useScreenState } from "../../lib/router";
import { paths } from "../../lib/paths";
import { ARTIFACT_STATUS } from "../../lib/vocab";
import { formatDate, daysBetween } from "../../lib/format";
import { customerAgreements, DOC_SOURCE, PLAN_SOURCE, planRevisions, planSections } from "../../mocks/planning";
import type { PlanRevision } from "../../mocks/planning";
import { DecisionLink, SourceBar, orgOf, projectOf } from "./shared";

export const J03_STATES = ["既定（改訂案あり）", "改訂案なし", "必須項目の不足", "読み込み中", "取得失敗"];

const KIND_LABEL: Record<PlanRevision["kind"], { label: string; tone: "info" | "pass" | "warn" }> = {
  baseline: { label: "当初ベースライン", tone: "info" },
  revision: { label: "承認済み改訂", tone: "pass" },
  pending: { label: "改訂案（未承認）", tone: "warn" },
};

export function J03Plan({ params }: { params: Record<string, string> }) {
  const state = useScreenState();
  const org = orgOf(params);
  const pr = projectOf(params);
  const [tab, setTab] = useState("plan");
  const revisions = state === "改訂案なし" ? planRevisions.filter((r) => r.kind !== "pending") : planRevisions;
  const pending = revisions.find((r) => r.kind === "pending");
  const current = revisions.find((r) => r.kind !== "pending")!;
  const baseline = revisions.find((r) => r.kind === "baseline")!;
  const sections = state === "必須項目の不足" ? planSections : planSections.map((s) => (s.key === "versioning" ? { ...s, body: "- main は保護し、PR とゲート A〜D の通過を必須とする\n- リリースは `vX.Y.Z` のタグを付け、変更しない", missing: undefined } : s));
  const missing = sections.filter((s) => s.required && !s.body.trim());
  const checklist = sections.map((s) => ({
    id: s.key,
    title: s.title,
    state: (s.body.trim() ? "ok" : s.required ? "ng" : "pending") as "ok" | "ng" | "pending",
    detail: s.body.trim() ? "記入済み（正本）" : s.required ? "必須項目が未記入" : "任意項目",
    actor: "ci" as const,
  }));

  return (
    <ProjectLayout org={org} project={pr} active="plan" trail={[{ label: "プロジェクト計画" }]}>
      <PageHeader
        title="プロジェクト計画"
        id={current.id}
        status={ARTIFACT_STATUS.approved}
        description="正本（課題・計画管理と文書リポジトリ）から同期した計画です。当初ベースラインと承認済みの改訂を別々に残します。"
        actions={<Button icon="calendar" to={paths.schedule(org, pr)}>スケジュール</Button>}
      />
      {state === "読み込み中" ? (
        <Skeleton variant="detail" />
      ) : state === "取得失敗" ? (
        <ErrorState />
      ) : (
        <>
          <SourceBar source={PLAN_SOURCE} note="マイルストーン・作業分解・担当" />
          {pending ? (
            <Banner tone="warn" title={`${pending.label} が承認待ちです`} action={<Button size="sm" variant="primary" to={paths.decision(org, "DEC-0033")}>経営判断を開く</Button>}>
              {pending.reason}。計画の改訂は PM が作成し、顧客の合意で確定します。経営層は顧客への説明の要否を判断します。
            </Banner>
          ) : null}
          {missing.length ? (
            <Banner tone="warn" title={`必須項目が ${missing.length} 件未記入です`}>{missing.map((m) => m.title).join("、")}。正本の計画書で記入されると自動で反映されます。</Banner>
          ) : null}
          <DetailLayout
            main={
              <>
                <Tabs value={tab} onChange={setTab} tabs={[{ value: "plan", label: "計画の内容" }, { value: "revisions", label: "ベースラインと改訂", count: revisions.length }, { value: "agreements", label: "顧客との合意", count: customerAgreements.length }]} />
                {tab === "plan" ? (
                  <>
                    <nav className="pl-plan-toc" aria-label="計画のセクション">
                      {sections.map((s) => (
                        <a key={s.key} href={`#plan-${s.key}`} onClick={(e) => { e.preventDefault(); document.getElementById(`plan-${s.key}`)?.scrollIntoView({ behavior: "smooth" }); }} className={cx(s.required && !s.body.trim() && "ng")}>
                          {s.required && !s.body.trim() ? <Icon name="alert" size={11} /> : null}
                          {s.title}
                        </a>
                      ))}
                    </nav>
                    {sections.map((s) => (
                      <section key={s.key} id={`plan-${s.key}`} className="card pl-plan-section stack" style={{ ["--gap" as string]: "12px" }}>
                        <div className="row between">
                          <h2 className="section-title">{s.title}</h2>
                          <span className="row" style={{ ["--gap" as string]: "6px" }}>
                            {s.required ? <Tag square>必須</Tag> : <Tag square>任意</Tag>}
                            {!s.body.trim() && s.required ? <Tag tone="warn" icon="alert">未記入</Tag> : null}
                          </span>
                        </div>
                        {s.body.trim() ? <MarkdownViewer source={s.body} /> : <p className="small muted">{s.missing ?? "未記入です"}</p>}
                      </section>
                    ))}
                  </>
                ) : tab === "revisions" ? (
                  <Section title="ベースラインと改訂の履歴" sub="上書きせず版として保存します。当初の期限と遅延の履歴は消えません" flush>
                    <div className="table-wrap">
                      <table className="table">
                        <thead><tr><th>版</th><th>区分</th><th>最終受入</th><th>理由</th><th>作成</th><th>承認</th></tr></thead>
                        <tbody>
                          {revisions.map((r) => (
                            <tr key={r.id}>
                              <td><span className="strong">{r.label}</span><div className="tiny muted mono">{r.id}</div></td>
                              <td><Tag square tone={KIND_LABEL[r.kind].tone}>{KIND_LABEL[r.kind].label}</Tag></td>
                              <td className="nowrap">
                                {formatDate(r.end_date)}
                                {r.id !== baseline.id ? <div className="tiny muted">当初比 {daysBetween(baseline.end_date, r.end_date) > 0 ? "+" : ""}{daysBetween(baseline.end_date, r.end_date)}日</div> : null}
                              </td>
                              <td className="small">
                                {r.reason}
                                <ul className="tiny muted" style={{ margin: "4px 0 0", paddingLeft: 16 }}>{r.changes.map((c) => <li key={c}>{c}</li>)}</ul>
                              </td>
                              <td><ExternalActor userId={r.requested_by} /><div className="tiny muted"><Timestamp at={r.at} mode="absolute" /></div></td>
                              <td>{r.approved_by ? <><ExternalActor userId={r.approved_by} role="顧客" /><div className="tiny muted">{r.approved_at ? <Timestamp at={r.approved_at} mode="absolute" /> : null}</div></> : <StatusBadge vocab={ARTIFACT_STATUS.pending} size="sm" />}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Section>
                ) : (
                  <Section title="顧客との合意" sub="決定者・日時・内容を記録し、計画の版や変更要求に結び付けます" flush>
                    <div className="table-wrap">
                      <table className="table">
                        <thead><tr><th>日時</th><th>決定者</th><th>内容</th><th>対象</th><th>記録元</th></tr></thead>
                        <tbody>
                          {customerAgreements.map((a) => (
                            <tr key={a.id}>
                              <td className="nowrap small"><Timestamp at={a.at} mode="absolute" /></td>
                              <td><ExternalActor userId={a.decider} role="顧客" /></td>
                              <td>{a.content}</td>
                              <td className="mono small">{a.link.startsWith("CR") ? <Link to={paths.change(org, pr, a.link)}>{a.link}</Link> : a.link}</td>
                              <td className="small">{a.source.startsWith("MTG") ? <Link to={paths.meeting(org, pr, a.source)}>{a.source}</Link> : a.source}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Section>
                )}
              </>
            }
            side={
              <>
                <MetaSection title="現在の計画">
                  <KeyValueList
                    stacked
                    items={[
                      { label: "有効な版", value: `${current.label}（${current.id}）` },
                      { label: "当初の最終受入", value: formatDate(baseline.end_date) },
                      { label: "現在の最終受入", value: formatDate(current.end_date) },
                      { label: "作成者（PM）", value: <ExternalActor userId={current.requested_by} /> },
                      { label: "出典", value: "SOW v3（SOW-3）" },
                    ]}
                  />
                </MetaSection>
                {pending ? (
                  <MetaSection title="関連する経営判断">
                    <DecisionLink org={org} id="DEC-0033" />
                  </MetaSection>
                ) : null}
                <MetaSection title="必須項目の充足">
                  <ChecklistPanel items={checklist} />
                </MetaSection>
                <MetaSection title="正本" defaultOpen={false}>
                  <div className="stack" style={{ ["--gap" as string]: "8px" }}>
                    <SourceBar source={PLAN_SOURCE} openLabel="計画管理で開く" />
                    <SourceBar source={DOC_SOURCE} openLabel="計画書を開く" />
                  </div>
                </MetaSection>
              </>
            }
          />
        </>
      )}
    </ProjectLayout>
  );
}
