// 計画と管理の画面で共通に使う小さな部品（画面群ローカル）。
import type { ReactNode } from "react";
import { EmptyState, ErrorState, Skeleton } from "../../ui";
import type { IconName } from "../../ui";
import { ORG, PROJECT } from "../../lib/paths";
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
