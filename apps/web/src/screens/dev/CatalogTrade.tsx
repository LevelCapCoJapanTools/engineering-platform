// 部品カタログ 5.7 取引（2026-11-28 追補）
import type { ReactNode } from "react";
import { AudienceTag, Masked, NextActor, RelationshipTag, StatusBadge, TradeStateStrip, VersionPin } from "../../ui";
import {
  CONTRACT_STATUS,
  CUSTOMER_ACCEPTANCE,
  DEPLOY_STATUS,
  DISCLOSURE_STATUS,
  INQUIRY_STATUS,
  INSPECTION_STATUS,
  IP_DISPOSITION,
  ORDER_STATUS,
  PAYMENT_STATUS,
  SUBMISSION_STATUS,
} from "../../lib/vocab";
import type { Audience, StatusVocab } from "../../lib/vocab";
import { yen } from "../../lib/format";

export const TRADE_TOC = ["TradeStateStrip", "VersionPin", "AudienceTag", "RelationshipTag", "Masked", "NextActor", "vocab-trade"];

function Sec({ id, title, desc, children }: { id: string; title?: string; desc?: ReactNode; children: ReactNode }) {
  return (
    <section className="cat-sec" id={id}>
      <div className="cat-sec-head">
        <h3>{title ?? id}</h3>
        {desc ? <p>{desc}</p> : null}
      </div>
      <div className="cat-demo">{children}</div>
    </section>
  );
}

function Row({ label, children, block }: { label: ReactNode; children: ReactNode; block?: boolean }) {
  return (
    <div className={block ? "cat-demo-row block" : "cat-demo-row"}>
      <span className="cat-label">{label}</span>
      <div className="cat-body">{children}</div>
    </div>
  );
}

function VocabRow({ name, vocab }: { name: string; vocab: Record<string, StatusVocab> }) {
  return (
    <Row label={name}>
      <div className="row">{Object.entries(vocab).map(([k, v]) => <StatusBadge key={k} vocab={v} size="sm" />)}</div>
    </Row>
  );
}

export function TradeParts() {
  return (
    <>
      <h2 className="cat-group-title">5.7 取引（発注企業・受注側JV・フリーエンジニア）</h2>
      <Sec id="TradeStateStrip" desc="発注条件・提出・委託検収・配備・顧客受入・支払を別々に見せる。「委託検収済み・配備待ち・支払予定」は正常な組合せ">
        <Row label="検収中" block><TradeStateStrip order={{ status: "accepted", submission: "submitted", inspection: "inProgress", deploy: "notReady", customer_acceptance: "notRequested", payment: "notDue" }} /></Row>
        <Row label="検収済み・配備待ち" block><TradeStateStrip order={{ status: "accepted", submission: "submitted", inspection: "passed", deploy: "permitted", customer_acceptance: "notRequested", payment: "notDue" }} /></Row>
        <Row label="小" block><TradeStateStrip compact order={{ status: "completed", submission: "submitted", inspection: "passed", deploy: "succeeded", customer_acceptance: "accepted", payment: "paid" }} /></Row>
      </Sec>
      <Sec id="VersionPin" desc="受諾・承認は版に紐付く。旧版を開いたままでは新しい条件に同意したことにならない">
        <Row label="受諾済みの最新版"><VersionPin version={2} latest={2} accepted={2} /></Row>
        <Row label="旧版を表示中"><VersionPin version={1} latest={2} accepted={2} /></Row>
      </Sec>
      <Sec id="AudienceTag" desc="その値・資料が誰に見えるか">
        <Row label="4種"><div className="row">{(["internal", "customer", "alliance", "freelancer"] as Audience[]).map((a) => <AudienceTag key={a} value={a} />)}</div></Row>
      </Sec>
      <Sec id="RelationshipTag" desc="案件ごとの顧客との関係">
        <Row label="2種"><div className="row"><RelationshipTag value="outsourcing" /><RelationshipTag value="alliance" /></div></Row>
      </Sec>
      <Sec id="Masked" desc="公開範囲の外の値。値・合計・件数から推測できない表示にする">
        <Row label="社内（JV責任者）"><Masked visible>{yen(7_000_000)}</Masked></Row>
        <Row label="顧客（外注取引型）"><Masked visible={false}>{yen(7_000_000)}</Masked></Row>
      </Sec>
      <Sec id="NextActor" desc="次に動く人と操作。受託者本人の番だけ強調する">
        <Row label="受託者の番"><NextActor actor="freelancer" action="条件を確認して回答する" due="2026-11-30" /></Row>
        <Row label="窓口の番"><NextActor actor="desk" action="顧客へ確認中" due="2026-11-29" /></Row>
      </Sec>
      <Sec id="vocab-trade" title="語彙（取引）" desc="発注、提出、検収、配備、顧客受入、支払、問い合わせ、公開、契約、知的資産">
        <VocabRow name="発注条件" vocab={ORDER_STATUS} />
        <VocabRow name="提出" vocab={SUBMISSION_STATUS} />
        <VocabRow name="委託検収" vocab={INSPECTION_STATUS} />
        <VocabRow name="配備" vocab={DEPLOY_STATUS} />
        <VocabRow name="顧客受入" vocab={CUSTOMER_ACCEPTANCE} />
        <VocabRow name="支払" vocab={PAYMENT_STATUS} />
        <VocabRow name="問い合わせ" vocab={INQUIRY_STATUS} />
        <VocabRow name="公開" vocab={DISCLOSURE_STATUS} />
        <VocabRow name="契約" vocab={CONTRACT_STATUS} />
        <VocabRow name="知的資産" vocab={IP_DISPOSITION} />
      </Sec>
    </>
  );
}
