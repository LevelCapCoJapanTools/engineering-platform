// 「経営: 投資と配分」画面群のローカル部品
import "./portfolio.css";
import type { ReactNode } from "react";
import { userById } from "../../mocks/core";
import { cx, Tag } from "../../ui";

export function userName(id?: string) {
  return userById(id)?.name ?? id ?? "—";
}

/** 1〜5 の評点 */
export function ScoreDots({ value, max = 5, invert, label }: { value: number; max?: number; invert?: boolean; label?: string }) {
  const tone = invert ? (value >= 4 ? "fail" : value >= 3 ? "warn" : "pass") : value >= 4 ? "pass" : value >= 3 ? "info" : "neutral";
  return (
    <span className={cx("pf-dots", `tone-${tone}`)} aria-label={`${label ?? "評点"} ${value}/${max}`} title={`${value}/${max}`}>
      {Array.from({ length: max }, (_, i) => <span key={i} className={cx("pf-dot", i < value && "on")} />)}
    </span>
  );
}

/** 横棒（値 / 上限） */
export function MiniBar({ value, max, tone = "info", marker, label }: { value: number; max: number; tone?: "pass" | "warn" | "fail" | "info"; marker?: number; label?: string }) {
  const pct = Math.min(100, (value / Math.max(max, 0.0001)) * 100);
  return (
    <span className="pf-minibar" role="img" aria-label={label ?? `${value} / ${max}`}>
      <span className={cx("pf-minibar-fill", `tone-${tone}`)} style={{ width: `${pct}%` }} />
      {marker !== undefined ? <span className="pf-minibar-marker" style={{ left: `${Math.min(100, (marker / Math.max(max, 0.0001)) * 100)}%` }} /> : null}
    </span>
  );
}

/** 小さな折れ線。目標値の線を重ねる */
export function Sparkline({ series, target, width = 160, height = 40, label }: { series: { at: string; value: number }[]; target?: number; width?: number; height?: number; label?: string }) {
  if (series.length === 0) return <span className="tiny muted">測定値なし</span>;
  const values = series.map((s) => s.value).concat(target ?? []);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const x = (i: number) => (series.length === 1 ? width / 2 : (i / (series.length - 1)) * (width - 8) + 4);
  const y = (v: number) => height - 4 - ((v - min) / span) * (height - 8);
  const pts = series.map((s, i) => `${x(i)},${y(s.value)}`).join(" ");
  return (
    <svg className="pf-spark" width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label ?? "推移"}>
      {target !== undefined ? <line x1={0} x2={width} y1={y(target)} y2={y(target)} className="pf-spark-target" /> : null}
      <polyline points={pts} className="pf-spark-line" />
      {series.map((s, i) => <circle key={s.at} cx={x(i)} cy={y(s.value)} r={2.5} className="pf-spark-dot"><title>{`${s.at}: ${s.value}`}</title></circle>)}
    </svg>
  );
}

/** 手入力の値であることを示す */
export function ManualSourceTag({ children }: { children: ReactNode }) {
  return (
    <span className="source-tag">
      <span className="tiny muted">出典</span>
      <Tag square dashed icon="edit">手入力</Tag>
      <span className="tiny muted">{children}</span>
    </span>
  );
}

/** 判断と実務の分担を短く示す注記 */
export function RoleNote({ children }: { children: ReactNode }) {
  return <p className="pf-rolenote small muted">{children}</p>;
}
