// 画面ID: T-01 トレーサビリティグラフ
import { useMemo, useState } from "react";
import { useScreenState } from "../../lib/router";
import { paths } from "../../lib/paths";
import { ARTIFACT_STATUS } from "../../lib/vocab";
import { designs, requirements, testCases } from "../../mocks/core";
import { prTitles } from "../../mocks/requirements";
import {
  Banner,
  Button,
  CoverageMeter,
  EmptyState,
  ErrorState,
  Icon,
  IdLink,
  PageHeader,
  ProjectLayout,
  Select,
  Skeleton,
  StatusBadge,
  Tag,
  Toggle,
  TraceGraph,
  TraceLegend,
  useToast,
  ExternalActor,
  SourceTag,
} from "../../ui";
import { reqSource } from "../../mocks/requirements";
import { buildTraceGraph, CHAIN_STAGES, ChainTable, chainOf, org, project, reqPath, traceCoverage, ViewOnlyNote } from "./common";

function NodeDetail({ id }: { id: string }) {
  if (id.startsWith("missing-")) {
    const reqId = id.replace(/^missing-[dt]-/, "");
    const isTest = id.startsWith("missing-t-");
    return (
      <div className="stack" style={{ ["--gap" as string]: "10px" }}>
        <Tag tone="fail" icon="alertCircle">欠落</Tag>
        <p className="small">承認済みの要求 <IdLink id={reqId} to={reqPath(reqId)} /> に{isTest ? "テスト" : "設計"}へのリンクがありません。ゲートBでブロックされる原因になります。</p>
        <div className="small">対応する担当: <ExternalActor userId={isTest ? "u-ito" : "u-tanaka"} role={isTest ? "QA" : "設計者"} /></div>
        <p className="tiny muted">リンクは担当者が正本（{isTest ? "テストコードの要求ID注記" : "trace/edges.yaml"}）で追加します。</p>
      </div>
    );
  }
  const req = requirements.find((r) => r.id === id);
  if (req) {
    return (
      <div className="stack" style={{ ["--gap" as string]: "10px" }}>
        <div className="row"><IdLink id={req.id} to={reqPath(req.id)} /><StatusBadge vocab={ARTIFACT_STATUS[req.status]} size="sm" /></div>
        <span className="strong">{req.title}</span>
        <ChainTable links={chainOf(req)} />
      </div>
    );
  }
  const d = designs.find((x) => x.id === id);
  const t = testCases.find((x) => x.id === id);
  const prNo = id.startsWith("PR #") ? Number(id.slice(4)) : undefined;
  const title = d?.title ?? t?.title ?? (prNo ? prTitles[prNo] : "");
  const related = requirements.filter((r) => r.design_ids.includes(id) || r.test_ids.includes(id) || (prNo !== undefined && r.pr_numbers.includes(prNo)));
  return (
    <div className="stack" style={{ ["--gap" as string]: "10px" }}>
      <div className="row">
        {d ? <IdLink id={d.id} to={paths.design(org, project, d.id)} /> : <span className="id-link">{id}</span>}
        {d ? <StatusBadge vocab={ARTIFACT_STATUS[d.status]} size="sm" /> : null}
        {t ? <Tag tone={t.last_result === "passed" ? "pass" : t.last_result === "failed" ? "fail" : "neutral"}>{{ passed: "成功", failed: "失敗", skipped: "スキップ", notRun: "未実行" }[t.last_result]}</Tag> : null}
      </div>
      <span className="strong">{title}</span>
      <span className="label">つながっている要求（{related.length}）</span>
      {related.length ? related.map((r) => <span key={r.id} className="row small"><IdLink id={r.id} to={reqPath(r.id)} />{r.title}</span>) : <span className="small muted">確定したリンクはありません（AI候補のみ）。成果物から要求への逆方向のリンクがない状態です</span>}
    </div>
  );
}

function LargeView() {
  const cols = [
    { label: "要求", count: 214, missing: 0, sub: "承認済み 168 · 変更中 12" },
    { label: "設計", count: 96, missing: 7, sub: "ADR 41 · 詳細設計 55" },
    { label: "コード（PR）", count: 388, missing: 0, sub: "直近30日 52件" },
    { label: "テスト", count: 1240, missing: 19, sub: "単体 980 · 結合 210 · 受入 50" },
  ];
  return (
    <div className="stack">
      <Banner tone="info" title="ノードが多いため集約して表示しています（1,938ノード）">要求の状態・種類で絞り込むか、「欠落のみ表示」をオンにすると個別のノードを表示します。</Banner>
      <div className="cluster-grid">
        {cols.map((c) => (
          <div key={c.label} className="cluster">
            <span className="label">{c.label}</span>
            <span className="count">{c.count.toLocaleString("ja-JP")}</span>
            <span className="tiny muted">{c.sub}</span>
          </div>
        ))}
        {cols.map((c) => (
          <div key={`m-${c.label}`} className={c.missing ? "cluster missing" : "cluster"}>
            <span className="label">{c.label}への欠落</span>
            <span className="count">{c.missing}</span>
            <span className="tiny muted">{c.missing ? "クリックで欠落のみ表示" : "欠落はありません"}</span>
          </div>
        ))}
      </div>
      <div className="card stack">
        <span className="section-title">要求のまとまり</span>
        {[
          { range: "REQ-0001〜0050", label: "発注・承認", cov: [48, 50] },
          { range: "REQ-0051〜0120", label: "在庫・出荷", cov: [64, 70] },
          { range: "REQ-0121〜0180", label: "請求・会計連携", cov: [55, 60] },
          { range: "REQ-0181〜0214", label: "非機能", cov: [20, 34] },
        ].map((g) => (
          <div key={g.range} className="row between" style={{ padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
            <span className="row"><span className="id-link">{g.range}</span><span className="small">{g.label}</span></span>
            <div style={{ width: 260 }}><CoverageMeter value={g.cov[0]} total={g.cov[1]} compact /></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TraceGraphScreen() {
  const state = useScreenState();
  const toast = useToast();
  const [status, setStatus] = useState("");
  const [kind, setKind] = useState("");
  const [onlyMissing, setOnlyMissing] = useState(state === "missingOnly");
  const [showAi, setShowAi] = useState(true);
  const [selected, setSelected] = useState<string | undefined>(state === "selected" ? "REQ-0003" : undefined);
  const cov = traceCoverage();
  const graph = useMemo(() => buildTraceGraph({ onlyMissing, status: status || undefined, kind: kind || undefined }), [onlyMissing, status, kind]);
  const missingCount = graph.nodes.filter((n) => n.missing).length;
  const noMissing = state === "noMissing";
  return (
    <ProjectLayout active="trace" trail={[{ label: "トレーサビリティ" }]}>
      <PageHeader
        title="トレーサビリティ"
        description="要求から設計、コード（PR）、テスト、実行結果、検証・妥当性確認、リリース成果物までのつながりと欠落を確認します。点線は AI の候補で、確定するまで集計に含めません。"
        meta={<SourceTag source={reqSource("trace/edges.yaml・CI レポート")} />}
        actions={
          <>
            <Button icon="list" to={paths.traceMatrix(org, project)}>表で見る</Button>
            <Button icon="image" onClick={() => toast({ kind: "success", message: "グラフを画像（PNG）で出力しました" })}>画像出力</Button>
          </>
        }
      />
      <div className="card tight row between">
        <div className="filterbar">
          <div style={{ minWidth: 160 }}><Select value={status} onChange={setStatus} placeholder="要求の状態: すべて" options={Object.entries(ARTIFACT_STATUS).map(([value, v]) => ({ value, label: v.label }))} /></div>
          <div style={{ minWidth: 140 }}><Select value={kind} onChange={setKind} placeholder="種類: すべて" options={[{ value: "functional", label: "機能" }, { value: "nonFunctional", label: "非機能" }]} /></div>
          <Toggle label="欠落のみ表示" checked={onlyMissing} onChange={setOnlyMissing} />
          <Toggle label="AI候補を表示" checked={showAi} onChange={setShowAi} />
        </div>
        <div style={{ width: 280 }}><CoverageMeter value={noMissing ? cov.total : cov.linked} total={cov.total} label="承認済み要求のテストまでのトレース" /></div>
      </div>
      {state === "loading" || state === "error" || state === "large" ? null : <ChainSummary />}
      <ViewOnlyNote>リンクの追加・修正は担当者が正本で行います。ここでは同期したリンクと、その記録場所・確定者を確認します。</ViewOnlyNote>
      {state === "loading" ? (
        <Skeleton variant="detail" />
      ) : state === "error" ? (
        <ErrorState title="トレーサビリティを読み込めませんでした" />
      ) : state === "large" ? (
        <LargeView />
      ) : noMissing ? (
        <div className="card">
          <EmptyState icon="checkCircle" title="欠落はありません" description="承認済みのすべての要求が、設計とテストまでつながっています。" action={<Button onClick={() => setOnlyMissing(false)} to={paths.trace(org, project)}>すべてのノードを表示</Button>} />
        </div>
      ) : (
        <div className="trace-layout">
          <div className="stack" style={{ ["--gap" as string]: "8px" }}>
            <div className="row between">
              <TraceLegend />
              <span className="small muted">
                {graph.nodes.length}ノード · 欠落 <strong className="text-fail">{missingCount}</strong>
              </span>
            </div>
            {graph.nodes.length ? (
              <TraceGraph nodes={graph.nodes} edges={graph.edges} selected={selected} onSelect={setSelected} showAi={showAi} />
            ) : (
              <div className="card"><EmptyState variant="filtered" title="条件に一致するノードはありません" /></div>
            )}
          </div>
          <aside className="card stack" aria-label="選択したノード">
            <div className="row between">
              <span className="section-title">ノードの詳細</span>
              {selected ? <Button size="sm" variant="ghost" iconOnly icon="x" label="選択を解除" onClick={() => setSelected(undefined)} /> : null}
            </div>
            {selected ? (
              <NodeDetail id={selected} />
            ) : (
              <div className="stack small muted" style={{ ["--gap" as string]: "8px" }}>
                <span className="row"><Icon name="target" size={14} />ノードを選ぶと、つながっている要素を強調して表示します。</span>
                <span className="row"><Icon name="alertCircle" size={14} className="text-fail" />赤い点線の枠は欠落です。選ぶとリンクを追加できます。</span>
              </div>
            )}
          </aside>
        </div>
      )}
    </ProjectLayout>
  );
}

/** 承認済み要求を基準にした、段ごとのつながり（SI-04） */
function ChainSummary() {
  const approved = requirements.filter((r) => r.status === "approved");
  const counts = CHAIN_STAGES.map((st) => {
    const linked = approved.filter((r) => chainOf(r).some((l) => l.stage === st && !l.ai)).length;
    const aiOnly = approved.filter((r) => !chainOf(r).some((l) => l.stage === st && !l.ai) && chainOf(r).some((l) => l.stage === st && l.ai)).length;
    return { st, linked, aiOnly };
  });
  return (
    <div className="req-chain" aria-label="段ごとのつながり">
      {counts.map((c, i) => (
        <div key={c.st} className={c.linked < approved.length ? "cluster missing" : "cluster"}>
          <span className="tiny muted">{i + 1}. {c.st}</span>
          <span className="count">{c.linked}<span className="tiny muted"> / {approved.length}</span></span>
          <span className="tiny muted">{c.aiOnly ? `AI候補のみ ${c.aiOnly}件` : c.linked < approved.length ? `未接続 ${approved.length - c.linked}件` : "すべて接続"}</span>
        </div>
      ))}
    </div>
  );
}
