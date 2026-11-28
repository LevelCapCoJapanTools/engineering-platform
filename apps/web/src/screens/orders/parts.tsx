// 受託者への発注と採算の画面群で共有するローカル部品。
import "./orders.css";
import type { ReactNode } from "react";
import { yen } from "../../lib/format";
import { projectBySlug, userById } from "../../mocks/core";
import { AudienceTag, Icon, Tag } from "../../ui";

export const userName = (id?: string) => (id ? userById(id)?.name ?? id : "—");
export const projectName = (slug: string) => projectBySlug(slug)?.name ?? slug;

/** 社内のみの金額。顧客・提携先・受託者の画面には出さない */
export function InternalYen({ value, strong }: { value: number; strong?: boolean }) {
  return <span className={strong ? "strong" : undefined}>{yen(value)}</span>;
}

/** 社内のみの表示であることを示す帯 */
export function InternalOnly({ children }: { children?: ReactNode }) {
  return (
    <div className="ord-internal" role="note">
      <AudienceTag value="internal" />
      <span className="small">{children ?? "この画面の金額（外注単価、個人別報酬、粗利）は社内のみです。顧客・提携先・受託者の画面、出力、通知、AI の回答には出しません。"}</span>
    </div>
  );
}

/** AI の下書きであることの表示 */
export function AiDraftNote({ children }: { children: ReactNode }) {
  return (
    <div className="ord-ai" role="note">
      <Tag tone="special" square icon="sparkles">AI・参考</Tag>
      <span className="small">{children}</span>
    </div>
  );
}

export function Kv({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className="ord-kv">
      <span className="tiny muted">{label}</span>
      <span className="small">{children}</span>
    </div>
  );
}

export function CheckMark({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={ok ? "ord-check ok" : "ord-check ng"}>
      <Icon name={ok ? "checkCircle" : "xCircle"} size={14} />
      {label}
    </span>
  );
}

export const fmt = (d?: string) => (d ? d.slice(0, 10).replace(/-/g, "/") : "—");
