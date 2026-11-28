// 画面ID: M-09 戦略ロードマップ
import { useState } from "react";
import { useRoute, useScreenState } from "../../lib/router";
import { ORG, paths } from "../../lib/paths";
import { formatDateTime } from "../../lib/format";
import { connectors, milestones } from "../../mocks/portfolio";
import { roadmapChanges, roadmapItems, strategicGoals } from "../../mocks/investment";
import { AppLayout, Button, ConfidenceTag, crumbs, EmptyState, ErrorState, IdLink, PageHeader, RoadmapTimeline, Section, Segmented, Skeleton, SourceTag, StaleDataNotice } from "../../ui";
import type { TimelineRow } from "../../ui";
import { RoleNote, userName } from "./parts";

export function Roadmap() {
  const state = useScreenState();
  const org = useRoute().params.org ?? ORG;
  const [goal, setGoal] = useState("all");
  const trail = crumbs(org, undefined, { label: "ロードマップ" });
  const planning = connectors.filter((c) => c.category === "planning");

  if (state === "loading") return <AppLayout org={org} active="roadmap" breadcrumb={trail}><Skeleton variant="card" /></AppLayout>;
  if (state === "error") return <AppLayout org={org} active="roadmap" breadcrumb={trail}><ErrorState /></AppLayout>;

  const goals = strategicGoals.filter((g) => goal === "all" || g.id === goal);
  const rowsFor = (g: (typeof strategicGoals)[number]): TimelineRow[] =>
    roadmapItems
      .filter((i) => i.goal === g.id)
      .map((i) => ({
        id: i.id,
        label: i.label,
        sub: (
          <span className="row" style={{ ["--gap" as string]: "4px" }}>
            <ConfidenceTag value={i.current.confidence} />
            <span>{g.id}</span>
            {i.depends_on?.length ? <span>・依存 {i.depends_on.map((d) => roadmapItems.find((x) => x.id === d)?.label).join("、")}</span> : null}
          </span>
        ),
        baseline: i.baseline,
        current: i.current,
        markers: i.project
          ? milestones.filter((m) => m.project === i.project && (m.kind === "delivery" || m.kind === "release")).map((m) => ({ date: m.actual ?? m.forecast ?? m.revised ?? m.baseline, label: m.title, kind: "milestone" as const }))
          : [],
      }));

  return (
    <AppLayout org={org} active="roadmap" breadcrumb={trail}>
      <PageHeader
        title="戦略ロードマップ"
        description="事業目標ごとに、案件と主要な納入・リリースの時期を示します。確約（顧客と合意）・目標（社内目標）・予測（最新の見込み）を区別します。"
        tabs={<Segmented value={goal} onChange={setGoal} options={[{ value: "all", label: "すべての目標" }, ...strategicGoals.map((g) => ({ value: g.id, label: g.id }))]} />}
      />
      <div className="stack">
        <StaleDataNotice sources={planning.map((c) => ({ name: c.name, source: { provider: c.provider, synced_at: c.last_success_at, status: c.status } }))} action={<Button size="sm" to={paths.connectors(org)}>連携と同期へ</Button>} />
        {state === "empty" ? (
          <div className="card"><EmptyState icon="map" title="ロードマップに表示する案件がありません" description="戦略目標に案件や事業ケースを関連付けると表示されます。" /></div>
        ) : (
          <>
            {goals.map((g) => (
              <div key={g.id} className="stack" style={{ ["--gap" as string]: "8px" }}>
                <div className="row between">
                  <h2 className="section-title" style={{ margin: 0 }}>{g.id} {g.title}</h2>
                  <span className="tiny muted">{g.period}・責任者 {userName(g.owner)}</span>
                </div>
                <RoadmapTimeline rows={rowsFor(g)} from="2026-06-01" to="2027-04-30" ariaLabel={`${g.id} のロードマップ`} />
              </div>
            ))}
            <div className="row">
              <SourceTag source={{ provider: "githubProjects", label: "日付・依存関係", synced_at: "2026-11-27T10:15:00+09:00", status: "healthy" }} />
            </div>
            <RoleNote>判断: 事業目標、主要な成果時期、顧客への約束、案件間の順序（経営層）／実務: マイルストーン、依存関係、作業分解、予測の更新（PM・プロダクト責任者が計画管理で実施）。この画面から正本の日程は書き換えません。</RoleNote>
            <Section title="変更履歴" sub="確約日の改訂は承認者を記録します。予測の更新は承認対象外です" flush>
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>日時</th><th>対象</th><th>変更</th><th>理由</th><th>承認者</th></tr></thead>
                  <tbody>
                    {roadmapChanges.map((c) => (
                      <tr key={c.id}>
                        <td className="small">{formatDateTime(c.at)}</td>
                        <td className="strong small">{c.item}</td>
                        <td className="small">{c.change}</td>
                        <td className="small">{c.reason}</td>
                        <td className="small">{c.approver.startsWith("u-") ? userName(c.approver) : c.approver}{c.decision ? <> ・<IdLink id={c.decision} to={paths.decision(org, c.decision)} /></> : null}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          </>
        )}
      </div>
    </AppLayout>
  );
}
