// 第5章 5.4 重ね表示部品と Toast
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Icon } from "./icons";
import type { IconName } from "./icons";
import { cx } from "./display";
import { Button } from "./inputs";

function useEscape(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
}

/** Modal: 中央のダイアログ */
export function Modal({ open, onClose, title, description, size = "md", children, footer }: { open: boolean; onClose: () => void; title: ReactNode; description?: ReactNode; size?: "sm" | "md" | "lg"; children?: ReactNode; footer?: ReactNode }) {
  useEscape(open, onClose);
  if (!open) return null;
  return (
    <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={cx("modal", size)} role="dialog" aria-modal="true" aria-label={typeof title === "string" ? title : undefined}>
        <div className="modal-head">
          <div className="stack" style={{ ["--gap" as string]: "4px" }}>
            <h2>{title}</h2>
            {description ? <p className="small muted">{description}</p> : null}
          </div>
          <Button variant="ghost" iconOnly icon="x" label="閉じる" onClick={onClose} />
        </div>
        <div className="modal-body">{children}</div>
        {footer ? <div className="modal-foot">{footer}</div> : null}
      </div>
    </div>
  );
}

/** ConfirmDialog: 取り消せない操作では対象IDの入力を求める */
export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = "実行する", danger, requireText }: { open: boolean; onClose: () => void; onConfirm: () => void; title: string; message: ReactNode; confirmLabel?: string; danger?: boolean; requireText?: string }) {
  const [text, setText] = useState("");
  useEffect(() => { if (!open) setText(""); }, [open]);
  const ok = !requireText || text === requireText;
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>キャンセル</Button>
          <Button variant={danger ? "danger" : "primary"} disabled={!ok} onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</Button>
        </>
      }
    >
      <div className="stack" style={{ ["--gap" as string]: "12px" }}>
        {danger ? (
          <div className="banner tone-fail"><Icon name="alert" /><div className="banner-body">{message}</div></div>
        ) : (
          <div>{message}</div>
        )}
        {requireText ? (
          <label className="field">
            <span className="field-label">確認のため <code>{requireText}</code> と入力してください</span>
            <input className="input" value={text} onChange={(e) => setText(e.target.value)} autoFocus />
          </label>
        ) : null}
      </div>
    </Modal>
  );
}

/** Drawer: 右から出るパネル */
export function Drawer({ open, onClose, title, subtitle, width = 480, children, footer }: { open: boolean; onClose: () => void; title: ReactNode; subtitle?: ReactNode; width?: 480 | 720; children: ReactNode; footer?: ReactNode }) {
  useEscape(open, onClose);
  if (!open) return null;
  return (
    <div className="overlay drawer-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <aside className={cx("drawer", `w${width}`)} role="dialog" aria-modal="true">
        <div className="modal-head" style={{ borderBottom: "1px solid var(--border)", paddingBottom: 16 }}>
          <div className="stack" style={{ ["--gap" as string]: "4px", minWidth: 0 }}>
            <h2>{title}</h2>
            {subtitle ? <div className="small muted">{subtitle}</div> : null}
          </div>
          <Button variant="ghost" iconOnly icon="x" label="閉じる" onClick={onClose} />
        </div>
        <div className="modal-body" style={{ flex: 1, paddingTop: 16 }}>{children}</div>
        {footer ? <div className="modal-foot">{footer}</div> : null}
      </aside>
    </div>
  );
}

/** Popover: 小さな浮遊パネル */
export function Popover({ trigger, children, align = "left" }: { trigger: (toggle: () => void, open: boolean) => ReactNode; children: ReactNode; align?: "left" | "right" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  useEscape(open, () => setOpen(false));
  return (
    <div className="dropdown" ref={ref} style={{ display: "inline-flex" }}>
      {trigger(() => setOpen((v) => !v), open)}
      {open ? <div className="popover" style={align === "right" ? { left: "auto", right: 0 } : undefined}>{children}</div> : null}
    </div>
  );
}

/** Menu: 「その他」などのドロップダウンメニュー */
export type MenuEntry = { label: ReactNode; icon?: IconName; onClick?: () => void; danger?: boolean; disabled?: boolean } | "separator";
export function Menu({ trigger, items, align = "right" }: { trigger: (toggle: () => void, open: boolean) => ReactNode; items: MenuEntry[]; align?: "left" | "right" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  useEscape(open, () => setOpen(false));
  return (
    <div className="dropdown" ref={ref}>
      {trigger(() => setOpen((v) => !v), open)}
      {open ? (
        <div className={cx("menu", align === "right" && "right")} role="menu" style={align === "left" ? { right: "auto", minWidth: 220 } : undefined}>
          {items.map((it, i) =>
            it === "separator" ? (
              <div key={i} className="menu-sep" />
            ) : (
              <button key={i} type="button" role="menuitem" className={cx("menu-item", it.danger && "danger")} disabled={it.disabled} style={it.disabled ? { opacity: 0.5 } : undefined} onClick={() => { it.onClick?.(); setOpen(false); }}>
                {it.icon ? <Icon name={it.icon} size={15} /> : null}
                {it.label}
              </button>
            ),
          )}
        </div>
      ) : null}
    </div>
  );
}

/** MoreMenu: PageHeader の「その他」 */
export function MoreMenu({ items }: { items: MenuEntry[] }) {
  return <Menu items={items} trigger={(toggle) => <Button iconOnly icon="more" label="その他の操作" onClick={toggle} />} />;
}

type ToastItem = { id: number; kind: "success" | "error" | "info"; message: ReactNode; undo?: () => void };
const ToastContext = createContext<(t: Omit<ToastItem, "id">) => void>(() => undefined);

/** Toast: 操作結果の一時通知（右下） */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const push = useCallback((t: Omit<ToastItem, "id">) => {
    const id = Date.now() + Math.random();
    setItems((xs) => [...xs, { ...t, id }]);
    window.setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== id)), 4200);
  }, []);
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="toast-region" role="status" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={cx("toast", t.kind)}>
            <Icon name={t.kind === "success" ? "checkCircle" : t.kind === "error" ? "alertCircle" : "info"} />
            <span>{t.message}</span>
            {t.undo ? <button type="button" onClick={() => { t.undo?.(); setItems((xs) => xs.filter((x) => x.id !== t.id)); }}>元に戻す</button> : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
