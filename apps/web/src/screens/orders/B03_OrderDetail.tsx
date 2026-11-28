// 画面ID: B-03 発注の詳細
// 条件の版と差分、受諾した版、受託者との相談、提出、委託元の検収（完成条件ごと・分納）、修正と追加依頼の仕分け。
// 委託元の検収は最終顧客の受入とは別の記録。顧客の受入が未回答でも、給付の受領日と支払期日は保持する。
import { useState } from "react";
import { useRoute, useScreenState } from "../../lib/router";
import { ORG, paths } from "../../lib/paths";
import { formatDateTime, yen } from "../../lib/format";
import { CUSTOMER_ACCEPTANCE, INSPECTION_STATUS, ORDER_STATUS } from "../../lib/vocab";
import type { OrderTerms } from "../../lib/types";
import { latestTerms, orderById, submissions } from "../../mocks/engagement";
import { DESIGNATED_INSPECTOR, ORDER_ISSUER, installments, negotiations, ownOrders, partialExample, triage } from "../../mocks/orders";
import type { Installment } from "../../mocks/orders";
import {
  AppLayout,
  Banner,
  Button,
  crumbs,
  DetailLayout,
  EmptyState,
  ErrorState,
  ExternalActor,
  HashDisplay,
  IdLink,
  MetaSection,
  Modal,
  PageHeader,
  Section,
  Segmented,
  Skeleton,
  SoDNotice,
  StatusBadge,
  Tag,
  TextArea,
  TradeStateStrip,
  useToast,
  VersionPin,
} from "../../ui";
import { fmt, InternalYen, Kv, projectName, userName } from "./parts";
import { userById } from "../../mocks/core";

const FIELDS: { key: keyof OrderTerms; label: string }[] = [
  { key: "scope", label: "作業内容" },
  { key: "out_of_scope", label: "対象外" },
  { key: "deliverable", label: "納入物" },
  { key: "delivery_to", label: "納入先" },
  { key: "due", label: "納入期日" },
  { key: "completion_criteria", label: "完成条件" },
  { key: "inspection_due", label: "検査期日" },
  { key: "fee", label: "報酬" },
  { key: "payment_due", label: "支払期日" },
  { key: "payment_method", label: "支払方法" },
];

const show = (t: OrderTerms, k: keyof OrderTerms) => {
  const v = t[k];
  if (k === "fee") return yen(v as number);
  if (Array.isArray(v)) return v.join("／");
  return String(v ?? "—");
};

export function B03OrderDetail({ id }: { id?: string }) {
  const state = useScreenState();
  const org = useRoute().params.org ?? ORG;
  const toast = useToast();
  const orderId = state === "partial" ? "ORD-0102" : state === "offered" ? "ORD-0103" : id && ownOrders.some((o) => o.id === id) ? id : "ORD-0101";
  const order = orderById(orderId)!;
  const terms = latestTerms(order);
  const first = order.terms[0];
  const asInspector = state === "asInspector" || state === "returned" || state === "partial";
  const viewer = asInspector ? DESIGNATED_INSPECTOR[order.project] : "u-kimura";
  const issuer = ORDER_ISSUER[order.id];
  const [kind, setKind] = useState<"deliverable" | "timeReport">("deliverable");
  const [inst, setInst] = useState<Installment[]>(
    state === "partial"
      ? partialExample
      : state === "returned"
        ? installments[order.id]?.map((i) => ({ ...i, status: "returned" as const, items: i.items.map((x) => (x.result === "pending" ? { ...x, result: "return" as const, note: "1万行で 12.4 秒。完成条件（10秒以内）を満たしていない" } : x)) })) ?? []
        : installments[order.id] ?? [],
  );
  const [returnFor, setReturnFor] = useState<{ no: number; criterion: string } | null>(null);
  const [reason, setReason] = useState("");
  const trail = crumbs(org, undefined, { label: "受託者への発注", to: paths.orders(org) }, { label: order.id });
  const subs = submissions.filter((s) => s.order_id === order.id);
  const thread = negotiations[order.id] ?? [];
  const tri = triage.filter((t) => t.order_id === order.id);
  const inspectionStatus = inst.length && inst.every((i) => i.status === "passed") ? "passed" : inst.some((i) => i.status === "passed") ? "partial" : inst.some((i) => i.status === "returned") ? "returned" : order.inspection;

  if (state === "loading") return <AppLayout org={org} active="orders" breadcrumb={trail}><Skeleton variant="detail" /></AppLayout>;
  if (state === "error") return <AppLayout org={org} active="orders" breadcrumb={trail}><ErrorState /></AppLayout>;

  const judge = (no: number, criterion: string, result: "pass" | "return", note?: string) => {
    setInst((list) =>
      list.map((i) => {
        if (i.no !== no) return i;
        const items = i.items.map((x) => (x.criterion === criterion ? { ...x, result, note: note ?? x.note } : x));
        const status: Installment["status"] = items.every((x) => x.result === "pass") ? "passed" : items.some((x) => x.result === "return") ? "returned" : "inProgress";
        return { ...i, items, status, inspected_at: status === "passed" ? "2026-11-27T10:30:00+09:00" : i.inspected_at };
      }),
    );
    toast({ kind: "success", message: result === "pass" ? "合格として記録しました" : "理由を付けて差し戻しました。窓口が受託者に修正範囲を伝えます" });
  };

  const main = (
    <div className="stack">
      <TradeStateStrip order={{ ...order, inspection: inspectionStatus }} />
      {order.status === "offered" ? (
        <Banner tone="warn" title="受託者の回答待ちです">
          既読になっても受諾とは扱いません。回答期限 {fmt(order.next_due)}。期限を過ぎると仮押さえの稼働枠を戻します。
        </Banner>
      ) : null}

      <Section title="条件の版と差分" sub={order.terms.length > 1 ? `v${first.version} → v${terms.version}。受諾は版に紐付きます` : "提示中の版"} flush>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>項目</th>{order.terms.length > 1 ? <th>v{first.version}</th> : null}<th>v{terms.version}{order.accepted_version === terms.version ? "（受諾済み）" : ""}</th></tr></thead>
            <tbody>
              {FIELDS.map((f) => {
                const a = show(first, f.key);
                const b = show(terms, f.key);
                const changed = order.terms.length > 1 && a !== b;
                return (
                  <tr key={f.key}>
                    <td className="small strong" style={{ whiteSpace: "nowrap" }}>{f.label}{changed ? <> <Tag tone="special" square>変更</Tag></> : null}</td>
                    {order.terms.length > 1 ? <td className={changed ? "small ord-diff-old" : "small"}>{a}</td> : null}
                    <td className={changed ? "small ord-diff-new" : "small"}>{b}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {terms.change_note ? <p className="small" style={{ margin: "8px 16px 16px" }}>変更理由: {terms.change_note}</p> : null}
      </Section>

      <Section title="受託者との相談" sub="対案と再提示の経緯。受託者への連絡は案件窓口が行います">
        {thread.length ? (
          <ul className="ord-thread">
            {thread.map((n) => (
              <li key={n.at}>
                <span className="tiny muted" style={{ whiteSpace: "nowrap" }}>{formatDateTime(n.at)}</span>
                <span className="small">
                  <strong>{userName(n.by)}</strong>{" "}
                  {n.kind === "read" ? <Tag square>既読</Tag> : n.kind === "accept" ? <Tag tone="pass" square>受諾</Tag> : n.kind === "counter" ? <Tag tone="warn" square>条件の相談</Tag> : n.kind === "reoffer" ? <Tag tone="special" square>再提示</Tag> : <Tag tone="info" square>提示</Tag>}
                  {n.version ? <> <Tag square>v{n.version}</Tag></> : null} {n.text}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="相談はありません" />
        )}
      </Section>

      <Section title="提出" sub="提出時の確定版で照合します。後から PR の先端が動いても対象は変わりません" actions={<Button size="sm" variant="ghost" to={paths.submissionsMatch(org, order.project)}>提出と検証の照合へ</Button>}>
        {subs.length ? (
          <div className="stack">
            {subs.map((s) => (
              <div key={s.id} className="ord-kv-grid">
                <Kv label="提出">{s.id}（{formatDateTime(s.submitted_at)}）</Kv>
                <Kv label="確定コミット"><HashDisplay value={s.commit_sha} /></Kv>
                <Kv label="外部の参照"><a href={s.external_url} target="_blank" rel="noreferrer">{s.external_url.replace("https://", "")}</a></Kv>
                <Kv label="受託者の確認結果">{s.checks}</Kv>
                {s.notes ? <Kv label="注意点">{s.notes}</Kv> : null}
                <Kv label="照合">{s.verification === "matched" ? <Tag tone="pass" square>同じ版の検証結果あり</Tag> : <Tag tone="warn" square>照合待ち</Tag>}</Kv>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon="upload" title="まだ提出はありません" description={order.status === "offered" ? "受諾後に提出できます。" : `提出見込み ${fmt(order.next_due)}`} />
        )}
      </Section>

      <Section
        title="委託元の検収"
        sub="完成条件ごとに合格・差戻しを判断します。最終顧客の受入とは別の記録です"
        actions={<Segmented value={kind} onChange={(v) => setKind(v as typeof kind)} options={[{ value: "deliverable", label: "成果完成型" }, { value: "timeReport", label: "稼働報告型" }]} />}
      >
        <div className="stack">
          {kind === "timeReport" ? (
            <Banner tone="info" title="稼働報告型の確認">契約が稼働報告型の場合は、成果の完成ではなく報告された稼働（期間・作業内容）を確認します。この発注の契約は成果完成型のため、切り替えは表示の確認用です。</Banner>
          ) : null}
          {!asInspector ? (
            <SoDNotice reason={<>あなた（{userName(viewer)}）はこの発注を発行したため検収できません。検収は案件の指定検収者が行います。</>} eligible={[userById(DESIGNATED_INSPECTOR[order.project])!].filter(Boolean)} />
          ) : null}
          {inst.length === 0 ? (
            <EmptyState icon="checkSquare" title="検収の対象はまだありません" description="受託者の提出後に、完成条件ごとの検収が始まります。" />
          ) : (
            inst.map((i) => (
              <div key={i.no} className="card tight stack">
                <div className="row between">
                  <span className="strong small">{inst.length > 1 ? `分納${i.no}: ` : ""}{i.title}</span>
                  <span className="row">
                    <StatusBadge vocab={INSPECTION_STATUS[i.status === "passed" ? "passed" : i.status === "returned" ? "returned" : i.status === "inProgress" ? "inProgress" : "notStarted"]} size="sm" />
                    <InternalYen value={i.amount} />
                  </span>
                </div>
                <div className="ord-kv-grid">
                  <Kv label="給付の受領日（提出日）">{fmt(i.submitted_at)}</Kv>
                  <Kv label="検査期日">{fmt(terms.inspection_due)}</Kv>
                  <Kv label="検収日">{fmt(i.inspected_at)}</Kv>
                  <Kv label="支払期日（発注条件のまま）">{fmt(terms.payment_due)}</Kv>
                </div>
                <div className="table-wrap">
                  <table className="table compact">
                    <thead><tr><th>完成条件</th><th>結果</th><th>根拠・理由</th>{asInspector ? <th>判断</th> : null}</tr></thead>
                    <tbody>
                      {i.items.map((x) => (
                        <tr key={x.criterion}>
                          <td className="small">{x.criterion}</td>
                          <td>{x.result === "pass" ? <Tag tone="pass" square icon="check">合格</Tag> : x.result === "return" ? <Tag tone="fail" square icon="xCircle">差戻し</Tag> : <Tag square>未判断</Tag>}</td>
                          <td className="small">{x.note ?? x.evidence ?? "—"}</td>
                          {asInspector ? (
                            <td>
                              <span className="row nowrap">
                                <Button size="sm" disabled={!i.submitted_at || x.result === "pass"} disabledReason={!i.submitted_at ? "未提出です" : "合格済みです"} onClick={() => judge(i.no, x.criterion, "pass")}>合格</Button>
                                <Button size="sm" variant="ghost" disabled={!i.submitted_at} disabledReason="未提出です" onClick={() => { setReturnFor({ no: i.no, criterion: x.criterion }); setReason(""); }}>差戻し</Button>
                              </span>
                            </td>
                          ) : null}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
          {inspectionStatus === "partial" ? <Banner tone="info" title="一部検収">合格した分納だけを検収済みとし、その分の支払予定を確定します。残りの分納は差戻しの修正後に再検収します。</Banner> : null}
          <p className="tiny muted" style={{ margin: 0 }}>
            最終顧客の受入: <StatusBadge vocab={CUSTOMER_ACCEPTANCE[order.customer_acceptance]} size="sm" /> 。顧客の受入が未回答でも、委託元の検収・給付の受領日・支払期日はそのまま保持します。
          </p>
        </div>
      </Section>

      <Section title="修正と追加依頼の仕分け" sub="元の完成条件と照らし、範囲外の要望は追加見積に回します" flush>
        {tri.length ? (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>要望</th><th>出所</th><th>判定</th><th>根拠</th><th>次の対応</th></tr></thead>
              <tbody>
                {tri.map((t) => (
                  <tr key={t.id}>
                    <td className="small">{t.request}</td>
                    <td className="small">{t.from}</td>
                    <td>{t.verdict === "fix" ? <Tag tone="warn" square>条件内の修正</Tag> : <Tag tone="special" square>追加依頼</Tag>}</td>
                    <td className="small">{t.reason}</td>
                    <td className="small">
                      <span className="stack" style={{ ["--gap" as string]: "4px" }}>
                        <span>{t.next}</span>
                        {t.verdict === "additional" ? <Button size="sm" variant="ghost" iconRight="arrowRight" to={paths.deskChange(org, "CR-0007")}>追加見積へ</Button> : null}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: 16 }}><EmptyState title="仕分けが必要な要望はありません" /></div>
        )}
      </Section>
    </div>
  );

  const side = (
    <div className="stack">
      <MetaSection title="当事者">
        <div className="stack" style={{ ["--gap" as string]: "8px" }}>
          <Kv label="発注者">サンプルソフト株式会社（{userName(issuer)}）</Kv>
          <Kv label="受託者"><ExternalActor userId={order.freelancer_id} /></Kv>
          <Kv label="指定検収者"><ExternalActor userId={DESIGNATED_INSPECTOR[order.project]} /></Kv>
          <Kv label="案件窓口"><ExternalActor userId="u-aoki" /></Kv>
        </div>
      </MetaSection>
      <MetaSection title="金額（社内のみ）">
        <div className="stack" style={{ ["--gap" as string]: "8px" }}>
          <Kv label="報酬（現在の版）"><InternalYen value={terms.fee} strong /></Kv>
          <Kv label="支払方法">{terms.payment_method}</Kv>
          <Button size="sm" variant="ghost" to={paths.settlements(org)}>請求・支払の照合へ</Button>
        </div>
      </MetaSection>
      <MetaSection title="関連">
        <div className="stack" style={{ ["--gap" as string]: "6px" }}>
          <span className="small">案件: {projectName(order.project)}</span>
          {order.milestone_id ? <span className="small">マイルストーン: <IdLink id={order.milestone_id} to={paths.milestones(org, order.project)} /></span> : null}
          <span className="small">発注条件: <StatusBadge vocab={ORDER_STATUS[order.status]} size="sm" /></span>
        </div>
      </MetaSection>
    </div>
  );

  return (
    <AppLayout org={org} active="orders" breadcrumb={trail}>
      <PageHeader
        id={order.id}
        title={order.title}
        status={<VersionPin version={order.accepted_version ?? terms.version} latest={terms.version} accepted={order.accepted_version} />}
        description={`${projectName(order.project)} · 受託者 ${userName(order.freelancer_id)}`}
        actions={
          <>
            <Button icon="edit" disabled={order.status === "completed"} disabledReason="完了した発注は変更できません" onClick={() => toast({ kind: "success", message: `v${terms.version + 1} の下書きを作りました。受託者が承諾するまで v${terms.version} が有効です` })}>条件を改訂</Button>
            <Button icon="message" to={paths.desk(org)}>窓口の往復を見る</Button>
          </>
        }
      />
      <DetailLayout main={main} side={side} />
      <Modal
        open={!!returnFor}
        onClose={() => setReturnFor(null)}
        title="理由を付けて差し戻す"
        description={returnFor?.criterion}
        footer={
          <>
            <Button onClick={() => setReturnFor(null)}>キャンセル</Button>
            <Button variant="primary" disabled={!reason.trim()} disabledReason="理由を入力してください" onClick={() => { if (returnFor) judge(returnFor.no, returnFor.criterion, "return", reason); setReturnFor(null); }}>差し戻す</Button>
          </>
        }
      >
        <TextArea label="差戻しの理由（完成条件との不一致）" required rows={3} value={reason} onChange={setReason} help="完成条件の範囲外の要望は差戻しにせず、追加依頼として仕分けてください" />
      </Modal>
    </AppLayout>
  );
}
