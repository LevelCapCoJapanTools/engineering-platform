// 画面ID: R-04 要求の一括承認依頼
import { useState } from "react";
import { navigate, useRoute, useScreenState } from "../../lib/router";
import { paths } from "../../lib/paths";
import { ARTIFACT_STATUS } from "../../lib/vocab";
import { requirements, users } from "../../mocks/core";
import { Banner, Button, Combobox, cx, DatePicker, EmptyState, ExternalActor, Icon, IdLink, Modal, ProjectLayout, StatusBadge, TextArea, useToast } from "../../ui";
import { formatDate } from "../../lib/format";
import { RequirementListBody } from "./R01_RequirementList";
import { org, project, reqPath } from "./common";

export function ApprovalRequest() {
  const state = useScreenState();
  const toast = useToast();
  const { query } = useRoute();
  const ids = state === "allValid" ? ["REQ-0001", "REQ-0004", "REQ-0009"] : query.get("ids")?.split(",").filter(Boolean) ?? ["REQ-0005", "REQ-0007", "REQ-0012"];
  const targets = requirements.filter((r) => ids.includes(r.id));
  const [excluded, setExcluded] = useState<string[]>([]);
  const [approvers, setApprovers] = useState<string[]>(["u-nakamura", "u-sato"]);
  const [due, setDue] = useState("2026-12-04");
  const [message, setMessage] = useState("CR-0003・CR-0004 に関連する要求です。受入基準をご確認のうえ承認をお願いします。");
  const [sent, setSent] = useState(state === "sent");
  const close = () => navigate(paths.requirements(org, project));
  const checks = (r: (typeof targets)[number]) => ({ ac: r.acceptance_criteria.length > 0, ai: r.ai_open_findings === 0 });
  const invalid = targets.filter((r) => { const c = checks(r); return !c.ac || !c.ai; });
  const included = targets.filter((r) => !excluded.includes(r.id));
  const blocking = included.filter((r) => invalid.includes(r));
  const approverError = approvers.length === 0 ? "承認者を1人以上選択してください" : undefined;
  return (
    <ProjectLayout active="requirements" trail={[{ label: "要求", to: paths.requirements(org, project) }, { label: "承認を依頼" }]}>
      <RequirementListBody state="default" selected={ids} />
      <Modal
        open
        onClose={close}
        size="lg"
        title={sent ? "承認者に期限付き承認リンクを送りました" : "要求の承認を承認者に依頼"}
        description={sent ? undefined : "選択した要求の承認を、実際の承認者に「期限付き承認リンク」で依頼します。承認者はアカウントなしで、本人確認のうえリンク先で承認・差戻しを行います。依頼した人が代わりに承認することはできません。"}
        footer={
          sent ? (
            <Button variant="primary" onClick={close}>要求一覧へ戻る</Button>
          ) : (
            <>
              <span className="small muted" style={{ marginRight: "auto" }}>{included.length}件を依頼{excluded.length ? `（${excluded.length}件を除外）` : ""}</span>
              <Button variant="ghost" onClick={close}>キャンセル</Button>
              <Button
                variant="primary"
                icon="arrowRight"
                disabled={included.length === 0 || blocking.length > 0 || Boolean(approverError)}
                disabledReason={blocking.length ? "条件を満たさない要求を除外してください" : approverError ?? "依頼する要求がありません"}
                onClick={() => { setSent(true); toast({ kind: "success", message: `${included.length}件の承認を依頼しました` }); }}
              >
                依頼する
              </Button>
            </>
          )
        }
      >
        {sent ? (
          <div className="stack">
            <EmptyState icon="checkCircle" title={`${included.length || 3}件の要求の承認を依頼しました`} description="承認者ごとに1回だけ使えるリンクを送りました。期限の前日に自動でリマインドします。結果は各要求の「承認と状態遷移」に記録されます。" />
            <div className="table-wrap">
              <table className="table compact">
                <thead><tr><th>承認者</th><th>送信先</th><th>リンク</th><th>有効期限</th></tr></thead>
                <tbody>
                  {(approvers.length ? approvers : ["u-nakamura"]).map((uid, i) => {
                    const u = users.find((x) => x.id === uid);
                    const token = `req-${uid.replace("u-", "")}-${7301 + i}`;
                    return (
                      <tr key={uid}>
                        <td><ExternalActor userId={uid} /></td>
                        <td className="small">{u?.email || "—"}（メールの確認コードで本人確認）</td>
                        <td><a className="id-link" href={`#${paths.approvalLink(token)}`}>/approve/{token}</a></td>
                        <td className="small">{formatDate(due)} 23:59 まで・1回のみ</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="stack">
            {blocking.length ? (
              <Banner tone="warn" title={`条件を満たさない要求が ${blocking.length}件含まれています`}>
                受入基準がない、または未確認の AI 所見がある要求は承認を依頼できません。該当の行を除外するか、要求を修正してください。
              </Banner>
            ) : null}
            <div className="card flush">
              <div className="table-wrap">
                <table className="table compact">
                  <thead>
                    <tr>
                      <th>要求</th>
                      <th>状態</th>
                      <th>受入基準</th>
                      <th>未確認のAI所見</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {targets.map((r) => {
                      const c = checks(r);
                      const ex = excluded.includes(r.id);
                      return (
                        <tr key={r.id} className={cx(!ex && (!c.ac || !c.ai) && "approval-row-warn")} style={ex ? { opacity: 0.5 } : undefined}>
                          <td>
                            <div className="stack" style={{ ["--gap" as string]: "2px" }}>
                              <IdLink id={r.id} to={reqPath(r.id)} />
                              <span className="small">{r.title}</span>
                            </div>
                          </td>
                          <td><StatusBadge vocab={ARTIFACT_STATUS[r.status]} size="sm" /></td>
                          <td><span className={cx("presence", c.ac ? "ok" : "ng")}><Icon name={c.ac ? "checkCircle" : "xCircle"} size={14} />{c.ac ? `${r.acceptance_criteria.length}件` : "なし"}</span></td>
                          <td><span className={cx("presence", c.ai ? "ok" : "ng")}><Icon name={c.ai ? "checkCircle" : "alert"} size={14} />{c.ai ? "なし" : `${r.ai_open_findings}件`}</span></td>
                          <td style={{ textAlign: "right" }}>
                            {ex ? (
                              <Button size="sm" variant="ghost" onClick={() => setExcluded(excluded.filter((x) => x !== r.id))}>戻す</Button>
                            ) : (
                              <Button size="sm" variant={!c.ac || !c.ai ? "secondary" : "ghost"} icon="minus" onClick={() => setExcluded([...excluded, r.id])}>除外</Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="grid cols-2">
              <Combobox
                label="承認者"
                required
                multiple
                value={approvers}
                onChange={setApprovers}
                error={approverError}
                help="要求の作成者（高橋 健）は選べません。顧客と PM の承認が必要です"
                options={users.filter((u) => u.roles.includes("顧客") || u.roles.includes("PM") || u.id === "u-takahashi").map((u) => ({ value: u.id, label: u.name, hint: u.kind === "external" ? `${u.company}（顧客）` : `${u.roles.join("・")}・外部IDで記録`, disabled: u.id === "u-takahashi", disabledReason: "作成者は承認者にできません" }))}
              />
              <DatePicker label="リンクの有効期限" required value={due} min="2026-11-28" onChange={setDue} help="期限を過ぎたリンクは使えなくなります。前日にリマインドします" />
            </div>
            <TextArea label="依頼メッセージ" value={message} onChange={setMessage} rows={3} maxLength={500} />
          </div>
        )}
      </Modal>
    </ProjectLayout>
  );
}
