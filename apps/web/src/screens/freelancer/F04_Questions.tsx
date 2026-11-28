// 画面ID: F-04 質問と回答
import "./freelancer.css";
import { useState } from "react";
import { useScreenState } from "../../lib/router";
import { paths } from "../../lib/paths";
import { formatDate, formatDateTime } from "../../lib/format";
import { INQUIRY_STATUS } from "../../lib/vocab";
import { userById } from "../../mocks/core";
import { myOrders, myQuestions, questionMeta } from "../../mocks/freelancer";
import { Banner, Button, EmptyState, FreelancerLayout, Icon, Section, Select, StatusBadge, Tag, TextArea, TextField, useToast } from "../../ui";
import { Receipt, useClient } from "./parts";

type Compose = "none" | "question" | "blocker";

export function F04Questions() {
  const state = useScreenState();
  const toast = useToast();
  const [client, setClient] = useClient();
  const orders = myOrders(client);
  const list = state === "空" ? [] : myQuestions().filter((q) => orders.some((o) => o.id === q.order_id));
  const [activeId, setActiveId] = useState<string | undefined>(state === "回答済みを表示" ? "INQ-0031" : list[0]?.id);
  const [compose, setCompose] = useState<Compose>(state === "質問を作成" ? "question" : state === "作業停止の連絡" ? "blocker" : "none");
  const [form, setForm] = useState({ order: orders.find((o) => o.status === "accepted")?.id ?? orders[0]?.id ?? "", subject: "", body: "", until: "", blocked: "", workaround: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<{ number: string; expected: string } | null>(null);
  const [extra, setExtra] = useState("");
  const active = list.find((q) => q.id === activeId);
  const meta = active ? questionMeta[active.id] : undefined;
  const waiting = list.filter((q) => q.status !== "answered").length;

  const submit = () => {
    setSending(true);
    window.setTimeout(() => {
      setSending(false);
      setSent({ number: compose === "blocker" ? "INQ-0042" : "INQ-0043", expected: "2026-11-29" });
    }, 600);
  };
  const valid = form.order && form.subject.trim() && form.body.trim() && (compose !== "blocker" || (form.until && form.blocked.trim()));

  return (
    <FreelancerLayout active="questions" client={client} onClientChange={setClient}>
      <div className="row between" style={{ ["--gap" as string]: "8px" }}>
        <div className="stack" style={{ ["--gap" as string]: "4px" }}>
          <h1 style={{ fontSize: "var(--text-xl)", color: "var(--text-strong)" }}>質問と回答</h1>
          <p className="small muted">質問は案件窓口が受け付け、必要なら発注企業に確認して回答します。回答を待っている間は、あなたの対応が必要な件数には数えません。</p>
        </div>
        <div className="fx-actions" style={{ flex: "1 1 260px" }}>
          <Button variant="primary" icon="plus" onClick={() => { setCompose("question"); setSent(null); }}>質問する</Button>
          <Button icon="alert" onClick={() => { setCompose("blocker"); setSent(null); }}>作業を進められない</Button>
        </div>
      </div>

      {compose !== "none" ? (
        <Section title={compose === "blocker" ? "作業を進められないことを連絡する" : "質問する"} sub="一度入力すれば、窓口が発注企業への確認まで引き受けます">
          {sent ? (
            <div className="stack">
              <Receipt title="窓口が受け付けました" number={sent.number} at="2026-11-27T10:32:00+09:00">
                <span className="small">回答予定: {formatDate(sent.expected)}。回答が確定したらメールとこの画面でお知らせします。</span>
              </Receipt>
              <div><Button size="sm" variant="ghost" onClick={() => { setCompose("none"); setSent(null); }}>閉じる</Button></div>
            </div>
          ) : (
            <div className="stack">
              <Select label="対象の依頼" required value={form.order} onChange={(v) => setForm((f) => ({ ...f, order: v }))} options={orders.map((o) => ({ value: o.id, label: `${o.id} ${o.title}` }))} />
              <TextField label="件名" required value={form.subject} onChange={(v) => setForm((f) => ({ ...f, subject: v }))} placeholder="例: 出力順は画面の並びと同じですか" />
              <TextArea label="内容" required rows={4} value={form.body} onChange={(v) => setForm((f) => ({ ...f, body: v }))} />
              {compose === "blocker" ? (
                <>
                  <TextField label="いつまでに分かれば間に合うか" required type="date" value={form.until} onChange={(v) => setForm((f) => ({ ...f, until: v }))} />
                  <TextField label="止まっている作業" required value={form.blocked} onChange={(v) => setForm((f) => ({ ...f, blocked: v }))} placeholder="例: 担当営業所での絞り込み" />
                  <TextArea label="暫定案（あれば）" rows={2} value={form.workaround} onChange={(v) => setForm((f) => ({ ...f, workaround: v }))} />
                </>
              ) : null}
              <div className="fx-actions">
                <Button variant="primary" icon="send" loading={sending} disabled={!valid || sending} disabledReason="必須の項目を入力してください" onClick={submit}>送る</Button>
                <Button variant="ghost" onClick={() => setCompose("none")}>キャンセル</Button>
              </div>
              <p className="tiny muted">発注企業の連絡先を探す必要はありません。窓口が確認先と期限を管理します。</p>
            </div>
          )}
        </Section>
      ) : null}

      {list.length === 0 ? (
        <div className="card"><EmptyState icon="message" title="質問はまだありません" description="依頼の内容で分からないことがあれば、ここから質問できます。" /></div>
      ) : (
        <div className="fx-split">
          <div className="stack" style={{ ["--gap" as string]: "8px" }}>
            <span className="tiny muted">あなたの質問 {list.length}件（回答待ち {waiting}件）</span>
            {list.map((q) => (
              <button key={q.id} type="button" className={`fx-q${q.id === activeId ? " active" : ""}`} onClick={() => setActiveId(q.id)} aria-pressed={q.id === activeId}>
                <span className="row between" style={{ ["--gap" as string]: "6px" }}>
                  <span className="mono tiny muted">{q.id} · {q.order_id}</span>
                  <StatusBadge vocab={INQUIRY_STATUS[q.status]} size="sm" />
                </span>
                <span className="small strong" style={{ overflowWrap: "anywhere" }}>{q.subject}</span>
                <span className="tiny muted">{q.status === "answered" ? `回答 ${formatDate(q.answered_at ?? "")}` : `回答予定 ${formatDate(questionMeta[q.id]?.answer_expected ?? q.due)}`}</span>
              </button>
            ))}
          </div>
          {active ? (
            <div className="stack">
              <div className="card stack" style={{ ["--gap" as string]: "10px" }}>
                <div className="row between" style={{ ["--gap" as string]: "6px" }}>
                  <span className="mono small">受付番号 {active.id}</span>
                  <StatusBadge vocab={INQUIRY_STATUS[active.status]} />
                </div>
                <strong style={{ overflowWrap: "anywhere" }}>{active.subject}</strong>
                <p className="small" style={{ whiteSpace: "pre-wrap" }}>{active.body}</p>
                {meta?.blocker ? (
                  <Banner tone="warn" title="作業を進められない連絡">
                    {formatDate(meta.blocker.until)} までに必要 · 止まっている作業: {meta.blocker.blocked} · 暫定案: {meta.blocker.workaround}
                  </Banner>
                ) : null}
                <div className="small muted">
                  受付 {meta ? formatDateTime(meta.received_at) : "—"} · 担当 {userById(active.owner_id)?.name}（案件窓口）{active.deputy_id ? " · 不在時は代理が対応" : ""} · 回答予定 {formatDate(meta?.answer_expected ?? active.due)}
                </div>
                {active.status === "askingCustomer" ? <Tag tone="warn" icon="hourglass">窓口が発注企業へ確認中です。あなたの操作は不要です</Tag> : null}
              </div>
              {active.status === "answered" ? (
                <div className="card stack" style={{ ["--gap" as string]: "8px", borderColor: "var(--tone-pass-border, var(--border))" }}>
                  <span className="row" style={{ ["--gap" as string]: "6px" }}><Icon name="checkCircle" size={16} /><strong>確定した回答</strong></span>
                  <p className="small">{active.answer}</p>
                  {active.sources?.length ? <span className="tiny muted">根拠: {active.sources.join("、")}</span> : null}
                  <div><Button size="sm" icon="check" onClick={() => toast({ kind: "success", message: "回答を確認しました" })}>回答を確認しました</Button></div>
                </div>
              ) : null}
              {meta?.timeline ? (
                <Section title="経過">
                  <ul className="fx-list small">{meta.timeline.map((t) => <li key={t.at}>{formatDateTime(t.at)} — {t.text}</li>)}</ul>
                </Section>
              ) : null}
              <Section title="補足を送る">
                <div className="stack">
                  <TextArea rows={3} value={extra} onChange={setExtra} placeholder="追加の情報や、回答への確認を書いてください" />
                  <div className="fx-actions">
                    <Button icon="send" disabled={!extra.trim()} disabledReason="内容を入力してください" onClick={() => { setExtra(""); toast({ kind: "success", message: `${active.id} に補足を送りました` }); }}>補足を送る</Button>
                    <Button variant="ghost" icon="clock" onClick={() => toast({ kind: "success", message: "遅れる見込みを窓口に連絡しました" })}>遅れる見込みを連絡</Button>
                  </div>
                </div>
              </Section>
              <div><Button size="sm" variant="ghost" icon="arrowLeft" to={paths.freelancerOrder(active.order_id ?? "")}>依頼に戻る</Button></div>
            </div>
          ) : (
            <div className="card"><EmptyState icon="message" title="質問を選んでください" /></div>
          )}
        </div>
      )}
      <p className="tiny muted">{client} の依頼についての質問だけを表示しています。</p>
    </FreelancerLayout>
  );
}
