// 画面ID: Q-02 Apple Developer 組織登録の支援
// 組織登録に必要な情報と、顧客本人が Apple 上で行う手続きの担当・期限・再開先を案内する（資料 57）。
// 認証コード・パスワード・本人確認書類は受け取らない。加入の確認は根拠と一緒に記録する。
import { useScreenState } from "../../lib/router";
import { paths } from "../../lib/paths";
import { formatDate, formatDateTime } from "../../lib/format";
import {
  Banner,
  Button,
  ErrorState,
  ExternalActor,
  KeyValueList,
  PageHeader,
  ProjectLayout,
  Section,
  Skeleton,
  Tag,
  useToast,
} from "../../ui";
import { enrollmentEvidence, enrollmentItems } from "../../mocks/apphandover";
import type { EnrollmentItem } from "../../mocks/apphandover";
import { AppleBoundary, HandoverSteps, PR, orgOf } from "./parts";

export const Q02_STATES = ["新規申請中（既定）", "加入済み", "不足項目あり", "読み込み中", "エラー"];

const ITEM_STATUS = {
  ok: { label: "確認済み", tone: "pass" as const },
  pending: { label: "Apple の確認待ち", tone: "warn" as const },
  missing: { label: "不足", tone: "fail" as const },
};

export function Q02Enrollment({ params }: { params: Record<string, string> }) {
  const state = useScreenState();
  const org = orgOf(params);
  const toast = useToast();
  const enrolled = state === "加入済み";
  const items: EnrollmentItem[] = enrollmentItems.map((i) => {
    if (enrolled) return { ...i, status: "ok" };
    if (state === "不足項目あり" && (i.id === "EN-2" || i.id === "EN-5")) {
      return { ...i, status: "missing", detail: i.id === "EN-2" ? "D-U-N-S 番号の登録名が法人名と一致しません。顧客が登録情報を修正中" : "申請者に契約権限があることを確認できていません。顧客の管理者に確認を依頼済み" };
    }
    return i;
  });
  const missing = items.filter((i) => i.status === "missing");
  const appleItems = items.filter((i) => i.where === "apple");
  const serviceItems = items.filter((i) => i.where === "service");

  const status = enrolled ? <Tag tone="pass" square icon="check">加入済み</Tag> : missing.length ? <Tag tone="fail" square>不足項目あり</Tag> : <Tag tone="warn" square>Apple の確認待ち</Tag>;

  const table = (rows: EnrollmentItem[], withResume: boolean) => (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr><th>項目</th><th>担当</th><th>期限</th><th>状態</th>{withResume ? <th>再開先</th> : null}</tr>
        </thead>
        <tbody>
          {rows.map((i) => (
            <tr key={i.id}>
              <td><div className="strong small">{i.title}</div><div className="tiny muted">{i.detail}</div></td>
              <td><ExternalActor userId={i.owner} /></td>
              <td className="small">{formatDate(i.due)}</td>
              <td><Tag tone={ITEM_STATUS[i.status].tone} square>{ITEM_STATUS[i.status].label}</Tag></td>
              {withResume ? <td className="small">{i.resume ?? "—"}</td> : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <ProjectLayout org={org} project={PR} active="appHandover" trail={[{ label: "アプリの引き渡し" }, { label: "組織登録の支援" }]}>
      <PageHeader
        title="Apple Developer 組織登録の支援"
        description="顧客が自社の名義で組織として登録するための準備と期限を管理します。登録の手続きそのものは顧客本人が Apple 上で行います。"
        status={status}
      />
      <HandoverSteps org={org} active="Q-02" />
      {state === "読み込み中" ? (
        <Skeleton variant="detail" />
      ) : state === "エラー" ? (
        <ErrorState />
      ) : (
        <>
          {enrolled ? (
            <Banner tone="pass" title="顧客は加入済みです。チームの確認に進めます" action={<Button size="sm" to={paths.appInvitations(org, PR)}>作業者の招待へ</Button>}>
              加入の根拠を記録しました。以後の招待は、顧客のチームの権限者が承認した宛先と役割で行います。
            </Banner>
          ) : missing.length ? (
            <Banner tone="fail" title={`不足している項目が ${missing.length} 件あります`}>
              不足を解消するまで申請は進みません。担当と期限は下の表のとおりです。
            </Banner>
          ) : (
            <Banner tone="warn" title="Apple の確認待ちです">
              顧客の申請は受け付けられました。Apple から確認の連絡が来ることがあります。結果が出たら、顧客の担当者が下の「加入を確認」の材料を共有します。
            </Banner>
          )}

          <Section title="申請前にそろえる情報" sub="本サービスで確認し、記録する項目です" flush>
            {table(serviceItems, false)}
          </Section>

          <Section title="顧客本人が Apple 上で行う手続き" sub="本サービスは担当・期限・再開先だけを案内します" flush>
            {table(appleItems, true)}
          </Section>

          <AppleBoundary />

          <Section title="加入確認の根拠" sub="加入したことを、誰が何で確認したかを記録します">
            {enrolled ? (
              <KeyValueList
                cols={2}
                items={[
                  { label: "チーム名", value: enrollmentEvidence.team_name },
                  { label: "Team ID", value: <span className="mono">{enrollmentEvidence.team_id_suffix}</span> },
                  { label: "確認した人", value: <ExternalActor userId={enrollmentEvidence.confirmed_by} /> },
                  { label: "確認日時", value: formatDateTime(enrollmentEvidence.confirmed_at) },
                  { label: "確認の方法", value: enrollmentEvidence.method },
                  { label: "記録した人", value: <ExternalActor userId={enrollmentEvidence.recorded_by} /> },
                ]}
              />
            ) : (
              <div className="stack" style={{ ["--gap" as string]: "8px" }}>
                <p className="small muted">まだ記録はありません。加入の確認は、顧客の担当者がチーム名と Team ID の末尾を示し、案件窓口が照合して記録します。</p>
                <div className="row">
                  <Button
                    icon="check"
                    disabled
                    disabledReason="Apple の確認が終わり、顧客が加入を確認してから記録できます"
                    onClick={() => toast({ kind: "success", message: "加入の確認を記録しました" })}
                  >
                    加入を確認
                  </Button>
                </div>
              </div>
            )}
          </Section>
        </>
      )}
    </ProjectLayout>
  );
}
