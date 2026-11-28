// 画面ID: Y-06 権利の発効・引渡明細
// 契約で定めた検収・支払等の条件と確認者を記録し、資産ごとの権利状態、納入版、ライセンス表示、運用上の残件を
// 引渡明細にまとめる。顧客が成果物を受け取った日と、契約上の権利が移る日を別々に記録する。
import { useState } from "react";
import { useRoute, useScreenState } from "../../lib/router";
import { paths } from "../../lib/paths";
import { formatDate, formatDateTime } from "../../lib/format";
import { ipById, rightsHandover } from "../../mocks/contracts";
import type { RightsHandoverItem } from "../../mocks/contracts";
import { Banner, Button, DataTable, ErrorState, PageHeader, ProjectLayout, Skeleton, StatCard, Tag, useToast } from "../../ui";
import type { Column } from "../../ui";
import { DispositionTag, LegalNote, PersonName, routeOrg, routeProject } from "./parts";

const STATE: Record<RightsHandoverItem["state"], { label: string; tone: "pass" | "warn" | "neutral" | "fail" }> = {
  effective: { label: "発効済み", tone: "pass" },
  waiting: { label: "条件待ち", tone: "warn" },
  notApplicable: { label: "移転なし", tone: "neutral" },
  blocked: { label: "権利確認待ち", tone: "fail" },
};

export function Y06RightsHandover() {
  const state = useScreenState();
  const params = useRoute().params;
  const org = routeOrg(params);
  const pr = routeProject(params);
  const toast = useToast();
  const [issued, setIssued] = useState(state === "issued");
  const rows = rightsHandover.filter((r) => r.project === pr);

  const cols: Column<RightsHandoverItem>[] = [
    { key: "asset", header: "資産", render: (r) => { const a = ipById(r.asset_id); return <span className="stack" style={{ ["--gap" as string]: "2px" }}><span className="strong small">{a?.name}</span><span className="row" style={{ ["--gap" as string]: "4px" }}>{a ? <DispositionTag value={a.disposition} /> : null}<span className="tiny muted mono">{r.asset_id}</span></span></span>; }, hideable: false },
    { key: "ver", header: "納入版", render: (r) => <span className="mono small">{r.delivered_version}</span> },
    { key: "recv", header: "受け取った日", render: (r) => <span className="small">{r.received_at ? formatDate(r.received_at) : "—"}</span>, sortValue: (r) => r.received_at ?? "" },
    { key: "eff", header: "権利が移る日", render: (r) => <span className="small">{r.effective_at ? formatDate(r.effective_at) : <span className="muted">未発効</span>}</span>, sortValue: (r) => r.effective_at ?? "" },
    {
      key: "cond", header: "発効条件と確認者", render: (r) => r.conditions.length ? (
        <ul className="stack" style={{ ["--gap" as string]: "2px", listStyle: "none", padding: 0, margin: 0 }}>
          {r.conditions.map((c) => (
            <li key={c.label} className="tiny">
              <Tag tone={c.done ? "pass" : "neutral"} square icon={c.done ? "check" : "clock"}>{c.done ? "済" : "未"}</Tag> {c.label}
              {c.confirmer_id ? <> · <PersonName id={c.confirmer_id} />{c.at ? `（${formatDateTime(c.at)}）` : ""}</> : null}
            </li>
          ))}
        </ul>
      ) : <span className="small muted">—</span>,
    },
    { key: "state", header: "権利の状態", render: (r) => <Tag tone={STATE[r.state].tone} square>{STATE[r.state].label}</Tag>, sortValue: (r) => r.state },
    { key: "notice", header: "ライセンス表示", render: (r) => <span className="small">{r.license_notice ?? "—"}</span> },
    { key: "remain", header: "残件", render: (r) => <span className="small">{r.remaining ?? "—"}</span> },
  ];

  return (
    <ProjectLayout org={org} project={pr} active="rightsHandover" trail={[{ label: "権利の引渡明細" }]}>
      <PageHeader
        title="権利の発効・引渡明細"
        description="資産ごとに、顧客が成果物を受け取った日と契約上の権利が移る日を分けて記録します。共同保有・利用許諾の資産は、合意した扱いのまま控えに記載します。"
        actions={
          <>
            <Button icon="book" to={paths.licenses(org, pr)}>再委託・ライセンス</Button>
            <Button variant="primary" icon="download" disabled={issued} disabledReason="この版の控えは発行済みです" onClick={() => { setIssued(true); toast({ kind: "success", message: "引渡明細の控えを発行しました（秘密値は含みません）" }); }}>控えを発行</Button>
          </>
        }
      />
      {state === "loading" ? (
        <Skeleton />
      ) : state === "error" ? (
        <ErrorState />
      ) : (
        <>
          <div className="grid auto-fit">
            <StatCard label="発効済み" icon="checkCircle" value={rows.filter((r) => r.state === "effective").length} unit="件" />
            <StatCard label="条件待ち" icon="clock" value={rows.filter((r) => r.state === "waiting").length} unit="件" tone="warn" />
            <StatCard label="権利確認待ち" icon="alert" value={rows.filter((r) => r.state === "blocked").length} unit="件" tone={rows.some((r) => r.state === "blocked") ? "danger" : undefined} />
          </div>
          {issued ? (
            <Banner tone="pass" title="控えを発行しました（2026/11/27 10:30 JST）">未発効・権利確認待ちの資産は、残件と担当を記載したまま控えに含めています。発行後に条件が満たされた場合は、新しい版の控えを発行します。</Banner>
          ) : null}
          <DataTable columns={cols} rows={rows} rowKey={(r) => r.id} />
          <LegalNote>受け取った日と権利の発効日は別の事実として記録します。権利の移転は、署名済み契約で定めた条件がそろった時点で記録します。</LegalNote>
        </>
      )}
    </ProjectLayout>
  );
}
