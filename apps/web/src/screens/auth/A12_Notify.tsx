// 画面ID: A-12 通知先の設定（オンボーディング 7/10）
// 経営層への通知の宛先と、何を知らせるかを最小限で決める。詳しいルールはあとで「通知」で設定する。
import { useState } from "react";
import { useScreenState } from "../../lib/router";
import type { ProviderKey } from "../../lib/vocab";
import { PROVIDERS } from "../../lib/vocab";
import { Banner, Button, Checkbox, Field, OptionCard, ProviderBadge, Select, Tag, TextField, useToast } from "../../ui";
import { ExecOnboarding, SkipButton } from "./parts";

const CHANNELS: { key: ProviderKey; mode: "双方向" | "送信のみ" }[] = [
  { key: "slack", mode: "双方向" },
  { key: "teams", mode: "双方向" },
  { key: "googleChat", mode: "双方向" },
  { key: "mattermost", mode: "双方向" },
  { key: "chatwork", mode: "送信のみ" },
  { key: "discord", mode: "送信のみ" },
  { key: "email", mode: "送信のみ" },
];

const EVENTS = [
  { key: "decision", label: "経営判断の依頼と期限（前日・当日）", on: true },
  { key: "delay", label: "マイルストーンの遅延予測・確約日の超過", on: true },
  { key: "risk", label: "重大リスク・例外の期限・証跡の欠落", on: true },
  { key: "sync", label: "同期の停止・再認可が必要", on: true },
  { key: "incident", label: "緊急インシデント（本番）", on: false },
  { key: "digest", label: "毎朝の要約（判断待ち・遅延・同期の鮮度）", on: true },
];

export function Notify() {
  const state = useScreenState();
  const toast = useToast();
  const [ch, setCh] = useState<ProviderKey>("slack");
  const [events, setEvents] = useState<string[]>(EVENTS.filter((e) => e.on).map((e) => e.key));
  const tested = state === "tested";
  const failed = state === "testFailed";
  const mode = CHANNELS.find((c) => c.key === ch)?.mode;
  return (
    <ExecOnboarding step={6} title="通知先を設定" description="判断が必要なこと、遅れ、同期の停止を経営層に知らせる宛先を決めます。チャットへの投稿は通知の経路で、オンコールの呼び出しとは別です。" extra={<SkipButton step={6} />}>
      <Field label="通知の宛先">
        <div className="grid cols-2" style={{ ["--gap" as string]: "8px" }}>
          {CHANNELS.map((c) => (
            <OptionCard key={c.key} name="channel" value={c.key} checked={ch === c.key} onChange={(v) => setCh(v as ProviderKey)} title={<ProviderBadge provider={c.key} showStatus />} badge={<Tag square tone={c.mode === "双方向" ? "info" : "neutral"}>{c.mode}</Tag>} />
          ))}
        </div>
      </Field>
      {ch === "chatwork" ? <Banner tone="warn">Chatwork の API トークンは権限が広く、有効期限がありません。専用のアカウントで発行し、漏えい時はすぐ失効できるよう管理者を決めてください。</Banner> : null}
      {ch === "discord" ? <Banner tone="info">Discord の Webhook は送信専用です。通知に操作ボタンは表示せず、リンクだけを載せます。</Banner> : null}
      {ch === "teams" ? <Banner tone="info">Teams は Workflows で投稿します。所有者が退職すると止まるため、共同所有者を設定してください。</Banner> : null}

      <div className="grid cols-2">
        {ch === "email" ? <TextField label="宛先メールアドレス" defaultValue="exec@sample-soft.example" /> : <Select label="チャンネル" defaultValue="exec" options={[{ value: "exec", label: "#exec-decisions" }, { value: "pm", label: "#pm-weekly" }]} />}
        <Select label="静かな時間" defaultValue="night" options={[{ value: "night", label: "22:00〜7:00 と休日（緊急のみ通知）" }, { value: "none", label: "設定しない" }]} help="営業日カレンダーは組織の設定に従います" />
      </div>

      <Field label="知らせること">
        <div className="stack" style={{ ["--gap" as string]: "6px" }}>
          {EVENTS.map((e) => (
            <Checkbox key={e.key} label={e.label} checked={events.includes(e.key)} onChange={(v) => setEvents((xs) => (v ? [...xs, e.key] : xs.filter((x) => x !== e.key)))} />
          ))}
        </div>
      </Field>

      <div className="row">
        <Button icon="send" onClick={() => toast({ kind: "success", message: `${PROVIDERS[ch].label} にテスト通知を送りました` })}>テスト通知を送る</Button>
        <span className="small muted">{mode === "双方向" ? "受け取ったことをボタンで確認できます" : "配信の確認はできません。届いたかを目で確認してください"}</span>
      </div>
      {tested ? <Banner tone="pass" title="テスト通知が届きました">#exec-decisions で木村 達也さんが受領を確認しました（10:31）。</Banner> : null}
      {failed ? <Banner tone="fail" title="テスト通知を送れませんでした">チャンネルにアプリが追加されていません（not_in_channel）。チャンネルにアプリを追加してから再送してください。ゲートの判定や記録には影響しません。</Banner> : null}
    </ExecOnboarding>
  );
}
