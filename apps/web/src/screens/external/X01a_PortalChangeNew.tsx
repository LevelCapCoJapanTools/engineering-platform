// 画面ID: X-01a 顧客ポータル: 変更の申し出
// 顧客が変更を申し出て、受注側から提示された「貴社との条件」（費用・期限・承認者）を確認する。
// 受注側の社内の条件（作業の配分、受注側の費用）は表示しない。
import { useState } from "react";
import { useScreenState } from "../../lib/router";
import { PROJECT, paths } from "../../lib/paths";
import { yen } from "../../lib/format";
import { Banner, Button, CustomerPortalLayout, DatePicker, EmptyState, FileUpload, KeyValueList, Link, Select, Tag, TextArea, TextField } from "./deps";
import { RouteSteps } from "./portalParts";

export function X01aPortalChangeNew({ project = PROJECT }: { project?: string }) {
  const state = useScreenState();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(state === "送信完了" || state === "条件の提示あり");
  const [tried, setTried] = useState(state === "入力エラー");
  const titleErr = tried && !title.trim() ? "件名を入力してください" : undefined;
  const bodyErr = tried && !body.trim() ? "変更したい内容を入力してください" : undefined;

  const submit = () => {
    setTried(true);
    if (!title.trim() || !body.trim() || sending) return;
    setSending(true);
    window.setTimeout(() => { setSending(false); setSubmitted(true); }, 600);
  };

  return (
    <CustomerPortalLayout project={project} active="requests">
      <Link to={paths.portal(project)} className="small">← 案件ホームへ戻る</Link>
      {state === "条件の提示あり" ? (
        <>
          <div className="stack" style={{ ["--gap" as string]: "4px" }}>
            <span className="row" style={{ ["--gap" as string]: "8px" }}><Tag square>CR-0007</Tag><Tag tone="warn" square>貴社の回答待ち</Tag></span>
            <h1 style={{ fontSize: "var(--text-xl)", color: "var(--text-strong)" }}>発注書に備考欄を追加したい</h1>
          </div>
          <Banner tone="info" title="受注側から、貴社との条件が提示されました">
            この条件に貴社が同意しても、受注側の社内の手配が整うまでは作業計画に反映されません。両方の合意がそろった時点で、予定と納入物が更新されます。
          </Banner>
          <section className="card stack" style={{ ["--gap" as string]: "12px" }}>
            <h2 className="section-title">貴社との条件（v1）</h2>
            <KeyValueList
              items={[
                { label: "追加費用（税抜）", value: <strong>{yen(350_000)}</strong> },
                { label: "反映する版", value: "v1.5.0（2027-01-22 納入予定）" },
                { label: "回答期限", value: "2026-12-08" },
                { label: "対象外", value: "既存の発注書データへの備考の一括登録" },
              ]}
            />
            <div className="stack" style={{ ["--gap" as string]: "6px" }}>
              <span className="small strong">貴社の承認の経路（100 万円まで）</span>
              <RouteSteps steps={[{ role: "担当レビュー", name: "野口 舞", status: "waiting" }, { role: "発注側プロジェクト責任者", name: "中村 拓也", status: "pending" }]} />
            </div>
            <div className="row"><Button variant="primary" to={paths.portalRequests(project)}>申請・承認で回答する</Button></div>
          </section>
        </>
      ) : submitted ? (
        <div className="card">
          <EmptyState icon="checkCircle" title="変更の申し出を受け付けました（CR-0007）" description="受付番号の控えをメールでお送りしました。受注側が影響を確認し、費用・期限・貴社の承認者を添えて条件を提示します。申し出ただけでは作業は始まりません。" action={<Button variant="primary" to={paths.portal(project)}>案件ホームへ戻る</Button>} />
        </div>
      ) : (
        <>
          <div>
            <h1 style={{ fontSize: "var(--text-xl)", color: "var(--text-strong)" }}>変更を申し出る</h1>
            <p className="small muted">申し出ただけでは作業は始まりません。受注側が影響を確認し、貴社との条件（費用・期限・承認者）を提示します。貴社の承認で反映が決まります。</p>
          </div>
          {state === "送信失敗" ? <Banner tone="fail" title="送信できませんでした">通信が切れた可能性があります。入力内容は残っています。もう一度送信してください。二重に受け付けられることはありません。</Banner> : null}
          <form className="card stack" onSubmit={(e) => { e.preventDefault(); submit(); }}>
            <TextField label="件名" required value={title} onChange={setTitle} error={titleErr} maxLength={80} placeholder="例: 発注書に備考欄を追加したい" />
            <TextArea label="変更したい内容" required value={body} onChange={setBody} error={bodyErr} rows={5} placeholder="現在の動きと、どう変えたいかを書いてください" />
            <TextArea label="理由・背景" rows={3} placeholder="業務上の理由や、困っていることがあれば" />
            <div className="grid cols-2">
              <Select label="緊急度" defaultValue="normal" options={[{ value: "low", label: "低（次の大きな改修で可）" }, { value: "normal", label: "中（次回リリースまでに）" }, { value: "high", label: "高（業務に支障がある）" }]} />
              <DatePicker label="希望時期" min="2026-11-28" />
            </div>
            <FileUpload label="添付ファイル（任意）" accept=".pdf,.png,.xlsx" fileName="画面イメージ.png" />
            <div className="sticky-actions">
              <Button variant="ghost" to={paths.portal(project)}>キャンセル</Button>
              <Button variant="primary" type="submit" icon="arrowRight" loading={sending} disabled={sending} disabledReason="送信中です">申し出る</Button>
            </div>
          </form>
        </>
      )}
    </CustomerPortalLayout>
  );
}
