// 画面ID: T-04 不具合と是正
// 正本は課題管理（GitHub Issues）。不具合と修正コミット、再試験、要求との関係、リリース時の既知の問題を確認する。
import { useMemo, useState } from "react";
import { useScreenState } from "../../lib/router";
import { paths } from "../../lib/paths";
import { SEVERITY } from "../../lib/vocab";
import { fakeSha } from "../../mocks/core";
import { defects } from "../../mocks/requirements";
import type { Defect } from "../../mocks/requirements";
import {
  Banner,
  Button,
  CodeRef,
  DataTable,
  Drawer,
  EmptyState,
  ErrorState,
  ExternalActor,
  FilterBar,
  IdLink,
  KeyValueList,
  PageHeader,
  ProjectLayout,
  Skeleton,
  SourceTag,
  StatCard,
  StatusBadge,
  Tag,
  Timestamp,
} from "../../ui";
import type { Column } from "../../ui";
import { OpenInSource, org, project, reqPath, ViewOnlyNote } from "./common";

const STATUS: Record<Defect["status"], { label: string; tone: "fail" | "warn" | "info" | "pass" | "special" }> = {
  open: { label: "未着手", tone: "fail" },
  fixing: { label: "修正中", tone: "warn" },
  retest: { label: "再試験待ち", tone: "info" },
  closed: { label: "完了", tone: "pass" },
  known: { label: "既知の問題として出荷", tone: "special" },
};
const RETEST = { passed: "成功", failed: "失敗", pending: "未実施" } as const;

export function Defects() {
  const state = useScreenState();
  const [values, setValues] = useState<Record<string, string>>(state === "knownIssues" ? { status: "known" } : {});
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<Defect | null>(state === "drawer" ? defects[0] : null);
  const rows = useMemo(
    () => (state === "empty" ? [] : defects.filter((d) => (!values.status || d.status === values.status) && (!values.severity || d.severity === values.severity) && (!search || `${d.id} ${d.issue} ${d.title}`.includes(search)))),
    [values, search, state],
  );
  const active = defects.filter((d) => d.status !== "closed");
  const columns: Column<Defect>[] = [
    { key: "id", header: "ID", render: (d) => <span className="stack" style={{ ["--gap" as string]: "2px" }}><span className="id-link">{d.id}</span><span className="tiny muted mono">{d.issue}</span></span>, sortValue: (d) => d.id, hideable: false },
    { key: "title", header: "タイトル", render: (d) => <span className="strong" style={{ fontWeight: 500 }}>{d.title}</span>, hideable: false },
    { key: "severity", header: "重大度", render: (d) => <StatusBadge vocab={SEVERITY[d.severity]} size="sm" />, sortValue: (d) => ["critical", "high", "medium", "low", "info"].indexOf(d.severity) },
    { key: "status", header: "状態", render: (d) => <Tag tone={STATUS[d.status].tone} square>{STATUS[d.status].label}</Tag>, sortValue: (d) => d.status },
    { key: "assignee", header: "担当", render: (d) => <ExternalActor userId={d.assignee} /> },
    { key: "fix", header: "修正", render: (d) => (d.fix_commit ? <span className="row nowrap" style={{ ["--gap" as string]: "6px" }}><CodeRef kind="commit" value={fakeSha(d.fix_commit)} />{d.fix_pr ? <CodeRef kind="pr" value={String(d.fix_pr)} /> : null}</span> : <span className="muted small">—</span>) },
    { key: "retest", header: "再試験", render: (d) => (d.retest ? <Tag tone={d.retest === "passed" ? "pass" : d.retest === "failed" ? "fail" : "neutral"} square>{RETEST[d.retest]}</Tag> : <span className="muted small">—</span>) },
    { key: "reqs", header: "関係する要求", render: (d) => (d.requirement_ids.length ? <span className="row" style={{ ["--gap" as string]: "6px" }}>{d.requirement_ids.map((r) => <IdLink key={r} id={r} to={reqPath(r)} />)}</span> : <Tag tone="warn" square>未リンク</Tag>) },
    { key: "found", header: "発見工程", render: (d) => <span className="small">{d.found_in}</span>, defaultHidden: true },
    { key: "at", header: "報告日時", render: (d) => <span className="small muted"><Timestamp at={d.reported_at} /></span>, sortValue: (d) => d.reported_at },
  ];
  return (
    <ProjectLayout active="defects" trail={[{ label: "不具合と是正" }]}>
      <PageHeader
        title="不具合と是正"
        description="不具合の再現条件、重大度、担当、修正コミット、再試験、要求との関係を確認します。リリースに残す既知の問題はリリースノートに記載されます。"
        meta={<SourceTag source={{ provider: "github", label: "Issues（label: bug）", synced_at: "2026-11-27T10:28:00+09:00", status: "healthy" }} />}
        actions={<OpenInSource label="課題管理で開く" />}
      />
      <ViewOnlyNote>不具合の登録・更新は担当者が課題管理で行います。ここでは同期した内容と、修正・再試験・リリースへの影響を確認します。</ViewOnlyNote>
      {state === "loading" ? (
        <Skeleton rows={6} />
      ) : state === "error" ? (
        <ErrorState title="不具合を読み込めませんでした" />
      ) : (
        <>
          <div className="grid auto-fit">
            <StatCard label="未解決" value={state === "empty" ? 0 : active.length} unit="件" icon="alertCircle" tone={active.length ? "warn" : undefined} />
            <StatCard label="重大度「高」以上の未解決" value={state === "empty" ? 0 : active.filter((d) => d.severity === "high" || d.severity === "critical").length} unit="件" tone="danger" icon="alert" />
            <StatCard label="再試験待ち" value={state === "empty" ? 0 : defects.filter((d) => d.status === "retest").length} unit="件" icon="refresh" />
            <StatCard label="既知の問題（v1.4.0）" value={state === "empty" ? 0 : defects.filter((d) => d.status === "known").length} unit="件" icon="flag" to={paths.release(org, project, "rel-140")} />
          </div>
          {state !== "empty" && defects.some((d) => d.requirement_ids.length === 0) ? (
            <Banner tone="warn" title="要求にリンクされていない不具合があります">DEF-0027 はどの要求にも関係付けられていません。担当者に課題管理で要求IDを記載してもらってください。</Banner>
          ) : null}
          <FilterBar
            filters={[
              { key: "status", label: "状態", options: Object.entries(STATUS).map(([value, v]) => ({ value, label: v.label })) },
              { key: "severity", label: "重大度", options: Object.entries(SEVERITY).map(([value, v]) => ({ value, label: v.label })) },
            ]}
            values={values}
            onChange={(k, v) => setValues((x) => ({ ...x, [k]: v }))}
            search={search}
            onSearch={setSearch}
            searchPlaceholder="ID・課題番号・タイトル"
          />
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(d) => d.id}
            onRowClick={setOpen}
            empty={
              state === "empty" ? (
                <EmptyState icon="checkCircle" title="同期された不具合はありません" description="課題管理で bug ラベルの付いた課題が作られると、ここに表示されます。" action={<Button icon="plug" to={paths.connectors(org)}>連携を確認</Button>} />
              ) : (
                <EmptyState variant="filtered" title="条件に一致する不具合はありません" action={<Button onClick={() => { setValues({}); setSearch(""); }}>条件をクリア</Button>} />
              )
            }
          />
        </>
      )}
      <Drawer
        open={Boolean(open)}
        onClose={() => setOpen(null)}
        title={open ? `${open.id} ${open.title}` : ""}
        subtitle={open ? <span className="row"><StatusBadge vocab={SEVERITY[open.severity]} size="sm" /><Tag tone={STATUS[open.status].tone} square>{STATUS[open.status].label}</Tag></span> : undefined}
        footer={<OpenInSource label="課題を開く" />}
      >
        {open ? (
          <div className="stack">
            <div className="stack" style={{ ["--gap" as string]: "4px" }}>
              <span className="label">再現条件</span>
              <pre className="req-mono-pre">{open.repro}</pre>
            </div>
            <KeyValueList
              items={[
                { label: "課題", value: <span className="mono small">{open.issue}</span> },
                { label: "報告者", value: <ExternalActor userId={open.reported_by} /> },
                { label: "担当", value: <ExternalActor userId={open.assignee} /> },
                { label: "発見工程", value: open.found_in },
                { label: "修正コミット", value: open.fix_commit ? <CodeRef kind="commit" value={fakeSha(open.fix_commit)} /> : <span className="muted">未修正</span> },
                { label: "修正 PR", value: open.fix_pr ? <CodeRef kind="pr" value={String(open.fix_pr)} /> : <span className="muted">—</span> },
                { label: "再試験", value: open.retest ? RETEST[open.retest] : <span className="muted">—</span> },
                { label: "関係する要求", value: open.requirement_ids.length ? open.requirement_ids.map((r) => <IdLink key={r} id={r} to={reqPath(r)} />) : <span className="muted">なし</span> },
                { label: "リリースでの扱い", value: open.release_note ?? (open.status === "closed" ? "修正済み" : "次のリリースまでに修正予定") },
                { label: "最終同期", value: <Timestamp at={open.synced_at} /> },
              ]}
            />
            {open.status === "retest" ? <Banner tone="info" title="修正済み・再試験待ち">修正 PR のマージ後、CI の再実行結果で再試験が記録されます。</Banner> : null}
          </div>
        ) : null}
      </Drawer>
    </ProjectLayout>
  );
}
