// 画面ID: A-06 対象の選択（オンボーディング 3/10）
import { useState } from "react";
import { useScreenState } from "../../lib/router";
import { Button, EmptyState, ErrorState, PlanLimitNotice, ProviderBadge, SearchBox, Skeleton, Tag, Timestamp } from "../../ui";
import { ExecOnboarding } from "./parts";
import { repos } from "../../mocks/core";

export function Repos() {
  const state = useScreenState();
  const limit = state === "limit" ? 3 : 10;
  const [sel, setSel] = useState<string[]>(state === "limit" ? ["r1", "r2", "r3"] : ["r1", "r2"]);
  const [q, setQ] = useState("");
  const list = state === "empty" ? [] : repos.filter((r) => r.full_name.includes(q));
  const atLimit = sel.length >= limit;
  return (
    <ExecOnboarding step={2} title="対象のリポジトリを選択" description="進捗と証跡の取込み、ゲートの対象にするリポジトリを選びます。あとから追加・削除できます。リポジトリ数は課金に影響しません。" nextDisabled={sel.length === 0} nextDisabledReason="リポジトリを1つ以上選んでください">
      {state === "limit" ? <PlanLimitNotice used={sel.length} limit={limit} plan="Starter" /> : null}
      <div className="row between">
        <SearchBox placeholder="リポジトリ名で絞り込み" value={q} onChange={setQ} width={280} />
        <span className="row small" style={{ ["--gap" as string]: "8px" }}><ProviderBadge provider="github" size="sm" /><strong>{sel.length}</strong><span className="muted"> / {limit} 件を選択（{state === "limit" ? "Starter" : "Team"} プランの目安）</span></span>
      </div>
      {state === "loading" ? (
        <Skeleton rows={4} />
      ) : state === "error" ? (
        <ErrorState title="リポジトリの一覧を取得できませんでした" description="接続の権限が変更された可能性があります。再試行するか、前の手順で接続先を確認してください。" />
      ) : list.length === 0 ? (
        <div className="card">
          <EmptyState icon="github" title="選べるリポジトリがありません" description="接続時に対象リポジトリを選んでいない可能性があります。接続先で App の設定を開き、対象を追加してください。" action={<Button icon="external">GitHub で App の設定を開く</Button>} />
        </div>
      ) : (
        <div className="card flush">
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th className="check-col" /><th>リポジトリ</th><th>公開範囲</th><th>既定ブランチ</th><th>最終更新</th></tr></thead>
              <tbody>
                {list.map((r) => {
                  const checked = sel.includes(r.id);
                  const disabled = !checked && atLimit;
                  return (
                    <tr key={r.id} className={checked ? "selected" : undefined} style={disabled ? { opacity: 0.5 } : undefined}>
                      <td className="check-col">
                        <input type="checkbox" aria-label={`${r.full_name} を選択`} checked={checked} disabled={disabled} title={disabled ? "プランの上限に達しています" : undefined} onChange={() => setSel((s) => (checked ? s.filter((x) => x !== r.id) : [...s, r.id]))} />
                      </td>
                      <td className="mono small strong">{r.full_name}</td>
                      <td><Tag tone={r.visibility === "public" ? "warn" : "neutral"} square>{r.visibility === "private" ? "Private" : r.visibility === "public" ? "Public" : "Internal"}</Tag></td>
                      <td className="mono small">{r.default_branch}</td>
                      <td className="small muted"><Timestamp at={r.updated_at} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </ExecOnboarding>
  );
}
