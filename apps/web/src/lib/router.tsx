import { createContext, Fragment, useContext, useEffect, useMemo, useState } from "react";
import type { AnchorHTMLAttributes, ReactNode } from "react";

// ハッシュ方式のルーター。サーバー設定なしで全画面を表示するためのもの。
// 本番の画面遷移は移植先（Rust側）で置き換える前提で、画面は path と params だけに依存する。

export type Priority = "Must" | "Should" | "Later";

export type ScreenDef = {
  /** 画面ID（例: R-01） */
  id: string;
  /** 画面名 */
  title: string;
  /** ルートのパターン。:name がパラメータ */
  path: string;
  /** 画面群（第6章の節名） */
  group: string;
  priority: Priority;
  /** ?state= で切り替えられる画面の状態。先頭が既定 */
  states?: string[];
  render: (params: Record<string, string>) => ReactNode;
};

type RouteState = {
  path: string;
  query: URLSearchParams;
  params: Record<string, string>;
  screen: ScreenDef | null;
};

const RouteContext = createContext<RouteState>({
  path: "/",
  query: new URLSearchParams(),
  params: {},
  screen: null,
});

function readHash() {
  const raw = window.location.hash.replace(/^#/, "") || "/";
  const [path, search = ""] = raw.split("?");
  return { path: path || "/", query: new URLSearchParams(search) };
}

function match(pattern: string, path: string): Record<string, string> | null {
  const p = pattern.split("/").filter(Boolean);
  const s = path.split("/").filter(Boolean);
  if (p.length !== s.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < p.length; i += 1) {
    if (p[i].startsWith(":")) params[p[i].slice(1)] = decodeURIComponent(s[i]);
    else if (p[i] !== s[i]) return null;
  }
  return params;
}

function specificity(pattern: string) {
  return pattern.split("/").filter(Boolean).reduce((n, seg) => n + (seg.startsWith(":") ? 1 : 3), 0);
}

export function resolve(screens: ScreenDef[], path: string) {
  const sorted = [...screens].sort((a, b) => specificity(b.path) - specificity(a.path));
  for (const screen of sorted) {
    const params = match(screen.path, path);
    if (params) return { screen, params };
  }
  return null;
}

export function Router({ screens, fallback, children }: { screens: ScreenDef[]; fallback: ReactNode; children?: ReactNode }) {
  const [loc, setLoc] = useState(readHash);
  useEffect(() => {
    const onChange = () => {
      setLoc(readHash());
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  const found = useMemo(() => resolve(screens, loc.path), [screens, loc.path]);
  const value: RouteState = {
    path: loc.path,
    query: loc.query,
    params: found?.params ?? {},
    screen: found?.screen ?? null,
  };
  useEffect(() => {
    document.title = found ? `${found.screen.title} | Product Name` : "Product Name";
  }, [found]);
  return (
    <RouteContext.Provider value={value}>
      {found ? <Fragment key={`${found.screen.id}|${loc.path}|${loc.query.get("state") ?? ""}`}>{found.screen.render(found.params)}</Fragment> : fallback}
      {children}
    </RouteContext.Provider>
  );
}

export function useRoute() {
  return useContext(RouteContext);
}

/** 画面の状態（?state=）。未指定なら既定の状態を返す */
export function useScreenState(): string {
  const { query, screen } = useRoute();
  return query.get("state") ?? screen?.states?.[0] ?? "default";
}

export function href(to: string) {
  return `#${to}`;
}

export function navigate(to: string) {
  window.location.hash = to;
}

export function setScreenState(state: string) {
  const { path, query } = readHash();
  query.set("state", state);
  navigate(`${path}?${query.toString()}`);
}

export function Link({ to, children, ...rest }: { to: string; children: ReactNode } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  return (
    <a href={href(to)} {...rest}>
      {children}
    </a>
  );
}

/** パターンにパラメータを埋めてパスを作る */
export function pathOf(pattern: string, params: Record<string, string>) {
  return pattern.replace(/:([a-zA-Z]+)/g, (_, key: string) => encodeURIComponent(params[key] ?? key));
}
