// 画面ID: J-13 文書・ファイルの取込み
// Markdown・構造化データ・一般ファイルを取り込み、形式検査、版、ハッシュ、データ分類、アクセス制御、出典を管理する。
// docs-as-code は必須ではない。連携したフォルダからの同期と、手動の取込みの両方を扱う。
import { useEffect, useState } from "react";
import {
  Banner,
  Button,
  DataClassBadge,
  DataTable,
  ExternalActor,
  FileUpload,
  FilterBar,
  HashDisplay,
  Modal,
  PageHeader,
  ProjectLayout,
  Section,
  Select,
  SourceTag,
  StatCard,
  Tag,
  TextField,
  Timestamp,
  useToast,
} from "../../ui";
import { useScreenState } from "../../lib/router";
import { DOC_SOURCE, importedDocs } from "../../mocks/planning";
import type { ImportedDoc } from "../../mocks/planning";
import { LIST_STATES, SourceBar, listStateView, orgOf, projectOf } from "./shared";

export const J13_STATES = [...LIST_STATES, "形式エラーのみ", "取込みモーダル"];

const KIND: Record<ImportedDoc["kind"], string> = { markdown: "Markdown", structured: "構造化データ", file: "一般ファイル" };
const CHECK: Record<ImportedDoc["check"], { label: string; tone: "pass" | "warn" | "fail" }> = {
  ok: { label: "形式OK", tone: "pass" },
  warn: { label: "注意", tone: "warn" },
  fail: { label: "形式エラー", tone: "fail" },
};

function ImportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const toast = useToast();
  const [done, setDone] = useState(false);
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="ファイルを取り込む"
      description="取り込むとハッシュ（SHA-256）と取込み者を記録し、形式を検査します。原本は変更しません。"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>キャンセル</Button>
          <Button variant="primary" disabled={!done} disabledReason="ファイルのアップロードが完了していません" onClick={() => { onClose(); toast({ kind: "success", message: "DOC-032 を取り込みました。形式検査を実行しています" }); }}>取り込む</Button>
        </>
      }
    >
      <div className="stack">
        <FileUpload label="ファイル" accept=".md,.yaml,.yml,.json,.csv,.xlsx,.pdf,.docx" fileName="受入テスト結果_v1.4.0.csv" onDone={() => setDone(true)} />
        <Select label="種類" defaultValue="structured" options={[{ value: "markdown", label: "Markdown" }, { value: "structured", label: "構造化データ（CSV・YAML・JSON・表計算）" }, { value: "file", label: "一般ファイル（PDF・Word など）" }]} />
        <Select label="構造化データの形式" defaultValue="test-result" options={[{ value: "test-result", label: "テスト結果（列: ケースID, 結果, 実施者, 実施日）" }, { value: "trace", label: "トレース（trace-edges@1）" }, { value: "none", label: "検査しない（一般ファイル）" }]} />
        <div className="grid cols-2">
          <Select label="データ分類" defaultValue="internal" options={[{ value: "internal", label: "Internal" }, { value: "confidential", label: "Confidential" }, { value: "highlyConfidential", label: "Highly Confidential" }]} />
          <Select label="閲覧できる人" defaultValue="project" options={[{ value: "project", label: "プロジェクトの閲覧者" }, { value: "exec", label: "経営層・PM のみ" }, { value: "assessor", label: "評価者にも共有可" }]} />
        </div>
        <TextField label="関連付ける項目" placeholder="例: DLV-05, REQ-0012" />
        <Banner tone="info">Highly Confidential のファイルは AI の抽出・要約に送りません。</Banner>
      </div>
    </Modal>
  );
}

export function J13Documents({ params }: { params: Record<string, string> }) {
  const state = useScreenState();
  const org = orgOf(params);
  const pr = projectOf(params);
  const [filters, setFilters] = useState<Record<string, string>>(state === "形式エラーのみ" ? { check: "fail" } : {});
  const [q, setQ] = useState("");
  const [modal, setModal] = useState(state === "取込みモーダル");
  useEffect(() => setModal(state === "取込みモーダル"), [state]);
  const rows = importedDocs.filter((d) => (!filters.kind || d.kind === filters.kind) && (!filters.check || d.check === filters.check) && (!q || `${d.id}${d.name}`.includes(q)));
  const alt = listStateView(state === "形式エラーのみ" || state === "取込みモーダル" ? "既定" : state, { icon: "upload", emptyTitle: "まだ文書がありません", emptyDescription: "文書リポジトリや共有フォルダを連携するか、ファイルを取り込んでください。", emptyAction: <Button variant="primary" icon="upload" onClick={() => setModal(true)}>ファイルを取り込む</Button> });
  void org;

  return (
    <ProjectLayout org={org} project={pr} active="documents" trail={[{ label: "文書の取込み" }]}>
      <PageHeader
        title="文書・ファイルの取込み"
        description="Markdown・構造化データ・一般ファイルを、版・ハッシュ・データ分類・閲覧範囲とともに取り込みます。リポジトリでの文書管理（docs-as-code）は必須ではありません。"
        actions={<Button variant="primary" icon="upload" onClick={() => setModal(true)}>ファイルを取り込む</Button>}
      />
      <Section title="取込み元">
        <div className="stack" style={{ ["--gap" as string]: "8px" }}>
          <SourceBar source={DOC_SOURCE} note="docs/、contracts/、trace/ を同期（コミットごとに版を記録）" />
          <div className="pl-source-bar">
            <span className="tiny muted">手動取込み</span>
            <span className="small">Word・PDF・表計算など、リポジトリにない文書</span>
          </div>
        </div>
      </Section>
      {alt ?? (
        <>
          <div className="grid auto-fit">
            <StatCard label="取り込んだ文書" value={importedDocs.length} unit="件" />
            <StatCard label="形式エラー" value={importedDocs.filter((d) => d.check === "fail").length} unit="件" tone="danger" delta="取込みを保留しています" />
            <StatCard label="注意" value={importedDocs.filter((d) => d.check === "warn").length} unit="件" tone="warn" />
            <StatCard label="経営層・PM のみ閲覧" value={importedDocs.filter((d) => d.access.includes("経営層")).length} unit="件" />
          </div>
          <FilterBar
            search={q}
            onSearch={setQ}
            values={filters}
            onChange={(k, v) => setFilters((f) => ({ ...f, [k]: v }))}
            filters={[
              { key: "kind", label: "種類", options: Object.entries(KIND).map(([value, label]) => ({ value, label })) },
              { key: "check", label: "形式検査", options: Object.entries(CHECK).map(([value, v]) => ({ value, label: v.label })) },
            ]}
          />
          <DataTable<ImportedDoc>
            rows={rows}
            rowKey={(d) => d.id}
            empty={listStateView("0件（絞り込み）", { emptyTitle: "" })}
            columns={[
              { key: "name", header: "文書", render: (d) => <div className="stack" style={{ ["--gap" as string]: "2px" }}><span className="strong mono small">{d.name}</span><span className="tiny muted">{d.id} · {d.format}</span></div>, hideable: false },
              { key: "kind", header: "種類", render: (d) => <Tag square>{KIND[d.kind]}</Tag> },
              { key: "check", header: "形式検査", render: (d) => <div className="stack" style={{ ["--gap" as string]: "2px" }}><Tag square tone={CHECK[d.check].tone}>{CHECK[d.check].label}</Tag>{d.check_note ? <span className="tiny muted" style={{ maxWidth: 260 }}>{d.check_note}</span> : null}</div> },
              { key: "version", header: "版", render: (d) => <span className="small">{d.version}</span> },
              { key: "hash", header: "SHA-256", render: (d) => <HashDisplay value={d.sha256} /> },
              { key: "class", header: "データ分類", render: (d) => <DataClassBadge value={d.data_class} /> },
              { key: "access", header: "閲覧範囲", render: (d) => <span className="small">{d.access}</span> },
              { key: "source", header: "出典", render: (d) => <SourceTag source={d.source} prefix="" compact />, defaultHidden: true },
              { key: "by", header: "取込み", render: (d) => <div className="stack" style={{ ["--gap" as string]: "2px" }}>{d.imported_by.startsWith("システム") ? <span className="small">{d.imported_by}</span> : <ExternalActor name={d.imported_by.split("（")[0]} />}<span className="tiny muted"><Timestamp at={d.imported_at} /></span></div>, sortValue: (d) => d.imported_at },
              { key: "linked", header: "関連", render: (d) => <span className="mono small">{d.linked?.join(", ") ?? "—"}</span> },
            ]}
          />
          <p className="tiny muted">形式エラーの文書は取込みを保留し、証跡として扱いません。原本を修正して再同期するか、正しい形式で取り込み直してください。</p>
        </>
      )}
      <ImportModal open={modal} onClose={() => setModal(false)} />
    </ProjectLayout>
  );
}
