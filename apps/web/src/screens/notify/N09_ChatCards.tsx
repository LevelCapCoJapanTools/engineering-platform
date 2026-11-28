// 画面ID: N-09 チャットでの表示（Web以外の表示面）
import { setScreenState, useScreenState } from "../../lib/router";
import { PRODUCT_NAME } from "../../lib/vocab";
import { paths } from "../../lib/paths";
import type { Severity } from "../../lib/vocab";
import { Brand, Button, CapabilityCell, ProviderBadge, Tabs, Tag, ThemeToggle } from "../../ui";
import { cx } from "../../ui";
import { channels } from "../../mocks/notify";
import { SeverityBadge } from "./parts";
import "./notify.css";

type Msg = { title: string; severity: Severity; facts: [string, string][]; due?: string; actions: string[]; link: string };

const MESSAGES: Record<string, Msg> = {
  経営判断の依頼: {
    title: "DEC-0031 追加費用 120万円の承認",
    severity: "high",
    facts: [["案件", "受発注システム刷新"], ["影響", "追加費用 120万円、納期への影響なし（PM 試算）"], ["依頼者", "佐藤 美咲（PM）"]],
    due: "2026/12/02",
    actions: ["承認", "条件付き承認", "保留"],
    link: "判断の詳細を開く",
  },
  インシデント: {
    title: "INC-0111 会員アプリ API の応答遅延",
    severity: "critical",
    facts: [["サービス", "会員アプリ API（本番）"], ["段階", "2（二次担当を呼び出し中）"], ["発生", "10:21"]],
    actions: ["受領（Ack）", "解決（Resolve）"],
    link: "インシデントを開く",
  },
  同期の停止: {
    title: "Jira（旧基幹データ移行）の同期が停止しています",
    severity: "high",
    facts: [["最終成功", "11/24 18:00"], ["原因", "アクセストークンの失効"], ["対応", "接続者（石井 浩二）の再認可"]],
    actions: [],
    link: "連携の詳細を開く",
  },
  "マイルストーンの遅延": {
    title: "MS-104 v1.4.0 納入の予測が 7 日後ろ倒し",
    severity: "high",
    facts: [["確約日", "2026/12/10"], ["予測", "2026/12/17（+7日）"], ["原因", "結合テスト環境の準備遅れ（MS-105）"]],
    actions: [],
    link: "スケジュールを開く",
  },
};

const SURFACES: { id: string; name: string }[] = [
  { id: "ch-slack-exec", name: "Slack" },
  { id: "ch-teams", name: "Microsoft Teams（Workflows）" },
  { id: "ch-mm", name: "Mattermost" },
  { id: "ch-gchat", name: "Google Chat" },
  { id: "ch-discord", name: "Discord（Webhook）" },
  { id: "ch-chatwork", name: "Chatwork" },
];

export function N09ChatCards() {
  const state = useScreenState();
  const kind = MESSAGES[state] ? state : "経営判断の依頼";
  const m = MESSAGES[kind];
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-subtle)" }}>
      <header className="global-header" style={{ gridTemplateColumns: "auto 1fr auto" }}>
        <Brand to={paths.screens()} />
        <span className="small muted">N-09 チャットでの表示（プレビュー）</span>
        <ThemeToggle />
      </header>
      <main className="container stack" style={{ padding: "24px 16px 64px", maxWidth: 1200 }}>
      <h1 className="headline" style={{ fontSize: "var(--text-xl)" }}>チャットでの表示</h1>
      <p className="small muted" style={{ marginBottom: 12 }}>
        同じ通知が各チャネルでどう見えるかを並べています。ボタンは双方向の操作に対応したチャネルだけに表示し、送信専用のチャネルには詳細へのリンクだけを載せます。ボタンからの操作は、署名検証と本人のロール照合を通った場合だけ記録されます。
      </p>
      <Tabs value={kind} onChange={(v) => setScreenState(v)} tabs={Object.keys(MESSAGES).map((k) => ({ value: k, label: k }))} />
      <div className="nt-chat-grid" style={{ marginTop: 16 }}>
        {SURFACES.map((s) => {
          const c = channels.find((x) => x.id === s.id)!;
          const interactive = c.capabilities.interactive && m.actions.length > 0;
          const plain = c.provider === "chatwork";
          return (
            <div key={s.id} className="nt-chat">
              <div className="nt-chat-head">
                <ProviderBadge provider={c.provider} size="sm" />
                <span className="row nowrap" style={{ ["--gap" as string]: "6px" }}>
                  <span className="tiny muted">操作</span><CapabilityCell level={c.capabilities.interactive ? "yes" : "no"} />
                  <span className="tiny muted">配信確認</span><CapabilityCell level={c.capabilities.deliveryReceipt ? "yes" : "no"} />
                </span>
              </div>
              <div className="nt-chat-body">
                <span className="nt-chat-avatar" aria-hidden>PN</span>
                <div className="stack" style={{ ["--gap" as string]: "6px", minWidth: 0, flex: 1 }}>
                  <span className="small"><strong>{PRODUCT_NAME}</strong> <span className="tiny muted">10:24</span></span>
                  {plain ? (
                    <div className="nt-chat-plain">
                      {`[info][title]${m.title}[/title]${m.facts.map(([k, v]) => `${k}: ${v}`).join("\n")}${m.due ? `\n期限: ${m.due}` : ""}\n${m.link}: https://app.example/...[/info]`}
                    </div>
                  ) : (
                    <div className={cx("nt-chat-card", `sev-${m.severity}`)}>
                      <span className="row" style={{ ["--gap" as string]: "6px" }}><SeverityBadge value={m.severity} /><strong className="small">{m.title}</strong></span>
                      {m.facts.map(([k, v]) => <span key={k} className="small"><span className="muted">{k}:</span> {v}</span>)}
                      {m.due ? <span className="small"><span className="muted">期限:</span> {m.due}</span> : null}
                      {interactive ? (
                        <div className="nt-chat-buttons">
                          {m.actions.map((a, i) => <Button key={a} size="sm" variant={i === 0 ? "primary" : "secondary"}>{a}</Button>)}
                        </div>
                      ) : null}
                      <a className="small" href="#" onClick={(e) => e.preventDefault()}>{m.link} ↗</a>
                    </div>
                  )}
                  {!c.capabilities.interactive && m.actions.length > 0 ? <Tag square dashed>送信専用のためボタンなし</Tag> : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <p className="tiny muted" style={{ marginTop: 16 }}>金額・顧客名は、経営層向けのチャネル以外では通知ルールのマスキング設定に従って伏せます。本文に要求・コードの内容や認証情報は載せません。</p>
      </main>
    </div>
  );
}
