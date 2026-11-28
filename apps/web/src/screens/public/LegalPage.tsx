// P-07 / P-08 共通の長文レイアウト（タイトル、最終更新日、目次、本文）
import "./public.css";
import { MarkdownViewer, PublicLayout } from "../../ui";
import { formatDate } from "../../lib/format";

export type LegalSection = { id: string; title: string; body: string };

export function LegalPage({ title, updatedAt, intro, sections }: { title: string; updatedAt: string; intro: string; sections: LegalSection[] }) {
  return (
    <PublicLayout>
      <section className="section" style={{ paddingBottom: 16 }}>
        <div className="container stack" style={{ ["--gap" as string]: "10px" }}>
          <h1 className="display" style={{ fontSize: "clamp(26px, 3.6vw, 36px)" }}>{title}</h1>
          <p className="small muted">最終更新日: {formatDate(updatedAt)}</p>
        </div>
      </section>
      <div className="container with-toc" style={{ paddingBottom: 72 }}>
        <nav className="toc" aria-label="目次">
          {sections.map((s) => (
            <a key={s.id} href={`#${s.id}`} onClick={(e) => { e.preventDefault(); document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth" }); }}>{s.title}</a>
          ))}
        </nav>
        <article className="legal stack" style={{ ["--gap" as string]: "28px" }}>
          <MarkdownViewer source={intro} />
          {sections.map((s) => (
            <section key={s.id} id={s.id} style={{ scrollMarginTop: 90 }}>
              <h2 className="section-title" style={{ fontSize: "var(--text-lg)", marginBottom: 10 }}>{s.title}</h2>
              <MarkdownViewer source={s.body} />
            </section>
          ))}
        </article>
      </div>
    </PublicLayout>
  );
}
