// 画面ID: B-07 外注原価・粗利見込
// 見積、発注済み未検収額、検収済み原価、追加変更の見込み。外注費と内部工数を二重集計しない。
// 分納で検収が進んでも、発注残から検収済みへ移すだけで合計は変わらない。基準日を選ぶと当時の粗利見込を再現する。社内のみ。
import { useState } from "react";
import { useRoute, useScreenState } from "../../lib/router";
import { ORG, paths, PROJECT } from "../../lib/paths";
import { yen } from "../../lib/format";
import { costOf, costSnapshots, grossMargin, outsourcingForecast } from "../../mocks/orders";
import { Banner, Button, EmptyState, ErrorState, IdLink, PageHeader, ProjectLayout, Section, Select, Skeleton, StatCard, Tag, Toggle } from "../../ui";
import { InternalOnly, InternalYen } from "./parts";

const pct = (r: number) => `${(r * 100).toFixed(1)}%`;

export function B07ProjectCost() {
  const state = useScreenState();
  const route = useRoute();
  const org = route.params.org ?? ORG;
  const project = route.params.project ?? PROJECT;
  const [includeUnapproved, setInclude] = useState(state === "withChange");
  const snaps = costSnapshots[project] ?? [];
  const [asOf, setAsOf] = useState(state === "asOf" ? "2026-11-18" : "2026-11-27");
  const trail = [{ label: "外注原価・粗利" }];
  if (state === "loading") return <ProjectLayout org={org} project={project} active="projectCost" trail={trail}><Skeleton rows={4} /></ProjectLayout>;
  if (state === "error") return <ProjectLayout org={org} project={project} active="projectCost" trail={trail}><ErrorState /></ProjectLayout>;
  const c = costOf(project);
  if (!c || state === "empty") {
    return (
      <ProjectLayout org={org} project={project} active="projectCost" trail={trail}>
        <PageHeader title="外注原価・粗利見込" />
        <div className="card"><EmptyState icon="barChart" title="原価のデータがありません" description="見積を登録し、受託者への発注を出すと表示されます。" /></div>
      </ProjectLayout>
    );
  }
  const g = grossMargin(c, includeUnapproved);
  const out = outsourcingForecast(c, includeUnapproved);
  const snap = snaps.find((s) => s.date === asOf);

  return (
    <ProjectLayout org={org} project={project} active="projectCost" trail={trail}>
      <PageHeader
        title="外注原価・粗利見込"
        description="受注額に対する内部工数と外注原価から粗利を見込みます。外注費は発注・検収の記録から集計し、内部工数とは別に数えます。"
        actions={<Button icon="send" to={paths.orders(org)}>発注一覧</Button>}
      />
      <InternalOnly />
      <div className="grid auto-fit">
        <StatCard label="受注額" value={yen(g.revenue)} delta={includeUnapproved ? "判断待ちの変更を含む" : "契約額"} />
        <StatCard label="原価の見込" value={yen(g.cost)} delta={`内部工数 ${yen(c.internal_labor)}＋外注 ${yen(out)}`} />
        <StatCard label="粗利見込" value={yen(g.margin)} delta={`粗利率 ${pct(g.rate)}`} tone={g.rate < 0.2 ? "warn" : "good"} />
      </div>
      <Toggle label="判断待ちの追加変更を含めて試算する" checked={includeUnapproved} onChange={setInclude} description="採択前の変更は確定値に含めません。試算はこの画面の表示だけに反映されます" />
      <Section title="外注原価の内訳" sub="発注残 → 検収済みへ移るだけで、合計は二重に増えません" flush>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>区分</th><th style={{ textAlign: "right" }}>金額</th><th>根拠</th></tr></thead>
            <tbody>
              <tr><td className="small">見積（外注枠）</td><td style={{ textAlign: "right" }}><InternalYen value={c.estimate_outsourcing} /></td><td className="small">受注時の見積</td></tr>
              <tr><td className="small">検収済み原価</td><td style={{ textAlign: "right" }}><InternalYen value={c.inspected} /></td><td className="small">委託元が検収した分納の合計</td></tr>
              <tr><td className="small">発注済み・未検収（発注残）</td><td style={{ textAlign: "right" }}><InternalYen value={c.ordered_uninspected} /></td><td className="small">受諾済みの発注の現在の版の報酬</td></tr>
              <tr><td className="small">未発注の計画</td><td style={{ textAlign: "right" }}><InternalYen value={c.unordered_plan} /></td><td className="small">回答待ち・未割当の範囲</td></tr>
              {c.change_forecast.map((x) => (
                <tr key={x.id}>
                  <td className="small">追加変更 <IdLink id={x.id} to={x.id.startsWith("DEC") ? paths.decision(org, x.id) : paths.change(org, project, x.id)} /> {x.approved ? <Tag tone="pass" square>承認済み</Tag> : <Tag tone="warn" square>判断待ち</Tag>}</td>
                  <td style={{ textAlign: "right" }}>{x.approved || includeUnapproved ? <InternalYen value={x.cost} /> : <span className="muted small">（試算外）{yen(x.cost)}</span>}</td>
                  <td className="small">{x.label}（受注額の増加 {yen(x.revenue)}）</td>
                </tr>
              ))}
              <tr><td className="strong small">外注原価の見込</td><td style={{ textAlign: "right" }}><InternalYen value={out} strong /></td><td className="small">検収済み＋発注残＋未発注の計画{includeUnapproved ? "＋判断待ちの変更" : ""}</td></tr>
              <tr><td className="small">内部工数（別集計）</td><td style={{ textAlign: "right" }}><InternalYen value={c.internal_labor} /></td><td className="small">社内の工数。外注した作業は含めない</td></tr>
            </tbody>
          </table>
        </div>
      </Section>
      {snaps.length ? (
        <Section title="基準日ごとの粗利見込" sub="当時に記録されていた値で再現します。後から変わった値で上書きしません">
          <div className="stack">
            <div style={{ maxWidth: 360 }}>
              <Select label="基準日" value={asOf} onChange={setAsOf} options={snaps.map((s) => ({ value: s.date, label: `${s.date.replace(/-/g, "/")} ${s.label}` }))} />
            </div>
            {snap ? (
              <div className="grid auto-fit">
                <StatCard label="受注額" value={yen(snap.revenue)} />
                <StatCard label="原価" value={yen(snap.internal_labor + snap.outsourcing)} delta={`内部 ${yen(snap.internal_labor)}・外注 ${yen(snap.outsourcing)}`} />
                <StatCard label="粗利見込" value={yen(snap.revenue - snap.internal_labor - snap.outsourcing)} delta={`粗利率 ${pct((snap.revenue - snap.internal_labor - snap.outsourcing) / snap.revenue)}`} />
              </div>
            ) : null}
            {snap?.event ? <Banner tone={snap.label.includes("案") ? "warn" : "info"} title={snap.label}>{snap.event}</Banner> : null}
          </div>
        </Section>
      ) : null}
    </ProjectLayout>
  );
}
