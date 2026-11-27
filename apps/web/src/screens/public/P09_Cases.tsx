// 画面ID: P-09 導入事例（一覧と詳細）
import "./public.css";
import { Button, EmptyState, Icon, PublicLayout, Tag } from "../../ui";
import { paths } from "../../lib/paths";
import { Link, useScreenState } from "../../lib/router";
import { cases } from "../../mocks/public";

export function P09Cases() {
  const state = useScreenState();
  const list = state === "空" ? [] : cases;
  return (
    <PublicLayout>
      <section className="section" style={{ paddingBottom: 24 }}>
        <div className="container stack" style={{ ["--gap" as string]: "12px" }}>
          <span className="eyebrow">CASE STUDIES</span>
          <h1 className="display" style={{ fontSize: "clamp(28px, 4vw, 40px)" }}>導入事例</h1>
          <p className="lead">小さなチームが、開発の流れを止めずに品質の証跡を残している事例です（掲載企業はすべて架空です）。</p>
        </div>
      </section>
      <div className="container" style={{ paddingBottom: 72 }}>
        {list.length === 0 ? (
          <div className="card"><EmptyState icon="book" title="導入事例を準備中です" description="公開できる事例がそろいしだい掲載します。" action={<Button variant="primary" to={paths.contact()}>PoCを相談</Button>} /></div>
        ) : (
          <div className="grid cols-3">
            {list.map((c) => (
              <Link key={c.id} to={paths.caseDetail(c.id)} className="card interactive stack" style={{ ["--gap" as string]: "12px", textDecoration: "none", color: "inherit" }}>
                <div className="row"><Tag square>{c.industry}</Tag><Tag square>{c.size}</Tag></div>
                <strong className="strong" style={{ fontSize: "var(--text-md)" }}>{c.title}</strong>
                <span className="small muted">{c.company}</span>
                <div className="grid cols-2" style={{ ["--gap" as string]: "8px" }}>
                  {c.metrics.map((m) => (
                    <div key={m.label} className="card tint tight">
                      <div className="tiny muted">{m.label}</div>
                      <div className="strong" style={{ fontSize: "var(--text-lg)", color: "var(--primary)" }}>{m.value}</div>
                    </div>
                  ))}
                </div>
                <span className="small" style={{ color: "var(--primary)" }}>事例を読む →</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </PublicLayout>
  );
}

export function P09CaseDetail({ id }: { id: string }) {
  const c = cases.find((x) => x.id === id) ?? cases[0];
  return (
    <PublicLayout>
      <article className="container" style={{ maxWidth: 820, padding: "48px 24px 72px", display: "flex", flexDirection: "column", gap: 24 }}>
        <Link to={paths.cases()} className="small row" style={{ ["--gap" as string]: "4px" }}><Icon name="arrowLeft" size={13} />導入事例の一覧</Link>
        <div className="row"><Tag square>{c.industry}</Tag><Tag square>{c.size}</Tag></div>
        <h1 className="display" style={{ fontSize: "clamp(26px, 3.6vw, 36px)" }}>{c.title}</h1>
        <p className="muted">{c.company}</p>
        <div className="grid cols-2">
          {c.metrics.map((m) => (
            <div key={m.label} className="stat">
              <span className="stat-label">{m.label}</span>
              <span className="stat-value" style={{ color: "var(--primary)" }}>{m.value}</span>
            </div>
          ))}
        </div>
        <section className="stack" style={{ ["--gap" as string]: "10px" }}>
          <h2 className="section-title">導入前の課題</h2>
          <p className="lead" style={{ fontSize: "var(--text-sm)" }}>案件ごとに Excel と Word で成果物を管理しており、要求とテストの対応を確認するのに毎回半日かかっていました。</p>
          <h2 className="section-title">導入後の変化</h2>
          <p className="lead" style={{ fontSize: "var(--text-sm)" }}>{c.summary}</p>
          <blockquote className="card tint" style={{ margin: 0 }}>
            <p>「ゲートが止めた理由と直し方がその場で分かるので、開発者の不満は思ったより少なかったです。」</p>
            <p className="small muted" style={{ marginTop: 8 }}>— 開発部 マネージャー（架空）</p>
          </blockquote>
        </section>
        <div className="cta-band">
          <h2 className="headline" style={{ color: "inherit", fontSize: "var(--text-lg)" }}>同じ進め方を試してみませんか</h2>
          <Button variant="secondary" to={paths.contact()} iconRight="arrowRight">PoCを相談</Button>
        </div>
      </article>
    </PublicLayout>
  );
}
