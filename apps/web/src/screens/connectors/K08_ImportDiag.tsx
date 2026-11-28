// 画面ID: K-08 初期インポートと診断
import "./connectors.css";
import { useScreenState, useRoute } from "../../lib/router";
import { ORG, paths } from "../../lib/paths";
import { connectors } from "../../mocks/portfolio";
import { diagnostics, importJobs } from "../../mocks/connectors";
import type { DiagnosticIssue } from "../../mocks/connectors";
import { AppLayout, Banner, Button, crumbs, EmptyState, ErrorState, PageHeader, ProviderBadge, Section, Skeleton, StatCard, Tag, useToast } from "../../ui";

const KIND: Record<DiagnosticIssue["kind"], { label: string; icon: "copy" | "link" | "calendar" | "clock" }> = {
  duplicate: { label: "重複ID", icon: "copy" },
  unlinked: { label: "未リンク", icon: "link" },
  missingDate: { label: "日付の欠損", icon: "calendar" },
  stalled: { label: "同期の停止", icon: "clock" },
};

export function K08ImportDiag() {
  const state = useScreenState();
  const org = useRoute().params.org ?? ORG;
  const toast = useToast();
  const jobs = state === "running" ? importJobs.map((j, i) => (i === 0 ? { ...j, done: 640, status: "running" as const } : j)) : importJobs;
  const issues = state === "clean" ? [] : diagnostics;

  return (
    <AppLayout org={org} active="connectors" breadcrumb={crumbs(org, undefined, { label: "連携と同期", to: paths.connectors(org) }, { label: "初期インポートと診断" })}>
      <PageHeader
        title="初期インポートと診断"
        description="既存のプロジェクトを取り込み、経営ダッシュボードに出す前にデータの欠けや重複を見つけます。直すのは正本の側で、本サービスに同じ情報を入力し直す必要はありません。"
        actions={<Button icon="refresh" onClick={() => toast({ kind: "success", message: "診断を再実行しました" })}>診断を再実行</Button>}
      />
      {state === "loading" ? (
        <Skeleton rows={6} />
      ) : state === "error" ? (
        <ErrorState />
      ) : (
        <div className="stack">
          <Section title="初回の取込み" sub="接続ごとに全件を取得し、その後は差分を取得します" flush>
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>対象</th><th>進捗</th><th className="num">件数</th><th>状態</th><th /></tr></thead>
                <tbody>
                  {jobs.map((j) => {
                    const c = connectors.find((x) => x.id === j.connector);
                    const pct = Math.round((j.done / j.total) * 100);
                    return (
                      <tr key={j.connector}>
                        <td>
                          <div className="stack" style={{ ["--gap" as string]: "2px" }}>
                            {c ? <ProviderBadge provider={c.provider} size="sm" /> : null}
                            <span className="tiny muted">{j.label}</span>
                          </div>
                        </td>
                        <td style={{ minWidth: 160 }}>
                          <div className={`kn-bar ${j.status === "failed" ? "fail" : j.status === "running" ? "warn" : ""}`}><span style={{ width: `${pct}%` }} /></div>
                          <span className="tiny muted">{pct}%</span>
                        </td>
                        <td className="num">{j.done.toLocaleString("ja-JP")} / {j.total.toLocaleString("ja-JP")}</td>
                        <td>
                          {j.status === "done" ? <Tag tone="pass" icon="check">完了</Tag> : j.status === "running" ? <Tag tone="info" icon="refresh">取込み中</Tag> : <Tag tone="fail" icon="xCircle">失敗</Tag>}
                          {j.note ? <div className="tiny muted">{j.note}</div> : null}
                        </td>
                        <td>{c ? <Button size="sm" variant="ghost" to={paths.connector(org, c.id)}>連携</Button> : null}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Section>

          <div className="grid auto-fit">
            {(Object.keys(KIND) as DiagnosticIssue["kind"][]).map((k) => (
              <StatCard key={k} label={KIND[k].label} icon={KIND[k].icon} value={issues.filter((i) => i.kind === k).length} unit="件" tone={issues.some((i) => i.kind === k && i.severity === "high") ? "danger" : issues.some((i) => i.kind === k) ? "warn" : undefined} />
            ))}
          </div>

          {issues.some((i) => i.kind === "stalled") ? (
            <Banner tone="fail" title="同期が止まっている案件があります">止まっている間、その案件の健全性は「判定不可」と表示します。最新の値として扱わないでください。</Banner>
          ) : null}

          <Section title="診断の結果" sub="経営ダッシュボードの正確さに影響する順に並べています" flush>
            {issues.length === 0 ? (
              <EmptyState icon="checkCircle" title="問題は見つかりませんでした" description="重複ID、未リンク、日付の欠損、同期の停止はありません。" />
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>重大度</th><th>種類</th><th>対象</th><th>内容</th><th>直し方</th><th /></tr></thead>
                  <tbody>
                    {[...issues].sort((a, b) => ["high", "medium", "low"].indexOf(a.severity) - ["high", "medium", "low"].indexOf(b.severity)).map((i) => (
                      <tr key={i.id}>
                        <td><Tag tone={i.severity === "high" ? "fail" : i.severity === "medium" ? "warn" : "info"} square>{i.severity === "high" ? "高" : i.severity === "medium" ? "中" : "低"}</Tag></td>
                        <td><Tag square icon={KIND[i.kind].icon}>{KIND[i.kind].label}</Tag></td>
                        <td><div className="stack" style={{ ["--gap" as string]: "2px" }}><ProviderBadge provider={i.provider} size="sm" /><span className="small">{i.target}</span></div></td>
                        <td className="small">{i.detail}</td>
                        <td className="small">{i.fix}</td>
                        <td>
                          {i.kind === "duplicate" || i.kind === "unlinked" ? (
                            <Button size="sm" to={paths.mapping(org)}>対応付け</Button>
                          ) : i.kind === "stalled" ? (
                            <Button size="sm" to={paths.connector(org, "con-jira")}>連携を開く</Button>
                          ) : (
                            <Button size="sm" icon="external" onClick={() => toast({ kind: "info", message: "正本の該当項目を開きます（モック）" })}>正本で開く</Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>
        </div>
      )}
    </AppLayout>
  );
}
