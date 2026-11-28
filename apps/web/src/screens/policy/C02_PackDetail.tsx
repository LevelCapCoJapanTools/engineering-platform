// 画面ID: C-02 Control Pack の詳細
import { useState } from "react";
import { navigate, useScreenState } from "../../lib/router";
import { ORG, paths } from "../../lib/paths";
import type { Control } from "../../lib/types";
import { controls, projects } from "../../mocks/core";
import { controlSources, evidenceTypes, packBySlug, rules } from "../../mocks/policy";
import type { AutoRule } from "../../mocks/policy";
import { formatDate } from "../../lib/format";
import {
  ActorLabel,
  AppLayout,
  Banner,
  Button,
  ControlLayerTag,
  CoverageMeter,
  crumbs,
  DataTable,
  EmptyState,
  EnforcementBadge,
  GateSummaryStrip,
  IdLink,
  KeyValueList,
  PageHeader,
  PolicyVersionTag,
  RoleBadge,
  Skeleton,
  Tabs,
  Tag,
} from "../../ui";
import type { Column } from "../../ui";

export function PackDetail({ org = ORG, pack: slug }: { org?: string; pack: string }) {
  const state = useScreenState();
  const pack = packBySlug(slug);
  const [tab, setTab] = useState("controls");
  const applied = projects.filter((p) => p.pack_version === pack.version);

  const controlCols: Column<Control>[] = [
    { key: "id", header: "CTL-ID", render: (c) => <span className="id-link">{c.id}</span>, sortValue: (c) => c.id, hideable: false },
    { key: "desc", header: "説明（自社作成）", render: (c) => c.description },
    {
      key: "source",
      header: "出典（番号のみ）",
      render: (c) => {
        const src = controlSources[c.id];
        return src ? <div className="stack" style={{ ["--gap" as string]: "2px" }}><span className="mono tiny">{src.doc}</span><span className="tiny muted">{src.clause} · {src.profile}</span></div> : <span className="muted small">—</span>;
      },
    },
    { key: "layer", header: "層", render: (c) => <ControlLayerTag layer={c.layer} />, sortValue: (c) => c.layer },
    { key: "proc", header: "プロセス・活動", render: (c) => <span className="small">{c.process} · {c.activity}</span>, sortValue: (c) => c.process + c.activity },
    { key: "ev", header: "必要な証跡", render: (c) => <span className="row" style={{ ["--gap" as string]: "4px" }}>{c.evidence_types.map((t) => <Tag key={t} square>{t}</Tag>)}</span> },
    { key: "machine", header: "機械検証", render: (c) => (c.machine_rule_ids.length ? <ActorLabel kind="ci" name={c.machine_rule_ids.join(", ")} size="sm" /> : <span className="muted small">なし</span>) },
    { key: "human", header: "人間承認", render: (c) => (c.human_role ? <RoleBadge role={c.human_role} /> : <span className="muted small">不要</span>) },
    {
      key: "review",
      header: "レビュー",
      render: (c) => {
        const r = controlSources[c.id]?.reviewed ?? "—";
        return <Tag tone={r.startsWith("レビュー済み") || r === "社内承認" ? "pass" : r.startsWith("差戻し") ? "fail" : "warn"} square>{r}</Tag>;
      },
    },
  ];
  const ruleCols: Column<AutoRule>[] = [
    { key: "id", header: "ルールID", render: (r) => <span className="mono strong small">{r.id}</span>, sortValue: (r) => r.id, hideable: false },
    { key: "control", header: "統制項目", render: (r) => <span className="id-link">{r.control_id}</span>, sortValue: (r) => r.control_id },
    { key: "gate", header: "ゲート", render: (r) => <Tag square>ゲート{r.gate}</Tag>, sortValue: (r) => r.gate },
    { key: "level", header: "既定の強制レベル", render: (r) => <EnforcementBadge level={r.level} /> },
    { key: "desc", header: "説明", render: (r) => <span className="small">{r.description}</span> },
  ];

  return (
    <AppLayout org={org} active="policies" breadcrumb={crumbs(org, undefined, { label: "ポリシー", to: paths.policies(org) }, { label: `${pack.name} ${pack.version}` })}>
      <PageHeader
        title={pack.name}
        meta={<><PolicyVersionTag pack="バージョン" version={pack.version} outdated={pack.latest !== pack.version} /><Tag square>{pack.profile}</Tag><span className="small muted">公開 {formatDate(pack.published_at)}</span></>}
        actions={
          <>
            <Button icon="target" to={paths.packScope(org, pack.slug)}>適用範囲</Button>
            <Button icon="book" to={paths.packSources(org, pack.slug)}>出典と利用許諾</Button>
            <Button icon="history" to={paths.packReviews(org, pack.slug)}>レビュー記録</Button>
            <Button icon="compare" to={paths.policyDiff(org, pack.slug)}>バージョン比較</Button>
            <Button variant="primary" icon="edit" to={paths.tailoring(org, pack.slug)}>組織での調整</Button>
          </>
        }
        tabs={
          <Tabs
            value={tab}
            onChange={setTab}
            tabs={[
              { value: "controls", label: "統制項目", count: controls.length },
              { value: "rules", label: "自動ルール", count: rules.length },
              { value: "evidence", label: "証跡の種類", count: evidenceTypes.length },
              { value: "projects", label: "適用中のプロジェクト", count: applied.length },
            ]}
          />
        }
      />
      <Banner tone="info" title="この画面は閲覧のみです">
        Control Pack は製品側で提供します。統制項目を適用しない、別の証跡で代替する、強制レベルを変えるといった変更は「組織での調整（C-03）」から申請してください。
        規格の本文は含まれていません。説明は自社で作成したもので、出典は規格の番号と箇条番号だけを示します。統制項目は「規範・ガイド・組織調整・自動ルール」の4層に分け、ガイドの例示を規格の要求として扱いません。
      </Banner>
      {state === "loading" ? (
        <Skeleton rows={6} />
      ) : tab === "controls" ? (
        <DataTable columns={controlCols} rows={controls} rowKey={(c) => c.id} />
      ) : tab === "rules" ? (
        <DataTable columns={ruleCols} rows={rules} rowKey={(r) => r.id} />
      ) : tab === "evidence" ? (
        <div className="grid cols-2">
          {evidenceTypes.map((e) => (
            <div key={e.name} className="card tight stack" style={{ ["--gap" as string]: "8px" }}>
              <div className="row between"><span className="strong">{e.name}</span><Tag square>{e.collected_by}</Tag></div>
              <span className="small muted">{e.description}</span>
              <span className="row" style={{ ["--gap" as string]: "6px" }}>{e.controls.map((c) => <IdLink key={c} id={c} />)}</span>
            </div>
          ))}
        </div>
      ) : applied.length ? (
        <div className="grid cols-2">
          {applied.map((p) => (
            <button key={p.id} type="button" className="card tight interactive stack" style={{ ["--gap" as string]: "10px", textAlign: "left", font: "inherit", color: "inherit" }} onClick={() => navigate(paths.project(org, p.slug))}>
              <div className="row between"><span className="strong">{p.name}</span><GateSummaryStrip gates={p.main_gates} /></div>
              <KeyValueList items={[{ label: "顧客", value: p.customer }, { label: "強制レベル", value: <EnforcementBadge level={p.enforcement} /> }]} />
              <CoverageMeter value={p.trace_linked} total={p.trace_total} label="トレーサビリティ" />
            </button>
          ))}
        </div>
      ) : (
        <div className="card"><EmptyState icon="folder" title="このバージョンを適用中のプロジェクトはありません" /></div>
      )}
    </AppLayout>
  );
}
