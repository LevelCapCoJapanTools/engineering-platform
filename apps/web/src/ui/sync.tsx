// 連携・同期・経営表示の共通部品（2026-11-28 追加）。
// 経営向けの値は既存システムから同期したものなので、出典（正本）と鮮度を必ず一緒に見せる。
import type { ReactNode } from "react";
import type { ProviderKey, StatusVocab, SyncStatus, CapabilityLevel, DateConfidence } from "../lib/vocab";
import { CAPABILITY, CONNECTOR_CATEGORY, DATE_CONFIDENCE, PROVIDERS, SYNC_STATUS } from "../lib/vocab";
import type { SourceRef } from "../lib/types";
import { daysBetween, formatDate, minutesSince, relativeTime } from "../lib/format";
import { userById } from "../mocks/core";
import { Icon } from "./icons";
import type { IconName } from "./icons";
import { cx, StatusBadge, Tag, Tooltip } from "./display";

const CATEGORY_ICON: Record<string, IconName> = {
  scm: "branch",
  ci: "cpu",
  planning: "list",
  calendar: "calendar",
  chat: "message",
  oncall: "phone",
  storage: "archive",
  idp: "key",
};

/** 連携先のサービス名。アイコンは種類（コードホスティング、カレンダー等）で決まる */
export function ProviderBadge({ provider, size = "md", showStatus }: { provider: ProviderKey; size?: "sm" | "md"; showStatus?: boolean }) {
  const p = PROVIDERS[provider];
  return (
    <span className={cx("provider-badge", size === "sm" && "sm")} title={`${CONNECTOR_CATEGORY[p.category].label}: ${p.label}`}>
      <Icon name={provider === "github" || provider === "githubActions" || provider === "githubProjects" ? "github" : CATEGORY_ICON[p.category]} size={size === "sm" ? 12 : 14} />
      <span>{p.label}</span>
      {showStatus && p.status !== "available" ? (
        <Tag tone={p.status === "deprecated" ? "fail" : p.status === "beta" ? "info" : "neutral"} square>
          {p.status === "beta" ? "ベータ" : p.status === "planned" ? "予定" : "非推奨"}
        </Tag>
      ) : null}
    </span>
  );
}

/** 鮮度のしきい値（分）。これを超えたら「古い情報」として警告する */
export const STALE_MINUTES = 60;

/** 同期の鮮度。最終成功からの経過と状態を併記し、古い情報を最新と誤認させない */
export function Freshness({ at, status, compact }: { at?: string; status?: SyncStatus; compact?: boolean }) {
  const mins = minutesSince(at);
  const effective: SyncStatus = status && status !== "healthy" ? status : mins > STALE_MINUTES ? "stale" : "healthy";
  const vocab = SYNC_STATUS[effective];
  const text = at ? `${relativeTime(at)}に同期` : "未同期";
  if (compact) {
    return (
      <span className={cx("freshness", `tone-${vocab.tone}`)} title={`${vocab.label}・${text}`}>
        <span className="freshness-dot" aria-hidden />
        <span>{at ? relativeTime(at) : "未同期"}</span>
      </span>
    );
  }
  return (
    <span className={cx("freshness", `tone-${vocab.tone}`)}>
      <span className="freshness-dot" aria-hidden />
      <span>{text}</span>
      {effective !== "healthy" ? <span className="freshness-label">（{vocab.label}）</span> : null}
    </span>
  );
}

/** データの出典（正本）。「正本: GitHub Projects · 10分前に同期」 */
export function SourceTag({ source, prefix = "正本", compact }: { source: SourceRef; prefix?: string; compact?: boolean }) {
  return (
    <span className="source-tag">
      <span className="tiny muted">{prefix}</span>
      <ProviderBadge provider={source.provider} size="sm" />
      {source.label ? <span className="tiny muted">{source.label}</span> : null}
      {source.url ? (
        <a href={source.url} className="tiny" target="_blank" rel="noreferrer" aria-label="正本で開く"><Icon name="external" size={12} /></a>
      ) : null}
      <Freshness at={source.synced_at} status={source.status} compact={compact} />
    </span>
  );
}

/** 同期が止まっている・古いときの帯。経営向け画面の上部に置く */
export function StaleDataNotice({ sources, action }: { sources: { name: string; source: SourceRef }[]; action?: ReactNode }) {
  const bad = sources.filter((s) => (s.source.status && s.source.status !== "healthy") || minutesSince(s.source.synced_at) > STALE_MINUTES);
  if (bad.length === 0) return null;
  return (
    <div className="banner tone-warn" role="status">
      <Icon name="alert" />
      <div className="stack" style={{ ["--gap" as string]: "4px", flex: 1 }}>
        <strong>一部のデータが最新ではありません</strong>
        <span className="small">
          {bad.map((b, i) => (
            <span key={b.name}>
              {i > 0 ? "、" : ""}
              {b.name}（{PROVIDERS[b.source.provider].label}・{b.source.synced_at ? `${relativeTime(b.source.synced_at)}に同期` : "未同期"}
              {b.source.status && b.source.status !== "healthy" ? `・${SYNC_STATUS[b.source.status].label}` : ""}）
            </span>
          ))}
          。表示中の値は最終同期時点のものです。
        </span>
      </div>
      {action}
    </div>
  );
}

/** 外部IDで記録された人。本サービスのアカウントを持たないアクターを区別して表示する */
export function ExternalActor({ userId, name, provider, handle, role }: { userId?: string; name?: string; provider?: ProviderKey; handle?: string; role?: string }) {
  const u = userById(userId);
  const ext = provider ? { provider, handle } : u?.external_ids?.[0];
  const label = u?.name ?? name ?? "不明";
  const tip = [role, ext ? `${PROVIDERS[ext.provider].label}: ${ext.handle ?? "—"}` : undefined, u && u.account === false ? "本サービスのアカウントなし（外部IDで記録）" : undefined].filter(Boolean).join(" / ");
  return (
    <span className="external-actor" title={tip}>
      <span className="avatar sm" aria-hidden>{u?.initials ?? label.slice(0, 1)}</span>
      <span>{label}</span>
      {ext ? <span className="tiny muted mono">{ext.handle ?? ""}</span> : null}
      {u && u.account === false ? <Tag square dashed>外部ID</Tag> : null}
    </span>
  );
}

/** 対応度（プロバイダーの能力マトリクス用） */
export function CapabilityCell({ level, note }: { level: CapabilityLevel; note?: string }) {
  const v = CAPABILITY[level];
  const icon: IconName = level === "yes" ? "check" : level === "partial" ? "minus" : level === "planned" ? "clock" : "x";
  const cell = (
    <span className={cx("capability", `tone-${v.tone}`)}>
      <Icon name={icon} size={13} label={v.label} />
      <span className="sr-only">{v.label}</span>
    </span>
  );
  return note ? <Tooltip text={note}>{cell}</Tooltip> : cell;
}

/** 日付の確度（確約・目標・予測・実績） */
export function ConfidenceTag({ value }: { value: DateConfidence }) {
  const v: StatusVocab = DATE_CONFIDENCE[value];
  return <Tag tone={v.tone} square dashed={value === "forecast" || value === "target"}>{v.label}</Tag>;
}

/** 当初・改訂・予測・実績の日付と、当初からのずれ */
export function PlanDates({ baseline, revised, forecast, actual, compact }: { baseline: string; revised?: string; forecast?: string; actual?: string; compact?: boolean }) {
  const current = actual ?? forecast ?? revised ?? baseline;
  const slip = daysBetween(revised ?? baseline, current);
  const slipFromBaseline = daysBetween(baseline, current);
  const slipNode = slip > 0 ? <Tag tone="fail" square>+{slip}日</Tag> : slip < 0 ? <Tag tone="pass" square>{slip}日</Tag> : <Tag square>計画どおり</Tag>;
  if (compact) {
    return (
      <span className="plan-dates compact">
        <span className="strong">{formatDate(current)}</span>
        <span className="tiny muted">{actual ? "実績" : forecast ? "予測" : "計画"}</span>
        {slipNode}
      </span>
    );
  }
  return (
    <dl className="plan-dates">
      <div><dt>当初</dt><dd>{formatDate(baseline)}</dd></div>
      <div><dt>承認済み改訂</dt><dd>{revised ? formatDate(revised) : "—"}</dd></div>
      <div><dt>予測</dt><dd>{forecast ? formatDate(forecast) : "—"}</dd></div>
      <div><dt>実績</dt><dd>{actual ? formatDate(actual) : "—"}</dd></div>
      <div><dt>ずれ</dt><dd>{slipNode}{revised && slipFromBaseline !== slip ? <span className="tiny muted">（当初比 {slipFromBaseline > 0 ? "+" : ""}{slipFromBaseline}日）</span> : null}</dd></div>
    </dl>
  );
}

export type TimelineRow = {
  id: string;
  label: ReactNode;
  sub?: ReactNode;
  /** 当初計画の期間（薄い棒） */
  baseline?: { start: string; end: string };
  /** 現在の予測・確約の期間（濃い棒） */
  current?: { start: string; end: string; confidence?: DateConfidence; tone?: "pass" | "warn" | "fail" | "info" };
  markers?: { date: string; label: string; kind?: "milestone" | "decision" | "meeting" | "cancelled" }[];
};

/** 横棒のロードマップ。当初計画（薄い棒）と予測（濃い棒）、マイルストーン、今日の線を描く */
export function RoadmapTimeline({ rows, from, to, ariaLabel = "ロードマップ" }: { rows: TimelineRow[]; from: string; to: string; ariaLabel?: string }) {
  const total = Math.max(1, daysBetween(from, to));
  const pos = (d: string) => `${Math.min(100, Math.max(0, (daysBetween(from, d) / total) * 100))}%`;
  const width = (a: string, b: string) => `${Math.max(0.8, (Math.max(0, daysBetween(a, b)) / total) * 100)}%`;
  const months: string[] = [];
  const start = new Date(`${from}T00:00:00+09:00`);
  for (let d = new Date(start.getFullYear(), start.getMonth(), 1); d <= new Date(`${to}T00:00:00+09:00`); d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) {
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
    if (iso >= from) months.push(iso);
  }
  const today = "2026-11-27";
  return (
    <div className="roadmap table-wrap" role="table" aria-label={ariaLabel}>
      <div className="roadmap-inner">
        <div className="roadmap-head" role="row">
          <div className="roadmap-label" role="columnheader">項目</div>
          <div className="roadmap-track" role="columnheader">
            {months.map((m) => (
              <span key={m} className="roadmap-month" style={{ left: pos(m) }}>{Number(m.slice(5, 7))}月</span>
            ))}
          </div>
        </div>
        {rows.map((r) => (
          <div key={r.id} className="roadmap-row" role="row">
            <div className="roadmap-label" role="cell">
              <div className="strong small">{r.label}</div>
              {r.sub ? <div className="tiny muted">{r.sub}</div> : null}
            </div>
            <div className="roadmap-track" role="cell">
              {months.map((m) => <span key={m} className="roadmap-grid" style={{ left: pos(m) }} />)}
              {today >= from && today <= to ? <span className="roadmap-today" style={{ left: pos(today) }} title="今日" /> : null}
              {r.baseline ? <span className="roadmap-bar baseline" style={{ left: pos(r.baseline.start), width: width(r.baseline.start, r.baseline.end) }} title={`当初: ${formatDate(r.baseline.start)}〜${formatDate(r.baseline.end)}`} /> : null}
              {r.current ? (
                <span
                  className={cx("roadmap-bar current", `tone-${r.current.tone ?? "info"}`, (r.current.confidence === "forecast" || r.current.confidence === "target") && "dashed")}
                  style={{ left: pos(r.current.start), width: width(r.current.start, r.current.end) }}
                  title={`${r.current.confidence ? DATE_CONFIDENCE[r.current.confidence].label : "現在"}: ${formatDate(r.current.start)}〜${formatDate(r.current.end)}`}
                />
              ) : null}
              {r.markers?.map((m) => (
                <span key={`${m.date}-${m.label}`} className={cx("roadmap-marker", m.kind ?? "milestone")} style={{ left: pos(m.date) }} title={`${m.label}（${formatDate(m.date)}）`} />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="roadmap-legend tiny muted">
        <span><span className="roadmap-swatch baseline" />当初計画</span>
        <span><span className="roadmap-swatch current" />確約・実績</span>
        <span><span className="roadmap-swatch current dashed" />予測・目標</span>
        <span><span className="roadmap-marker-swatch milestone" />マイルストーン</span>
        <span><span className="roadmap-marker-swatch decision" />判断期限</span>
        <span><span className="roadmap-marker-swatch meeting" />会議</span>
        <span><span className="roadmap-today-swatch" />今日</span>
      </div>
    </div>
  );
}

/** 同期状態のバッジ */
export function SyncBadge({ status, size = "sm" }: { status: SyncStatus; size?: "sm" | "md" }) {
  return <StatusBadge vocab={SYNC_STATUS[status]} size={size} />;
}

/** 経営向けの「誰が決めるか／誰が対応するか」を分けて示す */
export function ResponsibilitySplit({ decide, act, note }: { decide: ReactNode; act: ReactNode; note?: ReactNode }) {
  return (
    <div className="responsibility-split">
      <div><span className="tiny muted">判断</span><div>{decide}</div></div>
      <div><span className="tiny muted">実務の対応</span><div>{act}</div></div>
      {note ? <div className="tiny muted" style={{ gridColumn: "1 / -1" }}>{note}</div> : null}
    </div>
  );
}
