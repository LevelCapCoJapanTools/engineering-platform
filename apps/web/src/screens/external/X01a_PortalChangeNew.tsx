// 画面ID: X-01（変更要求の起票） 顧客ポータルのホームから開く変更要求フォーム
import { useState } from "react";
import { useScreenState } from "../../lib/router";
import { PROJECT, paths } from "../../lib/paths";
import { Banner, Button, DatePicker, EmptyState, FileUpload, Link, PortalLayout, Select, TextArea, TextField } from "./deps";

export function X01aPortalChangeNew({ project = PROJECT }: { project?: string }) {
  const state = useScreenState();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitted, setSubmitted] = useState(state === "送信完了");
  const [tried, setTried] = useState(state === "入力エラー");
  const titleErr = tried && !title.trim() ? "件名を入力してください" : undefined;
  const bodyErr = tried && !body.trim() ? "変更したい内容を入力してください" : undefined;

  return (
    <PortalLayout project={project}>
      <Link to={paths.portal(project)} className="small">← ポータルのホームへ戻る</Link>
      {submitted ? (
        <div className="card">
          <EmptyState icon="checkCircle" title="変更要求を受け付けました（CR-0007）" description="開発チームが影響を分析し、見積りとスケジュールへの影響を添えて承認を依頼します。進み具合はポータルのホームで確認できます。" action={<Button variant="primary" to={paths.portal(project)}>ホームへ戻る</Button>} />
        </div>
      ) : (
        <>
          <div>
            <h1 style={{ fontSize: "var(--text-xl)", color: "var(--text-strong)" }}>変更要求を起票</h1>
            <p className="small muted">起票しただけでは作業は始まりません。開発チームの影響分析の後、あなたの承認で反映が決まります。</p>
          </div>
          {state === "送信失敗" ? <Banner tone="fail" title="送信できませんでした">通信が切れた可能性があります。入力内容は残っています。もう一度送信してください。</Banner> : null}
          <form className="card stack" onSubmit={(e) => { e.preventDefault(); setTried(true); if (title.trim() && body.trim()) setSubmitted(true); }}>
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
              <Button variant="primary" type="submit" icon="arrowRight">起票する</Button>
            </div>
          </form>
        </>
      )}
    </PortalLayout>
  );
}
