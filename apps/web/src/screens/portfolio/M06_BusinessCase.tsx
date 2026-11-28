// 画面ID: M-06 事業ケースの詳細・判断
import { useState } from "react";
import { useRoute, useScreenState } from "../../lib/router";
import { ORG, paths } from "../../lib/paths";
import { CASE_STATUS } from "../../lib/vocab";
import type { CaseStatus } from "../../lib/vocab";
import { formatDate, yen, yenM } from "../../lib/format";
import { businessCases, decisions } from "../../mocks/portfolio";
import { caseHistory, strategicGoals } from "../../mocks/investment";
import {
  AppLayout,
  Banner,
  Button,
  crumbs,
  DatePicker,
  DetailLayout,
  EmptyState,
  ErrorState,
  IdLink,
  KeyValueList,
  MetaSection,
  PageHeader,
  ResponsibilitySplit,
  Section,
  Skeleton,
  StatusBadge,
  Tag,
  TextArea,
  Timeline,
  useToast,
} from "../../ui";
import { RoleNote, ScoreDots, userName } from "./parts";

const STATE_TO_STATUS: Record<string, CaseStatus | undefined> = { reviewing: "reviewing", approved: "approved", onHold: "onHold", rejected: "rejected" };

export function BusinessCaseDetail({ id }: { id: string }) {
  const state = useScreenState();
  const org = useRoute().params.org ?? ORG;
  const toast = useToast();
  const base = businessCases.find((c) => c.id === id) ?? businessCases[0];
  const forced = STATE_TO_STATUS[state];
  const bc = forced ? { ...base, status: forced } : base;
  const [choice, setChoice] = useState<"approved" | "onHold" | "rejected" | "">("");
  const [reason, setReason] = useState("");
  const [review, setReview] = useState("");
  const [tried, setTried] = useState(false);
  const trail = crumbs(org, undefined, { label: "案件受付", to: paths.intake(org) }, { label: bc.id });

  if (state === "loading") return <AppLayout org={org} active="intake" breadcrumb={trail}><Skeleton variant="detail" /></AppLayout>;
  if (state === "error") return <AppLayout org={org} active="intake" breadcrumb={trail}><ErrorState /></AppLayout>;
  if (state === "forbidden") {
    return (
      <AppLayout org={org} active="intake" breadcrumb={trail}>
        <div className="card"><EmptyState variant="forbidden" icon="lock" title="この事業ケースを閲覧する権限がありません" description="閲覧範囲（事業部・顧客・機密区分）の外にある事業ケースです。組織管理者に閲覧範囲の変更を依頼してください。" action={<Button to={paths.intake(org)}>案件受付へ戻る</Button>} /></div>
      </AppLayout>
    );
  }

  const goal = strategicGoals.find((g) => g.cases.includes(bc.id));
  const decided = bc.status === "approved" || bc.status === "rejected" || bc.status === "onHold";
  const decisionRec = decisions.find((d) => d.case_id === bc.id);
  const isProposer = bc.proposer === "u-kimura";
  const errors = {
    choice: !choice ? "判断を選んでください" : "",
    reason: !reason.trim() ? "理由を入力してください" : "",
    review: choice === "onHold" && !review ? "保留の場合は再審査日が必要です" : "",
  };
  const decide = () => {
    setTried(true);
    if (Object.values(errors).some(Boolean)) return;
    toast({ kind: "success", message: choice === "approved" ? "開始を承認しました。判断ログに記録しました" : choice === "onHold" ? "保留にしました。再審査日に通知します" : "却下しました。判断ログに記録しました" });
  };

  const history = (caseHistory[bc.id] ?? []).map((h, i) => ({ id: `${bc.id}-${i}`, actor: { kind: "human" as const, name: userName(h.actor) }, action: h.action, detail: h.detail, at: h.at, kind: "status" as const }));
  if (forced && forced !== base.status && decided) {
    history.push({ id: "forced", actor: { kind: "human", name: "木村 達也" }, action: CASE_STATUS[forced].label, detail: forced === "onHold" ? "要求定義の見積り精度が低いため。再審査 2026-12-23" : forced === "rejected" ? "既存案件の要員が不足しているため" : "段階契約（推奨案）で開始", at: "2026-11-27T10:10:00+09:00", kind: "status" });
  }

  return (
    <AppLayout org={org} active="intake" breadcrumb={trail}>
      <PageHeader
        id={bc.id}
        title={bc.title}
        status={<StatusBadge vocab={CASE_STATUS[bc.status]} />}
        description={`${bc.customer ?? "自社案件"}・提出 ${formatDate(bc.submitted_at)}`}
        actions={bc.status === "approved" ? (bc.project ? <Button icon="folder" to={paths.project(org, bc.project)}>プロジェクトを開く</Button> : <Button variant="primary" icon="plus" to={paths.projectNew(org)}>プロジェクトを作成</Button>) : null}
      />
      <DetailLayout
        main={
          <div className="stack">
            {bc.status === "approved" && !bc.project ? <Banner tone="pass" title="開始が承認されました">プロジェクトを作成し、計画管理・コードホスティングとの同期を設定してください。プロジェクトの作成は組織管理者または PM が行えます。</Banner> : null}
            {bc.status === "onHold" ? <Banner tone="info" title="保留中です">再審査日 2026/12/23 にスポンサーへ通知します。</Banner> : null}
            {bc.status === "rejected" ? <Banner tone="warn" title="却下されました">理由は判断履歴を参照してください。同じ内容を再提出する場合は、新しい事業ケースとして登録します。</Banner> : null}

            <Section title="課題・機会と戦略整合">
              <KeyValueList
                items={[
                  { label: "課題・機会", value: bc.problem },
                  { label: "戦略目標", value: goal ? `${goal.id} ${goal.title}` : bc.strategy },
                  { label: "想定便益", value: bc.expected_benefit },
                  { label: "推奨案の費用", value: yen(bc.cost) },
                ]}
              />
            </Section>

            <Section title="選択肢の比較" sub="「実施しない」案を含めて比較します" flush>
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>選択肢</th><th style={{ textAlign: "right" }}>費用</th><th>便益</th><th>リスク</th></tr></thead>
                  <tbody>
                    {bc.options.map((o) => (
                      <tr key={o.name}>
                        <td><span className="row" style={{ ["--gap" as string]: "6px" }}><span className="strong">{o.name}</span>{o.recommended ? <Tag tone="primary" square>推奨</Tag> : null}</span></td>
                        <td style={{ textAlign: "right" }}>{o.cost ? yenM(o.cost) : "—"}</td>
                        <td className="small">{o.benefit}</td>
                        <td className="small">{o.risk}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>

            <Section title="成功指標（KPI）" sub="開始後は便益・成果の画面で実績を追跡します" flush>
              {bc.kpis.length === 0 ? (
                <div style={{ padding: 16 }}><EmptyState icon="target" title="成功指標が登録されていません" description="開始を承認する前に、提案者に指標の追加を依頼してください。" /></div>
              ) : (
                <div className="table-wrap">
                  <table className="table">
                    <thead><tr><th>指標</th><th>基準値</th><th>目標</th><th>実績</th><th>出典</th></tr></thead>
                    <tbody>
                      {bc.kpis.map((k) => (
                        <tr key={k.name}>
                          <td className="strong">{k.name}</td>
                          <td>{k.baseline}</td>
                          <td>{k.target}</td>
                          <td>{k.actual ?? <span className="muted">未測定</span>}</td>
                          <td className="small muted">{k.source ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Section>

            {!decided ? (
              <Section title="判断" sub="判断と理由は判断ログに記録され、後から変更できません">
                <div className="stack">
                  <ResponsibilitySplit decide={<span>スポンサー（{userName(bc.sponsor_id)}）または経営者</span>} act={<span>承認後のプロジェクト作成・計画は PM（{userName(bc.proposer)}）</span>} />
                  {isProposer ? <Banner tone="warn">あなたはこの事業ケースの提案者のため判断できません。</Banner> : null}
                  <div className="pf-option-grid" role="radiogroup" aria-label="判断">
                    {([
                      { v: "approved", t: "開始を承認", d: "推奨案で開始する。プロジェクト作成へ進む" },
                      { v: "onHold", t: "保留", d: "情報不足など。再審査日を決める" },
                      { v: "rejected", t: "却下", d: "実施しない。理由を残す" },
                    ] as const).map((o) => (
                      <label key={o.v} className={`pf-option${choice === o.v ? " recommended" : ""}`}>
                        <span className="row" style={{ ["--gap" as string]: "6px" }}>
                          <input type="radio" name="decision" value={o.v} checked={choice === o.v} onChange={() => setChoice(o.v)} disabled={isProposer} />
                          <strong>{o.t}</strong>
                        </span>
                        <span className="small muted">{o.d}</span>
                      </label>
                    ))}
                  </div>
                  {tried && errors.choice ? <span className="small text-fail">{errors.choice}</span> : null}
                  <TextArea label="理由" required rows={3} value={reason} onChange={setReason} error={tried ? errors.reason || undefined : undefined} placeholder="判断の根拠、条件（例: 段階契約に限る）" />
                  {choice === "onHold" ? <div style={{ maxWidth: 240 }}><DatePicker label="再審査日" required value={review} onChange={setReview} min="2026-11-28" error={tried ? errors.review || undefined : undefined} /></div> : null}
                  <div className="row end">
                    <Button variant="primary" icon="check" onClick={decide} disabled={isProposer} disabledReason="提案者は判断できません">判断を記録</Button>
                  </div>
                </div>
              </Section>
            ) : null}

            <Section title="判断履歴">
              <Timeline items={history} />
            </Section>
          </div>
        }
        side={
          <>
            <MetaSection title="評点（審議で見直し後）">
              <KeyValueList stacked items={[
                { label: "事業価値", value: <ScoreDots value={bc.value_score} label="事業価値" /> },
                { label: "緊急性", value: <ScoreDots value={bc.urgency} label="緊急性" /> },
                { label: "リスク", value: <ScoreDots value={bc.risk_score} invert label="リスク" /> },
              ]} />
            </MetaSection>
            <MetaSection title="関係者">
              <KeyValueList stacked items={[
                { label: "スポンサー", value: userName(bc.sponsor_id) },
                { label: "提案者", value: userName(bc.proposer) },
                { label: "審議日", value: bc.review_date ? formatDate(bc.review_date) : "—" },
              ]} />
            </MetaSection>
            <MetaSection title="関連">
              <div className="stack" style={{ ["--gap" as string]: "6px" }}>
                {decisionRec ? <span className="small">判断: <IdLink id={decisionRec.id} to={paths.decision(org, decisionRec.id)} title={decisionRec.title} /></span> : <span className="small muted">関連する経営判断はありません</span>}
                {bc.project ? <span className="small">プロジェクト: <IdLink id={bc.project} to={paths.project(org, bc.project)} /></span> : null}
                <Button size="sm" variant="ghost" icon="sort" to={paths.priorities(org)}>優先順位での位置を見る</Button>
              </div>
            </MetaSection>
            <RoleNote>提案書・見積りの原本は文書管理にあります。この画面は判断に必要な要点と判断の記録です。</RoleNote>
          </>
        }
      />
    </AppLayout>
  );
}
