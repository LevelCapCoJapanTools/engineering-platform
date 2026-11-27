// 画面ID: C-03 組織での調整（テーラリング）
import { useState } from "react";
import { useScreenState } from "../../lib/router";
import { ORG, paths } from "../../lib/paths";
import { APPROVAL_STATUS } from "../../lib/vocab";
import { controlById, userById } from "../../mocks/core";
import { packBySlug, tailorings } from "../../mocks/policy";
import type { Tailoring } from "../../mocks/policy";
import {
  AppLayout,
  ApprovalPanel,
  Banner,
  Button,
  ControlLayerTag,
  crumbs,
  Drawer,
  EmptyState,
  membersWithRole,
  PageHeader,
  Select,
  StatusBadge,
  TextArea,
  TextField,
  UserChip,
  useToast,
} from "../../ui";

const KIND_LABEL: Record<Tailoring["kind"], string> = { none: "調整なし", notApplicable: "適用しない", alternative: "別の証跡で代替", level: "強制レベルの変更" };

export function TailoringScreen({ org = ORG, pack: slug }: { org?: string; pack: string }) {
  const state = useScreenState();
  const toast = useToast();
  const pack = packBySlug(slug);
  const [rows, setRows] = useState(tailorings);
  const [editing, setEditing] = useState<Tailoring | null>(null);
  const [kind, setKind] = useState<Tailoring["kind"]>("none");
  const [detail, setDetail] = useState("");
  const [reason, setReason] = useState("");
  const [reasonErr, setReasonErr] = useState("");
  const [reviewing, setReviewing] = useState<Tailoring | null>(state === "approver" || state === "sod" ? tailorings[1] : null);
  const list = state === "empty" ? [] : rows;
  const pending = rows.filter((r) => r.status === "pending").length;

  const openEdit = (t: Tailoring) => {
    setEditing(t);
    setKind(t.kind === "none" ? "notApplicable" : t.kind);
    setDetail(t.detail);
    setReason(t.reason);
    setReasonErr("");
  };
  const submit = () => {
    if (!reason.trim()) {
      setReasonErr("理由を入力してください");
      return;
    }
    setRows((xs) => xs.map((x) => (x.control_id === editing?.control_id ? { ...x, kind, detail, reason, status: "pending", requester: "u-yamamoto", approver: "u-sato" } : x)));
    toast({ kind: "success", message: `${editing?.control_id} の調整を申請しました` });
    setEditing(null);
  };

  return (
    <AppLayout org={org} active="policies" breadcrumb={crumbs(org, undefined, { label: "ポリシー", to: paths.policies(org) }, { label: `${pack.name} ${pack.version}`, to: paths.policy(org, pack.slug) }, { label: "組織での調整" })}>
      <PageHeader
        title="組織での調整（テーラリング）"
        description="統制項目ごとに、組織の実情に合わせた調整を申請します。申請者とは別のポリシー管理者または組織管理者が承認します。"
        meta={pending ? <StatusBadge vocab={{ label: `承認待ち ${pending}件`, tone: "warn" }} size="sm" /> : undefined}
      />
      <Banner tone="info">調整は規格の要求そのものを変えるものではありません。「適用しない」は、理由とともに評価者に提示されます。</Banner>
      {list.length === 0 ? (
        <div className="card"><EmptyState icon="edit" title="調整はまだありません" description="Control Pack の既定どおりに適用されています。" /></div>
      ) : (
        <div className="card flush">
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>統制項目</th><th>層</th><th>調整の種類</th><th>内容・理由</th><th>申請者</th><th>承認状態</th><th /></tr></thead>
              <tbody>
                {list.map((t) => {
                  const c = controlById(t.control_id);
                  return (
                    <tr key={t.control_id}>
                      <td><div className="stack" style={{ ["--gap" as string]: "2px" }}><span className="id-link">{c.id}</span><span className="small muted truncate" style={{ maxWidth: 240 }}>{c.description}</span></div></td>
                      <td><ControlLayerTag layer={c.layer} /></td>
                      <td>{t.kind === "none" ? <span className="muted small">調整なし</span> : <span className="strong small">{KIND_LABEL[t.kind]}</span>}</td>
                      <td className="small">{t.detail ? <div>{t.detail}</div> : null}{t.reason ? <div className="muted">理由: {t.reason}</div> : <span className="muted">—</span>}</td>
                      <td>{t.requester ? <UserChip user={userById(t.requester)} showRole={false} /> : <span className="muted small">—</span>}</td>
                      <td>{t.kind === "none" ? <span className="muted small">—</span> : <StatusBadge vocab={APPROVAL_STATUS[t.status]} size="sm" />}</td>
                      <td>
                        <div className="row nowrap">
                          {t.status === "pending" ? <Button size="sm" onClick={() => setReviewing(t)}>判断する</Button> : null}
                          <Button size="sm" variant="ghost" icon="edit" onClick={() => openEdit(t)}>{t.kind === "none" ? "調整を申請" : "変更"}</Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Drawer open={editing !== null} onClose={() => setEditing(null)} title={`${editing?.control_id ?? ""} の調整を申請`} subtitle={editing ? controlById(editing.control_id).description : undefined} footer={<><Button variant="ghost" onClick={() => setEditing(null)}>キャンセル</Button><Button variant="primary" onClick={submit}>申請する</Button></>}>
        <div className="stack">
          <Select label="調整の種類" required value={kind} onChange={(v) => setKind(v as Tailoring["kind"])} options={[{ value: "notApplicable", label: "適用しない" }, { value: "alternative", label: "別の証跡で代替" }, { value: "level", label: "強制レベルの変更" }]} />
          {kind === "alternative" ? <TextField label="代替する証跡" required value={detail} onChange={setDetail} placeholder="例: 週次定例の議事録で代替" /> : null}
          {kind === "level" ? <Select label="強制レベル" value={detail || "警告のみ"} onChange={setDetail} options={[{ value: "強制レベルを「警告のみ」に変更", label: "警告のみ" }, { value: "強制レベルを「ソフト」に変更", label: "ソフト" }, { value: "強制レベルを「ハード」に変更", label: "ハード" }]} /> : null}
          <TextArea label="理由" required value={reason} onChange={(v) => { setReason(v); setReasonErr(""); }} error={reasonErr || undefined} help="評価者に提示されます。具体的に記載してください" />
          <div className="small muted">承認者は申請者以外のポリシー管理者または組織管理者です。</div>
        </div>
      </Drawer>

      <Drawer open={reviewing !== null} onClose={() => setReviewing(null)} title={`${reviewing?.control_id ?? ""} の調整を判断`} subtitle={reviewing ? KIND_LABEL[reviewing.kind] : undefined}>
        {reviewing ? (
          <div className="stack">
            <div className="card tight stack" style={{ ["--gap" as string]: "6px" }}>
              <span className="small"><span className="muted">内容:</span> {reviewing.detail}</span>
              <span className="small"><span className="muted">理由:</span> {reviewing.reason}</span>
              <span className="row small" style={{ ["--gap" as string]: "6px" }}><span className="muted">申請者</span><UserChip user={userById(reviewing.requester)} /></span>
            </div>
            <ApprovalPanel
              approvers={[{ role: "組織管理者", user_id: reviewing.approver, status: "pending" }]}
              canDecide={state !== "sod"}
              blockedReason={state === "sod" ? "あなたはこの調整の申請者のため承認できません" : undefined}
              eligible={state === "sod" ? membersWithRole("PM") : undefined}
              onDecide={(d) => {
                setRows((xs) => xs.map((x) => (x.control_id === reviewing.control_id ? { ...x, status: d } : x)));
                toast({ kind: "success", message: d === "approved" ? "調整を承認しました" : "調整を差し戻しました" });
                setReviewing(null);
              }}
            />
          </div>
        ) : null}
      </Drawer>
    </AppLayout>
  );
}
