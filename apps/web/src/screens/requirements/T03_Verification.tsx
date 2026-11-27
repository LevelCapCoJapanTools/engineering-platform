// 画面ID: T-03 テスト・検証結果
import { useState } from "react";
import { useScreenState } from "../../lib/router";
import { paths } from "../../lib/paths";
import type { TestCase } from "../../lib/types";
import { requirements, testCases, userById } from "../../mocks/core";
import { testFailures, testRuns, verificationRecords } from "../../mocks/requirements";
import type { VerificationRecord } from "../../mocks/requirements";
import {
  ApprovalPanel,
  Button,
  CodeRef,
  Combobox,
  DataTable,
  Drawer,
  EmptyState,
  ErrorState,
  FileUpload,
  HashDisplay,
  Icon,
  IdLink,
  KeyValueList,
  membersWithRole,
  Modal,
  PageHeader,
  ProjectLayout,
  Select,
  Skeleton,
  StatCard,
  Tabs,
  Tag,
  TextArea,
  TextField,
  Timestamp,
  useToast,
  UserChip,
} from "../../ui";
import type { Column } from "../../ui";
import { fakeSha } from "../../mocks/core";
import { org, project, reqPath } from "./common";

const RESULT: Record<string, { label: string; icon: "checkCircle" | "xCircle" | "circleDashed" | "alert" }> = {
  passed: { label: "成功", icon: "checkCircle" },
  failed: { label: "失敗", icon: "xCircle" },
  skipped: { label: "スキップ", icon: "circleDashed" },
  notRun: { label: "未実行", icon: "circleDashed" },
  conditional: { label: "条件付き", icon: "alert" },
};
const TEST_KIND: Record<TestCase["kind"], string> = { unit: "単体", integration: "結合", acceptance: "受入" };

function Result({ value }: { value: string }) {
  const r = RESULT[value];
  return <span className={`result-dot ${value}`}><Icon name={r.icon} size={14} />{r.label}</span>;
}

const testColumns: Column<TestCase>[] = [
  { key: "id", header: "ID", render: (t) => <span className="id-link">{t.id}</span>, sortValue: (t) => t.id, hideable: false },
  { key: "title", header: "タイトル", render: (t) => t.title, sortValue: (t) => t.title, hideable: false },
  { key: "kind", header: "種類", render: (t) => <Tag square>{TEST_KIND[t.kind]}</Tag>, sortValue: (t) => t.kind },
  { key: "reqs", header: "対応する要求", render: (t) => (t.requirement_ids.length ? <span className="row" style={{ ["--gap" as string]: "6px" }}>{t.requirement_ids.map((r) => <IdLink key={r} id={r} to={reqPath(r)} title={requirements.find((x) => x.id === r)?.title} />)}</span> : <span className="presence ng"><Icon name="xCircle" size={14} />なし</span>) },
  { key: "result", header: "最新の結果", render: (t) => <Result value={t.last_result} />, sortValue: (t) => t.last_result },
];

export function Verification() {
  const state = useScreenState();
  const toast = useToast();
  const [tab, setTab] = useState(state === "records" || state === "recordDrawer" || state === "sod" ? "verification" : state === "results" ? "results" : "cases");
  const [registerOpen, setRegisterOpen] = useState(state === "registerModal");
  const [recordOpen, setRecordOpen] = useState(state === "recordModal");
  const [drawer, setDrawer] = useState<VerificationRecord | null>(state === "recordDrawer" || state === "sod" ? verificationRecords[2] : null);
  const empty = state === "empty";
  const cases = empty ? [] : testCases;
  const records = (kind: VerificationRecord["kind"]) => (empty ? [] : verificationRecords.filter((v) => v.kind === kind));
  const recordColumns: Column<VerificationRecord>[] = [
    { key: "id", header: "ID", render: (v) => <span className="id-link">{v.id}</span>, sortValue: (v) => v.id, hideable: false },
    { key: "target", header: "対象", render: (v) => v.target, hideable: false },
    { key: "method", header: "方法", render: (v) => <span className="small">{v.method}</span> },
    { key: "result", header: "結果", render: (v) => <Result value={v.result} />, sortValue: (v) => v.result },
    { key: "performer", header: "実施者", render: (v) => <UserChip user={userById(v.performer_id)} plain /> },
    { key: "reviewer", header: "レビュー者", render: (v) => (v.reviewer_id ? <UserChip user={userById(v.reviewer_id)} plain /> : <Tag tone={v.review_status === "pending" ? "warn" : "neutral"}>{v.review_status === "pending" ? "承認待ち" : "下書き"}</Tag>) },
    { key: "evidence", header: "証跡", render: (v) => <span className="mono small">{v.evidence}</span> },
    { key: "at", header: "実施日時", render: (v) => <span className="small muted"><Timestamp at={v.at} /></span>, sortValue: (v) => v.at },
  ];
  const failedRuns = testRuns.filter((r) => r.failed > 0).length;
  const isPerformer = state === "sod";
  return (
    <ProjectLayout active="verification" trail={[{ label: "テスト・検証" }]}>
      <PageHeader
        title="テスト・検証"
        description="テストケース、CI のテスト結果、検証（Verification）と妥当性確認（Validation）の記録を管理します。実施者と承認者は別の人にします。"
        actions={
          <>
            <Button icon="plus" onClick={() => setRegisterOpen(true)}>テストケースを登録</Button>
            <Button variant="primary" icon="fileCheck" onClick={() => setRecordOpen(true)}>検証記録を作成</Button>
          </>
        }
        tabs={
          <Tabs
            value={tab}
            onChange={setTab}
            tabs={[
              { value: "cases", label: "テストケース", count: cases.length },
              { value: "results", label: "テスト結果", count: empty ? 0 : testRuns.length },
              { value: "verification", label: "検証記録", count: records("verification").length },
              { value: "validation", label: "妥当性確認記録", count: records("validation").length },
            ]}
          />
        }
      />
      {state === "loading" ? (
        <Skeleton rows={6} />
      ) : state === "error" ? (
        <ErrorState />
      ) : tab === "cases" ? (
        <DataTable
          columns={testColumns}
          rows={cases}
          rowKey={(t) => t.id}
          empty={<EmptyState icon="checkSquare" title="テストケースがありません" description="要求ごとにテストケースを登録すると、トレーサビリティに反映されます。" action={<Button variant="primary" icon="plus" onClick={() => setRegisterOpen(true)}>テストケースを登録</Button>} />}
        />
      ) : tab === "results" ? (
        empty ? (
          <div className="card"><EmptyState icon="cpu" title="テスト結果はまだありません" description="GitHub の CI でテストが実行されると、結果が自動で取り込まれます。" /></div>
        ) : (
          <div className="stack">
            <div className="grid cols-4">
              <StatCard label="直近の実行" value={testRuns[0].passed + testRuns[0].failed + testRuns[0].skipped} unit="件" delta={<Timestamp at={testRuns[0].at} />} icon="cpu" />
              <StatCard label="成功" value={testRuns[0].passed} tone="good" icon="checkCircle" />
              <StatCard label="失敗を含む実行（直近4回）" value={failedRuns} tone={failedRuns ? "danger" : undefined} icon="xCircle" />
              <StatCard label="スキップ" value={testRuns[0].skipped} icon="circleDashed" />
            </div>
            <div className="card flush">
              <div className="card-header"><span className="section-title">CI 実行ごとの結果</span></div>
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>CI実行</th><th>コミット</th><th>ブランチ</th><th className="num">成功</th><th className="num">失敗</th><th className="num">スキップ</th><th>日時</th></tr></thead>
                  <tbody>
                    {testRuns.map((r) => (
                      <tr key={r.id}>
                        <td className="mono small">{r.id}</td>
                        <td><CodeRef kind="commit" value={fakeSha(r.commit)} /></td>
                        <td className="small">{r.branch}</td>
                        <td className="num text-pass">{r.passed}</td>
                        <td className={r.failed ? "num text-fail" : "num"}>{r.failed}</td>
                        <td className="num muted">{r.skipped}</td>
                        <td className="small muted"><Timestamp at={r.at} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="card flush">
              <div className="card-header"><span className="section-title">失敗の一覧</span></div>
              <div className="card-body stack" style={{ ["--gap" as string]: "10px" }}>
                {testFailures.map((f) => (
                  <div key={f.test_id} className="gate-reason" style={{ border: "1px solid var(--tone-fail-border)", borderRadius: 8 }}>
                    <Icon name="xCircle" className="ri text-fail" />
                    <div className="stack" style={{ ["--gap" as string]: "4px" }}>
                      <span className="row"><span className="id-link">{f.test_id}</span><span className="strong">{f.title}</span></span>
                      <code className="small" style={{ color: "var(--tone-fail)" }}>{f.message}</code>
                      <CodeRef kind="file" value={f.file} line={f.line} />
                    </div>
                    <span className="small muted">{f.run}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      ) : (
        <DataTable
          columns={recordColumns}
          rows={records(tab === "verification" ? "verification" : "validation")}
          rowKey={(v) => v.id}
          onRowClick={(v) => setDrawer(v)}
          empty={<EmptyState icon="fileCheck" title={tab === "verification" ? "検証記録がありません" : "妥当性確認記録がありません"} description="対象、方法、結果、実施者を記録し、別の人が承認します。" action={<Button variant="primary" icon="plus" onClick={() => setRecordOpen(true)}>記録を作成</Button>} />}
        />
      )}

      <Modal
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        title="テストケースを登録"
        footer={<><Button variant="ghost" onClick={() => setRegisterOpen(false)}>キャンセル</Button><Button variant="primary" onClick={() => { setRegisterOpen(false); toast({ kind: "success", message: "TC-0150 を登録しました" }); }}>登録する</Button></>}
      >
        <div className="stack">
          <TextField label="タイトル" required placeholder="例: CSV 取込でエラー行が一覧表示される" />
          <div className="grid cols-2">
            <Select label="種類" defaultValue="integration" options={Object.entries(TEST_KIND).map(([value, label]) => ({ value, label }))} />
            <TextField label="テストコードの場所" placeholder="tests/integration/csv_import.rs" />
          </div>
          <Combobox label="対応する要求" multiple value={["REQ-0007"]} options={requirements.filter((r) => r.status !== "obsolete").map((r) => ({ value: r.id, label: `${r.id} ${r.title}` }))} />
          <TextArea label="手順と期待結果" rows={4} />
        </div>
      </Modal>

      <Modal
        open={recordOpen}
        onClose={() => setRecordOpen(false)}
        size="lg"
        title="検証記録を作成"
        description="記録を保存すると、選択した承認者に依頼が届きます。実施者本人は承認者に選べません。"
        footer={<><Button variant="ghost" onClick={() => setRecordOpen(false)}>キャンセル</Button><Button variant="primary" onClick={() => { setRecordOpen(false); toast({ kind: "success", message: "VR-0023 を作成し、承認を依頼しました" }); }}>保存して承認を依頼</Button></>}
      >
        <div className="stack">
          <div className="grid cols-2">
            <Select label="種類" defaultValue="verification" options={[{ value: "verification", label: "検証（Verification）" }, { value: "validation", label: "妥当性確認（Validation）" }]} />
            <TextField label="対象" required defaultValue="v1.4.0 結合テスト結果" />
          </div>
          <div className="grid cols-2">
            <TextField label="方法" required defaultValue="テスト結果のレビュー" />
            <Select label="結果" defaultValue="passed" options={[{ value: "passed", label: "成功" }, { value: "conditional", label: "条件付き" }, { value: "failed", label: "失敗" }]} />
          </div>
          <div className="grid cols-2">
            <Combobox label="実施者" value={["u-ito"]} options={[{ value: "u-ito", label: "伊藤 誠", hint: "QA" }]} />
            <Combobox label="承認者" required value={["u-sato"]} options={[{ value: "u-sato", label: "佐藤 美咲", hint: "PM" }, { value: "u-tanaka", label: "田中 陽介", hint: "設計者" }, { value: "u-ito", label: "伊藤 誠", hint: "QA", disabled: true, disabledReason: "実施者は承認者にできません" }]} />
          </div>
          <FileUpload label="証跡ファイル" accept=".pdf,.xlsx,.md,.json" fileName="integration-report-v1.4.0.pdf" />
          <TextArea label="所見・備考" rows={3} />
        </div>
      </Modal>

      <Drawer
        open={Boolean(drawer)}
        onClose={() => setDrawer(null)}
        title={drawer ? `${drawer.id} ${drawer.kind === "verification" ? "検証記録" : "妥当性確認記録"}` : ""}
        subtitle={drawer?.target}
      >
        {drawer ? (
          <div className="stack">
            <KeyValueList
              items={[
                { label: "対象", value: drawer.target },
                { label: "方法", value: drawer.method },
                { label: "結果", value: <Result value={drawer.result} /> },
                { label: "実施者", value: <UserChip user={userById(isPerformer ? "u-sato" : drawer.performer_id)} /> },
                { label: "実施日時", value: <Timestamp at={drawer.at} mode="absolute" /> },
                { label: "証跡", value: <span className="row"><span className="mono small">{drawer.evidence}</span><HashDisplay value={fakeSha(drawer.evidence)} /></span> },
              ]}
            />
            <ApprovalPanel
              approvers={[{ role: "PM", user_id: drawer.reviewer_id ?? "u-sato", status: drawer.review_status === "approved" ? "approved" : drawer.review_status === "pending" ? "pending" : "draft", decided_at: drawer.review_status === "approved" ? drawer.at : undefined }]}
              canDecide={drawer.review_status === "pending" && !isPerformer}
              blockedReason={isPerformer ? "あなたはこの記録の実施者のため承認できません" : undefined}
              eligible={membersWithRole("PM", "u-sato").concat(membersWithRole("設計者"))}
              onDecide={(d) => { toast({ kind: "success", message: d === "approved" ? "検証記録を承認しました" : "差し戻しました" }); setDrawer(null); }}
            />
            <Button variant="ghost" icon="barChart" to={paths.audit(org, project)}>関連する統制項目を見る</Button>
          </div>
        ) : null}
      </Drawer>
    </ProjectLayout>
  );
}
