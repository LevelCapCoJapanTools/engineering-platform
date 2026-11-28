// 画面ID: B-05 発注・検収・請求・支払の照合
// 分納別に、検収額・請求書番号・支払期日・支払実績を照合し、一部検収・金額違い・二重請求を検出する。
// 支払期日は発注条件のまま。顧客の検収待ちや請求書の到着を理由に繰り下げない。本サービスの利用料（S-07）とは別。
import { useState } from "react";
import { useRoute, useScreenState } from "../../lib/router";
import { ORG, paths } from "../../lib/paths";
import { settlements } from "../../mocks/orders";
import type { Settlement } from "../../mocks/orders";
import { AppLayout, Banner, Button, crumbs, DataTable, EmptyState, ErrorState, FileUpload, IdLink, Modal, PageHeader, Skeleton, StatCard, Tag, useToast } from "../../ui";
import type { Column } from "../../ui";
import { fmt, InternalOnly, InternalYen } from "./parts";

const ISSUE: Record<NonNullable<Settlement["issue"]>, { label: string; tone: "fail" | "warn" | "special" }> = {
  partial: { label: "一部検収", tone: "special" },
  amountMismatch: { label: "金額違い", tone: "fail" },
  duplicateInvoice: { label: "二重請求", tone: "fail" },
  invoiceBeforeInspection: { label: "検収前の請求", tone: "warn" },
  overdue: { label: "支払期日超過", tone: "fail" },
};

export function B05Settlements() {
  const state = useScreenState();
  const org = useRoute().params.org ?? ORG;
  const toast = useToast();
  const [importOpen, setImportOpen] = useState(state === "import");
  const trail = crumbs(org, undefined, { label: "発注・支払の照合" });
  if (state === "loading") return <AppLayout org={org} active="settlements" breadcrumb={trail}><Skeleton rows={5} /></AppLayout>;
  if (state === "error") return <AppLayout org={org} active="settlements" breadcrumb={trail}><ErrorState /></AppLayout>;
  const rows = state === "empty" ? [] : settlements;
  const issues = rows.filter((r) => r.issue);

  const cols: Column<Settlement>[] = [
    { key: "order", header: "発注・分納", hideable: false, render: (r) => <span className="stack" style={{ ["--gap" as string]: "2px" }}><IdLink id={r.order_id} to={r.order_id.startsWith("ORD-01") ? paths.order(org, r.order_id) : undefined} /><span className="tiny muted">{r.installment}・{r.freelancer}</span></span> },
    { key: "received", header: "給付の受領日", render: (r) => <span className="small">{fmt(r.received_at)}</span> },
    { key: "inspected", header: "検収", render: (r) => (r.inspected_at ? <span className="stack" style={{ ["--gap" as string]: "2px" }}><InternalYen value={r.inspected_amount ?? 0} /><span className="tiny muted">{fmt(r.inspected_at)}</span></span> : <Tag square>検収前</Tag>) },
    { key: "invoice", header: "請求", render: (r) => (r.invoice_no ? <span className="stack" style={{ ["--gap" as string]: "2px" }}><span className="mono small">{r.invoice_no}</span><InternalYen value={r.invoice_amount ?? 0} /></span> : <span className="muted small">未受領</span>) },
    { key: "due", header: "支払期日", sortValue: (r) => r.payment_due, render: (r) => <span className="small strong">{fmt(r.payment_due)}</span> },
    { key: "paid", header: "支払実績", render: (r) => (r.paid_at ? <span className="stack" style={{ ["--gap" as string]: "2px" }}><Tag tone="pass" square icon="check">{fmt(r.paid_at)}</Tag><span className="tiny muted">{r.paid_source}</span></span> : <span className="muted small">—</span>) },
    { key: "issue", header: "照合の結果", render: (r) => (r.issue ? <span className="stack" style={{ ["--gap" as string]: "2px" }}><Tag tone={ISSUE[r.issue].tone} square icon="alert">{ISSUE[r.issue].label}</Tag><span className="tiny">{r.note}</span></span> : <Tag tone="pass" square>一致</Tag>) },
  ];

  return (
    <AppLayout org={org} active="settlements" breadcrumb={trail}>
      <PageHeader
        title="発注・検収・請求・支払の照合"
        description="受託者への発注ごとに、分納別の検収・請求・支払を照合します。支払は経理システムで行い、支払済みの記録を取り込みます。本サービスの利用料（プランと請求）とは別です。"
        actions={
          <>
            <Button icon="upload" onClick={() => setImportOpen(true)}>経理の支払記録を取込</Button>
            <Button icon="download" onClick={() => toast({ kind: "success", message: "経理向けの CSV（検収額・請求書番号・支払期日）を作成しました。報酬の明細は社内のみです" })}>経理へ CSV 出力</Button>
          </>
        }
      />
      <InternalOnly>受託者は自分の取引だけを F-07 で確認できます。ほかの受託者の金額や、顧客との契約額はここから受託者に出しません。</InternalOnly>
      <div className="grid auto-fit">
        <StatCard label="照合で見つかった不一致" value={issues.length} unit="件" tone={issues.length ? "danger" : "good"} delta="金額違い・二重請求・検収前の請求" />
        <StatCard label="今月の支払予定" value={rows.filter((r) => r.payment_due.startsWith("2026-11") && !r.paid_at).length} unit="件" delta="支払期日 11/30" />
        <StatCard label="支払済み" value={rows.filter((r) => r.paid_at).length} unit="件" delta="経理の記録から取込" />
      </div>
      <Banner tone="info" title="支払期日は繰り下げません">
        顧客の検収待ち、請求書の到着の遅れ、最終顧客の受入を理由に、受託者との発注条件で定めた支払期日を変えることはできません。金額や期日の不一致は窓口が受託者に照会します。
      </Banner>
      <DataTable
        columns={cols}
        rows={rows}
        rowKey={(r) => r.id}
        empty={<EmptyState icon="creditCard" title="照合する取引はありません" description="検収や請求があると表示されます。" />}
      />
      <Modal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        title="経理システムの支払記録を取り込む"
        description="支払済みの記録は経理側が正本です。本サービスでは支払の実行はしません"
        footer={
          <>
            <Button onClick={() => setImportOpen(false)}>キャンセル</Button>
            <Button variant="primary" onClick={() => { setImportOpen(false); toast({ kind: "success", message: "支払記録 2 件を取り込みました。重複する記録は 0 件でした" }); }}>取り込む</Button>
          </>
        }
      >
        <FileUpload label="支払記録（CSV）" accept=".csv" fileName="payments_2026-11.csv" />
        <p className="tiny muted">請求書番号と金額で照合します。同じ支払記録を2回取り込んでも、重複して支払済みにはなりません。</p>
      </Modal>
    </AppLayout>
  );
}
