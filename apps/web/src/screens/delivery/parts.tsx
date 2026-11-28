// 画面群 6.24 のローカル部品
import type { ReactNode } from "react";
import { Tag } from "../../ui";
import type { CheckState } from "../../mocks/delivery";
import { useRoute } from "../../lib/router";
import { ORG, PROJECT } from "../../lib/paths";

export const RELEASE_ID = "rel-140";

export function useOrgProject() {
  const { params } = useRoute();
  return { org: params.org ?? ORG, project: params.project ?? PROJECT, id: params.id ?? RELEASE_ID };
}

/** 検証結果の状態。別コミットの結果は「流用不可」として成功と区別する */
export function CheckCell({ state, children }: { state: CheckState; children?: ReactNode }) {
  const t = {
    ok: <Tag tone="pass" icon="check">成功</Tag>,
    failed: <Tag tone="fail" icon="xCircle">失敗</Tag>,
    missing: <Tag tone="warn" icon="clock">未取得</Tag>,
    otherSha: <Tag tone="fail" icon="alert">別コミット（流用不可）</Tag>,
  }[state];
  return (
    <span className="dl-check">
      {t}
      {children ? <span className="tiny muted">{children}</span> : null}
    </span>
  );
}

export function StepState({ state }: { state: "waiting" | "running" | "ok" | "failed" | "skipped" | "recorded" | "missing" | "pending" }) {
  const m = {
    waiting: <Tag icon="clock">待機中</Tag>,
    running: <Tag tone="info" icon="refresh">実行中</Tag>,
    ok: <Tag tone="pass" icon="check">完了</Tag>,
    failed: <Tag tone="fail" icon="xCircle">失敗</Tag>,
    skipped: <Tag tone="neutral" icon="minus">停止</Tag>,
    recorded: <Tag tone="pass" icon="check">記録あり</Tag>,
    missing: <Tag tone="fail" icon="alert">不足</Tag>,
    pending: <Tag tone="warn" icon="clock">回収中</Tag>,
  }[state];
  return m;
}

export function shortSha(sha?: string) {
  return sha ? sha.slice(0, 7) : "—";
}
