// 画面ID: T-03 テスト・検証結果
// テストケースと実行結果は CI・テストコードから、検証／妥当性確認の記録は正本の記録から同期する。
// 実施者と承認者は別の人。顧客の確認は期限付き承認リンクで記録される。
import { useState } from "react";
import { useScreenState } from "../../lib/router";
import { paths } from "../../lib/paths";
import type { TestCase } from "../../lib/types";
import { fakeSha, requirements, testCases } from "../../mocks/core";
import { customerConfirmations, reqSource, retests, skippedTests, testFailures, testRunDetails, testRuns, verificationRecords } from "../../mocks/requirements";
import type { VerificationRecord } from "../../mocks/requirements";
import {
  ApprovalPanel,
  Banner,
  Button,
  CodeRef,
  DataTable,
  Drawer,
  EmptyState,
  ErrorState,
  ExternalActor,
  HashDisplay,
  Icon,
  IdLink,
  KeyValueList,
  PageHeader,
  ProjectLayout,
  ProviderBadge,
  Skeleton,
  SoDNotice,
  SourceTag,
  StatCard,
  Tabs,
  Tag,
  Timestamp,
} from "../../ui";
import type { Column } from "../../ui";
import { OpenInSource, org, project, reqPath, ViewOnlyNote } from "./common";

const RESULT: Record<string, { label: string; icon: "checkCircle" | "xCircle" | "circleDashed" | "alert" | "clock" }> = {
  passed: { label: "成功", icon: "checkCircle" },
  failed: { label: "失敗", icon: "xCircle" },
  skipped: { label: "スキップ", icon: "circleDashed" },
  notRun: { label: "未実行", icon: "circleDashed" },
  conditional: { label: "条件付き", icon: "alert" },
  pending: { label: "再試験待ち", icon: "clock" },
};
const TEST_KIND: Record<TestCase["kind"], string> = { unit: "単体", integration: "結合", acceptance: "受入" };

function Result({ value }: { value: string }) {
  const r = RESULT[value];
  return <span className={`result-dot ${value === "pending" ? "skipped" : value}`}><Icon name={r.icon} size={14} />{r.label}</span>;
}

const testColumns: Column<TestCase>[] = [
  { key: "id", header: "ID", render: (t) => <span className="id-link">{t.id}</span>, sortValue: (t) => t.id, hideable: false },
  { key: "title", header: "タイトル", render: (t) => t.title, sortValue: (t) => t.title, hideable: false },
  { key: "kind", header: "種類", render: (t) => <Tag square>{TEST_KIND[t.kind]}</Tag>, sortValue: (t) => t.kind },
  { key: "reqs", header: "対応する要求", render: (t) => (t.requirement_ids.length ? <span className="row" style={{ ["--gap" as string]: "6px" }}>{t.requirement_ids.map((r) => <IdLink key={r} id={r} to={reqPath(r)} title={requirements.find((x) => x.id === r)?.title} />)}</span> : <span className="presence ng"><Icon name="xCircle" size={14} />なし</span>) },
  { key: "result", header: "最新の結果", render: (t) => <Result value={t.last_result} />, sortValue: (t) => t.last_result },
  { key: "where", header: "正本", render: (t) => <span className="mono tiny muted">tests/{t.kind === "unit" ? "unit" : t.kind === "integration" ? "integration" : "acceptance"}/…（{t.id}）</span>, defaultHidden: true },
];

export function Verification() {
  const state = useScreenState();
  const [tab, setTab] = useState(state === "records" || state === "recordDrawer" || state === "sod" ? "verification" : state === "results" ? "results" : state === "validation" ? "validation" : "cases");
  const [drawer, setDrawer] = useState<VerificationRecord | null>(state === "recordDrawer" ? verificationRecords[1] : state === "sod" ? verificationRecords[2] : null);
  const empty = state === "empty";
  const cases = empty ? [] : testCases;
  const records = (kind: VerificationRecord["kind"]) => (empty ? [] : verificationRecords.filter((v) => v.kind === kind));
  const isSod = state === "sod";
  const recordColumns: Column<VerificationRecord>[] = [
    { key: "id", header: "ID", render: (v) => <span className="id-link">{v.id}</span>, sortValue: (v) => v.id, hideable: false },
    { key: "target", header: "対象", render: (v) => v.target, hideable: false },
    { key: "method", header: "方法", render: (v) => <span className="small">{v.method}</span> },
    { key: "result", header: "結果", render: (v) => <Result value={v.result} />, sortValue: (v) => v.result },
    { key: "performer", header: "実施者", render: (v) => <ExternalActor userId={v.performer_id} /> },
    { key: "reviewer", header: "承認者", render: (v) => (v.reviewer_id ? <ExternalActor userId={v.reviewer_id} /> : <Tag tone={v.review_status === "pending" ? "warn" : "neutral"}>{v.review_status === "pending" ? "承認待ち" : "下書き"}</Tag>) },
    ...(tab === "validation" ? [{ key: "customer", header: "顧客の確認", render: (v: VerificationRecord) => { const c = customerConfirmations.find((x) => x.record === v.id); return c ? <Tag tone={c.at ? "pass" : "warn"} square>{c.result}</Tag> : <span className="muted small">—</span>; } }] : []),
    { key: "evidence", header: "証跡", render: (v) => <span className="mono small">{v.evidence}</span> },
    { key: "at", header: "実施日時", render: (v) => <span className="small muted"><Timestamp at={v.at} /></span>, sortValue: (v) => v.at },
  ];
  const failedRuns = testRuns.filter((r) => r.failed > 0).length;
  const latest = testRuns[0];
  const latestDetail = testRunDetails[latest.id];
  const drawerCustomer = drawer ? customerConfirmations.find((x) => x.record === drawer.id) : undefined;
  return (
    <ProjectLayout active="verification" trail={[{ label: "テスト・検証" }]}>
      <PageHeader
        title="テスト・検証"
        description="テストケースと CI の実行結果、検証（Verification：作ったものが仕様どおりか）と妥当性確認（Validation：利用者の目的を満たすか）の記録を確認します。実施者と承認者は別の人です。"
        meta={<SourceTag source={{ provider: "githubActions", label: "CI のテストレポート", synced_at: "2026-11-27T10:27:00+09:00", status: "healthy" }} />}
        actions={<OpenInSource label="CI で開く" />}
        tabs={
          <Tabs
            value={tab}
            onChange={setTab}
            tabs={[
              { value: "cases", label: "テストケース", count: cases.length },
              { value: "results", label: "実行結果", count: empty ? 0 : testRuns.length },
              { value: "retests", label: "再試験", count: empty ? 0 : retests.length },
              { value: "verification", label: "検証記録", count: records("verification").length },
              { value: "validation", label: "妥当性確認記録", count: records("validation").length },
            ]}
          />
        }
      />
      <ViewOnlyNote>テストの登録や記録の作成は、担当者が正本（テストコード、CI、検証記録）で行います。ここでは同期した内容と承認の状態を確認します。</ViewOnlyNote>
      {state === "loading" ? (
        <Skeleton rows={6} />
      ) : state === "error" ? (
        <ErrorState />
      ) : tab === "cases" ? (
        <DataTable
          columns={testColumns}
          rows={cases}
          rowKey={(t) => t.id}
          empty={<EmptyState icon="checkSquare" title="テストケースがありません" description="テストコードに要求IDの注記があると、ここに同期されます。" action={<Button icon="plug" to={paths.connectors(org)}>連携を確認</Button>} />}
        />
      ) : tab === "results" ? (
        empty ? (
          <div className="card"><EmptyState icon="cpu" title="テスト結果はまだありません" description="CI でテストが実行されると、結果が自動で取り込まれます。" /></div>
        ) : (
          <div className="stack">
            <div className="grid cols-4">
              <StatCard label="直近の実行" value={latest.passed + latest.failed + latest.skipped} unit="件" delta={<Timestamp at={latest.at} />} icon="cpu" />
              <StatCard label="成功" value={latest.passed} tone="good" icon="checkCircle" />
              <StatCard label="失敗を含む実行（直近4回）" value={failedRuns} tone={failedRuns ? "danger" : undefined} icon="xCircle" />
              <StatCard label="スキップ" value={latest.skipped} icon="circleDashed" delta="理由は下の一覧" />
            </div>
            <div className="card flush">
              <div className="card-header"><span className="section-title">CI 実行ごとの結果</span></div>
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>CI実行</th><th>提供元</th><th>コミット</th><th>ブランチ</th><th>実行者</th><th>環境</th><th className="num">成功</th><th className="num">失敗</th><th className="num">スキップ</th><th>日時</th></tr></thead>
                  <tbody>
                    {testRuns.map((r) => {
                      const d = testRunDetails[r.id];
                      return (
                        <tr key={r.id}>
                          <td className="mono small">{r.id}</td>
                          <td>{d ? <ProviderBadge provider={d.provider} size="sm" /> : "—"}</td>
                          <td><CodeRef kind="commit" value={fakeSha(r.commit)} /></td>
                          <td className="small">{r.branch}</td>
                          <td className="tiny">{d?.executor ?? "—"}</td>
                          <td className="tiny muted">{d?.environment ?? "—"}</td>
                          <td className="num text-pass">{r.passed}</td>
                          <td className={r.failed ? "num text-fail" : "num"}>{r.failed}</td>
                          <td className="num muted">{r.skipped}</td>
                          <td className="small muted"><Timestamp at={r.at} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {latestDetail ? <div className="card-body tiny muted">環境とコミットは CI のテストレポートに含まれる値です。同じコミットで再実行した場合は、別の実行として記録します。</div> : null}
            </div>
            <div className="card flush">
              <div className="card-header"><span className="section-title">失敗の詳細</span></div>
              <div className="card-body stack" style={{ ["--gap" as string]: "10px" }}>
                {testFailures.map((f) => (
                  <div key={f.test_id} className="gate-reason" style={{ border: "1px solid var(--tone-fail-border)", borderRadius: 8 }}>
                    <Icon name="xCircle" className="ri text-fail" />
                    <div className="stack" style={{ ["--gap" as string]: "4px" }}>
                      <span className="row"><span className="id-link">{f.test_id}</span><span className="strong">{f.title}</span></span>
                      <code className="small" style={{ color: "var(--tone-fail)" }}>{f.message}</code>
                      <CodeRef kind="file" value={f.file} line={f.line} />
                      <span className="tiny muted">関連する不具合: <a className="id-link" href={`#${paths.defects(org, project)}`}>DEF-0031</a></span>
                    </div>
                    <span className="small muted">{f.run}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="card flush">
              <div className="card-header"><span className="section-title">スキップしたテストと理由</span></div>
              <div className="table-wrap">
                <table className="table compact">
                  <thead><tr><th>テスト</th><th>実行</th><th>理由</th></tr></thead>
                  <tbody>
                    {skippedTests.map((t) => (
                      <tr key={t.test_id}><td><span className="id-link">{t.test_id}</span> <span className="small">{t.title}</span></td><td className="mono tiny">{t.run}</td><td className="small">{t.reason}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )
      ) : tab === "retests" ? (
        <div className="card flush">
          <div className="table-wrap">
            <table className="table compact">
              <thead><tr><th>ID</th><th>テスト</th><th>不具合</th><th>元の実行</th><th>再試験の実行</th><th>結果</th><th>備考</th></tr></thead>
              <tbody>
                {(empty ? [] : retests).map((r) => (
                  <tr key={r.id}>
                    <td className="id-link">{r.id}</td>
                    <td className="id-link">{r.test_id}</td>
                    <td><a className="id-link" href={`#${paths.defects(org, project)}`}>{r.defect}</a></td>
                    <td className="mono tiny">{r.original_run}</td>
                    <td className="mono tiny">{r.retest_run}</td>
                    <td><Result value={r.status} /></td>
                    <td className="small muted">{r.note || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <DataTable
          columns={recordColumns}
          rows={records(tab === "verification" ? "verification" : "validation")}
          rowKey={(v) => v.id}
          onRowClick={(v) => setDrawer(v)}
          empty={<EmptyState icon="fileCheck" title={tab === "verification" ? "検証記録がありません" : "妥当性確認記録がありません"} description="対象、方法、結果、実施者の記録が正本に追加されると、ここに表示されます。" />}
        />
      )}

      <Drawer
        open={Boolean(drawer)}
        onClose={() => setDrawer(null)}
        title={drawer ? `${drawer.id} ${drawer.kind === "verification" ? "検証記録" : "妥当性確認記録"}` : ""}
        subtitle={drawer?.target}
      >
        {drawer ? (
          <div className="stack">
            {isSod ? (
              <SoDNotice reason={<>実施者（<ExternalActor userId={drawer.performer_id} />）本人が承認しようとした記録があります。実施者の承認は数えず、別の承認者の判断を待っています。</>} />
            ) : null}
            <KeyValueList
              items={[
                { label: "種類", value: drawer.kind === "verification" ? "検証（仕様どおりに作られているか）" : "妥当性確認（利用者の目的を満たすか）" },
                { label: "対象", value: drawer.target },
                { label: "方法", value: drawer.method },
                { label: "結果", value: <Result value={drawer.result} /> },
                { label: "実施者", value: <ExternalActor userId={drawer.performer_id} /> },
                { label: "実施日時", value: <Timestamp at={drawer.at} mode="absolute" /> },
                { label: "証跡", value: <span className="row"><span className="mono small">{drawer.evidence}</span><HashDisplay value={fakeSha(drawer.evidence)} /></span> },
                ...(drawerCustomer ? [{ label: "顧客の確認", value: <span className="stack" style={{ ["--gap" as string]: "2px" }}><span className="row"><ExternalActor userId={drawerCustomer.by} /><Tag tone={drawerCustomer.at ? "pass" : "warn"} square>{drawerCustomer.result}</Tag></span><span className="tiny muted">{drawerCustomer.via}{drawerCustomer.at ? ` · ${new Date(drawerCustomer.at).toLocaleDateString("ja-JP")}` : ""}</span></span> }] : []),
              ]}
            />
            <ApprovalPanel
              approvers={[{ role: "PM", user_id: drawer.reviewer_id ?? "u-sato", status: drawer.review_status === "approved" ? "approved" : drawer.review_status === "pending" ? "pending" : "draft", decided_at: drawer.review_status === "approved" ? drawer.at : undefined }]}
              canDecide={false}
            />
            <p className="tiny muted"><Icon name="info" size={12} /> 承認は承認者本人が正本で行います。実施者は自分の記録を承認できません。</p>
            {drawer.result === "failed" ? <Banner tone="fail" title="結果は失敗です">再試験の状況は「再試験」タブで確認できます。</Banner> : null}
            <Button variant="ghost" icon="barChart" to={paths.audit(org, project)}>関連する統制項目を見る</Button>
          </div>
        ) : null}
      </Drawer>
      <p className="tiny muted">出典: <SourceTag source={reqSource("docs/verification")} prefix="検証記録の正本" /></p>
    </ProjectLayout>
  );
}
