// 画面ID: J-01 プロジェクト概要
import {
  Button,
  CodeRef,
  DeadlineIndicator,
  EnforcementBadge,
  ErrorState,
  GateSummaryStrip,
  Icon,
  PageHeader,
  PhaseBand,
  PolicyVersionTag,
  ProjectLayout,
  Section,
  Skeleton,
  StatCard,
  StatusBadge,
  Tag,
  Timestamp,
  UserChip,
  cx,
} from "../../ui";
import type { IconName } from "../../ui";
import { Link, useScreenState } from "../../lib/router";
import { paths } from "../../lib/paths";
import { PHASES } from "../../lib/types";
import { GATE_STATUS } from "../../lib/vocab";
import { percent } from "../../lib/format";
import { gateRuns, projectBySlug, userById } from "../../mocks/core";
import { orgOf, projectOf } from "./shared";

type NextAction = { icon: IconName; tone: string; text: string; detail: string; to: string; label: string };

export function J01Overview({ params }: { params: Record<string, string> }) {
  const state = useScreenState();
  const org = orgOf(params);
  const pr = projectOf(params);
  const p = projectBySlug(pr);

  const actions: NextAction[] = [
    { icon: "xCircle", tone: "fail", text: "PR #142 がゲート B でブロックされています", detail: "REQ-0006 のテストリンク不足、依存ライブラリの脆弱性", to: paths.gate(org, pr, "run-5821"), label: "ゲート詳細" },
    { icon: "alert", tone: "warn", text: "REQ-0007 に受入基準がありません", detail: "AIの未確認の所見が3件あります", to: paths.requirement(org, pr, "REQ-0007"), label: "要求を開く" },
    { icon: "inbox", tone: "warn", text: "REQ-0012 が顧客の承認待ちです", detail: "期限: 今日まで", to: paths.requirement(org, pr, "REQ-0012"), label: "承認状況" },
    { icon: "flag", tone: "special", text: "例外 EXC-0006 の期限まで3日です", detail: "期限到来時に自動で再審査されます", to: paths.exception(org, pr, "EXC-0006"), label: "例外を開く" },
    { icon: "fileText", tone: "fail", text: "統制項目 CTL-PM-006（受入記録）の証跡が欠落しています", detail: "v1.4.0 の顧客受入後に記録されます", to: paths.control(org, pr, "CTL-PM-006"), label: "統制項目" },
    { icon: "calendar", tone: "warn", text: "プロジェクト計画の「版管理の方針」が未記入です", detail: "計画は顧客の承認待ちです", to: paths.plan(org, pr), label: "計画を開く" },
  ];
  const recent = gateRuns.slice(0, 5);
  const members = p.member_ids.map((id) => userById(id)).filter((u): u is NonNullable<typeof u> => Boolean(u));

  return (
    <ProjectLayout org={org} project={pr} active="overview" trail={[]}>
      <PageHeader
        title={p.name}
        description={`発注元: ${p.customer}`}
        meta={
          <>
            <Tag square icon="flag">フェーズ: {PHASES.find((x) => x.key === p.phase)?.label}</Tag>
            <PolicyVersionTag pack={p.control_pack} version={p.pack_version} outdated={p.pack_outdated} />
            <EnforcementBadge level={p.enforcement} />
          </>
        }
        actions={<Button icon="settings" to={paths.settings(org)}>設定</Button>}
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
          <PhaseBand phases={PHASES} current={p.phase} />
          <div className="grid cols-4">
            <StatCard label="承認済み要求のトレーサビリティ" icon="trace" value={percent(p.trace_linked, p.trace_total)} unit="%" delta={`${p.trace_linked}/${p.trace_total} 件がテストまでつながっている`} tone={p.trace_linked < p.trace_total ? "warn" : "good"} to={paths.trace(org, pr)} />
            <StatCard label="ブロック中のPR" icon="shieldX" value={p.blocked_prs} unit="件" tone={p.blocked_prs ? "danger" : undefined} delta="ゲート実行の一覧で確認" to={paths.gates(org, pr)} />
            <StatCard label="有効な例外" icon="flag" value={p.active_exceptions} unit="件" delta="うち1件は7日以内に期限" to={paths.exceptions(org, pr)} />
            <StatCard label="未解決のリスク・変更" icon="alert" value={p.open_risks + p.open_changes} unit="件" delta={`リスク ${p.open_risks} · 変更 ${p.open_changes}`} to={paths.risks(org, pr)} />
          </div>
          <div className="grid main-side">
            <div className="stack">
              <Section title="次にやること" sub="未充足の統制項目と承認待ちから作成しています" flush>
                <ul className="pl-next-list">
                  {actions.map((a) => (
                    <li key={a.text}>
                      <span className={cx("pl-next-icon", `tone-${a.tone}`)}><Icon name={a.icon} size={15} /></span>
                      <div className="stack" style={{ ["--gap" as string]: "2px", minWidth: 0 }}>
                        <span className="strong" style={{ fontWeight: 500 }}>{a.text}</span>
                        <span className="tiny muted">{a.detail}</span>
                      </div>
                      <Button size="sm" variant="ghost" iconRight="arrowRight" to={a.to}>{a.label}</Button>
                    </li>
                  ))}
                </ul>
              </Section>
              <Section title="直近のゲート実行" actions={<Button size="sm" variant="ghost" iconRight="arrowRight" to={paths.gates(org, pr)}>すべて見る</Button>} flush>
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr><th>対象</th><th>作成者</th><th>ゲート</th><th>判定</th><th>実行</th></tr>
                    </thead>
                    <tbody>
                      {recent.map((r) => (
                        <tr key={r.id} className="clickable" onClick={() => { window.location.hash = paths.gate(org, pr, r.id); }}>
                          <td>
                            <div className="stack" style={{ ["--gap" as string]: "2px" }}>
                              <span className="strong truncate" style={{ maxWidth: 320, fontWeight: 500 }}>{r.pr_title}</span>
                              <span className="tiny muted mono">{r.pr_number ? `#${r.pr_number}` : r.branch}</span>
                            </div>
                          </td>
                          <td className="small">{r.author.kind === "ai" ? <Tag tone="special" dashed icon="sparkles">AIエージェント</Tag> : r.author.name}</td>
                          <td><GateSummaryStrip gates={r.gates} /></td>
                          <td><StatusBadge vocab={GATE_STATUS[r.verdict]} size="sm" /></td>
                          <td className="small muted"><Timestamp at={r.started_at} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Section>
            </div>
            <div className="stack">
              <Section title="メンバーとロール" actions={<Link to={paths.members(org)} className="small">管理</Link>}>
                <div className="stack" style={{ ["--gap" as string]: "8px" }}>
                  {members.map((u) => <UserChip key={u.id} user={u} />)}
                </div>
              </Section>
              <Section title="リポジトリ">
                <div className="stack" style={{ ["--gap" as string]: "8px" }}>
                  {p.repos.length ? p.repos.map((r) => <CodeRef key={r} kind="repo" value={r} />) : <span className="small muted">連携しているリポジトリはありません</span>}
                </div>
              </Section>
              <Section title="次のリリース" actions={<Link to={paths.releases(org, pr)} className="small">一覧</Link>}>
                {p.next_release ? (
                  <div className="stack" style={{ ["--gap" as string]: "8px" }}>
                    <div className="row between">
                      <Link to={paths.release(org, pr, "rel-140")} className="strong">{p.next_release.version}</Link>
                      <StatusBadge vocab={GATE_STATUS.block} size="sm" />
                    </div>
                    <DeadlineIndicator date={p.next_release.date} />
                    <span className="tiny muted">リリースゲートの未充足があります</span>
                  </div>
                ) : (
                  <span className="small muted">予定はありません</span>
                )}
              </Section>
            </div>
          </div>
        </>
      )}
    </ProjectLayout>
  );
}
