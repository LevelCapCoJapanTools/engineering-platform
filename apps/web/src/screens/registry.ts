// 全画面の登録。画面群ごとの index.tsx が ScreenDef の配列を返す。
import type { ScreenDef } from "../lib/router";
import { publicScreens } from "./public";
import { authScreens } from "./auth";
import { orgScreens } from "./org";
import { planningScreens } from "./planning";
import { requirementScreens } from "./requirements";
import { gateScreens } from "./gates";
import { releaseScreens } from "./releases";
import { auditScreens } from "./audit";
import { policyScreens } from "./policy";
import { settingsScreens } from "./settings";
import { externalScreens } from "./external";
import { systemScreens } from "./system";
import { devScreens } from "./dev";
import { executiveScreens } from "./executive";
import { portfolioScreens } from "./portfolio";
import { connectorScreens } from "./connectors";
import { notifyScreens } from "./notify";
import { freelancerScreens } from "./freelancer";
import { deskScreens } from "./desk";
import { orderScreens } from "./orders";
import { disclosureScreens } from "./disclosure";
import { contractScreens } from "./contracts";
import { appHandoverScreens } from "./apphandover";
import { deliveryScreens } from "./delivery";

export const GROUP_ORDER = [
  "6.1 公開サイト",
  "6.2 認証とオンボーディング",
  "6.3 組織の画面",
  "6.4 プロジェクト: 計画と管理",
  "6.5 プロジェクト: 要求・設計・トレーサビリティ",
  "6.6 プロジェクト: ゲート・PR・例外",
  "6.7 プロジェクト: リリースと受入",
  "6.8 証跡と監査",
  "6.9 ポリシーと Control Pack",
  "6.10 設定",
  "6.11 外部利用者向け",
  "6.12 共通の状態画面",
  "6.13 Web以外の表示面",
  "6.14 経営: ダッシュボードと判断",
  "6.15 経営: 投資と配分",
  "6.16 連携と同期",
  "6.17 通知とオンコール",
  "6.18 フリーエンジニア",
  "6.19 案件窓口",
  "6.20 受託者への発注と採算",
  "6.21 顧客への公開と共同経営",
  "6.22 契約と知的資産",
  "6.23 アプリの配信名義と引き渡し",
  "6.24 提出から配備・受入まで",
  "開発用",
];

export const screens: ScreenDef[] = [
  ...executiveScreens,
  ...portfolioScreens,
  ...publicScreens,
  ...authScreens,
  ...orgScreens,
  ...planningScreens,
  ...requirementScreens,
  ...gateScreens,
  ...releaseScreens,
  ...auditScreens,
  ...policyScreens,
  ...settingsScreens,
  ...externalScreens,
  ...systemScreens,
  ...connectorScreens,
  ...notifyScreens,
  ...freelancerScreens,
  ...deskScreens,
  ...orderScreens,
  ...disclosureScreens,
  ...contractScreens,
  ...appHandoverScreens,
  ...deliveryScreens,
  ...devScreens,
];
