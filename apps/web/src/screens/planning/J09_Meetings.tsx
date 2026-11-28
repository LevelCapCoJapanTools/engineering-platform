// 画面ID: J-09 会議・合意（一覧と詳細）
// 会議の日時は共有カレンダー、議事メモは文書リポジトリから同期する。決定事項は決定者・日時・内容とともに、要求・リスク・変更へリンクする。
import { useState } from "react";
import {
  AvatarStack,
  Button,
  DataTable,
  DetailLayout,
  ErrorState,
  IdLink,
  KeyValueList,
  MarkdownViewer,
  MetaSection,
  PageHeader,
  ProjectLayout,
  Section,
  SearchBox,
  Skeleton,
  SourceTag,
  Tag,
  useToast,
  ExternalActor,
} from "../../ui";
import { navigate, useScreenState } from "../../lib/router";
import { paths } from "../../lib/paths";
import type { User } from "../../lib/types";
import { userById } from "../../mocks/core";
import { formatDateTime } from "../../lib/format";
import { CAL_SOURCE, DOC_SOURCE, meetingById, meetingSync, meetings } from "../../mocks/planning";
import type { Meeting } from "../../mocks/planning";
import { LIST_STATES, SourceBar, listStateView, orgOf, projectOf } from "./shared";

export const J09_LIST_STATES = LIST_STATES;
export const J09_DETAIL_STATES = ["既定", "読み込み中", "取得失敗"];

const usersOf = (ids: string[]) => ids.map((id) => userById(id)).filter((u): u is User => Boolean(u));

function linkOf(org: string, pr: string, id: string) {
  if (id.startsWith("REQ")) return paths.requirement(org, pr, id);
  if (id.startsWith("RSK") || id.startsWith("COR")) return paths.risk(org, pr, id);
  if (id.startsWith("CR")) return paths.change(org, pr, id);
  if (id.startsWith("DSN") || id.startsWith("ADR")) return paths.design(org, pr, id);
  return undefined;
}

export function J09MeetingList({ params }: { params: Record<string, string> }) {
  const state = useScreenState();
  const org = orgOf(params);
  const pr = projectOf(params);
  const [q, setQ] = useState("");
  const rows = meetings.filter((m) => !q || `${m.title}${m.body}`.includes(q));
  const alt = listStateView(state, { icon: "message", emptyTitle: "会議はまだありません", emptyDescription: "共有カレンダーの「顧客レビュー」を連携すると、会議と決定事項がここに表示されます。", emptyAction: <Button icon="plug" to={paths.connectors(org)}>連携を確認</Button> });
  return (
    <ProjectLayout org={org} project={pr} active="meetings" trail={[{ label: "会議・合意" }]}>
      <PageHeader title="会議・合意" description="顧客・社内の会議と決定事項を、決定者・日時とともに確認します。決定事項は要求・変更要求・リスクに結び付きます。" />
      <div className="stack" style={{ ["--gap" as string]: "8px" }}>
        <SourceBar source={CAL_SOURCE} note="会議の日時・状態" />
        <SourceBar source={DOC_SOURCE} note="議事メモ（docs/meetings/）" />
      </div>
      {alt ?? (
        <>
          <SearchBox placeholder="題名や内容で絞り込み" value={q} onChange={setQ} width={320} />
          <DataTable<Meeting>
            rows={rows}
            rowKey={(m) => m.id}
            onRowClick={(m) => navigate(paths.meeting(org, pr, m.id))}
            empty={listStateView("0件（絞り込み）", { emptyTitle: "" })}
            columns={[
              { key: "date", header: "日時", render: (m) => <span className="nowrap">{meetingSync[m.id] ? formatDateTime(meetingSync[m.id].start) : m.date}</span>, sortValue: (m) => m.date, hideable: false },
              { key: "title", header: "題名", render: (m) => <span className="row nowrap"><span className="strong" style={{ fontWeight: 500 }}>{m.title}</span>{meetingSync[m.id]?.status === "moved" ? <Tag tone="warn" square>日時変更あり</Tag> : null}</span> },
              { key: "decider", header: "決定者", render: (m) => (meetingSync[m.id] ? <ExternalActor userId={meetingSync[m.id].decider} /> : "—") },
              { key: "participants", header: "参加者", render: (m) => <span className="row nowrap"><AvatarStack users={usersOf(m.participants)} /><span className="tiny muted">{m.participants.length}名</span></span> },
              { key: "decisions", header: "決定事項", align: "right", render: (m) => `${m.decisions.length}件`, sortValue: (m) => m.decisions.length },
            ]}
          />
        </>
      )}
    </ProjectLayout>
  );
}

export function J09MeetingDetail({ params }: { params: Record<string, string> }) {
  const state = useScreenState();
  const org = orgOf(params);
  const pr = projectOf(params);
  const toast = useToast();
  const m = meetingById(params.id);
  const sync = meetingSync[m.id];
  return (
    <ProjectLayout org={org} project={pr} active="meetings" trail={[{ label: "会議・合意", to: paths.meetings(org, pr) }, { label: m.title }]}>
      <PageHeader id={m.id} title={m.title} description={sync ? `${formatDateTime(sync.start)}〜${formatDateTime(sync.end).slice(-9)}` : m.date} actions={<Button icon="external" onClick={() => toast({ kind: "info", message: "議事メモを文書リポジトリで開きます" })}>正本で開く</Button>} />
      {state === "読み込み中" ? (
        <Skeleton variant="detail" />
      ) : state === "取得失敗" ? (
        <ErrorState />
      ) : (
        <DetailLayout
          main={
            <>
              <Section title="本文"><MarkdownViewer source={m.body} /></Section>
              <Section title="決定事項" sub={`${m.decisions.length}件`}>
                <div className="stack" style={{ ["--gap" as string]: "10px" }}>
                  {m.decisions.map((d, i) => (
                    <div key={i} className="pl-decision">
                      <div className="row between">
                        <span className="strong" style={{ fontWeight: 500 }}>{i + 1}. {d.text}</span>
                        <Tag tone="pass" icon="check">決定</Tag>
                      </div>
                      {sync ? <span className="row tiny muted" style={{ ["--gap" as string]: "6px" }}>決定者: <ExternalActor userId={sync.decider} /> · {formatDateTime(sync.start)}</span> : null}
                      <div className="row" style={{ ["--gap" as string]: "8px" }}>
                        <span className="tiny muted">関連:</span>
                        {d.links.map((l) => <IdLink key={l} id={l} to={linkOf(org, pr, l)} />)}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            </>
          }
          side={
            <>
              <MetaSection title="会議の情報">
                <KeyValueList
                  stacked
                  items={[
                    { label: "日時", value: sync ? formatDateTime(sync.start) : m.date },
                    { label: "状態", value: sync?.status === "moved" ? <Tag tone="warn" square>日時変更あり</Tag> : <Tag tone="pass" square>開催済み</Tag> },
                    { label: "主催者", value: sync ? <ExternalActor userId={sync.organizer} /> : "—" },
                    { label: "カレンダーの予定", value: <span className="mono small">{sync?.event_id ?? "—"}</span> },
                    { label: "出典", value: <SourceTag source={CAL_SOURCE} compact /> },
                  ]}
                />
              </MetaSection>
              <MetaSection title={`参加者（${m.participants.length}）`}>
                {usersOf(m.participants).map((u) => <ExternalActor key={u.id} userId={u.id} />)}
                <span className="tiny muted">参加者一覧は議事メモから取得しています（カレンダーの参加者一覧は取得しません）</span>
              </MetaSection>
            </>
          }
        />
      )}
    </ProjectLayout>
  );
}
