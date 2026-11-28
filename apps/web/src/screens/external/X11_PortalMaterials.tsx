// 画面ID: X-11 顧客ポータル: 資料の提出
// 受注側から依頼された資料（ロゴ、表示文言、審査用資料など）を、用途・期限・提出先を確認して提出する。
// 差し替えても、受注側が指定するまで過去の納入記録には反映されない。
import { useState } from "react";
import { useScreenState } from "../../lib/router";
import { PROJECT } from "../../lib/paths";
import { formatDate } from "../../lib/format";
import type { StatusVocab } from "../../lib/vocab";
import { materialRequests } from "../../mocks/external";
import { Banner, Button, CustomerPortalLayout, DeadlineIndicator, EmptyState, ErrorState, FileUpload, Icon, Modal, Skeleton, StatusBadge, Tag, TextArea, useToast } from "./deps";

const STATUS: Record<"missing" | "submitted" | "replaced" | "accepted", StatusVocab> = {
  missing: { label: "未提出", tone: "fail" },
  submitted: { label: "提出済み（確認中）", tone: "info" },
  replaced: { label: "差替え済み（確認中）", tone: "special" },
  accepted: { label: "確認済み", tone: "pass" },
};

export function X11PortalMaterials({ project = PROJECT }: { project?: string }) {
  const state = useScreenState();
  const toast = useToast();
  const alliance = state === "業務提携型";
  const slug = alliance ? "member-app-api" : project;
  const [uploading, setUploading] = useState<string | null>(state === "提出の確認" ? "MAT-02" : null);
  const [submitted, setSubmitted] = useState<string[]>([]);
  const items = state === "空" ? [] : materialRequests.filter((m) => m.project === slug);
  const missing = items.filter((m) => m.status === "missing" && !submitted.includes(m.id));
  const target = items.find((m) => m.id === uploading);

  return (
    <CustomerPortalLayout project={slug} active="materials" userId={alliance ? "u-fujii" : "u-noguchi"}>
      <div className="stack" style={{ ["--gap" as string]: "4px" }}>
        <h1 style={{ fontSize: "var(--text-xl)", color: "var(--text-strong)" }}>資料の提出</h1>
        <p className="small muted">受注側から依頼された資料です。用途と期限を確認して提出してください。</p>
      </div>

      {state === "読み込み中" ? <Skeleton rows={4} /> : state === "エラー" ? <ErrorState /> : items.length === 0 ? (
        <div className="card"><EmptyState icon="checkCircle" title="依頼されている資料はありません" description="資料の依頼が届くと、メールでお知らせします。" /></div>
      ) : (
        <>
          {missing.length ? (
            <Banner tone="warn" title={`未提出の資料が ${missing.length} 件あります`}>
              {missing.map((m) => <div key={m.id} className="small">{m.title}（期限 {formatDate(m.due)}）— 影響する予定: {m.affects ?? "—"}</div>)}
            </Banner>
          ) : <Banner tone="pass">依頼された資料はすべて提出済みです。</Banner>}

          <div className="stack" style={{ ["--gap" as string]: "10px" }}>
            {items.map((m) => {
              const st = submitted.includes(m.id) ? "submitted" : m.status;
              return (
                <section key={m.id} className="card stack" style={{ ["--gap" as string]: "8px" }}>
                  <div className="row between">
                    <span className="row" style={{ ["--gap" as string]: "8px" }}><span className="mono tiny muted">{m.id}</span><span className="strong">{m.title}</span></span>
                    <StatusBadge vocab={STATUS[st]} size="sm" />
                  </div>
                  <div className="cp-request-meta">
                    <span><span className="tiny muted">用途</span><span className="small">{m.purpose}</span></span>
                    <span><span className="tiny muted">期限</span><span className="small">{formatDate(m.due)} {st === "missing" ? <DeadlineIndicator date={m.due} compact /> : null}</span></span>
                    <span><span className="tiny muted">提出先</span><span className="small">{m.to}</span></span>
                    {m.affects ? <span><span className="tiny muted">影響する予定</span><span className="small">{m.affects}</span></span> : null}
                  </div>
                  {m.file ? <span className="small row" style={{ ["--gap" as string]: "6px" }}><Icon name="file" size={14} />{m.file}<Tag square>v{m.version}</Tag></span> : null}
                  {m.note ? <p className="tiny muted">{m.note}</p> : null}
                  <div className="row">
                    <Button size="sm" variant={st === "missing" ? "primary" : "secondary"} icon="upload" onClick={() => setUploading(m.id)}>{st === "missing" ? "提出する" : "差し替える"}</Button>
                  </div>
                </section>
              );
            })}
          </div>
        </>
      )}

      <Modal open={Boolean(target)} onClose={() => setUploading(null)} title={target ? `${target.title} を${target.status === "missing" ? "提出" : "差し替え"}` : ""}
        footer={<><Button variant="ghost" onClick={() => setUploading(null)}>キャンセル</Button><Button variant="primary" onClick={() => { if (target) setSubmitted((s) => [...s, target.id]); setUploading(null); toast({ kind: "success", message: "受け付けました。控えをメールでお送りしました" }); }}>提出する</Button></>}>
        <div className="stack">
          {target && target.status !== "missing" ? <Banner tone="info" title="差替えの扱い">新しい版を受け付けても、これまでの納入物と記録は前の版のままです。どの納入から新しい版を使うかは、受注側が指定してお知らせします。</Banner> : null}
          <FileUpload label="ファイル" accept=".svg,.png,.pdf,.xlsx,.csv" fileName="sample.csv" />
          <TextArea label="補足（任意）" rows={2} placeholder="例: 個人名は匿名化済みです" />
          <p className="tiny muted">個人情報や秘密情報（パスワード、鍵など）を含むファイルは提出しないでください。</p>
        </div>
      </Modal>
    </CustomerPortalLayout>
  );
}
