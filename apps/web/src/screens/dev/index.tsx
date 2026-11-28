import { useState } from "react";
import type { ScreenDef } from "../../lib/router";
import { Link, pathOf } from "../../lib/router";
import { ORG, PROJECT, paths } from "../../lib/paths";
import { App as LegacyDemo } from "../../App";
import { Brand, cx, SearchBox, Segmented, Tag, ThemeToggle } from "../../ui";
import { Catalog } from "./Catalog";
import { GROUP_ORDER, screens } from "../registry";

/** パターンに既定のパラメータを入れて、実際に開けるパスにする */
function samplePath(pattern: string) {
  return pathOf(pattern, { org: ORG, project: PROJECT, id: "", pack: "basic", run: "run-5821", token: "tk_8f2a91c0d4e7" })
    .replace(/\/requirements\/$/, "/requirements/REQ-0007")
    .replace(/\/$/, "");
}

const SAMPLE_IDS: Record<string, string> = {
  "J-02": "SOW-3",
  "J-06": "RSK-011",
  "J-08": "CR-0004",
  "J-09": "MTG-12",
  "R-02": "REQ-0007",
  "R-03": "REQ-0007",
  "D-02": "ADR-0003",
  "E-03": "EXC-0008",
  "L-02": "rel-140",
  "L-03": "rel-140",
  "V-02": "CTL-SI-005",
  "V-04": "MAN-0013",
  "C-05": "MIG-002",
  "X-02": "APR-499",
  "X-03": "rel-121",
  "P-09": "case-1",
  "M-02": "DEC-0031",
  "M-06": "BC-0007",
  "M-11": "BEN-0001",
  "K-03": "con-gh",
  "N-02": "ch-slack-exec",
  "N-07": "INC-0112",
  "R-05": "REQ-0007",
};

export function openPath(s: ScreenDef) {
  const id = SAMPLE_IDS[s.id] ?? "sample";
  return pathOf(s.path, { org: ORG, project: PROJECT, id, pack: "basic", run: "run-5821", token: "tk_8f2a91c0d4e7" });
}

function ScreensIndex() {
  const [q, setQ] = useState("");
  const [prio, setPrio] = useState("all");
  const list = screens.filter((s) => s.group !== "開発用" && (prio === "all" || s.priority === prio) && `${s.id} ${s.title}`.toLowerCase().includes(q.toLowerCase()));
  const counts = { Must: screens.filter((s) => s.priority === "Must").length, Should: screens.filter((s) => s.priority === "Should").length, Later: screens.filter((s) => s.priority === "Later").length };
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-subtle)" }}>
      <header className="global-header" style={{ gridTemplateColumns: "auto 1fr auto" }}>
        <Brand to={paths.screens()} />
        <span className="small muted">画面一覧（モック） · 全{screens.length - devScreens.length}画面 · Must {counts.Must} / Should {counts.Should} / Later {counts.Later}</span>
        <div className="row">
          <Link to={paths.catalog()} className="btn secondary sm">部品カタログ</Link>
          <ThemeToggle />
        </div>
      </header>
      <main className="container" style={{ padding: "24px 24px 64px", display: "flex", flexDirection: "column", gap: 20 }}>
        <div className="row between">
          <SearchBox placeholder="画面IDまたは画面名" value={q} onChange={setQ} width={320} />
          <Segmented value={prio} onChange={setPrio} options={[{ value: "all", label: "すべて" }, { value: "Must", label: "Must" }, { value: "Should", label: "Should" }, { value: "Later", label: "Later" }]} />
        </div>
        {GROUP_ORDER.filter((g) => g !== "開発用").map((g) => {
          const items = list.filter((s) => s.group === g);
          if (!items.length) return null;
          return (
            <section key={g} className="stack" style={{ ["--gap" as string]: "10px" }}>
              <h2 className="section-title">{g}</h2>
              <div className="grid cols-3">
                {items.map((s) => (
                  <Link key={s.id} to={openPath(s)} className="card tight interactive" style={{ textDecoration: "none", color: "inherit" }}>
                    <div className="row between">
                      <span className="page-id mono" style={{ fontSize: 11, padding: "2px 8px", borderRadius: 999, background: "var(--primary-tint)", color: "var(--primary)", fontWeight: 700 }}>{s.id}</span>
                      <Tag tone={s.priority === "Must" ? "primary" : "neutral"} square>{s.priority}</Tag>
                    </div>
                    <div className="strong" style={{ marginTop: 8 }}>{s.title}</div>
                    {s.states && s.states.length > 1 ? (
                      <div className={cx("tiny muted")} style={{ marginTop: 4 }}>状態: {s.states.join(" / ")}</div>
                    ) : null}
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </main>
    </div>
  );
}

export const devScreens: ScreenDef[] = [
  { id: "DEV-01", title: "画面一覧", path: paths.screens(), group: "開発用", priority: "Must", render: () => <ScreensIndex /> },
  { id: "DEV-02", title: "部品カタログ", path: paths.catalog(), group: "開発用", priority: "Must", render: () => <Catalog /> },
  { id: "DEV-03", title: "ローカルデモ（CIゲート判定）", path: paths.demo(), group: "開発用", priority: "Must", render: () => <LegacyDemo /> },
];

export { samplePath };
