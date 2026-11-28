// 案件窓口（H 画面群）のローカル部品
import "./desk.css";
import type { Inquiry } from "../../lib/types";
import { projectBySlug } from "../../mocks/core";
import { Tag } from "../../ui";
import type { IconName } from "../../ui";

export const FROM_LABEL: Record<Inquiry["from"], { label: string; icon: IconName; tone: "warn" | "info" | "neutral" }> = {
  freelancer: { label: "受託者から", icon: "user", tone: "info" },
  customer: { label: "顧客から", icon: "building", tone: "warn" },
  jv: { label: "JVから", icon: "briefcase", tone: "neutral" },
};

export function FromTag({ from }: { from: Inquiry["from"] }) {
  const f = FROM_LABEL[from];
  return <Tag tone={f.tone} square icon={f.icon}>{f.label}</Tag>;
}

export function projectName(slug?: string) {
  if (!slug || slug === "unknown") return "案件不明";
  return projectBySlug(slug).name;
}

/** AI 停止時の継続の説明 */
export function ManualFallbackNote() {
  return (
    <div className="dk-fallback" role="note">
      <strong className="small">AI が止まっていても窓口は止まりません</strong>
      <span className="small">受付・定型文での返信・催促・検収とリリースの判断は、同じ台帳と履歴のまま人手で続けられます。AI の回答案だけが表示されなくなります。</span>
    </div>
  );
}
