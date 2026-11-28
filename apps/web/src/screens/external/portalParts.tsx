// 顧客ポータル（X-01, X-07〜X-11）のローカル部品
import type { StatusVocab } from "../../lib/vocab";
import type { PortalDeliverable, RouteStep } from "../../mocks/external";
import { REQUEST_KIND } from "../../mocks/external";
import type { CustomerRequestKind } from "../../mocks/external";
import { formatDateTime } from "../../lib/format";
import { Icon, StatusBadge, Tag } from "../../ui";

export const DELIVERABLE_STATUS: Record<PortalDeliverable["status"], StatusVocab> = {
  done: { label: "完了", tone: "pass" },
  inProgress: { label: "進行中", tone: "info" },
  waitingCustomer: { label: "貴社の回答待ち", tone: "warn" },
  delayRisk: { label: "遅延見込み", tone: "fail" },
};

export const REQUEST_STATUS: Record<"pending" | "questioned" | "approved" | "returned", StatusVocab> = {
  pending: { label: "回答待ち", tone: "warn" },
  questioned: { label: "質問中（未承認）", tone: "info" },
  approved: { label: "承認済み", tone: "pass" },
  returned: { label: "差戻し", tone: "fail" },
};

export function RequestKindTag({ kind }: { kind: CustomerRequestKind }) {
  return <Tag tone="primary" square>{REQUEST_KIND[kind]}</Tag>;
}

/** 社内稟議の経路。誰の回答待ちかを示す */
export function RouteSteps({ steps }: { steps: RouteStep[] }) {
  return (
    <ol className="cp-route" aria-label="承認の経路">
      {steps.map((s, i) => (
        <li key={`${s.role}-${i}`} className={`cp-route-step ${s.status}`}>
          <span className="cp-route-num" aria-hidden>{s.status === "done" ? <Icon name="check" size={12} /> : i + 1}</span>
          <span className="stack" style={{ ["--gap" as string]: "0", minWidth: 0 }}>
            <span className="small strong">{s.role}</span>
            <span className="tiny muted">{s.name}{s.limit ? ` · 決裁上限 ${s.limit}` : ""}</span>
            <span className="tiny">
              {s.status === "done" ? `完了 ${s.at ? formatDateTime(s.at) : ""}` : s.status === "waiting" ? "回答待ち" : s.status === "skipped" ? "対象外" : "前の段階の完了待ち"}
            </span>
          </span>
        </li>
      ))}
    </ol>
  );
}

export function DeliverableBadge({ status }: { status: PortalDeliverable["status"] }) {
  return <StatusBadge vocab={DELIVERABLE_STATUS[status]} size="sm" />;
}
