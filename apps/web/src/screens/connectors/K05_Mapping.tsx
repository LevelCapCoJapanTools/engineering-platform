// 画面ID: K-05 外部データの対応付け
import "./connectors.css";
import { useState } from "react";
import { useScreenState, useRoute } from "../../lib/router";
import { ORG, paths } from "../../lib/paths";
import { userById } from "../../mocks/core";
import { mappingRows } from "../../mocks/connectors";
import type { MappingRow } from "../../mocks/connectors";
import { ActorLabel, AppLayout, Banner, Button, crumbs, DataTable, EmptyState, ErrorState, Modal, PageHeader, ProviderBadge, Select, Skeleton, StatCard, Tabs, Tag, TextArea, useToast } from "../../ui";
import type { Column } from "../../ui";

const STATUS: Record<MappingRow["status"], { label: string; tone: "pass" | "special" | "warn" | "fail" | "neutral" }> = {
  confirmed: { label: "確定", tone: "pass" },
  candidate: { label: "AI・参考の候補", tone: "special" },
  duplicate: { label: "重複", tone: "warn" },
  orphan: { label: "未対応付け", tone: "warn" },
  wrongOrg: { label: "誤った案件の疑い", tone: "fail" },
};

export function K05Mapping() {
  const state = useScreenState();
  const org = useRoute().params.org ?? ORG;
  const toast = useToast();
  const [tab, setTab] = useState("issues");
  const [editing, setEditing] = useState<MappingRow | null>(null);
  const [reason, setReason] = useState("");
  const rows = state === "empty" ? [] : mappingRows;
  const issues = rows.filter((r) => r.status !== "confirmed");
  const shown = tab === "issues" ? issues : tab === "confirmed" ? rows.filter((r) => r.status === "confirmed") : rows;

  const cols: Column<MappingRow>[] = [
    { key: "src", header: "外部データ", render: (r) => <div className="stack" style={{ ["--gap" as string]: "2px" }}><ProviderBadge provider={r.provider} size="sm" /><span className="small strong">{r.external_title}</span><span className="tiny muted mono">{r.external_kind} · {r.external_id}</span></div>, hideable: false },
    { key: "kind", header: "対応先の種類", render: (r) => <Tag square>{r.target_kind}</Tag> },
    { key: "target", header: "対応先", render: (r) => (r.target ? <span className="small">{r.target}</span> : <span className="muted small">なし</span>) },
    { key: "status", header: "状態", render: (r) => <Tag tone={STATUS[r.status].tone} square dashed={r.status === "candidate"}>{STATUS[r.status].label}{r.confidence ? `（確信度 ${Math.round(r.confidence * 100)}%）` : ""}</Tag>, sortValue: (r) => r.status },
    { key: "basis", header: "根拠", render: (r) => <span className="small">{r.basis ?? "—"}</span> },
    { key: "by", header: "確定者", render: (r) => (r.confirmed_by === "system" ? <ActorLabel kind="system" name="規則" size="sm" /> : r.confirmed_by ? <span className="small">{userById(r.confirmed_by)?.name}</span> : r.status === "candidate" ? <ActorLabel kind="ai" size="sm" /> : <span className="muted">—</span>) },
    {
      key: "act",
      header: "",
      render: (r) =>
        r.status === "confirmed" ? (
          <Button size="sm" variant="ghost" onClick={() => setEditing(r)}>変更</Button>
        ) : r.status === "candidate" ? (
          <div className="row nowrap" style={{ ["--gap" as string]: "4px" }}>
            <Button size="sm" variant="primary" icon="check" onClick={() => setEditing(r)}>確定</Button>
            <Button size="sm" variant="ghost" onClick={() => toast({ kind: "success", message: "候補を却下しました。理由を記録しました" })}>却下</Button>
          </div>
        ) : (
          <Button size="sm" onClick={() => setEditing(r)}>{r.status === "duplicate" ? "正を選ぶ" : r.status === "wrongOrg" ? "対応を直す" : "対応付ける"}</Button>
        ),
    },
  ];

  return (
    <AppLayout org={org} active="connectors" breadcrumb={crumbs(org, undefined, { label: "連携と同期", to: paths.connectors(org) }, { label: "外部データの対応付け" })}>
      <PageHeader
        title="外部データの対応付け"
        description="外部システムのプロジェクト・リポジトリ・課題・マイルストーン・リリースを、案件と結び付けます。AI の候補は人が確定し、確定者と根拠を記録します。"
        actions={<Button icon="users" to={paths.actors(org)}>人の外部IDの対応付け</Button>}
      />
      {state === "loading" ? (
        <Skeleton rows={6} />
      ) : state === "error" ? (
        <ErrorState />
      ) : (
        <div className="stack">
          <div className="grid auto-fit">
            <StatCard label="確定済み" icon="checkCircle" value={rows.filter((r) => r.status === "confirmed").length} unit="件" />
            <StatCard label="重複" icon="copy" value={rows.filter((r) => r.status === "duplicate").length} unit="件" tone="warn" />
            <StatCard label="未対応付け" icon="link" value={rows.filter((r) => r.status === "orphan").length} unit="件" tone="warn" />
            <StatCard label="誤った案件の疑い" icon="alertCircle" value={rows.filter((r) => r.status === "wrongOrg").length} unit="件" tone="danger" />
            <StatCard label="AI の候補" icon="sparkles" value={rows.filter((r) => r.status === "candidate").length} unit="件" />
          </div>
          {rows.some((r) => r.status === "wrongOrg") ? (
            <Banner tone="fail" title="別の顧客案件のデータが紐付いている可能性があります">
              誤った案件に紐付いたデータは、その案件の閲覧者に見えてしまいます。確認が済むまで、該当データは経営ダッシュボードに表示しません。
            </Banner>
          ) : null}
          <Tabs
            value={tab}
            onChange={setTab}
            tabs={[
              { value: "issues", label: "要確認", count: issues.length },
              { value: "confirmed", label: "確定済み", count: rows.length - issues.length },
              { value: "all", label: "すべて", count: rows.length },
            ]}
          />
          <DataTable
            columns={cols}
            rows={shown}
            rowKey={(r) => r.id}
            empty={<EmptyState icon="checkCircle" title={tab === "issues" ? "確認が必要な対応付けはありません" : "対応付けはまだありません"} description="接続すると、規則で自動に対応付けられたものと候補がここに並びます。" />}
          />
        </div>
      )}
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.status === "candidate" ? "候補を確定する" : "対応付けを変更する"}
        description={editing ? `${editing.external_kind}「${editing.external_title}」` : undefined}
        footer={
          <>
            <Button onClick={() => setEditing(null)}>キャンセル</Button>
            <Button variant="primary" disabled={!reason.trim()} disabledReason="根拠を入力してください" onClick={() => { setEditing(null); setReason(""); toast({ kind: "success", message: "対応付けを確定しました。確定者と根拠を記録しました" }); }}>確定する</Button>
          </>
        }
      >
        <div className="stack">
          {editing?.status === "candidate" ? <Banner tone="info">AI の候補は参考です。内容を確認し、根拠を記録して確定してください。</Banner> : null}
          <Select
            label="対応先"
            value={editing?.target ?? ""}
            options={[{ value: "", label: "対象外にする" }, { value: "受発注システム刷新", label: "受発注システム刷新" }, { value: "会員アプリ API 開発", label: "会員アプリ API 開発" }, { value: "MS-201", label: "MS-201 β版リリース" }, { value: "MS-105", label: "MS-105 結合テスト環境の準備" }, { value: "旧基幹データ移行", label: "旧基幹データ移行" }]}
          />
          <TextArea label="根拠" required rows={3} value={reason} onChange={setReason} placeholder="例: Milestone の名称と期限が計画書の β版リリースと一致" />
        </div>
      </Modal>
    </AppLayout>
  );
}
