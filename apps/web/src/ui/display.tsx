// 第5章 5.2 表示部品
import { useState } from "react";
import type { ReactNode } from "react";
import { Icon } from "./icons";
import type { IconName } from "./icons";
import { Link } from "../lib/router";
import { daysUntil, formatDate, formatDateTime, percent, relativeTime } from "../lib/format";
import { EXECUTIVE_ROLES,
  ACTOR_KIND,
  CONTROL_LAYER,
  DATA_CLASS,
  ENFORCEMENT_LEVEL,
  GATE_STATUS,
} from "../lib/vocab";
import type { ActorKind, ControlLayer, DataClass, EnforcementLevel, GateStatus, Role, StatusVocab, Tone } from "../lib/vocab";
import type { GateLetter, GateReason, GateSet, User } from "../lib/types";
import { GATE_LABELS, GATE_NAMES } from "../lib/types";

const toneIcon: Record<Tone, IconName> = {
  pass: "checkCircle",
  fail: "xCircle",
  warn: "alert",
  info: "clock",
  neutral: "circleDashed",
  special: "flag",
};

function cx(...names: unknown[]) {
  return names.filter(Boolean).join(" ");
}
export { cx };

/** StatusBadge: 第2章の状態語彙を表示する。色に加えてアイコンを持つ */
export function StatusBadge({ vocab, size = "md", icon = true }: { vocab: StatusVocab; size?: "sm" | "md" | "lg"; icon?: boolean }) {
  return (
    <span className={cx("badge", `tone-${vocab.tone}`, size === "sm" && "sm", size === "lg" && "lg")}>
      {icon ? <Icon name={toneIcon[vocab.tone]} /> : null}
      {vocab.label}
    </span>
  );
}

/** Tag: 単純なラベル */
export function Tag({ children, tone = "neutral", square, dashed, icon }: { children: ReactNode; tone?: Tone | "primary"; square?: boolean; dashed?: boolean; icon?: IconName }) {
  return (
    <span className={cx("badge", `tone-${tone}`, square && "square", dashed && "dashed")}>
      {icon ? <Icon name={icon} /> : null}
      {children}
    </span>
  );
}

const actorIcon: Record<ActorKind, IconName> = { ci: "cpu", human: "user", ai: "sparkles", system: "circleDashed" };

/** ActorLabel: 判断の主体（CI／人間／AI／システム）。色に頼らずアイコンとラベルで区別する */
export function ActorLabel({ kind, name, iconOnly, size = "md" }: { kind: ActorKind; name?: string; iconOnly?: boolean; size?: "sm" | "md" }) {
  const meta = ACTOR_KIND[kind];
  return (
    <span className={cx("badge", `tone-${meta.tone}`, size === "sm" && "sm", kind === "ai" && "dashed")} title={iconOnly ? `${meta.label}${name ? `: ${name}` : ""}` : undefined}>
      <Icon name={actorIcon[kind]} />
      {iconOnly ? <span className="sr-only">{meta.label}</span> : <span>{meta.label}</span>}
      {!iconOnly && name ? <span style={{ fontWeight: 500, opacity: 0.85 }}>· {name}</span> : null}
    </span>
  );
}

/** Avatar */
export function Avatar({ user, size }: { user?: Pick<User, "initials" | "kind" | "name">; size?: "lg" | "xl" }) {
  if (!user) return <span className={cx("avatar", size)}>?</span>;
  return (
    <span className={cx("avatar", size, user.kind === "external" && "external", user.kind === "agent" && "agent")} title={user.name} aria-hidden>
      {user.initials}
    </span>
  );
}

/** UserChip: アバター、名前、ロール */
export function UserChip({ user, role, plain, showRole = true }: { user?: User; role?: Role | string; plain?: boolean; showRole?: boolean }) {
  if (!user) return <span className="muted">未割当</span>;
  const r = role ?? (user.kind === "agent" ? "AIエージェント" : user.roles[0]);
  return (
    <span className={cx("chip", plain && "plain", user.status === "disabled" && "disabled")}>
      <Avatar user={user} />
      <span className="truncate">{user.name}</span>
      {user.kind === "external" ? <span className="role">（外部）</span> : null}
      {showRole && r ? <span className="role">{r}</span> : null}
    </span>
  );
}

export function AvatarStack({ users, max = 4 }: { users: User[]; max?: number }) {
  return (
    <span className="avatar-stack">
      {users.slice(0, max).map((u) => (
        <Avatar key={u.id} user={u} />
      ))}
      {users.length > max ? <span className="avatar">+{users.length - max}</span> : null}
    </span>
  );
}

/** RoleBadge */
export function RoleBadge({ role }: { role: Role }) {
  const tone: Tone = role === "顧客" || role === "評価者" ? "warn" : role === "パートナー管理者" ? "special" : EXECUTIVE_ROLES.includes(role) ? "info" : "neutral";
  return <span className={cx("badge square", `tone-${tone}`)}>{role}</span>;
}

/** IdLink: REQ-0012 などのIDリンク。マウスを乗せるとタイトルと状態を表示 */
export function IdLink({ id, to, title, status, state = "exists" }: { id: string; to?: string; title?: string; status?: StatusVocab; state?: "exists" | "deleted" | "forbidden" }) {
  const [open, setOpen] = useState(false);
  if (state === "deleted") return <span className="id-link deleted" title="削除済み">{id}</span>;
  if (state === "forbidden") return <span className="id-link forbidden" title="閲覧権限がありません"><Icon name="lock" size={11} /> {id}</span>;
  const inner = to ? <Link to={to} className="id-link">{id}</Link> : <span className="id-link" style={{ color: "var(--primary)" }}>{id}</span>;
  if (!title) return inner;
  return (
    <span style={{ position: "relative", display: "inline-flex" }} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)} onFocus={() => setOpen(true)} onBlur={() => setOpen(false)}>
      {inner}
      {open ? (
        <span className="popover" role="tooltip" style={{ minWidth: 220 }}>
          <span className="stack" style={{ ["--gap" as string]: "6px" }}>
            <span className="id-link">{id}</span>
            <span className="strong" style={{ fontSize: "var(--text-sm)" }}>{title}</span>
            {status ? <StatusBadge vocab={status} size="sm" /> : null}
          </span>
        </span>
      ) : null}
    </span>
  );
}

/** HashDisplay: 先頭8文字を表示し、コピーと全文表示ができる */
export function HashDisplay({ value, label, verified, full: fullInit = false }: { value: string; label?: string; verified?: "match" | "mismatch"; full?: boolean }) {
  const [full, setFull] = useState(fullInit);
  const [copied, setCopied] = useState(false);
  if (!value) return <span className="muted">—</span>;
  const copy = () => {
    void navigator.clipboard?.writeText(value).catch(() => undefined);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };
  return (
    <span className={cx("hash", full && "full", verified)}>
      {label ? <span className="muted" style={{ fontFamily: "var(--font-sans)" }}>{label}</span> : null}
      {verified === "match" ? <Icon name="checkCircle" size={13} className="text-pass" label="一致" /> : null}
      {verified === "mismatch" ? <Icon name="alert" size={13} className="text-fail" label="不一致" /> : null}
      <span className="value" title={value}>{full ? value : `${value.slice(0, 8)}…`}</span>
      <button type="button" className="btn ghost icon sm" onClick={() => setFull((v) => !v)} aria-label={full ? "短く表示" : "全文を表示"}>
        <Icon name={full ? "eyeOff" : "eye"} size={13} />
      </button>
      <button type="button" className="btn ghost icon sm" onClick={copy} aria-label="コピー">
        <Icon name={copied ? "check" : "copy"} size={13} />
      </button>
    </span>
  );
}

/** Timestamp: 相対時刻を表示し、マウスを乗せると絶対時刻を表示 */
export function Timestamp({ at, mode = "relative" }: { at: string; mode?: "relative" | "absolute" | "date" }) {
  if (!at) return <span className="muted">—</span>;
  const text = mode === "absolute" ? formatDateTime(at) : mode === "date" ? formatDate(at) : relativeTime(at);
  return (
    <time dateTime={at} title={formatDateTime(at)} className="nowrap">
      {text}
    </time>
  );
}

/** DeadlineIndicator: 期限と残り日数 */
export function DeadlineIndicator({ date, compact }: { date: string; compact?: boolean }) {
  const d = daysUntil(date);
  const tone: Tone = d < 0 ? "fail" : d === 0 ? "fail" : d <= 7 ? "warn" : "neutral";
  const text = d < 0 ? `${-d}日超過` : d === 0 ? "今日まで" : `あと${d}日`;
  return (
    <span className="row nowrap" style={{ ["--gap" as string]: "6px" }}>
      {!compact ? <span className="small">{formatDate(date)}</span> : null}
      <span className={cx("badge sm", `tone-${tone}`)}>
        <Icon name={d <= 0 ? "alertCircle" : "clock"} />
        {text}
      </span>
    </span>
  );
}

/** KeyValueList */
export function KeyValueList({ items, cols, stacked }: { items: { label: ReactNode; value: ReactNode }[]; cols?: 2; stacked?: boolean }) {
  return (
    <dl className={cx("kv", cols === 2 && "cols-2", stacked && "stacked")} style={{ margin: 0 }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: "contents" }}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** StatCard: KPIの数値。onClick/to で絞り込み先へ */
export function StatCard({ label, value, unit, delta, tone, icon, to, loading }: { label: string; value: ReactNode; unit?: string; delta?: ReactNode; tone?: "warn" | "danger" | "good"; icon?: IconName; to?: string; loading?: boolean }) {
  const body = (
    <>
      <span className="stat-label">
        {icon ? <Icon name={icon} size={14} /> : null}
        {label}
      </span>
      {loading ? (
        <span className="skeleton" style={{ height: 30, width: "50%" }} />
      ) : (
        <span className="stat-value">
          {value}
          {unit ? <span className="unit">{unit}</span> : null}
        </span>
      )}
      {delta ? <span className="stat-delta">{delta}</span> : null}
    </>
  );
  const cls = cx("stat", tone);
  if (to) {
    return (
      <Link to={to} className={cls} style={{ textDecoration: "none", color: "inherit" }}>
        {body}
      </Link>
    );
  }
  return <div className={cls}>{body}</div>;
}

/** CoverageMeter: 割合と分子・分母 */
export function CoverageMeter({ value, total, label, compact }: { value: number; total: number; label?: string; compact?: boolean }) {
  const pct = percent(value, total);
  const cls = pct === 100 ? "full" : pct === 0 ? "zero" : pct < 70 ? "low" : "";
  return (
    <div className={cx("meter", cls)} style={compact ? { minWidth: 96 } : undefined}>
      <div className="meter-head">
        <span>{label ?? ""}</span>
        <span>
          <strong>{pct}%</strong> <span>({value}/{total})</span>
        </span>
      </div>
      <div className="bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label ?? "カバレッジ"}>
        <span style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/** GateSummaryStrip: ゲートA〜Dの結果を4つの小さなアイコンで表示 */
export function GateSummaryStrip({ gates }: { gates: GateSet }) {
  const letters: GateLetter[] = ["A", "B", "C", "D"];
  return (
    <span className="gate-strip" aria-label="ゲートの結果">
      {letters.map((l) => {
        const v = GATE_STATUS[gates[l]];
        return (
          <span key={l} className={cx("g", `tone-${v.tone}`)} title={`ゲート${l}（${GATE_LABELS[l]}）: ${v.label}`}>
            {gates[l] === "pass" ? <Icon name="check" size={12} /> : gates[l] === "block" ? <Icon name="x" size={12} /> : gates[l] === "running" ? <span className="spinner" style={{ width: 10, height: 10, borderWidth: 1.5 }} /> : l}
          </span>
        );
      })}
    </span>
  );
}

/** EnforcementBadge: 強制レベル */
export function EnforcementBadge({ level, showDescription }: { level: EnforcementLevel; showDescription?: boolean }) {
  const v = ENFORCEMENT_LEVEL[level];
  return (
    <span className={showDescription ? "row" : "row nowrap"} style={{ ["--gap" as string]: "6px" }} title={v.description}>
      <span className={cx("badge square", `tone-${v.tone}`)}>
        <Icon name="shield" />
        強制: {v.label}
      </span>
      {showDescription ? <span className="small muted">{v.description}</span> : null}
    </span>
  );
}

/** PolicyVersionTag: Control Pack 名とバージョン */
export function PolicyVersionTag({ pack, version, outdated }: { pack?: string; version: string; outdated?: boolean }) {
  return (
    <span className={cx("badge square", outdated ? "tone-warn" : "tone-neutral")} title={outdated ? "新しいバージョンがあります" : "最新"}>
      <Icon name="layers" />
      {pack ? `${pack} ${version}` : version}
      {outdated ? <span style={{ fontWeight: 700 }}>· 更新あり</span> : null}
    </span>
  );
}

export function ControlLayerTag({ layer }: { layer: ControlLayer }) {
  const v = CONTROL_LAYER[layer];
  return <span className={cx("badge square", `tone-${v.tone}`)}>{v.label}</span>;
}

export function DataClassBadge({ value }: { value: DataClass }) {
  const v = DATA_CLASS[value];
  return (
    <span className={cx("badge square", `tone-${v.tone}`)} title={`実行先: ${v.runtime}`}>
      <Icon name="lock" />
      {v.label}
    </span>
  );
}

const signatureMeta = {
  unsigned: { label: "未署名", tone: "neutral" as Tone, icon: "circleDashed" as IconName },
  signed: { label: "署名済み", tone: "info" as Tone, icon: "signature" as IconName },
  verified: { label: "検証成功", tone: "pass" as Tone, icon: "shieldCheck" as IconName },
  failed: { label: "検証失敗", tone: "fail" as Tone, icon: "shieldX" as IconName },
};
export function SignatureBadge({ state, signer, size }: { state: keyof typeof signatureMeta; signer?: string; size?: "lg" }) {
  const m = signatureMeta[state];
  return (
    <span className={cx("badge", `tone-${m.tone}`, size === "lg" && "lg")}>
      <Icon name={m.icon} />
      {m.label}
      {signer ? <span style={{ fontWeight: 500 }}>· {signer}</span> : null}
    </span>
  );
}

const retentionMeta = {
  pending: { label: "未保管", tone: "neutral" as Tone },
  stored: { label: "保管済み（WORM）", tone: "pass" as Tone },
  expiring: { label: "保持期限間近", tone: "warn" as Tone },
};
export function RetentionBadge({ state, until }: { state: keyof typeof retentionMeta; until?: string }) {
  const m = retentionMeta[state];
  return (
    <span className={cx("badge", `tone-${m.tone}`)}>
      <Icon name="archive" />
      {m.label}
      {until && until !== "-" ? <span style={{ fontWeight: 500 }}>· {formatDate(until)}まで</span> : null}
    </span>
  );
}

/** Timeline: 時系列の出来事 */
export type TimelineItem = { id: string; actor: { kind: ActorKind; name: string }; action: ReactNode; target?: ReactNode; at: string; detail?: ReactNode; kind?: "status" | "approval" | "comment" | "ai" | "gate" };
export function Timeline({ items, compact }: { items: TimelineItem[]; compact?: boolean }) {
  return (
    <ol className={cx("timeline", compact && "compact")}>
      {items.map((it) => {
        const tone = ACTOR_KIND[it.actor.kind].tone;
        return (
          <li key={it.id}>
            <span className={cx("dot", `tone-${tone}`)}>
              <Icon name={actorIcon[it.actor.kind]} />
            </span>
            <div className="tl-body">
              <div className="tl-head">
                <ActorLabel kind={it.actor.kind} name={it.actor.name} size="sm" />
                <span className="strong" style={{ fontWeight: 500 }}>{it.action}</span>
                {it.target ? <span>{it.target}</span> : null}
                <span className="muted small">
                  <Timestamp at={it.at} />
                </span>
              </div>
              {it.detail ? <div className="tl-detail">{it.detail}</div> : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/** DiffViewer: 文書の差分 */
export function DiffViewer({ before, after, beforeLabel = "変更前", afterLabel = "変更後", mode = "split" }: { before: string; after: string; beforeLabel?: string; afterLabel?: string; mode?: "split" | "unified" }) {
  const a = before.split("\n");
  const b = after.split("\n");
  const rows: { l?: string; r?: string; type: "same" | "change" }[] = [];
  const max = Math.max(a.length, b.length);
  for (let i = 0; i < max; i += 1) {
    if (a[i] === b[i]) rows.push({ l: a[i], r: b[i], type: "same" });
    else rows.push({ l: a[i], r: b[i], type: "change" });
  }
  if (before === after) {
    return <div className="diff"><div className="diff-cell" style={{ padding: 16, fontFamily: "var(--font-sans)" }}><span className="muted">変更はありません</span></div></div>;
  }
  if (mode === "unified") {
    return (
      <div className="diff unified">
        <div className="diff-head"><div>{beforeLabel} → {afterLabel}</div></div>
        {rows.flatMap((row, i) =>
          row.type === "same"
            ? [<div key={`s${i}`} className="diff-row"><div className="diff-cell"><span className="sign" /> {row.l}</div></div>]
            : [
                row.l !== undefined ? <div key={`d${i}`} className="diff-row"><div className="diff-cell del"><span className="sign">−</span>{row.l}</div></div> : null,
                row.r !== undefined ? <div key={`a${i}`} className="diff-row"><div className="diff-cell add"><span className="sign">+</span>{row.r}</div></div> : null,
              ],
        )}
      </div>
    );
  }
  return (
    <div className="diff">
      <div className="diff-head"><div>{beforeLabel}</div><div>{afterLabel}</div></div>
      {rows.map((row, i) => (
        <div key={i} className="diff-row">
          <div className={cx("diff-cell", row.type === "change" && (row.l === undefined ? "empty" : "del"))}>{row.type === "change" && row.l !== undefined ? <span className="sign">−</span> : null}{row.l}</div>
          <div className={cx("diff-cell", row.type === "change" && (row.r === undefined ? "empty" : "add"))}>{row.type === "change" && row.r !== undefined ? <span className="sign">+</span> : null}{row.r}</div>
        </div>
      ))}
    </div>
  );
}

/** MarkdownViewer: 簡易な Markdown 表示（見出し、箇条書き、表、コード、引用） */
export function MarkdownViewer({ source, collapsible, highlights, activeHighlight, onHighlightClick }: { source: string; collapsible?: boolean; highlights?: string[]; activeHighlight?: string; onHighlightClick?: (text: string) => void }) {
  const [collapsed, setCollapsed] = useState(Boolean(collapsible));
  const inline = (text: string, key: string): ReactNode[] => {
    const parts: ReactNode[] = [];
    let rest = text;
    let n = 0;
    const hl = highlights?.filter(Boolean) ?? [];
    while (rest.length) {
      const codeIdx = rest.indexOf("`");
      const boldIdx = rest.indexOf("**");
      const hlHit = hl.map((h) => ({ h, i: rest.indexOf(h) })).filter((x) => x.i >= 0).sort((x, y) => x.i - y.i)[0];
      const linkHit = /\[([^\]]+)\]\(([^)\s]+)\)/.exec(rest);
      const candidates = [codeIdx >= 0 ? codeIdx : Infinity, boldIdx >= 0 ? boldIdx : Infinity, hlHit ? hlHit.i : Infinity, linkHit ? linkHit.index : Infinity];
      const first = Math.min(...candidates);
      if (first === Infinity) {
        parts.push(rest);
        break;
      }
      if (first > 0) parts.push(rest.slice(0, first));
      rest = rest.slice(first);
      if (linkHit && first === linkHit.index && !(hlHit && hlHit.i === first)) {
        const [whole, text, url] = linkHit;
        parts.push(
          url.startsWith("#/") ? (
            <a key={`${key}-l${n++}`} href={url}>{text}</a>
          ) : (
            <a key={`${key}-l${n++}`} href={url} onClick={(e) => e.preventDefault()} title={url}>{text}</a>
          ),
        );
        rest = rest.slice(whole.length);
      } else if (hlHit && first === hlHit.i) {
        const h = hlHit.h;
        parts.push(
          <mark key={`${key}-h${n++}`} className={cx(activeHighlight === h && "active")} onClick={() => onHighlightClick?.(h)}>
            {h}
          </mark>,
        );
        rest = rest.slice(h.length);
      } else if (rest.startsWith("**")) {
        const end = rest.indexOf("**", 2);
        if (end < 0) { parts.push(rest); break; }
        parts.push(<strong key={`${key}-b${n++}`}>{rest.slice(2, end)}</strong>);
        rest = rest.slice(end + 2);
      } else {
        const end = rest.indexOf("`", 1);
        if (end < 0) { parts.push(rest); break; }
        parts.push(<code key={`${key}-c${n++}`}>{rest.slice(1, end)}</code>);
        rest = rest.slice(end + 1);
      }
    }
    return parts;
  };
  const lines = source.split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const key = `b${i}`;
    if (line.startsWith("```")) {
      const body: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i].startsWith("```")) body.push(lines[i++]);
      i += 1;
      blocks.push(<pre key={key}><code>{body.join("\n")}</code></pre>);
      continue;
    }
    if (/^#{1,3} /.test(line)) {
      const level = line.match(/^#+/)![0].length;
      const text = line.replace(/^#+ /, "");
      blocks.push(level === 1 ? <h1 key={key}>{inline(text, key)}</h1> : level === 2 ? <h2 key={key}>{inline(text, key)}</h2> : <h3 key={key}>{inline(text, key)}</h3>);
      i += 1;
      continue;
    }
    if (/^\s*[-*] /.test(line) || /^\s*\d+\. /.test(line)) {
      const ordered = /^\s*\d+\. /.test(line);
      const items: string[] = [];
      while (i < lines.length && (/^\s*[-*] /.test(lines[i]) || /^\s*\d+\. /.test(lines[i]))) items.push(lines[i++].replace(/^\s*([-*]|\d+\.) /, ""));
      const lis = items.map((t, j) => <li key={j}>{inline(t, `${key}-${j}`)}</li>);
      blocks.push(ordered ? <ol key={key}>{lis}</ol> : <ul key={key}>{lis}</ul>);
      continue;
    }
    if (line.startsWith("|")) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i].startsWith("|")) {
        const cells = lines[i].split("|").slice(1, -1).map((c) => c.trim());
        if (!cells.every((c) => /^:?-+:?$/.test(c))) rows.push(cells);
        i += 1;
      }
      const [head, ...body] = rows;
      blocks.push(
        <div key={key} className="table-wrap">
          <table>
            <thead><tr>{head.map((c, j) => <th key={j}>{inline(c, `${key}-h${j}`)}</th>)}</tr></thead>
            <tbody>{body.map((r, j) => <tr key={j}>{r.map((c, k) => <td key={k}>{inline(c, `${key}-${j}-${k}`)}</td>)}</tr>)}</tbody>
          </table>
        </div>,
      );
      continue;
    }
    if (line.startsWith("> ")) {
      blocks.push(<blockquote key={key}>{inline(line.slice(2), key)}</blockquote>);
      i += 1;
      continue;
    }
    if (line.trim() === "") {
      i += 1;
      continue;
    }
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() !== "" && !/^(#{1,3} |\s*[-*] |\s*\d+\. |\||> |```)/.test(lines[i])) para.push(lines[i++]);
    blocks.push(<p key={key}>{inline(para.join(" "), key)}</p>);
  }
  return (
    <div>
      <div className={cx("md", collapsed && "collapsed")}>{blocks}</div>
      {collapsible ? (
        <button type="button" className="btn ghost sm" onClick={() => setCollapsed((v) => !v)} style={{ marginTop: 6 }}>
          <Icon name={collapsed ? "chevronDown" : "chevronUp"} size={13} />
          {collapsed ? "すべて表示" : "折りたたむ"}
        </button>
      ) : null}
    </div>
  );
}

/** JsonViewer: 整形表示、折りたたみ、コピー */
export function JsonViewer({ value }: { value: unknown }) {
  const [copied, setCopied] = useState(false);
  const render = (v: unknown, key: string): ReactNode => {
    if (v === null) return <span className="b">null</span>;
    if (typeof v === "string") return <span className="s">"{v}"</span>;
    if (typeof v === "number") return <span className="n">{v}</span>;
    if (typeof v === "boolean") return <span className="b">{String(v)}</span>;
    if (Array.isArray(v)) {
      if (v.length === 0) return <span>[]</span>;
      return (
        <details open>
          <summary>[ <span className="muted">{v.length}件</span></summary>
          <div className="indent">
            {v.map((item, i) => (
              <div key={`${key}-${i}`}>{render(item, `${key}-${i}`)}{i < v.length - 1 ? "," : ""}</div>
            ))}
          </div>
          ]
        </details>
      );
    }
    const entries = Object.entries(v as Record<string, unknown>);
    return (
      <details open>
        <summary>{"{"}</summary>
        <div className="indent">
          {entries.map(([k, val], i) => (
            <div key={`${key}-${k}`}>
              <span className="k">"{k}"</span>: {render(val, `${key}-${k}`)}
              {i < entries.length - 1 ? "," : ""}
            </div>
          ))}
        </div>
        {"}"}
      </details>
    );
  };
  return (
    <div className="stack" style={{ ["--gap" as string]: "8px" }}>
      <div className="row end">
        <button type="button" className="btn secondary sm" onClick={() => { void navigator.clipboard?.writeText(JSON.stringify(value, null, 2)).catch(() => undefined); setCopied(true); window.setTimeout(() => setCopied(false), 1200); }}>
          <Icon name={copied ? "check" : "copy"} size={13} />
          {copied ? "コピーしました" : "JSON をコピー"}
        </button>
      </div>
      <pre className="json">{render(value, "root")}</pre>
    </div>
  );
}

/** CodeRef: リポジトリ、PR、コミット、ファイルへの GitHub リンク（モックでは外部に遷移しない） */
export function CodeRef({ kind, repo, value, line }: { kind: "pr" | "commit" | "file" | "repo"; repo?: string; value: string; line?: number }) {
  const icon: IconName = kind === "pr" ? "pullRequest" : kind === "commit" ? "commit" : kind === "repo" ? "github" : "file";
  const text = kind === "pr" ? `#${value}` : kind === "commit" ? value.slice(0, 7) : kind === "file" && line ? `${value}:${line}` : value;
  return (
    <span className="row nowrap" style={{ ["--gap" as string]: "4px", fontSize: "var(--text-xs)" }} title={repo ? `${repo} ${text}` : text}>
      <Icon name={icon} size={13} className="muted" />
      {repo && kind !== "repo" ? <span className="muted">{repo.split("/")[1]}</span> : null}
      <a href="#" onClick={(e) => e.preventDefault()} className="mono">{text}</a>
      <Icon name="external" size={11} className="muted" />
    </span>
  );
}

/** ChecklistPanel: 充足状態と根拠、判定の主体 */
export type ChecklistItem = { id: string; title: string; state: "ok" | "ng" | "pending"; detail?: ReactNode; actor?: ActorKind; link?: ReactNode };
export function ChecklistPanel({ items, title }: { items: ChecklistItem[]; title?: string }) {
  const ok = items.filter((i) => i.state === "ok").length;
  return (
    <div className="stack" style={{ ["--gap" as string]: "6px" }}>
      {title ? (
        <div className="row between">
          <span className="section-title" style={{ fontSize: "var(--text-sm)" }}>{title}</span>
          <span className={cx("badge sm", ok === items.length ? "tone-pass" : "tone-warn")}>{ok}/{items.length} 充足</span>
        </div>
      ) : null}
      <ul className="checklist">
        {items.map((item) => (
          <li key={item.id}>
            <Icon name={item.state === "ok" ? "checkCircle" : item.state === "ng" ? "xCircle" : "clock"} className={cx("ci", item.state)} size={18} />
            <div className="stack" style={{ ["--gap" as string]: "2px" }}>
              <span className="cl-title">{item.title}</span>
              {item.detail ? <span className="cl-detail">{item.detail}</span> : null}
              {item.link ? <span className="cl-detail">{item.link}</span> : null}
            </div>
            {item.actor ? <ActorLabel kind={item.actor} iconOnly size="sm" /> : <span />}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** EmptyState */
export function EmptyState({ icon = "inbox", title, description, action, variant = "initial" }: { icon?: IconName; title: string; description?: ReactNode; action?: ReactNode; variant?: "initial" | "filtered" | "forbidden" }) {
  const ic: IconName = variant === "filtered" ? "search" : variant === "forbidden" ? "lock" : icon;
  return (
    <div className="empty">
      <span className="empty-icon"><Icon name={ic} /></span>
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
      {action ? <div style={{ marginTop: 8 }}>{action}</div> : null}
    </div>
  );
}

/** Skeleton */
export function Skeleton({ variant = "table", rows = 5 }: { variant?: "table" | "card" | "detail"; rows?: number }) {
  if (variant === "card") {
    return (
      <div className="grid cols-3">
        {Array.from({ length: rows > 3 ? 3 : rows }).map((_, i) => (
          <div key={i} className="card stack" style={{ ["--gap" as string]: "10px" }}>
            <span className="skeleton" style={{ height: 16, width: "60%" }} />
            <span className="skeleton" style={{ height: 12, width: "40%" }} />
            <span className="skeleton" style={{ height: 40 }} />
          </div>
        ))}
      </div>
    );
  }
  if (variant === "detail") {
    return (
      <div className="detail">
        <div className="card stack">
          <span className="skeleton" style={{ height: 20, width: "40%" }} />
          {Array.from({ length: rows }).map((_, i) => <span key={i} className="skeleton" style={{ height: 12, width: `${90 - i * 8}%` }} />)}
        </div>
        <div className="card stack">
          <span className="skeleton" style={{ height: 14, width: "50%" }} />
          <span className="skeleton" style={{ height: 60 }} />
        </div>
      </div>
    );
  }
  return (
    <div className="card flush" aria-busy="true" aria-label="読み込み中">
      <div className="table-toolbar"><span className="skeleton" style={{ height: 14, width: 160 }} /></div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="row" style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", ["--gap" as string]: "16px" }}>
          <span className="skeleton" style={{ height: 12, width: 80 }} />
          <span className="skeleton" style={{ height: 12, flex: 1 }} />
          <span className="skeleton" style={{ height: 12, width: 60 }} />
          <span className="skeleton" style={{ height: 12, width: 90 }} />
        </div>
      ))}
    </div>
  );
}

/** ErrorState */
export function ErrorState({ title = "データを取得できませんでした", description = "時間をおいて再試行してください。解決しない場合は問い合わせ用IDを添えてご連絡ください。", requestId = "req-7f3a91c2", onRetry }: { title?: string; description?: string; requestId?: string; onRetry?: () => void }) {
  return (
    <div className="card">
      <div className="empty">
        <span className="empty-icon" style={{ background: "var(--tone-fail-bg)", color: "var(--tone-fail)" }}><Icon name="alertCircle" /></span>
        <h3>{title}</h3>
        <p>{description}</p>
        <p className="mono">問い合わせ用ID: {requestId}</p>
        <button type="button" className="btn secondary" onClick={onRetry} style={{ marginTop: 8 }}>
          <Icon name="refresh" size={14} />
          再試行
        </button>
      </div>
    </div>
  );
}

/** Banner: 情報、成功、警告、危険 */
export function Banner({ tone = "info", title, children, onClose, action }: { tone?: "info" | "pass" | "warn" | "fail"; title?: ReactNode; children?: ReactNode; onClose?: () => void; action?: ReactNode }) {
  const icon: IconName = tone === "pass" ? "checkCircle" : tone === "warn" ? "alert" : tone === "fail" ? "alertCircle" : "info";
  return (
    <div className={cx("banner", `tone-${tone}`)} role={tone === "fail" || tone === "warn" ? "alert" : "status"}>
      <Icon name={icon} />
      <div className="banner-body">
        {title ? <div className="banner-title">{title}</div> : null}
        {children ? <div>{children}</div> : null}
      </div>
      {action}
      {onClose ? (
        <button type="button" className="banner-close" onClick={onClose} aria-label="閉じる">
          <Icon name="x" size={15} />
        </button>
      ) : null}
    </div>
  );
}

/** Tooltip */
export function Tooltip({ text, children }: { text: ReactNode; children: ReactNode }) {
  return (
    <span className="tooltip-host">
      {children}
      <span className="tooltip" role="tooltip">{text}</span>
    </span>
  );
}

/** Accordion */
export function Accordion({ items, defaultOpen }: { items: { title: ReactNode; body: ReactNode }[]; defaultOpen?: number }) {
  return (
    <div className="accordion">
      {items.map((item, i) => (
        <details key={i} open={defaultOpen === i}>
          <summary>
            <span>{item.title}</span>
            <Icon name="chevronDown" />
          </summary>
          <div className="acc-body">{item.body}</div>
        </details>
      ))}
    </div>
  );
}

/** StateFlow: 状態遷移図（現在の状態を強調） */
export const FLOWS = {
  requirement: { main: ["下書き", "レビュー中", "承認待ち", "承認済み"], branches: ["変更中", "廃止"] },
  design: { main: ["下書き", "レビュー中", "承認待ち", "承認済み"], branches: ["変更中", "廃止"] },
  change: { main: ["起票", "影響分析中", "承認待ち", "承認済み", "反映済み"], branches: ["却下"] },
  exception: { main: ["申請中", "有効", "期限切れ"], branches: ["却下", "取り下げ"] },
  release: { main: ["準備中", "ゲート確認中", "承認待ち", "リリース済み", "受入済み"], branches: ["差戻し"] },
};
export function StateFlow({ flow, current }: { flow: keyof typeof FLOWS; current: string }) {
  const f = FLOWS[flow];
  const idx = f.main.indexOf(current);
  return (
    <div className="state-flow" aria-label={`現在の状態: ${current}`}>
      {f.main.map((s, i) => (
        <span key={s} className="row nowrap" style={{ ["--gap" as string]: "4px" }}>
          <span className={cx("node", i < idx && "past", s === current && "current")}>{s}</span>
          {i < f.main.length - 1 ? <span className="arrow">→</span> : null}
        </span>
      ))}
      <span className="branch">／</span>
      {f.branches.map((s) => (
        <span key={s} className={cx("node", s === current && "current")}>{s}</span>
      ))}
    </div>
  );
}

/** GateResultPanel: ゲート1つ分の詳細 */
export function GateResultPanel({ letter, status, reasons, enforcement, policyVersion, onException }: { letter: GateLetter; status: GateStatus; reasons: GateReason[]; enforcement: EnforcementLevel; policyVersion: string; onException?: (reason: GateReason) => void }) {
  const v = GATE_STATUS[status];
  return (
    <section className={cx("gate-panel", status === "block" && "block")} aria-label={`ゲート${letter}`}>
      <div className="gate-panel-head">
        <span className={cx("gate-letter", `tone-${v.tone}`)}>{letter}</span>
        <div className="grow">
          <div className="strong">ゲート{letter}: {GATE_LABELS[letter]}</div>
          <div className="tiny muted">{GATE_NAMES[letter]} · {policyVersion}</div>
        </div>
        <ActorLabel kind="ci" size="sm" />
        <EnforcementBadge level={enforcement} />
        <StatusBadge vocab={v} />
      </div>
      {status === "running" ? (
        <div className="row" style={{ padding: 16 }}><span className="spinner" /> <span className="muted">判定を実行しています…</span></div>
      ) : status === "notRun" ? (
        <div style={{ padding: 16 }} className="muted small">前のゲートの完了を待っています。</div>
      ) : reasons.length === 0 ? (
        <div className="row" style={{ padding: 16 }}><Icon name="checkCircle" className="text-pass" /> <span>すべてのルールを満たしています。</span></div>
      ) : (
        reasons.map((r) => (
          <div key={r.rule_id + r.message} className="gate-reason">
            <Icon name={r.result === "pass" ? "checkCircle" : r.result === "warn" ? "alert" : "xCircle"} className={cx("ri", r.result === "pass" ? "text-pass" : r.result === "warn" ? "text-warn" : "text-fail")} />
            <div className="stack" style={{ ["--gap" as string]: "4px" }}>
              <div className="row" style={{ ["--gap" as string]: "8px" }}>
                <span className="mono small muted">{r.rule_id}</span>
                <span className="strong" style={{ fontWeight: 500 }}>{r.message}</span>
              </div>
              {r.target ? <div className="small muted">対象: <span className="mono">{r.target}</span></div> : null}
              {r.fix ? (
                <div className="fix">
                  <strong>修正方法:</strong> {r.fix}
                </div>
              ) : null}
            </div>
            <div>
              {r.result === "block" && r.exception_allowed && enforcement === "soft" ? (
                <button type="button" className="btn secondary sm" onClick={() => onException?.(r)}>
                  <Icon name="flag" size={13} />
                  例外を申請
                </button>
              ) : r.result === "block" && enforcement === "hard" ? (
                <span className="tiny muted">ハードのため例外不可</span>
              ) : null}
            </div>
          </div>
        ))
      )}
    </section>
  );
}

/** Section: カードの見出し付き領域 */
export function Section({ title, sub, actions, children, flush, id }: { title: ReactNode; sub?: ReactNode; actions?: ReactNode; children: ReactNode; flush?: boolean; id?: string }) {
  return (
    <section className="card flush" id={id}>
      <div className="card-header">
        <div>
          <h2 className="section-title">{title}</h2>
          {sub ? <p className="section-sub">{sub}</p> : null}
        </div>
        {actions ? <div className="row">{actions}</div> : null}
      </div>
      {flush ? children : <div className="card-body">{children}</div>}
    </section>
  );
}

/** PhaseBand: フェーズの帯 */
export function PhaseBand({ phases, current }: { phases: { key: string; label: string }[]; current: string }) {
  const idx = phases.findIndex((p) => p.key === current);
  return (
    <div className="phase-band" aria-label="フェーズ">
      {phases.map((p, i) => (
        <span key={p.key} className={cx("ph", i < idx && "done", i === idx && "current")} aria-current={i === idx ? "step" : undefined}>
          {i < idx ? "✓ " : ""}
          {p.label}
        </span>
      ))}
    </div>
  );
}
