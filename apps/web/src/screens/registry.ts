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
  "開発用",
];

export const screens: ScreenDef[] = [
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
  ...devScreens,
];
