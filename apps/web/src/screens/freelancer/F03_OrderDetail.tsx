// 画面ID: F-03 依頼詳細・条件
import "./freelancer.css";
import { useState } from "react";
import { useRoute, useScreenState } from "../../lib/router";
import { paths } from "../../lib/paths";
import { formatDate, formatDateTime, yen } from "../../lib/format";
import { ORDER_STATUS } from "../../lib/vocab";
import type { OrderTerms } from "../../lib/types";
import { myOrderById, orderMaterials, readLog } from "../../mocks/freelancer";
import {
  Banner,
  Button,
  Checkbox,
  ConfirmDialog,
  FreelancerLayout,
  Icon,
  Modal,
  NextActor,
  Section,
  Select,
  StatusBadge,
  Tag,
  TextArea,
  TextField,
  TradeStateStrip,
  useToast,
  VersionPin,
} from "../../ui";
import { missingTerms, Receipt, TermsDiff, TermsList, useClient } from "./parts";

type Mode = "offered" | "accepted" | "oldVersion" | "negotiating" | "declined" | "incomplete";

function modeFor(state: string, fallback: Mode): Mode {
  switch (state) {
    case "回答待ち": return "offered";
    case "受諾済み": return "accepted";
    case "旧版を表示中": return "oldVersion";
    case "相談中": return "negotiating";
    case "辞退": return "declined";
    case "条件未確定": return "incomplete";
    default: return fallback;
  }
}

export function F03OrderDetail() {
  const state = useScreenState();
  const toast = useToast();
  const { params } = useRoute();
  const [client, setClient] = useClient();

  const fromRoute = myOrderById(params.id ?? "");
  const routeMode: Mode = !fromRoute ? "offered" : fromRoute.status === "accepted" || fromRoute.status === "completed" ? "accepted" : fromRoute.status === "negotiating" ? "negotiating" : fromRoute.status === "declined" ? "declined" : "offered";
  const initialMode = modeFor(state, routeMode);
  // 「表示中の依頼」はルートの依頼をそのまま表示する。ほかの状態は代表例を表示する
  const order =
    state === "表示中の依頼" && fromRoute
      ? fromRoute
      : initialMode === "accepted" || initialMode === "oldVersion"
        ? myOrderById("ORD-0101")!
        : myOrderById("ORD-0105")!;

  const [mode, setMode] = useState<Mode>(initialMode);
  const latest = order.terms[order.terms.length - 1];
  const viewing: OrderTerms = mode === "oldVersion" ? order.terms[0] : latest;
  const previous = order.terms.length > 1 && viewing.version > 1 ? order.terms[viewing.version - 2] : undefined;
  const terms: Partial<OrderTerms> = mode === "incomplete" ? { ...viewing, payment_due: "", payment_method: "" } : viewing;
  const missing = missingTerms(terms);
  const reads = readLog[order.id] ?? [];

  const [confirmAccept, setConfirmAccept] = useState(false);
  const [checked, setChecked] = useState(false);
  const [sending, setSending] = useState(false);
  const [acceptedAt, setAcceptedAt] = useState<string | undefined>(mode === "accepted" ? order.accepted_at : undefined);
  const [counterOpen, setCounterOpen] = useState(false);
  const [declineOpen, setDeclineOpen] = useState(false);
  const [staleNotice, setStaleNotice] = useState(false);
  const [counter, setCounter] = useState({ fee: "", start: "", due: "", note: "" });

  const accept = () => {
    // 旧版を開いたまま押しても、新しい条件への同意にはしない
    if (mode === "oldVersion") {
      setConfirmAccept(false);
      setStaleNotice(true);
      return;
    }
    setSending(true);
    window.setTimeout(() => {
      setSending(false);
      setConfirmAccept(false);
      setMode("accepted");
      setAcceptedAt("2026-11-27T10:31:00+09:00");
    }, 700);
  };

  const canAnswer = (mode === "offered" || mode === "oldVersion") && missing.length === 0;
  const status = mode === "accepted" ? ORDER_STATUS.accepted : mode === "negotiating" ? ORDER_STATUS.negotiating : mode === "declined" ? ORDER_STATUS.declined : mode === "incomplete" ? ORDER_STATUS.draft : ORDER_STATUS.offered;

  return (
    <FreelancerLayout active="orders" client={client} onClientChange={setClient}>
      <div className="stack" style={{ ["--gap" as string]: "6px" }}>
        <span className="mono tiny muted">{order.id} · {order.client_company}</span>
        <h1 style={{ fontSize: "var(--text-xl)", color: "var(--text-strong)", overflowWrap: "anywhere" }}>{order.title}</h1>
        <div className="row" style={{ ["--gap" as string]: "8px" }}>
          <StatusBadge vocab={status} />
          <VersionPin version={viewing.version} latest={latest.version} accepted={mode === "accepted" ? order.accepted_version ?? latest.version : undefined} />
        </div>
        <NextActor actor={mode === "accepted" ? order.next_actor : mode === "negotiating" ? "desk" : mode === "declined" ? "none" : "freelancer"} action={mode === "accepted" ? order.next_action : mode === "negotiating" ? "窓口が相談内容を確認し、新しい版を提示します" : mode === "declined" ? "辞退しました" : "条件を確認して回答する"} due={mode === "offered" || mode === "oldVersion" ? order.next_due : undefined} />
      </div>

      {mode === "oldVersion" || staleNotice ? (
        <Banner tone="warn" title={`新しい版 v${latest.version} が発行されています`} action={<Button size="sm" variant="primary" icon="refresh" onClick={() => { setMode("offered"); setStaleNotice(false); toast({ kind: "success", message: `v${latest.version} を読み込みました。変更点を確認してください` }); }}>v{latest.version} を開く</Button>}>
          {staleNotice ? "開いていた v1 のまま「引き受ける」を押したため、受諾していません。" : "この画面は v1 を表示しています。"}新しい版の条件を確認してから回答してください。
        </Banner>
      ) : null}
      {mode === "incomplete" ? (
        <Banner tone="warn" title="条件がまだ確定していません">
          {missing.map((m) => m.label).join("、")}が未設定のため、依頼元が条件を確定するまで回答できません。不明点は質問できます。
        </Banner>
      ) : null}
      {mode === "declined" ? <Banner tone="info" title="この依頼は辞退しました">依頼元に通知しました。辞退の記録は「提出・取引履歴」に残ります。</Banner> : null}

      {mode === "accepted" && acceptedAt ? (
        <Receipt title={`v${order.accepted_version ?? latest.version} の条件で引き受けました`} number={`ACK-${order.id}-v${order.accepted_version ?? latest.version}`} at={acceptedAt}>
          <span className="small">この控えはいつでも「提出・取引履歴」から取得できます。条件が変わる場合は新しい版が届き、あなたが承諾するまで今の条件のままです。</span>
          <div><Button size="sm" icon="download" onClick={() => toast({ kind: "success", message: "合意した条件の控え（PDF）を保存しました" })}>合意した条件の控えを保存</Button></div>
        </Receipt>
      ) : null}
      {mode === "negotiating" ? (
        <Receipt title="条件の相談を送りました" number={`NEG-${order.id}-1`} at="2026-11-27T10:28:00+09:00">
          <span className="small">窓口が依頼元と調整し、新しい版を提示します。今の版はまだ確定していません。</span>
        </Receipt>
      ) : null}

      {mode === "accepted" ? <TradeStateStrip order={order} /> : null}

      {previous && mode !== "oldVersion" ? <TermsDiff from={previous} to={viewing} /> : null}

      <Section title="条件" sub={`v${viewing.version} · 発行 ${formatDateTime(viewing.issued_at)}`}>
        <TermsList terms={terms} previous={mode === "oldVersion" ? undefined : previous} />
      </Section>

      <Section title="資料" sub="依頼元が共有した資料だけを表示します">
        <ul className="fx-list">
          {(orderMaterials[order.id] ?? []).map((m) => (
            <li key={m.name} className="small"><Icon name="fileText" size={12} /> {m.name} <Tag square>{m.version}</Tag>{m.note ? <span className="muted"> · {m.note}</span> : null}</li>
          ))}
        </ul>
      </Section>

      <Section title="既読と回答の記録">
        <ul className="fx-list small">
          {reads.length ? reads.map((r) => <li key={r.version}>v{r.version} を {formatDateTime(r.read_at)} に開きました（既読。受諾ではありません）</li>) : <li>まだ開いた記録はありません</li>}
          <li>{mode === "accepted" ? `v${order.accepted_version ?? latest.version} を ${formatDateTime(acceptedAt ?? "")} に受諾しました` : "まだ受諾していません"}</li>
        </ul>
      </Section>

      {mode === "accepted" ? (
        <div className="fx-actions">
          <Button variant="primary" icon="upload" to={paths.freelancerSubmit(order.id)}>成果を提出する</Button>
          <Button icon="message" to={paths.freelancerQuestions()}>質問する</Button>
        </div>
      ) : mode === "declined" || mode === "negotiating" ? (
        <div className="fx-actions"><Button icon="message" to={paths.freelancerQuestions()}>質問する</Button></div>
      ) : (
        <div className="fx-actions fx-sticky-actions">
          <Button variant="primary" icon="check" disabled={!canAnswer} disabledReason={missing.length ? "条件が確定していません" : undefined} onClick={() => setConfirmAccept(true)}>引き受ける</Button>
          <Button icon="message" disabled={!canAnswer} disabledReason={missing.length ? "条件が確定していません" : undefined} onClick={() => setCounterOpen(true)}>条件を相談する</Button>
          <Button variant="ghost" disabled={!canAnswer} disabledReason={missing.length ? "条件が確定していません" : undefined} onClick={() => setDeclineOpen(true)}>辞退する</Button>
          <Button variant="ghost" icon="help" to={paths.freelancerQuestions()}>質問する</Button>
        </div>
      )}

      <Modal
        open={confirmAccept}
        onClose={() => setConfirmAccept(false)}
        title={`v${viewing.version} の条件で引き受けますか？`}
        description={`依頼額 ${yen(viewing.fee)}、納期 ${formatDate(viewing.due)}、支払期日 ${formatDate(viewing.payment_due)}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmAccept(false)}>戻る</Button>
            <Button variant="primary" loading={sending} disabled={!checked || sending} disabledReason="条件を確認したらチェックを入れてください" onClick={accept}>引き受ける</Button>
          </>
        }
      >
        <Checkbox label={`v${viewing.version} の条件（作るもの・完成の判定・対象外・金額・期日）を確認しました`} checked={checked} onChange={setChecked} />
        <p className="tiny muted" style={{ marginTop: 8 }}>送信中はボタンを押せません。同じ依頼を二重に受諾することはありません。</p>
      </Modal>

      <Modal
        open={counterOpen}
        onClose={() => setCounterOpen(false)}
        title="条件を相談する"
        description="窓口が依頼元と調整し、新しい版を提示します。あなたが新しい版を承諾するまで、条件は確定しません。"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCounterOpen(false)}>キャンセル</Button>
            <Button variant="primary" disabled={!counter.fee && !counter.due && !counter.start} disabledReason="見積額・開始可能日・納期のどれかを入力してください" onClick={() => { setCounterOpen(false); setMode("negotiating"); }}>相談を送る</Button>
          </>
        }
      >
        <div className="stack">
          <TextField label="見積額（税抜・円）" value={counter.fee} onChange={(v) => setCounter((c) => ({ ...c, fee: v }))} placeholder={String(viewing.fee)} />
          <TextField label="開始できる日" type="date" value={counter.start} onChange={(v) => setCounter((c) => ({ ...c, start: v }))} />
          <TextField label="納期の対案" type="date" value={counter.due} onChange={(v) => setCounter((c) => ({ ...c, due: v }))} />
          <TextArea label="理由・補足" rows={3} value={counter.note} onChange={(v) => setCounter((c) => ({ ...c, note: v }))} placeholder="例: 改ページの確認に追加で1日必要です" />
        </div>
      </Modal>

      <ConfirmDialog
        open={declineOpen}
        onClose={() => setDeclineOpen(false)}
        onConfirm={() => { setDeclineOpen(false); setMode("declined"); }}
        title="この依頼を辞退しますか？"
        message={<div className="stack"><span>辞退すると依頼元に通知されます。辞退した依頼は開けなくなりますが、記録は残ります。</span><Select label="理由（任意）" options={[{ value: "busy", label: "期間中に稼働できない" }, { value: "skill", label: "技術的に対応が難しい" }, { value: "fee", label: "条件が合わない" }, { value: "other", label: "その他" }]} defaultValue="busy" /></div>}
        confirmLabel="辞退する"
      />
    </FreelancerLayout>
  );
}
