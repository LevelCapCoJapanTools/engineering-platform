// 画面ID: J-04 進捗
import { useState } from "react";
import {
  AIFindingCard,
  AISectionHead,
  AIUnavailableNotice,
  Button,
  ErrorState,
  Modal,
  PageHeader,
  ProjectLayout,
  Section,
  Segmented,
  Skeleton,
  Tag,
  TextArea,
  Timeline,
  cx,
  useToast,
} from "../../ui";
import { useScreenState } from "../../lib/router";
import { userById } from "../../mocks/core";
import { PROGRESS_NOW_WEEK, progressFindings, progressRecords, progressTasks } from "../../mocks/planning";
import type { ProgressTask } from "../../mocks/planning";
import { orgOf, projectOf } from "./shared";

export const J04_STATES = ["既定", "読み込み中", "取得失敗", "AI無効"];

const RANGES = { all: [0, 26], quarter: [8, 21], month: [10, 15] } as const;
const statusLabel: Record<ProgressTask["status"], { label: string; tone: "pass" | "info" | "neutral" }> = {
  done: { label: "完了", tone: "pass" },
  inProgress: { label: "進行中", tone: "info" },
  notStarted: { label: "未着手", tone: "neutral" },
};

function weekLabel(w: number) {
  const d = new Date("2026-09-01T00:00:00+09:00");
  d.setDate(d.getDate() + Math.round(w * 7));
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function J04Progress({ params }: { params: Record<string, string> }) {
  const state = useScreenState();
  const org = orgOf(params);
  const pr = projectOf(params);
  const toast = useToast();
  const [range, setRange] = useState<keyof typeof RANGES>("all");
  const [record, setRecord] = useState(false);
  const [lo, hi] = RANGES[range];
  const span = hi - lo;
  const pct = (w: number) => `${Math.max(0, Math.min(100, ((w - lo) / span) * 100))}%`;
  const width = (a: number, b: number) => `${Math.max(1.5, ((Math.min(b, hi) - Math.max(a, lo)) / span) * 100)}%`;
  const ticks = Array.from({ length: 6 }).map((_, i) => lo + (span / 5) * i);

  return (
    <ProjectLayout org={org} project={pr} active="progress" trail={[{ label: "進捗" }]}>
      <PageHeader
        title="進捗"
        description="計画した作業と実績（Issue／PR）を比較します。"
        actions={
          <>
            <Segmented value={range} onChange={(v) => setRange(v as keyof typeof RANGES)} options={[{ value: "month", label: "1か月" }, { value: "quarter", label: "3か月" }, { value: "all", label: "全期間" }]} />
            <Button variant="primary" icon="plus" onClick={() => setRecord(true)}>進捗記録を作成</Button>
          </>
        }
      />
      {state === "読み込み中" ? (
        <Skeleton variant="table" rows={8} />
      ) : state === "取得失敗" ? (
        <ErrorState />
      ) : (
        <>
          <Section title="計画と実績" sub="上段の灰色が計画、下段が実績（遅れは橙色）。赤い線は今日" actions={<span className="row small muted"><Tag square>計画</Tag><Tag tone="primary" square>実績</Tag><Tag tone="warn" square>遅れ</Tag></span>}>
            <div className="stack" style={{ ["--gap" as string]: "10px" }}>
              <div className="pl-gantt-scale">
                <span />
                <div className="ticks">{ticks.map((t) => <span key={t} style={{ left: pct(t) }}>{weekLabel(t)}</span>)}</div>
              </div>
              <div className="gantt">
                {progressTasks.map((t) => (
                  <div key={t.id} className="gantt-row">
                    <div className="stack" style={{ ["--gap" as string]: "0" }}>
                      <span className="strong truncate" style={{ fontWeight: 500 }}>{t.title}</span>
                      <span className="tiny muted mono">{t.id}</span>
                    </div>
                    <div className="gantt-track">
                      {t.planEnd > lo && t.planStart < hi ? <span className="gantt-bar plan" style={{ left: pct(t.planStart), width: width(t.planStart, t.planEnd) }} title={`計画: ${weekLabel(t.planStart)}〜${weekLabel(t.planEnd)}`} /> : null}
                      {t.actStart !== undefined && (t.actEnd ?? PROGRESS_NOW_WEEK) > lo && t.actStart < hi ? (
                        <span className={cx("gantt-bar actual", t.late && "late")} style={{ left: pct(t.actStart), width: width(t.actStart, t.actEnd ?? PROGRESS_NOW_WEEK) }} title={`実績: ${weekLabel(t.actStart)}〜${t.actEnd ? weekLabel(t.actEnd) : "進行中"}`} />
                      ) : null}
                      {PROGRESS_NOW_WEEK > lo && PROGRESS_NOW_WEEK < hi ? <span className="pl-gantt-now" style={{ left: pct(PROGRESS_NOW_WEEK) }} aria-hidden /> : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Section>
          <div className="grid main-side">
            <Section title="計画した作業と実績の対応" flush>
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>作業</th><th>計画</th><th>実績</th><th>Issue／PR</th><th>状態</th></tr></thead>
                  <tbody>
                    {progressTasks.map((t) => (
                      <tr key={t.id}>
                        <td><span className="mono small muted">{t.id}</span> {t.title}</td>
                        <td className="small nowrap">{weekLabel(t.planStart)}〜{weekLabel(t.planEnd)}</td>
                        <td className="small nowrap">{t.actStart !== undefined ? `${weekLabel(t.actStart)}〜${t.actEnd ? weekLabel(t.actEnd) : "進行中"}` : "—"} {t.late ? <Tag tone="warn">遅れ</Tag> : null}</td>
                        <td className="small">{t.issues.length ? t.issues.join(", ") : <span className="muted">未対応付け</span>}</td>
                        <td><Tag tone={statusLabel[t.status].tone}>{statusLabel[t.status].label}</Tag></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
            <div className="stack">
              <Section title="遅延の予兆">
                {state === "AI無効" ? (
                  <AIUnavailableNotice reason="orgDisabled" />
                ) : (
                  <div className="stack" style={{ ["--gap" as string]: "10px" }}>
                    <AISectionHead count={progressFindings.length} note="計画の変更は人が判断します" />
                    {progressFindings.map((f) => <AIFindingCard key={f.id} finding={f} compact />)}
                  </div>
                )}
              </Section>
              <Section title="進捗記録">
                <Timeline compact items={progressRecords.map((r) => ({ id: r.id, actor: { kind: "human" as const, name: userById(r.by)?.name ?? "" }, action: `進捗記録 ${r.id}`, at: r.at, detail: r.summary }))} />
              </Section>
            </div>
          </div>
        </>
      )}
      <Modal
        open={record}
        onClose={() => setRecord(false)}
        title="進捗記録を作成"
        description="記録は統制項目 CTL-PM-003 の証跡になります。"
        footer={<><Button variant="ghost" onClick={() => setRecord(false)}>キャンセル</Button><Button variant="primary" onClick={() => { setRecord(false); toast({ kind: "success", message: "進捗記録 PRG-019 を作成しました" }); }}>記録する</Button></>}
      >
        <div className="stack">
          <TextArea label="概要" required rows={4} defaultValue="基幹連携は仕様確定待ちで1週遅れ。帳票は計画どおり。" />
          <TextArea label="課題と対応" rows={3} placeholder="遅れの原因と対応策" />
        </div>
      </Modal>
    </ProjectLayout>
  );
}
