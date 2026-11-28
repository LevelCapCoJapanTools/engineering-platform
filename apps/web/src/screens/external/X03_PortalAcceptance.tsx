// 画面ID: X-03 顧客の受入（受入試験と部分受入）
// 業務シナリオ・試用環境・対象ビルドごとに結果を記録し、契約で認めた単位で部分受入する。
// この受入は貴社の記録で、受注側が委託先に対して行う検収とは別の記録。
import { useState } from "react";
import { useScreenState } from "../../lib/router";
import { PROJECT, paths } from "../../lib/paths";
import { formatDate } from "../../lib/format";
import { uatScenarios } from "../../mocks/external";
import { fakeSha } from "../../mocks/core";
import type { StatusVocab } from "../../lib/vocab";
import { Banner, Button, CustomerPortalLayout, EmptyState, HashDisplay, Icon, Link, Select, StatusBadge, Tag, TextArea, VersionPin } from "./deps";

type Result = "pass" | "fail" | "untested" | "recheck";
const RESULT: Record<Result, StatusVocab> = {
  pass: { label: "合格", tone: "pass" },
  fail: { label: "不合格", tone: "fail" },
  untested: { label: "未試験", tone: "neutral" },
  recheck: { label: "再確認が必要", tone: "warn" },
};
const DELIVERABLES = [
  { name: "order-system-v1.4.0-rc2.zip", size: "51.0 MB", sha: fakeSha("v1.4.0-rc2-zip") },
  { name: "リリースノート_v1.4.0.pdf", size: "410 KB", sha: fakeSha("v1.4.0-notes") },
  { name: "受入試験の手順書_v1.4.0.pdf", size: "780 KB", sha: fakeSha("v1.4.0-uat") },
];
/** 契約で部分受入を認めた単位 */
const UNITS = ["取引先マスタの CSV 取込", "受注一覧の CSV 出力", "操作ログの検索"];

export function X03PortalAcceptance({ project = PROJECT, id }: { project?: string; id: string }) {
  const state = useScreenState();
  void id;
  const recheck = state === "修正版の再確認";
  const [results, setResults] = useState<Record<string, Result>>(() =>
    Object.fromEntries(uatScenarios.map((s) => [s.id, recheck ? (s.id === "UAT-02" ? "recheck" : s.result === "untested" ? "pass" : s.result) : s.result])),
  );
  const [notes, setNotes] = useState<Record<string, string>>(Object.fromEntries(uatScenarios.map((s) => [s.id, s.note ?? ""])));
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<"partial" | "accepted" | "returned" | null>(state === "一部受入" ? "partial" : state === "受入済み" ? "accepted" : state === "差戻し済み" ? "returned" : null);
  const [err, setErr] = useState("");

  const unitResult = (unit: string): Result => {
    const items = uatScenarios.filter((s) => s.feature === unit).map((s) => results[s.id]);
    if (items.some((r) => r === "fail")) return "fail";
    if (items.some((r) => r === "untested" || r === "recheck")) return "untested";
    return "pass";
  };
  const passedUnits = UNITS.filter((u) => unitResult(u) === "pass");
  const failed = uatScenarios.filter((s) => results[s.id] === "fail");
  const allPassed = passedUnits.length === UNITS.length;

  const decide = (kind: "partial" | "accepted" | "returned") => {
    if (busy) return;
    if (kind === "returned" && failed.some((s) => !notes[s.id]?.trim())) { setErr("不合格の項目に差戻しの理由を入力してください"); return; }
    setBusy(true);
    window.setTimeout(() => { setBusy(false); setDone(kind); }, 500);
  };

  return (
    <CustomerPortalLayout project={project} active="requests">
      <Link to={paths.portalRequests(project)} className="small">← 申請・承認へ戻る</Link>
      <div className="stack" style={{ ["--gap" as string]: "8px" }}>
        <div className="row" style={{ ["--gap" as string]: "8px" }}>
          <Tag tone="primary" square>受入試験</Tag>
          <span className="mono strong">{recheck ? "v1.4.0-rc3" : "v1.4.0-rc2"}</span>
          <VersionPin version={recheck ? 3 : 2} />
          <span className="tiny muted">回答期限 {formatDate("2026-12-24")}</span>
        </div>
        <h1 style={{ fontSize: "var(--text-xl)", color: "var(--text-strong)" }}>v1.4.0 取引先マスタ・受注一覧 CSV・操作ログ</h1>
        <p className="small muted">受入試験環境で、業務シナリオに沿って確認してください。結果は項目ごとに記録され、この版（{recheck ? "rc3" : "rc2"}）にだけ結び付きます。別の版の受入には使えません。</p>
      </div>

      <Banner tone="info" title="この受入は貴社の記録です">受注側が作業の委託先に対して行う検収とは別に記録されます。貴社の回答期限や結果が、受注側の社内の手続きに影響することはありません。</Banner>
      {recheck ? (
        <Banner tone="warn" title="修正版（rc3）が届きました">前回不合格だった「受注一覧の CSV 出力」に影響する項目だけ再確認してください。影響のない項目の結果（合格）は引き継いでいます。</Banner>
      ) : null}

      {done ? (
        <div className="card">
          {done === "accepted" ? (
            <EmptyState icon="checkCircle" title="すべての単位を受け入れました" description="受入記録を作成しました。控えをメールでお送りしました。" action={<Button variant="primary" to={paths.portal(project)}>案件ホームへ戻る</Button>} />
          ) : done === "partial" ? (
            <EmptyState icon="checkCircle" title={`一部を受け入れました（${passedUnits.length}/${UNITS.length} 単位）`} description={`受け入れた単位: ${passedUnits.join("、") || "なし"}。残りの単位は修正版で再確認をお願いします。受入の記録は単位ごとに残ります。`} action={<Button variant="primary" to={paths.portal(project)}>案件ホームへ戻る</Button>} />
          ) : (
            <EmptyState icon="arrowLeft" title="差し戻しました" description="差戻しの理由は案件窓口が確認し、元の条件での修正か、新しい条件のご相談かを仕分けてご連絡します。" action={<Button variant="primary" to={paths.portal(project)}>案件ホームへ戻る</Button>} />
          )}
        </div>
      ) : (
        <>
          <section className="card stack" aria-labelledby="uat-title">
            <h2 id="uat-title" className="section-title">業務シナリオごとの結果</h2>
            <div className="stack" style={{ ["--gap" as string]: "12px" }}>
              {uatScenarios.map((s) => {
                const affected = !recheck || s.id === "UAT-02";
                return (
                  <div key={s.id} className="cp-uat">
                    <div className="row between">
                      <span className="stack" style={{ ["--gap" as string]: "2px", minWidth: 0 }}>
                        <span className="tiny muted">{s.feature}</span>
                        <span className="strong small">{s.scenario}</span>
                        <span className="tiny muted">{s.env} · 対象ビルド {recheck ? s.build.replace("rc2", "rc3").replace("4e1a9c0", "7b2d4f1") : s.build}</span>
                      </span>
                      <StatusBadge vocab={RESULT[results[s.id]]} size="sm" />
                    </div>
                    {affected ? (
                      <div className="grid cols-2" style={{ ["--gap" as string]: "10px" }}>
                        <Select label="結果" value={results[s.id]} onChange={(v) => setResults((r) => ({ ...r, [s.id]: v as Result }))} options={[{ value: "pass", label: "合格" }, { value: "fail", label: "不合格" }, { value: "untested", label: "未試験" }]} />
                        <TextArea label={results[s.id] === "fail" ? "差戻しの理由（必須）" : "メモ"} rows={2} value={notes[s.id]} onChange={(v) => { setNotes((n) => ({ ...n, [s.id]: v })); setErr(""); }} />
                      </div>
                    ) : <span className="tiny muted">修正の影響なし。前回の結果を引き継いでいます。</span>}
                    {s.attachment ? <span className="tiny row" style={{ ["--gap" as string]: "4px" }}><Icon name="file" size={12} />{s.attachment}</span> : null}
                  </div>
                );
              })}
            </div>
          </section>

          <section className="card stack" aria-labelledby="unit-title">
            <h2 id="unit-title" className="section-title">受入の単位（契約で部分受入を認めた単位）</h2>
            <ul className="cp-list">
              {UNITS.map((u) => (
                <li key={u} className="row between"><span className="small">{u}</span><StatusBadge vocab={unitResult(u) === "pass" ? { label: "受入できます", tone: "pass" } : unitResult(u) === "fail" ? { label: "不合格の項目あり", tone: "fail" } : { label: "未試験の項目あり", tone: "neutral" }} size="sm" /></li>
              ))}
            </ul>
          </section>

          {DELIVERABLES.length ? (
            <section className="card stack" style={{ ["--gap" as string]: "10px" }}>
              <h2 className="section-title">納入物</h2>
              <p className="small muted">ダウンロードしたファイルが改ざんされていないことを、SHA-256 の値で確認できます。</p>
              {DELIVERABLES.map((d) => (
                <div key={d.name} className="file-row" style={{ flexWrap: "wrap" }}>
                  <Icon name="package" size={20} className="muted" />
                  <div className="grow stack" style={{ ["--gap" as string]: "2px", minWidth: 180 }}>
                    <span className="strong" style={{ overflowWrap: "anywhere" }}>{d.name}</span>
                    <span className="row tiny muted" style={{ ["--gap" as string]: "6px" }}>{d.size}<HashDisplay value={d.sha} /></span>
                  </div>
                  <Button size="sm" icon="download">ダウンロード</Button>
                </div>
              ))}
            </section>
          ) : null}

          <section className="card stack" style={{ ["--gap" as string]: "10px" }}>
            {err ? <Banner tone="fail">{err}</Banner> : null}
            <div className="sticky-actions">
              <Button variant="secondary" icon="arrowLeft" disabled={busy || failed.length === 0} disabledReason={busy ? "送信中です" : "不合格の項目がありません"} onClick={() => decide("returned")}>差し戻す</Button>
              <Button variant="secondary" icon="check" disabled={busy || passedUnits.length === 0 || allPassed} disabledReason={allPassed ? "すべて合格しています" : busy ? "送信中です" : "受け入れられる単位がありません"} onClick={() => decide("partial")}>合格した単位だけ受け入れる</Button>
              <Button variant="primary" icon="check" loading={busy} disabled={busy || !allPassed} disabledReason={busy ? "送信中です" : "すべての項目を合格にしてください"} onClick={() => decide("accepted")}>すべて受け入れる</Button>
            </div>
          </section>
        </>
      )}
    </CustomerPortalLayout>
  );
}
