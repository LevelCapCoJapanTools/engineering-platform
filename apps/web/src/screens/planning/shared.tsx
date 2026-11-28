// 計画と管理の画面で共通に使う小さな部品（画面群ローカル）。
import type { ReactNode } from "react";
import { Button, EmptyState, ErrorState, IdLink, Skeleton, SourceTag, StatusBadge } from "../../ui";
import type { IconName } from "../../ui";
import { ORG, PROJECT, paths } from "../../lib/paths";
import type { SourceRef } from "../../lib/types";
import { DECISION_STATUS } from "../../lib/vocab";
import { decisions } from "../../mocks/portfolio";
import "./planning.css";

export const LIST_STATES = ["既定", "読み込み中", "0件（初回）", "0件（絞り込み）", "取得失敗"];

/** 一覧の共通状態（§4.2）。既定以外のときは代わりの表示を返す */
export function listStateView(state: string, opts: { icon?: IconName; emptyTitle: string; emptyDescription?: string; emptyAction?: ReactNode }): ReactNode | null {
  if (state === "読み込み中") return <Skeleton variant="table" rows={6} />;
  if (state === "取得失敗") return <ErrorState />;
  if (state === "0件（初回）") {
    return (
      <div className="card">
        <EmptyState icon={opts.icon} title={opts.emptyTitle} description={opts.emptyDescription} action={opts.emptyAction} />
      </div>
    );
  }
  if (state === "0件（絞り込み）") {
    return (
      <div className="card">
        <EmptyState variant="filtered" title="条件に一致する項目はありません" description="絞り込み条件を変更するか、条件をクリアしてください。" />
      </div>
    );
  }
  return null;
}

export function orgOf(params: Record<string, string>) {
  return params.org ?? ORG;
}
export function projectOf(params: Record<string, string>) {
  return params.project ?? PROJECT;
}

/** 正本と鮮度の帯。値は正本から同期したもので、編集は正本で行うことを示す */
export function SourceBar({ source, note, openLabel = "正本で開く" }: { source: SourceRef; note?: ReactNode; openLabel?: string }) {
  return (
    <div className="pl-source-bar">
      <SourceTag source={source} />
      {note ? <span className="tiny muted">{note}</span> : null}
      <span style={{ marginLeft: "auto" }}>
        <Button size="sm" variant="ghost" icon="external" onClick={() => { if (source.url) window.open(source.url, "_blank", "noopener"); }} disabled={!source.url} disabledReason="正本の URL が登録されていません">{openLabel}</Button>
      </span>
    </div>
  );
}

/** 経営判断へのリンク（M-02） */
export function DecisionLink({ org, id, label }: { org: string; id: string; label?: string }) {
  const d = decisions.find((x) => x.id === id);
  return (
    <span className="row" style={{ ["--gap" as string]: "6px" }}>
      <IdLink id={id} to={paths.decision(org, id)} title={d?.title} status={d ? DECISION_STATUS[d.status] : undefined} />
      {label ? <span className="small">{label}</span> : d ? <span className="small truncate" style={{ maxWidth: 360 }}>{d.title}</span> : null}
      {d ? <StatusBadge vocab={DECISION_STATUS[d.status]} size="sm" /> : null}
    </span>
  );
}
