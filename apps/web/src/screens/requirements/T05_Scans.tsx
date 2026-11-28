// 画面ID: T-05 品質・セキュリティスキャン
// 外部 CI から取り込んだ構造化結果（ツール・版・設定・対象SHA）と、版管理されたルールでの判定を示す。AI の所見だけで合否を決めない。
import { useState } from "react";
import { useScreenState } from "../../lib/router";
import { paths } from "../../lib/paths";
import { GATE_STATUS, SEVERITY } from "../../lib/vocab";
import { fakeSha } from "../../mocks/core";
import { scanFindings, scans } from "../../mocks/requirements";
import type { Scan, ScanKind } from "../../mocks/requirements";
import {
  AIFindingCard,
  AISectionHead,
  Banner,
  Button,
  CodeRef,
  Drawer,
  EmptyState,
  ErrorState,
  HashDisplay,
  IdLink,
  KeyValueList,
  PageHeader,
  ProjectLayout,
  ProviderBadge,
  Skeleton,
  SourceTag,
  StatusBadge,
  Tag,
  Timestamp,
} from "../../ui";
import { OpenInSource, org, project, ViewOnlyNote } from "./common";

const KIND: Record<ScanKind, { label: string; desc: string }> = {
  sast: { label: "静的解析（SAST）", desc: "ソースコードの脆弱性パターン" },
  deps: { label: "依存関係", desc: "既知の脆弱性を持つライブラリ" },
  secret: { label: "シークレット", desc: "コードに含まれた認証情報" },
  license: { label: "ライセンス", desc: "許可リスト外のライセンス" },
  container: { label: "コンテナ", desc: "コンテナイメージの脆弱性" },
  sbom: { label: "SBOM", desc: "部品表（SPDX）の生成" },
};
const HEAD_SHA = "c142";

export function Scans() {
  const state = useScreenState();
  const [open, setOpen] = useState<Scan | null>(state === "drawer" ? scans[1] : null);
  const list = state === "empty" ? [] : state === "staleSha" ? scans.map((s) => (s.kind === "sast" ? { ...s, sha_seed: "c141", stale: true, note: "最新コミット（c142）のスキャンがないため、判定には使っていません" } : s)) : scans;
  const stale = list.filter((s) => s.stale);
  return (
    <ProjectLayout active="scans" trail={[{ label: "品質・セキュリティ" }]}>
      <PageHeader
        title="品質・セキュリティスキャン"
        description="CI で実行された静的解析、依存関係、シークレット、ライセンス、コンテナ、SBOM の結果を、ツール・版・設定・対象コミットと一緒に確認します。合否はゲートのルール（版管理）で決まり、AI の所見は参考です。"
        meta={<SourceTag source={{ provider: "githubActions", label: "セキュリティレポート（SARIF・SPDX）", synced_at: "2026-11-27T10:27:00+09:00", status: "healthy" }} />}
        actions={<OpenInSource label="CI で開く" />}
      />
      <ViewOnlyNote>スキャンの設定変更や再実行は担当者が CI で行います。</ViewOnlyNote>
      {state === "loading" ? (
        <Skeleton rows={6} />
      ) : state === "error" ? (
        <ErrorState title="スキャン結果を読み込めませんでした" />
      ) : list.length === 0 ? (
        <div className="card"><EmptyState icon="shieldCheck" title="スキャン結果がありません" description="CI でスキャンが実行され、レポートが出力されると取り込まれます。必須のスキャンがない場合、ゲートで「必須チェックなし」として扱います。" action={<Button icon="plug" to={paths.connectors(org)}>連携を確認</Button>} /></div>
      ) : (
        <>
          {stale.length ? (
            <Banner tone="warn" title={`最新コミットの結果がないスキャンが ${stale.length}件あります`}>
              古いコミットの結果は「通過」として扱いません。最新コミット <CodeRef kind="commit" value={fakeSha(HEAD_SHA)} /> で再実行されるまで、ゲートでは未実行として扱います。
            </Banner>
          ) : null}
          <div className="card flush">
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>種類</th><th>ツール・版</th><th>対象コミット</th><th className="num">緊急</th><th className="num">高</th><th className="num">中</th><th className="num">低</th><th>判定ルール</th><th>結果</th><th>実行</th></tr></thead>
                <tbody>
                  {list.map((s) => (
                    <tr key={s.id} onClick={() => setOpen(s)} style={{ cursor: "pointer" }}>
                      <td><div className="stack" style={{ ["--gap" as string]: "2px" }}><span className="strong small">{KIND[s.kind].label}</span><span className="tiny muted">{KIND[s.kind].desc}</span></div></td>
                      <td className="small">{s.tool} <span className="mono tiny muted">{s.tool_version}</span></td>
                      <td><span className="row nowrap" style={{ ["--gap" as string]: "4px" }}><CodeRef kind="commit" value={fakeSha(s.sha_seed)} />{s.stale ? <Tag tone="warn" square>古い</Tag> : null}</span></td>
                      <td className={s.counts.critical ? "num text-fail" : "num"}>{s.counts.critical}</td>
                      <td className={s.counts.high ? "num text-fail" : "num"}>{s.counts.high}</td>
                      <td className="num">{s.counts.medium}</td>
                      <td className="num muted">{s.counts.low}</td>
                      <td className="tiny">{s.rule}</td>
                      <td>{s.stale ? <StatusBadge vocab={GATE_STATUS.notRun} size="sm" /> : <StatusBadge vocab={GATE_STATUS[s.result]} size="sm" />}</td>
                      <td className="tiny muted"><Timestamp at={s.at} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="card flush">
            <div className="card-header"><span className="section-title">未対応の指摘</span></div>
            <div className="table-wrap">
              <table className="table compact">
                <thead><tr><th>指摘</th><th>重大度</th><th>対象</th><th>修正版</th><th>状況</th></tr></thead>
                <tbody>
                  {scanFindings.map((f) => (
                    <tr key={f.id}>
                      <td className="mono tiny">{f.id}</td>
                      <td><StatusBadge vocab={SEVERITY[f.severity]} size="sm" /></td>
                      <td className="mono tiny">{f.target}</td>
                      <td className="mono tiny">{f.fixed_in}</td>
                      <td className="small">{f.status.includes("EXC-") ? <span>例外適用中（<IdLink id="EXC-0007" to={paths.exception(org, project, "EXC-0007")} />、12/03 まで）</span> : f.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="stack">
            <AISectionHead count={1} note="要約と優先度の提案。合否の判定には使いません" />
            <AIFindingCard
              finding={{ id: "AIF-420", kind: "impact", severity: "medium", confidence: 0.69, target_id: "SC-0413", excerpt: "RUSTSEC-2026-0042 example-xml 0.31.2", highlight: "example-xml", explanation: "影響を受ける関数は XML 取込でのみ使われており、v1.4.0 では外部から到達しない可能性があります（根拠: 呼び出し箇所 src/import/xml.rs のみ）。到達性は人が確認してください。", model: "model-family-a / 2026-10", template_version: "scan-summary@0.3.0", status: "unconfirmed", created_at: "2026-11-27T09:40:00+09:00" }}
            />
          </div>
        </>
      )}
      <Drawer open={Boolean(open)} onClose={() => setOpen(null)} title={open ? `${open.id} ${KIND[open.kind].label}` : ""} subtitle={open ? `${open.tool} ${open.tool_version}` : undefined} footer={<OpenInSource label="レポートを開く" />}>
        {open ? (
          <div className="stack">
            <KeyValueList
              items={[
                { label: "提供元", value: <ProviderBadge provider={open.provider} size="sm" /> },
                { label: "CI 実行", value: <span className="mono small">{open.run_id}</span> },
                { label: "対象コミット", value: <CodeRef kind="commit" value={fakeSha(open.sha_seed)} /> },
                { label: "ツール・版", value: `${open.tool} ${open.tool_version}` },
                { label: "設定", value: <HashDisplay value={fakeSha(open.config_seed)} label="設定ファイルのハッシュ" /> },
                { label: "判定ルール", value: open.rule },
                { label: "結果", value: open.stale ? <StatusBadge vocab={GATE_STATUS.notRun} size="sm" /> : <StatusBadge vocab={GATE_STATUS[open.result]} size="sm" /> },
                ...(open.exception ? [{ label: "例外", value: <IdLink id={open.exception} to={paths.exception(org, project, open.exception)} /> }] : []),
                { label: "実行日時", value: <Timestamp at={open.at} mode="absolute" /> },
              ]}
            />
            {open.note ? <Banner tone={open.stale ? "warn" : "info"}>{open.note}</Banner> : null}
            <Button variant="ghost" icon="shield" to={paths.gate(org, project, "run-5821")}>このコミットのゲート判定を見る</Button>
          </div>
        ) : null}
      </Drawer>
    </ProjectLayout>
  );
}
