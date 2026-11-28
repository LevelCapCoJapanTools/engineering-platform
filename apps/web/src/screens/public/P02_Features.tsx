// 画面ID: P-02 機能紹介
import "./public.css";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { AIFindingCard, ApprovalPanel, Button, ChecklistPanel, EvidenceItem, ExceptionSummary, GateSummaryStrip, Icon, PlanDates, ProviderBadge, PublicLayout, ResponsibilitySplit, RoadmapTimeline, ShareLinkPanel, SourceTag, StatusBadge, TraceGraph } from "../../ui";
import type { IconName } from "../../ui";
import { paths } from "../../lib/paths";
import { useRoute } from "../../lib/router";
import { ARTIFACT_STATUS, DECISION_STATUS, HEALTH } from "../../lib/vocab";
import { aiFindings, evidence, exceptions, gateRuns, projectBySlug } from "../../mocks/core";
import { decisions, milestones, projectHealth } from "../../mocks/portfolio";

type Feature = { key: string; icon: IconName; title: string; body: string; points: string[]; visual: ReactNode };

const features: Feature[] = [
  {
    key: "portfolio", icon: "grid", title: "ポートフォリオ", body: "全案件の健全性、計画と予測のずれ、予算と予測コスト、重大リスク、証跡の準備状況を一覧で比較できます。値には必ず出典と同期時刻を付け、古い情報は「古い情報」と表示します。",
    points: ["案件ごとの健全性と計画差異", "予算・予測コスト・証跡の準備度", "出典（正本）と同期の鮮度", "根拠への掘り下げ"],
    visual: (
      <div className="card stack" style={{ ["--gap" as string]: "8px" }}>
        {projectHealth.map((h) => (
          <div key={h.slug} className="row between small" style={{ ["--gap" as string]: "8px" }}>
            <span className="stack" style={{ ["--gap" as string]: "2px" }}><span className="strong truncate" style={{ maxWidth: 200 }}>{projectBySlug(h.slug).name}</span><SourceTag source={h.source} prefix="" compact /></span>
            <span className="row" style={{ ["--gap" as string]: "6px" }}><PlanDates baseline={h.baseline_end} forecast={h.forecast_end} compact /><StatusBadge vocab={HEALTH[h.health]} size="sm" /></span>
          </div>
        ))}
      </div>
    ),
  },
  {
    key: "schedule", icon: "calendar", title: "計画とカレンダーの同期", body: "GitHub Projects、GitLab、Azure Boards、Jira の計画と、Google・Microsoft 365 の共有カレンダーを読み取り同期します。当初計画・承認済み改訂・予測・実績を分けて保存し、上書きで遅延の履歴を消しません。",
    points: ["初回の全件取込みと差分同期", "当初・改訂・予測・実績の区別", "会議と判断期限の重ね合わせ", "個人の非公開予定は取り込まない", "読み取り専用（書き戻しはしない）"],
    visual: (
      <RoadmapTimeline
        from="2026-11-01"
        to="2027-03-31"
        rows={milestones.filter((m) => m.project === "order-renewal" && !m.actual).map((m) => ({ id: m.id, label: m.title, baseline: { start: "2026-11-01", end: m.baseline }, current: { start: "2026-11-01", end: m.forecast ?? m.baseline, confidence: m.confidence, tone: m.forecast && m.forecast > m.baseline ? "warn" : "info" } }))}
      />
    ),
  },
  {
    key: "decisions", icon: "inbox", title: "経営判断の記録", body: "投資、優先順位、要員・予算、リスク受容、リリース可否などの判断を、選択肢・根拠・条件・期限と一緒に記録し、判断後の実施状況まで追跡します。実務上の承認者が別の場合は、正しい承認者へ回付します。",
    points: ["期限と影響額の順に並ぶ受信箱", "依頼者と判断者の分離", "条件付き承認と実施状況の追跡", "判断ログの検索と出力"],
    visual: (
      <div className="card stack" style={{ ["--gap" as string]: "10px" }}>
        {decisions.slice(0, 3).map((d) => (
          <div key={d.id} className="row between small" style={{ ["--gap" as string]: "8px" }}><span className="truncate" style={{ maxWidth: 300 }}>{d.title}</span><StatusBadge vocab={DECISION_STATUS[d.status]} size="sm" /></div>
        ))}
        <ResponsibilitySplit decide="経営層（投資・優先順位・リスク受容）" act="PM・現場（案の作成と実施）" />
      </div>
    ),
  },
  {
    key: "investment", icon: "briefcase", title: "投資と配分", body: "案件受付で事業ケース（選択肢、費用、便益、リスク、KPI）を比べて開始・保留・却下を判断し、優先順位、役割別の要員と予算、ロードマップ、リリース後の便益まで追跡します。個人の稼働監視はしません。",
    points: ["事業ケースと「実施しない」案の比較", "優先順位のシナリオ比較", "役割別・期間別の要員と予算", "確約・目標・予測を分けたロードマップ", "KPI の期待値と実績"],
    visual: <div className="card stack" style={{ ["--gap" as string]: "8px" }}><span className="small strong">BC-0007 在庫予測機能の追加</span><span className="small muted">選択肢 3 件 · 推奨: 既製の予測エンジン · 審議日 12/15</span></div>,
  },
  {
    key: "connect", icon: "plug", title: "連携・通知・オンコール", body: "GitHub、GitLab、AWS CodeCommit、Azure Repos と CI を接続し、プロバイダーごとの能力の違いを隠さず表示します。通知は Slack、Teams、Google Chat、Mattermost、Chatwork、Discord へ。オンコールは PagerDuty を正本にし、受領と解決を分けて記録します。",
    points: ["Webhook の署名検証と重複排除", "同期の健全性と再認可", "通知のルール・配信ログ・再送", "当番の参照とエスカレーション"],
    visual: <div className="card row" style={{ ["--gap" as string]: "10px", flexWrap: "wrap" }}>{(["github", "gitlab", "codecommit", "azureRepos", "slack", "teams", "pagerduty"] as const).map((p) => <ProviderBadge key={p} provider={p} />)}</div>,
  },
  {
    key: "requirements", icon: "list", title: "要求管理と AI レビュー", body: "要求に一意の ID と受入基準を持たせ、状態と承認を一元管理します。AI は曖昧さ・矛盾・テスト可能性を指摘しますが、採用するかどうかは人が決めます。",
    points: ["REQ-ID・受入基準・状態の管理", "SOW の版から要求候補を抽出", "AI 所見は採用・却下（理由必須）で判断", "顧客の承認をポータルで受け付け"],
    visual: <AIFindingCard finding={aiFindings[0]} compact />,
  },
  {
    key: "trace", icon: "trace", title: "トレーサビリティ", body: "要求→設計→コード→テストのつながりをグラフと表で確認できます。欠落したリンクは赤く強調し、AI の候補リンクは確定するまで数えません。",
    points: ["グラフと要求×成果物の表", "欠落リンクの強調", "AI 候補リンクの確定・却下", "カバレッジの計測"],
    visual: (
      <div style={{ pointerEvents: "none" }}>
        <TraceGraph height={190} nodes={[{ id: "REQ-0003", col: 0, title: "基幹連携" }, { id: "ADR-0003", col: 1, title: "ファイル連携" }, { id: "PR #140", col: 2, title: "再送処理" }, { id: "x", col: 3, title: "テストが必要", missing: true }]} edges={[{ from: "REQ-0003", to: "ADR-0003" }, { from: "ADR-0003", to: "PR #140" }, { from: "PR #140", to: "x" }]} />
      </div>
    ),
  },
  {
    key: "gates", icon: "shield", title: "CIゲート A〜D", body: "既存の CI を置き換えず、必須ステータスチェックとして差し込みます。判定は決定論的なルールで行い、同じ入力からいつでも再現できます。",
    points: ["A: 構造（メタデータ・ID・スキーマ）", "B: トレーサビリティと品質", "C: 人間の承認", "D: 証跡の完全性（ハッシュと署名）", "警告→ソフト→ハードの段階的な強制"],
    visual: (
      <div className="card stack" style={{ ["--gap" as string]: "10px" }}>
        {gateRuns.slice(0, 4).map((r) => (
          <div key={r.id} className="row between small">
            <span className="truncate" style={{ maxWidth: 260 }}>#{r.pr_number} {r.pr_title}</span>
            <GateSummaryStrip gates={r.gates} />
          </div>
        ))}
      </div>
    ),
  },
  {
    key: "exceptions", icon: "flag", title: "例外ワークフロー", body: "管理者による無条件のバイパスはありません。例外は理由・リスク・期限・独立した承認者を持つ証跡として記録し、期限が来たら再審査します。",
    points: ["申請者は自分の例外を承認できない", "期限の上限と自動再審査", "ハードの強制レベルでは例外不可"],
    visual: <ExceptionSummary ex={exceptions[0]} />,
  },
  {
    key: "evidence", icon: "signature", title: "証跡の署名と保管", body: "コミット、ポリシー、テスト結果、承認者、AI レビューの記録をハッシュで束ねた Evidence Manifest に署名し、改ざん耐性のある保管先に残します。",
    points: ["リリースごとの Evidence Manifest", "署名と透明性ログでの検証", "Git ホスティングとは別の WORM 保管"],
    visual: <div className="stack" style={{ ["--gap" as string]: "8px" }}>{evidence.slice(3, 5).map((e) => <EvidenceItem key={e.id} ev={e} />)}</div>,
  },
  {
    key: "audit", icon: "package", title: "監査ダッシュボードと監査パック", body: "統制項目ごとに証跡がそろっているかを確認し、評価者向けの監査パックを出力できます。共有リンクは期限付きで、いつでも失効できます。",
    points: ["統制項目から証跡への逆引き", "ZIP（PDF の要約と JSON）で出力", "評価者向けの期限付き共有リンク"],
    visual: <div className="card"><ShareLinkPanel initial="active" /></div>,
  },
  {
    key: "portal", icon: "users", title: "顧客の承認と受入", body: "発注元の担当者は、アカウントを作らずに期限付きの承認リンクで要求・変更を承認し、リリースを受け入れられます。顧客ポータルも用意しています。スマートフォンにも対応します。",
    points: ["メールの確認コードで本人確認", "差分付きの承認画面", "受入チェックリスト", "誰がいつ承認したかを証跡に記録"],
    visual: (
      <div className="card stack" style={{ ["--gap" as string]: "12px" }}>
        <div className="row between"><span className="strong">REQ-0012 発注金額の上限</span><StatusBadge vocab={ARTIFACT_STATUS.pending} size="sm" /></div>
        <ApprovalPanel approvers={[{ role: "顧客", user_id: "u-nakamura", status: "pending" }]} />
        <ChecklistPanel items={[{ id: "1", title: "受入基準を確認した", state: "ok" }, { id: "2", title: "差分を確認した", state: "pending" }]} />
      </div>
    ),
  },
];

export function P02Features() {
  const { query } = useRoute();
  const [active, setActive] = useState(query.get("section") ?? features[0].key);
  useEffect(() => {
    const target = query.get("section");
    if (target) document.getElementById(`f-${target}`)?.scrollIntoView({ behavior: "smooth" });
  }, [query]);
  useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      const vis = entries.filter((e) => e.isIntersecting);
      if (vis[0]) setActive(vis[0].target.id.replace("f-", ""));
    }, { rootMargin: "-40% 0px -55% 0px" });
    features.forEach((f) => {
      const el = document.getElementById(`f-${f.key}`);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);
  return (
    <PublicLayout>
      <section className="section" style={{ paddingBottom: 24 }}>
        <div className="container stack" style={{ ["--gap" as string]: "12px" }}>
          <span className="eyebrow">FEATURES</span>
          <h1 className="display" style={{ fontSize: "clamp(28px, 4vw, 40px)" }}>機能紹介</h1>
          <p className="lead">要求から監査証跡までを、PR のマージ条件に変換する仕組みです。</p>
        </div>
      </section>
      <div className="container with-toc" style={{ paddingBottom: 64 }}>
        <nav className="toc" aria-label="機能の目次">
          {features.map((f) => (
            <a key={f.key} href={`#${paths.features()}?section=${f.key}`} className={active === f.key ? "active" : undefined} onClick={(e) => { e.preventDefault(); document.getElementById(`f-${f.key}`)?.scrollIntoView({ behavior: "smooth" }); setActive(f.key); }}>
              {f.title}
            </a>
          ))}
        </nav>
        <div>
          {features.map((f) => (
            <section key={f.key} id={`f-${f.key}`} className="feature-section">
              <div className="stack" style={{ ["--gap" as string]: "14px" }}>
                <span className="feature-icon"><Icon name={f.icon} /></span>
                <h2 className="headline" style={{ fontSize: "var(--text-xl)" }}>{f.title}</h2>
                <p className="lead" style={{ fontSize: "var(--text-sm)" }}>{f.body}</p>
                <ul>{f.points.map((p) => <li key={p}>{p}</li>)}</ul>
              </div>
              <div style={{ minWidth: 0 }}>{f.visual}</div>
            </section>
          ))}
          <div className="row" style={{ paddingTop: 32 }}>
            <Button variant="primary" size="lg" iconRight="arrowRight" to={paths.contact()}>PoCを相談</Button>
            <Button variant="ghost" to={paths.pricing()}>料金を見る</Button>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
