// 画面ID: J-02 SOW の一覧・詳細
import { useEffect, useState } from "react";
import {
  AIFindingCard,
  AISectionHead,
  AIUnavailableNotice,
  Banner,
  Button,
  DataClassBadge,
  DataTable,
  DiffViewer,
  FileUpload,
  HashDisplay,
  KeyValueList,
  MarkdownViewer,
  Modal,
  PageHeader,
  ProjectLayout,
  Section,
  Segmented,
  Select,
  Tabs,
  Tag,
  Timestamp,
  UserChip,
  useToast,
} from "../../ui";
import { navigate, useScreenState } from "../../lib/router";
import { paths } from "../../lib/paths";
import { userById } from "../../mocks/core";
import { sowById, sowExtractions, sowVersions } from "../../mocks/planning";
import type { SowVersion } from "../../mocks/planning";
import { LIST_STATES, listStateView, orgOf, projectOf } from "./shared";

const statusTag = (s: SowVersion["status"]) =>
  s === "current" ? <Tag tone="pass" icon="check">最新版</Tag> : s === "extracting" ? <Tag tone="info" icon="clock">抽出中</Tag> : <Tag>旧版</Tag>;

function UploadModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const toast = useToast();
  const [done, setDone] = useState(false);
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="SOW を登録"
      description="登録すると新しい版になり、AIが要求候補・納入物・期限を抽出します（参考情報）。"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>キャンセル</Button>
          <Button variant="primary" disabled={!done} disabledReason="ファイルのアップロードが完了していません" onClick={() => { onClose(); toast({ kind: "success", message: "SOW v4 を登録しました。AIの抽出を開始します" }); }}>登録する</Button>
        </>
      }
    >
      <div className="stack">
        <FileUpload label="SOW ファイル" accept=".pdf,.docx" fileName="SOW_受発注刷新_v4.pdf" onDone={() => setDone(true)} />
        <Select label="データ分類" defaultValue="confidential" options={[{ value: "internal", label: "Internal" }, { value: "confidential", label: "Confidential" }, { value: "highlyConfidential", label: "Highly Confidential（AI抽出は行いません）" }]} />
        <Banner tone="info">ファイルのハッシュ（SHA-256）を記録し、以後の版比較と証跡に使います。</Banner>
      </div>
    </Modal>
  );
}

export function J02SowList({ params }: { params: Record<string, string> }) {
  const state = useScreenState();
  const org = orgOf(params);
  const pr = projectOf(params);
  const [upload, setUpload] = useState(state === "登録モーダル");
  const [compare, setCompare] = useState(false);
  useEffect(() => setUpload(state === "登録モーダル"), [state]);
  const alt = listStateView(state, { icon: "fileText", emptyTitle: "SOW はまだ登録されていません", emptyDescription: "契約上の作業範囲（SOW）を登録すると、要求の出発点として版ごとに保管されます。", emptyAction: <Button variant="primary" icon="upload" onClick={() => setUpload(true)}>SOW を登録</Button> });
  return (
    <ProjectLayout org={org} project={pr} active="sow" trail={[{ label: "SOW" }]}>
      <PageHeader
        title="SOW（作業範囲記述書）"
        description="契約上の作業範囲を版ごとに保管し、要求の出発点にします。"
        actions={
          <>
            <Button icon="compare" onClick={() => setCompare(true)}>版を比較</Button>
            <Button variant="primary" icon="upload" onClick={() => setUpload(true)}>SOW を登録</Button>
          </>
        }
      />
      {alt ?? (
        <DataTable
          rows={sowVersions}
          rowKey={(r) => r.id}
          onRowClick={(r) => navigate(paths.sowDetail(org, pr, r.id))}
          columns={[
            { key: "version", header: "版", render: (r) => <span className="strong">v{r.version}</span>, sortValue: (r) => r.version, hideable: false },
            { key: "file", header: "ファイル名", render: (r) => <span className="row nowrap"><span className="truncate" style={{ maxWidth: 280 }}>{r.file_name}</span><span className="tiny muted">{r.size}</span></span> },
            { key: "hash", header: "SHA-256", render: (r) => <span onClick={(e) => e.stopPropagation()}><HashDisplay value={r.sha256} /></span> },
            { key: "by", header: "登録者", render: (r) => <UserChip user={userById(r.uploaded_by)} showRole={false} plain /> },
            { key: "at", header: "登録日時", render: (r) => <Timestamp at={r.uploaded_at} mode="absolute" />, sortValue: (r) => r.uploaded_at },
            { key: "class", header: "データ分類", render: (r) => <DataClassBadge value={r.data_class} /> },
            { key: "status", header: "状態", render: (r) => statusTag(r.status) },
          ]}
        />
      )}
      <UploadModal open={upload} onClose={() => setUpload(false)} />
      <CompareModal open={compare} onClose={() => setCompare(false)} />
    </ProjectLayout>
  );
}

function CompareModal({ open, onClose, initialA = "SOW-2", initialB = "SOW-3" }: { open: boolean; onClose: () => void; initialA?: string; initialB?: string }) {
  const [a, setA] = useState(initialA);
  const [b, setB] = useState(initialB);
  const [mode, setMode] = useState("split");
  const opts = sowVersions.map((s) => ({ value: s.id, label: `v${s.version}（${s.file_name}）` }));
  return (
    <Modal open={open} onClose={onClose} title="SOW の版を比較" size="lg" footer={<Button onClick={onClose}>閉じる</Button>}>
      <div className="stack">
        <div className="grid cols-3" style={{ alignItems: "end" }}>
          <Select label="比較元" value={a} onChange={setA} options={opts} />
          <Select label="比較先" value={b} onChange={setB} options={opts} />
          <Segmented value={mode} onChange={setMode} options={[{ value: "split", label: "横並び" }, { value: "unified", label: "縦並び" }]} />
        </div>
        <DiffViewer before={sowById(a).text} after={sowById(b).text} beforeLabel={`v${sowById(a).version}`} afterLabel={`v${sowById(b).version}`} mode={mode as "split" | "unified"} />
      </div>
    </Modal>
  );
}

export function J02SowDetail({ params }: { params: Record<string, string> }) {
  const state = useScreenState();
  const org = orgOf(params);
  const pr = projectOf(params);
  const toast = useToast();
  const sow = sowById(params.id);
  const [tab, setTab] = useState<keyof typeof sowExtractions>("requirements");
  const [compare, setCompare] = useState(false);
  const prev = sowVersions.find((s) => s.version === sow.version - 1);
  const tabs = [
    { value: "requirements", label: "要求候補", count: sowExtractions.requirements.length },
    { value: "deliverables", label: "納入物", count: sowExtractions.deliverables.length },
    { value: "deadlines", label: "期限", count: sowExtractions.deadlines.length },
    { value: "constraints", label: "前提・制約", count: sowExtractions.constraints.length },
  ];
  const items = sowExtractions[tab];
  return (
    <ProjectLayout org={org} project={pr} active="sow" trail={[{ label: "SOW", to: paths.sow(org, pr) }, { label: `v${sow.version}` }]}>
      <PageHeader
        id={sow.id}
        title={sow.file_name}
        status={statusTag(sow.status)}
        meta={
          <>
            <DataClassBadge value={sow.data_class} />
            <HashDisplay value={sow.sha256} label="SHA-256" />
            <span className="small muted">{userById(sow.uploaded_by)?.name} · <Timestamp at={sow.uploaded_at} mode="absolute" /></span>
          </>
        }
        actions={
          <>
            {prev ? <Button icon="compare" onClick={() => setCompare(true)}>v{prev.version} と比較</Button> : null}
            <Button icon="download">ダウンロード</Button>
          </>
        }
      />
      <div className="pl-sow-split">
        <div className="stack">
          <span className="label">文書のプレビュー</span>
          <div className="pl-doc"><MarkdownViewer source={sow.text} /></div>
        </div>
        <div className="stack">
          <Section title="AIによる抽出結果" sub="候補は参考情報です。登録するかどうかは人が判断します。" flush>
            <div className="stack" style={{ padding: "0 20px 20px" }}>
              <Tabs tabs={tabs} value={tab} onChange={(v) => setTab(v as keyof typeof sowExtractions)} />
              {state === "AI抽出中" ? (
                <div className="stack" style={{ ["--gap" as string]: "10px", padding: "12px 0" }}>
                  <div className="row"><span className="spinner" /><span className="muted">AIが文書から候補を抽出しています…（約1分）</span></div>
                  {[0, 1, 2].map((i) => <span key={i} className="skeleton" style={{ height: 96 }} />)}
                </div>
              ) : state === "AI無効" ? (
                <AIUnavailableNotice reason="dataClass" />
              ) : state === "抽出失敗" ? (
                <Banner tone="fail" title="抽出に失敗しました" action={<Button size="sm" icon="refresh">再実行</Button>}>文書のテキストを読み取れませんでした（画像のみの PDF の可能性があります）。ゲートの判定には影響しません。</Banner>
              ) : (
                <>
                  <AISectionHead count={items.length} note="抽出結果は要求として確定していません" />
                  {items.map((f) => (
                    <div key={f.id} className="stack" style={{ ["--gap" as string]: "6px" }}>
                      <AIFindingCard finding={f} onDecide={(_, d) => toast({ kind: d === "adopted" ? "success" : "info", message: d === "adopted" ? "採用しました" : "却下しました" })} />
                      {tab === "requirements" ? (
                        <div className="row end">
                          <Button size="sm" variant="primary" icon="plus" onClick={() => { toast({ kind: "info", message: "内容を引き継いで要求の作成画面を開きます" }); navigate(paths.requirement(org, pr, "REQ-0012")); }}>要求として登録</Button>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </>
              )}
            </div>
          </Section>
          <Section title="版の情報">
            <KeyValueList
              items={[
                { label: "版", value: `v${sow.version}` },
                { label: "ファイルサイズ", value: sow.size },
                { label: "登録者", value: <UserChip user={userById(sow.uploaded_by)} /> },
                { label: "前の版", value: prev ? `v${prev.version}（${prev.file_name}）` : "なし" },
              ]}
            />
          </Section>
        </div>
      </div>
      <CompareModal open={compare} onClose={() => setCompare(false)} initialA={prev?.id ?? sow.id} initialB={sow.id} />
    </ProjectLayout>
  );
}

export const J02_LIST_STATES = [...LIST_STATES, "登録モーダル"];
export const J02_DETAIL_STATES = ["既定", "AI抽出中", "AI無効", "抽出失敗"];
