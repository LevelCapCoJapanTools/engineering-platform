// 画面ID: N-07 インシデント詳細
import { useState } from "react";
import { useRoute, useScreenState } from "../../lib/router";
import { paths } from "../../lib/paths";
import { INCIDENT_STATUS } from "../../lib/vocab";
import type { Incident } from "../../lib/types";
import {
  AppLayout, Banner, Button, Combobox, crumbs, DetailLayout, ErrorState, ExternalActor, Icon, KeyValueList, MetaSection, Modal, PageHeader, ResponsibilitySplit, Section,
  Skeleton, SourceTag, StatusBadge, Tag, TextArea, Timestamp, useToast,
} from "../../ui";
import { incidents } from "../../mocks/portfolio";
import { currentUser, users } from "../../mocks/core";
import { escalationPolicies, incidentTimeline } from "../../mocks/notify";
import { cx } from "../../ui";
import { OncallTabs, SeverityBadge, useOrg } from "./parts";
import { DeliveryVsAckSection } from "./oncall2";

const STATE_FIXTURE: Record<string, string> = { "未受領（エスカレーション中）": "INC-0111", 受領済み: "INC-0112", 解決: "INC-0108", 配信失敗: "INC-0111", 当番として操作: "INC-0111" };

export function N07Incident() {
  const state = useScreenState();
  const org = useOrg();
  const toast = useToast();
  const id = useRoute().params.id ?? "INC-0112";
  const base: Incident = incidents.find((i) => i.id === (STATE_FIXTURE[state] ?? id)) ?? incidents[0];
  const [inc, setInc] = useState<Incident>(base);
  const [handoff, setHandoff] = useState(false);
  const [resolveOpen, setResolveOpen] = useState(false);
  const responder = state === "当番として操作";
  const actor = responder ? "u-suzuki" : currentUser.id;
  const notOnCall = !responder;
  const policy = escalationPolicies[0];
  const events = incidentTimeline[inc.id] ?? [];
  const deliveryFailed = state === "配信失敗" || events.some((e) => e.kind === "fail");

  if (state === "読み込み中" || state === "エラー") {
    return (
      <AppLayout org={org} active="incidents" breadcrumb={crumbs(org, undefined, { label: "インシデント", to: paths.incidents(org) }, { label: id })}>
        {state === "読み込み中" ? <Skeleton variant="detail" /> : <ErrorState />}
      </AppLayout>
    );
  }

  const ack = () => { setInc((x) => ({ ...x, status: "acknowledged", acknowledged_by: actor, acknowledged_at: "2026-11-27T10:30:00+09:00" })); toast({ kind: "success", message: "受領を記録しました。エスカレーションを止めました（解決ではありません）" }); };

  return (
    <AppLayout org={org} active="incidents" breadcrumb={crumbs(org, undefined, { label: "インシデント", to: paths.incidents(org) }, { label: inc.id })}>
      <PageHeader
        id={inc.id}
        title={inc.title}
        status={<StatusBadge vocab={INCIDENT_STATUS[inc.status]} size="lg" />}
        description={`${inc.service} · ${inc.environment} · 重複キー ${inc.dedup_key}`}
        meta={<SourceTag source={{ provider: "pagerduty", synced_at: "2026-11-27T10:26:00+09:00", status: "healthy" }} />}
        actions={
          <>
            <Button
              variant={inc.status === "triggered" ? "primary" : "secondary"}
              icon="check"
              disabled={inc.status !== "triggered" || notOnCall}
              disabledReason={inc.status !== "triggered" ? "受領済みです" : "当番ではないため受領できません。受領は当番本人がチャット・PagerDuty・この画面から行います"}
              onClick={ack}
            >
              受領（Ack）
            </Button>
            <Button
              icon="checkCircle"
              disabled={inc.status === "resolved" || notOnCall}
              disabledReason={inc.status === "resolved" ? "解決済みです" : "当番ではないため解決にできません"}
              onClick={() => setResolveOpen(true)}
            >
              解決（Resolve）
            </Button>
            <Button variant="ghost" icon="users" disabled={inc.status === "resolved" || notOnCall} disabledReason={inc.status === "resolved" ? "解決済みです" : "当番ではありません"} onClick={() => setHandoff(true)}>引継ぎ</Button>
          </>
        }
      />
      <OncallTabs org={org} active="incidents" />
      {inc.status === "triggered" ? (
        <Banner tone="fail" title={`未受領のため段階 ${inc.escalation_level} にエスカレーションしています`}>
          受領されるまで、ポリシーの待機時間ごとに次の段階へ進みます。チャットへの投稿は受領とはみなしません。
        </Banner>
      ) : null}
      {deliveryFailed ? (
        <Banner tone="warn" title="一部の通知経路で配信に失敗しました">
          Teams への投稿が失敗（403）したため、オンコール管理サービスの代替経路（Push・SMS・音声）で通知しています。インシデントの記録には影響しません。
        </Banner>
      ) : null}
      {notOnCall ? (
        <p className="small muted">あなた（{currentUser.name}）は閲覧のみです。経営判断が必要な場合（顧客への説明、リリースの停止など）は、判断の依頼として受け取ります。</p>
      ) : null}
      <DetailLayout
        main={
          <div className="stack">
            <Section title="エスカレーション" sub={`ポリシー: ${policy.name}`}>
              <ol className="nt-steps">
                {policy.steps.map((s) => {
                  const done = inc.status !== "triggered" ? s.level <= inc.escalation_level : s.level < inc.escalation_level;
                  const current = inc.status === "triggered" && s.level === inc.escalation_level;
                  return (
                    <li key={s.level} className={cx(current && "current", done && "done")}>
                      <span className="nt-step-no">{s.level}</span>
                      <div className="stack" style={{ ["--gap" as string]: "2px", minWidth: 0 }}>
                        <strong className="small">{s.target}</strong>
                        <span className="tiny muted">{s.channels.join("・")} · {s.wait_minutes} 分で次の段階へ</span>
                      </div>
                      {current ? <Tag tone="fail" square icon="clock">呼び出し中</Tag> : done ? <Tag square icon="check">通知済み</Tag> : <Tag square dashed>待機</Tag>}
                    </li>
                  );
                })}
              </ol>
            </Section>
            <DeliveryVsAckSection status={inc.status} />
            <Section title="経過" sub="受領・引継ぎ・更新・解決は、操作した本人（外部IDで照合）と時刻を記録します">
              <ol className="nt-events">
                {events.map((e, i) => (
                  <li key={i}>
                    <span className="tiny muted"><Timestamp at={e.at} mode="absolute" /></span>
                    <span className={cx("small", e.kind === "fail" && "tone-fail")}>
                      <Tag square tone={e.kind === "ack" ? "warn" : e.kind === "resolve" ? "pass" : e.kind === "fail" ? "fail" : e.kind === "escalate" || e.kind === "fallback" ? "special" : "neutral"}>
                        {{ trigger: "起票", notify: "通知", escalate: "段階を上げる", ack: "受領", handoff: "引継ぎ", update: "更新", resolve: "解決", fail: "配信失敗", fallback: "代替経路" }[e.kind]}
                      </Tag>{" "}
                      {e.text} <span className="tiny muted">— {e.name}</span>
                    </span>
                  </li>
                ))}
                {inc.status === "acknowledged" && !events.some((e) => e.kind === "ack") ? (
                  <li><span className="tiny muted">たった今</span><span className="small"><Tag square tone="warn">受領</Tag> この画面から受領</span></li>
                ) : null}
              </ol>
            </Section>
            <Section title="影響・原因・対応">
              <KeyValueList
                stacked
                items={[
                  { label: "影響", value: inc.id === "INC-0112" ? "ステージング環境のみ。顧客の検証作業が約 30 分停止" : inc.id === "INC-0108" ? "Manifest 3 件の保管が 35 分遅延（欠落なし）" : "本番の応答時間が通常の約 3 倍（調査中）" },
                  { label: "原因", value: inc.id === "INC-0108" ? "保管先の IAM ロールの期限切れ" : inc.id === "INC-0112" ? "rel-140 の設定変更（調査中）" : "調査中" },
                  { label: "対応", value: inc.id === "INC-0108" ? "ロールを更新し、保留分を再送。署名検証で欠落がないことを確認" : "対応中" },
                ]}
              />
            </Section>
            {inc.status === "resolved" ? (
              <Section title="事後レビュー" actions={<Tag tone="pass" square>記録済み</Tag>}>
                <div className="stack small">
                  <span>再発防止: 保管先の資格情報の期限を 30 日前に通知するルールを追加（N-03）。</span>
                  <span>証跡への影響: なし。保留していた Manifest は同じ内容で保管され、署名検証が一致。</span>
                  <span className="tiny muted">レビュー: 山本 結衣（記入）、森 由紀子（確認） · 2026/11/27</span>
                </div>
              </Section>
            ) : (
              <Section title="事後レビュー">
                <p className="small muted">解決後に、影響・原因・再発防止・証跡への影響を記録します。</p>
              </Section>
            )}
          </div>
        }
        side={
          <>
            <MetaSection title="概要">
              <KeyValueList
                stacked
                items={[
                  { label: "重大度", value: <SeverityBadge value={inc.severity} /> },
                  { label: "受領", value: inc.acknowledged_by ? <span className="stack" style={{ ["--gap" as string]: "2px" }}><ExternalActor userId={inc.acknowledged_by} />{inc.acknowledged_at ? <span className="tiny muted"><Timestamp at={inc.acknowledged_at} mode="absolute" /></span> : null}</span> : <Tag tone="fail" square>未受領</Tag> },
                  { label: "解決", value: inc.resolved_by ? <span className="stack" style={{ ["--gap" as string]: "2px" }}><ExternalActor userId={inc.resolved_by} />{inc.resolved_at ? <span className="tiny muted"><Timestamp at={inc.resolved_at} mode="absolute" /></span> : null}</span> : "—" },
                  { label: "発生", value: <Timestamp at={inc.triggered_at} mode="absolute" /> },
                ]}
              />
            </MetaSection>
            <MetaSection title="関連">
              <div className="stack small" style={{ ["--gap" as string]: "6px" }}>
                {inc.project ? <span><Icon name="folder" size={13} /> 案件 {inc.project}</span> : null}
                {inc.related_release && inc.project ? <Button size="sm" variant="ghost" icon="rocket" to={paths.release(org, inc.project, inc.related_release)}>リリース {inc.related_release}</Button> : null}
                {inc.project ? <Button size="sm" variant="ghost" icon="shield" to={paths.gates(org, inc.project)}>直近のゲート実行</Button> : null}
              </div>
            </MetaSection>
            <MetaSection title="判断と対応">
              <ResponsibilitySplit
                decide={<span className="small">顧客への説明・リリースの停止が必要な場合は経営判断として依頼</span>}
                act={<span className="small">当番（オンコール管理サービスの担当）</span>}
              />
            </MetaSection>
          </>
        }
      />
      <Modal
        open={handoff}
        onClose={() => setHandoff(false)}
        title="担当を引き継ぐ"
        footer={<><Button variant="ghost" onClick={() => setHandoff(false)}>キャンセル</Button><Button variant="primary" onClick={() => { setHandoff(false); toast({ kind: "success", message: "引継ぎを記録し、新しい担当に通知しました" }); }}>引き継ぐ</Button></>}
      >
        <div className="stack">
          <Combobox label="新しい担当" options={users.filter((u) => u.external_ids?.some((e) => e.provider === "pagerduty" || e.provider === "github")).map((u) => ({ value: u.id, label: u.name }))} value={[]} />
          <TextArea label="引継ぎメモ" rows={3} placeholder="状況と次の作業" />
        </div>
      </Modal>
      <Modal
        open={resolveOpen}
        onClose={() => setResolveOpen(false)}
        title="解決として記録しますか？"
        description="受領とは別の記録です。解決後に事後レビューを記入してください。"
        footer={<><Button variant="ghost" onClick={() => setResolveOpen(false)}>キャンセル</Button><Button variant="primary" onClick={() => { setResolveOpen(false); setInc((x) => ({ ...x, status: "resolved", resolved_by: actor, resolved_at: "2026-11-27T10:30:00+09:00" })); toast({ kind: "success", message: "解決を記録しました" }); }}>解決にする</Button></>}
      >
        <TextArea label="対応の要約" required rows={3} />
      </Modal>
    </AppLayout>
  );
}
