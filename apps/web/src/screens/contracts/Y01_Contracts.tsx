// 画面ID: Y-01 契約書庫
// 基本契約・個別契約・業務提携契約・変更覚書を案件に結び付け、当事者・有効期間・関連版・状態を示す。
// 受注側とフリーエンジニアの契約は「受託者との契約」として分け、顧客の画面・検索・添付には出さない。
import { useState } from "react";
import { navigate, useRoute, useScreenState } from "../../lib/router";
import { paths } from "../../lib/paths";
import { formatDate } from "../../lib/format";
import { projectBySlug } from "../../mocks/core";
import { engagementOf } from "../../mocks/engagement";
import { CONTRACT_KIND, contracts } from "../../mocks/contracts";
import type { Contract } from "../../mocks/contracts";
import { AudienceTag, Banner, Button, DataTable, EmptyState, ErrorState, PageHeader, ProjectLayout, RelationshipTag, Skeleton, StatCard, Tabs, Tag } from "../../ui";
import type { Column } from "../../ui";
import { ContractStatusBadge, LegalNote, routeOrg, routeProject } from "./parts";

export function Y01Contracts() {
  const state = useScreenState();
  const params = useRoute().params;
  const org = routeOrg(params);
  const pr = routeProject(params);
  const eng = engagementOf(pr);
  const [tab, setTab] = useState<"customer" | "freelance">("customer");
  const all = state === "empty" ? [] : contracts.filter((c) => c.project === pr);
  const customerSide = all.filter((c) => c.kind !== "freelance");
  const freelance = all.filter((c) => c.kind === "freelance");
  const rows = tab === "customer" ? customerSide : freelance;
  const pendingSign = customerSide.filter((c) => c.status === "signing" || c.status === "reviewed").length;
  const negotiating = customerSide.filter((c) => c.status === "negotiating" || c.status === "declined").length;

  const cols: Column<Contract>[] = [
    { key: "id", header: "ID", render: (c) => <span className="mono small">{c.id}</span>, sortValue: (c) => c.id, hideable: false },
    { key: "title", header: "契約", render: (c) => <span className="stack" style={{ ["--gap" as string]: "2px" }}><span className="strong">{c.title}</span><span className="tiny muted">{CONTRACT_KIND[c.kind]}{c.parent_id ? ` · ${c.parent_id} の変更` : ""}</span></span>, sortValue: (c) => c.title },
    { key: "parties", header: "当事者", render: (c) => <span className="small">{c.parties.join(" ⇔ ")}</span> },
    { key: "period", header: "有効期間", render: (c) => <span className="small">{formatDate(c.period.start)}〜{formatDate(c.period.end)}</span>, sortValue: (c) => c.period.start },
    { key: "version", header: "版", render: (c) => <Tag square>v{c.version}</Tag>, align: "right" },
    { key: "related", header: "関連", render: (c) => <span className="tiny muted">{c.related.join("、")}</span>, defaultHidden: tab === "freelance" },
    { key: "status", header: "状態", render: (c) => <ContractStatusBadge c={c} />, sortValue: (c) => c.status },
    { key: "aud", header: "公開範囲", render: (c) => <AudienceTag value={c.customer_visible ? (eng?.relationship === "alliance" ? "alliance" : "customer") : "internal"} /> },
  ];

  return (
    <ProjectLayout org={org} project={pr} active="contracts" trail={[{ label: "契約書庫" }]}>
      <PageHeader
        title="契約書庫"
        description={`${projectBySlug(pr).name} に適用される契約を当事者ごとに保管します。原本は電子契約サービスで締結され、締結済みの原本と証明記録を取り込みます。`}
        meta={eng ? <span className="row" style={{ ["--gap" as string]: "6px" }}><RelationshipTag value={eng.relationship} /><span className="small muted">{eng.customer_company}</span></span> : undefined}
        actions={<Button icon="external" to={paths.portalContracts(pr)}>顧客の見え方</Button>}
      />
      {state === "loading" ? (
        <Skeleton />
      ) : state === "error" ? (
        <ErrorState />
      ) : all.length === 0 ? (
        <div className="card">
          <EmptyState icon="fileCheck" title="この案件の契約はまだありません" description="基本契約・個別契約を登録すると、条項の協議と署名の状況をここで追跡できます。" action={<Button variant="primary" icon="plus">契約案を登録</Button>} />
        </div>
      ) : (
        <>
          <div className="grid auto-fit">
            <StatCard label="締結済み" icon="fileCheck" value={customerSide.filter((c) => c.status === "signed").length} unit="件" delta="顧客との契約" />
            <StatCard label="署名待ち" icon="signature" value={pendingSign} unit="件" tone={pendingSign ? "warn" : undefined} delta="確認済み・未締結を含む" />
            <StatCard label="協議中・辞退" icon="message" value={negotiating} unit="件" tone={negotiating ? "warn" : undefined} delta="未合意の条項あり" />
            <StatCard label="受託者との契約" icon="lock" value={freelance.length} unit="件" delta="社内のみ・顧客非公開" />
          </div>
          <Tabs
            value={tab}
            onChange={(v) => setTab(v as "customer" | "freelance")}
            tabs={[
              { value: "customer", label: "顧客との契約", count: customerSide.length },
              { value: "freelance", label: "受託者との契約（社内のみ）", count: freelance.length, icon: "lock" },
            ]}
          />
          {tab === "freelance" ? (
            <Banner tone="info" title="受託者との契約は顧客に公開しません">顧客ポータルの一覧・検索・添付・出力には表示されません。委託単価や報酬は、受託者本人と受注側の権限者だけが閲覧できます。</Banner>
          ) : null}
          <DataTable columns={cols} rows={rows} rowKey={(c) => c.id} onRowClick={(c) => navigate(paths.contract(org, pr, c.id))} />
          <LegalNote />
        </>
      )}
    </ProjectLayout>
  );
}
