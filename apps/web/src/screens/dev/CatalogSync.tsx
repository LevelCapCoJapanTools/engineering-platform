// 部品カタログ 5.6 連携・経営（2026-11-28 追加）
import type { ReactNode } from "react";
import {
  CapabilityCell,
  ConfidenceTag,
  ExternalActor,
  Freshness,
  PlanDates,
  ProviderBadge,
  ResponsibilitySplit,
  RoadmapTimeline,
  SourceTag,
  StaleDataNotice,
  StatusBadge,
  SyncBadge,
} from "../../ui";
import {
  CASE_STATUS,
  CHECK_ANOMALY,
  DECISION_STATUS,
  DELIVERY_STATUS,
  HEALTH,
  INCIDENT_STATUS,
  PROVIDERS,
  SEVERITY,
  SYNC_STATUS,
} from "../../lib/vocab";
import type { ProviderKey, StatusVocab, SyncStatus } from "../../lib/vocab";

export const SYNC_TOC = ["ProviderBadge", "Freshness", "SourceTag", "StaleDataNotice", "ExternalActor", "CapabilityCell", "ConfidenceTag", "PlanDates", "RoadmapTimeline", "ResponsibilitySplit", "vocab-sync"];

function Sec({ id, title, desc, children }: { id: string; title?: string; desc?: ReactNode; children: ReactNode }) {
  return (
    <section className="cat-sec" id={id}>
      <div className="cat-sec-head">
        <h3>{title ?? id}</h3>
        {desc ? <p>{desc}</p> : null}
      </div>
      <div className="cat-demo">{children}</div>
    </section>
  );
}

function Row({ label, children, block }: { label: ReactNode; children: ReactNode; block?: boolean }) {
  return (
    <div className={block ? "cat-demo-row block" : "cat-demo-row"}>
      <span className="cat-label">{label}</span>
      <div className="cat-body">{children}</div>
    </div>
  );
}

function VocabRow({ name, vocab }: { name: string; vocab: Record<string, StatusVocab> }) {
  return (
    <Row label={name}>
      <div className="row">{Object.entries(vocab).map(([k, v]) => <StatusBadge key={k} vocab={v} size="sm" />)}</div>
    </Row>
  );
}

export function SyncParts() {
  return (
    <>
      <h2 className="cat-group-title">5.6 連携・経営</h2>
      <Sec id="ProviderBadge" desc="連携先のサービス名。アイコンは種類（コードホスティング、カレンダー等）で決まる。ベータ・予定・非推奨を併記できる">
        <Row label="種類ごと">
          <div className="row">{(["github", "gitlab", "codecommit", "azureRepos", "githubProjects", "jira", "googleCalendar", "slack", "pagerduty", "s3ObjectLock"] as ProviderKey[]).map((p) => <ProviderBadge key={p} provider={p} />)}</div>
        </Row>
        <Row label="状態付き">
          <div className="row">{(["gitlab", "bitbucket", "opsgenie"] as ProviderKey[]).map((p) => <ProviderBadge key={p} provider={p} showStatus />)}</div>
        </Row>
        <Row label="小">
          <ProviderBadge provider="m365Calendar" size="sm" />
        </Row>
      </Sec>
      <Sec id="Freshness" desc="最終同期からの経過。60分を超えるか、同期に問題があれば警告色にする。古い情報を最新と誤認させない">
        <Row label="正常"><Freshness at="2026-11-27T10:20:00+09:00" status="healthy" /></Row>
        <Row label="古い（時間経過）"><Freshness at="2026-11-27T08:00:00+09:00" /></Row>
        <Row label="遅延"><Freshness at="2026-11-27T08:55:00+09:00" status="delayed" /></Row>
        <Row label="再認可が必要"><Freshness at="2026-11-24T18:00:00+09:00" status="authExpired" /></Row>
        <Row label="未同期"><Freshness status="initialSync" /></Row>
        <Row label="小"><Freshness at="2026-11-27T10:20:00+09:00" compact /></Row>
      </Sec>
      <Sec id="SourceTag" desc="同期した値の出典（正本）と鮮度。経営向けの値には必ず付ける">
        <Row label="正常"><SourceTag source={{ provider: "githubProjects", label: "Project #3", synced_at: "2026-11-27T10:15:00+09:00", status: "healthy", url: "#" }} /></Row>
        <Row label="再認可が必要"><SourceTag source={{ provider: "jira", label: "MIG", synced_at: "2026-11-24T18:00:00+09:00", status: "authExpired" }} /></Row>
        <Row label="出典の別名"><SourceTag prefix="出典" source={{ provider: "googleCalendar", synced_at: "2026-11-27T10:20:00+09:00" }} compact /></Row>
      </Sec>
      <Sec id="StaleDataNotice" desc="画面上部に置く。同期が止まった・古いデータがあるときだけ表示される">
        <Row label="表示あり" block>
          <StaleDataNotice
            sources={[
              { name: "旧基幹データ移行の計画", source: { provider: "jira", synced_at: "2026-11-24T18:00:00+09:00", status: "authExpired" } },
              { name: "会員アプリのマイルストーン", source: { provider: "gitlabIssues", synced_at: "2026-11-27T08:55:00+09:00", status: "delayed" } },
            ]}
          />
        </Row>
      </Sec>
      <Sec id="ExternalActor" desc="本サービスのアカウントを持たず、外部システムのIDで記録された人。経営層の利用者と区別する">
        <Row label="アクター（外部ID）"><ExternalActor userId="u-suzuki" role="開発者" /></Row>
        <Row label="提供元を指定"><ExternalActor userId="u-sato" provider="githubProjects" handle="msato-dev" role="PM" /></Row>
        <Row label="利用者（アカウントあり）"><ExternalActor userId="u-kimura" /></Row>
        <Row label="名前のみ"><ExternalActor name="中村 拓也" provider="email" handle="nakamura@kakuu-shoji.example" role="顧客" /></Row>
      </Sec>
      <Sec id="CapabilityCell" desc="プロバイダーの能力マトリクス。未対応を隠さない">
        <Row label="4段階"><div className="row"><CapabilityCell level="yes" /><CapabilityCell level="partial" note="状態の投稿のみ。マージ制御は承認ルールで代替" /><CapabilityCell level="planned" /><CapabilityCell level="no" /></div></Row>
      </Sec>
      <Sec id="ConfidenceTag" desc="日付の確度。予測と目標は破線で区別する">
        <Row label="4種"><div className="row"><ConfidenceTag value="committed" /><ConfidenceTag value="target" /><ConfidenceTag value="forecast" /><ConfidenceTag value="actual" /></div></Row>
      </Sec>
      <Sec id="PlanDates" desc="当初・承認済み改訂・予測・実績を別々に表示し、上書きで当初期限を消さない">
        <Row label="遅延予測" block><PlanDates baseline="2026-12-10" forecast="2026-12-17" /></Row>
        <Row label="改訂後に完了" block><PlanDates baseline="2026-09-30" revised="2026-10-09" actual="2026-10-08" /></Row>
        <Row label="小"><PlanDates baseline="2026-12-25" forecast="2026-12-22" compact /></Row>
      </Sec>
      <Sec id="RoadmapTimeline" desc="当初計画（薄い棒）と確約・予測（濃い棒／破線）、マイルストーン・判断期限・会議、今日の線">
        <Row label="例" block>
          <RoadmapTimeline
            from="2026-10-01"
            to="2027-03-31"
            rows={[
              { id: "a", label: "受発注システム刷新", sub: "架空商事", baseline: { start: "2026-10-01", end: "2027-02-26" }, current: { start: "2026-10-01", end: "2027-03-12", confidence: "forecast", tone: "warn" }, markers: [{ date: "2026-12-17", label: "v1.4.0 納入（予測）" }, { date: "2026-12-02", label: "CR-0004 判断期限", kind: "decision" }] },
              { id: "b", label: "会員アプリ API", sub: "架空リテール", baseline: { start: "2026-10-15", end: "2027-01-29" }, current: { start: "2026-10-15", end: "2027-01-29", confidence: "committed", tone: "pass" }, markers: [{ date: "2026-12-09", label: "Go/No-Go", kind: "meeting" }] },
            ]}
          />
        </Row>
      </Sec>
      <Sec id="ResponsibilitySplit" desc="経営の判断と実務の対応を分けて示す。経営層だけでプロセスを代替したように見せない">
        <Row label="例" block>
          <ResponsibilitySplit decide={<ExternalActor userId="u-kimura" />} act={<ExternalActor userId="u-sato" role="PM" />} note="承認は顧客（中村 拓也）が期限付き承認リンクで行う" />
        </Row>
      </Sec>
      <Sec id="vocab-sync" title="語彙（連携・経営）" desc="同期、健全性、経営判断、事業ケース、配信、インシデント、重大度、外部チェックの異常">
        <Row label="同期"><div className="row">{(Object.keys(SYNC_STATUS) as SyncStatus[]).map((k) => <SyncBadge key={k} status={k} />)}</div></Row>
        <VocabRow name="健全性" vocab={HEALTH} />
        <VocabRow name="経営判断" vocab={DECISION_STATUS} />
        <VocabRow name="事業ケース" vocab={CASE_STATUS} />
        <VocabRow name="配信" vocab={DELIVERY_STATUS} />
        <VocabRow name="インシデント" vocab={INCIDENT_STATUS} />
        <VocabRow name="重大度" vocab={SEVERITY} />
        <VocabRow name="チェックの異常" vocab={CHECK_ANOMALY} />
        <Row label="連携先の数"><span className="small muted">{Object.keys(PROVIDERS).length} サービス（予定・非推奨を含む）</span></Row>
      </Sec>
    </>
  );
}
