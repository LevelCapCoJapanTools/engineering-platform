// 画面ID: V-06 監査パックの出力
import { useEffect, useState } from "react";
import { useScreenState } from "../../lib/router";
import { ORG, PROJECT } from "../../lib/paths";
import { SHARE_STATUS } from "../../lib/vocab";
import { releases, userById } from "../../mocks/core";
import { exportHistory } from "../../mocks/audit";
import {
  Banner,
  Button,
  Checkbox,
  DatePicker,
  EmptyState,
  HashDisplay,
  Icon,
  OptionCard,
  PageHeader,
  ProjectLayout,
  Radio,
  Section,
  ShareLinkPanel,
  StatusBadge,
  Stepper,
  Timestamp,
  UserChip,
  useToast,
} from "../../ui";

const STEPS = ["範囲", "内容", "形式", "生成"];
const CONTENTS = [
  { key: "controls", label: "統制項目の対応表", desc: "統制項目ごとの充足状態と根拠の参照番号" },
  { key: "evidence", label: "証跡", desc: "証跡ファイルとハッシュ" },
  { key: "manifests", label: "Evidence Manifest", desc: "署名付きの目録と検証結果" },
  { key: "approvals", label: "承認記録", desc: "承認者、ロール、時刻" },
  { key: "exceptions", label: "例外", desc: "理由、リスク、期限、承認者" },
  { key: "log", label: "監査ログ", desc: "期間内のすべての判断と操作" },
];

export function AuditExport({ org = ORG, project = PROJECT }: { org?: string; project?: string }) {
  const state = useScreenState();
  const toast = useToast();
  const initialStep = state === "generating" || state === "done" || state === "failed" ? 3 : 0;
  const [step, setStep] = useState(initialStep);
  const [rangeKind, setRangeKind] = useState("release");
  const [selReleases, setSelReleases] = useState<string[]>(["rel-130", "rel-121"]);
  const [contents, setContents] = useState<string[]>(CONTENTS.map((c) => c.key));
  const [ai, setAi] = useState("include");
  const [gen, setGen] = useState<"idle" | "running" | "done" | "failed">(state === "generating" ? "running" : state === "done" ? "done" : state === "failed" ? "failed" : "idle");
  const [progress, setProgress] = useState(state === "generating" ? 55 : 0);
  useEffect(() => {
    setStep(initialStep);
    setGen(state === "generating" ? "running" : state === "done" ? "done" : state === "failed" ? "failed" : "idle");
    setProgress(state === "generating" ? 55 : 0);
  }, [state, initialStep]);
  const start = () => {
    setGen("running");
    setProgress(5);
    const t = window.setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          window.clearInterval(t);
          setGen("done");
          return 100;
        }
        return Math.min(100, p + 19);
      });
    }, 350);
  };
  const toggle = (arr: string[], v: string) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const history = state === "noHistory" ? [] : exportHistory;

  return (
    <ProjectLayout org={org} project={project} active="auditExport" trail={[{ label: "監査パックの出力" }]}>
      <PageHeader title="監査パックの出力" description="評価者に渡す証跡一式を ZIP（PDF の要約と JSON）で出力します。出力は認証ではなく、評価の準備のための資料です。" />
      <div className="card stack" style={{ ["--gap" as string]: "24px" }}>
        <Stepper steps={STEPS} current={step} errorAt={gen === "failed" ? 3 : undefined} />

        {step === 0 ? (
          <div className="stack">
            <h2 className="section-title">1. 範囲を選ぶ</h2>
            <div className="grid cols-2">
              <OptionCard name="range" value="release" checked={rangeKind === "release"} onChange={setRangeKind} title="リリースで選ぶ" description="リリースに紐づく証跡と Manifest をまとめます" />
              <OptionCard name="range" value="period" checked={rangeKind === "period"} onChange={setRangeKind} title="期間で選ぶ" description="期間内に記録されたすべての証跡をまとめます" />
            </div>
            {rangeKind === "release" ? (
              <div className="stack" style={{ ["--gap" as string]: "8px" }}>
                <span className="label">リリース（複数選択）</span>
                {releases.map((r) => (
                  <Checkbox key={r.id} label={<span className="row" style={{ ["--gap" as string]: "8px" }}><span className="mono strong">{r.version}</span>{r.title}</span>} description={r.manifest_id ? `Manifest ${r.manifest_id}` : "Manifest 未作成（リリース前）"} checked={selReleases.includes(r.id)} onChange={() => setSelReleases((s) => toggle(s, r.id))} disabled={!r.manifest_id} />
                ))}
              </div>
            ) : (
              <div className="grid cols-2">
                <DatePicker label="開始日" defaultValue="2026-09-01" max="2026-11-27" />
                <DatePicker label="終了日" defaultValue="2026-11-27" max="2026-11-27" />
              </div>
            )}
          </div>
        ) : null}

        {step === 1 ? (
          <div className="stack">
            <h2 className="section-title">2. 含める内容を選ぶ</h2>
            <div className="grid cols-2">
              {CONTENTS.map((c) => (
                <OptionCard key={c.key} type="checkbox" name="contents" value={c.key} checked={contents.includes(c.key)} onChange={(v) => setContents((s) => toggle(s, v))} title={c.label} description={c.desc} />
              ))}
            </div>
            <div className="stack" style={{ ["--gap" as string]: "8px" }}>
              <span className="label">AIの参考所見の扱い</span>
              <Radio name="ai" value="include" checked={ai === "include"} onChange={setAi} label="含める" description="「AI・参考」と明示し、判定に使われていないことを注記します" />
              <Radio name="ai" value="exclude" checked={ai === "exclude"} onChange={setAi} label="除く" description="AIレビューのハッシュ記録だけを残し、所見の本文は含めません" />
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="stack">
            <h2 className="section-title">3. 形式を確認する</h2>
            <OptionCard name="format" value="zip" checked onChange={() => undefined} title="ZIP（PDF の要約 + JSON）" description="PDF は統制項目ごとの要約、JSON は機械で検証できる元データです。ZIP 全体のハッシュを記録します。" badge={<StatusBadge vocab={{ label: "既定", tone: "info" }} size="sm" />} />
            <div className="card tight stack" style={{ ["--gap" as string]: "6px", background: "var(--bg-subtle)" }}>
              <span className="label">出力の内容</span>
              <span className="small">範囲: {rangeKind === "release" ? selReleases.map((id) => releases.find((r) => r.id === id)?.version).join("、") || "未選択" : "期間指定"}</span>
              <span className="small">内容: {contents.map((k) => CONTENTS.find((c) => c.key === k)?.label).join("、")}</span>
              <span className="small">AIの所見: {ai === "include" ? "含める（参考と明示）" : "除く"}</span>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="stack">
            <h2 className="section-title">4. 生成する</h2>
            {gen === "idle" ? (
              <div className="row"><Button variant="primary" icon="package" onClick={start}>監査パックを生成</Button><span className="small muted">数分かかることがあります。画面を離れても生成は続きます。</span></div>
            ) : gen === "running" ? (
              <div className="stack" style={{ ["--gap" as string]: "8px" }}>
                <div className="row"><span className="spinner" /> <span>生成しています… {progress}%</span></div>
                <div className="meter"><div className="bar"><span style={{ width: `${progress}%` }} /></div></div>
                <span className="small muted">証跡のハッシュを照合し、Manifest の署名を検証しています。</span>
              </div>
            ) : gen === "failed" ? (
              <Banner tone="fail" title="生成に失敗しました" action={<Button size="sm" icon="refresh" onClick={start}>再試行</Button>}>
                MAN-0010 の署名検証に失敗したため、生成を中止しました。該当リリースを範囲から外すか、原因を調査してください。
              </Banner>
            ) : (
              <div className="stack">
                <Banner tone="pass" title="監査パックを生成しました">audit-pack_order-renewal_2026-11-27.zip（8.4 MB）</Banner>
                <div className="row">
                  <Button variant="primary" icon="download" onClick={() => toast({ kind: "success", message: "ダウンロードを開始しました（モック）" })}>ダウンロード</Button>
                  <HashDisplay label="ZIP の SHA-256" value="4c1e9a7b20f3d8e5a6b19c0d2e7f84a3b5c6d7e8f90a1b2c3d4e5f60718293a4" />
                </div>
                <div className="card tight"><ShareLinkPanel /></div>
              </div>
            )}
          </div>
        ) : null}

        <div className="onboarding-foot">
          {step > 0 && gen !== "running" ? <Button variant="ghost" icon="arrowLeft" onClick={() => { setStep((s) => s - 1); setGen("idle"); }}>戻る</Button> : <span />}
          {step < 3 ? (
            <Button variant="primary" iconRight="arrowRight" disabled={(step === 0 && rangeKind === "release" && selReleases.length === 0) || (step === 1 && contents.length === 0)} disabledReason="1つ以上選択してください" onClick={() => setStep((s) => s + 1)}>次へ</Button>
          ) : null}
        </div>
      </div>

      <Section title="過去の出力" sub="出力したファイルのハッシュと共有リンクの状態" flush>
        {history.length ? (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>出力日時</th><th>出力者</th><th>範囲</th><th>ファイルのハッシュ</th><th>共有リンク</th><th /></tr></thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id}>
                    <td><Timestamp at={h.at} mode="absolute" /></td>
                    <td><UserChip user={userById(h.by)} showRole={false} /></td>
                    <td className="small">{h.range}</td>
                    <td><HashDisplay value={h.sha256} /></td>
                    <td><StatusBadge vocab={SHARE_STATUS[h.share]} size="sm" /></td>
                    <td><Button size="sm" variant="ghost" icon="download" iconOnly label="再ダウンロード" onClick={() => toast({ kind: "success", message: `${h.id} をダウンロードしました（モック）` })} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon="package" title="まだ出力していません" description="上の手順で最初の監査パックを出力できます。" />
        )}
      </Section>
      <p className="tiny muted row" style={{ ["--gap" as string]: "6px" }}><Icon name="info" size={13} />監査パックは ISO/IEC 29110 の適合準備のための資料です。認証は第三者の認証機関が行います。</p>
    </ProjectLayout>
  );
}
