// 画面ID: Y-05 再委託・第三者ライセンス
// 受託者との契約、オープンソースや素材の利用条件を、顧客に提示する権利ごとに照合する。
// 許諾の証跡・表示義務・確認担当を関連付け、確認できないものは「権利確認待ち」と理由を示す。
import { useRoute, useScreenState } from "../../lib/router";
import { paths } from "../../lib/paths";
import { formatDateTime } from "../../lib/format";
import { ipById, licenseChecks } from "../../mocks/contracts";
import type { LicenseCheck } from "../../mocks/contracts";
import { AudienceTag, Banner, Button, DataTable, ErrorState, ExternalActor, PageHeader, ProjectLayout, Section, Skeleton, Tag, useToast } from "../../ui";
import type { Column } from "../../ui";
import { LegalNote, routeOrg, routeProject } from "./parts";

const RESULT: Record<LicenseCheck["result"], { label: string; tone: "pass" | "warn" | "fail" }> = {
  ok: { label: "照合済み", tone: "pass" },
  pending: { label: "権利確認待ち", tone: "warn" },
  ng: { label: "提示できない", tone: "fail" },
};

export function Y05Licenses() {
  const state = useScreenState();
  const params = useRoute().params;
  const org = routeOrg(params);
  const pr = routeProject(params);
  const toast = useToast();
  const all = licenseChecks.filter((l) => l.project === pr).map((l) => (state === "allClear" ? { ...l, result: "ok" as const, reason: undefined } : l));
  const pending = all.filter((l) => l.result !== "ok");

  const cols: Column<LicenseCheck>[] = [
    { key: "asset", header: "資産", render: (l) => <span className="stack" style={{ ["--gap" as string]: "2px" }}><span className="strong small">{ipById(l.asset_id)?.name}</span><span className="tiny muted mono">{l.asset_id}</span></span>, hideable: false },
    { key: "right", header: "顧客に提示する権利", render: (l) => <span className="small">{l.right}</span> },
    { key: "terms", header: "元の利用条件", render: (l) => <span className="stack" style={{ ["--gap" as string]: "2px" }}><span className="small">{l.source_terms}</span>{l.freelance ? <span><AudienceTag value="internal" /> <span className="tiny muted">受託者との契約（条件のみ。委託単価は扱わない）</span></span> : null}</span> },
    { key: "result", header: "照合", render: (l) => <span className="stack" style={{ ["--gap" as string]: "2px" }}><Tag tone={RESULT[l.result].tone} square>{RESULT[l.result].label}</Tag>{l.reason ? <span className="tiny">{l.reason}</span> : null}</span>, sortValue: (l) => l.result },
    { key: "evidence", header: "許諾の証跡", render: (l) => <span className="small">{l.evidence ?? <span className="muted">なし</span>}</span> },
    { key: "notice", header: "表示義務", render: (l) => <span className="small">{l.notice_duty ?? "—"}</span>, defaultHidden: false },
    { key: "checker", header: "確認担当", render: (l) => <span className="stack" style={{ ["--gap" as string]: "2px" }}><ExternalActor userId={l.checker_id} />{l.checked_at ? <span className="tiny muted">{formatDateTime(l.checked_at)}</span> : <span className="tiny muted">未確認</span>}</span> },
  ];

  const notices = all.filter((l) => !l.freelance && l.notice_duty);

  return (
    <ProjectLayout org={org} project={pr} active="licenses" trail={[{ label: "再委託・ライセンス" }]}>
      <PageHeader
        title="再委託・第三者ライセンス"
        description="受託者との契約、オープンソースや素材の利用条件を、顧客に提示する権利ごとに照合します。顧客には必要な利用条件だけを渡し、委託単価や報酬は渡しません。"
        actions={<Button icon="package" to={paths.ipAssets(org, pr)}>知的資産台帳</Button>}
      />
      {state === "loading" ? (
        <Skeleton />
      ) : state === "error" ? (
        <ErrorState />
      ) : (
        <>
          {pending.length ? (
            <Banner tone="warn" title={`権利確認待ちが ${pending.length} 件あります`}>
              再配布の許諾などを確認できない素材を含む納入物は「権利確認待ち」として扱い、権利の引渡明細でも未発効のまま残します。
            </Banner>
          ) : (
            <Banner tone="pass" title="すべての権利を照合しました">顧客に提示する権利と、元の利用条件の照合がそろっています。</Banner>
          )}
          <DataTable columns={cols} rows={all} rowKey={(l) => l.id} />
          <Section
            title="顧客に渡す利用条件"
            sub="納入時に交付する表示義務の一覧。受託者との契約の内容は含めません"
            actions={<Button size="sm" icon="download" onClick={() => toast({ kind: "success", message: "利用条件の一覧（顧客向け）を作成しました" })}>一覧を作成</Button>}
          >
            {notices.length ? (
              <ul className="stack" style={{ ["--gap" as string]: "6px", listStyle: "none", padding: 0, margin: 0 }}>
                {notices.map((l) => (
                  <li key={l.id} className="row between ct-line">
                    <span className="small"><strong>{ipById(l.asset_id)?.name}</strong> — {l.notice_duty}</span>
                    <AudienceTag value="customer" />
                  </li>
                ))}
              </ul>
            ) : <p className="small muted">交付する利用条件はありません。</p>}
          </Section>
          <LegalNote />
        </>
      )}
    </ProjectLayout>
  );
}
