// 画面ID: A-11 計画・カレンダーの接続（オンボーディング 4/10）
// 計画の正本（課題・計画管理）と、経営会議・顧客レビューの共有カレンダーを読み取り専用で接続する。
import { useState } from "react";
import { useScreenState } from "../../lib/router";
import type { ProviderKey } from "../../lib/vocab";
import { PROVIDERS } from "../../lib/vocab";
import { Banner, Button, Checkbox, Field, OptionCard, ProviderBadge, Tag, useToast } from "../../ui";
import { ExecOnboarding, SkipButton } from "./parts";

const PLANNING: ProviderKey[] = ["githubProjects", "gitlabIssues", "azureBoards", "jira"];
const CALENDARS: ProviderKey[] = ["googleCalendar", "m365Calendar"];

const SHARED = [
  { id: "exec", name: "経営会議", owner: "共有カレンダー（木村 達也）", events: 24 },
  { id: "review", name: "顧客レビュー", owner: "共有カレンダー（佐藤 美咲）", events: 34 },
  { id: "release", name: "リリース予定", owner: "共有カレンダー（渡辺 翔）", events: 12 },
];

export function Planning() {
  const state = useScreenState();
  const toast = useToast();
  const [plan, setPlan] = useState<ProviderKey>("githubProjects");
  const [cal, setCal] = useState<ProviderKey>("googleCalendar");
  const [cals, setCals] = useState<string[]>(["exec", "review"]);
  const connected = state === "connected";
  const noPlanning = state === "noPlanning";
  return (
    <ExecOnboarding
      step={3}
      title="計画とカレンダーを接続"
      description="経営ダッシュボードの予定・遅延・判断期限は、課題・計画管理と共有カレンダーから同期します。どちらも読み取り専用です。このサービスから予定を書き換えることはありません。"
      nextDisabled={!connected && !noPlanning}
      nextDisabledReason="計画の正本を接続するか「あとで設定」を選んでください"
      extra={<SkipButton step={3} />}
    >
      {noPlanning ? (
        <Banner tone="warn" title="計画の正本が未接続です">
          コードホスティング（AWS CodeCommit）には計画管理の機能がないため、ポートフォリオの計画日・マイルストーン・依存関係が表示されません。あとで「連携と同期」から接続できます。
        </Banner>
      ) : null}

      <Field label="計画の正本（課題・計画管理）" help="計画日、マイルストーン、担当、依存関係の正本です。複数ある場合はあとで項目ごとに優先順位を決められます">
        <div className="grid cols-2" style={{ ["--gap" as string]: "8px" }}>
          {PLANNING.map((k) => (
            <OptionCard key={k} name="planning" value={k} checked={plan === k} onChange={(v) => setPlan(v as ProviderKey)} title={<ProviderBadge provider={k} showStatus />} description={k === "githubProjects" ? "Project の日付フィールド、Iteration、Status" : k === "gitlabIssues" ? "Milestone の期限、Issue の担当と期限" : k === "azureBoards" ? "Work Item、Iteration Path、Start／Target Date" : "Issue、Version、Due date、リンク"} />
          ))}
        </div>
      </Field>

      <Field label="共有カレンダー" help="経営会議・顧客レビューなど、許可した共有カレンダーだけを取り込みます。個人の予定や非公開の予定は取り込みません">
        <div className="stack" style={{ ["--gap" as string]: "8px" }}>
          <div className="grid cols-2" style={{ ["--gap" as string]: "8px" }}>
            {CALENDARS.map((k) => (
              <OptionCard key={k} name="calendar" value={k} checked={cal === k} onChange={(v) => setCal(v as ProviderKey)} title={<ProviderBadge provider={k} />} description={k === "googleCalendar" ? "差分同期（同期トークン）。失効時は全件を取り直します" : "calendarView の差分リンクで更新・削除を取得します"} />
            ))}
          </div>
          {connected ? (
            <div className="card tight stack" style={{ ["--gap" as string]: "8px" }}>
              <span className="small strong">取り込むカレンダー（{PROVIDERS[cal].label}）</span>
              {SHARED.map((c) => (
                <Checkbox key={c.id} label={`${c.name}（予定 ${c.events} 件）`} description={c.owner} checked={cals.includes(c.id)} onChange={(v) => setCals((xs) => (v ? [...xs, c.id] : xs.filter((x) => x !== c.id)))} />
              ))}
            </div>
          ) : null}
        </div>
      </Field>

      <div className="card tight stack" style={{ ["--gap" as string]: "6px", background: "var(--bg-subtle)" }}>
        <span className="label">取り込む項目</span>
        <span className="small">計画: 予定・予測の開始日と終了日、期限、担当、状態、優先度、依存関係、更新日時</span>
        <span className="small">予定: 件名、開始・終了、タイムゾーン、繰返し、取消・移動、主催者、会議 URL（本文と参加者一覧は取り込みません）</span>
      </div>

      {connected ? (
        <Banner tone="pass" title="接続しました">
          <span className="row" style={{ ["--gap" as string]: "6px" }}><ProviderBadge provider={plan} size="sm" /><Tag square>読み取りのみ</Tag><ProviderBadge provider={cal} size="sm" /><span className="small">{cals.length} カレンダー</span></span>
        </Banner>
      ) : !noPlanning ? (
        <div className="row">
          <Button variant="primary" icon="plug" onClick={() => toast({ kind: "info", message: "認可の画面を開きました（モック）。状態「connected」で接続後を確認できます" })}>{PROVIDERS[plan].label} と {PROVIDERS[cal].label} に接続</Button>
        </div>
      ) : null}
    </ExecOnboarding>
  );
}
