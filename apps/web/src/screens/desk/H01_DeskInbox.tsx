// 画面ID: H-01 窓口の受信箱
// 案件ごとの問い合わせ台帳。受託者・顧客・JV からの問い合わせを、発信側・回答待ちの相手・担当・代理・期限つきで並べる。
// 案件を特定できない返信は「保留」に置き、どの案件の画面にも表示しない。
import { useMemo, useState } from "react";
import { navigate, useRoute, useScreenState } from "../../lib/router";
import { ORG, paths } from "../../lib/paths";
import type { Inquiry } from "../../lib/types";
import { INQUIRY_STATUS } from "../../lib/vocab";
import { daysUntil, formatDate } from "../../lib/format";
import { changeAgreements, deskHours, deskInquiries } from "../../mocks/desk";
import {
  AppLayout,
  AudienceTag,
  Banner,
  Button,
  crumbs,
  DataTable,
  EmptyState,
  ErrorState,
  ExternalActor,
  Modal,
  PageHeader,
  Section,
  Select,
  Skeleton,
  StatCard,
  StatusBadge,
  Tabs,
  Tag,
  useToast,
} from "../../ui";
import type { Column } from "../../ui";
import { FromTag, ManualFallbackNote, projectName } from "./parts";

const WAITING_ON: Record<Inquiry["status"], string> = {
  received: "窓口",
  askingCustomer: "顧客",
  drafting: "窓口（回答案の確認）",
  answered: "—",
  onHold: "窓口（案件の特定）",
  escalated: "代理",
};

export function DeskInbox() {
  const state = useScreenState();
  const toast = useToast();
  const org = useRoute().params.org ?? ORG;
  const [tab, setTab] = useState("open");
  const [linking, setLinking] = useState<Inquiry | null>(null);
  const [target, setTarget] = useState("");
  const all = state === "空" ? [] : deskInquiries;
  const held = all.filter((q) => q.status === "onHold");
  const tracked = all.filter((q) => q.status !== "onHold");
  const overdue = tracked.filter((q) => q.status !== "answered" && daysUntil(q.due) < 0);
  const rows = useMemo(() => {
    const list = tracked.filter((q) => {
      if (tab === "open") return q.status !== "answered";
      if (tab === "answered") return q.status === "answered";
      return q.from === tab && q.status !== "answered";
    });
    return [...list].sort((a, b) => a.due.localeCompare(b.due));
  }, [tracked, tab]);

  const cols: Column<Inquiry>[] = [
    { key: "id", header: "受付番号", render: (q) => <span className="mono small">{q.id}</span>, sortValue: (q) => q.id },
    {
      key: "subject",
      header: "件名",
      hideable: false,
      render: (q) => (
        <span className="stack" style={{ ["--gap" as string]: "2px" }}>
          <span className="small strong">{q.subject}</span>
          <span className="tiny muted">{projectName(q.project)}{q.order_id ? ` · ${q.order_id}` : ""}</span>
        </span>
      ),
    },
    { key: "from", header: "発信側", render: (q) => <span className="stack" style={{ ["--gap" as string]: "4px" }}><FromTag from={q.from} /><ExternalActor userId={q.asker_id} /></span> },
    { key: "status", header: "状態", render: (q) => <StatusBadge vocab={INQUIRY_STATUS[q.status]} size="sm" />, sortValue: (q) => q.status },
    { key: "waiting", header: "回答待ちの相手", render: (q) => <span className="small">{WAITING_ON[q.status]}</span> },
    {
      key: "owner",
      header: "担当・代理",
      render: (q) => (
        <span className="stack" style={{ ["--gap" as string]: "2px" }}>
          <ExternalActor userId={q.status === "escalated" ? q.deputy_id : q.owner_id} />
          {q.status === "escalated" ? <span className="tiny muted">期限超過で代理へ移行（元の担当: 青木 さくら）</span> : q.deputy_id ? <span className="tiny muted">代理: 設定あり</span> : <span className="tiny muted">代理: 未設定</span>}
        </span>
      ),
    },
    {
      key: "due",
      header: "応答期限",
      render: (q) => {
        const d = daysUntil(q.due);
        return (
          <span className="stack" style={{ ["--gap" as string]: "2px" }}>
            <span className="small">{formatDate(q.due)}</span>
            {q.status === "answered" ? null : d < 0 ? <Tag tone="fail" square>{-d}日超過</Tag> : d <= 1 ? <Tag tone="warn" square>{d === 0 ? "今日まで" : "あす"}</Tag> : null}
          </span>
        );
      },
      sortValue: (q) => q.due,
    },
    { key: "audience", header: "回答の宛先", render: (q) => <AudienceTag value={q.audience} />, defaultHidden: true },
  ];

  const tabs = [
    { value: "open", label: "未回答", count: tracked.filter((q) => q.status !== "answered").length },
    { value: "freelancer", label: "受託者から", count: tracked.filter((q) => q.from === "freelancer" && q.status !== "answered").length },
    { value: "customer", label: "顧客から", count: tracked.filter((q) => q.from === "customer" && q.status !== "answered").length },
    { value: "jv", label: "JVから", count: tracked.filter((q) => q.from === "jv" && q.status !== "answered").length },
    { value: "answered", label: "回答済み", count: tracked.filter((q) => q.status === "answered").length },
  ];

  return (
    <AppLayout org={org} active="desk" breadcrumb={crumbs(org, undefined, { label: "案件窓口" })}>
      <PageHeader
        title="窓口の受信箱"
        description="受託者・顧客・JV からの問い合わせを案件ごとに受け付け、回答待ちの相手と期限を管理します。受託者には次に必要な操作と確定した回答だけを返します。"
        actions={
          <>
            <Button icon="send" to={paths.deskOutbound(org)}>対外送信の承認</Button>
            <Button icon="users" to={paths.deskAssignments(org)}>担当と期限</Button>
            <Button icon="fileText" to={paths.deskReports(org)}>週報</Button>
          </>
        }
      />
      {state === "読み込み中" ? (
        <Skeleton rows={6} />
      ) : state === "エラー" ? (
        <ErrorState />
      ) : (
        <>
          {state === "AI停止中" ? (
            <Banner tone="warn" title="AI の回答案を作れません（提供元の障害）">
              受付と定型の受領通知は動いています。回答は定型文か手入力で作成し、通常どおり確認してから送ってください。
            </Banner>
          ) : null}
          <Banner tone="info" title={`営業時間: ${deskHours.weekdays}（${deskHours.timezone}）`}>
            {deskHours.note}。年末年始の休業日: {deskHours.holidays[0].slice(5).replace("-", "/")}〜{deskHours.holidays[deskHours.holidays.length - 1].slice(5).replace("-", "/")}
          </Banner>
          <div className="grid auto-fit">
            <StatCard label="未回答" icon="inbox" value={tracked.filter((q) => q.status !== "answered").length} unit="件" />
            <StatCard label="顧客へ確認中" icon="building" value={tracked.filter((q) => q.status === "askingCustomer").length} unit="件" delta="催促は委任ルールで送信" />
            <StatCard label="期限超過" icon="clock" value={overdue.length + tracked.filter((q) => q.status === "escalated").length} unit="件" tone={overdue.length + tracked.filter((q) => q.status === "escalated").length > 0 ? "danger" : undefined} delta="代理へ移行済みを含む" to={paths.deskAssignments(org)} />
            <StatCard label="保留（案件不明）" icon="help" value={held.length} unit="件" tone={held.length > 0 ? "warn" : undefined} delta="どの案件にも表示していません" />
          </div>
          {state === "AI停止中" ? <ManualFallbackNote /> : null}
          <Tabs value={tab} onChange={setTab} tabs={tabs} />
          <DataTable
            columns={cols}
            rows={rows}
            rowKey={(q) => q.id}
            onRowClick={(q) => navigate(paths.deskInquiry(org, q.id))}
            empty={
              <EmptyState
                icon="inbox"
                title={all.length === 0 ? "問い合わせはまだありません" : "この条件の問い合わせはありません"}
                description={all.length === 0 ? "受託者の質問、顧客の返信、JV からの依頼が届くと、ここに案件ごとに並びます。" : "別のタブを確認してください。"}
                variant={all.length === 0 ? "initial" : "filtered"}
              />
            }
          />
          <Section title="再合意中の変更条件" sub="顧客との条件と受託者への委託条件を、それぞれの当事者から回収しています" flush>
            {state === "空" ? (
              <div style={{ padding: 16 }} className="small muted">再合意中の変更はありません。</div>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>変更要求</th><th>案件</th><th>顧客との条件</th><th>委託条件</th><th /></tr></thead>
                  <tbody>
                    {changeAgreements.map((c) => (
                      <tr key={c.id}>
                        <td className="small"><span className="mono">{c.id}</span> {c.title}</td>
                        <td className="small">{projectName(c.project)}</td>
                        <td>{c.customer.status === "agreed" ? <Tag tone="pass" square>合意済み</Tag> : <Tag tone="warn" square>回答待ち</Tag>}</td>
                        <td>{c.commission.status === "agreed" ? <Tag tone="pass" square>合意済み</Tag> : <Tag tone="warn" square>回答待ち</Tag>}</td>
                        <td><Button size="sm" to={paths.deskChange(org, c.id)}>開く</Button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>
          <Section title="保留中の返信（案件を特定できないもの）" sub="件名や宛先から案件を特定できなかった返信です。案件に結び付けるまで、どの案件の画面・通知・検索にも出しません" flush>
            {held.length === 0 ? (
              <div style={{ padding: 16 }} className="small muted">保留中の返信はありません。</div>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>受付番号</th><th>件名</th><th>送信者</th><th>受信経路</th><th /></tr></thead>
                  <tbody>
                    {held.map((q) => (
                      <tr key={q.id}>
                        <td className="mono small">{q.id}</td>
                        <td className="small">{q.subject}</td>
                        <td><ExternalActor userId={q.asker_id} /></td>
                        <td className="small">窓口の共通アドレス</td>
                        <td><Button size="sm" icon="link" onClick={() => { setLinking(q); setTarget(""); }}>案件に結び付ける</Button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>
        </>
      )}
      <Modal
        open={!!linking}
        onClose={() => setLinking(null)}
        title="返信を案件に結び付ける"
        description="送信者が当事者になっている案件だけを選べます。結び付けた後は、その案件の関係者にだけ表示されます。"
        footer={
          <>
            <Button onClick={() => setLinking(null)}>キャンセル</Button>
            <Button variant="primary" disabled={!target} disabledReason="案件を選んでください" onClick={() => { toast({ kind: "success", message: `${linking?.id} を「${projectName(target)}」に結び付けました` }); setLinking(null); }}>結び付ける</Button>
          </>
        }
      >
        <Select
          label="案件"
          value={target}
          onChange={setTarget}
          placeholder="選択してください"
          options={[{ value: "order-renewal", label: "受発注システム刷新（架空商事・当事者）" }]}
          help="小松 恵 さんが当事者になっている案件は1件です。他社の案件は候補に出ません"
        />
      </Modal>
    </AppLayout>
  );
}
