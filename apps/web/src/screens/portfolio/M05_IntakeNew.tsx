// 画面ID: M-05 事業ケースの作成
import { useState } from "react";
import { useRoute, useScreenState } from "../../lib/router";
import { ORG, paths } from "../../lib/paths";
import { currentUser, users } from "../../mocks/core";
import { strategicGoals } from "../../mocks/investment";
import { AppLayout, Banner, Button, Combobox, crumbs, DatePicker, Icon, PageHeader, Section, Select, TextArea, TextField, useToast } from "../../ui";
import { RoleNote } from "./parts";

type Option = { name: string; cost: string; benefit: string; risk: string; recommended: boolean; fixed?: boolean };
type Kpi = { name: string; baseline: string; target: string };

const EMPTY = {
  title: "",
  customer: "",
  strategy: "",
  problem: "",
  benefit: "",
  cost: "",
  risks: "",
  constraints: "",
  sponsor: [] as string[],
  review: "",
};

const FILLED = {
  title: "架空食品株式会社 受注管理の改修（新規受託）",
  customer: "架空食品株式会社",
  strategy: "G-1",
  problem: "繁忙期に受注入力が追いつかず、出荷遅れが月 5 件発生している",
  benefit: "売上 1,600 万円、粗利 400 万円。食品業界での実績づくり",
  cost: "12000000",
  risks: "顧客側の担当者が兼務で、要求の確定が遅れる可能性",
  constraints: "2027年4月の繁忙期前に稼働が必要",
  sponsor: ["u-ishii"],
  review: "2026-12-16",
};

export function IntakeNew() {
  const state = useScreenState();
  const org = useRoute().params.org ?? ORG;
  const toast = useToast();
  const [form, setForm] = useState(state === "missing" ? { ...EMPTY, title: FILLED.title } : state === "default" ? EMPTY : FILLED);
  const [options, setOptions] = useState<Option[]>([
    { name: "実施しない", cost: "0", benefit: "", risk: "", recommended: false, fixed: true },
    { name: "", cost: "", benefit: "", risk: "", recommended: true },
  ]);
  const [kpis, setKpis] = useState<Kpi[]>([{ name: "", baseline: "", target: "" }]);
  const [submitted, setSubmitted] = useState(state === "missing");
  const done = state === "submitted";

  const set = (k: keyof typeof EMPTY, v: string | string[]) => setForm((f) => ({ ...f, [k]: v }));
  const errors: Record<string, string> = {
    title: !form.title.trim() ? "案件名を入力してください" : "",
    strategy: !form.strategy ? "戦略目標を選んでください" : "",
    problem: !form.problem.trim() ? "課題・機会を入力してください" : "",
    benefit: !form.benefit.trim() ? "想定便益を入力してください" : "",
    cost: !form.cost.trim() ? "費用を入力してください" : "",
    sponsor: form.sponsor.length === 0 ? "スポンサーを選んでください" : "",
    review: !form.review ? "審議日を選んでください" : "",
    doNothing: !options[0].risk.trim() ? "「実施しない」場合のリスクを入力してください" : "",
    kpi: kpis.every((k) => !k.name.trim()) ? "成功指標を1つ以上入力してください" : "",
  };
  const missing = Object.values(errors).filter(Boolean).length;
  const err = (k: string) => (submitted ? errors[k] || undefined : undefined);

  const submit = () => {
    setSubmitted(true);
    if (missing === 0) toast({ kind: "success", message: "事業ケースを提出しました。スポンサーに審議を依頼しました" });
  };

  if (done) {
    return (
      <AppLayout org={org} active="intake" breadcrumb={crumbs(org, undefined, { label: "案件受付", to: paths.intake(org) }, { label: "事業ケースの作成" })}>
        <PageHeader title="事業ケースを提出しました" />
        <div className="card stack" style={{ maxWidth: 640 }}>
          <Banner tone="pass" title="BC-0010 を提出しました">スポンサー（石井 浩二）に審議を依頼しました。審議日は 2026/12/16 です。</Banner>
          <p className="small muted">提出後の内容の変更は、審議前であれば提案者が行えます。審議の結果（開始承認・保留・却下）は判断ログに記録されます。</p>
          <div className="row">
            <Button variant="primary" to={paths.businessCase(org, "BC-0008")} iconRight="arrowRight">事業ケースを見る</Button>
            <Button to={paths.intake(org)}>案件受付へ戻る</Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout org={org} active="intake" breadcrumb={crumbs(org, undefined, { label: "案件受付", to: paths.intake(org) }, { label: "事業ケースの作成" })}>
      <PageHeader
        title="事業ケースの作成"
        description="新規案件・追加投資を判断するための情報です。PM や現場の責任者が作成し、スポンサーが審議を依頼します。"
        actions={
          <>
            <Button icon="fileText" onClick={() => toast({ kind: "success", message: "下書きを保存しました" })}>下書き保存</Button>
            <Button variant="primary" icon="send" onClick={submit}>提出する</Button>
          </>
        }
      />
      <div className="stack" style={{ maxWidth: 880 }}>
        <RoleNote>
          登録者: {currentUser.name}。提案書・見積りの原本は文書管理に置き、ここには判断に必要な要点を書きます。規格の要求事項を判断する画面ではありません。
        </RoleNote>
        {submitted && missing > 0 ? <Banner tone="fail" title={`必須項目が ${missing} 件未入力です`}>赤字の項目を入力してから提出してください。下書きとしては保存できます。</Banner> : null}

        <Section title="概要">
          <div className="stack">
            <TextField label="案件名" required value={form.title} onChange={(v) => set("title", v)} error={err("title")} maxLength={120} />
            <div className="grid cols-2">
              <TextField label="顧客" value={form.customer} onChange={(v) => set("customer", v)} help="自社の投資案件なら空欄" />
              <Select label="戦略目標との整合" required value={form.strategy} onChange={(v) => set("strategy", v)} placeholder="選択してください" options={strategicGoals.map((g) => ({ value: g.id, label: `${g.id} ${g.title}` }))} error={err("strategy")} />
            </div>
            <TextArea label="課題・機会" required rows={3} value={form.problem} onChange={(v) => set("problem", v)} error={err("problem")} placeholder="誰の、どんな課題か。放置した場合の影響" />
          </div>
        </Section>

        <Section title="選択肢" sub="「実施しない」案は必須です。推奨案を1つ選んでください">
          <div className="stack">
            {err("doNothing") ? <Banner tone="fail">{errors.doNothing}</Banner> : null}
            {options.map((o, i) => (
              <div key={i} className="card tight stack" style={{ ["--gap" as string]: "8px" }}>
                <div className="row between">
                  <strong className="small">{o.fixed ? "選択肢 0: 実施しない（必須）" : `選択肢 ${i}`}</strong>
                  <div className="row">
                    <label className="row small" style={{ ["--gap" as string]: "4px" }}>
                      <input type="radio" name="recommended" checked={o.recommended} onChange={() => setOptions((xs) => xs.map((x, j) => ({ ...x, recommended: j === i })))} />
                      推奨案
                    </label>
                    {!o.fixed && options.length > 2 ? <Button size="sm" variant="ghost" icon="trash" iconOnly label="この選択肢を削除" onClick={() => setOptions((xs) => xs.filter((_, j) => j !== i))} /> : null}
                  </div>
                </div>
                <div className="grid cols-2">
                  <TextField label="内容" value={o.name} readOnly={o.fixed} onChange={(v) => setOptions((xs) => xs.map((x, j) => (j === i ? { ...x, name: v } : x)))} placeholder="例: 段階契約で受注" />
                  <TextField label="費用（円）" type="number" value={o.cost} readOnly={o.fixed} onChange={(v) => setOptions((xs) => xs.map((x, j) => (j === i ? { ...x, cost: v } : x)))} />
                </div>
                <div className="grid cols-2">
                  <TextField label="便益" value={o.benefit} onChange={(v) => setOptions((xs) => xs.map((x, j) => (j === i ? { ...x, benefit: v } : x)))} />
                  <TextField label="リスク" required={o.fixed} value={o.risk} onChange={(v) => setOptions((xs) => xs.map((x, j) => (j === i ? { ...x, risk: v } : x)))} error={o.fixed ? err("doNothing") : undefined} />
                </div>
              </div>
            ))}
            <div><Button icon="plus" size="sm" onClick={() => setOptions((xs) => [...xs, { name: "", cost: "", benefit: "", risk: "", recommended: false }])}>選択肢を追加</Button></div>
          </div>
        </Section>

        <Section title="便益・費用・リスク">
          <div className="stack">
            <TextArea label="想定便益" required rows={2} value={form.benefit} onChange={(v) => set("benefit", v)} error={err("benefit")} />
            <div className="grid cols-2">
              <TextField label="推奨案の費用（円）" required type="number" value={form.cost} onChange={(v) => set("cost", v)} error={err("cost")} help="概算。見積りの原本は文書管理へ" />
              <DatePicker label="審議日" required value={form.review} onChange={(v) => set("review", v)} min="2026-11-27" error={err("review")} />
            </div>
            <TextArea label="主なリスク" rows={2} value={form.risks} onChange={(v) => set("risks", v)} />
            <TextArea label="制約・前提" rows={2} value={form.constraints} onChange={(v) => set("constraints", v)} />
          </div>
        </Section>

        <Section title="成功指標（KPI）" sub="リリース後に便益・成果の画面で実績と比べます">
          <div className="stack">
            {err("kpi") ? <Banner tone="fail">{errors.kpi}</Banner> : null}
            {kpis.map((k, i) => (
              <div key={i} className="grid cols-3">
                <TextField label={i === 0 ? "指標" : undefined} value={k.name} onChange={(v) => setKpis((xs) => xs.map((x, j) => (j === i ? { ...x, name: v } : x)))} placeholder="例: 解約率" />
                <TextField label={i === 0 ? "基準値（現在）" : undefined} value={k.baseline} onChange={(v) => setKpis((xs) => xs.map((x, j) => (j === i ? { ...x, baseline: v } : x)))} placeholder="例: 年 6.0%" />
                <TextField label={i === 0 ? "目標" : undefined} value={k.target} onChange={(v) => setKpis((xs) => xs.map((x, j) => (j === i ? { ...x, target: v } : x)))} placeholder="例: 年 4.5%" />
              </div>
            ))}
            <div><Button icon="plus" size="sm" onClick={() => setKpis((xs) => [...xs, { name: "", baseline: "", target: "" }])}>指標を追加</Button></div>
          </div>
        </Section>

        <Section title="スポンサー">
          <div style={{ maxWidth: 420 }}>
            <Combobox
              label="スポンサー"
              required
              options={users.filter((u) => u.account && u.roles.some((r) => ["経営者", "役員", "事業責任者", "CTO", "事業部長", "案件スポンサー"].includes(r))).map((u) => ({ value: u.id, label: u.name, hint: u.title }))}
              value={form.sponsor}
              onChange={(v) => set("sponsor", v)}
              help="事業ケースの継続妥当性と重要判断に責任を持つ人。経営層の利用者から選びます"
              error={err("sponsor")}
            />
          </div>
        </Section>

        <div className="row end">
          <span className="small muted"><Icon name="info" size={13} /> 提出するとスポンサーに通知されます</span>
          <Button icon="fileText" onClick={() => toast({ kind: "success", message: "下書きを保存しました" })}>下書き保存</Button>
          <Button variant="primary" icon="send" onClick={submit}>提出する</Button>
        </div>
      </div>
    </AppLayout>
  );
}
