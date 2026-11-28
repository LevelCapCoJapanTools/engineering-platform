// フリーエンジニア画面群のローカル部品。
import { useState } from "react";
import type { ReactNode } from "react";
import type { OrderTerms } from "../../lib/types";
import { formatDate, yen } from "../../lib/format";
import { freelancerClients, Icon, Tag } from "../../ui";

const KEY = "fx-client";

/** 選んだ依頼元。画面をまたいで保持する（保存できない環境でも動く） */
export function useClient(initial?: string): [string, (c: string) => void] {
  const clients = freelancerClients();
  const read = () => {
    try {
      const v = sessionStorage.getItem(KEY);
      if (v && clients.includes(v)) return v;
    } catch {
      /* 保存できない環境 */
    }
    return clients[0];
  };
  const [client, setClient] = useState<string>(initial ?? read());
  const set = (c: string) => {
    setClient(c);
    try {
      sessionStorage.setItem(KEY, c);
    } catch {
      /* 保存できない環境 */
    }
  };
  return [client, set];
}

/** 発注条件で、確定に必要な項目 */
export const REQUIRED_TERMS: { key: keyof OrderTerms; label: string }[] = [
  { key: "deliverable", label: "作るもの（納入物）" },
  { key: "due", label: "納期" },
  { key: "completion_criteria", label: "完成条件" },
  { key: "inspection_due", label: "検収予定日" },
  { key: "fee", label: "依頼額" },
  { key: "payment_due", label: "支払期日" },
  { key: "payment_method", label: "支払方法" },
];

export function missingTerms(t: Partial<OrderTerms>) {
  return REQUIRED_TERMS.filter(({ key }) => {
    const v = t[key];
    return v === undefined || v === "" || (Array.isArray(v) && v.length === 0);
  });
}

const changed = (a: unknown, b: unknown) => JSON.stringify(a) !== JSON.stringify(b);

/** 条件の一覧。前の版と違う項目に「変更」を付ける */
export function TermsList({ terms, previous }: { terms: Partial<OrderTerms>; previous?: OrderTerms }) {
  const mark = (key: keyof OrderTerms) => (previous && changed(previous[key], terms[key]) ? <Tag tone="special" square icon="edit">変更</Tag> : null);
  const row = (key: keyof OrderTerms, label: string, value: ReactNode) => (
    <div className="fx-term" key={key}>
      <dt>{label} {mark(key)}</dt>
      <dd>{value ?? <span className="text-fail small"><Icon name="alert" size={12} /> 未設定</span>}</dd>
    </div>
  );
  const list = (v?: string[]) => (v && v.length ? <ul className="fx-list">{v.map((x) => <li key={x}>{x}</li>)}</ul> : undefined);
  return (
    <dl className="fx-terms">
      {row("scope", "作るもの", list(terms.scope))}
      {row("completion_criteria", "完成の判定", list(terms.completion_criteria))}
      {row("out_of_scope", "対象外", list(terms.out_of_scope))}
      {row("deliverable", "提出するもの", terms.deliverable)}
      {row("delivery_to", "提出先", terms.delivery_to)}
      {row("fee", "依頼額（税抜）", terms.fee !== undefined ? <strong>{yen(terms.fee)}</strong> : undefined)}
      {row("due", "納期", terms.due ? formatDate(terms.due) : undefined)}
      {row("inspection_due", "検収予定日", terms.inspection_due ? formatDate(terms.inspection_due) : undefined)}
      {row("payment_due", "支払期日", terms.payment_due ? formatDate(terms.payment_due) : undefined)}
      {row("payment_method", "支払方法", terms.payment_method)}
    </dl>
  );
}

/** 版の差分の要約 */
export function TermsDiff({ from, to }: { from: OrderTerms; to: OrderTerms }) {
  const items: string[] = [];
  if (from.fee !== to.fee) items.push(`依頼額: ${yen(from.fee)} → ${yen(to.fee)}`);
  if (from.due !== to.due) items.push(`納期: ${formatDate(from.due)} → ${formatDate(to.due)}`);
  if (from.payment_due !== to.payment_due) items.push(`支払期日: ${formatDate(from.payment_due)} → ${formatDate(to.payment_due)}`);
  if (changed(from.scope, to.scope)) items.push("作るもの が変わりました");
  if (changed(from.completion_criteria, to.completion_criteria)) items.push("完成の判定 が変わりました");
  const added = to.out_of_scope.filter((x) => !from.out_of_scope.includes(x));
  if (added.length) items.push(`対象外に追加: ${added.join("、")}`);
  return (
    <div className="fx-diff">
      <div className="small strong">v{from.version} → v{to.version} の変更</div>
      {to.change_note ? <p className="small muted">{to.change_note}</p> : null}
      <ul className="fx-list">{items.length ? items.map((x) => <li key={x}>{x}</li>) : <li>変更はありません</li>}</ul>
    </div>
  );
}

/** 控え（受付番号と日時） */
export function Receipt({ title, number, at, children }: { title: string; number: string; at: string; children?: ReactNode }) {
  return (
    <div className="fx-receipt" role="status">
      <Icon name="fileCheck" size={20} />
      <div className="stack" style={{ ["--gap" as string]: "4px", minWidth: 0 }}>
        <strong>{title}</strong>
        <span className="small">控えの番号 <span className="mono">{number}</span> · {formatDate(at)} {at.slice(11, 16)}</span>
        {children}
      </div>
    </div>
  );
}
