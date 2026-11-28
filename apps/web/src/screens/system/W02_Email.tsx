// 画面ID: W-02 通知メール
import { Brand, Icon, KeyValueList, Segmented, Tabs, ThemeToggle } from "../../ui";
import { Link, setScreenState, useScreenState } from "../../lib/router";
import { paths } from "../../lib/paths";
import { PRODUCT_NAME } from "../../lib/vocab";
import { useState } from "react";
import "./system.css";

type Mail = {
  subject: string;
  to: string;
  lead: string;
  facts: { label: string; value: string }[];
  body: string;
  action: string;
  tone?: "fail" | "warn" | "pass";
};

const MAILS: Record<string, Mail> = {
  承認の依頼: {
    subject: "[受発注システム刷新] 経営判断の依頼: 追加費用 120万円の承認（期限 12/2）",
    to: "木村 達也",
    lead: "佐藤 美咲（PM）から、経営判断の依頼が届いています。",
    facts: [
      { label: "判断", value: "DEC-0031 CR-0004（上限額の税込判定）の追加費用" },
      { label: "影響", value: "追加費用 120万円、納期への影響なし（PM 試算）" },
      { label: "選択肢", value: "承認／条件付き承認（v1.5.0 に延期）／却下" },
      { label: "期限", value: "2026/12/02（12/2 の顧客レビューの前）" },
    ],
    body: "根拠（変更要求、影響を受ける要求とテスト）は判断の詳細画面にまとめています。判断には理由の記入が必要です。",
    action: "判断の詳細を開く",
  },
  "承認・差戻しの結果": {
    subject: "[受発注システム刷新] DEC-0029 は条件付きで承認されました",
    to: "佐藤 美咲",
    lead: "依頼した経営判断の結果をお知らせします。",
    facts: [
      { label: "対象", value: "DEC-0029 EXC-0007（依存ライブラリの脆弱性）のリスク受容" },
      { label: "結果", value: "条件付き承認" },
      { label: "判断者", value: "森 由紀子（CTO）" },
      { label: "条件", value: "12/3 までに修正版へ更新。更新できない場合は再審議" },
    ],
    body: "条件の対応状況は判断の記録で追跡されます。対応は課題管理（GitHub Projects）で進めてください。",
    action: "判断の記録を開く",
    tone: "warn",
  },
  例外の期限: {
    subject: "[受発注システム刷新] 例外 EXC-0006 の期限まであと3日です",
    to: "森 由紀子（例外の承認者）, 鈴木 彩, 佐藤 美咲",
    lead: "有効な例外の期限が近づいています。期限を過ぎると、該当するゲートは再びブロックし、再審査になります。",
    facts: [
      { label: "例外", value: "EXC-0006（QLT-004 依存ライブラリの脆弱性）" },
      { label: "対象", value: "main / Cargo.lock" },
      { label: "期限", value: "2026/11/30（あと3日）" },
    ],
    body: "修正を完了させるか、必要であれば新しい例外を申請してください。延長は新しい申請として扱われます。",
    action: "例外を確認する",
    tone: "warn",
  },
  ゲートのブロック: {
    subject: "[受発注システム刷新] PR #142 がゲート B でブロックされました",
    to: "鈴木 彩（GitHub: aya-suzuki）",
    lead: "あなたが作成した PR がゲートでブロックされました。このサービスへのログインは不要です。理由と修正方法は GitHub のチェック結果に表示しています。",
    facts: [
      { label: "PR", value: "#142 操作ログを追記専用ストレージへ書き込む" },
      { label: "ゲート", value: "B: トレーサビリティと品質" },
      { label: "理由", value: "2件（TRC-002, QLT-004）" },
      { label: "強制レベル", value: "ソフト（例外で通過可）" },
    ],
    body: "修正が難しい場合は、PM に例外の申請を相談してください。例外には申請者とは別の承認者が必要です。",
    action: "GitHub でチェック結果を見る",
    tone: "fail",
  },
  受入の依頼: {
    subject: "[受発注システム刷新] v1.4.0 の受入をお願いします",
    to: "中村 拓也（架空商事株式会社）",
    lead: "サンプルソフト株式会社から、リリースの受入依頼が届いています。",
    facts: [
      { label: "リリース", value: "v1.4.0 PDF 出力と基幹連携の再送" },
      { label: "納入物", value: "3 件" },
      { label: "依頼者", value: "佐藤 美咲（PM）" },
      { label: "希望期限", value: "2026/12/12" },
    ],
    body: "納入物と受入チェックリストを確認し、受け入れるか差し戻すかを選んでください。アカウントは不要です。リンクを開くとこのメールアドレスに確認コードを送ります（期限 12/12）。スマートフォンからも操作できます。",
    action: "受入画面を開く",
  },
  共有リンクの発行: {
    subject: "監査パックが共有されました（受発注システム刷新）",
    to: "評価者 A",
    lead: "サンプルソフト株式会社から、監査パックの閲覧リンクが共有されました。",
    facts: [
      { label: "対象", value: "受発注システム刷新 · v1.2.0〜v1.3.0" },
      { label: "共有元", value: "佐藤 美咲" },
      { label: "閲覧期限", value: "2026/12/11" },
    ],
    body: "リンクを開くと、このメールアドレスに確認コードを送信します。期限を過ぎるとリンクは無効になります。",
    action: "監査パックを開く",
  },
};

const KINDS = Object.keys(MAILS);

function textVersion(m: Mail) {
  return [
    `件名: ${m.subject}`,
    "",
    `${m.to} 様`,
    "",
    m.lead,
    "",
    ...m.facts.map((f) => `${f.label}: ${f.value}`),
    "",
    m.body,
    "",
    `${m.action}: https://app.example/...`,
    "",
    "--",
    `${PRODUCT_NAME} からの自動通知です。このメールに返信しても届きません。`,
    "通知の設定・配信停止: https://app.example/me",
  ].join("\n");
}

export function EmailScreen() {
  const state = useScreenState();
  const kind = MAILS[state] ? state : KINDS[0];
  const m = MAILS[kind];
  const [view, setView] = useState("html");
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-subtle)" }}>
      <header className="global-header" style={{ gridTemplateColumns: "auto 1fr auto" }}>
        <Brand to={paths.screens()} />
        <span className="small muted">W-02 通知メール（プレビュー）</span>
        <ThemeToggle />
      </header>
      <main className="container stack" style={{ padding: "24px 24px 64px", maxWidth: 920 }}>
        <Segmented value={kind} onChange={setScreenState} options={KINDS.map((k) => ({ value: k, label: k }))} />
        <section className="card flush">
          <div className="card-body" style={{ borderBottom: "1px solid var(--border)" }}>
            <KeyValueList
              items={[
                { label: "差出人", value: `${PRODUCT_NAME} <notify@app.example>` },
                { label: "宛先", value: m.to },
                { label: "件名", value: <strong>{m.subject}</strong> },
              ]}
            />
          </div>
          <Tabs value={view} onChange={setView} tabs={[{ value: "html", label: "HTML 版" }, { value: "text", label: "テキスト版" }]} />
          {view === "html" ? (
            <div className="mail-canvas">
              <div className="mail">
                <div className="mail-brand"><span className="brand-mark sm" aria-hidden /> {PRODUCT_NAME}</div>
                {m.tone ? <div className={`mail-bar tone-${m.tone}`} /> : null}
                <p>{m.to} 様</p>
                <p>{m.lead}</p>
                <table className="mail-facts">
                  <tbody>
                    {m.facts.map((f) => (
                      <tr key={f.label}><th>{f.label}</th><td>{f.value}</td></tr>
                    ))}
                  </tbody>
                </table>
                <p>{m.body}</p>
                <p style={{ textAlign: "center", margin: "24px 0" }}>
                  <a href="#" onClick={(e) => e.preventDefault()} className="mail-button">{m.action}</a>
                </p>
                <div className="mail-foot">
                  {PRODUCT_NAME} からの自動通知です。このメールに返信しても届きません。<br />
                  <Link to={paths.me()}>通知の設定を変更する</Link>（アカウントのない方は配信停止のリンクから）
                </div>
              </div>
            </div>
          ) : (
            <pre className="json" style={{ margin: 16, whiteSpace: "pre-wrap" }}>{textVersion(m)}</pre>
          )}
        </section>
        <p className="small muted row"><Icon name="info" size={14} />メールは件名・本文・操作ボタン1つの簡素な構成にし、外部画像を読み込まない。</p>
      </main>
    </div>
  );
}
