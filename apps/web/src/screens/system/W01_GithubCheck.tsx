// 画面ID: W-01 GitHub のチェック結果
import { useState } from "react";
import { ActorLabel, Brand, Button, CodeRef, Icon, MarkdownViewer, Segmented, StatusBadge, ThemeToggle } from "../../ui";
import { Link, setScreenState, useScreenState } from "../../lib/router";
import { ORG, PROJECT, paths } from "../../lib/paths";
import { GATE_STATUS } from "../../lib/vocab";
import type { GateStatus } from "../../lib/vocab";
import { GATE_LABELS } from "../../lib/types";
import type { GateLetter, GateRun } from "../../lib/types";
import { aiFindings, gateRunById } from "../../mocks/core";
import "./system.css";

const STATE_RUN: Record<string, string> = {
  ブロック: "run-5821",
  通過: "run-5810",
  警告のみ: "run-5808",
  例外適用中: "run-5815",
};

const MARK: Record<GateStatus, string> = {
  pass: "✅ 通過",
  block: "❌ ブロック",
  warn: "⚠️ 警告",
  exception: "🚩 例外適用中",
  running: "⏳ 実行中",
  notRun: "— 未実行",
};

const HEADLINE: Record<string, string> = {
  block: "**ブロック**: 修正が必要な問題があります。マージできません。",
  pass: "**通過**: すべてのゲートを通過しました。",
  warn: "**通過（警告あり）**: ブロックはしませんが、確認を推奨する項目があります。",
  exception: "**例外適用中で通過**: 承認された例外によりブロックを解除しています。",
};

const APP_URL = "https://app.example";

export function buildCheckMarkdown(run: GateRun) {
  const letters: GateLetter[] = ["A", "B", "C", "D"];
  const blocking = run.reasons.filter((r) => r.result !== "pass");
  const shown = blocking.slice(0, 10);
  const aiCount = aiFindings.filter((f) => f.status === "unconfirmed").length;
  const detail = `${APP_URL}/o/${ORG}/p/${PROJECT}/gates/${run.id}`;
  const lines: string[] = [];
  lines.push(`## ${MARK[run.verdict]} ・ Product Name ゲート`);
  lines.push("");
  lines.push(HEADLINE[run.verdict] ?? "判定中です。");
  lines.push("");
  lines.push("| ゲート | 結果 |");
  lines.push("| --- | --- |");
  letters.forEach((l) => lines.push(`| ${l}: ${GATE_LABELS[l]} | ${MARK[run.gates[l]]} |`));
  lines.push("");
  if (shown.length) {
    lines.push(run.verdict === "warn" ? "### 確認を推奨する項目" : "### ブロックの理由と修正方法");
    shown.forEach((r, i) => {
      lines.push(`${i + 1}. \`${r.rule_id}\` ${r.message}${r.fix ? ` — 修正方法: ${r.fix}` : ""}`);
    });
    if (blocking.length > 10) lines.push(`- ほか ${blocking.length - 10} 件。詳細画面で確認してください。`);
    lines.push("");
  }
  if (run.exception_id) {
    lines.push("### 適用中の例外");
    lines.push(`- \`${run.exception_id}\` 承認者: 佐藤 美咲 ・ 期限: 2026-12-03`);
    lines.push("");
  }
  if (run.required_approvals.length) {
    lines.push("### 必要な承認");
    run.required_approvals.forEach((a) => {
      lines.push(`- ${a.role}: ${a.status === "approved" ? "✅ 承認済み" : "⏳ 承認待ち"}`);
    });
    lines.push("");
  }
  lines.push(`> AIの参考所見: ${aiCount} 件（判定には使われていません）`);
  lines.push("");
  lines.push(`**詳細**: ${detail}`);
  lines.push("");
  lines.push(`ポリシー: \`${run.policy_version}\` ・ 強制レベル: \`${run.enforcement}\` ・ 実行ID: \`${run.ci_run_id}\``);
  return lines.join("\n");
}

const conclusionIcon = (s: GateStatus) => (s === "block" ? "xCircle" : s === "pass" || s === "exception" ? "checkCircle" : s === "warn" ? "alert" : "clock");

export function GithubCheckScreen() {
  const state = useScreenState();
  const run = gateRunById(STATE_RUN[state] ?? "run-5821");
  const md = buildCheckMarkdown(run);
  const [copied, setCopied] = useState(false);
  const v = GATE_STATUS[run.verdict];
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-subtle)" }}>
      <header className="global-header" style={{ gridTemplateColumns: "auto 1fr auto" }}>
        <Brand to={paths.screens()} />
        <span className="small muted">W-01 GitHub のチェック結果（PR のチェック実行に表示する Markdown のプレビュー）</span>
        <ThemeToggle />
      </header>
      <main className="container stack" style={{ padding: "24px 24px 64px" }}>
        <div className="row between">
          <Segmented value={state} onChange={setScreenState} options={Object.keys(STATE_RUN).map((s) => ({ value: s, label: s }))} />
          <span className="small muted">画像は使わず Markdown のみ。最大10件まで理由を表示し、超える分は件数と詳細画面へのリンクにする。</span>
        </div>
        <div className="grid" style={{ gridTemplateColumns: "minmax(0, 1.25fr) minmax(0, 1fr)", alignItems: "start" }}>
          <section className="gh-check" aria-label="GitHub 上での表示">
            <div className="gh-check-tabs">
              <span className="row nowrap" style={{ ["--gap" as string]: "6px" }}><Icon name="pullRequest" size={14} /> #{run.pr_number ?? "—"} {run.pr_title}</span>
              <span className="muted tiny">Conversation · Commits · <strong>Checks</strong> · Files changed</span>
            </div>
            <div className="gh-check-body">
              <aside className="gh-check-side">
                <div className="label" style={{ padding: "0 8px 6px" }}>チェック</div>
                <div className="gh-check-item active">
                  <Icon name={conclusionIcon(run.verdict)} size={15} className={v.tone === "fail" ? "text-fail" : v.tone === "warn" ? "text-warn" : "text-pass"} />
                  <span className="truncate">Product Name ゲート</span>
                </div>
                <div className="gh-check-item"><Icon name="checkCircle" size={15} className="text-pass" /> <span>Rust</span></div>
                <div className="gh-check-item"><Icon name="checkCircle" size={15} className="text-pass" /> <span>Web</span></div>
              </aside>
              <div className="gh-check-main">
                <div className="row between" style={{ paddingBottom: 12, borderBottom: "1px solid var(--border)", marginBottom: 16 }}>
                  <span className="row" style={{ ["--gap" as string]: "8px" }}>
                    <strong style={{ color: "var(--text-strong)" }}>Product Name ゲート</strong>
                    <StatusBadge vocab={v} size="sm" />
                  </span>
                  <CodeRef kind="commit" value={run.commit_sha} />
                </div>
                <MarkdownViewer source={md} />
              </div>
            </div>
          </section>
          <section className="card flush" aria-label="生の Markdown">
            <div className="card-header">
              <div>
                <h2 className="section-title">生の Markdown</h2>
                <p className="section-sub">チェック実行の summary に送る本文</p>
              </div>
              <Button size="sm" icon={copied ? "check" : "copy"} onClick={() => { void navigator.clipboard?.writeText(md).catch(() => undefined); setCopied(true); window.setTimeout(() => setCopied(false), 1200); }}>
                {copied ? "コピーしました" : "コピー"}
              </Button>
            </div>
            <pre className="json" style={{ margin: 16, maxHeight: 640, whiteSpace: "pre-wrap" }}>{md}</pre>
          </section>
        </div>
        <div className="row small muted">
          <ActorLabel kind="ci" size="sm" />
          判定は決定論的なルールで行い、AIの所見は件数のみ表示します。
          <Link to={paths.gate(ORG, PROJECT, run.id)}>G-02 ゲート実行の詳細を開く</Link>
        </div>
      </main>
    </div>
  );
}
