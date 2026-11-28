// 画面ID: O-05 プロジェクトの作成
// 承認済みの事業ケースから作成する。進め方と用語の対応、計画の正本、Profile・Control Pack・ルール・テンプレート・強制レベルの版を固定する。
import { useState } from "react";
import { useScreenState, useRoute, navigate } from "../../lib/router";
import { ORG, paths } from "../../lib/paths";
import { DATA_CLASS, ENFORCEMENT_LEVEL, PROVIDERS } from "../../lib/vocab";
import type { DataClass, EnforcementLevel, ProviderKey } from "../../lib/vocab";
import { AppLayout, Banner, Button, Combobox, crumbs, ExternalActor, KeyValueList, OptionCard, PageHeader, ProviderBadge, Section, Select, Tag, TextField, useToast } from "../../ui";
import { repos, userById, users } from "../../mocks/core";
import { businessCases } from "../../mocks/portfolio";
import { yenM } from "../../lib/format";

/** 承認済みの事業ケース（BC-0010 はこの画面用の架空データ） */
const CASES = [
  { id: "BC-0010", title: "架空物流 配送管理システム（要求定義フェーズ）", customer: "架空物流株式会社", sponsor_id: "u-ishii", cost: 3_000_000, decided: "2026-11-26 木村 達也が開始を承認（DEC-0030）", project: undefined as string | undefined },
  ...businessCases.filter((b) => b.status === "approved").map((b) => ({ id: b.id, title: b.title, customer: b.customer ?? "（自社）", sponsor_id: b.sponsor_id, cost: b.cost, decided: "開始承認済み", project: b.project })),
];

const PHASE_TERMS = [
  { product: "計画", agile: "インセプション", iterative: "計画", waterfall: "企画・計画" },
  { product: "要求", agile: "プロダクトバックログの整備", iterative: "要求定義", waterfall: "要件定義" },
  { product: "設計", agile: "スプリント内の設計（ADR）", iterative: "設計", waterfall: "基本設計・詳細設計" },
  { product: "実装", agile: "スプリント", iterative: "反復ごとの実装", waterfall: "製造" },
  { product: "結合・テスト", agile: "スプリントレビュー・受入テスト", iterative: "反復ごとの結合テスト", waterfall: "結合テスト・総合テスト" },
  { product: "納入", agile: "リリース", iterative: "段階リリース", waterfall: "納品・受入" },
];

const ACTOR_FIELDS = [
  { key: "pm", label: "PM", required: true },
  { key: "qa", label: "QA（テスト結果の記録）", required: false },
  { key: "release", label: "リリースの承認者", required: true },
  { key: "customer", label: "顧客の承認者（期限付きの承認リンクで承認）", required: true },
];

export function ProjectNew() {
  const state = useScreenState();
  const toast = useToast();
  const org = useRoute().params.org ?? ORG;
  const err = state === "error";
  const sod = state === "sod";
  const noCase = state === "noCase";
  const [caseId, setCaseId] = useState(noCase ? "" : "BC-0010");
  const picked = CASES.find((c) => c.id === caseId);
  const [name, setName] = useState(err ? "" : "配送管理システム（要求定義）");
  const [approach, setApproach] = useState<"agile" | "iterative" | "waterfall">("iterative");
  const [planning, setPlanning] = useState<ProviderKey>("jira");
  const [repoSel, setRepoSel] = useState<string[]>(err ? [] : ["sample-soft/member-app-api"]);
  const [enf, setEnf] = useState<EnforcementLevel>("warnOnly");
  const [cls, setCls] = useState<DataClass>("confidential");
  const [actors, setActors] = useState<Record<string, string[]>>({
    pm: ["u-sato"],
    qa: sod ? ["u-watanabe"] : ["u-ito"],
    release: sod ? ["u-watanabe"] : err ? [] : ["u-watanabe"],
    customer: ["u-nakamura"],
  });
  const actorOptions = users.filter((u) => u.account === false || u.kind === "external").filter((u) => u.roles.length).map((u) => ({ value: u.id, label: u.name, hint: `${u.roles.join("・")}${u.external_ids?.[0] ? ` · ${PROVIDERS[u.external_ids[0].provider].label}: ${u.external_ids[0].handle}` : u.kind === "external" ? " · メール" : ""}` }));
  const sodWarn = actors.qa[0] && actors.qa[0] === actors.release[0];

  return (
    <AppLayout org={org} active="projects" breadcrumb={crumbs(org, undefined, { label: "プロジェクト", to: paths.projects(org) }, { label: "作成" })}>
      <PageHeader title="プロジェクトを作成" description="開始が承認された事業ケースから作成します。計画の正本、統制のセットと版、実務の担当（外部ID）を設定します。担当者のアカウントは作りません。" />
      {err ? <Banner tone="fail" title="入力内容を確認してください">3件のエラーがあります。</Banner> : null}
      <div className="stack" style={{ maxWidth: 900 }}>
        <Section title="元になる事業ケース" sub="プロジェクトは開始承認済みの事業ケースに結び付けます。期待便益と KPI はリリース後の確認に引き継ぎます" actions={<Button size="sm" variant="ghost" icon="briefcase" to={paths.intake(org)}>案件受付を開く</Button>}>
          {noCase ? (
            <Banner tone="warn" title="開始が承認された事業ケースがありません" action={<Button size="sm" variant="primary" to={paths.intakeNew(org)}>事業ケースを登録</Button>}>
              案件受付で事業ケースを登録し、開始の承認を得てからプロジェクトを作成します。
            </Banner>
          ) : (
            <div className="stack" style={{ ["--gap" as string]: "8px" }}>
              {CASES.map((c) => (
                <OptionCard
                  key={c.id}
                  name="case"
                  value={c.id}
                  checked={caseId === c.id}
                  disabled={Boolean(c.project)}
                  onChange={setCaseId}
                  title={<span className="row" style={{ ["--gap" as string]: "6px" }}><span className="mono small">{c.id}</span>{c.title}</span>}
                  description={c.project ? "このケースのプロジェクトは作成済みです" : `${c.customer} · スポンサー ${userById(c.sponsor_id)?.name} · 承認額 ${yenM(c.cost)} · ${c.decided}`}
                  badge={c.project ? <Tag square>作成済み</Tag> : <Tag tone="pass" square>開始承認</Tag>}
                />
              ))}
            </div>
          )}
        </Section>

        <Section title="基本情報">
          <div className="grid cols-2">
            <TextField label="プロジェクト名" required value={name} onChange={setName} maxLength={80} error={err && !name ? "プロジェクト名を入力してください" : undefined} />
            <TextField label="プロジェクトID" value={name ? "logistics-req" : ""} readOnly help="プロジェクト名から自動で作成します" />
            <TextField label="顧客" value={picked?.customer ?? ""} readOnly help="事業ケースから引き継ぎます" />
            <TextField label="案件スポンサー" value={userById(picked?.sponsor_id)?.name ?? ""} readOnly help="事業ケースから引き継ぎます" />
            <Select label="データ分類" value={cls} onChange={(v) => setCls(v as DataClass)} options={(Object.keys(DATA_CLASS) as DataClass[]).map((k) => ({ value: k, label: `${DATA_CLASS[k].label} — AI の実行先: ${DATA_CLASS[k].runtime}` }))} />
          </div>
        </Section>

        <Section title="進め方と用語" sub="組織の進め方と工程名をそのまま使えます。製品の工程との対応だけを決めます。ガイドの例示を必須にはしません">
          <div className="stack">
            <div className="grid cols-3">
              {([{ v: "agile", t: "アジャイル" }, { v: "iterative", t: "反復・段階型" }, { v: "waterfall", t: "ウォーターフォール" }] as const).map((o) => (
                <OptionCard key={o.v} name="approach" value={o.v} checked={approach === o.v} onChange={(v) => setApproach(v as typeof approach)} title={o.t} />
              ))}
            </div>
            <div className="table-wrap">
              <table className="table compact">
                <thead><tr><th>製品の工程</th><th>この案件での呼び方</th></tr></thead>
                <tbody>
                  {PHASE_TERMS.map((t) => (
                    <tr key={t.product}><td className="small strong">{t.product}</td><td><input className="input" aria-label={`${t.product} の呼び方`} defaultValue={t[approach]} key={`${approach}-${t.product}`} /></td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Section>

        <Section title="計画の正本と連携" sub="計画日・マイルストーン・担当はここで選んだシステムを正本として読み取り同期します">
          <div className="stack">
            <div className="grid cols-2">
              <Select label="計画の正本" value={planning} onChange={(v) => setPlanning(v as ProviderKey)} options={(["githubProjects", "gitlabIssues", "azureBoards", "jira"] as ProviderKey[]).map((k) => ({ value: k, label: PROVIDERS[k].label }))} help={planning === "jira" ? "Jira（MIG）の接続は再認可が必要です。作成後に「連携と同期」で再認可してください" : undefined} />
              <Select label="共有カレンダー" defaultValue="review" options={[{ value: "review", label: "Google Calendar「顧客レビュー」" }, { value: "exec", label: "Google Calendar「経営会議」" }, { value: "none", label: "使わない" }]} />
            </div>
            <Combobox label="対象リポジトリ" required multiple options={repos.map((r) => ({ value: r.full_name, label: r.full_name, hint: r.visibility }))} value={repoSel} onChange={setRepoSel} error={err && repoSel.length === 0 ? "リポジトリを1つ以上選んでください" : undefined} help="要求定義フェーズでリポジトリがない場合は、あとで追加できます" />
            <span className="row small muted" style={{ ["--gap" as string]: "6px" }}>同期の方向: <ProviderBadge provider={planning} size="sm" /> → このサービス（読み取りのみ。書き戻しはしません）</span>
          </div>
        </Section>

        <Section title="統制のセットと版の固定" sub="プロジェクトの開始時に版を固定し、意図せず更新されないようにします。変更するには移行レポートで影響を確認し、ポリシー管理者の承認が必要です">
          <div className="stack">
            <div className="card tight">
              <KeyValueList
                items={[
                  { label: "プロファイル", value: <span className="row"><Tag square>Basic（ソフトウェア開発）</Tag><span className="tiny muted">基準: ISO/IEC 29110-4-1:2018</span></span> },
                  { label: "Control Pack", value: <Select label="" value="1.3.0" onChange={() => undefined} options={[{ value: "1.3.0", label: "Basic Control Pack 1.3.0（最新・承認済み）" }, { value: "1.2.1", label: "Basic Control Pack 1.2.1" }]} /> },
                  { label: "ゲートのルール", value: <span className="mono small">basic-rules 1.3.0（sha256: 7c1e…a09f）</span> },
                  { label: "テンプレート", value: <span className="mono small">templates-ja 2.1.0</span> },
                  { label: "固定の承認", value: <span className="small">ポリシー管理者（山本 結衣）が作成時に確認します</span> },
                ]}
              />
            </div>
            <div className="field">
              <span className="field-label">強制レベル（固定。段階的に強める場合は変更の承認が必要）</span>
              <div className="grid cols-3">
                {(["warnOnly", "soft", "hard"] as EnforcementLevel[]).map((l) => (
                  <OptionCard key={l} name="enf" value={l} checked={enf === l} onChange={(v) => setEnf(v as EnforcementLevel)} title={ENFORCEMENT_LEVEL[l].label} description={ENFORCEMENT_LEVEL[l].description} />
                ))}
              </div>
            </div>
          </div>
        </Section>

        <Section title="実務の担当（外部ID）" sub="担当者はこのサービスにサインインしません。外部IDで活動と承認を記録し、職務分離を確認します">
          <div className="stack">
            {sodWarn ? (
              <Banner tone="warn" title="職務分離の警告">
                同じ人（{userById(actors.qa[0])?.name}）が QA とリリースの承認者を兼ねています。テスト結果を記録した人が、そのままリリースを承認することになります。
              </Banner>
            ) : null}
            <div className="grid cols-2">
              {ACTOR_FIELDS.map((f) => (
                <div key={f.key} className="stack" style={{ ["--gap" as string]: "4px" }}>
                  <Combobox label={f.label} required={f.required} options={actorOptions} value={actors[f.key] ?? []} onChange={(v) => setActors((a) => ({ ...a, [f.key]: v }))} error={err && f.required && !(actors[f.key] ?? []).length ? `${f.label}を選んでください` : undefined} />
                  {actors[f.key]?.[0] ? <ExternalActor userId={actors[f.key][0]} /> : null}
                </div>
              ))}
            </div>
            <span className="tiny muted">候補にいない人は「設定 › 外部アクターの対応付け」で外部IDを登録します。</span>
          </div>
        </Section>
        <div className="row end">
          <Button variant="ghost" to={paths.projects(org)}>キャンセル</Button>
          <Button variant="primary" icon="check" onClick={() => { toast({ kind: "success", message: "プロジェクトを作成しました。版を固定し、初回の同期を開始しました" }); navigate(paths.project(org, "order-renewal")); }} disabled={err || noCase || !picked} disabledReason={noCase || !picked ? "開始承認済みの事業ケースを選んでください" : "エラーを修正してください"}>作成</Button>
        </div>
      </div>
    </AppLayout>
  );
}
