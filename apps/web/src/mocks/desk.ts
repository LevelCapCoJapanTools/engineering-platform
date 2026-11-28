// 案件窓口（H 画面群）の架空データ（2026-11-28 追補）。基準日 2026-11-27 10:30 JST。
// 共有の問い合わせ（mocks/engagement.ts の inquiries）は読み取って使い、窓口だけが使う往復・送信・担当をここに置く。
import type { Inquiry } from "../lib/types";
import type { Audience } from "../lib/vocab";
import { inquiries } from "./engagement";

/** 窓口の営業時間と休業日（応答期限の計算に使う） */
export const deskHours = {
  timezone: "Asia/Tokyo",
  weekdays: "平日 9:00〜18:00",
  holidays: ["2026-12-29", "2026-12-30", "2026-12-31", "2027-01-01", "2027-01-02", "2027-01-03"],
  note: "休業日に届いた問い合わせは翌営業日 9:00 に受付として扱い、応答期限もそこから数えます",
};

/** 窓口だけが扱う追加の問い合わせ（共有データに足して表示する） */
const extraInquiries: Inquiry[] = [
  {
    id: "INQ-0035",
    project: "order-renewal",
    order_id: "ORD-0102",
    from: "freelancer",
    asker_id: "u-hayashi",
    subject: "作業を進められません: 取込対象の項目定義がありません",
    body: "取引先マスタの「与信区分」の値の一覧がなく、取込時の検証を作れません。暫定案として「A/B/C 以外はエラー」で進めてよいか確認したいです。止まる作業: 検証処理（約1日分）。",
    status: "askingCustomer",
    owner_id: "u-aoki",
    deputy_id: "u-kimura",
    due: "2026-11-28",
    sources: ["REQ-0007 v3", "SOW v3 §4.3"],
    audience: "freelancer",
  },
  {
    id: "INQ-0036",
    project: "order-renewal",
    from: "jv",
    asker_id: "u-sato",
    subject: "v1.4.0 のリリース枠を顧客に確認したい",
    body: "12/17（木）夜間のリリース枠を顧客の情報システム部に確認してください。",
    status: "escalated",
    owner_id: "u-aoki",
    deputy_id: "u-kimura",
    due: "2026-11-26",
    sources: ["MS-104 予測 12/17"],
    audience: "customer",
  },
  {
    id: "INQ-0037",
    project: "member-app-api",
    from: "customer",
    asker_id: "u-fujii",
    subject: "共同試験の日程について",
    body: "共同試験を 12/7 の週に実施できますか。",
    status: "answered",
    owner_id: "u-aoki",
    due: "2026-11-25",
    answer: "12/7（月）〜12/9（水）で実施できます。試験項目は前週金曜までに共有します。",
    answered_at: "2026-11-25T15:10:00+09:00",
    sources: ["MS-201 確約 12/11", "共同試験計画 v2"],
    audience: "alliance",
  },
];

export const deskInquiries: Inquiry[] = [...inquiries, ...extraInquiries];
export const deskInquiryById = (id: string) => deskInquiries.find((q) => q.id === id);

/** 問い合わせの往復。channel は取り込み元。audience は誰に見えるか */
export type DeskMessage = {
  id: string;
  inquiry_id: string;
  direction: "in" | "out" | "internal";
  channel: "案件別の受信アドレス" | "限定フォーム" | "アプリ内" | "窓口のメモ";
  from: string;
  to?: string;
  at: string;
  body: string;
  audience: Audience;
  /** 送信時の確認状態 */
  sent_status?: "sent" | "failed" | "pendingApproval";
};

export const deskMessages: DeskMessage[] = [
  { id: "M1", inquiry_id: "INQ-0032", direction: "in", channel: "アプリ内", from: "林 由香（受託者）", at: "2026-11-26T19:40:00+09:00", body: "同じ取引先コードが CSV に2回出てきた場合、後の行で上書きしてよいですか。", audience: "freelancer" },
  { id: "M2", inquiry_id: "INQ-0032", direction: "out", channel: "アプリ内", from: "案件窓口", to: "林 由香", at: "2026-11-26T19:41:00+09:00", body: "受け付けました（受付番号 INQ-0032）。顧客に確認し、11/29 までに回答します。回答を待つ間、このご質問はあなたの未対応に数えません。", audience: "freelancer", sent_status: "sent" },
  { id: "M3", inquiry_id: "INQ-0032", direction: "out", channel: "案件別の受信アドレス", from: "案件窓口（order-renewal@desk.product.example）", to: "野口 舞（架空商事）", at: "2026-11-27T09:05:00+09:00", body: "取引先マスタの CSV 取込で、同じ取引先コードが複数行ある場合の扱いを確認させてください。A: 後の行で上書きする／B: エラーとして取り込まない。", audience: "customer", sent_status: "sent" },
  { id: "M4", inquiry_id: "INQ-0032", direction: "internal", channel: "窓口のメモ", from: "青木 さくら", at: "2026-11-27T09:06:00+09:00", body: "顧客の業務では月末に重複が起きやすいとのこと（MTG-12 での発言）。社内メモのため顧客・受託者には出さない。", audience: "internal" },
  { id: "M5", inquiry_id: "INQ-0032", direction: "in", channel: "案件別の受信アドレス", from: "野口 舞（架空商事）", at: "2026-11-27T10:12:00+09:00", body: "B でお願いします。重複行は一覧で確認したいです。", audience: "customer" },
  { id: "M6", inquiry_id: "INQ-0033", direction: "in", channel: "限定フォーム", from: "野口 舞（架空商事）", at: "2026-11-27T08:50:00+09:00", body: "社内の受入試験を 12/10 から始めたいので、試験環境の準備日を教えてください。", audience: "customer" },
  { id: "M7", inquiry_id: "INQ-0033", direction: "out", channel: "案件別の受信アドレス", from: "案件窓口", to: "野口 舞（架空商事）", at: "2026-11-27T08:51:00+09:00", body: "お問い合わせを受け付けました（受付番号 INQ-0033）。11/28 中に回答します。", audience: "customer", sent_status: "sent" },
  { id: "M8", inquiry_id: "INQ-0031", direction: "in", channel: "アプリ内", from: "松田 亮（受託者）", at: "2026-11-18T13:00:00+09:00", body: "受注一覧画面の並び順（受注日の新しい順）と同じ順で出力すればよいでしょうか。", audience: "freelancer" },
  { id: "M9", inquiry_id: "INQ-0031", direction: "in", channel: "案件別の受信アドレス", from: "中村 拓也（架空商事）", at: "2026-11-19T15:30:00+09:00", body: "画面と同じ並びで問題ありません。", audience: "customer" },
  { id: "M10", inquiry_id: "INQ-0031", direction: "out", channel: "アプリ内", from: "案件窓口", to: "松田 亮", at: "2026-11-19T16:00:00+09:00", body: "画面の並びと同じ（受注日の新しい順）で確定しました。顧客回答日 2026-11-19。", audience: "freelancer", sent_status: "sent" },
];

/** AI の回答案。根拠（版付き）がないものは確認質問に変わる */
export type AnswerDraft = {
  inquiry_id: string;
  kind: "answer" | "confirmQuestion";
  to: "customer" | "freelancer";
  body: string;
  sources: { id: string; label: string; version: string; audience: Audience }[];
  confidence: number;
  model: string;
  template: string;
  /** 社外向け文案の検査 */
  checks: { label: string; ok: boolean; detail?: string }[];
};

export const answerDrafts: AnswerDraft[] = [
  {
    inquiry_id: "INQ-0033",
    kind: "answer",
    to: "customer",
    body: "試験環境は 12/1（月）に準備が完了する見込みです（11/20 時点の予測）。12/10 からの受入試験には間に合う予定です。準備が完了した時点で、接続先と試験用アカウントをお知らせします。",
    sources: [
      { id: "MS-105", label: "結合テスト環境の準備（予測 12/1）", version: "2026-11-27 10:15 同期", audience: "customer" },
      { id: "SOW-3", label: "SOW v3 §6 受入試験", version: "v3（承認済み）", audience: "customer" },
    ],
    confidence: 0.82,
    model: "model-family-a / 2026-10",
    template: "desk-answer@0.3.0",
    checks: [
      { label: "社内メモを含まない", ok: true },
      { label: "外注単価・報酬・粗利を含まない", ok: true },
      { label: "確約日と予測日を区別している", ok: true, detail: "「見込み」「予測」と明記" },
      { label: "根拠がすべて顧客に公開済みの版", ok: true },
    ],
  },
  {
    inquiry_id: "INQ-0032",
    kind: "answer",
    to: "freelancer",
    body: "同じ取引先コードが複数行ある場合は、エラーとして取り込まず、重複行を一覧で表示してください（顧客回答 2026-11-27）。完成条件への追加として扱い、報酬・納期は変わりません。",
    sources: [
      { id: "M5", label: "顧客の回答（野口 舞、案件別の受信アドレス）", version: "2026-11-27 10:12 受信", audience: "freelancer" },
      { id: "REQ-0007", label: "REQ-0007 失敗行の表示", version: "v3（承認済み）", audience: "freelancer" },
    ],
    confidence: 0.77,
    model: "model-family-a / 2026-10",
    template: "desk-answer@0.3.0",
    checks: [
      { label: "宛先は質問した受託者本人だけ", ok: true },
      { label: "他の受託者の条件・報酬を含まない", ok: true },
      { label: "社内メモを含まない", ok: true },
      { label: "条件の変更に当たらないか", ok: true, detail: "完成条件の明確化。追加の作業量は受託者に確認する" },
    ],
  },
  {
    inquiry_id: "INQ-0035",
    kind: "confirmQuestion",
    to: "customer",
    body: "取引先マスタの「与信区分」に使う値の一覧を教えてください。一覧がない場合、暫定として「A・B・C 以外はエラー」とする案で進めてよいかご確認ください。",
    sources: [],
    confidence: 0.41,
    model: "model-family-a / 2026-10",
    template: "desk-confirm@0.2.0",
    checks: [
      { label: "承認済みの資料に根拠がない", ok: false, detail: "SOW v3・REQ-0007 v3 に与信区分の値の定義がないため、回答案ではなく確認質問にしました" },
      { label: "社内メモを含まない", ok: true },
      { label: "外注単価・報酬・粗利を含まない", ok: true },
    ],
  },
];

/** 社外向け文案で社内情報の混入を検出した例（H-02 の状態「社内情報の混入を検出」） */
export const leakedDraft: AnswerDraft = {
  ...answerDrafts[0],
  body: "試験環境は 12/1（月）に準備が完了する見込みです。なお、外注先への追加費用（6万円）は当社で負担します。12/10 からの受入試験には間に合う予定です。",
  checks: [
    { label: "社内メモを含まない", ok: true },
    { label: "外注単価・報酬・粗利を含まない", ok: false, detail: "「外注先への追加費用（6万円）」は顧客に非公開の金額です。送信できません" },
    { label: "確約日と予測日を区別している", ok: true },
    { label: "根拠がすべて顧客に公開済みの版", ok: true },
  ],
};

/** 対外送信。kind=auto は委任済みルールで送るもの、review は人が確認してから送るもの */
export type Outbound = {
  id: string;
  project: string;
  kind: "auto" | "review";
  rule?: string;
  category: "受領通知" | "定型の催促" | "金額" | "範囲" | "納期" | "障害説明";
  subject: string;
  to: string[];
  channel: string;
  target_version: string;
  body: string;
  status: "pendingApproval" | "reapproval" | "approved" | "sent" | "failed" | "suppressed";
  approved_by?: string;
  approved_at?: string;
  sent_at?: string;
  dedup_key: string;
  error?: string;
  change_after_approval?: string;
};

export const outbound: Outbound[] = [
  { id: "OUT-0412", project: "order-renewal", kind: "review", category: "納期", subject: "v1.4.0 の納入見込みについて（12/10 → 12/17 の見込み）", to: ["中村 拓也（架空商事）", "小松 恵（架空商事）"], channel: "メール（窓口名義）", target_version: "MS-104 予測 2026-11-27 10:15 同期", body: "v1.4.0 の納入は、結合テスト環境の準備の遅れにより 12/17 となる見込みです。確約日（12/10）の変更をお願いするかどうかは、12/1 の進捗レビューでご相談させてください。", status: "pendingApproval", dedup_key: "order-renewal/MS-104/forecast-2026-12-17" },
  { id: "OUT-0411", project: "order-renewal", kind: "review", category: "金額", subject: "CR-0007 の追加お見積り", to: ["小松 恵（架空商事）"], channel: "顧客ポータル＋メール通知", target_version: "CR-0007 見積 v1", body: "受注一覧 CSV への6列目（担当者）の追加は、18万円（税抜）で対応できます。納期への影響はありません。", status: "reapproval", approved_by: "u-kimura", approved_at: "2026-11-26T17:00:00+09:00", dedup_key: "order-renewal/CR-0007/quote-v1", change_after_approval: "承認後に宛先へ「中村 拓也」が追加されました。宛先が変わったため再承認が必要です" },
  { id: "OUT-0410", project: "order-renewal", kind: "auto", rule: "受領通知（委任ルール R-01）", category: "受領通知", subject: "お問い合わせを受け付けました（INQ-0033）", to: ["野口 舞（架空商事）"], channel: "メール（窓口名義）", target_version: "—", body: "お問い合わせを受け付けました（受付番号 INQ-0033）。11/28 中に回答します。", status: "sent", sent_at: "2026-11-27T08:51:00+09:00", dedup_key: "INQ-0033/ack" },
  { id: "OUT-0409", project: "order-renewal", kind: "auto", rule: "定型の催促（委任ルール R-03）", category: "定型の催促", subject: "【ご確認のお願い】取引先コードの重複行の扱い", to: ["野口 舞（架空商事）"], channel: "メール（窓口名義）", target_version: "INQ-0032", body: "先日お送りした確認事項へのご回答をお願いします。", status: "suppressed", dedup_key: "INQ-0032/remind-1", error: "10:12 に顧客から回答があったため、予定していた催促は送りませんでした" },
  { id: "OUT-0408", project: "member-app-api", kind: "review", category: "障害説明", subject: "会員アプリ API の応答遅延について（第1報）", to: ["藤井 晃（架空リテール）"], channel: "Microsoft Teams（顧客共有）", target_version: "INC-0111 2026-11-27 10:21", body: "本日 10:21 から会員アプリ API の応答が遅くなっています。原因を調査中です。次の報告は 11:30 です。", status: "failed", approved_by: "u-mori", approved_at: "2026-11-27T10:28:00+09:00", dedup_key: "member-app-api/INC-0111/report-1", error: "Teams の Workflow の所有者が無効化されたため投稿できませんでした。代替経路（メール）で再送できます。同じ確約は二重に発信されません" },
  { id: "OUT-0407", project: "order-renewal", kind: "review", category: "範囲", subject: "INQ-0031 の回答（出力順）", to: ["松田 亮（受託者）"], channel: "アプリ内", target_version: "SOW v3 §4.2", body: "画面の並びと同じ（受注日の新しい順）で確定しました。顧客回答日 2026-11-19。", status: "sent", approved_by: "u-aoki", approved_at: "2026-11-19T15:58:00+09:00", sent_at: "2026-11-19T16:00:00+09:00", dedup_key: "INQ-0031/answer" },
];

/** 委任ルール（定型だけを自動で送る） */
export const delegationRules = [
  { id: "R-01", name: "受領通知", scope: "問い合わせ・提出を受け付けたとき", auto: true },
  { id: "R-02", name: "回答予定の通知", scope: "回答予定日が決まったとき（予定日は人が設定）", auto: true },
  { id: "R-03", name: "定型の催促", scope: "回答期限の前日・当日（回答があれば送らない）", auto: true },
  { id: "R-04", name: "金額・範囲・納期・障害説明", scope: "常に人が宛先・文面・対象版を確認してから送る", auto: false },
];

/** 変更条件の再合意（H-04）。顧客との条件と委託条件を別々に持つ */
export type ChangeAgreement = {
  id: string;
  project: string;
  title: string;
  requested_by: string;
  requested_at: string;
  customer: { price: number; due_impact: string; approver_id: string; status: "notAsked" | "pending" | "agreed" | "rejected"; agreed_at?: string; contract_ref: string };
  commission: { order_id: string; freelancer_id: string; extra_fee: number; due_impact: string; status: "notAsked" | "pending" | "negotiating" | "agreed" | "declined"; note?: string; contract_ref: string };
  decision?: string;
  affected: { kind: "計画" | "発注" | "要求"; id: string; label: string }[];
};

export const changeAgreements: ChangeAgreement[] = [
  {
    id: "CR-0007",
    project: "order-renewal",
    title: "受注一覧 CSV に6列目（担当者）を追加",
    requested_by: "u-nakamura",
    requested_at: "2026-11-25T11:00:00+09:00",
    customer: { price: 180_000, due_impact: "納期への影響なし（v1.4.0 に含める）", approver_id: "u-komatsu", status: "agreed", agreed_at: "2026-11-26T16:40:00+09:00", contract_ref: "個別契約（架空商事）変更覚書案 v1" },
    commission: { order_id: "ORD-0101", freelancer_id: "u-matsuda", extra_fee: 60_000, due_impact: "提出期限を 11/28 → 12/2 に変更", status: "pending", contract_ref: "ORD-0101 条件 v3（案）", note: "受託者に追加見積と期限の確認を依頼済み（11/26 17:10）" },
    decision: "DEC-0031",
    affected: [
      { kind: "要求", id: "REQ-0007", label: "受注一覧の出力（v4 案）" },
      { kind: "発注", id: "ORD-0101", label: "受注一覧の CSV 出力（条件 v3 案）" },
      { kind: "計画", id: "MS-104", label: "v1.4.0 納入（日付は変わらない）" },
    ],
  },
];

/** 担当・代理・応答期限（H-05） */
export type Assignment = {
  id: string;
  kind: "質問" | "未検収" | "承認待ち" | "受入待ち";
  target: string;
  title: string;
  project: string;
  waiting_on: string;
  owner_id: string;
  deputy_id: string;
  due: string;
  next_contact: string;
  state: "onTrack" | "reminding" | "escalated" | "done";
  steps: { at: string; action: string; status: "sent" | "scheduled" | "cancelled" | "done" }[];
};

export const assignments: Assignment[] = [
  {
    id: "AS-01", kind: "質問", target: "INQ-0032", title: "取引先コードの重複行の扱い", project: "order-renewal", waiting_on: "顧客（野口 舞）", owner_id: "u-aoki", deputy_id: "u-kimura", due: "2026-11-29", next_contact: "受託者 林 由香へ回答",
    state: "done",
    steps: [
      { at: "2026-11-27T09:05:00+09:00", action: "顧客へ確認を送信", status: "sent" },
      { at: "2026-11-28T09:00:00+09:00", action: "定型の催促（前日）", status: "cancelled" },
      { at: "2026-11-27T10:12:00+09:00", action: "顧客が回答", status: "done" },
    ],
  },
  {
    id: "AS-02", kind: "質問", target: "INQ-0035", title: "与信区分の値の一覧", project: "order-renewal", waiting_on: "顧客（野口 舞）", owner_id: "u-aoki", deputy_id: "u-kimura", due: "2026-11-28", next_contact: "架空商事 情報システム部（代表）",
    state: "reminding",
    steps: [
      { at: "2026-11-27T09:30:00+09:00", action: "顧客へ確認を送信", status: "sent" },
      { at: "2026-11-28T09:00:00+09:00", action: "定型の催促（当日）", status: "scheduled" },
      { at: "2026-11-28T18:00:00+09:00", action: "期限超過で代理（木村 達也）へ移行", status: "scheduled" },
    ],
  },
  {
    id: "AS-03", kind: "承認待ち", target: "INQ-0036", title: "v1.4.0 のリリース枠の確認", project: "order-renewal", waiting_on: "顧客（情報システム部）", owner_id: "u-aoki", deputy_id: "u-kimura", due: "2026-11-26", next_contact: "小松 恵（電話は代理が対応）",
    state: "escalated",
    steps: [
      { at: "2026-11-24T10:00:00+09:00", action: "顧客へ確認を送信", status: "sent" },
      { at: "2026-11-26T09:00:00+09:00", action: "定型の催促（当日）", status: "sent" },
      { at: "2026-11-26T18:00:00+09:00", action: "期限超過で代理（木村 達也）へ移行", status: "done" },
    ],
  },
  {
    id: "AS-04", kind: "未検収", target: "ORD-0101", title: "受注一覧の CSV 出力（提出 11/27）", project: "order-renewal", waiting_on: "委託元の検収者（伊藤 誠）", owner_id: "u-aoki", deputy_id: "u-mori", due: "2026-12-05", next_contact: "検収者 伊藤 誠",
    state: "onTrack",
    steps: [
      { at: "2026-11-27T09:21:00+09:00", action: "検収を依頼", status: "sent" },
      { at: "2026-12-04T09:00:00+09:00", action: "定型の催促（前日）", status: "scheduled" },
    ],
  },
  {
    id: "AS-05", kind: "受入待ち", target: "rel-140", title: "v1.4.0 の顧客受入", project: "order-renewal", waiting_on: "顧客の検収者（野口 舞）", owner_id: "u-aoki", deputy_id: "u-kimura", due: "2026-12-24", next_contact: "野口 舞",
    state: "onTrack",
    steps: [{ at: "2026-12-17T18:00:00+09:00", action: "受入の依頼（納入後）", status: "scheduled" }],
  },
];

/** 週報（H-06）の材料。同じ実績から相手別に組み立てる */
export type ReportFact = {
  id: string;
  text: string;
  source: string;
  fetched_at: string;
  audiences: ("customer" | "executive" | "freelancer")[];
  freelancer_id?: string;
};

export const reportFacts: ReportFact[] = [
  { id: "F1", text: "v1.4.0 の納入見込みは 12/17（確約日 12/10 から7日の遅れ見込み）", source: "MS-104（GitHub Projects）", fetched_at: "2026-11-27T10:15:00+09:00", audiences: ["customer", "executive"] },
  { id: "F2", text: "顧客へのご確認事項: 与信区分の値の一覧（11/28 期限）", source: "INQ-0035", fetched_at: "2026-11-27T10:20:00+09:00", audiences: ["customer", "executive"] },
  { id: "F3", text: "受注一覧の CSV 出力を受託者が提出。委託元の検収中", source: "ORD-0101 / SUB-0101-1", fetched_at: "2026-11-27T09:21:00+09:00", audiences: ["executive"] },
  { id: "F4", text: "外注の発注済み未検収額 225万円、検収済み原価 75万円（予測粗利率 30%）", source: "発注・検収の照合（社内）", fetched_at: "2026-11-27T09:00:00+09:00", audiences: ["executive"] },
  { id: "F5", text: "判断待ち: CR-0007 の追加費用（DEC-0031、12/2 期限）", source: "M-02", fetched_at: "2026-11-27T10:00:00+09:00", audiences: ["executive"] },
  { id: "F6", text: "あなたの依頼 ORD-0101: 提出版を検収中（12/5 までに結果をお知らせします）", source: "ORD-0101", fetched_at: "2026-11-27T09:21:00+09:00", audiences: ["freelancer"], freelancer_id: "u-matsuda" },
  { id: "F7", text: "あなたの依頼 ORD-0101: 6列目の追加について条件の確認をお願いしています（回答期限 11/28）", source: "CR-0007 / ORD-0101 条件 v3 案", fetched_at: "2026-11-27T09:00:00+09:00", audiences: ["freelancer"], freelancer_id: "u-matsuda" },
  { id: "F8", text: "あなたの依頼 ORD-0102: 重複行の扱いが決まりました（エラーとして一覧表示）", source: "INQ-0032", fetched_at: "2026-11-27T10:12:00+09:00", audiences: ["freelancer"], freelancer_id: "u-hayashi" },
];
