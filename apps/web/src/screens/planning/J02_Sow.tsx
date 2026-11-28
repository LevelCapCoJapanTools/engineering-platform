// 画面ID: J-02 SOW の一覧・詳細
// SOW の原本は文書リポジトリが正本。新しい版は J-13（文書の取込み）経由で同期され、ここでは版・範囲・ハッシュ・出典・変更履歴を確認する。
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
  ExternalActor,
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
  TextArea,
  Timeline,
  Timestamp,
  useToast,
} from "../../ui";
import { navigate, useScreenState } from "../../lib/router";
import { paths } from "../../lib/paths";
import { userById } from "../../mocks/core";
import { DOC_SOURCE, sowById, sowChangeHistory, sowExtractions, sowScopes, sowVersions } from "../../mocks/planning";
import type { SowScope, SowVersion } from "../../mocks/planning";
import { LIST_STATES, SourceBar, listStateView, orgOf, projectOf } from "./shared";

const statusTag = (s: SowVersion["status"]) =>
  s === "current" ? <Tag tone="pass" icon="check">最新版</Tag> : s === "extracting" ? <Tag tone="info" icon="clock">抽出中</Tag> : <Tag>旧版</Tag>;

function UploadModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const toast = useToast();
  const [done, setDone] = useState(false);
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="SOW を手動で取り込む"
      description="文書リポジトリにない原本だけを取り込みます。取り込むと新しい版になり、AIが範囲・納入物・期限の候補を抽出します（参考情報）。"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>キャンセル</Button>
          <Button variant="primary" disabled={!done} disabledReason="ファイルのアップロードが完了していません" onClick={() => { onClose(); toast({ kind: "success", message: "SOW v4 を取り込みました。ハッシュを記録し、AIの抽出を開始します" }); }}>取り込む</Button>
        </>
      }
    >
      <div className="stack">
        <FileUpload label="SOW ファイル" accept=".pdf,.docx" fileName="SOW_受発注刷新_v4.pdf" onDone={() => setDone(true)} />
        <Select label="データ分類" defaultValue="confidential" options={[{ value: "internal", label: "Internal" }, { value: "confidential", label: "Confidential" }, { value: "highlyConfidential", label: "Highly Confidential（AI抽出は行いません）" }]} />
        <TextArea label="変更理由" required rows={2} placeholder="例: CR-0004 の反映（顧客と合意済み）" />
        <Banner tone="info">ファイルのハッシュ（SHA-256）と取込み者を記録し、以後の版比較と証跡に使います。</Banner>
      </div>
    </Modal>
  );
}

export function J02SowList({ params }: { params: Record<string, string> }) {
  const state = useScreenState();
  const org = orgOf(params);
  const pr = projectOf(params);
  const [upload, setUpload] = useState(state === "取込みモーダル");
  const [compare, setCompare] = useState(false);
  useEffect(() => setUpload(state === "取込みモーダル"), [state]);
  const alt = listStateView(state, { icon: "fileText", emptyTitle: "SOW はまだ取り込まれていません", emptyDescription: "文書リポジトリの契約フォルダを連携すると、SOW の版が自動で取り込まれます。", emptyAction: <Button variant="primary" icon="upload" to={paths.documents(org, pr)}>文書の取込みへ</Button> });
  return (
    <ProjectLayout org={org} project={pr} active="sow" trail={[{ label: "SOW" }]}>
      <PageHeader
        title="SOW（作業範囲記述書）"
        description="契約上の作業範囲を版ごとに確認します。原本は文書リポジトリにあり、版・ハッシュ・変更理由を記録します。"
        actions={
          <>
            <Button icon="compare" onClick={() => setCompare(true)}>版を比較</Button>
            <Button icon="upload" onClick={() => setUpload(true)}>手動で取り込む</Button>
          </>
        }
      />
      <SourceBar source={DOC_SOURCE} note="契約フォルダ contracts/order-renewal/ を同期しています" />
      {alt ?? (
        <DataTable
          rows={sowVersions}
          rowKey={(r) => r.id}
          onRowClick={(r) => navigate(paths.sowDetail(org, pr, r.id))}
          columns={[
            { key: "version", header: "版", render: (r) => <span className="strong">v{r.version}</span>, sortValue: (r) => r.version, hideable: false },
            { key: "file", header: "ファイル名", render: (r) => <span className="row nowrap"><span className="truncate" style={{ maxWidth: 280 }}>{r.file_name}</span><span className="tiny muted">{r.size}</span></span> },
            { key: "hash", header: "SHA-256", render: (r) => <span onClick={(e) => e.stopPropagation()}><HashDisplay value={r.sha256} /></span> },
            { key: "by", header: "登録者", render: (r) => <ExternalActor userId={r.uploaded_by} /> },
            { key: "at", header: "取込み日時", render: (r) => <Timestamp at={r.uploaded_at} mode="absolute" />, sortValue: (r) => r.uploaded_at },
            { key: "reason", header: "変更理由", render: (r) => <span className="small truncate" style={{ maxWidth: 260, display: "inline-block" }}>{sowChangeHistory.find((h) => h.id === r.id)?.reason ?? "—"}</span>, defaultHidden: false },
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
  const scopes = sowScopes[sow.id] ?? [];
  const history = sowChangeHistory.find((h) => h.id === sow.id);
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
            <span className="small muted"><Timestamp at={sow.uploaded_at} mode="absolute" /></span>
          </>
        }
        actions={
          <>
            {prev ? <Button icon="compare" onClick={() => setCompare(true)}>v{prev.version} と比較</Button> : null}
            <Button icon="download">ダウンロード</Button>
          </>
        }
      />
      <SourceBar source={{ ...DOC_SOURCE, label: history?.source_location ?? DOC_SOURCE.label }} note="原本の場所" />
      <Section title="範囲・前提・制約・納入物・期限" sub={`原本の箇所を出典として表示します${prev ? `。v${prev.version} からの変更を強調しています` : ""}`} flush>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>区分</th><th>内容</th><th>原本の箇所</th><th>前の版から</th></tr></thead>
            <tbody>
              {scopes.length ? scopes.map((sc, i) => (
                <tr key={i}>
                  <td><Tag square>{SCOPE_LABEL[sc.kind]}</Tag></td>
                  <td>{sc.text}</td>
                  <td className="mono small">§{sc.section}</td>
                  <td>{sc.changed === "added" ? <Tag tone="pass" square>追加</Tag> : sc.changed === "changed" ? <Tag tone="warn" square>変更</Tag> : <span className="tiny muted">—</span>}</td>
                </tr>
              )) : (
                <tr><td colSpan={4} className="small muted">この版の構造化はまだありません。下の原本プレビューを確認してください。</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Section>
      <div className="pl-sow-split">
        <div className="stack">
          <span className="label">文書のプレビュー</span>
          <div className="pl-doc"><MarkdownViewer source={sow.text} /></div>
        </div>
        <div className="stack">
          <Section title="AIによる抽出結果" sub="候補は参考情報です。要求として登録するかはアナリストが正本で判断します（ここでは参照のみ）。" flush>
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
                      <AIFindingCard finding={f} />
                      {tab === "requirements" ? (
                        <div className="row end">
                          <Button size="sm" variant="ghost" iconRight="arrowRight" onClick={() => navigate(paths.requirement(org, pr, "REQ-0012"))}>関連する要求を見る</Button>
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
                { label: "取込み者", value: <ExternalActor userId={sow.uploaded_by} /> },
                { label: "データ分類", value: <DataClassBadge value={sow.data_class} /> },
                { label: "原本の場所", value: <span className="mono small">{history?.source_location ?? "—"}</span> },
                { label: "前の版", value: prev ? `v${prev.version}（${prev.file_name}）` : "なし" },
              ]}
            />
          </Section>
          <Section title="変更履歴" sub="版ごとの変更理由と顧客の合意">
            <Timeline
              compact
              items={sowChangeHistory.map((h) => ({ id: h.id, actor: { kind: "human" as const, name: userById(h.by)?.name ?? "" }, action: `${h.id.replace("SOW-", "v")} を取込み`, at: h.at, detail: `${h.reason}（合意: ${userById(h.agreed_by)?.name ?? "—"}）` }))}
            />
          </Section>
        </div>
      </div>
      <CompareModal open={compare} onClose={() => setCompare(false)} initialA={prev?.id ?? sow.id} initialB={sow.id} />
    </ProjectLayout>
  );
}

export const J02_LIST_STATES = [...LIST_STATES, "取込みモーダル"];

const SCOPE_LABEL: Record<SowScope["kind"], string> = { scope: "範囲", assumption: "前提", constraint: "制約", deliverable: "納入物", deadline: "期限" };
export const J02_DETAIL_STATES = ["既定", "AI抽出中", "AI無効", "抽出失敗"];
