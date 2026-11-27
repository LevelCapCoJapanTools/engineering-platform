// 画面ID: P-01 トップ
import "./public.css";
import { ActorLabel, Button, GateResultPanel, GateSummaryStrip, Icon, PublicLayout, StatusBadge, TraceGraph, TraceLegend } from "../../ui";
import type { IconName, TraceEdge, TraceNode } from "../../ui";
import { paths } from "../../lib/paths";
import { Link } from "../../lib/router";
import { GATE_STATUS } from "../../lib/vocab";
import type { ActorKind } from "../../lib/vocab";
import { gateRuns } from "../../mocks/core";

const problems: { icon: IconName; title: string; body: string }[] = [
  { icon: "fileText", title: "文書作成が重い", body: "計画・要求・テスト記録を別々の Word で書き、最新版がどれか分からなくなる。" },
  { icon: "trace", title: "要求とテストがつながらない", body: "承認した要求が実装・テストまで届いたかを、誰も一目で確かめられない。" },
  { icon: "archive", title: "監査前の証拠集め", body: "評価の直前に CI のスクリーンショットや議事録をかき集めている。" },
  { icon: "message", title: "品質の説明が難しい", body: "顧客に「ちゃんと作っている」ことを、根拠を添えて説明しづらい。" },
];

const flow: { actor: ActorKind; title: string; body: string }[] = [
  { actor: "ai", title: "AIが下書きする", body: "SOW から要求候補を抽出し、曖昧さや矛盾を指摘します。下書きと参考所見だけを出します。" },
  { actor: "ci", title: "CIが検査する", body: "ID、リンク、テスト結果、署名など、機械的に確かめられる統制項目を PR ごとに検査します。" },
  { actor: "human", title: "人が承認する", body: "要求の妥当性、設計、例外、リリース、受入は人が判断し、誰がいつ承認したかを残します。" },
  { actor: "system", title: "証跡が残る", body: "判定・承認・ハッシュを Evidence Manifest にまとめて署名し、改ざん耐性のある保管先に残します。" },
];

const features: { icon: IconName; title: string; body: string; anchor: string }[] = [
  { icon: "list", title: "要求管理", body: "REQ-ID、受入基準、承認状態を一元管理。AI が曖昧な表現を指摘します。", anchor: "requirements" },
  { icon: "trace", title: "トレーサビリティ", body: "要求→設計→コード→テストのつながりと欠落をグラフで確認。", anchor: "trace" },
  { icon: "shield", title: "CIゲート", body: "構造・トレーサビリティ・人間の承認・証跡の4段で PR を検査。", anchor: "gates" },
  { icon: "flag", title: "例外管理", body: "理由・リスク・期限・承認者を持つ例外だけが通過を許します。", anchor: "exceptions" },
  { icon: "signature", title: "証跡と署名", body: "判定の入力とルールのハッシュを署名し、WORM に保管。", anchor: "evidence" },
  { icon: "package", title: "監査パック", body: "統制項目から証跡を逆引きし、評価者へ期限付きで共有。", anchor: "audit" },
];

const nodes: TraceNode[] = [
  { id: "REQ-0001", col: 0, title: "発注書を作成できる" },
  { id: "REQ-0006", col: 0, title: "操作ログを7年保存" },
  { id: "ADR-0002", col: 1, title: "発注番号の採番" },
  { id: "ADR-0004", col: 1, title: "追記専用ストレージ" },
  { id: "PR #124", col: 2, title: "発注書の保存" },
  { id: "PR #142", col: 2, title: "ログの書き込み" },
  { id: "TC-0101", col: 3, title: "発注書を保存できる" },
  { id: "missing-1", col: 3, title: "テストが必要", missing: true },
];
const edges: TraceEdge[] = [
  { from: "REQ-0001", to: "ADR-0002" },
  { from: "ADR-0002", to: "PR #124" },
  { from: "PR #124", to: "TC-0101" },
  { from: "REQ-0006", to: "ADR-0004" },
  { from: "ADR-0004", to: "PR #142", ai: true },
  { from: "PR #142", to: "missing-1" },
];

function HeroMock() {
  const run = gateRuns[0];
  return (
    <div className="mock-frame hero-mock" aria-label="製品画面のイメージ">
      <div className="bar"><i /><i /><i /></div>
      <div className="mock-body">
        <div className="row between">
          <span className="row" style={{ ["--gap" as string]: "8px" }}>
            <Icon name="pullRequest" size={14} className="muted" />
            <span className="strong">#{run.pr_number} {run.pr_title}</span>
          </span>
          <span className="row" style={{ ["--gap" as string]: "8px" }}>
            <GateSummaryStrip gates={run.gates} />
            <StatusBadge vocab={GATE_STATUS.block} size="sm" />
          </span>
        </div>
        <GateResultPanel letter="B" status="block" reasons={run.reasons.filter((r) => r.gate === "B").slice(0, 1)} enforcement="soft" policyVersion={run.policy_version} />
        <div style={{ pointerEvents: "none" }}>
          <TraceGraph nodes={nodes} edges={edges} selected="REQ-0006" height={200} />
        </div>
        <TraceLegend />
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
            <span className="eyebrow">CONTINUOUS ASSURANCE FOR SMALL TEAMS</span>
            <h1 className="display">いつもの PR に、<br />品質ゲートと証跡を。</h1>
            <p className="lead">GitHub に入れるだけで、要求からテスト、承認、リリースまでのつながりを PR ごとに検査し、改ざん耐性のある証跡として残します。ISO/IEC 29110 の適合準備を、開発の流れを止めずに進められます。</p>
            <div className="row" style={{ ["--gap" as string]: "10px" }}>
              <Button variant="primary" size="lg" iconRight="arrowRight" to={paths.contact()}>PoCを相談</Button>
              <Button variant="secondary" size="lg" to={paths.features()}>機能を見る</Button>
            </div>
            <div className="row small muted" style={{ ["--gap" as string]: "16px" }}>
              <span className="row" style={{ ["--gap" as string]: "6px" }}><Icon name="github" size={14} />GitHub App で導入</span>
              <span className="row" style={{ ["--gap" as string]: "6px" }}><Icon name="shieldCheck" size={14} />判定は AI ではなくルールと人</span>
            </div>
          </div>
          <HeroMock />
        </div>
      </section>

      <section className="section alt">
        <div className="container stack" style={{ ["--gap" as string]: "28px" }}>
          <div className="stack" style={{ ["--gap" as string]: "8px" }}>
            <span className="eyebrow">PROBLEMS</span>
            <h2 className="headline">小さなチームの品質保証は、手作業に頼りがち</h2>
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
            <h2 className="headline">AIが下書きし、CIが検査し、人が承認し、証跡が残る</h2>
            <p className="lead">誰が判断したかを、すべての画面で見分けられるようにしています。</p>
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
            <h2 className="headline">開発を止めずに、段階的に導入</h2>
          </div>
          <div className="steps-row">
            {[
              { t: "GitHub App をインストール", b: "必要な権限だけを要求します。" },
              { t: "リポジトリを選択", b: "まずは1つの案件から。" },
              { t: "警告モードで開始", b: "PR に警告を表示するだけで、ブロックしません。" },
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
          <Link to={paths.security()}>セキュリティとデータの扱いを見る →</Link>
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
              <h2 className="headline" style={{ color: "inherit" }}>まずは1案件から試しませんか</h2>
              <p style={{ opacity: 0.85 }}>プロセスの整理から PoC の設計まで、一緒に進めます。</p>
            </div>
            <Button variant="secondary" size="lg" iconRight="arrowRight" to={paths.contact()}>PoCを相談</Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
