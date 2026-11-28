// 日時と数値の表示。モックの「現在」は 2026-11-27 10:30（日本時間）に固定する。
export const NOW = new Date("2026-11-27T10:30:00+09:00");

const dateTimeFmt = new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tokyo" });
const dateFmt = new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "Asia/Tokyo" });

export function formatDateTime(iso: string) {
  if (!iso) return "—";
  return `${dateTimeFmt.format(new Date(iso))} JST`;
}

export function formatDate(iso: string) {
  if (!iso || iso === "-") return "—";
  return dateFmt.format(new Date(iso.length === 10 ? `${iso}T00:00:00+09:00` : iso));
}

export function relativeTime(iso: string) {
  if (!iso) return "—";
  const diff = (NOW.getTime() - new Date(iso).getTime()) / 1000;
  if (diff < 0) return formatDate(iso);
  if (diff < 60) return "たった今";
  if (diff < 3600) return `${Math.floor(diff / 60)}分前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}時間前`;
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400)}日前`;
  return formatDate(iso);
}

/** 期限までの日数。今日なら0、過ぎていれば負 */
export function daysUntil(date: string) {
  const d = new Date(date.length === 10 ? `${date}T23:59:59+09:00` : date);
  const today = new Date("2026-11-27T00:00:00+09:00");
  return Math.floor((d.getTime() - today.getTime()) / 86400000);
}

export function percent(n: number, total: number) {
  if (total === 0) return 0;
  return Math.round((n / total) * 100);
}

export function yen(n: number) {
  return `¥${n.toLocaleString("ja-JP")}`;
}

/** 2つの日付の差（日）。b が a より後なら正 */
export function daysBetween(a: string, b: string) {
  const d = (x: string) => new Date(x.length === 10 ? `${x}T00:00:00+09:00` : x).getTime();
  return Math.round((d(b) - d(a)) / 86400000);
}

/** 最終同期からの経過分 */
export function minutesSince(iso?: string) {
  if (!iso) return Infinity;
  return Math.floor((NOW.getTime() - new Date(iso).getTime()) / 60000);
}

/** 百万円単位の短い表記（経営向け） */
export function yenM(n: number) {
  return `${(n / 1_000_000).toLocaleString("ja-JP", { maximumFractionDigits: 1 })}百万円`;
}
