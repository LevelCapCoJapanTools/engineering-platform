// 画面ID: P-01 トップ
// 経営層向けの訴求: 複数案件の計画・実績・リスク・判断事項を、既存システムから同期して一画面で示す。
import "./public.css";
import { ActorLabel, Button, Icon, PlanDates, ProviderBadge, PublicLayout, StatusBadge, SourceTag } from "../../ui";
import type { IconName } from "../../ui";
import { paths } from "../../lib/paths";
import { Link } from "../../lib/router";
import { CONNECTOR_CATEGORY, DECISION_STATUS, HEALTH, PROVIDERS } from "../../lib/vocab";
import type { ActorKind, ConnectorCategory, ProviderKey } from "../../lib/vocab";
import { projectBySlug } from "../../mocks/core";
import { decisions, projectHealth } from "../../mocks/portfolio";

const problems: { icon: IconName; title: string; body: string }[] = [
  { icon: "clock", title: "遅れに気づくのが遅い", body: "案件ごとに報告の形式が違い、計画と見込みのずれが会議の場で初めて分かる。" },
  { icon: "scale", title: "判断の根拠が残らない", body: "投資・優先順位・リスク受容を誰がどの根拠で決めたかが、メールと議事録に散らばる。" },
  { icon: "users", title: "現場に報告書を書かせている", body: "経営向けの報告のために、PM や開発者が同じ内容を何度も入力している。" },
  { icon: "archive", title: "品質の説明と監査前の証拠集め", body: "顧客や評価者に、作り方の確かさを根拠付きで説明しづらい。" },
];

const flow: { actor: ActorKind; title: string; body: string }[] = [
  { actor: "system", title: "既存システムから同期", body: "課題・計画管理、共有カレンダー、Git・CI から計画・予測・実績を読み取り、出典と鮮度を付けて集めます。" },
  { actor: "ai", title: "AIが要約する", body: "計画差異やリスクを要約します。元データへのリンクと確信度を付けた参考情報で、判断はしません。" },
  { actor: "ci", title: "ルールとCIが検査する", body: "ID、リンク、テスト結果、署名など、機械的に確かめられる統制項目を検査します。" },
  { actor: "human", title: "責任者が判断する", body: "投資・優先順位・リスク受容は経営層が、要求承認や受入は実際の責任者・顧客が判断し、記録します。" },
];

const features: { icon: IconName; title: string; body: string; anchor: string }[] = [
  { icon: "grid", title: "ポートフォリオ", body: "全案件の健全性、計画と予測、予算、証跡の準備状況を一覧で比較します。", anchor: "portfolio" },
  { icon: "calendar", title: "計画とカレンダーの同期", body: "当初計画・承認済み改訂・予測・実績を分けて保存し、遅延の履歴を消しません。", anchor: "schedule" },
  { icon: "inbox", title: "経営判断の記録", body: "判断の依頼、選択肢、根拠、条件、期限、実施状況を一続きで残します。", anchor: "decisions" },
  { icon: "briefcase", title: "投資と配分", body: "事業ケース、優先順位、役割別の要員と予算、ロードマップ、便益の確認。", anchor: "investment" },
  { icon: "shield", title: "ゲートと例外", body: "構造・トレーサビリティ・承認・証跡の4段の検査と、期限付きの例外。", anchor: "gates" },
  { icon: "package", title: "証跡と監査パック", body: "署名した Evidence Manifest を WORM に保管し、評価者へ期限付きで共有。", anchor: "audit" },
];

const CONNECT: { category: ConnectorCategory; providers: ProviderKey[] }[] = [
  { category: "planning", providers: ["githubProjects", "gitlabIssues", "azureBoards", "jira"] },
  { category: "calendar", providers: ["googleCalendar", "m365Calendar"] },
  { category: "scm", providers: ["github", "gitlab", "codecommit", "azureRepos"] },
  { category: "chat", providers: ["slack", "teams", "googleChat", "mattermost", "chatwork", "discord"] },
  { category: "oncall", providers: ["pagerduty"] },
];

function HeroMock() {
  const pending = decisions.filter((d) => d.status === "pending").slice(0, 2);
  return (
    <div className="mock-frame hero-mock" aria-label="製品画面のイメージ">
      <div className="bar"><i /><i /><i /></div>
      <div className="mock-body">
        <div className="row between">
          <span className="strong">ポートフォリオ</span>
          <span className="tiny muted">4 案件 · 判断待ち {decisions.filter((d) => d.status === "pending").length} 件</span>
        </div>
        <div className="stack" style={{ ["--gap" as string]: "6px" }}>
          {projectHealth.slice(0, 3).map((h) => (
            <div key={h.slug} className="row between" style={{ padding: "8px 10px", border: "1px solid var(--border)", borderRadius: 8 }}>
              <span className="stack" style={{ ["--gap" as string]: "2px" }}>
                <span className="small strong">{projectBySlug(h.slug).name}</span>
                <SourceTag source={h.source} prefix="" compact />
              </span>
              <span className="row" style={{ ["--gap" as string]: "8px" }}>
                <PlanDates baseline={h.baseline_end} forecast={h.forecast_end} compact />
                <StatusBadge vocab={HEALTH[h.health]} size="sm" />
              </span>
            </div>
          ))}
        </div>
        <div className="stack" style={{ ["--gap" as string]: "6px" }}>
          <span className="tiny muted">判断待ち</span>
          {pending.map((d) => (
            <div key={d.id} className="row between small" style={{ ["--gap" as string]: "8px" }}>
              <span className="truncate">{d.title}</span>
              <StatusBadge vocab={DECISION_STATUS[d.status]} size="sm" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function P01Top() {
  return (
    <PublicLayout>
      <section className="hero">
        <div className="container hero-grid">
          <div className="stack" style={{ ["--gap" as string]: "20px" }}>
            <span className="eyebrow">FOR EXECUTIVES OF SMALL DEVELOPMENT COMPANIES</span>
            <h1 className="display">全案件の計画と実績、<br />判断事項をひとつの画面に。</h1>
            <p className="lead">課題・計画管理、共有カレンダー、GitHub などから自動で同期し、遅延・重大リスク・判断待ち・証跡の準備状況を経営層に示します。現場に報告書の入力を増やさず、判断の根拠を記録に残します。ISO/IEC 29110 の適合準備も、同じ記録から進められます。</p>
            <div className="row" style={{ ["--gap" as string]: "10px" }}>
              <Button variant="primary" size="lg" iconRight="arrowRight" to={paths.contact()}>PoCを相談</Button>
              <Button variant="secondary" size="lg" to={paths.features()}>機能を見る</Button>
            </div>
            <div className="row small muted" style={{ ["--gap" as string]: "16px" }}>
              <span className="row" style={{ ["--gap" as string]: "6px" }}><Icon name="plug" size={14} />既存のツールを読み取るだけ</span>
              <span className="row" style={{ ["--gap" as string]: "6px" }}><Icon name="users" size={14} />開発者のアカウントは不要</span>
              <span className="row" style={{ ["--gap" as string]: "6px" }}><Icon name="shieldCheck" size={14} />判断は AI ではなく人</span>
            </div>
          </div>
          <HeroMock />
        </div>
      </section>

      <section className="section alt">
        <div className="container stack" style={{ ["--gap" as string]: "28px" }}>
          <div className="stack" style={{ ["--gap" as string]: "8px" }}>
            <span className="eyebrow">PROBLEMS</span>
            <h2 className="headline">複数案件の状況把握と判断は、手作業に頼りがち</h2>
          </div>
          <div className="grid cols-4">
            {problems.map((p) => (
              <div key={p.title} className="card stack" style={{ ["--gap" as string]: "12px" }}>
                <span className="feature-icon"><Icon name={p.icon} /></span>
                <strong className="strong">{p.title}</strong>
                <p className="small muted">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container stack" style={{ ["--gap" as string]: "28px" }}>
          <div className="stack" style={{ ["--gap" as string]: "8px" }}>
            <span className="eyebrow">HOW IT WORKS</span>
            <h2 className="headline">同期し、要約し、検査し、責任者が判断する</h2>
            <p className="lead">誰が判断したか、どのデータがいつ同期されたかを、すべての画面で見分けられるようにしています。</p>
          </div>
          <div className="flow">
            {flow.map((f, i) => (
              <div key={f.title} className="flow-step">
                <span className="flow-num">STEP {i + 1}</span>
                <ActorLabel kind={f.actor} />
                <strong className="strong" style={{ fontSize: "var(--text-md)" }}>{f.title}</strong>
                <p className="small muted">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section alt">
        <div className="container stack" style={{ ["--gap" as string]: "28px" }}>
          <div className="row between">
            <div className="stack" style={{ ["--gap" as string]: "8px" }}>
              <span className="eyebrow">FEATURES</span>
              <h2 className="headline">主な機能</h2>
            </div>
            <Button variant="ghost" iconRight="arrowRight" to={paths.features()}>すべての機能</Button>
          </div>
          <div className="grid cols-3">
            {features.map((f) => (
              <Link key={f.title} to={`${paths.features()}?section=${f.anchor}`} className="card interactive stack" style={{ ["--gap" as string]: "12px", textDecoration: "none", color: "inherit" }}>
                <span className="feature-icon"><Icon name={f.icon} /></span>
                <strong className="strong">{f.title}</strong>
                <p className="small muted">{f.body}</p>
                <span className="small" style={{ color: "var(--primary)" }}>詳しく見る →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container stack" style={{ ["--gap" as string]: "28px" }}>
          <div className="stack" style={{ ["--gap" as string]: "8px" }}>
            <span className="eyebrow">ONBOARDING</span>
            <h2 className="headline">15 分で始めて、段階的に強める</h2>
          </div>
          <div className="steps-row">
            {[
              { t: "計画とカレンダーを接続", b: "読み取り専用。予定は書き換えません。" },
              { t: "コードホスティングを接続", b: "GitHub・GitLab・CodeCommit・Azure Repos。" },
              { t: "警告モードで開始", b: "ゲートは警告だけ。開発は止まりません。" },
              { t: "段階的に強制", b: "慣れたらソフト、ハードへ切り替えます。" },
            ].map((s, i) => (
              <div key={s.t} className={i === 2 ? "active" : undefined}>
                <div className="tiny muted mono">0{i + 1}</div>
                <strong className="strong">{s.t}</strong>
                <p className="small muted" style={{ marginTop: 6 }}>{s.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section alt">
        <div className="container stack" style={{ ["--gap" as string]: "24px" }}>
          <div className="stack" style={{ ["--gap" as string]: "8px" }}>
            <span className="eyebrow">INTEGRATIONS</span>
            <h2 className="headline">いま使っているツールにつながる</h2>
            <p className="lead">各ツールが正本のまま。このサービスは読み取って集め、出典と同期時刻を必ず表示します。</p>
          </div>
          <div className="grid auto-fit">
            {CONNECT.map((c) => (
              <div key={c.category} className="card stack" style={{ ["--gap" as string]: "10px" }}>
                <strong className="strong">{CONNECTOR_CATEGORY[c.category].label}</strong>
                <div className="stack" style={{ ["--gap" as string]: "6px" }}>{c.providers.map((p) => <span key={p} title={PROVIDERS[p].note}><ProviderBadge provider={p} showStatus /></span>)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container stack" style={{ ["--gap" as string]: "24px" }}>
          <div className="stack" style={{ ["--gap" as string]: "8px" }}>
            <span className="eyebrow">TRUST</span>
            <h2 className="headline">データと判断の扱い</h2>
          </div>
          <div className="trust">
            {[
              { icon: "lock" as IconName, t: "AIはデータを学習に使わない", b: "学習利用なしの契約があるモデルだけを使います。" },
              { icon: "eyeOff" as IconName, t: "AI機能は無効にできる", b: "組織・機能・データ分類ごとにオフにできます。" },
              { icon: "scale" as IconName, t: "判定はルールと人が行う", b: "AIの出力は参考所見で、ゲートの判定には使いません。" },
            ].map((x) => (
              <div key={x.t} className="card stack" style={{ ["--gap" as string]: "10px" }}>
                <span className="feature-icon"><Icon name={x.icon} /></span>
                <strong className="strong">{x.t}</strong>
                <p className="small muted">{x.b}</p>
              </div>
            ))}
          </div>
          <span className="row" style={{ ["--gap" as string]: "16px" }}><Link to={paths.security()}>セキュリティとデータの扱いを見る →</Link><Link to={paths.status()}>稼働状況 →</Link></span>
          <div className="card row between" style={{ ["--gap" as string]: "16px" }}>
            <div className="stack" style={{ ["--gap" as string]: "4px" }}>
              <strong className="strong">規格との関係</strong>
              <p className="small muted">本サービスは ISO/IEC 29110 の適合準備を支援します。認証は第三者の認証機関が行い、本サービスは認証を行いません。</p>
            </div>
            <Button variant="secondary" to={paths.standards()}>詳しく見る</Button>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="cta-band">
            <div className="stack" style={{ ["--gap" as string]: "6px" }}>
              <h2 className="headline" style={{ color: "inherit" }}>まずは今の案件をつないでみませんか</h2>
              <p style={{ opacity: 0.85 }}>計画とカレンダーの接続から、経営ダッシュボードの確認まで一緒に進めます。</p>
            </div>
            <Button variant="secondary" size="lg" iconRight="arrowRight" to={paths.contact()}>PoCを相談</Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
