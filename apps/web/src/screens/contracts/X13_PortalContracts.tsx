// 画面ID: X-13 契約・知的資産（顧客）
// 発注企業が、自社が当事者の締結済み契約と適用される覚書、公開済みの資産明細、未合意事項を確認する。
// 受注側とフリーエンジニアの契約、委託単価、社内メモは表示しない（一覧・検索・添付・出力のいずれにも出さない）。
import { Link, useScreenState } from "../../lib/router";
import { paths, PROJECT } from "../../lib/paths";
import { formatDate } from "../../lib/format";
import { engagementOf } from "../../mocks/engagement";
import { CONTRACT_KIND, IP_ORIGIN, contracts, ipAssets } from "../../mocks/contracts";
import { Button, CustomerPortalLayout, EmptyState, ErrorState, Section, Skeleton, Tag } from "../../ui";
import { ContractStatusBadge, DispositionTag, LegalNote } from "./parts";

export function X13PortalContracts({ project = PROJECT }: { project?: string }) {
  const state = useScreenState();
  const pr = state === "提携先" ? "member-app-api" : project;
  const eng = engagementOf(pr);
  const company = eng?.customer_company ?? "";
  // 自社が当事者で、顧客に公開する契約だけ
  const mine = state === "契約なし" ? [] : contracts.filter((c) => c.project === pr && c.customer_visible && c.kind !== "freelance" && c.parties.includes(company));
  const roots = mine.filter((c) => !c.parent_id || !mine.some((p) => p.id === c.parent_id));
  const children = (id: string) => mine.filter((c) => c.parent_id === id);
  const assets = ipAssets.filter((a) => a.project === pr && a.customer_visible);
  const openClauses = mine.flatMap((c) => c.clauses.filter((x) => x.state === "open" || x.state === "changed").map((x) => ({ c, x })));
  const openAssets = assets.filter((a) => a.disposition === "undecided" || a.rights_check !== "confirmed");

  return (
    <CustomerPortalLayout project={pr} active="contracts" userId={pr === "member-app-api" ? "u-fujii" : "u-nakamura"}>
      <div className="stack" style={{ ["--gap" as string]: "4px" }}>
        <div className="page-title"><h1>契約・知的資産</h1></div>
        <p className="small muted">{company} が当事者の契約と、公開された資産の明細です。署名は権限者が電子契約サービスで行います。</p>
      </div>
      {state === "読み込み中" ? (
        <Skeleton />
      ) : state === "エラー" ? (
        <ErrorState />
      ) : mine.length === 0 ? (
        <div className="card"><EmptyState icon="fileCheck" title="公開された契約はまだありません" description="受注側から契約の確認依頼が届くと、ここに表示されます。" /></div>
      ) : (
        <>
          {openClauses.length || openAssets.length ? (
            <Section title="未合意の事項" sub="回答が必要な条項と、扱いが決まっていない資産">
              <ul className="stack" style={{ ["--gap" as string]: "6px", listStyle: "none", padding: 0, margin: 0 }}>
                {openClauses.map(({ c, x }) => (
                  <li key={`${c.id}-${x.id}`} className="row between ct-line">
                    <span className="small"><strong>{c.title}</strong> {x.no} {x.title}</span>
                    <Button size="sm" iconRight="arrowRight" to={paths.portalContract(pr, c.id)}>確認する</Button>
                  </li>
                ))}
                {openAssets.map((a) => (
                  <li key={a.id} className="row between ct-line">
                    <span className="small"><strong>{a.name}</strong> — {a.disposition === "undecided" ? "権利の扱いが未合意" : "権利の確認待ち（受注側が確認中）"}</span>
                    <DispositionTag value={a.disposition} />
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}

          <Section title="契約" sub="基本契約と、それに適用される変更覚書" flush>
            <ul className="stack" style={{ ["--gap" as string]: "0", listStyle: "none", padding: 0, margin: 0 }}>
              {roots.map((c) => <ContractTree key={c.id} c={c} depth={0} />)}
            </ul>
          </Section>

          <Section title="公開された資産の明細" sub="受注側が公開した範囲です">
            <div className="table-wrap">
              <table className="table compact">
                <thead><tr><th>資産</th><th>区分</th><th>扱い</th><th>根拠</th></tr></thead>
                <tbody>
                  {assets.map((a) => (
                    <tr key={a.id}>
                      <td className="small"><strong>{a.name}</strong><br /><span className="tiny muted">{a.deliverable}</span></td>
                      <td><Tag tone={IP_ORIGIN[a.origin].tone} square>{IP_ORIGIN[a.origin].label}</Tag></td>
                      <td><DispositionTag value={a.disposition} /></td>
                      <td className="tiny">{a.basis.replace(/CT-F\d+[^／]*／?/, "")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
          <p className="tiny muted">受注側と再委託先の契約は、この画面には表示されません。</p>
          <LegalNote />
        </>
      )}
    </CustomerPortalLayout>
  );

  function ContractTree({ c, depth }: { c: (typeof contracts)[number]; depth: number }) {
    return (
      <li>
        <Link to={paths.portalContract(pr, c.id)} className="row between ct-line ct-row" style={{ paddingLeft: 16 + depth * 20 }}>
          <span className="stack" style={{ ["--gap" as string]: "2px", minWidth: 0 }}>
            <span className="strong small">{depth ? "└ " : ""}{c.title}</span>
            <span className="tiny muted">{CONTRACT_KIND[c.kind]} · v{c.version} · {formatDate(c.period.start)}〜{formatDate(c.period.end)}</span>
          </span>
          <ContractStatusBadge c={c} />
        </Link>
        {children(c.id).length ? (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {children(c.id).map((ch) => <ContractTree key={ch.id} c={ch} depth={depth + 1} />)}
          </ul>
        ) : null}
      </li>
    );
  }
}
