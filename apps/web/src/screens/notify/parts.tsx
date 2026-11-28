// 通知とオンコール画面群のローカル部品
import { useRoute } from "../../lib/router";
import { ORG, paths } from "../../lib/paths";
import { DELIVERY_STATUS, SEVERITY } from "../../lib/vocab";
import type { DeliveryStatus, Severity } from "../../lib/vocab";
import { Segmented, StatusBadge, Tag } from "../../ui";
import { navigate } from "../../lib/router";
import type { ChannelCapabilities } from "../../mocks/notify";
import { userById } from "../../mocks/core";
import "./notify.css";

export function useOrg() {
  return useRoute().params.org ?? ORG;
}

/** 通知の下位ナビゲーション（チャネル／ルール／配信ログ） */
export function NotifyTabs({ org, active }: { org: string; active: "channels" | "rules" | "log" }) {
  return (
    <div className="nt-subnav">
      <Segmented
        value={active}
        onChange={(v) => navigate(v === "channels" ? paths.channels(org) : v === "rules" ? paths.notifyRules(org) : paths.notifyLog(org))}
        options={[{ value: "channels", label: "チャネル" }, { value: "rules", label: "通知ルール" }, { value: "log", label: "配信ログ" }]}
      />
    </div>
  );
}

/** オンコールの下位ナビゲーション（当番／インシデント／エスカレーションと訓練） */
export function OncallTabs({ org, active }: { org: string; active: "oncall" | "incidents" | "escalation" }) {
  return (
    <div className="nt-subnav">
      <Segmented
        value={active}
        onChange={(v) => navigate(v === "oncall" ? paths.oncall(org) : v === "incidents" ? paths.incidents(org) : paths.escalation(org))}
        options={[{ value: "oncall", label: "当番" }, { value: "incidents", label: "インシデント" }, { value: "escalation", label: "エスカレーションと訓練" }]}
      />
    </div>
  );
}

export function SeverityBadge({ value }: { value: Severity }) {
  return <StatusBadge vocab={SEVERITY[value]} size="sm" icon={value === "critical" || value === "high"} />;
}

export function DeliveryBadge({ value }: { value: DeliveryStatus }) {
  return <StatusBadge vocab={DELIVERY_STATUS[value]} size="sm" />;
}

/** チャネルの能力（送信のみ／双方向／配信確認） */
export function CapabilityTags({ c }: { c: ChannelCapabilities }) {
  return (
    <span className="nt-caps">
      {c.interactive ? <Tag tone="pass" square icon="check">双方向の操作</Tag> : <Tag square icon="send">送信のみ</Tag>}
      {c.deliveryReceipt ? <Tag tone="info" square>配信確認あり</Tag> : <Tag square dashed>配信確認なし</Tag>}
    </span>
  );
}

export const userName = (id?: string) => userById(id)?.name ?? "—";
