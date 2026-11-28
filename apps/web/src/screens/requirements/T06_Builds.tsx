// 画面ID: T-06 ビルド・CI証跡
// 複数の CI 基盤から、実行ID・ソースSHA・環境・依存関係・成果物ダイジェスト・失敗／再実行／キャンセルを取り込み、同一版との対応を確認する。
import { useMemo, useState } from "react";
import { useScreenState } from "../../lib/router";
import { paths } from "../../lib/paths";
import type { ProviderKey } from "../../lib/vocab";
import { PROVIDERS } from "../../lib/vocab";
import { fakeSha } from "../../mocks/core";
import { buildRuns } from "../../mocks/requirements";
import type { BuildRun } from "../../mocks/requirements";
import {
  Banner,
  Button,
  CodeRef,
  DataTable,
  Drawer,
  EmptyState,
  ErrorState,
  FilterBar,
  HashDisplay,
  Icon,
  IdLink,
  KeyValueList,
  PageHeader,
  ProjectLayout,
  ProviderBadge,
  Skeleton,
  SourceTag,
  Tag,
  Timestamp,
} from "../../ui";
import type { Column } from "../../ui";
import { OpenInSource, org, project, ViewOnlyNote } from "./common";

const STATUS: Record<BuildRun["status"], { label: string; tone: "pass" | "fail" | "neutral" | "info"; icon: "checkCircle" | "xCircle" | "circleDashed" | "refresh" }> = {
  success: { label: "成功", tone: "pass", icon: "checkCircle" },
  failed: { label: "失敗", tone: "fail", icon: "xCircle" },
  cancelled: { label: "キャンセル", tone: "neutral", icon: "circleDashed" },
  running: { label: "実行中", tone: "info", icon: "refresh" },
};

const CI_PROVIDERS: ProviderKey[] = ["githubActions", "gitlabCi", "codebuild", "azurePipelines", "jenkins"];

export function Builds() {
  const state = useScreenState();
  const [values, setValues] = useState<Record<string, string>>({});
  const [open, setOpen] = useState<BuildRun | null>(state === "drawer" || state === "mismatch" ? buildRuns[1] : null);
  const rows = useMemo(() => (state === "empty" ? [] : buildRuns.filter((b) => (!values.provider || b.provider === values.provider) && (!values.status || b.status === values.status))), [values, state]);
  const mismatch = state === "mismatch";
  const columns: Column<BuildRun>[] = [
    { key: "id", header: "実行ID", render: (b) => <span className="stack" style={{ ["--gap" as string]: "2px" }}><span className="mono small">{b.id}</span><span className="tiny muted">{b.workflow}</span></span>, hideable: false },
    { key: "provider", header: "CI 基盤", render: (b) => <ProviderBadge provider={b.provider} size="sm" showStatus />, sortValue: (b) => b.provider },
    { key: "repo", header: "リポジトリ・ブランチ", render: (b) => <span className="stack" style={{ ["--gap" as string]: "2px" }}><span className="small">{b.repo}</span><span className="tiny muted">{b.branch}</span></span> },
    { key: "sha", header: "ソース", render: (b) => <CodeRef kind="commit" value={fakeSha(b.sha_seed)} /> },
    { key: "status", header: "結果", render: (b) => <span className="row nowrap" style={{ ["--gap" as string]: "4px" }}><Tag tone={STATUS[b.status].tone} square icon={STATUS[b.status].icon}>{STATUS[b.status].label}</Tag>{b.attempt > 1 ? <Tag square>再実行 {b.attempt}回目</Tag> : null}</span>, sortValue: (b) => b.status },
    { key: "artifacts", header: "成果物", render: (b) => (b.artifacts.length ? <span className="small">{b.artifacts.length}件</span> : <span className="muted small">—</span>) },
    { key: "release", header: "リリース", render: (b) => (b.release ? <IdLink id={b.release} to={paths.release(org, project, b.release)} /> : <span className="muted small">—</span>), defaultHidden: true },
    { key: "env", header: "ビルド環境", render: (b) => <span className="tiny muted">{b.environment}</span>, defaultHidden: true },
    { key: "at", header: "開始", render: (b) => <span className="small muted"><Timestamp at={b.started_at} /></span>, sortValue: (b) => b.started_at },
  ];
  return (
    <ProjectLayout active="builds" trail={[{ label: "ビルド・CI証跡" }]}>
      <PageHeader
        title="ビルド・CI証跡"
        description="CI 実行ごとのソースコミット、ビルド環境、依存関係、成果物のダイジェストを確認します。失敗・再実行・キャンセルも記録として残し、リリース候補と同じ版から作られたかを照合します。"
        meta={<SourceTag source={{ provider: "githubActions", label: "ほか CI 基盤 4 件", synced_at: "2026-11-27T10:27:00+09:00", status: "healthy" }} />}
        actions={<OpenInSource label="CI で開く" />}
      />
      <ViewOnlyNote>ビルドの再実行は担当者が CI で行います。ここでは取り込んだ記録を確認します。</ViewOnlyNote>
      {state === "loading" ? (
        <Skeleton rows={6} />
      ) : state === "error" ? (
        <ErrorState title="CI の記録を読み込めませんでした" />
      ) : (
        <>
          <div className="card tight row" style={{ ["--gap" as string]: "16px" }}>
            <span className="small muted">接続している CI 基盤</span>
            {CI_PROVIDERS.map((p) => (
              <span key={p} className="row nowrap" style={{ ["--gap" as string]: "4px" }}>
                <ProviderBadge provider={p} size="sm" showStatus />
                <span className="tiny muted">{buildRuns.filter((b) => b.provider === p).length}件</span>
              </span>
            ))}
          </div>
          <FilterBar
            filters={[
              { key: "provider", label: "CI 基盤", options: CI_PROVIDERS.map((p) => ({ value: p, label: PROVIDERS[p].label })) },
              { key: "status", label: "結果", options: Object.entries(STATUS).map(([value, v]) => ({ value, label: v.label })) },
            ]}
            values={values}
            onChange={(k, v) => setValues((x) => ({ ...x, [k]: v }))}
          />
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(b) => b.id}
            onRowClick={setOpen}
            empty={
              state === "empty" ? (
                <EmptyState icon="cpu" title="取り込んだ CI の記録はありません" description="CI・品質ツールの連携を追加すると、実行ごとの記録が取り込まれます。" action={<Button icon="plug" to={paths.connectors(org)}>連携を確認</Button>} />
              ) : (
                <EmptyState variant="filtered" title="条件に一致する実行はありません" action={<Button onClick={() => setValues({})}>条件をクリア</Button>} />
              )
            }
          />
        </>
      )}
      <Drawer
        open={Boolean(open)}
        onClose={() => setOpen(null)}
        width={720}
        title={open ? open.id : ""}
        subtitle={open ? <span className="row"><ProviderBadge provider={open.provider} size="sm" /><Tag tone={STATUS[open.status].tone} square>{STATUS[open.status].label}</Tag></span> : undefined}
        footer={<OpenInSource label="CI の実行ログを開く" />}
      >
        {open ? (
          <div className="stack">
            {open.release ? (
              mismatch ? (
                <Banner tone="fail" title="リリース候補と版が一致しません">
                  リリース <IdLink id={open.release} to={paths.release(org, project, open.release)} /> のタグが指すコミットと、この実行のソースコミットが異なります。この成果物はリリースの証跡として使えません。
                </Banner>
              ) : (
                <Banner tone="pass" title="リリース候補と同じ版から作られています">
                  タグ v1.4.0-rc.1 のコミット・成果物のダイジェストが、リリース <IdLink id={open.release} to={paths.release(org, project, open.release)} /> の記録と一致しました。
                </Banner>
              )
            ) : null}
            <KeyValueList
              items={[
                { label: "ワークフロー", value: open.workflow },
                { label: "きっかけ", value: open.trigger },
                { label: "リポジトリ", value: open.repo },
                { label: "ブランチ", value: open.branch },
                { label: "ソースコミット", value: <CodeRef kind="commit" value={fakeSha(mismatch ? "c143x" : open.sha_seed)} /> },
                { label: "試行", value: open.attempt > 1 ? `${open.attempt}回目（再実行）` : "1回目" },
                { label: "ビルド環境", value: open.environment },
                { label: "依存関係", value: <HashDisplay value={fakeSha(open.lock_seed)} label="ロックファイルのハッシュ" /> },
                { label: "開始・所要時間", value: <span><Timestamp at={open.started_at} mode="absolute" />（{open.duration_min}分）</span> },
              ]}
            />
            {open.note ? <p className="small"><Icon name="info" size={13} /> {open.note}</p> : null}
            <div className="stack" style={{ ["--gap" as string]: "6px" }}>
              <span className="label">成果物とダイジェスト</span>
              {open.artifacts.length ? (
                open.artifacts.map((a) => (
                  <div key={a.name} className="row between" style={{ padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
                    <span className="mono small">{a.name}</span>
                    <HashDisplay value={fakeSha(a.seed)} verified={open.release ? (mismatch ? "mismatch" : "match") : undefined} />
                  </div>
                ))
              ) : (
                <span className="small muted">成果物はありません（{STATUS[open.status].label}）</span>
              )}
            </div>
            {open.attempt > 1 ? (
              <div className="stack" style={{ ["--gap" as string]: "6px" }}>
                <span className="label">試行の履歴</span>
                <div className="table-wrap">
                  <table className="table compact">
                    <thead><tr><th>試行</th><th>結果</th><th>理由</th></tr></thead>
                    <tbody>
                      <tr><td>1回目</td><td><Tag tone="fail" square>失敗</Tag></td><td className="small">依存取得のタイムアウト</td></tr>
                      <tr><td>2回目</td><td><Tag tone="pass" square>成功</Tag></td><td className="small">同じコミットで再実行</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </Drawer>
    </ProjectLayout>
  );
}
