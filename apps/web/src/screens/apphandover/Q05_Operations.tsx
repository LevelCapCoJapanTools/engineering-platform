// 画面ID: Q-05 運用権限の引き渡し
// ストア、クラウド、ドメイン、障害通知、証明書・鍵、請求と更新の責任者を資産別に割り当て、
// 顧客が自社の権限で次の版のアップロードと試験通知の受信を確認したら、JV の一時権限を解除する（資料 60）。
// 秘密値は引渡明細に載せない。未完了の項目には担当と期限を残す。
import { useScreenState } from "../../lib/router";
import { formatDate } from "../../lib/format";
import {
  Banner,
  Button,
  ChecklistPanel,
  ErrorState,
  ExternalActor,
  PageHeader,
  ProjectLayout,
  Section,
  Skeleton,
  Tag,
  useToast,
} from "../../ui";
import type { ChecklistItem } from "../../ui";
import { userById } from "../../mocks/core";
import { operationAssets, temporaryGrants } from "../../mocks/apphandover";
import type { OperationAsset } from "../../mocks/apphandover";
import { HandoverSteps, PR, orgOf } from "./parts";

export const Q05_STATES = ["引き渡し中（既定）", "顧客の確認済み", "一時権限を解除済み", "読み込み中", "エラー"];

const KIND_LABEL: Record<OperationAsset["kind"], string> = {
  store: "ストア",
  cloud: "クラウド",
  domain: "ドメイン",
  alerting: "障害通知",
  credential: "証明書・鍵",
  billing: "請求と更新",
};
const STATUS = { done: { label: "完了", tone: "pass" as const }, inProgress: { label: "対応中", tone: "info" as const }, notStarted: { label: "未着手", tone: "neutral" as const } };

function Holder({ value }: { value: string }) {
  return userById(value) ? <ExternalActor userId={value} /> : <span className="small">{value}</span>;
}

export function Q05Operations({ params }: { params: Record<string, string> }) {
  const state = useScreenState();
  const org = orgOf(params);
  const toast = useToast();
  const verified = state === "顧客の確認済み" || state === "一時権限を解除済み";
  const released = state === "一時権限を解除済み";
  const assets: OperationAsset[] = operationAssets.map((a) => (verified ? { ...a, status: a.kind === "billing" && !released ? "inProgress" : "done" } : a));
  const remaining = assets.filter((a) => a.status !== "done");
  const checks: ChecklistItem[] = [
    { id: "V-1", title: "顧客が自社の権限で次の版をアップロードできた", state: verified ? "ok" : "pending", detail: verified ? "藤井 晃が版 1.0.1（ビルド 14）をアップロード（2027/02/03）" : "顧客の担当者が自社の権限で行います", actor: "human" },
    { id: "V-2", title: "顧客の当番が試験通知を受信した", state: verified ? "ok" : "pending", detail: verified ? "架空リテール 運用窓口が受信を確認（2027/02/03）" : "通知先を切り替えたあとに試験通知を送ります", actor: "human" },
    { id: "V-3", title: "JV が作成した鍵・証明書を失効させた", state: verified ? "ok" : "pending", detail: "顧客のチームで再発行したあとに失効させます", actor: "human" },
  ];
  const canRelease = verified && !released;

  return (
    <ProjectLayout org={org} project={PR} active="appHandover" trail={[{ label: "アプリの引き渡し" }, { label: "運用権限の引き渡し" }]}>
      <PageHeader
        title="運用権限の引き渡し"
        description="資産ごとに、引き渡し後の責任者と必要な作業を決めます。顧客が自社の権限で運用できることを確認してから、JV の一時権限を外します。"
        status={released ? <Tag tone="pass" square icon="check">一時権限を解除済み</Tag> : verified ? <Tag tone="info" square>顧客の確認済み</Tag> : <Tag tone="warn" square>引き渡し中</Tag>}
      />
      <HandoverSteps org={org} active="Q-05" />
      {state === "読み込み中" ? (
        <Skeleton />
      ) : state === "エラー" ? (
        <ErrorState />
      ) : (
        <>
          <Section title="資産ごとの責任者" sub="秘密値（鍵、パスワード、トークン）は扱わず、誰が持つかと確認の結果だけを記録します" flush>
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>資産</th><th>現在</th><th>引き渡し先</th><th>必要な作業</th><th>期限</th><th>状態</th></tr></thead>
                <tbody>
                  {assets.map((a) => (
                    <tr key={a.id}>
                      <td><div className="strong small">{a.asset}</div><Tag square>{KIND_LABEL[a.kind]}</Tag></td>
                      <td className="small">{a.from}</td>
                      <td><Holder value={a.to} /></td>
                      <td className="small">{a.action}{a.verification ? <div className="tiny muted">確認: {a.verification}</div> : null}</td>
                      <td className="small">{formatDate(a.due)}</td>
                      <td><Tag tone={STATUS[a.status].tone} square>{STATUS[a.status].label}</Tag></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="顧客による確認">
            <ChecklistPanel items={checks} title="一時権限を外す前の確認" />
          </Section>

          <Section title="JV の一時権限" sub="確認がすべて済むまで解除しません。解除の記録を残します" flush>
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>利用者</th><th>対象</th><th>期限</th><th>状態</th></tr></thead>
                <tbody>
                  {temporaryGrants.map((g) => (
                    <tr key={g.id}>
                      <td><ExternalActor userId={g.who} /></td>
                      <td className="small">{g.where}</td>
                      <td className="small">{formatDate(g.until)}</td>
                      <td>{released ? <Tag tone="pass" square>解除済み</Tag> : <Tag tone="warn" square>有効</Tag>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          {remaining.length ? (
            <Banner tone="warn" title={`未完了の項目が ${remaining.length} 件あります`}>
              {remaining.map((r) => `${r.asset}（期限 ${formatDate(r.due)}）`).join("、")}。担当と期限は残したまま引き渡しを進めます。
            </Banner>
          ) : null}

          <div className="row end" style={{ ["--gap" as string]: "8px" }}>
            <Button
              icon="download"
              onClick={() => toast({ kind: "success", message: "引渡明細の控えを交付しました（秘密値は含みません）" })}
            >
              引渡明細の控えを交付
            </Button>
            <Button
              variant="primary"
              icon="lock"
              disabled={!canRelease}
              disabledReason={released ? "一時権限は解除済みです" : "顧客による確認がすべて済んでから解除できます"}
              onClick={() => toast({ kind: "success", message: "JV の一時権限を解除しました。解除の記録を残しました" })}
            >
              JV の一時権限を解除
            </Button>
          </div>
        </>
      )}
    </ProjectLayout>
  );
}
