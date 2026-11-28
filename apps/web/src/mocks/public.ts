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

/** 課金は経営層（直接利用者）のシートとプロジェクト数。開発者など、外部IDで記録するアクターは課金対象外 */
export const plans: Plan[] = [
  { key: "starter", name: "Starter", target: "経営者と少数の案件から始める会社", monthly: 49800, yearlyMonthly: 41500, features: ["経営層 2 シート", "プロジェクト 3 件", "計画・カレンダーの同期", "経営判断の記録", "ゲートと標準の証跡（署名付き）"], cta: "試用を始める" },
  { key: "team", name: "Team", target: "複数案件を並行する開発会社", monthly: 99800, yearlyMonthly: 83200, features: ["経営層 5 シート", "プロジェクト 10 件", "Starter のすべて", "投資と配分（事業ケース・優先順位・要員・予算）", "WORM 保管、監査ダッシュボード、SSO"], cta: "試用を始める", featured: true },
  { key: "partner", name: "Partner", target: "複数の顧客組織を支援するコンサル・SIer", monthly: 198000, yearlyMonthly: 165000, priceNote: "〜", features: ["経営層 15 シート", "委任された組織の横断管理", "テーラリングのひな形管理", "評価者向けエクスポート", "Team のすべて"], cta: "試用を始める" },
  { key: "private", name: "Private", target: "機密コードを扱う組織", monthly: null, yearlyMonthly: null, priceNote: "年額 ¥1.5M〜¥3.0M〜", features: ["VPC／オンプレミスでの実行", "閉域モデルでの AI 実行", "SLA", "Partner のすべて"], cta: "お問い合わせ" },
];

export const comparison: { label: string; values: (string | boolean)[] }[] = [
  { label: "経営層シート", values: ["2", "5", "15", "個別"] },
  { label: "プロジェクト数", values: ["3", "10", "50", "無制限"] },
  { label: "開発者・PM・QA・顧客（外部IDで記録）", values: ["課金なし", "課金なし", "課金なし", "課金なし"] },
  { label: "計画・カレンダーの同期", values: [true, true, true, true] },
  { label: "コードホスティング（GitHub、GitLab、CodeCommit、Azure Repos）", values: [true, true, true, true] },
  { label: "チャット通知", values: ["2 チャネル", true, true, true] },
  { label: "オンコール連携（PagerDuty）", values: [false, true, true, true] },
  { label: "投資と配分", values: [false, true, true, true] },
  { label: "AI要求レビュー・経営向けの要約", values: [true, true, true, true] },
  { label: "WORM 保管", values: [false, true, true, true] },
  { label: "監査ダッシュボード", values: [false, true, true, true] },
  { label: "SSO（SAML）", values: [false, true, true, true] },
  { label: "複数組織の管理", values: [false, false, true, true] },
  { label: "閉域実行", values: [false, false, false, true] },
  { label: "SLA", values: [false, false, false, true] },
];

export const services = [
  { name: "追加の経営層シート・プロジェクト", price: "¥9,800／シート・月、¥8,000／プロジェクト・月", body: "プランの上限を超えて利用者や案件を増やせます。上限に達しても記録済みの証跡は失われません。" },
  { name: "プロジェクト単位の契約", price: "¥80,000〜¥200,000／プロジェクト", body: "月額プランの代わりに、案件ごとに契約できます。受託案件の期間だけ使いたい場合に向いています。" },
  { name: "導入支援", price: "¥200,000〜¥800,000", body: "現在の開発プロセスと成果物を Control Pack に対応付け、既存リポジトリの移行を支援します。" },
  { name: "事前点検", price: "¥300,000〜¥1,000,000／回", body: "第三者評価の前に、統制項目と証跡の充足状況を点検します。認証ではありません。" },
];

export const faqs = [
  { q: "このサービスを使うと認証を取得できますか？", a: "いいえ。本サービスは ISO/IEC 29110 の適合準備を支援するもので、認証は第三者の認証機関が行います。" },
  { q: "AI が適合・不適合を判定するのですか？", a: "いいえ。ゲートの判定は決定論的なルールと人間の承認で行います。AI の出力は参考所見として表示し、判定には使いません。" },
  { q: "顧客のコードが AI の学習に使われますか？", a: "使われません。学習利用なしの契約があるモデルのみを使い、データ分類によっては外部へ送信しません。AI 機能はいつでも無効にできます。" },
  { q: "開発者や PM の分も料金がかかりますか？", a: "かかりません。料金は経営層など、このサービスに直接サインインする人のシートとプロジェクト数で決まります。開発者・PM・QA・顧客は既存のツールの外部IDで記録し、アカウントは不要です。" },
  { q: "GitLab や AWS CodeCommit、Azure Repos には対応していますか？", a: "GitHub に加えて、GitLab、AWS CodeCommit、Azure Repos に対応しています（一部ベータ）。プロバイダーごとにできることが異なるため、連携の画面で能力の違いを表示します。" },
  { q: "上限に達するとデータが消えますか？", a: "消えません。証跡、監査ログ、ゲートの判定は保持されます。止まるのは新しい利用者・プロジェクトの追加や、AI 機能などに限られます。" },
  { q: "途中でプランを変更できますか？", a: "いつでも変更できます。変更は次回の請求から反映されます。" },
];

export type CaseStudy = { id: string; company: string; size: string; industry: string; title: string; metrics: { label: string; value: string }[]; summary: string };

export const cases: CaseStudy[] = [
  { id: "case-1", company: "A社（架空）", size: "従業員 18名", industry: "受託開発（流通向け）", title: "監査前の証拠集めがなくなった", metrics: [{ label: "証跡準備時間", value: "-62%" }, { label: "PRのリードタイム増分", value: "+3%" }], summary: "PRごとに証跡が自動で残るようになり、顧客への品質説明を監査パック1つで行えるようになりました。" },
  { id: "case-2", company: "B社（架空）", size: "従業員 9名", industry: "受託開発（医療周辺）", title: "要求とテストのつながりを可視化", metrics: [{ label: "トレーサビリティ", value: "100%" }, { label: "レビュー時間", value: "-35%" }], summary: "承認済みの要求がテストまでつながっていない箇所を、マージ前に検出できるようになりました。" },
  { id: "case-3", company: "C社（架空）", size: "従業員 24名", industry: "SaaS 開発", title: "警告モードから段階的に導入", metrics: [{ label: "例外率", value: "3.1%" }, { label: "誤ブロック率", value: "4%" }], summary: "最初の1か月は警告のみで運用し、チームが慣れてからハードに切り替えました。" },
];
