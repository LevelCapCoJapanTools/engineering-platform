// 画面ID: U-02 顧客への公開設定
import "./disclosure.css";
import { useMemo, useState } from "react";
import { useScreenState } from "../../lib/router";
import { ORG, PROJECT, paths } from "../../lib/paths";
import { DISCLOSURE_STATUS } from "../../lib/vocab";
import { audiences, disclosureItems, projectRelations, publishedVersions } from "../../mocks/disclosure";
import type { DisclosureItem } from "../../mocks/disclosure";
import { userById } from "../../mocks/core";
import {
  AudienceTag,
  Banner,
  Button,
  Checkbox,
  DatePicker,
  ErrorState,
  Icon,
  PageHeader,
  ProjectLayout,
  RelationshipTag,
  Section,
  Select,
  Skeleton,
  StatusBadge,
  Tag,
  useToast,
} from "../../ui";

const GROUPS: DisclosureItem["group"][] = ["進捗・日程", "契約・金額", "資料", "共同経営", "社内"];

export function DisclosureScreen({ org = ORG, project = PROJECT }: { org?: string; project?: string }) {
  const state = useScreenState();
  const toast = useToast();
  const rel = projectRelations.find((r) => r.project === project) ?? projectRelations[0];
  const relationship = state === "alliance" ? "alliance" : rel.relationship;
  const audienceOptions = audiences.filter((a) => a.project === (state === "alliance" ? "member-app-api" : project));
  const [audience, setAudience] = useState(audienceOptions[0]?.key ?? "");
  const published = publishedVersions.find((v) => v.project === (state === "alliance" ? "member-app-api" : project) && v.status === "published");
  const initial = state === "empty" ? [] : published?.items ?? [];
  const [selected, setSelected] = useState<string[]>(initial);
  const [granularity, setGranularity] = useState<Record<string, string>>({});
  const [expires, setExpires] = useState(published?.expires ?? "2027-03-31");
  const dirty = useMemo(() => selected.slice().sort().join() !== initial.slice().sort().join(), [selected, initial]);

  const allowed = (i: DisclosureItem) => i.contract_allows[relationship];
  const toggle = (key: string, v: boolean) => setSelected((s) => (v ? [...s, key] : s.filter((k) => k !== key)));
  const applyRecommended = () => {
    setSelected(disclosureItems.filter((i) => i.recommended && allowed(i)).map((i) => i.key));
    toast({ kind: "info", message: "推奨設定（進捗・納期と契約金額）を適用しました。まだ公開していません" });
  };
  const newItems = disclosureItems.filter((i) => i.newly_added);

  return (
    <ProjectLayout org={org} project={project} active="disclosure" trail={[{ label: "顧客への公開" }]}>
      <PageHeader
        title="顧客への公開設定"
        description="相手企業・役割ごとに、公開する項目、添付の版、集計の粒度、有効期間を選びます。契約上の開示範囲の外にある項目は選べません。公開は、相手の見え方を確認してから確定します。"
        actions={
          <>
            <Button icon="history" to={paths.disclosureHistory(org, project)}>公開停止と履歴</Button>
            <Button variant="primary" icon="eye" to={paths.disclosurePreview(org, project)}>相手の見え方を確認</Button>
          </>
        }
      />
      {state === "loading" ? (
        <Skeleton variant="detail" />
      ) : state === "error" ? (
        <ErrorState />
      ) : (
        <>
          {state === "forbidden" ? (
            <Banner tone="warn" title="公開設定を変更できるのは、この案件の受注側統括責任者だけです">
              あなたの権限では閲覧のみです。変更が必要な場合は {userById(rel.jv_lead_id)?.name}（JV責任者）に依頼してください。
            </Banner>
          ) : null}
          {newItems.length ? (
            <Banner tone="info" title={`新しく追加された項目が ${newItems.length} 件あります（非公開）`}>
              {newItems.map((i) => i.label).join("、")}。明示的に選んで公開するまで、相手には表示されません。
            </Banner>
          ) : null}
          <div className="grid side-420">
            <div className="stack">
              <Section title="公開する相手" sub="相手の会社内で誰が閲覧・承認できるかは、相手企業の管理者が登録します">
                <div className="grid cols-2">
                  <Select
                    label="相手（会社・役割）"
                    value={audience}
                    onChange={setAudience}
                    options={audienceOptions.map((a) => ({ value: a.key, label: `${a.company} · ${a.role}（${userById(a.person_id)?.name}）` }))}
                  />
                  <DatePicker label="有効期限" value={expires} onChange={setExpires} help="期限を過ぎると、共有リンク・購読・送信待ちも失効します" />
                </div>
                <div className="row" style={{ marginTop: 12 }}>
                  <RelationshipTag value={relationship} />
                  <span className="small muted">契約上の開示範囲: {relationship === "alliance" ? "提携契約で合意した共同費目・ロードマップを含む" : "契約額・合意した納期・公開済みの進捗と資料"}</span>
                </div>
              </Section>
              {GROUPS.map((g) => {
                const items = disclosureItems.filter((i) => i.group === g);
                return (
                  <Section key={g} title={g} flush>
                    <div className="dc-items">
                      {items.map((i) => {
                        const ok = allowed(i);
                        const on = selected.includes(i.key) && ok;
                        return (
                          <div key={i.key} className={`dc-item${ok ? "" : " blocked"}`}>
                            <Checkbox
                              label={<span className="row" style={{ ["--gap" as string]: "6px" }}><span>{i.label}</span>{i.newly_added ? <Tag tone="warn" square>新規追加</Tag> : null}{i.sensitive ? <Tag square icon="lock">社内の機微情報</Tag> : null}</span>}
                              description={ok ? (i.attachment_version ? `添付の版: ${i.attachment_version}` : undefined) : <span className="dc-reason"><Icon name="lock" size={12} />{i.blocked_reason}</span>}
                              checked={on}
                              disabled={!ok || state === "forbidden"}
                              onChange={(v) => toggle(i.key, v)}
                            />
                            <div className="dc-item-side">
                              {on && i.granularity ? (
                                <select className="select sm" value={granularity[i.key] ?? i.granularity[0]} onChange={(e) => setGranularity((x) => ({ ...x, [i.key]: e.target.value }))} aria-label={`${i.label} の集計粒度`}>
                                  {i.granularity.map((o) => <option key={o}>{o}</option>)}
                                </select>
                              ) : null}
                              <AudienceTag value={on ? (i.group === "共同経営" ? "alliance" : "customer") : "internal"} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Section>
                );
              })}
            </div>
            <div className="stack">
              <Section title="現在の公開版">
                {published && state !== "empty" ? (
                  <div className="stack" style={{ ["--gap" as string]: "6px" }}>
                    <div className="row between"><span className="mono strong">{published.id}</span><StatusBadge vocab={DISCLOSURE_STATUS[published.status]} size="sm" /></div>
                    <span className="small">{published.items.length} 項目 · 期限 {published.expires.replace(/-/g, "/")}</span>
                    <span className="tiny muted">{published.source_note}</span>
                  </div>
                ) : (
                  <span className="small muted">まだ公開していません。相手には案件名と招待内容だけが見えています。</span>
                )}
              </Section>
              <Section title="設定の操作">
                <div className="stack">
                  <Button block icon="sparkles" onClick={applyRecommended} disabled={state === "forbidden"} disabledReason="JV責任者だけが変更できます">推奨設定を適用（進捗・納期と契約金額）</Button>
                  <Button block variant="primary" icon="eye" to={paths.disclosurePreview(org, project)} disabled={!dirty && state !== "empty"} disabledReason="変更はありません">変更を確認して公開へ進む</Button>
                  <span className="tiny muted">保存しただけでは公開されません。次の画面で相手の見え方と混入検査を確認し、公開版を確定します。</span>
                </div>
              </Section>
              <Section title="選択中の項目">
                {selected.filter((k) => disclosureItems.find((i) => i.key === k && allowed(i))).length === 0 ? (
                  <span className="small muted">選択した項目はありません</span>
                ) : (
                  <ul className="dc-list">
                    {selected.map((k) => disclosureItems.find((i) => i.key === k)).filter((i): i is DisclosureItem => !!i && allowed(i)).map((i) => <li key={i.key} className="small">{i.label}</li>)}
                  </ul>
                )}
              </Section>
            </div>
          </div>
        </>
      )}
    </ProjectLayout>
  );
}
