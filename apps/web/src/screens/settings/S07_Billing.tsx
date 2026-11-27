// 画面ID: S-07 プランと請求
import { useState } from "react";
import { useScreenState } from "../../lib/router";
import { ORG } from "../../lib/paths";
import { yen } from "../../lib/format";
import { invoices, plans } from "../../mocks/settings";
import { Banner, Button, CoverageMeter, ErrorState, Icon, KeyValueList, Modal, OptionCard, PlanLimitNotice, Section, SettingsLayout, Skeleton, Tag, useToast } from "../../ui";

export function S07Billing({ org = ORG }: { org?: string }) {
  const state = useScreenState();
  const toast = useToast();
  const [changing, setChanging] = useState(false);
  const [plan, setPlan] = useState("Team");
  const [payment, setPayment] = useState(false);
  const atLimit = state === "上限到達";
  const failed = state === "支払い失敗";
  const repoUsed = atLimit ? 10 : 4;

  return (
    <SettingsLayout org={org} active="billing" title="プランと請求" description="プランの変更は次回の請求から日割りで反映されます。">
      {state === "読み込み中" ? (
        <Skeleton variant="detail" />
      ) : state === "エラー" ? (
        <ErrorState />
      ) : (
        <>
          {failed ? (
            <Banner tone="fail" title="2026年11月分のお支払いができませんでした" action={<Button variant="primary" onClick={() => setPayment(true)}>支払い方法を変更</Button>}>
              カードの有効期限が切れています。2026-12-08 までに支払い方法を更新してください。期限を過ぎると、新しいゲートの判定が停止します（証跡は保持されます）。
            </Banner>
          ) : null}
          {atLimit ? <PlanLimitNotice resource="リポジトリ" used={10} limit={10} plan="Team" /> : null}

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
              <div className="small muted">¥99,800／月（税別） · WORM 保管、監査ダッシュボード、SSO を含む</div>
              <CoverageMeter label="リポジトリ" value={repoUsed} total={10} />
              <div className="row between small"><span className="muted">メンバー</span><span className="strong">9名（上限なし）</span></div>
              <div className="row between small"><span className="muted">AI の利用量</span><span className="strong">今月 182件（目安内）</span></div>
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
                ]}
              />
              <div><Button size="sm" icon="edit" onClick={() => setPayment(true)}>支払い方法を変更</Button></div>
            </section>
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
              disabled={p.key === "Starter" && repoUsed > 3}
              badge={p.key === "Team" ? <Tag tone="primary">現在のプラン</Tag> : <span className="small strong">{p.price}</span>}
              description={p.key === "Starter" && repoUsed > 3 ? `${p.summary}（現在 ${repoUsed} リポジトリのため選べません）` : p.summary}
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
