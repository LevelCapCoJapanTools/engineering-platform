// 画面ID: J-09 議事録（一覧と詳細）
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
  Tag,
  UserChip,
  useToast,
} from "../../ui";
import { navigate, useScreenState } from "../../lib/router";
import { paths } from "../../lib/paths";
import type { User } from "../../lib/types";
import { userById } from "../../mocks/core";
import { meetingById, meetings } from "../../mocks/planning";
import type { Meeting } from "../../mocks/planning";
import { LIST_STATES, listStateView, orgOf, projectOf } from "./shared";

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
  const alt = listStateView(state, { icon: "message", emptyTitle: "議事録はまだありません", emptyDescription: "会議の決定事項を記録し、要求・変更・リスクに結び付けます。", emptyAction: <Button variant="primary" icon="plus">議事録を作成</Button> });
  return (
    <ProjectLayout org={org} project={pr} active="meetings" trail={[{ label: "議事録" }]}>
      <PageHeader title="議事録" description="決定事項を要求・変更要求・リスクに結び付けて記録します。" actions={<Button variant="primary" icon="plus">議事録を作成</Button>} />
      {alt ?? (
        <>
          <SearchBox placeholder="題名や内容で絞り込み" value={q} onChange={setQ} width={320} />
          <DataTable<Meeting>
            rows={rows}
            rowKey={(m) => m.id}
            onRowClick={(m) => navigate(paths.meeting(org, pr, m.id))}
            empty={listStateView("0件（絞り込み）", { emptyTitle: "" })}
            columns={[
              { key: "date", header: "日付", render: (m) => <span className="nowrap">{m.date}</span>, sortValue: (m) => m.date, hideable: false },
              { key: "title", header: "題名", render: (m) => <span className="strong" style={{ fontWeight: 500 }}>{m.title}</span> },
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
  return (
    <ProjectLayout org={org} project={pr} active="meetings" trail={[{ label: "議事録", to: paths.meetings(org, pr) }, { label: m.title }]}>
      <PageHeader id={m.id} title={m.title} description={m.date} actions={<><Button icon="edit">編集</Button><Button icon="plus" onClick={() => toast({ kind: "info", message: "決定事項から変更要求を起票します" })}>変更要求を起票</Button></>} />
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
                <KeyValueList stacked items={[{ label: "日付", value: m.date }, { label: "記録者", value: <UserChip user={userById("u-sato")} /> }]} />
              </MetaSection>
              <MetaSection title={`参加者（${m.participants.length}）`}>
                {usersOf(m.participants).map((u) => <UserChip key={u.id} user={u} />)}
              </MetaSection>
            </>
          }
        />
      )}
    </ProjectLayout>
  );
}
