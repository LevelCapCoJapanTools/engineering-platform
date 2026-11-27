// 画面ID: A-03 組織の選択
import { useScreenState, Link } from "../../lib/router";
import { paths } from "../../lib/paths";
import { Button, CenterLayout, EmptyState, ErrorState, Icon, RoleBadge } from "../../ui";
import { orgs } from "../../mocks/core";

export function Orgs() {
  const state = useScreenState();
  return (
    <CenterLayout wide>
      <div className="row between">
        <div className="stack" style={{ ["--gap" as string]: "4px" }}>
          <h1 style={{ fontSize: "var(--text-xl)", color: "var(--text-strong)" }}>組織を選択</h1>
          <p className="small muted">作業する組織を選んでください。</p>
        </div>
        <Button variant="secondary" icon="plus" to={paths.onboardingOrg()}>組織を作成</Button>
      </div>

      {state === "loading" ? (
        <div className="stack" style={{ ["--gap" as string]: "10px" }}>
          {[0, 1].map((i) => (
            <div key={i} className="card tight row" style={{ ["--gap" as string]: "14px" }}>
              <span className="skeleton" style={{ width: 40, height: 40, borderRadius: 10 }} />
              <span className="stack grow" style={{ ["--gap" as string]: "8px" }}>
                <span className="skeleton" style={{ height: 14, width: "40%" }} />
                <span className="skeleton" style={{ height: 10, width: "60%" }} />
              </span>
            </div>
          ))}
        </div>
      ) : state === "error" ? (
        <ErrorState />
      ) : state === "empty" ? (
        <EmptyState
          icon="building"
          title="所属している組織がありません"
          description="組織の管理者から招待を受けると、ここに表示されます。自分で組織を作成することもできます。"
          action={<Button variant="primary" icon="plus" to={paths.onboardingOrg()}>組織を作成</Button>}
        />
      ) : (
        <div className="stack" style={{ ["--gap" as string]: "10px" }}>
          {orgs.map((o) => (
            <Link key={o.id} to={paths.orgHome(o.slug)} className="card tight interactive row" style={{ textDecoration: "none", color: "inherit", ["--gap" as string]: "14px" }}>
              <span className="org-logo" style={{ display: "grid", placeItems: "center", width: 40, height: 40, borderRadius: 10, background: "var(--text-strong)", color: "var(--bg)", fontWeight: 700 }}>{o.initials}</span>
              <span className="stack grow" style={{ ["--gap" as string]: "4px", minWidth: 0 }}>
                <span className="strong">{o.name}</span>
                <span className="row small muted" style={{ ["--gap" as string]: "10px" }}>
                  <span>{o.plan} プラン</span>
                  <span>プロジェクト {o.project_count}件</span>
                </span>
                <span className="row" style={{ ["--gap" as string]: "4px" }}>
                  {o.my_roles.map((r) => <RoleBadge key={r} role={r} />)}
                </span>
              </span>
              {o.pending_approvals ? (
                <span className="badge tone-warn"><Icon name="inbox" />承認待ち {o.pending_approvals}</span>
              ) : (
                <span className="tiny muted">承認待ちなし</span>
              )}
              <Icon name="chevronRight" className="muted" />
            </Link>
          ))}
        </div>
      )}
    </CenterLayout>
  );
}
