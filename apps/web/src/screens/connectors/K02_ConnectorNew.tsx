// 画面ID: K-02 連携の追加
import "./connectors.css";
import { useState } from "react";
import { useScreenState, useRoute, navigate } from "../../lib/router";
import { ORG, paths } from "../../lib/paths";
import { CONNECTOR_CATEGORY, PROVIDERS } from "../../lib/vocab";
import type { ConnectorCategory, ProviderKey } from "../../lib/vocab";
import { AppLayout, Banner, Button, Checkbox, crumbs, Icon, KeyValueList, OptionCard, PageHeader, ProviderBadge, Section, Select, Stepper, Tag, TextField, useToast } from "../../ui";

const STEPS = ["種類", "サービス", "接続先", "権限と取得データ", "対象範囲", "正本", "確認"];

/** 状態名 → 開くステップ */
const STATE_STEP: Record<string, number> = { "種類": 0, "サービス": 1, "接続先": 2, "権限と取得データ": 3, "対象範囲": 4, "正本": 5, "確認": 6, "権限不足": 3, "接続失敗": 6 };

const HOSTING: Partial<Record<ProviderKey, string[]>> = {
  github: ["GitHub.com", "GitHub Enterprise Cloud", "GitHub Enterprise Server（自社運用）"],
  gitlab: ["GitLab.com", "GitLab Self-Managed（自社運用）"],
  azureRepos: ["Azure DevOps Services", "Azure DevOps Server（自社運用）"],
  azureBoards: ["Azure DevOps Services", "Azure DevOps Server（自社運用）"],
  codecommit: ["AWS アカウントとリージョンを指定"],
  codebuild: ["AWS アカウントとリージョンを指定"],
  jira: ["Jira Cloud", "Jira Data Center（自社運用）"],
  mattermost: ["自社運用の Mattermost（URL を指定）"],
};

type Perm = { scope: string; why: string; write?: boolean };
const PERMS: Partial<Record<ProviderKey, Perm[]>> = {
  github: [
    { scope: "Contents: 読み取り", why: "コミットとタグを取得し、要求・テストとの対応を確認する" },
    { scope: "Pull requests: 読み取り", why: "PR、レビュー、承認の状態を取得する" },
    { scope: "Checks: 読み書き", why: "ゲートの判定結果を Check Run として書き込む", write: true },
    { scope: "Administration: 読み取り", why: "ブランチ保護と必須チェックの設定漏れを検知する" },
  ],
  googleCalendar: [{ scope: "calendar.events.readonly", why: "許可した共有カレンダーの予定を読み取る。書き込みはしない" }],
  m365Calendar: [{ scope: "Calendars.Read.Shared", why: "許可した共有・グループカレンダーの予定を読み取る" }],
  githubProjects: [{ scope: "Projects: 読み取り", why: "計画の日付・状態・担当を読み取る" }, { scope: "Issues: 読み取り", why: "Project の Item（Issue／PR）を案件に対応付ける" }],
  codecommit: [{ scope: "IAM ロール（codecommit:Get*, List*）", why: "リポジトリ、コミット、プルリクエスト、承認ルールの状態を読み取る。長期のアクセスキーは保管しない" }],
  slack: [{ scope: "chat:write", why: "通知を投稿する", write: true }, { scope: "commands", why: "受領・承認等の操作を受け付ける" }, { scope: "users:read", why: "ボタンを押した人の本人確認" }],
};
const DEFAULT_PERMS: Perm[] = [{ scope: "読み取り", why: "経営向けの表示に必要な項目を取得する" }];

export function K02ConnectorNew() {
  const state = useScreenState();
  const org = useRoute().params.org ?? ORG;
  const toast = useToast();
  const [step, setStep] = useState(STATE_STEP[state] ?? 0);
  const [category, setCategory] = useState<ConnectorCategory>("calendar");
  const [provider, setProvider] = useState<ProviderKey>("googleCalendar");
  const [hosting, setHosting] = useState("");
  const [cals, setCals] = useState<Record<string, boolean>>({ 経営会議: true, 顧客レビュー: true, "木村 達也（個人）": false });
  const [fields, setFields] = useState<Record<string, boolean>>({ 件名: true, "開始・終了": true, 主催者: true, 会議URL: true, 本文: false, 参加者一覧: false });
  const [excludePrivate, setExcludePrivate] = useState(true);
  const [primary, setPrimary] = useState("yes");
  const lacking = state === "権限不足";
  const failed = state === "接続失敗";

  const providersIn = (Object.keys(PROVIDERS) as ProviderKey[]).filter((k) => PROVIDERS[k].category === category);
  const perms = PERMS[provider] ?? DEFAULT_PERMS;
  const isCalendar = category === "calendar";
  const next = () => setStep((s) => Math.min(STEPS.length - 1, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  return (
    <AppLayout org={org} active="connectors" breadcrumb={crumbs(org, undefined, { label: "連携と同期", to: paths.connectors(org) }, { label: "連携の追加" })}>
      <PageHeader title="連携の追加" description="接続する前に、取得するデータと書き込みの用途を確認します。接続の情報は監査ログに残ります。" />
      <div className="card"><Stepper steps={STEPS} current={step} errorAt={failed ? 6 : lacking ? 3 : undefined} /></div>

      <div className="stack" style={{ marginTop: 16 }}>
        {step === 0 ? (
          <Section title="何を接続しますか" sub="経営ダッシュボードの計画・予測は、課題・計画管理と共有カレンダーから同期します">
            <div className="grid auto-fit">
              {(Object.keys(CONNECTOR_CATEGORY) as ConnectorCategory[]).map((c) => (
                <OptionCard key={c} name="category" value={c} checked={category === c} onChange={() => { setCategory(c); setProvider((Object.keys(PROVIDERS) as ProviderKey[]).find((k) => PROVIDERS[k].category === c)!); }} title={CONNECTOR_CATEGORY[c].label} description={CONNECTOR_CATEGORY[c].description} badge={c === "planning" || c === "calendar" ? <Tag tone="primary" square>優先</Tag> : undefined} />
              ))}
            </div>
          </Section>
        ) : null}

        {step === 1 ? (
          <Section title={`${CONNECTOR_CATEGORY[category].label}のサービス`} sub="ベータ・予定のサービスは能力に制限があります。非推奨のサービスは新規接続をおすすめしません">
            <div className="grid auto-fit">
              {providersIn.map((k) => {
                const p = PROVIDERS[k];
                return (
                  <OptionCard
                    key={k}
                    name="provider"
                    value={k}
                    checked={provider === k}
                    disabled={p.status === "planned"}
                    onChange={() => setProvider(k)}
                    title={<ProviderBadge provider={k} showStatus />}
                    description={p.note ?? (p.status === "planned" ? "提供予定" : undefined)}
                  />
                );
              })}
            </div>
            {PROVIDERS[provider].status === "deprecated" ? (
              <Banner tone="warn" title="このサービスは提供元がサポート終了を告知しています">新規の長期利用はおすすめしません。移行先として Jira Service Management Operations 等を検討してください。</Banner>
            ) : null}
            {provider === "codecommit" ? (
              <Banner tone="info" title="計画管理を別に接続してください">AWS CodeCommit には課題・計画管理の機能がありません。案件の計画情報は GitHub Projects、Jira、Azure Boards 等の計画システムを別途接続して取得します。</Banner>
            ) : null}
          </Section>
        ) : null}

        {step === 2 ? (
          <Section title="接続先" sub="サービスの提供形態ごとに、使える機能と API が異なります">
            <div className="stack" style={{ maxWidth: 560 }}>
              <ProviderBadge provider={provider} showStatus />
              {HOSTING[provider] ? (
                <Select label="提供形態" value={hosting || HOSTING[provider]![0]} onChange={setHosting} options={HOSTING[provider]!.map((h) => ({ value: h, label: h }))} />
              ) : (
                <p className="small muted">クラウド版のみに対応しています。</p>
              )}
              {(hosting || HOSTING[provider]?.[0] || "").includes("自社運用") ? <TextField label="サーバーの URL" placeholder="https://git.example.co.jp" help="TLS 証明書を検証します。社内ネットワークからのみ到達できる場合は、接続方法をサポートにご相談ください" /> : null}
              {provider === "codecommit" || provider === "codebuild" ? (
                <>
                  <TextField label="AWS アカウント ID" placeholder="123456789012" />
                  <Select label="リージョン" value="ap-northeast-1" options={[{ value: "ap-northeast-1", label: "アジアパシフィック（東京）ap-northeast-1" }, { value: "ap-northeast-3", label: "アジアパシフィック（大阪）ap-northeast-3" }]} />
                  <TextField label="引き受けるロールの ARN" placeholder="arn:aws:iam::123456789012:role/..." help="外部 ID を付けたロールを引き受けます。長期のアクセスキーは保管しません" />
                </>
              ) : null}
            </div>
          </Section>
        ) : null}

        {step === 3 ? (
          <Section title="必要な権限と取得するデータ" sub="必要最小限の権限だけを求めます。書き込みの用途も明示します">
            {lacking ? (
              <Banner tone="fail" title="必要な権限が承認されていません">
                「Checks: 読み書き」が承認されていないため、ゲートの判定を書き込めません。読み取りだけで接続することもできますが、その場合はゲートを必須チェックにできません。
              </Banner>
            ) : null}
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>権限</th><th>用途</th><th>種類</th></tr></thead>
                <tbody>
                  {perms.map((p) => (
                    <tr key={p.scope}>
                      <td className="mono small">{p.scope}</td>
                      <td className="small">{p.why}</td>
                      <td>{p.write ? <Tag tone="warn" square icon="edit">書込み</Tag> : <Tag square icon="eye">読み取り</Tag>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Banner tone="info" title="資格情報の扱い">
              トークン・鍵・Webhook の URL は暗号化して保管し、組織とリポジトリの単位で分離します。画面とログには表示しません。ローテーションと失効は接続の詳細から行えます。
            </Banner>
          </Section>
        ) : null}

        {step === 4 ? (
          <Section title="対象範囲" sub={isCalendar ? "共有カレンダーだけを対象にします。個人の予定表は既定で対象外です" : "同期する組織・リポジトリ・プロジェクトを選びます"}>
            {isCalendar ? (
              <div className="grid side-420">
                <div className="stack">
                  <strong className="small">カレンダー</strong>
                  {Object.keys(cals).map((c) => (
                    <Checkbox key={c} label={c} checked={cals[c]} onChange={(v) => setCals((x) => ({ ...x, [c]: v }))} description={c.includes("個人") ? "個人の予定表です。経営ダッシュボードには不要のため、既定で対象外にしています" : "共有カレンダー"} />
                  ))}
                  <Checkbox label="非公開（private）の予定を取り込まない" checked={excludePrivate} onChange={setExcludePrivate} description="共有カレンダー内の非公開予定も除外します" />
                </div>
                <div className="stack">
                  <strong className="small">取得する項目（最小化）</strong>
                  {Object.keys(fields).map((f) => (
                    <Checkbox key={f} label={f} checked={fields[f]} onChange={(v) => setFields((x) => ({ ...x, [f]: v }))} description={f === "本文" || f === "参加者一覧" ? "経営ダッシュボードには使いません。必要な場合だけ有効にしてください" : undefined} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="stack">
                {["sample-soft/order-api", "sample-soft/order-web", "sample-soft/member-app-api", "sample-soft/tech-blog"].map((r, i) => (
                  <Checkbox key={r} label={<span className="mono">{r}</span>} defaultChecked={i < 3} description={i === 3 ? "案件に属さないリポジトリです" : undefined} />
                ))}
              </div>
            )}
            {isCalendar && (cals["木村 達也（個人）"] || !excludePrivate) ? <Banner tone="warn">個人の予定または非公開予定が対象に含まれています。経営ダッシュボードに不要な個人情報を取り込まないよう、対象を見直してください。</Banner> : null}
          </Section>
        ) : null}

        {step === 5 ? (
          <Section title="正本の設定" sub="同じ項目を複数のシステムが持つ場合、どれを正とするかを決めます。詳細は「正本と同期ルール」で変更できます">
            <div className="stack" style={{ maxWidth: 640 }}>
              <OptionCard name="primary" value="yes" checked={primary === "yes"} onChange={setPrimary} title={`${PROVIDERS[provider].label} を正本にする`} description={isCalendar ? "経営会議・顧客会議の日程の正本にします" : "対象案件のこの種類の項目の正本にします"} />
              <OptionCard name="primary" value="no" checked={primary === "no"} onChange={setPrimary} title="参照のみ（正本にしない）" description="値は表示しますが、他の正本と食い違う場合は正本の値を優先します" />
              <Banner tone="info" title="同期の方向">初期は読取一方向です。本サービスから {PROVIDERS[provider].label} へ予定や状態を書き戻すことはありません（ゲートの判定結果の書込みを除く）。</Banner>
            </div>
          </Section>
        ) : null}

        {step === 6 ? (
          <Section title="確認">
            {failed ? (
              <Banner tone="fail" title="接続できませんでした" action={<Button size="sm" icon="refresh" onClick={() => toast({ kind: "info", message: "再試行します（モック）" })}>再試行</Button>}>
                認可の途中で接続先から拒否されました（HTTP 403）。接続先の管理者が外部アプリの利用を許可しているか確認してください。問い合わせ用ID: req-c0n-4821
              </Banner>
            ) : null}
            <KeyValueList
              items={[
                { label: "種類", value: CONNECTOR_CATEGORY[category].label },
                { label: "サービス", value: <ProviderBadge provider={provider} showStatus /> },
                { label: "接続先", value: hosting || HOSTING[provider]?.[0] || "クラウド版" },
                { label: "権限", value: perms.map((p) => p.scope).join("、") },
                { label: "対象範囲", value: isCalendar ? Object.keys(cals).filter((c) => cals[c]).join("、") : "3 リポジトリ" },
                { label: "取得する項目", value: isCalendar ? Object.keys(fields).filter((f) => fields[f]).join("、") : "既定" },
                { label: "正本", value: primary === "yes" ? "正本にする" : "参照のみ" },
                { label: "同期の方向", value: "読取一方向" },
                { label: "初回同期", value: "接続後に全件を取得し、以降は差分を取得します" },
              ]}
            />
          </Section>
        ) : null}

        <div className="row between">
          <Button icon="arrowLeft" onClick={back} disabled={step === 0} disabledReason="最初のステップです">戻る</Button>
          {step < STEPS.length - 1 ? (
            <Button variant="primary" iconRight="arrowRight" onClick={next} disabled={lacking && step === 3} disabledReason="必要な権限を承認してから進んでください">次へ</Button>
          ) : (
            <Button variant="primary" icon="plug" onClick={() => { toast({ kind: "success", message: `${PROVIDERS[provider].label} を接続しました。初回同期を始めます` }); navigate(paths.connector(org, "con-gcal") + "?state=initialSync"); }}>
              接続して初回同期を始める
            </Button>
          )}
        </div>
        <p className="tiny muted"><Icon name="lock" size={12} /> 接続・権限の変更・切断は、実行者と日時を監査ログに記録します。</p>
      </div>
    </AppLayout>
  );
}
