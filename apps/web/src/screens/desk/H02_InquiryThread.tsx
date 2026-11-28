// 画面ID: H-02 問い合わせの往復
// 1件の問い合わせのスレッド。顧客の返信（案件別の受信アドレス・限定フォーム）を元の質問に結び付け、
// AI の根拠付き回答案（版を開ける）を窓口が確認してから送る。根拠がない問いは確認質問に変える。
// 受託者への回答は質問した本人にだけ返し、社外向け文案に社内メモや外注単価が入らないことを送信前に検査する。
import { useState } from "react";
import { useRoute, useScreenState } from "../../lib/router";
import { ORG, paths } from "../../lib/paths";
import { INQUIRY_STATUS } from "../../lib/vocab";
import { formatDate, formatDateTime } from "../../lib/format";
import { answerDrafts, deskInquiryById, deskMessages, leakedDraft } from "../../mocks/desk";
import type { AnswerDraft } from "../../mocks/desk";
import { orderById } from "../../mocks/engagement";
import { userById } from "../../mocks/core";
import {
  ActorLabel,
  AISectionHead,
  AppLayout,
  AudienceTag,
  Banner,
  Button,
  crumbs,
  DetailLayout,
  ErrorState,
  ExternalActor,
  Icon,
  IdLink,
  KeyValueList,
  MetaSection,
  Modal,
  PageHeader,
  Section,
  Skeleton,
  StatusBadge,
  Tag,
  TextArea,
  Timeline,
  useToast,
} from "../../ui";
import { FromTag, ManualFallbackNote, projectName } from "./parts";

/** 状態の切替で見せる問い合わせ */
const STATE_TO_INQUIRY: Record<string, string> = {
  回答案あり: "INQ-0033",
  受託者への回答: "INQ-0032",
  顧客返信を取り込み: "INQ-0032",
  "根拠不足（確認質問）": "INQ-0035",
  社内情報の混入を検出: "INQ-0033",
  回答済み: "INQ-0031",
  AI停止中: "INQ-0033",
};

const TEMPLATE_TEXT = "お問い合わせありがとうございます。担当者が確認のうえ、{期限} までに回答します。";

export function InquiryThread({ id }: { id?: string }) {
  const state = useScreenState();
  const toast = useToast();
  const org = useRoute().params.org ?? ORG;
  const inquiry = deskInquiryById(STATE_TO_INQUIRY[state] ?? id ?? "") ?? deskInquiryById("INQ-0033")!;
  const messages = deskMessages.filter((m) => m.inquiry_id === inquiry.id);
  const baseDraft: AnswerDraft | undefined = state === "社内情報の混入を検出" ? leakedDraft : answerDrafts.find((d) => d.inquiry_id === inquiry.id);
  const aiDown = state === "AI停止中";
  const draft = aiDown ? undefined : baseDraft;
  const [body, setBody] = useState(draft?.body ?? TEMPLATE_TEXT.replace("{期限}", formatDate(inquiry.due)));
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(inquiry.status === "answered");
  const blocked = draft?.checks.some((c) => !c.ok && draft.kind === "answer") ?? false;
  const asker = userById(inquiry.asker_id);
  const order = inquiry.order_id ? orderById(inquiry.order_id) : undefined;
  const toFreelancer = draft?.to === "freelancer" || (!draft && inquiry.from === "freelancer");
  const recipient = draft?.kind === "confirmQuestion" ? "野口 舞（架空商事・発注側担当者）" : toFreelancer ? `${asker?.name ?? ""}（質問した受託者本人のみ）` : `${asker?.name ?? ""}（${asker?.company ?? "顧客"}）`;
  const dedupKey = `${inquiry.id}/${draft?.kind === "confirmQuestion" ? "confirm" : "answer"}-v1`;

  const send = () => {
    setSending(true);
    window.setTimeout(() => {
      setSending(false);
      setConfirming(false);
      setSent(true);
      toast({ kind: "success", message: `窓口名義で送信しました（重複防止キー ${dedupKey}）` });
    }, 700);
  };

  return (
    <AppLayout org={org} active="desk" breadcrumb={crumbs(org, undefined, { label: "案件窓口", to: paths.desk(org) }, { label: inquiry.id })}>
      <PageHeader
        id={inquiry.id}
        title={inquiry.subject}
        status={<StatusBadge vocab={INQUIRY_STATUS[sent && inquiry.status !== "answered" ? "answered" : inquiry.status]} />}
        meta={<><FromTag from={inquiry.from} /><Tag square>{projectName(inquiry.project)}</Tag></>}
      />
      {state === "読み込み中" ? (
        <Skeleton variant="detail" />
      ) : state === "エラー" ? (
        <ErrorState />
      ) : (
        <DetailLayout
          main={
            <>
              {state === "顧客返信を取り込み" ? (
                <Banner tone="pass" title="顧客の返信を元の質問に結び付けました">
                  案件別の受信アドレス（order-renewal@desk.product.example）に届いた返信を、件名の受付番号 INQ-0032 で照合しました。他の案件には表示していません。
                </Banner>
              ) : null}
              {aiDown ? (
                <Banner tone="warn" title="AI の回答案を作れません">提供元の障害のため、定型文から回答を作成してください。受付・送信・記録はいつもどおり動きます。</Banner>
              ) : null}
              <Section title="往復の履歴" sub="社内メモは顧客・受託者には表示されません">
                <div className="dk-thread">
                  {messages.length === 0 ? <span className="small muted">まだ往復はありません。</span> : null}
                  {messages.map((m) => (
                    <article key={m.id} className={`dk-msg ${m.direction}`}>
                      <div className="dk-msg-head">
                        <strong className="small">{m.from}</strong>
                        {m.to ? <span className="tiny muted">→ {m.to}</span> : null}
                        <Tag square>{m.channel}</Tag>
                        <AudienceTag value={m.audience} />
                        <span className="tiny muted">{formatDateTime(m.at)}</span>
                        {m.sent_status === "sent" ? <Tag tone="pass" square icon="check">送信済み</Tag> : null}
                      </div>
                      <div className="dk-msg-body">{m.body}</div>
                    </article>
                  ))}
                  {sent && inquiry.status !== "answered" ? (
                    <article className="dk-msg out">
                      <div className="dk-msg-head"><strong className="small">案件窓口</strong><span className="tiny muted">→ {recipient}</span><Tag tone="pass" square icon="check">送信済み</Tag></div>
                      <div className="dk-msg-body">{body}</div>
                    </article>
                  ) : null}
                </div>
              </Section>

              {inquiry.status === "answered" ? (
                <Section title="確定した回答">
                  <div className="stack" style={{ ["--gap" as string]: "8px" }}>
                    <div className="dk-draft">{inquiry.answer}</div>
                    <span className="tiny muted">回答日時 {inquiry.answered_at ? formatDateTime(inquiry.answered_at) : "—"} · 根拠 {inquiry.sources?.join("、")}</span>
                  </div>
                </Section>
              ) : (
                <Section
                  title={draft?.kind === "confirmQuestion" ? "確認質問（顧客へ）" : "回答"}
                  sub="送る前に、宛先・文面・対象版を確認します。金額・範囲・納期・障害説明を含む連絡は人の確認が必要です"
                >
                  <div className="stack" style={{ ["--gap" as string]: "12px" }}>
                    {draft ? (
                      <>
                        <AISectionHead count={1} note="AI の案です。確約や判断には使いません" />
                        <div className="row" style={{ ["--gap" as string]: "8px" }}>
                          <ActorLabel kind="ai" name={draft.kind === "confirmQuestion" ? "確認質問の作成" : "回答案の作成"} size="sm" />
                          <span className="tiny muted">確信度 {Math.round(draft.confidence * 100)}% · {draft.model} · {draft.template}</span>
                          {draft.confidence < 0.5 ? <Tag tone="warn" square>確信度が低い</Tag> : null}
                        </div>
                        {draft.kind === "confirmQuestion" ? (
                          <Banner tone="warn" title="根拠がないため、回答案ではなく確認質問にしました">承認済みの資料に答えが見つからない問いは、推測で答えずに顧客へ確認します。回答が届いたら受託者へ返します。</Banner>
                        ) : null}
                      </>
                    ) : (
                      <span className="small muted">定型文から作成しています（AI の案なし）。</span>
                    )}
                    <TextArea label="文面" rows={5} value={body} onChange={setBody} maxLength={2000} />
                    {draft && draft.sources.length > 0 ? (
                      <div className="stack" style={{ ["--gap" as string]: "6px" }}>
                        <strong className="small">根拠（版を開いて確認できます）</strong>
                        <div className="table-wrap">
                          <table className="table compact">
                            <thead><tr><th>資料</th><th>版</th><th>公開範囲</th><th /></tr></thead>
                            <tbody>
                              {draft.sources.map((s) => (
                                <tr key={s.id}>
                                  <td className="small"><span className="mono">{s.id}</span> {s.label}</td>
                                  <td className="small">{s.version}</td>
                                  <td><AudienceTag value={s.audience} /></td>
                                  <td><Button size="sm" variant="ghost" icon="external" onClick={() => toast({ kind: "info", message: `${s.id}（${s.version}）を開きました` })}>版を開く</Button></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : null}
                    {draft ? (
                      <div className="stack" style={{ ["--gap" as string]: "6px" }}>
                        <strong className="small">送信前の検査</strong>
                        <ul className="dk-checks">
                          {draft.checks.map((c) => (
                            <li key={c.label}>
                              <Icon name={c.ok ? "checkCircle" : "xCircle"} className={c.ok ? "ok" : "ng"} label={c.ok ? "問題なし" : "要対応"} />
                              <span><span className={c.ok ? "" : "strong"}>{c.label}</span>{c.detail ? <span className="tiny muted"><br />{c.detail}</span> : null}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {blocked ? (
                      <Banner tone="fail" title="この文面は送信できません">顧客に非公開の金額が含まれています。該当箇所を削除すると、検査をやり直して送信できるようになります。</Banner>
                    ) : null}
                    <div className="row between">
                      <span className="small">宛先: <strong>{recipient}</strong></span>
                      <Button
                        variant="primary"
                        icon="send"
                        disabled={sent || blocked || !body.trim()}
                        disabledReason={sent ? `送信済みです（${dedupKey}）。同じ内容を二重に送りません` : blocked ? "送信前の検査で問題が見つかりました" : "文面を入力してください"}
                        onClick={() => setConfirming(true)}
                      >
                        {sent ? "送信済み" : "確認して送信"}
                      </Button>
                    </div>
                  </div>
                </Section>
              )}
              {aiDown ? <ManualFallbackNote /> : null}
            </>
          }
          side={
            <>
              <MetaSection title="受付">
                <KeyValueList
                  stacked
                  items={[
                    { label: "受付番号", value: <span className="mono">{inquiry.id}</span> },
                    { label: "発信者", value: <ExternalActor userId={inquiry.asker_id} /> },
                    { label: "案件", value: projectName(inquiry.project) },
                    { label: "受信経路", value: inquiry.from === "customer" ? "案件別の受信アドレス・限定フォーム" : inquiry.from === "freelancer" ? "受託者の画面（質問と回答）" : "社内の依頼" },
                    { label: "応答期限", value: formatDate(inquiry.due) },
                    { label: "回答の宛先", value: <AudienceTag value={inquiry.audience} /> },
                  ]}
                />
              </MetaSection>
              <MetaSection title="担当">
                <KeyValueList
                  stacked
                  items={[
                    { label: "主担当", value: <ExternalActor userId={inquiry.owner_id} /> },
                    { label: "代理", value: inquiry.deputy_id ? <ExternalActor userId={inquiry.deputy_id} /> : <span className="muted">未設定</span> },
                  ]}
                />
                <Button size="sm" variant="ghost" to={paths.deskAssignments(org)}>担当と期限を変更</Button>
              </MetaSection>
              {order ? (
                <MetaSection title="関連する発注">
                  <IdLink id={order.id} to={paths.order(org, order.id)} title={order.title} />
                  <span className="tiny muted">回答は {userById(order.freelancer_id)?.name} さんの画面（質問と回答）にだけ表示されます。同じ案件の他の受託者には表示されません。</span>
                </MetaSection>
              ) : null}
              <MetaSection title="記録">
                <Timeline
                  compact
                  items={[
                    { id: "a", actor: { kind: "system", name: "受付" }, action: "受付番号を発行し、受領通知を送信", at: messages[0]?.at ?? "2026-11-27T08:50:00+09:00" },
                    ...(draft ? [{ id: "b", actor: { kind: "ai" as const, name: "回答案の作成" }, action: "案を作成（参考）", at: "2026-11-27T10:14:00+09:00" }] : []),
                  ]}
                />
              </MetaSection>
            </>
          }
        />
      )}
      <Modal
        open={confirming}
        onClose={() => setConfirming(false)}
        title="宛先・文面・対象版を確認して送信"
        description="窓口名義で送信します。承認後に文面や宛先を変えた場合は、もう一度確認が必要です。"
        footer={
          <>
            <Button onClick={() => setConfirming(false)} disabled={sending}>戻る</Button>
            <Button variant="primary" icon="send" loading={sending} onClick={send}>送信する</Button>
          </>
        }
      >
        <KeyValueList
          stacked
          items={[
            { label: "宛先", value: recipient },
            { label: "送信者", value: "案件窓口（order-renewal@desk.product.example）" },
            { label: "対象版", value: draft?.sources.map((s) => `${s.id}（${s.version}）`).join("、") || "—" },
            { label: "文面", value: <div className="dk-draft">{body}</div> },
            { label: "重複防止キー", value: <span className="mono small">{dedupKey}</span> },
          ]}
        />
      </Modal>
    </AppLayout>
  );
}
