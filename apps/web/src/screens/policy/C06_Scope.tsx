// 画面ID: C-06 適用範囲の確認
import { useScreenState } from "../../lib/router";
import { ORG, paths } from "../../lib/paths";
import { formatDate } from "../../lib/format";
import { userById } from "../../mocks/core";
import { packBySlug, scopeChecks, SCOPE_RESULT } from "../../mocks/policy";
import type { ScopeResult } from "../../mocks/policy";
import { AppLayout, Banner, Button, crumbs, EmptyState, ErrorState, PageHeader, Section, Skeleton, StatusBadge } from "../../ui";

function overall(results: ScopeResult[]): ScopeResult {
  if (results.includes("out")) return "out";
  if (results.includes("expert")) return "expert";
  return "in";
}

export function ScopeScreen({ org = ORG, pack: slug }: { org?: string; pack: string }) {
  const state = useScreenState();
  const pack = packBySlug(slug);
  const list = state === "empty" ? [] : scopeChecks;
  return (
    <AppLayout org={org} active="policies" breadcrumb={crumbs(org, undefined, { label: "ポリシー", to: paths.policies(org) }, { label: `${pack.name} ${pack.version}`, to: paths.policy(org, pack.slug) }, { label: "適用範囲の確認" })}>
      <PageHeader
        title="適用範囲の確認"
        description={`案件の人数・製品数・クリティカリティ・開発形態を記録し、${pack.profile} の Control Pack の対象かどうかを示します。`}
        actions={<Button variant="primary" icon="plus" to={paths.projectNew(org)}>案件の情報を記録</Button>}
      />
      <Banner tone="info" title="これは適合の判定ではありません">
        記録した値を、Control Pack が想定する範囲（原則25人以下の組織、単一チーム・単一製品、非セーフティクリティカル）と機械的に照らし合わせた表示です。「要専門家確認」「対象外」の案件では、画面や監査パックに「Basic 対応」と表示しません。
      </Banner>
      {state === "loading" ? (
        <Skeleton rows={6} />
      ) : state === "error" ? (
        <ErrorState />
      ) : list.length === 0 ? (
        <div className="card"><EmptyState icon="target" title="記録された案件はありません" description="プロジェクトの作成時に、適用範囲の情報を記録します。" /></div>
      ) : (
        list.map((c) => {
          const result = overall(c.factors.map((f) => f.result));
          return (
            <Section
              key={c.project}
              title={<span className="row" style={{ ["--gap" as string]: "8px" }}>{c.project}<StatusBadge vocab={SCOPE_RESULT[result]} size="sm" /></span>}
              sub={`記録: ${userById(c.recorded_by)?.name ?? "—"} · ${formatDate(c.recorded_at)}`}
              actions={c.slug ? <Button size="sm" variant="ghost" icon="arrowRight" to={paths.project(org, c.slug)}>プロジェクト</Button> : undefined}
              flush
            >
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>項目</th><th>記録した値</th><th>Control Pack の想定</th><th>結果</th></tr></thead>
                  <tbody>
                    {c.factors.map((f) => (
                      <tr key={f.label}>
                        <td className="strong small">{f.label}</td>
                        <td className="small">{f.value}</td>
                        <td className="small muted">{f.rule}</td>
                        <td><StatusBadge vocab={SCOPE_RESULT[f.result]} size="sm" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {result !== "in" ? (
                <div style={{ padding: "10px 16px" }}>
                  <Banner tone={result === "out" ? "fail" : "warn"}>
                    {result === "out"
                      ? "この案件は Control Pack の想定範囲外です。Basic の Control Pack を適用しても「対応」とは表示しません。"
                      : "規格の専門家の確認が必要です。確認が終わるまで、この案件の監査パックには「範囲の確認中」と表示します。"}
                  </Banner>
                </div>
              ) : null}
            </Section>
          );
        })
      )}
    </AppLayout>
  );
}
