// 画面ID: F-06 提出結果・修正
import "./freelancer.css";
import { useState } from "react";
import { useRoute, useScreenState } from "../../lib/router";
import { paths } from "../../lib/paths";
import { formatDate, formatDateTime } from "../../lib/format";
import type { Order } from "../../lib/types";
import { INSPECTION_STATUS } from "../../lib/vocab";
import { latestTerms, submissions } from "../../mocks/engagement";
import { inspectionResults, myOrderById } from "../../mocks/freelancer";
import { Banner, Button, EmptyState, FreelancerLayout, Icon, NextActor, Section, StatusBadge, Tag, TextArea, TextField, TradeStateStrip } from "../../ui";
import { Receipt, useClient } from "./parts";

type Mode = "inProgress" | "partial" | "returned" | "outOfScope" | "passed";
const MODES: Record<string, Mode> = { 検収中: "inProgress", "一部検収（分納）": "partial", "差戻し（範囲内の修正）": "returned", 範囲外の要望: "outOfScope", 検収済み: "passed" };

export function F06Result() {
  const state = useScreenState();
  const { params } = useRoute();
  const [client, setClient] = useClient();
  const order = myOrderById(params.id ?? "") ?? myOrderById("ORD-0101")!;
  const terms = latestTerms(order);
  const mode = MODES[state] ?? "inProgress";
  const subs = submissions.filter((s) => s.order_id === order.id);
  const [resubmitted, setResubmitted] = useState(false);
  const [fix, setFix] = useState({ sha: "", note: "" });

  if (subs.length === 0) {
    return (
      <FreelancerLayout active="orders" client={client} onClientChange={setClient}>
        <div className="card"><EmptyState icon="upload" title="まだ提出していません" description="成果を提出すると、検収の結果と次の担当がここに表示されます。" action={<Button variant="primary" to={paths.freelancerSubmit(order.id)}>成果を提出する</Button>} /></div>
      </FreelancerLayout>
    );
  }

  const base = inspectionResults[order.id] ?? terms.completion_criteria.map((c) => ({ criterion: c, result: "pending" as const, installment: undefined, note: undefined }));
  const results = base.map((r, i) => {
    if (mode === "passed") return { ...r, result: "pass" as const, note: undefined };
    if (mode === "returned" && i === base.length - 1) return { ...r, result: "fail" as const, note: "検証環境で1万行の出力に 14.2 秒かかりました（条件は10秒以内）。再現手順: 検証用データ（1万行）で出力ボタンを押す" };
    return r;
  });
  const inspection = mode === "passed" ? "passed" : mode === "partial" ? "partial" : mode === "returned" ? "returned" : "inProgress";
  const strip: Pick<Order, "status" | "submission" | "inspection" | "deploy" | "customer_acceptance" | "payment"> = {
    status: order.status,
    submission: resubmitted ? "resubmitted" : "submitted",
    inspection: resubmitted ? "inProgress" : inspection,
    deploy: mode === "passed" ? "permitted" : "notReady",
    customer_acceptance: mode === "passed" ? "requested" : "notRequested",
    payment: "notDue",
  };
  const next =
    resubmitted ? { actor: "inspector" as const, action: "委託元が修正版を検収する" }
    : mode === "returned" ? { actor: "freelancer" as const, action: "合意した完成条件に合わせて修正版を提出する" }
    : mode === "outOfScope" ? { actor: "desk" as const, action: "窓口が追加の依頼として条件を整理する" }
    : mode === "passed" ? { actor: "none" as const, action: "検収済み。配備・顧客の受入・支払は別に進みます" }
    : { actor: "inspector" as const, action: "委託元が提出版を検収する" };

  return (
    <FreelancerLayout active="orders" client={client} onClientChange={setClient}>
      <div className="stack" style={{ ["--gap" as string]: "6px" }}>
        <span className="mono tiny muted">{order.id} · {order.client_company}</span>
        <h1 style={{ fontSize: "var(--text-xl)", color: "var(--text-strong)", overflowWrap: "anywhere" }}>提出結果: {order.title}</h1>
        <div className="row" style={{ ["--gap" as string]: "8px" }}><StatusBadge vocab={INSPECTION_STATUS[strip.inspection]} /><Tag square>検収予定日 {formatDate(terms.inspection_due)}</Tag></div>
        <NextActor actor={next.actor} action={next.action} />
      </div>

      <TradeStateStrip order={strip} />

      {mode === "outOfScope" ? (
        <Banner tone="info" title="発注企業から、合意した条件の範囲外の要望がありました">
          「6列目（担当者）を追加したい」という要望は、v{terms.version} の条件で「対象外」と合意した内容です。無償の修正ではありません。窓口が追加の依頼として条件（金額・納期）を整理し、あなたに新しい依頼として提示します。承諾するまで、今の依頼の条件は変わりません。
          <div style={{ marginTop: 8 }}><Button size="sm" icon="message" to={paths.freelancerQuestions()}>窓口に相談する</Button></div>
        </Banner>
      ) : null}
      {mode === "partial" ? (
        <Banner tone="info" title="第1回分を検収しました">
          第1回分（2項目）は検収済みです。第2回分（性能の条件）は検証環境で計測中で、12/1 までに結果が出ます。検収済みの分は支払期日どおりに支払われます。
        </Banner>
      ) : null}
      {mode === "passed" ? (
        <Banner tone="pass" title="委託元の検収が完了しました">
          配備と発注企業の受入は窓口が進めます。支払は支払期日 {formatDate(terms.payment_due)} のとおりで、発注企業の受入を待って繰り下げることはありません。
        </Banner>
      ) : null}

      <Section title="完成条件ごとの検収結果" sub="委託元（受注側）の検収です。発注企業の受入とは別に記録されます">
        <div>
          {results.map((r) => (
            <div key={r.criterion} className="fx-crit">
              <Icon name={r.result === "pass" ? "checkCircle" : r.result === "fail" ? "xCircle" : "hourglass"} size={16} />
              <div className="stack" style={{ ["--gap" as string]: "2px", minWidth: 0 }}>
                <span className="small">{r.criterion}</span>
                {r.note ? <span className="tiny muted" style={{ overflowWrap: "anywhere" }}>{r.note}</span> : null}
              </div>
              <span className="row" style={{ ["--gap" as string]: "4px", justifyContent: "flex-end" }}>
                {r.installment ? <Tag square>{r.installment}</Tag> : null}
                <Tag tone={r.result === "pass" ? "pass" : r.result === "fail" ? "fail" : "neutral"} square>{r.result === "pass" ? "合格" : r.result === "fail" ? "差戻し" : "確認中"}</Tag>
              </span>
            </div>
          ))}
        </div>
      </Section>

      {mode === "returned" ? (
        <Section title="修正版を提出する" sub="差し戻された条件は、合意した完成条件の範囲内です">
          {resubmitted ? (
            <Receipt title="修正版を受け付けました" number={`SUB-${order.id}-2`} at="2026-11-27T10:35:00+09:00">
              <span className="small">前の提出（第1版）はそのまま記録に残ります。委託元が修正版を検収します。</span>
            </Receipt>
          ) : (
            <div className="stack">
              <TextField label="修正版の確定コミット（SHA）" required value={fix.sha} onChange={(v) => setFix((f) => ({ ...f, sha: v }))} placeholder="例: 7a1e3f0c9d2b" />
              <TextArea label="修正内容" required rows={3} value={fix.note} onChange={(v) => setFix((f) => ({ ...f, note: v }))} placeholder="例: 出力処理をストリーミングに変更し、1万行を 6.8 秒で出力" />
              <div className="fx-actions">
                <Button variant="primary" icon="send" disabled={!/^[0-9a-f]{7,40}$/.test(fix.sha) || !fix.note.trim()} disabledReason="確定コミットと修正内容を入力してください" onClick={() => setResubmitted(true)}>修正版を提出</Button>
                <Button icon="message" to={paths.freelancerQuestions()}>差戻しの理由について質問</Button>
              </div>
            </div>
          )}
        </Section>
      ) : null}

      <Section title="提出履歴" sub="過去の提出も残ります">
        <ul className="fx-list small">
          {resubmitted ? <li><strong>第2版</strong> · {formatDateTime("2026-11-27T10:35:00+09:00")} · <span className="mono">{fix.sha.slice(0, 12)}</span></li> : null}
          {subs.map((s) => (
            <li key={s.id}>
              <strong>第{s.version}版</strong> · {formatDateTime(s.submitted_at)} · <span className="mono">{s.commit_sha.slice(0, 12)}</span> · <a href={s.external_url} target="_blank" rel="noreferrer">外部の PR</a>
              <div className="tiny muted">{s.checks}{s.notes ? ` · 注意点: ${s.notes}` : ""}</div>
            </li>
          ))}
        </ul>
      </Section>
    </FreelancerLayout>
  );
}
