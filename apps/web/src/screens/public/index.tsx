import type { ScreenDef } from "../../lib/router";
import { paths } from "../../lib/paths";
import { P01Top } from "./P01_Top";
import { P02Features } from "./P02_Features";
import { P03Pricing } from "./P03_Pricing";
import { P04Security } from "./P04_Security";
import { P05Standards } from "./P05_Standards";
import { P06Contact } from "./P06_Contact";
import { P07Terms } from "./P07_Terms";
import { P08Privacy } from "./P08_Privacy";
import { P09CaseDetail, P09Cases } from "./P09_Cases";
import { P10Status } from "./P10_Status";
import { P11Support } from "./P11_Support";

const group = "6.1 公開サイト";

export const publicScreens: ScreenDef[] = [
  { id: "P-01", title: "トップ", path: paths.home(), group, priority: "Must", render: () => <P01Top /> },
  { id: "P-02", title: "機能紹介", path: paths.features(), group, priority: "Must", render: () => <P02Features /> },
  { id: "P-03", title: "料金", path: paths.pricing(), group, priority: "Must", render: () => <P03Pricing /> },
  { id: "P-04", title: "セキュリティとデータの扱い", path: paths.security(), group, priority: "Must", render: () => <P04Security /> },
  { id: "P-05", title: "規格との関係", path: paths.standards(), group, priority: "Must", render: () => <P05Standards /> },
  { id: "P-06", title: "お問い合わせ・PoC申込", path: paths.contact(), group, priority: "Must", states: ["入力済み", "入力", "入力エラー", "送信中", "送信完了", "送信失敗"], render: () => <P06Contact /> },
  { id: "P-07", title: "利用規約", path: paths.terms(), group, priority: "Must", render: () => <P07Terms /> },
  { id: "P-08", title: "プライバシーポリシー", path: paths.privacy(), group, priority: "Must", render: () => <P08Privacy /> },
  { id: "P-09", title: "導入事例", path: paths.cases(), group, priority: "Later", states: ["一覧", "空"], render: () => <P09Cases /> },
  { id: "P-10", title: "稼働状況", path: paths.status(), group, priority: "Should", states: ["正常", "障害発生中", "保守予定"], render: () => <P10Status /> },
  { id: "P-11", title: "サポート・脆弱性報告", path: paths.support(), group, priority: "Should", states: ["問い合わせ", "脆弱性の報告", "送信完了"], render: () => <P11Support /> },
  { id: "P-09D", title: "導入事例の詳細", path: paths.caseDetail(":id"), group, priority: "Later", render: (p) => <P09CaseDetail id={p.id} /> },
];
