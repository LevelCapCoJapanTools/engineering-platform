// 画面ID: S-11 AIの評価
// 専門家が作成した評価データで AI の所見の品質を定期的に測る。AI はゲートの判定に使わない。
import { useScreenState } from "../../lib/router";
import { ORG } from "../../lib/paths";
import { yen } from "../../lib/format";
import { adversarialCases, aiEvalByKind, aiEvalRuns } from "../../mocks/settings";
import { Banner, Button, EmptyState, ErrorState, Section, SettingsLayout, Skeleton, Tag, Timestamp, useToast } from "../../ui";

const pct = (n: number) => `${Math.round(n * 100)}%`;

function Delta({ now, before, invert }: { now: number; before: number; invert?: boolean }) {
  const d = Math.round((now - before) * 100);
  if (d === 0) return <span className="tiny muted">±0</span>;
  const good = invert ? d < 0 : d > 0;
  return <span className={`tiny ${good ? "text-pass" : "text-fail"}`}>{d > 0 ? "+" : ""}{d}pt</span>;
}

export function S11AiEval({ org = ORG }: { org?: string }) {
  const state = useScreenState();
  const toast = useToast();
  const runs = state === "空" ? [] : aiEvalRuns;
  const cur = runs[0];
  const prev = runs[1];
  const degraded = state === "劣化あり";
  const recall = degraded ? 0.76 : cur?.recall ?? 0;

  return (
    <SettingsLayout
      org={org}
      active="aiEval"
      title="AIの評価"
      description="専門家が作成した評価データで、AI の所見の適合率・再現率・誤指摘・見落とし・悪意ある入力への耐性を測ります。モデルやテンプレートを変える前後で比較します。"
      actions={<Button variant="primary" icon="play" disabled={state === "空"} disabledReason="評価データを登録してください" onClick={() => toast({ kind: "success", message: "評価を開始しました。完了まで約20分かかります" })}>評価を実行</Button>}
    >
      {state === "読み込み中" ? (
        <Skeleton variant="detail" />
      ) : state === "エラー" ? (
        <ErrorState />
      ) : !cur ? (
        <div className="card">
          <EmptyState icon="gauge" title="評価の記録はまだありません" description="専門家が作成した評価データ（正解付きの要求・設計の例と、悪意ある入力の例）を登録すると、AI の品質を測れます。評価データに規格本文は含めません。" action={<Button variant="primary" icon="upload">評価データを登録</Button>} />
        </div>
      ) : (
        <>
          <Banner tone="info" title="AI の所見は参考情報です">評価の結果に関わらず、AI の出力はゲートの判定や承認には使いません。評価は、所見を人が確認するときの信頼度の目安に使います。</Banner>
          {degraded ? (
            <Banner tone="fail" title="モデルの更新後に再現率が下がりました" action={<Button size="sm" onClick={() => toast({ kind: "info", message: "以前のモデルに戻す変更を申請しました" })}>以前のモデルに戻す</Button>}>
              再現率が 87% から 76% に下がりました（基準 80%）。見落としが増えているため、新しいモデルへの切り替えを保留しています。
            </Banner>
          ) : null}

          <div className="grid auto-fit">
            <div className="card tight stack" style={{ ["--gap" as string]: "2px" }}><span className="tiny muted">適合率（指摘の正しさ）</span><strong style={{ fontSize: "var(--text-xl)" }}>{pct(cur.precision)}</strong>{prev ? <Delta now={cur.precision} before={prev.precision} /> : null}</div>
            <div className="card tight stack" style={{ ["--gap" as string]: "2px" }}><span className="tiny muted">再現率（見落としの少なさ）</span><strong style={{ fontSize: "var(--text-xl)", color: degraded ? "var(--tone-fail)" : undefined }}>{pct(recall)}</strong>{prev ? <Delta now={recall} before={prev.recall} /> : null}</div>
            <div className="card tight stack" style={{ ["--gap" as string]: "2px" }}><span className="tiny muted">誤指摘／見落とし</span><strong style={{ fontSize: "var(--text-xl)" }}>{cur.falsePositive}件／{degraded ? 58 : cur.missed}件</strong><span className="tiny muted">240 件中</span></div>
            <div className="card tight stack" style={{ ["--gap" as string]: "2px" }}><span className="tiny muted">悪意ある入力の試験</span><strong style={{ fontSize: "var(--text-xl)" }}>{cur.adversarialPass}/{cur.adversarialTotal}</strong><span className="tiny muted">合格</span></div>
            <div className="card tight stack" style={{ ["--gap" as string]: "2px" }}><span className="tiny muted">評価1回の費用</span><strong style={{ fontSize: "var(--text-xl)" }}>{yen(cur.costYen)}</strong></div>
          </div>

          <Section title="評価の履歴（モデル変更前後の比較）" flush>
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>実施日</th><th>モデル</th><th>テンプレート</th><th className="num">適合率</th><th className="num">再現率</th><th className="num">誤指摘</th><th className="num">見落とし</th><th className="num">悪意ある入力</th><th className="num">費用</th></tr></thead>
                <tbody>
                  {runs.map((r) => (
                    <tr key={r.id}>
                      <td><Timestamp at={r.at} mode="date" />{r.current ? <> <Tag tone="primary" square>使用中</Tag></> : null}</td>
                      <td className="mono small">{r.model}</td>
                      <td className="mono small">{r.template}</td>
                      <td className="num">{pct(r.precision)}</td>
                      <td className="num">{pct(r.current && degraded ? recall : r.recall)}</td>
                      <td className="num">{r.falsePositive}</td>
                      <td className="num">{r.current && degraded ? 58 : r.missed}</td>
                      <td className="num">{r.adversarialPass}/{r.adversarialTotal}</td>
                      <td className="num">{yen(r.costYen)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="tiny muted" style={{ padding: "8px 16px" }}>評価データ: {cur.dataset}。モデル・テンプレートの切り替えは、基準（適合率 85%・再現率 80%・悪意ある入力の全件検出を目標）を満たした場合にポリシー管理者が承認します。</p>
          </Section>

          <div className="grid cols-2">
            <Section title="所見の種類ごとの品質" flush>
              <div className="table-wrap">
                <table className="table compact">
                  <thead><tr><th>種類</th><th className="num">件数</th><th className="num">適合率</th><th className="num">再現率</th></tr></thead>
                  <tbody>
                    {aiEvalByKind.map((k) => (
                      <tr key={k.kind}><td className="small">{k.kind}</td><td className="num">{k.n}</td><td className="num">{pct(k.precision)}</td><td className="num">{pct(k.recall)}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
            <Section title="悪意ある入力の試験" flush>
              <div className="table-wrap">
                <table className="table compact">
                  <thead><tr><th>試験</th><th>結果</th></tr></thead>
                  <tbody>
                    {adversarialCases.map((c) => (
                      <tr key={c.name}>
                        <td className="small">{c.name}<div className="tiny muted">{c.result}</div></td>
                        <td>{c.pass ? <Tag tone="pass" square icon="check">合格</Tag> : <Tag tone="fail" square icon="alert">要対策</Tag>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          </div>
        </>
      )}
    </SettingsLayout>
  );
}
