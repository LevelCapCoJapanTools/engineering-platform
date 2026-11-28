// 画面ID: X-15 アプリ・資産の引き渡し（顧客）
// 発注企業が、配信名義の決定、組織登録・招待・移管の担当と未完了の項目、自社が Apple 上で行うこと、運用開始の受領を確認する（資料 56〜60 の顧客側）。
import { userById } from "../../mocks/core";
import { useState } from "react";
import { useScreenState } from "../../lib/router";
import { formatDate } from "../../lib/format";
import {
  Banner,
  Button,
  CustomerPortalLayout,
  ErrorState,
  ExternalActor,
  KeyValueList,
  Section,
  Skeleton,
  Tag,
  useToast,
} from "../../ui";
import { HANDOVER_METHODS, ROLE_SCOPE, distribution, handoverTasks, operationAssets } from "../../mocks/apphandover";
import type { HandoverMethod } from "../../mocks/apphandover";
import { AppleBoundary, PR, TaskStatus, WhereTag } from "./parts";

export const X15_STATES = ["新規公開（Apple確認待ち）", "招待の承認が必要", "運用開始の受領待ち", "受領済み", "アプリ移管", "読み込み中", "エラー"];

const CUSTOMER = "u-fujii";

export function X15PortalHandover() {
  const state = useScreenState();
  const toast = useToast();
  const [approved, setApproved] = useState(false);
  const [received, setReceived] = useState(state === "受領済み");
  const method: HandoverMethod = state === "アプリ移管" ? "transfer" : "newCustomer";
  const tasks = handoverTasks[method].map((t) =>
    state === "運用開始の受領待ち" || state === "受領済み" ? { ...t, status: "done" as const } : state === "招待の承認が必要" && t.id === "T-03" ? { ...t, status: "done" as const, note: "加入済み" } : t,
  );
  const mine = tasks.filter((t) => t.owner_side === "customer");
  const others = tasks.filter((t) => t.owner_side !== "customer");
  const openMine = mine.filter((t) => t.status !== "done");

  return (
    <CustomerPortalLayout project={PR} active="handover" userId={CUSTOMER}>
      <div className="stack" style={{ ["--gap" as string]: "4px" }}>
        <h1 style={{ fontSize: "var(--text-xl)", color: "var(--text-strong)" }}>アプリ・資産の引き渡し</h1>
        <p className="small muted">アプリを貴社の名義で配信し、運用を貴社に引き渡すまでの手続きです。Apple 上の手続きは貴社の担当者が行い、本サービスは担当・期限・再開先をご案内します。</p>
      </div>
      {state === "読み込み中" ? (
        <Skeleton variant="detail" />
      ) : state === "エラー" ? (
        <ErrorState />
      ) : (
        <>
          {received ? (
            <div className="ah-receipt">
              <strong>運用開始を受領しました</strong>
              <span className="small">受領者: 藤井 晃 · 受付番号 HO-0201 · 控えは「契約・知的資産」からも取得できます。JV の一時権限は解除済みです。</span>
            </div>
          ) : state === "運用開始の受領待ち" ? (
            <Banner tone="info" title="運用の引き渡しが整いました。内容を確認して受領してください">
              貴社の権限で次の版のアップロードと試験通知の受信を確認しました。受領すると、JV の一時権限を解除します。
            </Banner>
          ) : openMine.length ? (
            <Banner tone="warn" title={`貴社の対応が必要な作業が ${openMine.length} 件あります`}>
              {openMine.map((t) => `${t.title}（期限 ${formatDate(t.due)}）`).join("、")}
            </Banner>
          ) : null}

          <Section title="配信名義">
            <KeyValueList
              cols={2}
              items={[
                { label: "アプリ", value: method === "transfer" ? "架空リテール ポイントカード（iOS）" : `${distribution.app_name}（${distribution.platform}）` },
                { label: "配信する法人", value: distribution.publisher },
                { label: "方式", value: <Tag tone="info" square>{HANDOVER_METHODS[method].label}</Tag> },
                { label: "決定者", value: <ExternalActor userId={distribution.decided_by} /> },
              ]}
            />
            <p className="small muted" style={{ marginTop: 8 }}>{HANDOVER_METHODS[method].description}</p>
          </Section>

          <Section title="貴社が行うこと" flush>
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>作業</th><th>どこで</th><th>担当</th><th>期限</th><th>状態</th></tr></thead>
                <tbody>
                  {mine.map((t) => (
                    <tr key={t.id}>
                      <td><div className="strong small">{t.title}</div>{t.note ? <div className="tiny muted">{t.note}</div> : null}</td>
                      <td><WhereTag where={t.where} /></td>
                      <td><CustomerSideActor userId={t.owner} /></td>
                      <td className="small">{formatDate(t.due)}</td>
                      <td><TaskStatus status={t.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <AppleBoundary />

          {state === "招待の承認が必要" ? (
            <Section title="JV の作業者の招待の承認" sub="承認した宛先・役割・対象アプリだけが、貴社のチームに招待されます">
              <div className="row between">
                <div className="stack" style={{ ["--gap" as string]: "2px" }}>
                  <span className="strong small">青木 さくら（案件窓口）· Customer Support · 会員アプリのみ</span>
                  <span className="tiny muted">{ROLE_SCOPE["Customer Support"].note}</span>
                </div>
                <div className="row" style={{ ["--gap" as string]: "8px" }}>
                  <Button variant="ghost" disabled={approved} disabledReason="承認済みです" onClick={() => toast({ kind: "info", message: "理由を添えて差し戻しました" })}>差戻し</Button>
                  <Button variant="primary" icon="check" disabled={approved} disabledReason="承認済みです（二重に承認しません）" onClick={() => { setApproved(true); toast({ kind: "success", message: "招待を承認しました。受付番号 INV-03-A" }); }}>{approved ? "承認済み" : "承認"}</Button>
                </div>
              </div>
            </Section>
          ) : null}

          <Section title="受注側・案件窓口が行うこと" flush>
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>作業</th><th>担当</th><th>期限</th><th>状態</th></tr></thead>
                <tbody>
                  {others.map((t) => (
                    <tr key={t.id}>
                      <td className="small">{t.title}</td>
                      <td><CustomerSideActor userId={t.owner} /></td>
                      <td className="small">{formatDate(t.due)}</td>
                      <td><TaskStatus status={t.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="運用の引き渡し" sub="引き渡し後の責任者です。鍵やパスワードはこの画面に表示しません" flush>
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>資産</th><th>引き渡し先</th><th>期限</th></tr></thead>
                <tbody>
                  {operationAssets.map((a) => (
                    <tr key={a.id}>
                      <td className="small">{a.asset}</td>
                      <td className="small">{a.to.startsWith("u-") ? <CustomerSideActor userId={a.to} /> : a.to}</td>
                      <td className="small">{formatDate(a.due)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <div className="row end">
            <Button
              variant="primary"
              icon="check"
              disabled={received || state !== "運用開始の受領待ち"}
              disabledReason={received ? "受領済みです" : "運用の引き渡しの確認が済んでから受領できます"}
              onClick={() => { setReceived(true); toast({ kind: "success", message: "運用開始を受領しました。受付番号 HO-0201" }); }}
            >
              運用開始を受領
            </Button>
          </div>
        </>
      )}
    </CustomerPortalLayout>
  );
}

/** 顧客向けの担当者表示。受託者（フリーエンジニア）は個人名・外部IDを出さず、受注側の作業担当として示す（顧客との連絡は案件窓口が引き取る） */
function CustomerSideActor({ userId }: { userId: string }) {
  const u = userById(userId);
  if (u?.roles.includes("フリーエンジニア")) return <span className="small">受注側の作業担当（サンプルソフト株式会社）</span>;
  return <ExternalActor userId={userId} />;
}
