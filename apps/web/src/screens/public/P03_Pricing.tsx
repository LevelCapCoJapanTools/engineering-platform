// 画面ID: P-03 料金
import "./public.css";
import { useState } from "react";
import { Accordion, Button, Icon, PublicLayout, Segmented, Tag } from "../../ui";
import { paths } from "../../lib/paths";
import { yen } from "../../lib/format";
import { comparison, faqs, plans, services } from "../../mocks/public";

export function P03Pricing() {
  const [cycle, setCycle] = useState<"monthly" | "yearly">("monthly");
  return (
    <PublicLayout>
      <section className="section" style={{ paddingBottom: 32 }}>
        <div className="container stack" style={{ ["--gap" as string]: "14px", alignItems: "center", textAlign: "center" }}>
          <span className="eyebrow">PRICING</span>
          <h1 className="display" style={{ fontSize: "clamp(28px, 4vw, 40px)" }}>料金</h1>
          <p className="lead">経営層のシートとプロジェクト数で選べます。開発者・PM・QA・顧客の分は料金がかかりません。価格は税抜です（掲載価格は仮のものです）。</p>
          <Segmented value={cycle} onChange={(v) => setCycle(v as "monthly" | "yearly")} options={[{ value: "monthly", label: "月額" }, { value: "yearly", label: "年額（約17%お得）" }]} />
        </div>
      </section>
      <section className="container" style={{ paddingBottom: 56 }}>
        <div className="grid cols-4" style={{ alignItems: "stretch" }}>
          {plans.map((p) => {
            const price = cycle === "monthly" ? p.monthly : p.yearlyMonthly;
            return (
              <div key={p.key} className={`price-card${p.featured ? " featured" : ""}`}>
                {p.featured ? <span style={{ position: "absolute", top: -12, left: 24 }}><Tag tone="primary">おすすめ</Tag></span> : null}
                <div className="stack" style={{ ["--gap" as string]: "4px" }}>
                  <strong className="strong" style={{ fontSize: "var(--text-md)" }}>{p.name}</strong>
                  <span className="small muted">{p.target}</span>
                </div>
                <div>
                  {price !== null ? (
                    <>
                      <span className="price">{yen(price)}{p.priceNote ?? ""}</span>
                      <span className="small muted"> /月{cycle === "yearly" ? "（年額払い）" : ""}</span>
                    </>
                  ) : (
                    <span className="price" style={{ fontSize: "var(--text-lg)" }}>{p.priceNote}</span>
                  )}
                </div>
                <ul>{p.features.map((f) => <li key={f}><Icon name="check" />{f}</li>)}</ul>
                <div style={{ marginTop: "auto" }}>
                  <Button variant={p.featured ? "primary" : "secondary"} block to={p.key === "private" ? paths.contact() : paths.signin()}>{p.cta}</Button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
      <section className="section alt">
        <div className="container stack" style={{ ["--gap" as string]: "16px" }}>
          <h2 className="headline">機能比較</h2>
          <div className="card flush table-wrap">
            <table className="table compare-table">
              <thead>
                <tr><th>機能</th>{plans.map((p) => <th key={p.key}>{p.name}</th>)}</tr>
              </thead>
              <tbody>
                {comparison.map((row) => (
                  <tr key={row.label}>
                    <td>{row.label}</td>
                    {row.values.map((v, i) => (
                      <td key={i}>{typeof v === "string" ? v : v ? <Icon name="check" className="text-pass" label="あり" /> : <span className="muted" aria-label="なし">—</span>}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container stack" style={{ ["--gap" as string]: "16px" }}>
          <h2 className="headline">プロジェクト単位の契約・追加サービス</h2>
          <div className="grid cols-3">
            {services.map((s) => (
              <div key={s.name} className="card stack" style={{ ["--gap" as string]: "8px" }}>
                <div className="row between"><strong className="strong">{s.name}</strong><span className="strong">{s.price}</span></div>
                <p className="small muted">{s.body}</p>
              </div>
            ))}
          </div>
          <p className="small muted">事前点検は認証ではありません。認証は第三者の認証機関が行います。</p>
        </div>
      </section>
      <section className="section alt">
        <div className="container stack" style={{ ["--gap" as string]: "16px", maxWidth: 820 }}>
          <h2 className="headline">よくある質問</h2>
          <Accordion items={faqs.map((f) => ({ title: f.q, body: f.a }))} defaultOpen={0} />
        </div>
      </section>
    </PublicLayout>
  );
}
