// 画面ID: X-03 顧客の受入
import { useState } from "react";
import { useScreenState } from "../../lib/router";
import { PROJECT, paths } from "../../lib/paths";
import { formatDate } from "../../lib/format";
import { acceptanceTargets } from "../../mocks/external";
import { Banner, Button, Checkbox, EmptyState, HashDisplay, Icon, Link, PortalLayout, Tag, TextArea } from "./deps";

export function X03PortalAcceptance({ project = PROJECT, id }: { project?: string; id: string }) {
  const state = useScreenState();
  const t = acceptanceTargets[id] ?? acceptanceTargets["rel-121"];
  const [checked, setChecked] = useState<boolean[]>(t.checklist.map(() => false));
  const [comment, setComment] = useState("");
  const [err, setErr] = useState("");
  const [decided, setDecided] = useState<"accepted" | "returned" | null>(state === "受入済み" ? "accepted" : state === "差戻し済み" ? "returned" : null);
  const allChecked = checked.every(Boolean);

  return (
    <PortalLayout project={project}>
      <Link to={paths.portal(project)} className="small">← ポータルのホームへ戻る</Link>
      <div className="stack" style={{ ["--gap" as string]: "8px" }}>
        <div className="row" style={{ ["--gap" as string]: "8px" }}>
          <Tag tone="primary" square>受入</Tag>
          <span className="mono strong">{t.version}</span>
          <span className="tiny muted">リリース {formatDate(t.released_at)}</span>
        </div>
        <h1 style={{ fontSize: "var(--text-xl)", color: "var(--text-strong)" }}>{t.title}</h1>
      </div>

      {decided === "accepted" ? (
        <div className="card">
          <EmptyState icon="checkCircle" title="受け入れました" description="受入記録を作成し、リリースの Evidence Manifest に追加しました。記録は署名され、改ざんできない保管先に保存されます。" action={<Button variant="primary" to={paths.portal(project)}>ホームへ戻る</Button>} />
        </div>
      ) : decided === "returned" ? (
        <div className="card">
          <EmptyState icon="arrowLeft" title="差し戻しました" description="開発チームに理由を通知しました。修正版のリリース後に、もう一度受入の依頼が届きます。" action={<Button variant="primary" to={paths.portal(project)}>ホームへ戻る</Button>} />
        </div>
      ) : (
        <>
          <section className="card stack" style={{ ["--gap" as string]: "10px" }}>
            <h2 className="section-title">リリースの要約</h2>
            <p style={{ lineHeight: 1.85 }}>{t.summary}</p>
          </section>

          <section className="card stack" style={{ ["--gap" as string]: "10px" }}>
            <h2 className="section-title">納入物</h2>
            <p className="small muted">ダウンロードしたファイルが改ざんされていないことを、SHA-256 の値で確認できます。</p>
            {t.deliverables.map((d) => (
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

          <section className="card stack" style={{ ["--gap" as string]: "10px" }}>
            <div className="row between">
              <h2 className="section-title">受入チェックリスト</h2>
              <span className={allChecked ? "badge tone-pass" : "badge tone-warn"}>{checked.filter(Boolean).length}/{checked.length} 確認済み</span>
            </div>
            <p className="small muted">ご自身で確認した項目にチェックしてください。すべて確認すると「受け入れる」を押せます。</p>
            <div className="stack" style={{ ["--gap" as string]: "12px" }}>
              {t.checklist.map((c, i) => (
                <Checkbox key={c} label={c} checked={checked[i]} onChange={(v) => setChecked((xs) => xs.map((x, j) => (j === i ? v : x)))} />
              ))}
            </div>
          </section>

          <section className="card stack" style={{ ["--gap" as string]: "10px" }}>
            <h2 className="section-title">既知の問題</h2>
            {t.known_issues.length ? (
              <Banner tone="warn">
                <ul style={{ margin: 0, paddingLeft: 18 }}>{t.known_issues.map((k) => <li key={k}>{k}</li>)}</ul>
              </Banner>
            ) : (
              <p className="small muted">既知の問題はありません。</p>
            )}
          </section>

          <section className="card stack" style={{ ["--gap" as string]: "10px" }}>
            <TextArea label="コメント" help="差し戻す場合は理由が必須です" value={comment} onChange={(v) => { setComment(v); setErr(""); }} rows={3} error={err || undefined} />
            <div className="sticky-actions">
              <Button variant="secondary" icon="arrowLeft" onClick={() => (comment.trim() ? setDecided("returned") : setErr("差し戻す理由を入力してください"))}>差し戻す</Button>
              <Button variant="primary" icon="check" disabled={!allChecked} disabledReason="チェックリストをすべて確認してください" onClick={() => setDecided("accepted")}>受け入れる</Button>
            </div>
          </section>
        </>
      )}
    </PortalLayout>
  );
}
