// 画面ID: C-04 ポリシーのバージョン比較
import { useState } from "react";
import { useScreenState } from "../../lib/router";
import { ORG, paths } from "../../lib/paths";
import { migrationImpact, packBySlug, packDiff } from "../../mocks/policy";
import {
  AppLayout,
  Button,
  crumbs,
  DiffViewer,
  EmptyState,
  Icon,
  PageHeader,
  Section,
  Select,
  StatusBadge,
  Tag,
} from "../../ui";

const VERSIONS = ["1.1.0", "1.2.1", "1.3.0", "1.3.1"];
const KIND = { added: { label: "追加", tone: "pass" as const, icon: "plus" as const }, changed: { label: "変更", tone: "warn" as const, icon: "edit" as const }, removed: { label: "削除", tone: "fail" as const, icon: "minus" as const } };

export function PolicyDiff({ org = ORG, pack: slug }: { org?: string; pack: string }) {
  const state = useScreenState();
  const pack = packBySlug(slug);
  const [from, setFrom] = useState("1.3.0");
  const [to, setTo] = useState("1.3.1");
  const same = from === to || state === "noDiff";
  const entries = same ? [] : packDiff;
  return (
    <AppLayout org={org} active="policies" breadcrumb={crumbs(org, undefined, { label: "ポリシー", to: paths.policies(org) }, { label: `${pack.name} ${pack.version}`, to: paths.policy(org, pack.slug) }, { label: "バージョン比較" })}>
      <PageHeader title="バージョンの比較" description="2つのバージョンで、追加・変更・削除された統制項目と自動ルールを比べます。" actions={<Button variant="primary" icon="arrowRight" to={paths.migration(org, pack.slug, "MIG-002")} disabled={same}>移行レポートを作成</Button>} />
      <div className="card row" style={{ ["--gap" as string]: "16px", alignItems: "flex-end" }}>
        <div style={{ width: 200 }}><Select label="比較元" value={from} onChange={setFrom} options={VERSIONS.map((v) => ({ value: v, label: `${pack.name} ${v}` }))} /></div>
        <Icon name="arrowRight" className="muted" />
        <div style={{ width: 200 }}><Select label="比較先" value={to} onChange={setTo} options={VERSIONS.map((v) => ({ value: v, label: `${pack.name} ${v}` }))} /></div>
        {!same ? (
          <div className="row" style={{ marginLeft: "auto" }}>
            {(["added", "changed", "removed"] as const).map((k) => <Tag key={k} tone={KIND[k].tone} icon={KIND[k].icon}>{KIND[k].label} {packDiff.filter((d) => d.kind === k).length}</Tag>)}
          </div>
        ) : null}
      </div>
      {same ? (
        <div className="card"><EmptyState icon="compare" title="差分はありません" description="比較する2つのバージョンを変えてください。" /></div>
      ) : (
        <>
          <Section title="変更の一覧" sub={`${from} → ${to}`}>
            <div className="stack">
              {entries.map((d) => (
                <div key={d.id} className="stack" style={{ ["--gap" as string]: "8px" }}>
                  <div className="row">
                    <Tag tone={KIND[d.kind].tone} icon={KIND[d.kind].icon}>{KIND[d.kind].label}</Tag>
                    <Tag square>{d.target}</Tag>
                    <span className="mono strong">{d.id}</span>
                  </div>
                  <DiffViewer before={d.before ?? ""} after={d.after ?? ""} beforeLabel={from} afterLabel={to} />
                </div>
              ))}
            </div>
          </Section>
          <Section title="影響を受けるプロジェクト" flush>
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>プロジェクト</th><th className="num">新たに未充足になる統制項目</th><th className="num">変更されるルール</th><th>見込み</th></tr></thead>
                <tbody>
                  {migrationImpact.map((m) => (
                    <tr key={m.project}>
                      <td className="strong">{m.project}</td>
                      <td className="num">{m.newly_missing}</td>
                      <td className="num">{m.changed_rules}</td>
                      <td><StatusBadge vocab={m.status === "ready" ? { label: "そのまま移行可", tone: "pass" } : m.status === "attention" ? { label: "対応が必要", tone: "warn" } : { label: "移行前に対応必須", tone: "fail" }} size="sm" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        </>
      )}
    </AppLayout>
  );
}
