// 顧客への公開と共同経営の画面群で共有するローカル部品
import { formatDateTime, yen } from "../../lib/format";
import type { JointApproval } from "../../mocks/disclosure";
import { userById } from "../../mocks/core";
import { Icon, Tag } from "../../ui";

const STEP = {
  pending: { label: "回答待ち", tone: "warn" as const, icon: "clock" as const },
  approved: { label: "承認", tone: "pass" as const, icon: "checkCircle" as const },
  returned: { label: "差戻し", tone: "fail" as const, icon: "xCircle" as const },
};

/** 共同決裁の各社の状況。一社だけの承認では完了しない */
export function JointApprovalCard({ item, myCompany }: { item: JointApproval; myCompany?: string }) {
  const waiting = item.approvals.filter((a) => a.status === "pending");
  const done = item.approvals.every((a) => a.status === "approved");
  return (
    <div className="dc-joint card tight stack" style={{ ["--gap" as string]: "8px" }}>
      <div className="row between">
        <span className="row"><span className="mono small">{item.id}</span><strong className="small">{item.title}</strong></span>
        <Tag tone={done ? "pass" : item.status === "returned" ? "fail" : "warn"}>{done ? "両社決裁済み" : item.status === "returned" ? "差戻し" : `${waiting.length}社の回答待ち`}</Tag>
      </div>
      <span className="tiny muted">影響額 {yen(item.amount)} · 期限 {item.due.replace(/-/g, "/")} · {item.reason}</span>
      <ol className="dc-approvals">
        {item.approvals.map((a) => {
          const s = STEP[a.status];
          return (
            <li key={a.company} className={a.company === myCompany ? "mine" : undefined}>
              <Icon name={s.icon} size={14} />
              <div className="stack" style={{ ["--gap" as string]: "0" }}>
                <span className="small strong">{a.company}{a.company === myCompany ? "（自社）" : ""}</span>
                <span className="tiny muted">{userById(a.approver_id)?.name} · {a.role}{a.at ? ` · ${formatDateTime(a.at)}` : ""}</span>
                {a.comment ? <span className="tiny">{a.comment}</span> : null}
              </div>
              <Tag tone={s.tone} square>{s.label}</Tag>
            </li>
          );
        })}
      </ol>
      {!done && waiting.length ? <span className="tiny">現在の回答待ち: <strong>{waiting.map((w) => w.company).join("、")}</strong>。全社の承認がそろうまで改訂は確定しません。</span> : null}
    </div>
  );
}
