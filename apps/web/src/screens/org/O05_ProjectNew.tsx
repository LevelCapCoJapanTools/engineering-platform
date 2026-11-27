// 画面ID: O-05 プロジェクトの作成
import { useState } from "react";
import { useScreenState, useRoute, navigate } from "../../lib/router";
import { ORG, paths } from "../../lib/paths";
import { DATA_CLASS, ENFORCEMENT_LEVEL } from "../../lib/vocab";
import type { DataClass, EnforcementLevel, Role } from "../../lib/vocab";
import { AppLayout, Banner, Button, Combobox, crumbs, OptionCard, PageHeader, Section, Select, TextField, useToast } from "../../ui";
import { repos, users } from "../../mocks/core";

const ROLE_FIELDS: { role: Role; required?: boolean }[] = [
  { role: "PM", required: true },
  { role: "アナリスト" },
  { role: "設計者" },
  { role: "QA" },
  { role: "リリース管理者", required: true },
];

export function ProjectNew() {
  const state = useScreenState();
  const toast = useToast();
  const org = useRoute().params.org ?? ORG;
  const err = state === "error";
  const sod = state === "sod";
  const [name, setName] = useState(err ? "" : "物流倉庫管理システム");
  const [customer, setCustomer] = useState("テスト物流株式会社");
  const [contact, setContact] = useState("");
  const [repoSel, setRepoSel] = useState<string[]>(err ? [] : ["sample-soft/member-app-api"]);
  const [enf, setEnf] = useState<EnforcementLevel>("warnOnly");
  const [cls, setCls] = useState<DataClass>("internal");
  const [assign, setAssign] = useState<Record<string, string[]>>({
    PM: ["u-sato"],
    アナリスト: ["u-takahashi"],
    設計者: ["u-tanaka"],
    QA: sod ? ["u-watanabe"] : ["u-ito"],
    リリース管理者: sod ? ["u-watanabe"] : err ? [] : ["u-sato"],
  });
  const slug = name ? "logistics-wms" : "";
  const people = users.filter((u) => u.kind === "member" && u.status === "active").map((u) => ({ value: u.id, label: u.name, hint: u.roles.join("・") }));
  const dup = Object.entries(assign).filter(([r]) => r === "QA" || r === "リリース管理者").map(([, v]) => v[0]);
  const sodWarn = dup[0] && dup[0] === dup[1];

  return (
    <AppLayout org={org} active="projects" breadcrumb={crumbs(org, undefined, { label: "プロジェクト", to: paths.projects(org) }, { label: "作成" })}>
      <PageHeader title="プロジェクトを作成" description="顧客、リポジトリ、適用する統制のセット、担当者のロールを設定します。" />
      {err ? <Banner tone="fail" title="入力内容を確認してください">3件のエラーがあります。</Banner> : null}
      <div className="stack" style={{ maxWidth: 860 }}>
        <Section title="基本情報">
          <div className="grid cols-2">
            <TextField label="プロジェクト名" required value={name} onChange={setName} maxLength={80} error={err && !name ? "プロジェクト名を入力してください" : undefined} />
            <TextField label="プロジェクトID" value={slug} readOnly help="プロジェクト名から自動で作成します" />
            <TextField label="顧客の会社名" value={customer} onChange={setCustomer} />
            <TextField label="顧客の担当者（招待・任意）" type="email" placeholder="name@customer.example" value={contact} onChange={setContact} help="顧客ロールで招待します。要求承認と受入を顧客ポータルで行います" />
          </div>
        </Section>
        <Section title="リポジトリと統制">
          <div className="stack">
            <Combobox label="対象リポジトリ" required multiple options={repos.map((r) => ({ value: r.full_name, label: r.full_name, hint: r.visibility }))} value={repoSel} onChange={setRepoSel} error={err && repoSel.length === 0 ? "リポジトリを1つ以上選んでください" : undefined} />
            <Select label="Control Pack のバージョン" defaultValue="1.3.0" options={[{ value: "1.3.0", label: "Basic Control Pack 1.3.0（最新）" }, { value: "1.2.1", label: "Basic Control Pack 1.2.1" }]} help="プロジェクトの途中でバージョンを変える場合は、移行レポートで影響を確認します" />
            <div className="field">
              <span className="field-label">強制レベル</span>
              <div className="grid cols-3">
                {(["warnOnly", "soft", "hard"] as EnforcementLevel[]).map((l) => (
                  <OptionCard key={l} name="enf" value={l} checked={enf === l} onChange={(v) => setEnf(v as EnforcementLevel)} title={ENFORCEMENT_LEVEL[l].label} description={ENFORCEMENT_LEVEL[l].description} />
                ))}
              </div>
            </div>
            <Select label="データ分類" value={cls} onChange={(v) => setCls(v as DataClass)} options={(Object.keys(DATA_CLASS) as DataClass[]).map((k) => ({ value: k, label: `${DATA_CLASS[k].label} — AI の実行先: ${DATA_CLASS[k].runtime}` }))} />
          </div>
        </Section>
        <Section title="ロールの割当" sub="作成者は自分の成果物を承認できません。テストの記録とリリース承認は別の人にすることをおすすめします。">
          <div className="stack">
            {sodWarn ? (
              <Banner tone="warn" title="職務分離の警告">
                同じ人（{users.find((u) => u.id === dup[0])?.name}）が QA とリリース管理者を兼ねています。テスト結果を記録した人が、そのままリリースを承認することになります。
              </Banner>
            ) : null}
            <div className="grid cols-2">
              {ROLE_FIELDS.map((f) => (
                <Combobox key={f.role} label={f.role} required={f.required} options={people} value={assign[f.role] ?? []} onChange={(v) => setAssign((a) => ({ ...a, [f.role]: v }))} error={err && f.required && !(assign[f.role] ?? []).length ? `${f.role}を選んでください` : undefined} />
              ))}
            </div>
          </div>
        </Section>
        <div className="row end">
          <Button variant="ghost" to={paths.projects(org)}>キャンセル</Button>
          <Button variant="primary" icon="check" onClick={() => { toast({ kind: "success", message: "プロジェクトを作成しました" }); navigate(paths.project(org, "order-renewal")); }} disabled={err} disabledReason="エラーを修正してください">作成</Button>
        </div>
      </div>
    </AppLayout>
  );
}
