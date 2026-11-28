// 画面ID: B-02 依頼書の作成
// 承認済みの案件から予算上限・依頼可能な範囲・窓口・納入責任者を引き継ぎ、受託者への発注条件を作る。
// 必須項目がそろうまで確定発行できない。発行した版は保存し、受諾はその版に紐付く。
import { useMemo, useState } from "react";
import { useRoute, useScreenState } from "../../lib/router";
import { ORG, paths } from "../../lib/paths";
import { daysBetween, yen } from "../../lib/format";
import { CASE_STATUS } from "../../lib/vocab";
import { businessCases } from "../../mocks/portfolio";
import { partners, workPackages } from "../../mocks/orders";
import {
  AppLayout,
  Banner,
  Button,
  crumbs,
  DatePicker,
  ExternalActor,
  PageHeader,
  Section,
  Select,
  StatusBadge,
  Tag,
  TextArea,
  TextField,
  useToast,
  VersionPin,
} from "../../ui";
import { AiDraftNote, CheckMark, InternalOnly, Kv, userName } from "./parts";

type Source = { key: string; label: string; status: keyof typeof CASE_STATUS; cap: number; scope: string; desk: string; owner: string; project?: string };

const SOURCES: Source[] = [
  { key: "order-renewal", label: "受発注システム刷新（開始承認済み・外注枠 300万円）", status: "approved", cap: 3_000_000, scope: "v1.4.0 の取引先マスタ取込・CSV 出力・操作ログ検索の実装", desk: "u-aoki", owner: "u-watanabe", project: "order-renewal" },
  ...businessCases.map((b) => ({
    key: b.id,
    label: `${b.id} ${b.title}（${CASE_STATUS[b.status].label}）`,
    status: b.status,
    cap: b.cost,
    scope: b.options.find((o) => o.recommended)?.name ?? "—",
    desk: "u-aoki",
    owner: b.proposer,
    project: b.project,
  })),
];

type Form = {
  freelancer: string;
  orderDate: string;
  scope: string;
  outOfScope: string;
  deliveryTo: string;
  due: string;
  criteria: string;
  inspectionDue: string;
  fee: string;
  paymentDue: string;
  paymentMethod: string;
};

const FILLED: Form = {
  freelancer: "u-ogawa",
  orderDate: "2026-11-27",
  scope: "取込結果の画面（失敗行の一覧）を実装する",
  outOfScope: "取込 API の変更\n失敗行の CSV 書き出し",
  deliveryTo: "サンプルソフト株式会社（案件窓口）",
  due: "2026-12-11",
  criteria: "失敗した行の行番号と理由を表示する\n1万件の失敗行を3秒以内に表示する",
  inspectionDue: "2026-12-18",
  fee: "150000",
  paymentDue: "2027-01-31",
  paymentMethod: "銀行振込（月末締め翌月末払い）",
};

const LABELS: Record<keyof Form, string> = {
  freelancer: "受託者",
  orderDate: "発注日",
  scope: "作業内容",
  outOfScope: "対象外",
  deliveryTo: "納入先",
  due: "納入期日",
  criteria: "完成条件",
  inspectionDue: "検査期日",
  fee: "報酬",
  paymentDue: "支払期日",
  paymentMethod: "支払方法",
};

export function B02OrderNew() {
  const state = useScreenState();
  const org = useRoute().params.org ?? ORG;
  const toast = useToast();
  const [sourceKey, setSourceKey] = useState(state === "onHold" ? "BC-0007" : "order-renewal");
  const [form, setForm] = useState<Form>(state === "missing" ? { ...FILLED, paymentDue: "", inspectionDue: "", outOfScope: "" } : FILLED);
  const [issued, setIssued] = useState(state === "issued");
  const [sending, setSending] = useState(false);
  const [aiShown, setAiShown] = useState(state === "aiDraft");
  const source = SOURCES.find((s) => s.key === sourceKey)!;
  const approved = source.status === "approved";
  const set = (k: keyof Form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));
  const missing = useMemo(() => (Object.keys(LABELS) as (keyof Form)[]).filter((k) => !form[k].trim()).map((k) => LABELS[k]), [form]);
  const fee = Number(form.fee) || 0;
  const overCap = fee > source.cap;
  const longPayment = form.due && form.paymentDue ? daysBetween(form.due, form.paymentDue) > 60 : false;
  const blockReason = !approved
    ? `案件が「${CASE_STATUS[source.status].label}」のため、正式な発注はできません（下書きの保存のみ）`
    : missing.length
      ? `必須項目が ${missing.length} 件未入力です`
      : overCap
        ? "報酬が外注枠の上限を超えています"
        : undefined;
  const trail = crumbs(org, undefined, { label: "受託者への発注", to: paths.orders(org) }, { label: "依頼書の作成" });

  const issue = () => {
    setSending(true);
    window.setTimeout(() => {
      setSending(false);
      setIssued(true);
      toast({ kind: "success", message: "依頼書 v1 を確定発行しました。受託者に通知し、発行時の版を保存しました" });
    }, 600);
  };

  if (issued) {
    return (
      <AppLayout org={org} active="orders" breadcrumb={trail}>
        <PageHeader title="依頼書を発行しました" id="ORD-0105" status={<VersionPin version={1} />} />
        <Banner tone="pass" title="受付番号 ORD-0105 v1">
          発行時の条件を版として保存しました。受託者が受諾するまで発注は成立しません。既読になっても受諾とは扱いません。同じ内容を再送しても、二重に発注されることはありません。
        </Banner>
        <Section title="発行した条件の控え">
          <div className="ord-kv-grid">
            {(Object.keys(LABELS) as (keyof Form)[]).map((k) => (
              <Kv key={k} label={LABELS[k]}>{k === "freelancer" ? userName(form.freelancer) : k === "fee" ? yen(fee) : form[k].split("\n").join("／")}</Kv>
            ))}
            <Kv label="発注者">サンプルソフト株式会社（{userName("u-kimura")}）</Kv>
          </div>
        </Section>
        <div className="row">
          <Button variant="primary" to={paths.order(org, "ORD-0101")}>発注の詳細を見る（例: ORD-0101）</Button>
          <Button to={paths.orders(org)}>発注一覧へ</Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout org={org} active="orders" breadcrumb={trail}>
      <PageHeader
        title="依頼書の作成"
        description="承認済みの案件から、予算上限・依頼可能な範囲・窓口・納入責任者を引き継いで、受託者への発注条件を作ります。必須項目がそろうまで確定発行はできません。"
        actions={
          <>
            <Button icon="sparkles" onClick={() => setAiShown(true)}>AI で分解案を作る</Button>
            <Button onClick={() => toast({ kind: "success", message: "下書きを保存しました（受託者には届きません）" })}>下書き保存</Button>
            <Button variant="primary" icon="send" loading={sending} disabled={!!blockReason || sending} disabledReason={blockReason} onClick={issue}>確定して発行</Button>
          </>
        }
      />
      <InternalOnly />
      <Section title="1. 引き継ぐ案件" sub="開始が承認された案件だけ、正式に発注できます">
        <div className="stack">
          <Select label="案件・事業ケース" value={sourceKey} onChange={setSourceKey} options={SOURCES.map((s) => ({ value: s.key, label: s.label }))} />
          <div className="ord-kv-grid">
            <Kv label="状態"><StatusBadge vocab={CASE_STATUS[source.status]} size="sm" /></Kv>
            <Kv label="予算上限（外注枠）">{yen(source.cap)}</Kv>
            <Kv label="依頼可能な範囲">{source.scope}</Kv>
            <Kv label="案件窓口"><ExternalActor userId={source.desk} /></Kv>
            <Kv label="納入責任者"><ExternalActor userId={source.owner} /></Kv>
          </div>
          {!approved ? (
            <Banner tone="warn" title="この案件はまだ開始が承認されていません">
              審議中・保留・提出済みの事業ケースからは正式な発注を出せません。下書きは保存できます。開始の判断は <Button size="sm" variant="ghost" to={paths.intake(org)}>案件受付</Button> で行います。
            </Banner>
          ) : null}
        </div>
      </Section>
      {aiShown ? (
        <AiDraftNote>
          SOW v3 §4 から分解した案: 「{workPackages[1].title}」を未割当の範囲として提案します（完成条件 {workPackages[1].criteria.length} 件、検収者 {userName(workPackages[1].inspector)}）。採用するかは人が決めます。条件の確約や金額は AI が決めません。
        </AiDraftNote>
      ) : null}
      <Section title="2. 発注条件" sub="受託者に提示する内容です。発行すると版として保存されます">
        <div className="stack">
          <div className="ord-terms">
            <Select label="受託者" required value={form.freelancer} onChange={set("freelancer")} options={partners.filter((p) => p.user_id).map((p) => ({ value: p.user_id!, label: `${p.name}（${p.skills.join("・")}）` }))} />
            <DatePicker label="発注日" required value={form.orderDate} onChange={set("orderDate")} />
          </div>
          <TextArea label="作業内容" required rows={2} value={form.scope} onChange={set("scope")} />
          <TextArea label="対象外" required rows={2} value={form.outOfScope} onChange={set("outOfScope")} help="範囲外の要望が出たとき、修正と追加依頼を仕分ける根拠になります" error={!form.outOfScope.trim() ? "対象外を1行以上入力してください" : undefined} />
          <TextArea label="完成条件" required rows={3} value={form.criteria} onChange={set("criteria")} help="1行に1つ。検収者はこの条件ごとに合格・差戻しを判断します" />
          <div className="ord-terms">
            <TextField label="納入先" required value={form.deliveryTo} onChange={set("deliveryTo")} />
            <DatePicker label="納入期日" required value={form.due} onChange={set("due")} />
            <DatePicker label="検査期日" required value={form.inspectionDue} onChange={set("inspectionDue")} error={!form.inspectionDue ? "検査期日を入力してください" : undefined} />
            <TextField label="報酬（税抜・円）" required value={form.fee} onChange={set("fee")} error={overCap ? `外注枠の上限 ${yen(source.cap)} を超えています` : undefined} />
            <DatePicker label="支払期日" required value={form.paymentDue} onChange={set("paymentDue")} error={!form.paymentDue ? "支払期日を入力してください" : undefined} />
            <TextField label="支払方法" required value={form.paymentMethod} onChange={set("paymentMethod")} />
          </div>
          <Kv label="発注者">サンプルソフト株式会社（{userName("u-kimura")}）</Kv>
        </div>
      </Section>
      <Section title="3. 発行前の確認">
        <div className="stack">
          <div className="row">
            <CheckMark ok={approved} label="案件の開始が承認済み" />
            <CheckMark ok={missing.length === 0} label="必須項目がそろっている" />
            <CheckMark ok={!overCap} label="外注枠の範囲内" />
          </div>
          {missing.length ? (
            <Banner tone="fail" title="次の項目が未入力のため、確定発行できません">
              <ul className="ord-missing">{missing.map((m) => <li key={m}>{m}</li>)}</ul>
            </Banner>
          ) : null}
          {longPayment ? <Banner tone="warn" title="支払期日が納入期日から60日を超えています">取引類型によっては法令で支払期日の上限が定められています。適用関係を確認してください。</Banner> : null}
          <Banner tone="info" title="取引条件の明示と支払期日の管理">
            フリーランスへの業務委託では、取引条件の明示と報酬の支払期日の管理が求められる場合があります（公正取引委員会の案内を参照）。適用されるかは取引類型と発注者の条件によるため、テンプレートの運用前に確認してください。本画面は発注・給付の受領・検査・顧客受入・支払の各日を別々に記録します。顧客の検収待ちを理由に支払期日を繰り下げることはできません。
          </Banner>
          <p className="tiny muted" style={{ margin: 0 }}>
            <Tag square>v1</Tag> として保存され、受託者の画面に表示されます。発行後に条件を変える場合は新しい版を出し、受託者が新しい版を承諾するまで旧版の条件が有効です。
          </p>
        </div>
      </Section>
    </AppLayout>
  );
}
