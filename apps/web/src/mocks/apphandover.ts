// アプリの配信名義と引き渡しの架空データ（2026-11-28 追補、資料 6.I の 56〜60）。
// Apple 上で本人が行う手続き（アカウント作成、2ファクタ認証、本人確認、規約同意、購入、譲渡の開始・承諾）は
// 担当・期限・再開先だけを持ち、認証コード・パスワード・本人確認書類・秘密鍵は保持しない。
// 基準日は 2026-11-27。

/** 引き渡しの対象案件（業務提携型・架空リテール） */
export const HANDOVER_PROJECT = "member-app-api";

export type HandoverMethod = "newCustomer" | "sameTeam" | "transfer";

export const HANDOVER_METHODS: Record<HandoverMethod, { label: string; when: string; description: string }> = {
  newCustomer: {
    label: "顧客名義での新規公開",
    when: "まだ公開していないアプリを、最初から顧客のチームで配信する",
    description: "顧客が自社名義でチームを用意し、JV の作業者を招待します。最初から顧客のチームで配信するため、アプリの譲渡は発生しません。",
  },
  sameTeam: {
    label: "同一チームでの担当交代",
    when: "顧客のチームで配信済みのアプリを、担当する開発会社だけ入れ替える",
    description: "顧客のチームに新しい作業者を招待し、前任の作業者の権限を外します。アプリの所属は変わりません。",
  },
  transfer: {
    label: "別チームからのアプリ移管",
    when: "前任の開発会社などのチームで公開済みのアプリを、顧客のチームへ移す",
    description: "譲渡元と譲渡先のチームの Account Holder が、それぞれ Apple 上で開始と承諾を行います。譲渡の条件と、利用中の機能ごとの移行作業を先に確認します。",
  },
};

/** 配信名義の確認結果（Q-01） */
export const distribution = {
  app_name: "架空リテール 会員アプリ",
  platform: "iOS",
  bundle_id: "jp.example.kakuuretail.member",
  publisher: "架空リテール株式会社",
  enrollment: "enrolling" as "enrolled" | "enrolling" | "notStarted",
  existing_app: false,
  released: false,
  method: "newCustomer" as HandoverMethod,
  decided_by: "u-fujii",
  decided_at: "2026-11-20T15:00:00+09:00",
  planned_release: "2027-01-29",
};

export type HandoverTask = {
  id: string;
  title: string;
  where: "service" | "apple" | "customerEnv";
  owner: string;
  owner_side: "customer" | "jv" | "desk";
  due: string;
  status: "done" | "inProgress" | "waitingApple" | "notStarted" | "blocked";
  note?: string;
};

export const TASK_STATUS: Record<HandoverTask["status"], { label: string; tone: "pass" | "info" | "warn" | "neutral" | "fail" }> = {
  done: { label: "完了", tone: "pass" },
  inProgress: { label: "対応中", tone: "info" },
  waitingApple: { label: "Apple の確認待ち", tone: "warn" },
  notStarted: { label: "未着手", tone: "neutral" },
  blocked: { label: "止まっている", tone: "fail" },
};

export const WHERE_LABEL: Record<HandoverTask["where"], string> = {
  service: "本サービス",
  apple: "Apple 上（本人が操作）",
  customerEnv: "顧客の環境",
};

/** 方式ごとの作業表 */
export const handoverTasks: Record<HandoverMethod, HandoverTask[]> = {
  newCustomer: [
    { id: "T-01", title: "配信する法人とアプリ名義を決める", where: "service", owner: "u-fujii", owner_side: "customer", due: "2026-11-20", status: "done" },
    { id: "T-02", title: "組織登録に必要な情報をそろえる（法人名、D-U-N-S 番号、Web サイト、組織のメール）", where: "service", owner: "u-fujii", owner_side: "customer", due: "2026-11-25", status: "done" },
    { id: "T-03", title: "Apple Developer Program に組織として申し込む", where: "apple", owner: "u-fujii", owner_side: "customer", due: "2026-12-04", status: "waitingApple", note: "申請済み。Apple の確認結果を待っています" },
    { id: "T-04", title: "加入の確認を記録する（チーム名と確認日）", where: "service", owner: "u-aoki", owner_side: "desk", due: "2026-12-08", status: "notStarted" },
    { id: "T-05", title: "JV の作業者を顧客のチームに招待する", where: "service", owner: "u-fujii", owner_side: "customer", due: "2026-12-11", status: "notStarted", note: "招待の作成は承認された宛先・役割で本サービスが行います" },
    { id: "T-06", title: "初回ビルドをアップロードして審査に提出する", where: "apple", owner: "u-matsuda", owner_side: "jv", due: "2027-01-15", status: "notStarted" },
    { id: "T-07", title: "運用の権限を顧客に引き渡し、JV の一時権限を外す", where: "customerEnv", owner: "u-mori", owner_side: "jv", due: "2027-02-05", status: "notStarted" },
  ],
  sameTeam: [
    { id: "S-01", title: "顧客のチームの権限者が、新しい作業者の宛先と役割を承認する", where: "service", owner: "u-fujii", owner_side: "customer", due: "2026-12-04", status: "inProgress" },
    { id: "S-02", title: "新しい作業者を招待する", where: "service", owner: "u-aoki", owner_side: "desk", due: "2026-12-06", status: "notStarted" },
    { id: "S-03", title: "新しい作業者が本人の Apple Account で参加する", where: "apple", owner: "u-matsuda", owner_side: "jv", due: "2026-12-10", status: "notStarted" },
    { id: "S-04", title: "前任の作業者の権限を外す", where: "apple", owner: "u-fujii", owner_side: "customer", due: "2026-12-15", status: "notStarted" },
    { id: "S-05", title: "運用の権限と連絡先を更新する", where: "customerEnv", owner: "u-mori", owner_side: "jv", due: "2026-12-20", status: "notStarted" },
  ],
  transfer: [
    { id: "R-01", title: "譲渡の条件を確認する", where: "service", owner: "u-aoki", owner_side: "desk", due: "2026-12-04", status: "inProgress" },
    { id: "R-02", title: "利用中の機能ごとの移行作業を確認する", where: "service", owner: "u-matsuda", owner_side: "jv", due: "2026-12-08", status: "notStarted" },
    { id: "R-03", title: "譲渡元のチームで譲渡を開始する", where: "apple", owner: "u-ext-holder", owner_side: "customer", due: "2026-12-11", status: "notStarted" },
    { id: "R-04", title: "譲渡先（顧客）のチームで譲渡を承諾する", where: "apple", owner: "u-fujii", owner_side: "customer", due: "2026-12-14", status: "notStarted" },
    { id: "R-05", title: "アプリが顧客のチームに属することを確認する", where: "service", owner: "u-aoki", owner_side: "desk", due: "2026-12-16", status: "notStarted" },
    { id: "R-06", title: "運用の権限を顧客に引き渡す", where: "customerEnv", owner: "u-mori", owner_side: "jv", due: "2026-12-25", status: "notStarted" },
  ],
};

/** 譲渡元の Account Holder（架空。本サービスの利用者ではない） */
export const EXTERNAL_HOLDER = { id: "u-ext-holder", name: "旧開発会社の Account Holder（架空）" };

/** 組織登録の確認項目（Q-02）。where=apple は顧客本人が Apple 上で行い、本サービスは案内と期限だけ持つ */
export type EnrollmentItem = {
  id: string;
  title: string;
  where: "service" | "apple";
  owner: string;
  due: string;
  status: "ok" | "pending" | "missing";
  detail: string;
  resume?: string;
};

export const enrollmentItems: EnrollmentItem[] = [
  { id: "EN-1", title: "登録する法人名（登記上の名称）", where: "service", owner: "u-fujii", due: "2026-11-25", status: "ok", detail: "架空リテール株式会社（登記の名称と一致）" },
  { id: "EN-2", title: "D-U-N-S 番号", where: "service", owner: "u-fujii", due: "2026-11-25", status: "ok", detail: "組織として登録するため必要。番号は顧客が保有済み（本サービスには末尾4桁のみ記録）" },
  { id: "EN-3", title: "組織の Web サイト", where: "service", owner: "u-fujii", due: "2026-11-25", status: "ok", detail: "誰でも閲覧でき、法人名と一致する公式サイト" },
  { id: "EN-4", title: "組織のドメインのメールアドレス", where: "service", owner: "u-fujii", due: "2026-11-25", status: "ok", detail: "個人のフリーメールではなく、組織のドメインのアドレス" },
  { id: "EN-5", title: "契約を結ぶ権限のある申請者", where: "service", owner: "u-fujii", due: "2026-11-25", status: "ok", detail: "デジタル推進室長 藤井 晃（社内規程で契約権限あり。根拠は顧客の管理者が確認）" },
  { id: "EN-6", title: "申請者の Apple Account の作成と2ファクタ認証", where: "apple", owner: "u-fujii", due: "2026-11-27", status: "ok", detail: "顧客本人が Apple 上で設定済み。本サービスはコードやパスワードを受け取りません", resume: "Apple Developer のサイトでサインイン" },
  { id: "EN-7", title: "申請・本人確認・規約への同意", where: "apple", owner: "u-fujii", due: "2026-12-04", status: "pending", detail: "申請済み。Apple から確認の連絡が来ることがあります", resume: "Apple Developer のアカウント画面" },
  { id: "EN-8", title: "年会費の支払い（加入の手続き）", where: "apple", owner: "u-fujii", due: "2026-12-08", status: "pending", detail: "Apple の確認後に顧客が手続きします", resume: "Apple Developer のアカウント画面" },
];

/** 加入確認の根拠（Q-02、加入済みの場合） */
export const enrollmentEvidence = {
  team_name: "Kakuu Retail Co., Ltd.",
  team_id_suffix: "…7Q2M",
  confirmed_by: "u-fujii",
  confirmed_at: "2026-12-07T10:00:00+09:00",
  method: "顧客の管理者が App Store Connect のチーム情報の画面を共有し、案件窓口が名称と Team ID の末尾を照合",
  recorded_by: "u-aoki",
};

/** App Store Connect の作業者招待（Q-03） */
export type AscInvitation = {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "App Manager" | "Developer" | "Marketing" | "Customer Support";
  apps: "全アプリ" | "会員アプリのみ";
  approved_by?: string;
  approved_at?: string;
  state: "awaitingApproval" | "pending" | "accepted" | "revoked" | "expired" | "reconciling";
  created_at?: string;
  expires_at?: string;
  note?: string;
};

export const INVITATION_STATE: Record<AscInvitation["state"], { label: string; tone: "pass" | "info" | "warn" | "neutral" | "fail" }> = {
  awaitingApproval: { label: "顧客の承認待ち", tone: "warn" },
  pending: { label: "招待中（未処理）", tone: "info" },
  accepted: { label: "参加済み", tone: "pass" },
  revoked: { label: "取消済み", tone: "neutral" },
  expired: { label: "期限切れ", tone: "neutral" },
  reconciling: { label: "照合中", tone: "warn" },
};

/** 対象アプリを限定できない役割（自分の言葉での説明） */
export const ROLE_SCOPE: Record<AscInvitation["role"], { appScoped: boolean; note: string }> = {
  Admin: { appScoped: false, note: "チームのすべてのアプリと利用者の管理に及びます。対象アプリを限定できません" },
  "App Manager": { appScoped: true, note: "指定したアプリの管理に限定できます" },
  Developer: { appScoped: true, note: "指定したアプリのビルドと試験に限定できます" },
  Marketing: { appScoped: true, note: "指定したアプリの掲載情報に限定できます" },
  "Customer Support": { appScoped: true, note: "指定したアプリのレビュー対応に限定できます" },
};

export const ascInvitations: AscInvitation[] = [
  { id: "INV-01", name: "松田 亮", email: "matsuda@freelance.example", role: "Developer", apps: "会員アプリのみ", approved_by: "u-fujii", approved_at: "2026-12-08T10:00:00+09:00", state: "pending", created_at: "2026-12-08T10:05:00+09:00", expires_at: "2026-12-15", note: "招待メールの承諾待ち" },
  { id: "INV-02", name: "森 由紀子", email: "mori@sample-soft.example", role: "App Manager", apps: "会員アプリのみ", approved_by: "u-fujii", approved_at: "2026-12-08T10:00:00+09:00", state: "accepted", created_at: "2026-12-08T10:05:00+09:00" },
  { id: "INV-03", name: "青木 さくら", email: "desk@product.example", role: "Customer Support", apps: "会員アプリのみ", state: "awaitingApproval", note: "顧客の権限者の承認後に作成します" },
  { id: "INV-04", name: "渡辺 翔", email: "watanabe@sample-soft.example", role: "Developer", apps: "会員アプリのみ", approved_by: "u-fujii", approved_at: "2026-12-08T10:00:00+09:00", state: "reconciling", created_at: "2026-12-08T10:05:00+09:00", note: "未処理の招待一覧から消えました。チームの所属一覧と照合中です" },
  { id: "INV-05", name: "鈴木 彩", email: "suzuki@sample-soft.example", role: "Developer", apps: "会員アプリのみ", approved_by: "u-fujii", state: "revoked", created_at: "2026-12-01T10:00:00+09:00", note: "担当変更のため取消（取消者: 藤井 晃）" },
];

/** 移管の条件（Q-04）。Apple の規約の本文ではなく、確認する観点を自社の言葉で書く */
export type TransferCheck = { id: string; title: string; status: "ok" | "ng" | "pending"; detail: string };

export const transferApp = {
  name: "架空リテール ポイントカード",
  bundle_id: "jp.example.kakuuretail.points",
  from_team: "旧開発会社のチーム（架空）",
  to_team: "Kakuu Retail Co., Ltd.",
  released_versions: 7,
};

export const transferChecks: TransferCheck[] = [
  { id: "TC-1", title: "対象アプリが App Store で1つ以上のバージョンを公開済み", status: "ok", detail: "公開済みのバージョンが7つあります" },
  { id: "TC-2", title: "譲渡元と譲渡先のチームの契約が有効", status: "ok", detail: "両チームの Account Holder が確認" },
  { id: "TC-3", title: "譲渡元に審査中・未完了の手続きが残っていない", status: "pending", detail: "審査中のバージョン 7.2.1 の結果待ち" },
  { id: "TC-4", title: "利用中の機能ごとの移行作業を確認済み", status: "pending", detail: "下の表で確認中" },
];

export const transferFeatures: { feature: string; migration: string; owner: string; status: "done" | "inProgress" | "notStarted" }[] = [
  { feature: "プッシュ通知", migration: "譲渡先のチームで通知用の鍵を作り直し、サーバーの設定を更新する", owner: "u-matsuda", status: "inProgress" },
  { feature: "App 内課金", migration: "譲渡後に課金の設定と税務・口座の情報を譲渡先で確認する", owner: "u-fujii", status: "notStarted" },
  { feature: "Apple でサインイン", migration: "利用者の識別子の移行手順を確認し、移行期間を決める", owner: "u-matsuda", status: "notStarted" },
  { feature: "共有の保存領域（App Groups）", migration: "譲渡先のチームの識別子で作り直す", owner: "u-matsuda", status: "notStarted" },
];

/** 運用権限の引き渡し（Q-05）。秘密値は持たず、誰が持つかと確認結果だけを記録する */
export type OperationAsset = {
  id: string;
  asset: string;
  kind: "store" | "cloud" | "domain" | "alerting" | "credential" | "billing";
  from: string;
  to: string;
  action: string;
  status: "done" | "inProgress" | "notStarted";
  due: string;
  verification?: string;
};

export const operationAssets: OperationAsset[] = [
  { id: "OP-1", asset: "App Store Connect（会員アプリ）", kind: "store", from: "JV の一時的な作業者権限", to: "u-fujii", action: "顧客の担当者が自社の権限で次の版をアップロードできることを確認する", status: "inProgress", due: "2027-02-05", verification: "次の版のアップロード" },
  { id: "OP-2", asset: "クラウド（本番の AWS アカウント）", kind: "cloud", from: "JV の運用担当", to: "架空リテール 情報システム部", action: "管理者権限を顧客の利用者に付け替え、JV の利用者を一時権限に変更する", status: "notStarted", due: "2027-02-05" },
  { id: "OP-3", asset: "ドメイン（member.kakuu-retail.example）", kind: "domain", from: "JV が代理で管理", to: "架空リテール 情報システム部", action: "登録者と DNS の管理を顧客のアカウントへ移す", status: "notStarted", due: "2027-02-12" },
  { id: "OP-4", asset: "障害通知（オンコールのサービス）", kind: "alerting", from: "JV の当番", to: "架空リテール 運用窓口", action: "通知先を顧客の当番に切り替え、試験通知の受信を確認する", status: "notStarted", due: "2027-02-05", verification: "試験通知の受信" },
  { id: "OP-5", asset: "証明書・鍵（配信用の証明書、通知用の鍵）", kind: "credential", from: "JV が作成", to: "u-fujii", action: "顧客のチームで再発行し、JV が作成した鍵を失効させる。鍵そのものは本サービスで扱わない", status: "notStarted", due: "2027-02-05" },
  { id: "OP-6", asset: "請求と更新（年会費、ドメイン、クラウド）", kind: "billing", from: "JV が立替", to: "架空リテール 経理部", action: "更新日と支払元を顧客に切り替える", status: "notStarted", due: "2027-02-28" },
];

export const temporaryGrants: { id: string; who: string; where: string; until: string; released: boolean }[] = [
  { id: "TG-1", who: "u-matsuda", where: "App Store Connect（Developer・会員アプリのみ）", until: "2027-02-05", released: false },
  { id: "TG-2", who: "u-mori", where: "App Store Connect（App Manager・会員アプリのみ）", until: "2027-02-05", released: false },
  { id: "TG-3", who: "u-watanabe", where: "AWS（運用の一時権限）", until: "2027-02-05", released: false },
];
