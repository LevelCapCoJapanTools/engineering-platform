// 画面ID: Y-03 知的資産台帳
// コード・設計・デザイン・商標・データ等を納入物単位で登録する。新規作成物、各社の持込資産、
// 受託者や第三者の素材を区別し、権利者・出所・版・根拠契約を記録する。
import { useState } from "react";
import { navigate, useRoute, useScreenState } from "../../lib/router";
import { paths } from "../../lib/paths";
import { IP_KIND, IP_ORIGIN, ipAssets } from "../../mocks/contracts";
import type { IpAsset, IpOrigin } from "../../mocks/contracts";
import { AudienceTag, Button, DataTable, EmptyState, ErrorState, FilterBar, PageHeader, ProjectLayout, Skeleton, StatCard, Tag } from "../../ui";
import type { Column } from "../../ui";
import { DispositionTag, LegalNote, routeOrg, routeProject } from "./parts";

const CHECK: Record<IpAsset["rights_check"], { label: string; tone: "pass" | "warn" | "fail" }> = {
  confirmed: { label: "確認済み", tone: "pass" },
  pending: { label: "権利確認待ち", tone: "warn" },
  missing: { label: "根拠が不足", tone: "fail" },
};

export function Y03IpAssets() {
  const state = useScreenState();
  const params = useRoute().params;
  const org = routeOrg(params);
  const pr = routeProject(params);
  const [values, setValues] = useState<Record<string, string>>(state === "filtered" ? { origin: "thirdParty" } : {});
  const [q, setQ] = useState("");
  const all = state === "empty" ? [] : ipAssets.filter((a) => a.project === pr);
  const rows = all.filter((a) => (!values.origin || a.origin === values.origin) && (!values.kind || a.kind === values.kind) && (!values.deliverable || a.deliverable === values.deliverable) && (!q || `${a.id}${a.name}${a.holder}`.includes(q)));
  const deliverables = [...new Set(all.map((a) => a.deliverable))];
  const count = (o: IpOrigin) => all.filter((a) => a.origin === o).length;

  const cols: Column<IpAsset>[] = [
    { key: "id", header: "ID", render: (a) => <span className="mono small">{a.id}</span>, sortValue: (a) => a.id, hideable: false },
    { key: "name", header: "資産", render: (a) => <span className="stack" style={{ ["--gap" as string]: "2px" }}><span className="strong">{a.name}</span><span className="tiny muted">{a.deliverable} · {IP_KIND[a.kind]}</span></span>, sortValue: (a) => a.name },
    { key: "origin", header: "区分", render: (a) => <Tag tone={IP_ORIGIN[a.origin].tone} square>{IP_ORIGIN[a.origin].label}</Tag>, sortValue: (a) => a.origin },
    { key: "holder", header: "現在の権利者", render: (a) => <span className="small">{a.holder}</span> },
    { key: "source", header: "出所・版", render: (a) => <span className="tiny"><span className="mono">{a.source}</span><br /><span className="muted">版 {a.version}</span></span>, defaultHidden: false },
    { key: "basis", header: "根拠契約", render: (a) => <span className="tiny">{a.basis}</span> },
    { key: "disp", header: "扱い", render: (a) => <DispositionTag value={a.disposition} />, sortValue: (a) => a.disposition },
    { key: "check", header: "権利の確認", render: (a) => <Tag tone={CHECK[a.rights_check].tone} square>{CHECK[a.rights_check].label}</Tag>, sortValue: (a) => a.rights_check },
    { key: "aud", header: "公開範囲", render: (a) => <AudienceTag value={a.customer_visible ? "customer" : "internal"} />, defaultHidden: true },
  ];

  return (
    <ProjectLayout org={org} project={pr} active="ipAssets" trail={[{ label: "知的資産" }]}>
      <PageHeader
        title="知的資産台帳"
        description="納入物ごとに、新規作成物・各社の持込資産・受託者や第三者の素材を分けて、権利者・出所・版・根拠契約を記録します。権利の扱いは署名済み契約の条項から登録します。"
        actions={
          <>
            <Button icon="book" to={paths.licenses(org, pr)}>再委託・ライセンス</Button>
            <Button variant="primary" icon="plus">資産を登録</Button>
          </>
        }
      />
      {state === "loading" ? (
        <Skeleton />
      ) : state === "error" ? (
        <ErrorState />
      ) : all.length === 0 ? (
        <div className="card"><EmptyState icon="package" title="知的資産はまだ登録されていません" description="納入物を構成するコード・デザイン・ロゴ・素材を登録すると、権利の扱いと確認状況を追跡できます。" /></div>
      ) : (
        <>
          <div className="grid auto-fit">
            <StatCard label="新規作成・受託者の作成" icon="commit" value={count("new") + count("freelancer")} unit="件" />
            <StatCard label="受注側の持込" icon="package" value={count("jvExisting")} unit="件" />
            <StatCard label="顧客の持込" icon="building" value={count("customerExisting")} unit="件" />
            <StatCard label="第三者の素材" icon="book" value={count("thirdParty")} unit="件" />
            <StatCard label="権利確認待ち・不足" icon="alert" value={all.filter((a) => a.rights_check !== "confirmed").length} unit="件" tone={all.some((a) => a.rights_check !== "confirmed") ? "warn" : undefined} />
          </div>
          <FilterBar
            values={values}
            onChange={(k, v) => setValues((x) => ({ ...x, [k]: v }))}
            search={q}
            onSearch={setQ}
            searchPlaceholder="資産名・権利者で絞り込み"
            filters={[
              { key: "deliverable", label: "納入物", options: deliverables.map((d) => ({ value: d, label: d })) },
              { key: "origin", label: "区分", options: (Object.keys(IP_ORIGIN) as IpOrigin[]).map((o) => ({ value: o, label: IP_ORIGIN[o].label })) },
              { key: "kind", label: "種類", options: Object.entries(IP_KIND).map(([k, v]) => ({ value: k, label: v })) },
            ]}
          />
          <DataTable
            columns={cols}
            rows={rows}
            rowKey={(a) => a.id}
            onRowClick={(a) => navigate(paths.ipAsset(org, pr, a.id))}
            empty={<EmptyState variant="filtered" icon="filter" title="条件に合う資産はありません" />}
          />
          <LegalNote />
        </>
      )}
    </ProjectLayout>
  );
}
