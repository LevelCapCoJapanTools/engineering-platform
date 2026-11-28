// 画面ID: J-01 プロジェクト概要
// 経営層が案件の健全性・計画対予測・次の判断・重大リスク・証跡準備度・同期鮮度を短時間で把握する画面。
import {
  AISectionHead,
  Button,
  CoverageMeter,
  EnforcementBadge,
  ErrorState,
  ExternalActor,
  GateSummaryStrip,
  Icon,
  PageHeader,
  PhaseBand,
  PlanDates,
  PolicyVersionTag,
  ProjectLayout,
  ResponsibilitySplit,
  Section,
  Skeleton,
  StaleDataNotice,
  StatCard,
  StatusBadge,
  Tag,
  cx,
} from "../../ui";
import type { IconName } from "../../ui";
import { Link, useScreenState } from "../../lib/router";
import { paths } from "../../lib/paths";
import { PHASES } from "../../lib/types";
import { HEALTH, RISK_STATUS } from "../../lib/vocab";
import { daysUntil, formatDate, percent, yenM } from "../../lib/format";
import { projectBySlug, risks, userById } from "../../mocks/core";
import { decisions, healthBySlug, milestones, projectHealth } from "../../mocks/portfolio";
import { PLAN_SOURCE, SCM_SOURCE } from "../../mocks/planning";
import { DecisionLink, SourceBar, orgOf, projectOf } from "./shared";

export const J01_STATES = ["既定", "同期が古い", "AI要約なし", "読み込み中", "取得失敗"];

type Attention = { icon: IconName; tone: string; text: string; detail: string; to: string; label: string; who: "経営判断" | "実務の対応" };

export function J01Overview({ params }: { params: Record<string, string> }) {
  const state = useScreenState();
  const org = orgOf(params);
  const pr = projectOf(params);
  const p = projectBySlug(pr);
  const h = healthBySlug(pr) ?? projectHealth[0];
  const stale = state === "同期が古い";
  const planSource = stale ? { ...PLAN_SOURCE, synced_at: "2026-11-26T22:00:00+09:00", status: "stale" as const } : PLAN_SOURCE;
  const sponsor = userById(h.sponsor_id);
  const ms = milestones.filter((m) => m.project === pr);
  const nextMs = ms.find((m) => !m.actual) ?? ms[ms.length - 1];
  const projectDecisions = decisions.filter((d) => d.project === pr && d.status === "pending");
  const topRisks = risks.filter((r) => r.status !== "done" && r.impact * r.likelihood >= 12);

  const attention: Attention[] = [
    { icon: "inbox", tone: "warn", text: "CR-0004 の追加費用 120万円の承認", detail: "期限 12/2・判断者: 経営層", to: paths.decision(org, "DEC-0031"), label: "判断する", who: "経営判断" },
    { icon: "calendar", tone: "fail", text: "v1.4.0 納入の予測が確約日より 7 日遅れています", detail: "顧客への説明が必要か判断（DEC-0033）", to: paths.decision(org, "DEC-0033"), label: "判断する", who: "経営判断" },
    { icon: "xCircle", tone: "fail", text: "PR #142 がゲート B でブロック中", detail: "テストリンク不足と依存ライブラリの脆弱性。開発チームが対応中", to: paths.gate(org, pr, "run-5821"), label: "根拠を見る", who: "実務の対応" },
    { icon: "fileText", tone: "warn", text: "統制項目 CTL-PM-006（受入記録）の証跡が未作成", detail: "v1.4.0 の顧客受入後に記録されます", to: paths.control(org, pr, "CTL-PM-006"), label: "統制項目", who: "実務の対応" },
  ];

  return (
    <ProjectLayout org={org} project={pr} active="overview" trail={[]}>
      <PageHeader
        title={p.name}
        description={`発注元: ${p.customer} · ${h.division}`}
        status={<StatusBadge vocab={HEALTH[h.health]} size="lg" />}
        meta={
          <>
            <Tag square icon="flag">フェーズ: {PHASES.find((x) => x.key === p.phase)?.label}</Tag>
            <PolicyVersionTag pack={p.control_pack} version={p.pack_version} outdated={p.pack_outdated} />
            <EnforcementBadge level={p.enforcement} />
            <span className="small muted">スポンサー: {sponsor?.name}</span>
          </>
        }
        actions={<Button icon="calendar" to={paths.schedule(org, pr)}>スケジュール</Button>}
      />
      {state === "読み込み中" ? (
        <>
          <Skeleton variant="card" rows={3} />
          <Skeleton variant="table" rows={5} />
        </>
      ) : state === "取得失敗" ? (
        <ErrorState />
      ) : (
        <>
          <StaleDataNotice sources={[{ name: "計画・作業項目", source: planSource }, { name: "PR・CI", source: SCM_SOURCE }]} action={<Button size="sm" icon="plug" to={paths.connectors(org)}>連携の状態</Button>} />
          <PhaseBand phases={PHASES} current={p.phase} />
          <div className="grid cols-4">
            <StatCard label="最終受入の予測" icon="calendar" value={formatDate(h.forecast_end)} delta={h.slip_days > 0 ? `当初計画より +${h.slip_days}日` : h.slip_days < 0 ? `当初計画より ${h.slip_days}日` : "当初計画どおり"} tone={h.slip_days > 0 ? "warn" : "good"} to={paths.schedule(org, pr)} />
            <StatCard label="予算に対する予測コスト" icon="creditCard" value={percent(h.forecast_cost, h.budget)} unit="%" delta={`予測 ${yenM(h.forecast_cost)} / 予算 ${yenM(h.budget)}`} tone={h.forecast_cost > h.budget ? "danger" : undefined} />
            <StatCard label="証跡の準備度" icon="archive" value={h.evidence_readiness} unit="%" delta="統制項目に対して証跡がそろっている割合" tone={h.evidence_readiness < 80 ? "warn" : "good"} to={paths.audit(org, pr)} />
            <StatCard label="判断待ち" icon="inbox" value={projectDecisions.length} unit="件" delta={projectDecisions[0] ? `最短の期限 ${formatDate(projectDecisions[0].due)}` : "なし"} tone={projectDecisions.length ? "warn" : undefined} to={paths.inbox(org)} />
          </div>
          <div className="grid main-side">
            <div className="stack">
              <Section title="対応が必要なこと" sub="経営判断と、実務での対応（参照のみ）を分けて表示します" flush>
                <ul className="pl-next-list">
                  {attention.map((a) => (
                    <li key={a.text}>
                      <span className={cx("pl-next-icon", `tone-${a.tone}`)}><Icon name={a.icon} size={15} /></span>
                      <div className="stack" style={{ ["--gap" as string]: "2px", minWidth: 0 }}>
                        <span className="row" style={{ ["--gap" as string]: "6px" }}>
                          <Tag square tone={a.who === "経営判断" ? "primary" : "neutral"}>{a.who}</Tag>
                          <span className="strong" style={{ fontWeight: 500 }}>{a.text}</span>
                        </span>
                        <span className="tiny muted">{a.detail}</span>
                      </div>
                      <Button size="sm" variant="ghost" iconRight="arrowRight" to={a.to}>{a.label}</Button>
                    </li>
                  ))}
                </ul>
              </Section>
              <Section title="計画対予測" sub="当初・承認済み改訂・予測・実績" actions={<Button size="sm" variant="ghost" iconRight="arrowRight" to={paths.milestones(org, pr)}>マイルストーン</Button>} flush>
                <div className="table-wrap">
                  <table className="table">
                    <thead><tr><th>マイルストーン</th><th>現在の日付</th><th>当初</th><th>担当</th></tr></thead>
                    <tbody>
                      {ms.map((m) => (
                        <tr key={m.id}>
                          <td><div className="stack" style={{ ["--gap" as string]: "2px" }}><span className="strong" style={{ fontWeight: 500 }}>{m.title}</span><span className="tiny muted mono">{m.id}</span></div></td>
                          <td><PlanDates baseline={m.baseline} revised={m.revised} forecast={m.forecast} actual={m.actual} compact /></td>
                          <td className="small nowrap">{formatDate(m.baseline)}</td>
                          <td><ExternalActor userId={m.owner} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ padding: "10px 20px" }}><SourceBar source={planSource} note="日付は計画管理で更新されます" /></div>
              </Section>
              <Section title="AIによる状況の要約" sub="参考情報です。判断には元データを確認してください">
                {state === "AI要約なし" || !h.ai_summary ? (
                  <p className="small muted">要約はありません（AI機能が無効、またはデータが不足しています）。</p>
                ) : (
                  <div className="stack" style={{ ["--gap" as string]: "8px" }}>
                    <AISectionHead count={1} note="確信度: 中（予測日の更新が 1 件のみのため）" />
                    <p className="small">{h.ai_summary}</p>
                    <div className="row" style={{ ["--gap" as string]: "8px" }}>
                      <span className="tiny muted">元データ:</span>
                      <Link to={paths.schedule(org, pr)} className="small">MS-104 の予測日の変更</Link>
                      <Link to={paths.exception(org, pr, "EXC-0008")} className="small">EXC-0008</Link>
                      <Link to={paths.risk(org, pr, "RSK-012")} className="small">RSK-012</Link>
                    </div>
                  </div>
                )}
              </Section>
            </div>
            <div className="stack">
              <Section title="次の判断" actions={<Link to={paths.inbox(org)} className="small">経営判断</Link>}>
                {projectDecisions.length ? (
                  <div className="stack" style={{ ["--gap" as string]: "10px" }}>
                    {projectDecisions.map((d) => (
                      <div key={d.id} className="stack" style={{ ["--gap" as string]: "4px" }}>
                        <DecisionLink org={org} id={d.id} />
                        <span className={cx("tiny", daysUntil(d.due) <= 3 ? "text-fail" : "muted")}>期限 {formatDate(d.due)}（あと {daysUntil(d.due)} 日）</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="small muted">判断待ちはありません</span>
                )}
              </Section>
              <Section title="重大なリスク" actions={<Link to={paths.risks(org, pr)} className="small">一覧</Link>}>
                <div className="stack" style={{ ["--gap" as string]: "10px" }}>
                  {topRisks.map((r) => (
                    <div key={r.id} className="stack" style={{ ["--gap" as string]: "4px" }}>
                      <span className="row" style={{ ["--gap" as string]: "6px" }}>
                        <Link to={paths.risk(org, pr, r.id)} className="small strong">{r.id}</Link>
                        <StatusBadge vocab={RISK_STATUS[r.status]} size="sm" />
                        <Tag square tone="fail">{r.impact * r.likelihood}</Tag>
                      </span>
                      <span className="small">{r.title}</span>
                      <ResponsibilitySplit decide={<span className="small">リスクを受容するか（経営層）</span>} act={<ExternalActor userId={r.owner_id} />} />
                    </div>
                  ))}
                </div>
              </Section>
              <Section title="次のマイルストーン">
                {nextMs ? (
                  <div className="stack" style={{ ["--gap" as string]: "8px" }}>
                    <span className="strong">{nextMs.title}</span>
                    <PlanDates baseline={nextMs.baseline} revised={nextMs.revised} forecast={nextMs.forecast} actual={nextMs.actual} compact />
                  </div>
                ) : <span className="small muted">予定はありません</span>}
              </Section>
              <Section title="品質ゲートと証跡">
                <div className="stack" style={{ ["--gap" as string]: "10px" }}>
                  <div className="row between"><span className="small">直近の main</span><GateSummaryStrip gates={p.main_gates} /></div>
                  <CoverageMeter value={p.trace_linked} total={p.trace_total} label="承認済み要求がテストまでつながっている割合" />
                  <span className="tiny muted">ゲートの判定は決定論的なルールと人間の承認で行います。</span>
                </div>
              </Section>
            </div>
          </div>
        </>
      )}
    </ProjectLayout>
  );
}
