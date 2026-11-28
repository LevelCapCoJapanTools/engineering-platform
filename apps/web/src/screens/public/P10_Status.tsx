// 画面ID: P-10 稼働状況
// サービスの機能ごとの稼働、障害告知、保守予定、連携先の障害の影響を示す。
import "./public.css";
import { useScreenState } from "../../lib/router";
import { paths } from "../../lib/paths";
import { Banner, Button, ProviderBadge, PublicLayout, Tag, Timeline } from "../../ui";
import type { ProviderKey } from "../../lib/vocab";

type Comp = { name: string; note: string; state: "ok" | "degraded" | "down" | "maintenance"; uptime: string };

const BASE: Comp[] = [
  { name: "Web 画面", note: "経営ダッシュボード、設定", state: "ok", uptime: "99.98%" },
  { name: "計画・カレンダーの同期", note: "課題・計画管理、共有カレンダー", state: "ok", uptime: "99.91%" },
  { name: "コードホスティング連携", note: "Webhook の受信、PR/MR の同期", state: "ok", uptime: "99.95%" },
  { name: "ゲートの判定", note: "チェック結果の返却", state: "ok", uptime: "99.99%" },
  { name: "通知の配信", note: "チャット、メール", state: "ok", uptime: "99.93%" },
  { name: "証跡の署名と保管", note: "Evidence Manifest、WORM", state: "ok", uptime: "100.00%" },
  { name: "AI 機能", note: "要約、要求レビュー", state: "ok", uptime: "99.72%" },
];

const PROVIDER_STATUS: { provider: ProviderKey; state: "ok" | "degraded"; note: string }[] = [
  { provider: "github", state: "ok", note: "正常" },
  { provider: "gitlab", state: "degraded", note: "提供元で API の遅延。同期が最大 90 分遅れる可能性があります" },
  { provider: "slack", state: "ok", note: "正常" },
  { provider: "googleCalendar", state: "ok", note: "正常" },
  { provider: "pagerduty", state: "ok", note: "正常" },
];

const STATE_LABEL: Record<Comp["state"], { label: string; tone: "pass" | "warn" | "fail" | "info" }> = {
  ok: { label: "正常", tone: "pass" },
  degraded: { label: "一部の遅延", tone: "warn" },
  down: { label: "停止", tone: "fail" },
  maintenance: { label: "保守中", tone: "info" },
};

function bars(seed: number) {
  return Array.from({ length: 30 }, (_, i) => ((i * 7 + seed) % 23 === 0 ? "warn" : (i * 11 + seed) % 61 === 0 ? "fail" : "pass"));
}

export function P10Status() {
  const state = useScreenState();
  const incident = state === "障害発生中";
  const maint = state === "保守予定";
  const comps = BASE.map((c) => (incident && c.name === "通知の配信" ? { ...c, state: "degraded" as const } : c));
  return (
    <PublicLayout>
      <section className="section" style={{ paddingBottom: 24 }}>
        <div className="container stack" style={{ ["--gap" as string]: "12px" }}>
          <span className="eyebrow">STATUS</span>
          <h1 className="display" style={{ fontSize: "clamp(28px, 4vw, 40px)" }}>稼働状況</h1>
          <p className="lead">機能ごとの稼働と、障害・保守の告知です。最終更新: 2026-11-27 10:30 JST</p>
        </div>
      </section>
      <div className="container stack" style={{ ["--gap" as string]: "20px", paddingBottom: 72 }}>
        {incident ? (
          <Banner tone="warn" title="通知の配信が遅れています（調査中）">
            10:12 から、チャット通知の一部が最大 15 分遅れて届いています。ゲートの判定、証跡の記録、同期には影響ありません。遅れた通知は順に再送しています。次回の更新: 11:00
          </Banner>
        ) : maint ? (
          <Banner tone="info" title="保守の予定: 2026-12-06（土）2:00〜4:00 JST">
            データベースの更新のため、Web 画面を最大 2 時間停止します。停止中も Webhook は受け付け、再開後に順に処理します。ゲートの判定は「未実行」として返し、通過扱いにはしません。
          </Banner>
        ) : (
          <Banner tone="pass" title="すべての機能は正常に動いています" />
        )}

        <section className="card flush">
          <div className="card-header"><h2 className="section-title">機能ごとの状況（直近 30 日）</h2></div>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>機能</th><th>状態</th><th>直近 30 日</th><th className="num">稼働率</th></tr></thead>
              <tbody>
                {comps.map((c, i) => (
                  <tr key={c.name}>
                    <td><div className="strong small">{c.name}</div><div className="tiny muted">{c.note}</div></td>
                    <td><Tag tone={STATE_LABEL[c.state].tone} square>{STATE_LABEL[c.state].label}</Tag></td>
                    <td>
                      <span className="row nowrap" style={{ ["--gap" as string]: "2px" }} aria-label="日ごとの状態">
                        {bars(i).map((b, j) => <span key={j} style={{ display: "inline-block", width: 5, height: 18, borderRadius: 2, background: `var(--tone-${b})`, opacity: b === "pass" ? 0.55 : 1 }} />)}
                      </span>
                    </td>
                    <td className="num">{c.uptime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card stack" style={{ ["--gap" as string]: "10px" }}>
          <h2 className="section-title">連携先の状況</h2>
          <p className="small muted">連携先の障害は、このサービスの同期の遅れとして現れます。同期が遅れている間、画面には最終同期時刻と「古い情報」の表示が出ます。</p>
          <div className="stack" style={{ ["--gap" as string]: "6px" }}>
            {PROVIDER_STATUS.map((p) => (
              <div key={p.provider} className="row between" style={{ ["--gap" as string]: "8px" }}>
                <ProviderBadge provider={p.provider} />
                <span className="row" style={{ ["--gap" as string]: "8px" }}><span className="small muted">{p.note}</span><Tag tone={p.state === "ok" ? "pass" : "warn"} square>{p.state === "ok" ? "正常" : "遅延"}</Tag></span>
              </div>
            ))}
          </div>
        </section>

        <section className="card stack" style={{ ["--gap" as string]: "10px" }}>
          <h2 className="section-title">過去の障害と保守</h2>
          <Timeline
            items={[
              { id: "s1", actor: { kind: "system", name: "運用" }, action: "解決: 証跡保管先への書き込みの遅延", at: "2026-11-26T22:40:00+09:00", detail: "保管先の一時的な障害により 35 分遅延。欠落はなく、すべて保管済みです。" },
              { id: "s2", actor: { kind: "system", name: "運用" }, action: "保守: 同期基盤の更新", at: "2026-11-15T03:00:00+09:00", detail: "予定どおり完了しました。" },
              { id: "s3", actor: { kind: "system", name: "運用" }, action: "解決: Google Calendar の差分同期の失敗", at: "2026-11-02T14:20:00+09:00", detail: "提供元の同期トークンの失効により全件を再同期しました。重複登録はありません。" },
            ]}
          />
        </section>
        <div className="row" style={{ ["--gap" as string]: "8px" }}>
          <Button variant="secondary" icon="mail" to={paths.support()}>障害の連絡・サポート</Button>
          <Button variant="ghost" to={paths.security()}>セキュリティとデータの扱い</Button>
        </div>
      </div>
    </PublicLayout>
  );
}
