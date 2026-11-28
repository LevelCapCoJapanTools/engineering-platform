// 画面ID: X-10 顧客ポータル: 社内の権限者と稟議
// 発注企業の管理者が、自社の閲覧者・承認者・検収者・署名権限者を指名し、対象案件・決裁上限・代理期間を登録する。
// 閲覧の権限だけでは承認・検収・署名はできない。担当交代では前任の権限を終了し、未決の申請を権限のある後任へ回す。
import { useState } from "react";
import { useScreenState } from "../../lib/router";
import { PROJECT } from "../../lib/paths";
import { formatDate, yen } from "../../lib/format";
import { customerAuthorities, customerRequests, customerRoutes } from "../../mocks/external";
import { Banner, Button, Checkbox, CustomerPortalLayout, DatePicker, EmptyState, ErrorState, Icon, Modal, Select, Skeleton, StatusBadge, Tag, TextField, useToast } from "./deps";

const ADMIN_ID = "u-sakai";

function Flag({ on, label }: { on: boolean; label: string }) {
  return on ? <Tag tone="pass" square icon="check">{label}</Tag> : <span className="tiny muted">—</span>;
}

export function X10PortalRouting({ project = PROJECT }: { project?: string }) {
  const state = useScreenState();
  const toast = useToast();
  const isAdmin = state !== "管理者以外";
  const viewerId = isAdmin ? ADMIN_ID : "u-noguchi";
  const [adding, setAdding] = useState(false);
  const [handover, setHandover] = useState(state === "担当交代");
  const [sign, setSign] = useState(false);
  const [successor, setSuccessor] = useState("u-nakamura");
  const people = customerAuthorities;
  const pendingOfKomatsu = customerRequests.filter((r) => r.project === project && r.route.some((s) => s.user_id === "u-komatsu" && s.status === "waiting"));
  const successorLimit = people.find((p) => p.user_id === successor)?.limit ?? 0;
  const cannotTake = pendingOfKomatsu.filter((r) => (r.amount ?? 0) > successorLimit);

  return (
    <CustomerPortalLayout project={project} active="routing" userId={viewerId}>
      <div className="row between">
        <div className="stack" style={{ ["--gap" as string]: "4px" }}>
          <h1 style={{ fontSize: "var(--text-xl)", color: "var(--text-strong)" }}>社内の権限者と稟議</h1>
          <p className="small muted">貴社で、誰が閲覧・承認・検収・署名できるかを登録します。受注側の公開設定と組み合わせて、各人に見える範囲が決まります。</p>
        </div>
        {isAdmin ? <Button variant="primary" icon="plus" onClick={() => setAdding(true)}>権限者を追加</Button> : null}
      </div>

      {state === "読み込み中" ? <Skeleton rows={5} /> : state === "エラー" ? <ErrorState /> : (
        <>
          {!isAdmin ? <Banner tone="info" title="閲覧のみ">権限者と経路の変更は、貴社の管理者（酒井 隆 さん）だけが行えます。</Banner> : null}

          <section className="card flush" aria-labelledby="cp-auth">
            <div className="card-header"><h2 id="cp-auth" className="section-title">権限者（この案件）</h2></div>
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>氏名</th><th>閲覧</th><th>承認</th><th>検収</th><th>署名</th><th>決裁上限</th><th>代理</th><th>状態</th>{isAdmin ? <th /> : null}</tr></thead>
                <tbody>
                  {people.map((p) => (
                    <tr key={p.user_id} className={p.status === "ended" ? "muted" : undefined}>
                      <td className="strong small">{p.name}</td>
                      <td><Flag on={p.view} label="閲覧" /></td>
                      <td><Flag on={p.approve} label="承認" /></td>
                      <td><Flag on={p.inspect} label="検収" /></td>
                      <td><Flag on={p.sign} label="署名" /></td>
                      <td className="small">{p.limit ? `${yen(p.limit)} まで` : "—"}</td>
                      <td className="tiny">{p.deputy ? `${p.deputy.name}（${formatDate(p.deputy.from)}〜${formatDate(p.deputy.to)}）` : "—"}</td>
                      <td>{p.status === "active" ? <StatusBadge vocab={{ label: "有効", tone: "pass" }} size="sm" /> : <StatusBadge vocab={{ label: "終了", tone: "neutral" }} size="sm" />}</td>
                      {isAdmin ? <td>{p.user_id === "u-komatsu" && p.status === "active" ? <Button size="sm" variant="ghost" onClick={() => setHandover(true)}>担当交代</Button> : null}</td> : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="tiny muted" style={{ padding: "10px 16px" }}>閲覧の権限だけでは、申請の承認・検収・契約の署名はできません。署名の権限は、貴社の規程や委任状に基づいて個別に登録します。終了した権限者の操作履歴は残ります。</p>
          </section>

          <section className="card flush" aria-labelledby="cp-routes">
            <div className="card-header"><h2 id="cp-routes" className="section-title">金額・内容別の承認経路</h2>{isAdmin ? <Button size="sm" icon="edit">経路を編集</Button> : null}</div>
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>種類</th><th>条件</th><th>経路</th></tr></thead>
                <tbody>
                  {customerRoutes.map((rt) => (
                    <tr key={rt.id}>
                      <td className="small strong">{rt.kind}</td>
                      <td className="small">{rt.condition}</td>
                      <td className="small">{rt.steps.map((s, i) => <span key={s}>{i ? <Icon name="chevronRight" size={12} className="muted" /> : null}{s}</span>)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="tiny muted" style={{ padding: "10px 16px" }}>申請の金額が改訂で上限を超えた場合は、経路を自動で再計算し、それまでの確認結果を新しい版に引き継ぎません。役員決裁など本サービスの外で行う稟議は、結果を登録して記録します。</p>
          </section>
        </>
      )}

      <Modal open={adding} onClose={() => setAdding(false)} title="権限者を追加" size="md"
        footer={<><Button variant="ghost" onClick={() => setAdding(false)}>キャンセル</Button><Button variant="primary" onClick={() => { setAdding(false); toast({ kind: "success", message: "招待を送りました。本人がメールのコードで確認すると有効になります" }); }}>招待を送る</Button></>}>
        <div className="stack">
          <TextField label="氏名" required placeholder="例: 山田 花子" />
          <TextField label="メールアドレス" required placeholder="name@kakuu-shoji.example" help="貴社のドメインのアドレスだけ登録できます" />
          <div className="stack" style={{ ["--gap" as string]: "8px" }}>
            <span className="field-label">権限</span>
            <Checkbox label="閲覧" defaultChecked />
            <Checkbox label="承認（決裁上限の範囲）" />
            <Checkbox label="検収（受入試験と受入）" />
            <Checkbox label="署名（電子契約サービスで締結）" checked={sign} onChange={setSign} description="署名の権限には、根拠となる規程・委任状の記録が必要です" />
            {sign ? <TextField label="署名権限の根拠" required placeholder="例: 契約締結規程 第5条（法務部長）" /> : null}
          </div>
          <div className="grid cols-2">
            <TextField label="決裁上限（円・税抜）" placeholder="1000000" />
            <Select label="対象案件" defaultValue={project} options={[{ value: project, label: "受発注システム刷新" }]} />
          </div>
          <div className="grid cols-2">
            <DatePicker label="代理の開始日（任意）" />
            <DatePicker label="代理の終了日（任意）" />
          </div>
        </div>
      </Modal>

      <Modal open={handover} onClose={() => setHandover(false)} title="担当交代: 小松 恵 さんの権限を終了" size="md"
        footer={<><Button variant="ghost" onClick={() => setHandover(false)}>キャンセル</Button><Button variant="primary" disabled={cannotTake.length > 0} disabledReason="後任の決裁上限を超える申請があります" onClick={() => { setHandover(false); toast({ kind: "success", message: "前任の権限を終了し、未決の申請を後任へ回しました" }); }}>権限を終了して引き継ぐ</Button></>}>
        <div className="stack">
          <p className="small">終了すると、小松 恵 さんはこの案件の申請を開けなくなります。送信済みの承認の記録は残ります。</p>
          <Select label="後任" value={successor} onChange={setSuccessor} options={people.filter((p) => p.status === "active" && p.approve && p.user_id !== "u-komatsu").map((p) => ({ value: p.user_id, label: `${p.name}（上限 ${p.limit ? yen(p.limit) : "なし"}）` }))} />
          <div className="stack" style={{ ["--gap" as string]: "6px" }}>
            <span className="small strong">後任へ回す未決の申請</span>
            {pendingOfKomatsu.length ? pendingOfKomatsu.map((r) => (
              <div key={r.id} className="row between">
                <span className="small">{r.id} {r.title}</span>
                {(r.amount ?? 0) > successorLimit ? <Tag tone="fail" square>後任の上限を超えます</Tag> : <Tag tone="pass" square>回せます</Tag>}
              </div>
            )) : <EmptyState icon="checkCircle" title="未決の申請はありません" />}
          </div>
          {cannotTake.length ? <Banner tone="warn">後任の決裁上限（{yen(successorLimit)}）を超える申請があります。上限を見直すか、上限の範囲に入る別の後任を選んでください。</Banner> : null}
        </div>
      </Modal>
    </CustomerPortalLayout>
  );
}
