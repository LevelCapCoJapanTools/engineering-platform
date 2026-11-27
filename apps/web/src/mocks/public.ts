// 公開サイトのデータ（料金は仮。差し替えやすいようここに集約する）

export type Plan = {
  key: string;
  name: string;
  target: string;
  monthly: number | null;
  yearlyMonthly: number | null;
  priceNote?: string;
  features: string[];
  cta: string;
  featured?: boolean;
};

export const plans: Plan[] = [
  { key: "starter", name: "Starter", target: "最初の1案件から始めたいチーム", monthly: 49800, yearlyMonthly: 41500, features: ["リポジトリ 3 件まで", "Basic Control Pack", "CIゲート A〜D", "AI要求レビュー", "標準の証跡（署名付き）"], cta: "試用を始める" },
  { key: "team", name: "Team", target: "複数案件を並行する開発会社", monthly: 99800, yearlyMonthly: 83200, features: ["リポジトリ 10 件まで", "Starter のすべて", "WORM 保管", "監査ダッシュボード", "SSO（SAML）"], cta: "試用を始める", featured: true },
  { key: "partner", name: "Partner", target: "複数の顧客組織を支援するコンサル・SIer", monthly: 198000, yearlyMonthly: 165000, priceNote: "〜", features: ["複数組織の横断管理", "テーラリングのひな形管理", "評価者向けエクスポート", "Team のすべて"], cta: "試用を始める" },
  { key: "private", name: "Private", target: "機密コードを扱う組織", monthly: null, yearlyMonthly: null, priceNote: "年額 ¥1.5M〜¥3.0M〜", features: ["VPC／オンプレミスでの実行", "閉域モデルでの AI 実行", "SLA", "Partner のすべて"], cta: "お問い合わせ" },
];

export const comparison: { label: string; values: (string | boolean)[] }[] = [
  { label: "リポジトリ数", values: ["3", "10", "無制限", "無制限"] },
  { label: "AI要求レビュー", values: [true, true, true, true] },
  { label: "WORM 保管", values: [false, true, true, true] },
  { label: "監査ダッシュボード", values: [false, true, true, true] },
  { label: "SSO（SAML）", values: [false, true, true, true] },
  { label: "複数組織の管理", values: [false, false, true, true] },
  { label: "閉域実行", values: [false, false, false, true] },
  { label: "SLA", values: [false, false, false, true] },
];

export const services = [
  { name: "プロジェクト単位の契約", price: "¥80,000〜¥200,000／プロジェクト", body: "月額プランの代わりに、案件ごとに契約できます。受託案件の期間だけ使いたい場合に向いています。" },
  { name: "導入支援", price: "¥200,000〜¥800,000", body: "現在の開発プロセスと成果物を Control Pack に対応付け、既存リポジトリの移行を支援します。" },
  { name: "事前点検", price: "¥300,000〜¥1,000,000／回", body: "第三者評価の前に、統制項目と証跡の充足状況を点検します。認証ではありません。" },
];

export const faqs = [
  { q: "このサービスを使うと認証を取得できますか？", a: "いいえ。本サービスは ISO/IEC 29110 の適合準備を支援するもので、認証は第三者の認証機関が行います。" },
  { q: "AI が適合・不適合を判定するのですか？", a: "いいえ。ゲートの判定は決定論的なルールと人間の承認で行います。AI の出力は参考所見として表示し、判定には使いません。" },
  { q: "顧客のコードが AI の学習に使われますか？", a: "使われません。学習利用なしの契約があるモデルのみを使い、データ分類によっては外部へ送信しません。AI 機能はいつでも無効にできます。" },
  { q: "GitLab には対応していますか？", a: "現在は GitHub に対応しています。GitLab は今後対応予定です。" },
  { q: "途中でプランを変更できますか？", a: "いつでも変更できます。変更は次回の請求から反映されます。" },
];

export type CaseStudy = { id: string; company: string; size: string; industry: string; title: string; metrics: { label: string; value: string }[]; summary: string };

export const cases: CaseStudy[] = [
  { id: "case-1", company: "A社（架空）", size: "従業員 18名", industry: "受託開発（流通向け）", title: "監査前の証拠集めがなくなった", metrics: [{ label: "証跡準備時間", value: "-62%" }, { label: "PRのリードタイム増分", value: "+3%" }], summary: "PRごとに証跡が自動で残るようになり、顧客への品質説明を監査パック1つで行えるようになりました。" },
  { id: "case-2", company: "B社（架空）", size: "従業員 9名", industry: "受託開発（医療周辺）", title: "要求とテストのつながりを可視化", metrics: [{ label: "トレーサビリティ", value: "100%" }, { label: "レビュー時間", value: "-35%" }], summary: "承認済みの要求がテストまでつながっていない箇所を、マージ前に検出できるようになりました。" },
  { id: "case-3", company: "C社（架空）", size: "従業員 24名", industry: "SaaS 開発", title: "警告モードから段階的に導入", metrics: [{ label: "例外率", value: "3.1%" }, { label: "誤ブロック率", value: "4%" }], summary: "最初の1か月は警告のみで運用し、チームが慣れてからハードに切り替えました。" },
];
