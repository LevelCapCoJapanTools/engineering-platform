// 第5章 5.3 入力部品と DataTable
import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Icon } from "./icons";
import type { IconName } from "./icons";
import { cx, MarkdownViewer, Tooltip } from "./display";
import { href } from "../lib/router";

type ButtonProps = {
  children?: ReactNode;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  icon?: IconName;
  iconRight?: IconName;
  iconOnly?: boolean;
  loading?: boolean;
  disabled?: boolean;
  /** 無効の理由。指定するとマウスを乗せたときに表示する */
  disabledReason?: string;
  onClick?: () => void;
  to?: string;
  type?: "button" | "submit";
  block?: boolean;
  label?: string;
};

/** Button: 主要、副、危険、ゴースト、アイコンのみ × 各状態 */
export function Button({ children, variant = "secondary", size = "md", icon, iconRight, iconOnly, loading, disabled, disabledReason, onClick, to, type = "button", block, label }: ButtonProps) {
  const cls = cx("btn", variant, size !== "md" && size, iconOnly && "icon", block && "block");
  const content = (
    <>
      {loading ? <span className="spinner" /> : icon ? <Icon name={icon} size={size === "sm" ? 13 : 15} /> : null}
      {iconOnly ? <span className="sr-only">{label ?? children}</span> : children}
      {iconRight && !iconOnly ? <Icon name={iconRight} size={size === "sm" ? 13 : 15} /> : null}
    </>
  );
  if (to && !disabled) {
    return (
      <a className={cls} href={href(to)} aria-label={iconOnly ? label : undefined}>
        {content}
      </a>
    );
  }
  const btn = (
    <button type={type} className={cls} onClick={onClick} disabled={disabled || loading} aria-label={iconOnly ? label : undefined} aria-busy={loading || undefined}>
      {content}
    </button>
  );
  if (disabled && disabledReason) return <Tooltip text={disabledReason}>{btn}</Tooltip>;
  return btn;
}

/** Field: ラベル、補足、必須、エラー、文字数 */
export function Field({ label, required, help, error, count, children, htmlFor }: { label?: ReactNode; required?: boolean; help?: ReactNode; error?: ReactNode; count?: { value: number; max: number }; children: ReactNode; htmlFor?: string }) {
  return (
    <div className="field">
      {label ? (
        <label className="field-label" htmlFor={htmlFor}>
          {label}
          {required ? <span className="req">必須</span> : null}
        </label>
      ) : null}
      {children}
      {error ? <span className="field-error" role="alert">{error}</span> : help ? <span className="field-help">{help}</span> : null}
      {count ? <span className="field-count">{count.value}/{count.max}</span> : null}
    </div>
  );
}

export function TextField({ label, required, help, error, value, defaultValue, placeholder, disabled, readOnly, type = "text", maxLength, onChange, icon, prefix }: { label?: ReactNode; required?: boolean; help?: ReactNode; error?: ReactNode; value?: string; defaultValue?: string; placeholder?: string; disabled?: boolean; readOnly?: boolean; type?: string; maxLength?: number; onChange?: (v: string) => void; icon?: IconName; prefix?: string }) {
  const id = useId();
  const [len, setLen] = useState((value ?? defaultValue ?? "").length);
  const input = (
    <input
      id={id}
      className={cx("input", error && "invalid")}
      type={type}
      value={value}
      defaultValue={defaultValue}
      placeholder={placeholder}
      disabled={disabled}
      readOnly={readOnly}
      maxLength={maxLength}
      aria-invalid={Boolean(error) || undefined}
      onChange={(e) => {
        setLen(e.target.value.length);
        onChange?.(e.target.value);
      }}
    />
  );
  return (
    <Field label={label} required={required} help={help} error={error} htmlFor={id} count={maxLength ? { value: value?.length ?? len, max: maxLength } : undefined}>
      {icon ? <div className="input-icon"><Icon name={icon} />{input}</div> : prefix ? <div className="row nowrap" style={{ ["--gap" as string]: "0" }}><span className="input" style={{ width: "auto", borderRadius: "8px 0 0 8px", background: "var(--bg-subtle)", color: "var(--muted)", borderRight: 0 }}>{prefix}</span><div className="grow" style={{ display: "flex" }}>{input}</div></div> : input}
    </Field>
  );
}

export function TextArea({ label, required, help, error, value, defaultValue, placeholder, disabled, readOnly, rows = 4, maxLength, onChange }: { label?: ReactNode; required?: boolean; help?: ReactNode; error?: ReactNode; value?: string; defaultValue?: string; placeholder?: string; disabled?: boolean; readOnly?: boolean; rows?: number; maxLength?: number; onChange?: (v: string) => void }) {
  const id = useId();
  const [len, setLen] = useState((value ?? defaultValue ?? "").length);
  return (
    <Field label={label} required={required} help={help} error={error} htmlFor={id} count={maxLength ? { value: value?.length ?? len, max: maxLength } : undefined}>
      <textarea
        id={id}
        className={cx("textarea", error && "invalid")}
        rows={rows}
        value={value}
        defaultValue={defaultValue}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        maxLength={maxLength}
        aria-invalid={Boolean(error) || undefined}
        onChange={(e) => {
          setLen(e.target.value.length);
          onChange?.(e.target.value);
        }}
      />
    </Field>
  );
}

/** MarkdownEditor: 編集とプレビュー、IDの入力補完（#REQ- と入力すると候補） */
export function MarkdownEditor({ label, required, value: valueProp, defaultValue = "", onChange, suggestions = [], aiDraft, onAiDraft, minHeight, error }: { label?: ReactNode; required?: boolean; value?: string; defaultValue?: string; onChange?: (v: string) => void; suggestions?: { id: string; title: string }[]; aiDraft?: boolean; onAiDraft?: () => void; minHeight?: number; error?: ReactNode }) {
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [inner, setInner] = useState(defaultValue);
  const value = valueProp ?? inner;
  const [query, setQuery] = useState<string | null>(null);
  const ref = useRef<HTMLTextAreaElement>(null);
  const set = (v: string) => {
    setInner(v);
    onChange?.(v);
    const m = v.slice(0, ref.current?.selectionStart ?? v.length).match(/#([A-Z]{2,4}-?\d*)$/);
    setQuery(m ? m[1] : null);
  };
  const hits = query !== null ? suggestions.filter((s) => s.id.startsWith(query)).slice(0, 6) : [];
  const insert = (id: string) => {
    const v = value.replace(/#([A-Z]{2,4}-?\d*)$/, id);
    setInner(v);
    onChange?.(v);
    setQuery(null);
    ref.current?.focus();
  };
  return (
    <Field label={label} required={required} error={error}>
      <div className={cx("md-editor")} style={error ? { borderColor: "var(--tone-fail)" } : undefined}>
        <div className="md-toolbar">
          <div className="segmented" role="tablist">
            <button type="button" role="tab" aria-selected={mode === "edit"} className={cx(mode === "edit" && "active")} onClick={() => setMode("edit")}>編集</button>
            <button type="button" role="tab" aria-selected={mode === "preview"} className={cx(mode === "preview" && "active")} onClick={() => setMode("preview")}>プレビュー</button>
          </div>
          <div className="row">
            <span className="tiny muted">Markdown · <span className="kbd">#REQ-</span> で ID を補完</span>
            {onAiDraft ? <Button size="sm" variant="ghost" icon="sparkles" onClick={onAiDraft}>AIで下書き</Button> : null}
          </div>
        </div>
        {aiDraft ? (
          <div style={{ padding: "8px 12px 0" }}>
            <div className="ai-banner"><Icon name="sparkles" />この内容はAIの下書きです。確認して編集してください。</div>
          </div>
        ) : null}
        {mode === "edit" ? (
          <div className="suggest">
            <textarea ref={ref} value={value} onChange={(e) => set(e.target.value)} style={minHeight ? { minHeight } : undefined} aria-label={typeof label === "string" ? label : "本文"} />
            {hits.length ? (
              <div className="menu" style={{ left: 12, right: "auto", top: "auto", bottom: 8, minWidth: 280 }}>
                <div className="menu-label">ID の候補</div>
                {hits.map((h) => (
                  <button key={h.id} type="button" className="menu-item" onClick={() => insert(h.id)}>
                    <span className="id-link">{h.id}</span>
                    <span className="truncate">{h.title}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="md-preview" style={minHeight ? { minHeight } : undefined}>
            {value.trim() ? <MarkdownViewer source={value} /> : <span className="muted">プレビューする内容がありません</span>}
          </div>
        )}
      </div>
    </Field>
  );
}

export function Select({ label, required, help, error, options, value, defaultValue, onChange, disabled, placeholder }: { label?: ReactNode; required?: boolean; help?: ReactNode; error?: ReactNode; options: { value: string; label: string; disabled?: boolean }[]; value?: string; defaultValue?: string; onChange?: (v: string) => void; disabled?: boolean; placeholder?: string }) {
  const id = useId();
  return (
    <Field label={label} required={required} help={help} error={error} htmlFor={id}>
      <select id={id} className={cx("select", error && "invalid")} value={value} defaultValue={defaultValue} onChange={(e) => onChange?.(e.target.value)} disabled={disabled}>
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled}>{o.label}</option>
        ))}
      </select>
    </Field>
  );
}

export type ComboOption = { value: string; label: string; hint?: string; disabled?: boolean; disabledReason?: string };

/** Combobox: 検索付き選択（単一・複数） */
export function Combobox({ label, required, help, error, options, value, onChange, multiple, placeholder = "検索して選択", loading }: { label?: ReactNode; required?: boolean; help?: ReactNode; error?: ReactNode; options: ComboOption[]; value: string[]; onChange?: (v: string[]) => void; multiple?: boolean; placeholder?: string; loading?: boolean }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string[]>(value);
  useEffect(() => setSelected(value), [value]);
  const boxRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  const filtered = options.filter((o) => (o.label + o.value + (o.hint ?? "")).toLowerCase().includes(q.toLowerCase()));
  const commit = (next: string[]) => {
    setSelected(next);
    onChange?.(next);
  };
  const pick = (o: ComboOption) => {
    if (o.disabled) return;
    if (multiple) commit(selected.includes(o.value) ? selected.filter((v) => v !== o.value) : [...selected, o.value]);
    else {
      commit([o.value]);
      setOpen(false);
    }
    setQ("");
  };
  const labelOf = (v: string) => options.find((o) => o.value === v)?.label ?? v;
  return (
    <Field label={label} required={required} help={help} error={error}>
      <div className="combobox" ref={boxRef}>
        <div className="control" onClick={() => setOpen(true)} style={error ? { borderColor: "var(--tone-fail)" } : undefined}>
          {multiple
            ? selected.map((v) => (
                <span key={v} className="token">
                  {labelOf(v)}
                  <button type="button" aria-label={`${labelOf(v)} を外す`} onClick={(e) => { e.stopPropagation(); commit(selected.filter((x) => x !== v)); }}>×</button>
                </span>
              ))
            : null}
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder={!multiple && selected[0] ? labelOf(selected[0]) : selected.length ? "" : placeholder}
            aria-label={typeof label === "string" ? label : placeholder}
            role="combobox"
            aria-expanded={open}
          />
          <Icon name="chevronDown" size={14} className="muted" />
        </div>
        {open ? (
          <div className="menu" role="listbox">
            {loading ? (
              <div className="menu-empty"><span className="spinner" /> 読み込み中…</div>
            ) : filtered.length === 0 ? (
              <div className="menu-empty">該当する候補がありません</div>
            ) : (
              filtered.map((o) => (
                <button key={o.value} type="button" role="option" aria-selected={selected.includes(o.value)} className={cx("menu-item", selected.includes(o.value) && "active")} onClick={() => pick(o)} disabled={o.disabled} style={o.disabled ? { opacity: 0.5, cursor: "not-allowed" } : undefined} title={o.disabledReason}>
                  {multiple ? <Icon name={selected.includes(o.value) ? "checkSquare" : "square"} size={15} /> : selected.includes(o.value) ? <Icon name="check" size={15} /> : <span style={{ width: 15 }} />}
                  <span className="grow">
                    <span>{o.label}</span>
                    {o.hint ? <span className="tiny muted" style={{ marginLeft: 6 }}>{o.hint}</span> : null}
                    {o.disabled && o.disabledReason ? <span className="tiny muted" style={{ display: "block" }}>{o.disabledReason}</span> : null}
                  </span>
                </button>
              ))
            )}
          </div>
        ) : null}
      </div>
    </Field>
  );
}

/** DatePicker: ネイティブの日付入力に最小・最大の制約を付ける */
export function DatePicker({ label, required, help, error, value, defaultValue, min, max, onChange }: { label?: ReactNode; required?: boolean; help?: ReactNode; error?: ReactNode; value?: string; defaultValue?: string; min?: string; max?: string; onChange?: (v: string) => void }) {
  const id = useId();
  return (
    <Field label={label} required={required} help={help} error={error} htmlFor={id}>
      <input id={id} type="date" className={cx("input", error && "invalid")} value={value} defaultValue={defaultValue} min={min} max={max} onChange={(e) => onChange?.(e.target.value)} />
    </Field>
  );
}

export function Checkbox({ label, checked, defaultChecked, onChange, disabled, description }: { label: ReactNode; checked?: boolean; defaultChecked?: boolean; onChange?: (v: boolean) => void; disabled?: boolean; description?: ReactNode }) {
  return (
    <label className={cx("check", disabled && "disabled")}>
      <input type="checkbox" checked={checked} defaultChecked={defaultChecked} disabled={disabled} onChange={(e) => onChange?.(e.target.checked)} />
      <span className="stack" style={{ ["--gap" as string]: "2px" }}>
        <span>{label}</span>
        {description ? <span className="tiny muted">{description}</span> : null}
      </span>
    </label>
  );
}

export function Radio({ name, label, checked, defaultChecked, onChange, disabled, description, value }: { name: string; label: ReactNode; checked?: boolean; defaultChecked?: boolean; onChange?: (v: string) => void; disabled?: boolean; description?: ReactNode; value: string }) {
  return (
    <label className={cx("check", disabled && "disabled")}>
      <input type="radio" name={name} value={value} checked={checked} defaultChecked={defaultChecked} disabled={disabled} onChange={() => onChange?.(value)} />
      <span className="stack" style={{ ["--gap" as string]: "2px" }}>
        <span>{label}</span>
        {description ? <span className="tiny muted">{description}</span> : null}
      </span>
    </label>
  );
}

/** OptionCard: カード型のラジオ／チェック */
export function OptionCard({ name, type = "radio", value, checked, onChange, title, description, disabled, badge, children }: { name: string; type?: "radio" | "checkbox"; value: string; checked: boolean; onChange?: (v: string) => void; title: ReactNode; description?: ReactNode; disabled?: boolean; badge?: ReactNode; children?: ReactNode }) {
  return (
    <label className={cx("option-card", checked && "selected", disabled && "disabled")}>
      <input type={type} name={name} value={value} checked={checked} disabled={disabled} onChange={() => onChange?.(value)} />
      <span className="stack grow" style={{ ["--gap" as string]: "4px" }}>
        <span className="row between">
          <span className="strong">{title}</span>
          {badge}
        </span>
        {description ? <span className="small muted">{description}</span> : null}
        {children}
      </span>
    </label>
  );
}

export function Toggle({ label, checked, defaultChecked, onChange, disabled, description }: { label: ReactNode; checked?: boolean; defaultChecked?: boolean; onChange?: (v: boolean) => void; disabled?: boolean; description?: ReactNode }) {
  return (
    <label className={cx("toggle", disabled && "disabled")}>
      <input type="checkbox" role="switch" checked={checked} defaultChecked={defaultChecked} disabled={disabled} onChange={(e) => onChange?.(e.target.checked)} />
      <span className="track" />
      <span className="stack" style={{ ["--gap" as string]: "2px" }}>
        <span>{label}</span>
        {description ? <span className="tiny muted">{description}</span> : null}
      </span>
    </label>
  );
}

/** FileUpload: ドラッグ＆ドロップ、選択、進捗、完了時のハッシュ表示 */
export function FileUpload({ label, accept = ".pdf,.docx,.md", state: forced, fileName = "SOW_v3.pdf", hash, onDone }: { label?: ReactNode; accept?: string; state?: "idle" | "dragging" | "uploading" | "done" | "failed" | "invalid"; fileName?: string; hash?: string; onDone?: () => void }) {
  const [state, setState] = useState(forced ?? "idle");
  const [progress, setProgress] = useState(forced === "uploading" ? 45 : 0);
  useEffect(() => { if (forced) setState(forced); }, [forced]);
  const start = () => {
    setState("uploading");
    setProgress(10);
    const t = window.setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          window.clearInterval(t);
          setState("done");
          onDone?.();
          return 100;
        }
        return p + 30;
      });
    }, 300);
  };
  return (
    <Field label={label}>
      {state === "done" || state === "uploading" ? (
        <div className="file-row">
          <Icon name="fileText" size={22} className="muted" />
          <div className="grow stack" style={{ ["--gap" as string]: "4px" }}>
            <span className="strong">{fileName}</span>
            {state === "uploading" ? (
              <div className="meter"><div className="bar"><span style={{ width: `${progress}%` }} /></div><span className="tiny muted">アップロード中… {progress}%</span></div>
            ) : (
              <span className="tiny muted">1.2 MB · SHA-256 <span className="mono">{(hash ?? "9f2c4e1ab07d33c8").slice(0, 16)}…</span></span>
            )}
          </div>
          {state === "done" ? <Button size="sm" variant="ghost" icon="x" iconOnly label="取り消す" onClick={() => setState("idle")} /> : null}
        </div>
      ) : (
        <div
          className={cx("dropzone", state === "dragging" && "dragging", (state === "failed" || state === "invalid") && "error")}
          onDragOver={(e) => { e.preventDefault(); setState("dragging"); }}
          onDragLeave={() => setState("idle")}
          onDrop={(e) => { e.preventDefault(); start(); }}
        >
          <Icon name="upload" />
          <span className="strong">{state === "dragging" ? "ここにドロップ" : "ファイルをドラッグ＆ドロップ"}</span>
          <span className="small">または <button type="button" className="btn ghost sm" onClick={start}>ファイルを選択</button></span>
          <span className="tiny">対応形式: {accept}（最大 20MB）</span>
          {state === "failed" ? <span className="field-error">アップロードに失敗しました。もう一度お試しください。</span> : null}
          {state === "invalid" ? <span className="field-error">この形式のファイルはアップロードできません。</span> : null}
        </div>
      )}
    </Field>
  );
}

/** SearchBox */
export function SearchBox({ placeholder = "検索", value, onChange, shortcut, width }: { placeholder?: string; value?: string; onChange?: (v: string) => void; shortcut?: string; width?: number | string }) {
  return (
    <div className="input-icon" style={{ width }}>
      <Icon name="search" />
      <input className="input" type="search" placeholder={placeholder} value={value} onChange={(e) => onChange?.(e.target.value)} aria-label={placeholder} />
      {shortcut ? <span className="kbd">{shortcut}</span> : null}
    </div>
  );
}

/** FilterBar: 絞り込み条件の並び、条件のクリア */
export type FilterDef = { key: string; label: string; options: { value: string; label: string }[] };
export function FilterBar({ filters = [], values, onChange, search, onSearch, searchPlaceholder = "キーワードで絞り込み", actions }: { filters?: FilterDef[]; values: Record<string, string>; onChange: (key: string, v: string) => void; search?: string; onSearch?: (v: string) => void; searchPlaceholder?: string; actions?: ReactNode }) {
  const active = filters.filter((f) => values[f.key]);
  return (
    <div className="stack" style={{ ["--gap" as string]: "8px" }}>
      <div className="row between">
        <div className="filterbar">
          {onSearch ? <SearchBox placeholder={searchPlaceholder} value={search} onChange={onSearch} /> : null}
          {filters.map((f) => (
            <select key={f.key} className="select" value={values[f.key] ?? ""} onChange={(e) => onChange(f.key, e.target.value)} aria-label={f.label}>
              <option value="">{f.label}: すべて</option>
              {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          ))}
        </div>
        {actions ? <div className="row">{actions}</div> : null}
      </div>
      {active.length || search ? (
        <div className="row" style={{ ["--gap" as string]: "6px" }}>
          {search ? <span className="filter-chip">「{search}」<button type="button" aria-label="キーワードを外す" onClick={() => onSearch?.("")}>×</button></span> : null}
          {active.map((f) => (
            <span key={f.key} className="filter-chip">
              {f.label}: {f.options.find((o) => o.value === values[f.key])?.label}
              <button type="button" aria-label={`${f.label}の条件を外す`} onClick={() => onChange(f.key, "")}>×</button>
            </span>
          ))}
          <button type="button" className="btn ghost sm" onClick={() => { filters.forEach((f) => onChange(f.key, "")); onSearch?.(""); }}>条件をクリア</button>
        </div>
      ) : null}
    </div>
  );
}

/** Tabs: 件数付き */
export function Tabs({ tabs, value, onChange }: { tabs: { value: string; label: ReactNode; count?: number; icon?: IconName }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((t) => (
        <button key={t.value} type="button" role="tab" aria-selected={value === t.value} className={cx("tab", value === t.value && "active")} onClick={() => onChange(t.value)}>
          {t.icon ? <Icon name={t.icon} size={14} /> : null}
          {t.label}
          {t.count !== undefined ? <span className="count">{t.count}</span> : null}
        </button>
      ))}
    </div>
  );
}

export function Segmented({ options, value, onChange }: { options: { value: string; label: ReactNode }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="segmented" role="tablist">
      {options.map((o) => (
        <button key={o.value} type="button" role="tab" aria-selected={value === o.value} className={cx(value === o.value && "active")} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Pagination */
export function Pagination({ page, pageSize = 50, total, onChange }: { page: number; pageSize?: number; total: number; onChange: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  return (
    <div className="pagination">
      <span>{total}件中 {from}〜{to}件</span>
      <div className="pages">
        <button type="button" onClick={() => onChange(Math.max(1, page - 1))} disabled={page === 1} aria-label="前のページ"><Icon name="chevronLeft" size={13} /></button>
        {Array.from({ length: pages }).slice(0, 7).map((_, i) => (
          <button key={i} type="button" className={cx(page === i + 1 && "active")} onClick={() => onChange(i + 1)} aria-current={page === i + 1 ? "page" : undefined}>{i + 1}</button>
        ))}
        <button type="button" onClick={() => onChange(Math.min(pages, page + 1))} disabled={page === pages} aria-label="次のページ"><Icon name="chevronRight" size={13} /></button>
      </div>
    </div>
  );
}

export type Column<T> = {
  key: string;
  header: ReactNode;
  render: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number;
  align?: "right";
  width?: number | string;
  /** 列の表示切替で隠せるか（既定: 可） */
  hideable?: boolean;
  defaultHidden?: boolean;
};

/** DataTable: 並べ替え、ページ送り、行クリック、列の表示切替、行の複数選択 */
export function DataTable<T>({ columns, rows, rowKey, onRowClick, selectable, selected, onSelect, pageSize = 50, toolbar, empty, compact, total, bare }: { columns: Column<T>[]; rows: T[]; rowKey: (row: T) => string; onRowClick?: (row: T) => void; selectable?: boolean; selected?: string[]; onSelect?: (keys: string[]) => void; pageSize?: number; toolbar?: ReactNode; empty?: ReactNode; compact?: boolean; total?: number; /** Section などの中に置くとき、外側のカード枠を付けない */ bare?: boolean }) {
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null);
  const [page, setPage] = useState(1);
  const [hidden, setHidden] = useState<string[]>(columns.filter((c) => c.defaultHidden).map((c) => c.key));
  const [colMenu, setColMenu] = useState(false);
  const [sel, setSel] = useState<string[]>(selected ?? []);
  useEffect(() => { if (selected) setSel(selected); }, [selected]);
  const sorted = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortValue) return rows;
    return [...rows].sort((a, b) => {
      const x = col.sortValue!(a);
      const y = col.sortValue!(b);
      return (x > y ? 1 : x < y ? -1 : 0) * sort.dir;
    });
  }, [rows, sort, columns]);
  const visibleCols = columns.filter((c) => !hidden.includes(c.key));
  const pageRows = sorted.slice((page - 1) * pageSize, page * pageSize);
  const toggleSel = (k: string) => {
    const next = sel.includes(k) ? sel.filter((x) => x !== k) : [...sel, k];
    setSel(next);
    onSelect?.(next);
  };
  const allKeys = pageRows.map(rowKey);
  const allChecked = allKeys.length > 0 && allKeys.every((k) => sel.includes(k));
  return (
    <div className={bare ? undefined : "card flush"}>
      <div className="table-toolbar">
        <div className="row">{toolbar ?? <span className="small muted">{total ?? rows.length}件</span>}</div>
        <div className="dropdown">
          <Button size="sm" variant="ghost" icon="list" onClick={() => setColMenu((v) => !v)}>列の表示</Button>
          {colMenu ? (
            <div className="menu right" onMouseLeave={() => setColMenu(false)}>
              <div className="menu-label">表示する列</div>
              {columns.filter((c) => c.hideable !== false).map((c) => (
                <label key={c.key} className="menu-item">
                  <input type="checkbox" checked={!hidden.includes(c.key)} onChange={() => setHidden((h) => (h.includes(c.key) ? h.filter((x) => x !== c.key) : [...h, c.key]))} />
                  {c.header}
                </label>
              ))}
            </div>
          ) : null}
        </div>
      </div>
      {rows.length === 0 ? (
        empty
      ) : (
        <>
          <div className="table-wrap">
            <table className={cx("table", compact && "compact")}>
              <thead>
                <tr>
                  {selectable ? (
                    <th className="check-col">
                      <input type="checkbox" aria-label="すべて選択" checked={allChecked} onChange={() => { const next = allChecked ? sel.filter((k) => !allKeys.includes(k)) : Array.from(new Set([...sel, ...allKeys])); setSel(next); onSelect?.(next); }} />
                    </th>
                  ) : null}
                  {visibleCols.map((c) => (
                    <th
                      key={c.key}
                      className={cx(c.sortValue && "sortable", c.align === "right" && "num")}
                      style={{ width: c.width }}
                      onClick={c.sortValue ? () => setSort((s) => (s?.key === c.key ? { key: c.key, dir: s.dir === 1 ? -1 : 1 } : { key: c.key, dir: 1 })) : undefined}
                      aria-sort={sort?.key === c.key ? (sort.dir === 1 ? "ascending" : "descending") : undefined}
                    >
                      <span className="row nowrap" style={{ ["--gap" as string]: "4px", display: "inline-flex" }}>
                        {c.header}
                        {c.sortValue ? <Icon name={sort?.key === c.key ? (sort.dir === 1 ? "chevronUp" : "chevronDown") : "sort"} size={11} /> : null}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row) => {
                  const k = rowKey(row);
                  return (
                    <tr key={k} className={cx(onRowClick && "clickable", sel.includes(k) && "selected")} onClick={onRowClick ? () => onRowClick(row) : undefined}>
                      {selectable ? (
                        <td className="check-col" onClick={(e) => e.stopPropagation()}>
                          <input type="checkbox" aria-label={`${k} を選択`} checked={sel.includes(k)} onChange={() => toggleSel(k)} />
                        </td>
                      ) : null}
                      {visibleCols.map((c) => (
                        <td key={c.key} className={cx(c.align === "right" && "num")}>{c.render(row)}</td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {rows.length > pageSize || total ? <Pagination page={page} pageSize={pageSize} total={total ?? rows.length} onChange={setPage} /> : null}
        </>
      )}
    </div>
  );
}
