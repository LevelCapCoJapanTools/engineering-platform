// 画面ID: M-02 経営判断の詳細
// 判断の選択肢・根拠・影響・期限を確認し、判断者・理由・条件を記録する。判断後のフォローアップも追跡する。
// 依頼者本人は判断できない（職務分離）。実務上の承認者がいる場合は回付する。
import "./executive.css";
import { useState } from "react";
import { useRoute, useScreenState } from "../../lib/router";
import { ORG, paths } from "../../lib/paths";
import type { Decision } from "../../lib/types";
import { DECISION_STATUS, SEVERITY } from "../../lib/vocab";
import { formatDateTime, yenM } from "../../lib/format";
import { currentUser, userById } from "../../mocks/core";
import { decisions } from "../../mocks/portfolio";
import { DECISION_KIND, decisionAudit, defaultAudit, delegatedDecisions, OUT_OF_SCOPE_DECISION } from "../../mocks/executive";
import {
  AppLayout,
  Banner,
  Button,
  Checkbox,
  crumbs,
  DatePicker,
  DeadlineIndicator,
  DetailLayout,
  EmptyState,
  ErrorState,
  Icon,
  KeyValueList,
  MetaSection,
  Modal,
  OptionCard,
  PageHeader,
  ResponsibilitySplit,
  Section,
  Skeleton,
  SoDNotice,
  StatusBadge,
  Tag,
  TextArea,
  Timeline,
  useToast,
} from "../../ui";
import { EvidenceLinks, PersonRef, projectName } from "./parts";

const STATE_TO_ID: Record<string, string> = {
  default: "DEC-0031",
  decided: "DEC-0027",
  conditional: "DEC-0029",
  delegated: "DEC-0030",
  rejected: "DEC-0025",
};

function pick(id: string | undefined, state: string): Decision {
  const all = [...decisions, ...delegatedDecisions];
  if (state !== "default" && STATE_TO_ID[state]) return all.find((d) => d.id === STATE_TO_ID[state])!;
  if (state === "sod") return { ...all.find((d) => d.id === "DEC-0031")!, id: "DEC-0036", title: "受発注システム刷新の追加投資 300万円（依頼者: 本人）", requested_by: currentUser.id };
  return all.find((d) => d.id === id) ?? all.find((d) => d.id === "DEC-0031")!;
}

export function DecisionDetail({ id }: { id: string }) {
  const state = useScreenState();
  const toast = useToast();
  const org = useRoute().params.org ?? ORG;
  const d = pick(id, state);
  const [choice, setChoice] = useState("");
  const [reason, setReason] = useState("");
  const [conditions, setConditions] = useState("");
  const [reviewDate, setReviewDate] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [recorded, setRecorded] = useState<null | "decided" | "onHold">(null);
  const [routeOpen, setRouteOpen] = useState(false);
  const [routeNote, setRouteNote] = useState("");
  const [followUps, setFollowUps] = useState(d.follow_up ?? []);

  const trail = crumbs(org, undefined, { label: "経営判断", to: paths.inbox(org) }, { label: d.id });

  if (state === "forbidden") {
    const x = OUT_OF_SCOPE_DECISION;
    return (
      <AppLayout org={org} active="inbox" breadcrumb={crumbs(org, undefined, { label: "経営判断", to: paths.inbox(org) }, { label: x.id })}>
        <PageHeader title="この判断は閲覧範囲外です" id={x.id} />
        <div className="card">
          <EmptyState
            variant="forbidden"
            icon="lock"
            title="閲覧範囲に含まれていない事業部の判断です"
            description="経営層の閲覧範囲は、事業部・顧客・案件・機密区分ごとに組織管理者が設定します。役職だけでは自動で広がりません。必要な場合は組織管理者に依頼してください。"
            action={<Button to={paths.scopes(org)} icon="eye">閲覧範囲と判断権限を見る</Button>}
          />
        </div>
      </AppLayout>
    );
  }

  if (state === "loading" || state === "error") {
    return (
      <AppLayout org={org} active="inbox" breadcrumb={trail}>
        {state === "loading" ? <Skeleton variant="detail" /> : <ErrorState />}
      </AppLayout>
    );
  }

  const isSelf = d.requested_by === currentUser.id;
  const isPending = d.status === "pending" && recorded === null;
  const errors = { choice: !choice ? "選択肢を選んでください" : "", reason: !reason.trim() ? "判断の理由を入力してください（必須）" : "" };
  const audit = decisionAudit[d.id] ?? defaultAudit(d);
  const options = d.options ?? ["承認", "却下"];
  const statusVocab = recorded === "decided" ? DECISION_STATUS[conditions.trim() ? "conditional" : choice.includes("却下") ? "rejected" : "approved"] : recorded === "onHold" ? DECISION_STATUS.onHold : DECISION_STATUS[d.status];

  const main = (
    <>
      {d.status === "delegated" ? (
        <Banner tone="info" title="実務上の承認者へ回付済みです">
          {d.practical_approver}が判断します。結果は連携先から同期され、この記録に追記されます。
        </Banner>
      ) : null}

      <Section title="判断の内容">
        <div className="stack">
          <KeyValueList
            cols={2}
            items={[
              { label: "種類", value: <Tag square tone="primary">{DECISION_KIND[d.kind]}</Tag> },
              { label: "案件", value: d.project ? <Button variant="ghost" size="sm" to={paths.project(org, d.project)}>{projectName(d.project)}</Button> : "組織全体" },
              { label: "影響", value: <span>{d.impact}{d.impact_yen ? <span className="muted">（{yenM(d.impact_yen)}）</span> : null}</span> },
              { label: "重大度", value: <StatusBadge vocab={SEVERITY[d.severity]} size="sm" /> },
              { label: "期限", value: <DeadlineIndicator date={d.due} /> },
              { label: "根拠", value: <EvidenceLinks org={org} ids={d.evidence} project={d.project} /> },
            ]}
          />
          <ResponsibilitySplit
            decide={<span className="row" style={{ ["--gap" as string]: "6px" }}>{d.decider_id ? <PersonRef userId={d.decider_id} /> : <span className="small">経営層（判断権限のある人）</span>}</span>}
            act={<span className="small">{d.practical_approver ?? <span className="row" style={{ ["--gap" as string]: "6px" }}>依頼者 <PersonRef userId={d.requested_by} /> が既存のツールで実施</span>}</span>}
            note="経営判断は投資・優先順位・リスク受容などの最終判断です。要求・設計・受入などの実務の承認は、実際の承認者の記録を連携先から取り込みます。"
          />
        </div>
      </Section>

      {isPending ? (
        <Section title="判断を記録する" sub="判断者・日時・理由・条件は監査記録に残り、関連する Evidence Manifest に含まれます">
          {isSelf ? (
            <SoDNotice reason="この判断の依頼者はあなたです。依頼者本人は判断できません。" eligible={[userById("u-mori")!, userById("u-ishii")!]} />
          ) : (
            <div className="stack">
              <div className="stack" style={{ ["--gap" as string]: "8px" }} role="radiogroup" aria-label="選択肢">
                {options.map((o) => (
                  <OptionCard key={o} name="decision-option" value={o} checked={choice === o} onChange={setChoice} title={o} />
                ))}
                {submitted && errors.choice ? <span className="small text-fail">{errors.choice}</span> : null}
              </div>
              <TextArea label="判断の理由" required rows={3} value={reason} onChange={setReason} error={submitted ? errors.reason : undefined} placeholder="例: 顧客との確約日を守るため。追加費用は CR-0004 の契約変更で回収する" maxLength={1000} />
              <TextArea label="条件（任意）" rows={2} value={conditions} onChange={setConditions} help="条件を付けると「条件付き承認」になり、条件ごとにフォローアップを追跡します" placeholder="例: 12/3 までに修正版へ更新。できない場合は再審議" />
              <div className="row" style={{ ["--gap" as string]: "8px" }}>
                <Button
                  variant="primary"
                  icon="check"
                  onClick={() => {
                    setSubmitted(true);
                    if (errors.choice || errors.reason) return;
                    setRecorded("decided");
                    toast({ kind: "success", message: "判断を記録しました。依頼者と関係者に通知しました" });
                  }}
                >
                  判断を記録
                </Button>
                <Button icon="clock" onClick={() => setRecorded("onHold")} disabled={!reviewDate} disabledReason="保留にするには再審議日を指定してください">保留にする</Button>
                {d.practical_approver ? <Button icon="route" onClick={() => setRouteOpen(true)}>正しい承認者へ回付</Button> : null}
              </div>
              <div style={{ maxWidth: 260 }}>
                <DatePicker label="再審議日（保留にする場合）" value={reviewDate} onChange={setReviewDate} min="2026-11-28" />
              </div>
            </div>
          )}
        </Section>
      ) : (
        <Section title="判断の結果">
          {recorded === "onHold" ? (
            <KeyValueList items={[{ label: "結果", value: <StatusBadge vocab={DECISION_STATUS.onHold} size="sm" /> }, { label: "再審議日", value: reviewDate }, { label: "判断者", value: <PersonRef userId={currentUser.id} /> }]} />
          ) : recorded === "decided" ? (
            <KeyValueList items={[{ label: "結果", value: <span className="row" style={{ ["--gap" as string]: "6px" }}><StatusBadge vocab={statusVocab} size="sm" />{choice}</span> }, { label: "判断者", value: <PersonRef userId={currentUser.id} /> }, { label: "理由", value: reason }, { label: "条件", value: conditions || <span className="muted">なし</span> }]} />
          ) : (
            <KeyValueList
              items={[
                { label: "結果", value: <StatusBadge vocab={DECISION_STATUS[d.status]} size="sm" /> },
                { label: "判断者", value: <PersonRef userId={d.decider_id} /> },
                { label: "日時", value: d.decided_at ? formatDateTime(d.decided_at) : "—" },
                { label: "理由", value: d.reason ?? "—" },
                { label: "条件", value: d.conditions ?? <span className="muted">なし</span> },
              ]}
            />
          )}
        </Section>
      )}

      <Section title="判断後のフォローアップ" sub="実施状況は連携先（GitHub、課題管理など）から同期して確認します">
        {followUps.length === 0 ? (
          <p className="small muted">{isPending ? "判断を記録すると、条件や実施事項をここで追跡します。" : "フォローアップはありません。"}</p>
        ) : (
          <ul className="exec-followups">
            {followUps.map((f, i) => (
              <li key={f.title}>
                <Checkbox label={f.title} checked={f.done} onChange={(v) => setFollowUps((x) => x.map((y, j) => (j === i ? { ...y, done: v } : y)))} />
                <PersonRef userId={f.owner} />
                <DeadlineIndicator date={f.due} />
                {f.done ? <Tag tone="pass" square icon="check">完了</Tag> : null}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="監査記録" sub="依頼・回付・判断・フォローアップの完了を時系列で記録します。記録は削除・変更できません">
        <Timeline items={audit.map((a) => ({ id: a.id, actor: a.actor, action: a.action, at: a.at, detail: a.detail }))} />
      </Section>
    </>
  );

  const side = (
    <>
      <MetaSection title="属性">
        <KeyValueList
          stacked
          items={[
            { label: "状態", value: <StatusBadge vocab={statusVocab} size="sm" /> },
            { label: "依頼者", value: <PersonRef userId={d.requested_by} /> },
            { label: "判断者", value: d.decider_id ? <PersonRef userId={d.decider_id} /> : <span className="muted">未定</span> },
            { label: "実務上の承認者", value: d.practical_approver ?? <span className="muted">なし（経営判断のみ）</span> },
            { label: "関連する事業ケース", value: d.case_id ? <Button size="sm" variant="ghost" to={paths.businessCase(org, d.case_id)}>{d.case_id}</Button> : <span className="muted">—</span> },
          ]}
        />
      </MetaSection>
      <MetaSection title="通知">
        <p className="small muted" style={{ margin: 0 }}><Icon name="bell" size={13} /> 判断の依頼・期限・結果は通知ルールに従い、アプリ内とチャット（Slack #exec-decisions）に送られます。</p>
        <Button size="sm" variant="ghost" to={paths.notifyRules(org)}>通知ルール</Button>
      </MetaSection>
    </>
  );

  return (
    <AppLayout org={org} active="inbox" breadcrumb={trail}>
      <PageHeader id={d.id} title={d.title} status={statusVocab} description={`${projectName(d.project)}・依頼 ${userById(d.requested_by)?.name ?? "—"}`} actions={<Button icon="arrowLeft" to={paths.inbox(org)}>経営判断へ戻る</Button>} />
      <DetailLayout main={main} side={side} />
      <Modal
        open={routeOpen}
        onClose={() => setRouteOpen(false)}
        title="正しい承認者へ回付"
        description="回付すると、実務上の承認者へ期限付きの承認リンクと通知を送ります。回付の記録は監査記録に残ります。"
        footer={
          <>
            <Button onClick={() => setRouteOpen(false)}>キャンセル</Button>
            <Button variant="primary" icon="send" disabled={!routeNote.trim()} disabledReason="回付の理由を入力してください" onClick={() => { setRouteOpen(false); toast({ kind: "success", message: "回付しました" }); }}>回付する</Button>
          </>
        }
      >
        <div className="stack">
          <div className="exec-route-note small">回付先: {d.practical_approver}</div>
          <TextArea label="回付の理由" required rows={3} value={routeNote} onChange={setRouteNote} />
        </div>
      </Modal>
    </AppLayout>
  );
}
