// 画面ID: S-07 プランと請求
import { useState } from "react";
import { useScreenState } from "../../lib/router";
import { ORG, paths } from "../../lib/paths";
import { yen } from "../../lib/format";
import { contract, invoices, plans, usage } from "../../mocks/settings";
import { Banner, Button, CoverageMeter, ErrorState, Icon, KeyValueList, Modal, OptionCard, PlanLimitNotice, Section, SettingsLayout, Skeleton, Tag, useToast } from "../../ui";

export function S07Billing({ org = ORG }: { org?: string }) {
  const state = useScreenState();
  const toast = useToast();
  const [changing, setChanging] = useState(false);
  const [plan, setPlan] = useState("Team");
  const [payment, setPayment] = useState(false);
  const atLimit = state === "上限到達";
  const failed = state === "支払い失敗";
  const seatUsed = atLimit ? 5 : usage.seats.used;

  return (
    <SettingsLayout org={org} active="billing" title="プランと請求" description="課金は経営層のシートとプロジェクト数で決まります。PM・開発者・QA・顧客などのアクターは課金対象外です。プランの変更は次回の請求から日割りで反映されます。">
      {state === "読み込み中" ? (
        <Skeleton variant="detail" />
      ) : state === "エラー" ? (
        <ErrorState />
      ) : (
        <>
          {failed ? (
            <Banner tone="fail" title="2026年11月分のお支払いができませんでした" action={<Button variant="primary" onClick={() => setPayment(true)}>支払い方法を変更</Button>}>
              カードの有効期限が切れています。2026-12-08 までに支払い方法を更新してください。期限を過ぎても、既存の証跡・監査ログ・ゲートの判定は止まりません。新しい連携と利用者の追加だけが停止します。
            </Banner>
          ) : null}
          {atLimit ? <PlanLimitNotice resource="経営層シート" used={5} limit={5} plan="Team" /> : null}

          <div className="grid cols-2">
            <section className="card stack">
              <div className="row between">
                <div>
                  <div className="label">現在のプラン</div>
                  <div className="row" style={{ marginTop: 4 }}>
                    <span style={{ fontSize: "var(--text-xl)", fontWeight: 700, color: "var(--text-strong)" }}>Team</span>
                    <Tag tone="primary">月額</Tag>
                  </div>
                </div>
                <Button variant="primary" onClick={() => setChanging(true)}>プランを変更</Button>
              </div>
              <div className="small muted">¥99,800／月（税別） · {contract.term}</div>
              <CoverageMeter label="経営層シート" value={seatUsed} total={usage.seats.limit} />
              <CoverageMeter label="プロジェクト" value={usage.projects.used} total={usage.projects.limit} />
              <div className="row between small"><span className="muted">外部IDで記録したアクター</span><span className="strong">{usage.actors.count}名（課金対象外）</span></div>
              <div className="row between small"><span className="muted">AI の費用（今月）</span><span className="strong">{yen(usage.aiCost.usedYen)}（含まれる枠 {yen(usage.aiCost.includedYen)}）</span></div>
              <div><Button size="sm" variant="ghost" iconRight="arrowRight" to={paths.usage(org)}>利用量の詳細</Button></div>
            </section>
            <section className="card stack">
              <div className="label">次回の請求</div>
              <div style={{ fontSize: "var(--text-2xl)", fontWeight: 700, color: "var(--text-strong)" }}>{yen(109780)}</div>
              <div className="small muted">2026-12-01 · 税込（Team ¥99,800 + 消費税）</div>
              <hr style={{ margin: "4px 0" }} />
              <KeyValueList
                items={[
                  { label: "支払い方法", value: <span className="row"><Icon name="creditCard" size={15} />クレジットカード ···· 4242{failed ? <Tag tone="fail">有効期限切れ</Tag> : <span className="tiny muted">有効期限 2028/04</span>}</span> },
                  { label: "請求先", value: "サンプルソフト株式会社 経理部" },
                  { label: "契約", value: contract.term },
                  { label: "支払状態", value: failed ? <Tag tone="fail">未払い（11月分）</Tag> : <Tag tone="pass">{contract.paymentStatus}</Tag> },
                ]}
              />
              <div><Button size="sm" icon="edit" onClick={() => setPayment(true)}>支払い方法を変更</Button></div>
            </section>
          </div>

          <div className="grid cols-2">
            <Section title="追加の契約" sub="シートやプロジェクトが足りないときに追加できます">
              <div className="table-wrap">
                <table className="table compact">
                  <thead><tr><th>項目</th><th>単価</th><th className="num">数量</th></tr></thead>
                  <tbody>
                    {contract.addOns.map((a) => (
                      <tr key={a.name}><td className="small">{a.name}</td><td className="small">{a.unit}</td><td className="num">{a.qty}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
            <Section title="上限に達したときの動作" sub="上限を超えても、記録済みのデータは失われません">
              <ul className="small" style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 4 }}>
                <li>証跡、Evidence Manifest、監査ログは保持期間どおり残ります</li>
                <li>ゲートの判定と既存の連携の同期は続きます</li>
                <li>シートの上限: 新しい利用者を招待できなくなります</li>
                <li>プロジェクトの上限: 新しいプロジェクトを作れなくなります</li>
                <li>AI 費用の上限: AI 機能だけが止まり、人の承認とゲートは動き続けます</li>
              </ul>
            </Section>
          </div>

          <Section title="請求書" flush>
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>請求書番号</th><th>対象期間</th><th>発行日</th><th className="num">金額（税込）</th><th>状態</th><th /></tr></thead>
                <tbody>
                  {invoices.map((inv, i) => (
                    <tr key={inv.id}>
                      <td className="mono small">{inv.id}</td>
                      <td>{inv.period}</td>
                      <td>{inv.issued_at}</td>
                      <td className="num">{yen(inv.amount)}</td>
                      <td>{failed && i === 0 ? <Tag tone="fail">未払い</Tag> : <Tag tone="pass">{inv.status}</Tag>}</td>
                      <td style={{ textAlign: "right" }}><Button size="sm" variant="ghost" icon="download">PDF</Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        </>
      )}

      <Modal
        open={changing}
        onClose={() => setChanging(false)}
        title="プランを変更"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setChanging(false)}>キャンセル</Button>
            <Button variant="primary" disabled={plan === "Team"} disabledReason="現在のプランです" onClick={() => { setChanging(false); toast({ kind: "success", message: plan === "Private" ? "担当者からご連絡します" : `${plan} プランに変更しました` }); }}>{plan === "Private" ? "問い合わせる" : "変更する"}</Button>
          </>
        }
      >
        <div className="grid cols-2" style={{ ["--gap" as string]: "12px" }}>
          {plans.map((p) => (
            <OptionCard
              key={p.key}
              name="plan"
              value={p.key}
              checked={plan === p.key}
              onChange={setPlan}
              title={p.key}
              disabled={p.key === "Starter" && (usage.projects.used > 3 || seatUsed > 2)}
              badge={p.key === "Team" ? <Tag tone="primary">現在のプラン</Tag> : <span className="small strong">{p.price}</span>}
              description={p.key === "Starter" && (usage.projects.used > 3 || seatUsed > 2) ? `${p.summary}（現在 シート ${seatUsed}・プロジェクト ${usage.projects.used} のため選べません）` : p.summary}
            />
          ))}
        </div>
      </Modal>

      <Modal
        open={payment}
        onClose={() => setPayment(false)}
        title="支払い方法を変更"
        size="sm"
        footer={<><Button variant="ghost" onClick={() => setPayment(false)}>キャンセル</Button><Button variant="primary" onClick={() => { setPayment(false); toast({ kind: "success", message: "支払い方法を更新しました" }); }}>更新</Button></>}
      >
        <div className="stack">
          <p className="small muted">カード情報は決済代行会社の画面で入力します。本サービスはカード番号を保存しません。</p>
          <Button block icon="external">決済代行会社の画面を開く</Button>
          <p className="tiny muted">請求書払い（銀行振込）をご希望の場合はお問い合わせください。</p>
        </div>
      </Modal>
    </SettingsLayout>
  );
}
