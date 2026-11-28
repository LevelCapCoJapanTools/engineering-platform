// 画面ID: F-07 取引履歴
import "./freelancer.css";
import { useState } from "react";
import { useScreenState } from "../../lib/router";
import { formatDate, yen } from "../../lib/format";
import { PAYMENT_STATUS } from "../../lib/vocab";
import { myPayments } from "../../mocks/freelancer";
import { Banner, Button, EmptyState, FreelancerLayout, freelancerClients, Modal, Section, Select, StatusBadge, TextArea, useToast } from "../../ui";
import { Receipt, useClient } from "./parts";

export function F07History() {
  const state = useScreenState();
  const toast = useToast();
  const clients = freelancerClients();
  const [client, setClient] = useClient(state === "依頼元を切替" ? clients[1] : undefined);
  const base = state === "空" ? [] : myPayments.filter((p) => p.client_company === client);
  // 「不一致を照会」: 支払額が検収額と一致しない例
  const rows = state === "不一致を照会" ? base.map((p) => (p.order_id === "ORD-0104" ? { ...p, paid_amount: 700_000, status: "mismatch" as const } : p)) : base;
  const [inquiryOpen, setInquiryOpen] = useState(state === "不一致を照会");
  const [target, setTarget] = useState(rows.find((r) => r.status === "mismatch")?.order_id ?? rows[0]?.order_id ?? "");
  const [kind, setKind] = useState("amount");
  const [detail, setDetail] = useState("");
  const [sent, setSent] = useState(false);
  const ordered = rows.reduce((n, r) => n + r.ordered, 0);
  const inspected = rows.reduce((n, r) => n + r.inspected, 0);
  const paid = rows.reduce((n, r) => n + (r.paid_amount ?? 0), 0);

  return (
    <FreelancerLayout active="history" client={client} onClientChange={setClient}>
      <div className="stack" style={{ ["--gap" as string]: "4px" }}>
        <h1 style={{ fontSize: "var(--text-xl)", color: "var(--text-strong)" }}>提出・取引履歴</h1>
        <p className="small muted">{client} との取引のうち、あなたの分だけを表示しています。</p>
      </div>

      <Banner tone="info">支払期日は発注条件のとおりです。発注企業の受入を待つことや、請求書の到着日を理由に支払期日を繰り下げることはありません。</Banner>

      {rows.length === 0 ? (
        <div className="card"><EmptyState icon="creditCard" title="まだ取引の記録はありません" description="依頼を引き受けると、発注額・検収・支払の予定がここに表示されます。" /></div>
      ) : (
        <>
          <div className="grid auto-fit">
            <div className="card tight stack" style={{ ["--gap" as string]: "2px" }}><span className="tiny muted">発注額の合計</span><strong className="fx-money">{yen(ordered)}</strong></div>
            <div className="card tight stack" style={{ ["--gap" as string]: "2px" }}><span className="tiny muted">検収済み</span><strong className="fx-money">{yen(inspected)}</strong></div>
            <div className="card tight stack" style={{ ["--gap" as string]: "2px" }}><span className="tiny muted">支払済み</span><strong className="fx-money">{yen(paid)}</strong></div>
          </div>

          <Section title="依頼ごとの取引" flush actions={<Button size="sm" icon="help" onClick={() => { setInquiryOpen(true); setSent(false); }}>金額・期日を照会</Button>}>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr><th>依頼</th><th>発注額</th><th>検収額</th><th>請求</th><th>支払期日</th><th>支払実績</th><th>状態</th><th>帳票</th></tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.order_id}>
                      <td><span className="mono tiny muted">{r.order_id}</span><div className="small">{r.title}</div></td>
                      <td className="fx-money">{yen(r.ordered)}</td>
                      <td className="fx-money">{r.inspected ? yen(r.inspected) : "—"}</td>
                      <td className="small">{r.invoice_no ? <><span className="mono">{r.invoice_no}</span><div className="tiny muted">{formatDate(r.invoice_at ?? "")}</div></> : "—"}</td>
                      <td className="small">{formatDate(r.payment_due)}</td>
                      <td className="small fx-money">{r.paid_at ? <>{yen(r.paid_amount ?? 0)}<div className="tiny muted">{formatDate(r.paid_at)}</div></> : "—"}</td>
                      <td><StatusBadge vocab={PAYMENT_STATUS[r.status]} size="sm" /></td>
                      <td>
                        <div className="row" style={{ ["--gap" as string]: "4px", flexWrap: "nowrap" }}>
                          <Button size="sm" variant="ghost" icon="download" onClick={() => toast({ kind: "success", message: `${r.order_id} の発注書（受諾した版）を保存しました` })}>発注書</Button>
                          <Button size="sm" variant="ghost" icon="download" disabled={r.order_id === "ORD-0106" || r.order_id === "ORD-0201"} disabledReason="まだ提出していません" onClick={() => toast({ kind: "success", message: `${r.order_id} の提出控えを保存しました` })}>提出控え</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
          <p className="tiny muted">表示しているのはあなたへの発注額だけです。依頼元と発注企業の契約金額や、ほかの方への発注額は表示されません。帳票は契約が終わったあとも取得できます。</p>
        </>
      )}

      <Modal
        open={inquiryOpen}
        onClose={() => setInquiryOpen(false)}
        title="金額・期日の照会"
        description="窓口が依頼元の経理と確認し、回答します"
        footer={sent ? <Button onClick={() => setInquiryOpen(false)}>閉じる</Button> : (
          <>
            <Button variant="ghost" onClick={() => setInquiryOpen(false)}>キャンセル</Button>
            <Button variant="primary" disabled={!detail.trim()} disabledReason="内容を入力してください" onClick={() => setSent(true)}>照会する</Button>
          </>
        )}
      >
        {sent ? (
          <Receipt title="照会を受け付けました" number="PAYQ-0007" at="2026-11-27T10:36:00+09:00"><span className="small">回答予定: 2026/11/30</span></Receipt>
        ) : (
          <div className="stack">
            {state === "不一致を照会" ? <Banner tone="fail" title="支払額が検収額と一致していません">ORD-0104: 検収額 ¥750,000 に対して、支払額は ¥700,000 です。</Banner> : null}
            <Select label="対象の依頼" value={target} onChange={setTarget} options={rows.map((r) => ({ value: r.order_id, label: `${r.order_id} ${r.title}` }))} />
            <Select label="照会の種類" value={kind} onChange={setKind} options={[{ value: "amount", label: "金額が違う" }, { value: "date", label: "支払日・期日が違う" }, { value: "double", label: "二重に請求・支払されている" }, { value: "other", label: "その他" }]} />
            <TextArea label="内容" required rows={3} value={detail} onChange={setDetail} placeholder="例: 検収額 75万円に対して、70万円の入金でした" />
          </div>
        )}
      </Modal>
    </FreelancerLayout>
  );
}
