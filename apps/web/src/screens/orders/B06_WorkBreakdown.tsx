// 画面ID: B-06 委託単位への分解
// SOW の納入物を、依存関係・入力資料・完成条件・検収者を持つ依頼に分ける。
// 1つの納入物を複数人に分けても、各人には担当部分だけが届く。未割当の範囲が分かる。AI の分解案は参考。
import { useState } from "react";
import { useRoute, useScreenState } from "../../lib/router";
import { ORG, paths, PROJECT } from "../../lib/paths";
import { SOW_REF, workPackages } from "../../mocks/orders";
import type { WorkPackage } from "../../mocks/orders";
import { Banner, Button, EmptyState, ErrorState, ExternalActor, IdLink, PageHeader, ProjectLayout, Section, Segmented, Select, Skeleton, Tag, useToast } from "../../ui";
import { AiDraftNote, fmt } from "./parts";

export function B06WorkBreakdown() {
  const state = useScreenState();
  const route = useRoute();
  const org = route.params.org ?? ORG;
  const project = route.params.project ?? PROJECT;
  const toast = useToast();
  const [view, setView] = useState(state === "preview" ? "preview" : "board");
  const [who, setWho] = useState("林 由香");
  const [wps, setWps] = useState<WorkPackage[]>(state === "aiProposal" ? workPackages.map((w) => (w.id === "WP-2" ? { ...w, assignee: { kind: "freelancer", name: "松田 亮", state: "draft" } } : w)) : workPackages);
  if (state === "loading") return <ProjectLayout org={org} project={project} active="workBreakdown" trail={[{ label: "委託単位への分解" }]}><Skeleton rows={4} /></ProjectLayout>;
  if (state === "error") return <ProjectLayout org={org} project={project} active="workBreakdown" trail={[{ label: "委託単位への分解" }]}><ErrorState /></ProjectLayout>;
  const list = state === "empty" ? [] : wps;
  const deliverables = [...new Set(list.map((w) => w.deliverable))];
  const unassigned = list.filter((w) => !w.assignee);
  const people = [...new Set(list.filter((w) => w.assignee?.kind === "freelancer").map((w) => w.assignee!.name))];

  return (
    <ProjectLayout org={org} project={project} active="workBreakdown" trail={[{ label: "委託単位への分解" }]}>
      <PageHeader
        title="委託単位への分解"
        description={`${SOW_REF} の納入物を、受託者に依頼できる単位に分けます。各依頼には依存関係・入力資料・完成条件・検収者を持たせます。`}
        actions={
          <>
            <Button icon="sparkles" onClick={() => toast({ kind: "info", message: "AI の分解案を表示しました。採用は人が決めます" })}>AI の分解案</Button>
            <Button variant="primary" icon="send" disabled={!unassigned.length} disabledReason="未割当の範囲はありません" to={paths.orderNew(org)}>未割当の範囲を依頼する</Button>
          </>
        }
        tabs={<Segmented value={view} onChange={setView} options={[{ value: "board", label: "納入物ごと" }, { value: "preview", label: "受託者に届く範囲" }]} />}
      />
      {state === "aiProposal" ? (
        <AiDraftNote>
          WP-2（取込結果の画面）を松田 亮に割り当てる案です。根拠: 共有された 12 月の枠と技能（React、CSV・帳票）。条件の確約・金額の決定はしていません。採用すると依頼書の下書きを作ります。
        </AiDraftNote>
      ) : null}
      {unassigned.length ? (
        <Banner tone="warn" title={`未割当の範囲が ${unassigned.length} 件あります`}>
          {unassigned.map((w) => `${w.id} ${w.title}`).join("、")}。依頼書を作成するか、社内の担当を決めてください。
        </Banner>
      ) : null}
      {list.length === 0 ? (
        <div className="card"><EmptyState icon="layers" title="分解する納入物がありません" description="SOW を取り込むと、納入物ごとに分解できます。" action={<Button to={paths.documents(org, project)}>文書の取込みへ</Button>} /></div>
      ) : view === "board" ? (
        deliverables.map((d) => (
          <Section key={d} title={d} sub={`${list.filter((w) => w.deliverable === d).length} 件の依頼に分解`}>
            <div className="ord-wp">
              {list.filter((w) => w.deliverable === d).map((w) => (
                <div key={w.id} className={w.assignee ? "ord-wp-card" : "ord-wp-card unassigned"}>
                  <div className="row between">
                    <span className="mono small">{w.id}</span>
                    {w.assignee ? (
                      w.assignee.state === "draft" ? <Tag tone="special" square icon="sparkles">AI の割当案</Tag> : w.assignee.kind === "internal" ? <Tag square>社内</Tag> : w.assignee.state === "offered" ? <Tag tone="warn" square>回答待ち</Tag> : <Tag tone="pass" square>受諾済み</Tag>
                    ) : (
                      <Tag tone="warn" square dashed>未割当</Tag>
                    )}
                  </div>
                  <strong className="small">{w.title}</strong>
                  <span className="tiny muted">担当: {w.assignee ? w.assignee.name : "—"} {w.assignee?.order_id ? <IdLink id={w.assignee.order_id} to={paths.order(org, w.assignee.order_id)} /> : null}</span>
                  <span className="tiny">依存: {w.depends_on.length ? w.depends_on.join("、") : "なし"}</span>
                  <span className="tiny">入力資料: {w.inputs.join("、")}</span>
                  <span className="tiny">完成条件: {w.criteria.join("／")}</span>
                  <span className="tiny row">検収者: <ExternalActor userId={w.inspector} /></span>
                  {!w.assignee ? (
                    <Select
                      label="割当（外注枠の委任者が決定）"
                      value=""
                      onChange={(v) => { setWps((l) => l.map((x) => (x.id === w.id ? { ...x, assignee: { kind: "freelancer", name: v, state: "draft" } } : x))); toast({ kind: "success", message: `${w.id} を ${v} に割り当てる下書きを作りました。依頼書を発行するまで受託者には届きません` }); }}
                      options={[{ value: "", label: "選択してください" }, { value: "松田 亮", label: "松田 亮" }, { value: "小川 純", label: "小川 純" }]}
                    />
                  ) : null}
                </div>
              ))}
            </div>
          </Section>
        ))
      ) : (
        <Section title="受託者に届く範囲" sub="受託者には自分の担当部分だけが届きます。ほかの人の担当・金額・社内の担当は表示されません">
          <div className="stack">
            <Select label="受託者" value={who} onChange={setWho} options={people.map((p) => ({ value: p, label: p }))} />
            {list.filter((w) => w.assignee?.name === who).map((w) => (
              <div key={w.id} className="ord-wp-card">
                <strong className="small">{w.title}</strong>
                <span className="tiny">完成条件: {w.criteria.join("／")}</span>
                <span className="tiny">入力資料: {w.inputs.join("、")}</span>
                <span className="tiny">前提となる作業: {w.depends_on.length ? "あり（窓口が完了を連絡します）" : "なし"}</span>
              </div>
            ))}
            <p className="tiny muted" style={{ margin: 0 }}>同じ納入物のほかの担当部分、社内担当の名前、他の受託者の報酬は表示しません。回答期限は {fmt("2026-11-30")} などの発注ごとの期限を使います。</p>
          </div>
        </Section>
      )}
    </ProjectLayout>
  );
}
