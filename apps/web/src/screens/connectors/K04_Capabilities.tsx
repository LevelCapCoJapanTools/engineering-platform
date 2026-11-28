// 画面ID: K-04 プロバイダー能力マトリクス
import "./connectors.css";
import { useState } from "react";
import { useScreenState, useRoute } from "../../lib/router";
import { ORG, paths } from "../../lib/paths";
import { CAPABILITY, CONNECTOR_CATEGORY } from "../../lib/vocab";
import type { CapabilityLevel, ConnectorCategory } from "../../lib/vocab";
import { capabilityGroups } from "../../mocks/connectors";
import { AppLayout, Banner, CapabilityCell, crumbs, ErrorState, PageHeader, ProviderBadge, Section, Segmented, Skeleton } from "../../ui";

export function K04Capabilities() {
  const state = useScreenState();
  const org = useRoute().params.org ?? ORG;
  const [cat, setCat] = useState<ConnectorCategory | "all">("all");
  const groups = capabilityGroups.filter((g) => cat === "all" || g.category === cat);

  return (
    <AppLayout org={org} active="connectors" breadcrumb={crumbs(org, undefined, { label: "連携と同期", to: paths.connectors(org) }, { label: "能力の比較" })}>
      <PageHeader title="プロバイダー能力マトリクス" description="サービスごとに、受け取れるイベント、書き込める結果、必須にできるゲートが異なります。未対応の能力も隠さずに示します。" />
      {state === "loading" ? (
        <Skeleton rows={6} />
      ) : state === "error" ? (
        <ErrorState />
      ) : (
        <div className="stack">
          <Banner tone="info" title="判定は同じ、書込みの方法が違う">
            ゲートの判定は、どのサービスでも保存済みの結果と版管理されたルールで同じように行います。違うのは、判定結果を PR／MR に反映し、マージを止める方法です。
          </Banner>
          <div className="row between">
            <Segmented
              value={cat}
              onChange={(v) => setCat(v as ConnectorCategory | "all")}
              options={[{ value: "all", label: "すべて" }, ...capabilityGroups.map((g) => ({ value: g.category, label: CONNECTOR_CATEGORY[g.category].label }))]}
            />
            <span className="row tiny muted" style={{ ["--gap" as string]: "10px" }}>
              {(Object.keys(CAPABILITY) as CapabilityLevel[]).map((k) => (
                <span key={k} className="row nowrap" style={{ ["--gap" as string]: "4px" }}><CapabilityCell level={k} />{CAPABILITY[k].label}</span>
              ))}
            </span>
          </div>
          {groups.map((g) => (
            <Section key={g.category} title={CONNECTOR_CATEGORY[g.category].label} sub={CONNECTOR_CATEGORY[g.category].description} flush>
              <div className="table-wrap">
                <table className="table kn-matrix">
                  <thead>
                    <tr>
                      <th>サービス</th>
                      {g.columns.map((c) => <th key={c.key}>{c.label}</th>)}
                      <th>方式・注記</th>
                    </tr>
                  </thead>
                  <tbody>
                    {g.rows.map((r) => (
                      <tr key={r.provider}>
                        <td><ProviderBadge provider={r.provider} showStatus /></td>
                        {g.columns.map((c) => <td key={c.key}><CapabilityCell level={r.values[c.key]} note={r.notes?.[c.key]} /></td>)}
                        <td className="kn-method small">
                          {r.method ?? "—"}
                          {r.notes ? (
                            <ul className="tiny muted" style={{ margin: "4px 0 0", paddingLeft: 16 }}>
                              {Object.entries(r.notes).map(([k, v]) => <li key={k}>{g.columns.find((c) => c.key === k)?.label}: {v}</li>)}
                            </ul>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          ))}
          <p className="tiny muted">チャットへの投稿の成功は、担当者に届いたことを意味しません。応答の保証が必要な通知はオンコール管理サービスを経由します。</p>
        </div>
      )}
    </AppLayout>
  );
}
