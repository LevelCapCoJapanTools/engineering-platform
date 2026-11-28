// 画面ID: H-05 担当・代理・応答期限
// 質問・未検収・承認待ち・受入待ちごとに、主担当・代理・応答期限・営業時間・次の連絡先を持たせる。
// 相手が返答しないときは窓口が催促し、期限を過ぎると代理へ移る。回答が届いたら予定していた催促は送らない。
import { useState } from "react";
import { useRoute, useScreenState } from "../../lib/router";
import { ORG, paths } from "../../lib/paths";
import type { StatusVocab } from "../../lib/vocab";
import { formatDate, formatDateTime } from "../../lib/format";
import { assignments, deskHours } from "../../mocks/desk";
import type { Assignment } from "../../mocks/desk";
import {
  AppLayout,
  Banner,
  Button,
  crumbs,
  DatePicker,
  ErrorState,
  ExternalActor,
  Modal,
  PageHeader,
  Section,
  Select,
  Skeleton,
  StatusBadge,
  Tag,
  useToast,
} from "../../ui";
import { projectName } from "./parts";

const ASSIGN_STATE: Record<Assignment["state"], StatusVocab> = {
  onTrack: { label: "期限内", tone: "pass" },
  reminding: { label: "催促中", tone: "warn" },
  escalated: { label: "代理へ移行", tone: "special" },
  done: { label: "回答済み", tone: "pass" },
};

const STEP_TAG: Record<Assignment["steps"][number]["status"], { label: string; tone: "pass" | "info" | "neutral" | "warn" }> = {
  sent: { label: "送信済み", tone: "info" },
  scheduled: { label: "予定", tone: "neutral" },
  cancelled: { label: "送らない（回答済み）", tone: "neutral" },
  done: { label: "完了", tone: "pass" },
};

const PEOPLE = [
  { value: "u-aoki", label: "青木 さくら（案件窓口）" },
  { value: "u-kimura", label: "木村 達也（JV責任者）" },
  { value: "u-mori", label: "森 由紀子（CTO）" },
];

export function Assignments() {
  const state = useScreenState();
  const toast = useToast();
  const org = useRoute().params.org ?? ORG;
  const [editing, setEditing] = useState<Assignment | null>(null);
  const [owner, setOwner] = useState("");
  const [deputy, setDeputy] = useState("");
  const [due, setDue] = useState("");
  const rows = state === "代理へ移行" ? assignments.filter((a) => a.state === "escalated") : assignments;

  return (
    <AppLayout org={org} active="desk" breadcrumb={crumbs(org, undefined, { label: "案件窓口", to: paths.desk(org) }, { label: "担当と期限" })}>
      <PageHeader
        title="担当・代理・応答期限"
        description="回答や判断を待っているものごとに、誰が追いかけ、期限を過ぎたら誰に引き継ぐかを決めます。受託者が顧客の連絡先を探したり催促したりする必要はありません。"
      />
      {state === "読み込み中" ? (
        <Skeleton rows={5} />
      ) : state === "エラー" ? (
        <ErrorState />
      ) : (
        <>
          {state === "休業日" ? (
            <Banner tone="info" title="12/29〜1/3 は窓口の休業日です">
              休業日に期限が来るものは、翌営業日（1/4 9:00）を期限として扱います。休業日には定型の催促も送りません。緊急の障害はオンコールの当番に回ります。
            </Banner>
          ) : (
            <Banner tone="info" title={`営業時間: ${deskHours.weekdays}`}>応答期限は営業時間で数えます。期限を過ぎると代理へ移り、代理にも通知します。</Banner>
          )}
          {rows.map((a) => (
            <Section
              key={a.id}
              title={<span className="row" style={{ ["--gap" as string]: "8px" }}><Tag square>{a.kind}</Tag><span>{a.title}</span></span>}
              sub={`${projectName(a.project)} · ${a.target} · 待っている相手: ${a.waiting_on}`}
              actions={<StatusBadge vocab={ASSIGN_STATE[a.state]} size="sm" />}
            >
              <div className="dk-two">
                <div className="stack" style={{ ["--gap" as string]: "8px" }}>
                  <div className="row" style={{ ["--gap" as string]: "6px" }}><span className="tiny muted">主担当</span><ExternalActor userId={a.owner_id} /></div>
                  <div className="row" style={{ ["--gap" as string]: "6px" }}><span className="tiny muted">代理</span><ExternalActor userId={a.deputy_id} />{a.state === "escalated" ? <Tag tone="special" square>現在の担当</Tag> : null}</div>
                  <div className="row" style={{ ["--gap" as string]: "6px" }}><span className="tiny muted">応答期限</span><strong className="small">{formatDate(a.due)}</strong></div>
                  <div className="row" style={{ ["--gap" as string]: "6px" }}><span className="tiny muted">次の連絡先</span><span className="small">{a.next_contact}</span></div>
                  <div><Button size="sm" icon="edit" onClick={() => { setEditing(a); setOwner(a.owner_id); setDeputy(a.deputy_id); setDue(a.due); }}>担当と期限を変更</Button></div>
                </div>
                <div className="stack" style={{ ["--gap" as string]: "6px" }}>
                  <span className="tiny muted">催促と引継ぎの段階</span>
                  <ul className="dk-steps">
                    {a.steps.map((s) => (
                      <li key={s.at + s.action} className={s.status === "cancelled" ? "cancelled" : undefined}>
                        <span className="tiny muted mono">{formatDateTime(s.at)}</span>
                        <span className="dk-step-text">{s.action}</span>
                        <Tag tone={STEP_TAG[s.status].tone} square>{STEP_TAG[s.status].label}</Tag>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Section>
          ))}
        </>
      )}
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="担当と期限を変更"
        description="変更は記録に残ります。代理には主担当と別の人を指定してください。"
        footer={
          <>
            <Button onClick={() => setEditing(null)}>キャンセル</Button>
            <Button variant="primary" disabled={owner === deputy} disabledReason="主担当と代理は別の人にしてください" onClick={() => { toast({ kind: "success", message: `${editing?.target} の担当と期限を変更しました` }); setEditing(null); }}>保存</Button>
          </>
        }
      >
        <div className="stack">
          <Select label="主担当" value={owner} onChange={setOwner} options={PEOPLE} />
          <Select label="代理" value={deputy} onChange={setDeputy} options={PEOPLE} error={owner === deputy ? "主担当と同じ人は代理にできません" : undefined} />
          <DatePicker label="応答期限" value={due} onChange={setDue} />
        </div>
      </Modal>
    </AppLayout>
  );
}
