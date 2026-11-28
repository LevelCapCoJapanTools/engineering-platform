// 画面ID: Y-04 権利の分割・利用範囲
// 資産ごとに譲渡・保有継続・共同保有・利用許諾を選び、当事者別の持分、利用目的、改変・再配布等の条件、
// 対価、発効条件を、該当する契約条項に対応付ける。全持分を登録する合意で合計が100%でなければ不備を示す。
import { useState } from "react";
import { useRoute, useScreenState } from "../../lib/router";
import { paths } from "../../lib/paths";
import { IP_DISPOSITION } from "../../lib/vocab";
import type { IpDisposition } from "../../lib/vocab";
import { IP_KIND, IP_ORIGIN, ipById, licenseChecks } from "../../mocks/contracts";
import type { IpAsset } from "../../mocks/contracts";
import { AudienceTag, Banner, Button, ErrorState, OptionCard, PageHeader, ProjectLayout, Section, Skeleton, Tag, useToast } from "../../ui";
import { DispositionTag, LegalNote, ShareBar, routeOrg, routeProject } from "./parts";

function pick(state: string, id?: string): IpAsset {
  if (state === "invalidShare" || state === "undecided") return ipById("IP-106")!;
  if (state === "license") return ipById("IP-102")!;
  return ipById(id ?? "") ?? ipById("IP-202")!;
}

const DISPOSITION_HELP: Record<IpDisposition, string> = {
  assign: "権利を相手に移す。発効条件（検収・支払など）を条項から登録する",
  retain: "権利を持つ会社がそのまま保有する",
  joint: "複数の会社が持分を持つ。当事者別の割合を登録する",
  license: "権利は移さず、利用目的と条件を定めて使わせる",
  undecided: "まだ合意していない",
};

export function Y04IpAsset({ id }: { id?: string }) {
  const state = useScreenState();
  const params = useRoute().params;
  const org = routeOrg(params);
  const pr = routeProject(params);
  const toast = useToast();
  const a = pick(state, id);
  const [disp, setDisp] = useState<IpDisposition>(state === "undecided" ? "undecided" : a.disposition);
  const trail = [{ label: "知的資産", to: paths.ipAssets(org, pr) }, { label: a.id }];

  if (state === "loading") return <ProjectLayout org={org} project={pr} active="ipAssets" trail={trail}><Skeleton variant="detail" /></ProjectLayout>;
  if (state === "error") return <ProjectLayout org={org} project={pr} active="ipAssets" trail={trail}><ErrorState /></ProjectLayout>;

  const total = a.shares.reduce((n, s) => n + s.ratio, 0);
  const invalid = a.full_allocation && a.shares.length > 0 && total !== 100;
  const checks = licenseChecks.filter((l) => l.asset_id === a.id);

  return (
    <ProjectLayout org={org} project={pr} active="ipAssets" trail={trail}>
      <PageHeader
        id={a.id}
        title={a.name}
        status={<DispositionTag value={disp} />}
        description={`${a.deliverable} · ${IP_KIND[a.kind]} · ${IP_ORIGIN[a.origin].label} · 出所 ${a.source}（版 ${a.version}）`}
        meta={<AudienceTag value={a.customer_visible ? "customer" : "internal"} />}
        actions={
          <Button variant="primary" icon="check" disabled={invalid || disp === "undecided"} disabledReason={invalid ? "持分の合計が100%になっていません" : "扱いが未合意です"} onClick={() => toast({ kind: "success", message: "権利の扱いを記録しました。各社の権限者の確認待ちです" })}>
            合意内容を記録
          </Button>
        }
      />

      <Banner tone="info" title="費用の負担割合から権利を推定しません">
        開発費を折半していても、権利の配分は署名済み契約の該当条項から登録します。AI は不足資料や文案を示すだけで、内容は各社の権限者が合意して確定します。
      </Banner>

      <Section title="権利の扱い" sub={`根拠となる条項: ${a.basis}`}>
        <div className="grid auto-fit" role="radiogroup" aria-label="権利の扱い">
          {(Object.keys(IP_DISPOSITION) as IpDisposition[]).map((k) => (
            <OptionCard key={k} name="disposition" value={k} checked={disp === k} onChange={(v) => setDisp(v as IpDisposition)} title={IP_DISPOSITION[k].label} description={DISPOSITION_HELP[k]} />
          ))}
        </div>
      </Section>

      <Section title="当事者別の持分" sub={a.full_allocation ? "全持分を登録する合意です。合計は100%にします" : "第三者の権利は持分を登録しません"}>
        <ShareBar shares={a.shares} fullAllocation={a.full_allocation} />
      </Section>

      <Section title="利用範囲と条件">
        <dl className="ct-kv-grid">
          <div><dt>利用目的</dt><dd>{a.purpose ?? "—"}</dd></div>
          <div><dt>改変・再配布等の条件</dt><dd>{a.conditions ?? "—"}</dd></div>
          <div><dt>対価</dt><dd>{a.consideration ?? "—"}</dd></div>
          <div><dt>発効条件</dt><dd>{a.effective_condition ?? "—"}</dd></div>
          <div><dt>根拠契約・条項</dt><dd>{a.basis}</dd></div>
          <div><dt>現在の権利者</dt><dd>{a.holder}</dd></div>
        </dl>
        {a.note ? <p className="small muted" style={{ marginTop: 8 }}>{a.note}</p> : null}
      </Section>

      <Section title="照合と引き渡し" actions={<Button size="sm" variant="ghost" iconRight="arrowRight" to={paths.rightsHandover(org, pr)}>引渡明細</Button>}>
        {checks.length ? (
          <ul className="stack" style={{ ["--gap" as string]: "6px", listStyle: "none", padding: 0, margin: 0 }}>
            {checks.map((l) => (
              <li key={l.id} className="row between ct-line">
                <span className="small">{l.right}</span>
                <Tag tone={l.result === "ok" ? "pass" : l.result === "pending" ? "warn" : "fail"} square>{l.result === "ok" ? "照合済み" : l.result === "pending" ? "権利確認待ち" : "不適合"}</Tag>
              </li>
            ))}
          </ul>
        ) : (
          <p className="small muted">この資産の再委託・ライセンスの照合はありません。</p>
        )}
      </Section>
      <LegalNote />
    </ProjectLayout>
  );
}
