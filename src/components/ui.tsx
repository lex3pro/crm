import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { PayStatus } from "../lib/crm";
import { STATUS_META } from "../lib/crm";
import { IconAlert, IconCheck, IconCopy, IconX } from "./icons";

/* ── появление при скролле ── */
export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.08 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={`reveal ${seen ? "is-in" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ── модальное окно ── */
export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/55 p-3 sm:items-center sm:p-6"
      onMouseDown={onClose}
    >
      <div
        className={`anim-pop fcard max-h-[92vh] w-full overflow-y-auto p-5 sm:p-6 ${wide ? "max-w-2xl" : "max-w-md"}`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="font-display text-base font-bold">{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Закрыть">
            <IconX className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ── пилюля статуса ── */
export function StatusPill({ status, small }: { status: PayStatus; small?: boolean }) {
  const m = STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border-[1.5px] font-bold ${m.pill} ${
        small ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

/* ── прогресс ── */
export function Progress({
  value,
  tone = "pine",
}: {
  value: number;
  tone?: "pine" | "amber" | "coral";
}) {
  const v = Math.min(100, Math.max(0, value));
  const bar = tone === "pine" ? "bg-moss" : tone === "amber" ? "bg-amber" : "bg-coral";
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full border border-ink/25 bg-white">
      <div className={`line-grow h-full rounded-full ${bar}`} style={{ width: `${v}%` }} />
    </div>
  );
}

/* ── аватар-инициалы ── */
const PAL = [
  "bg-pine text-[#f2f5ec]",
  "bg-amber text-ink",
  "bg-moss text-[#f2f5ec]",
  "bg-coralsoft text-coraldeep",
  "bg-ambersoft text-amberdeep",
  "bg-pinedeep text-[#f2f5ec]",
];
export function Avatar({ name, i = 0, small }: { name: string; i?: number; small?: boolean }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-xl border-[1.5px] border-ink font-display font-bold shadow-[2px_2px_0_#1B2A23] ${PAL[i % PAL.length]} ${
        small ? "h-8 w-8 text-[10px]" : "h-10 w-10 text-xs"
      }`}
    >
      {initials}
    </span>
  );
}

/* ── копирование ── */
async function copyText(t: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(t);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = t;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      return true;
    } catch {
      return false;
    }
  }
}

export function CopyBtn({
  text,
  label = "Скопировать",
  small,
}: {
  text: string;
  label?: string;
  small?: boolean;
}) {
  const [ok, setOk] = useState(false);
  return (
    <button
      className={`btn ${ok ? "btn-pine" : "btn-ghost"} ${small ? "btn-sm" : ""}`}
      onClick={async () => {
        if (await copyText(text)) {
          setOk(true);
          setTimeout(() => setOk(false), 1600);
        }
      }}
      title="Скопировать текст"
    >
      {ok ? <IconCheck className="h-3.5 w-3.5" /> : <IconCopy className="h-3.5 w-3.5" />}
      {ok ? "Готово" : label}
    </button>
  );
}

/* ── переключатель-сегменты ── */
export function Seg<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string; count?: number }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={`rounded-lg border-[1.5px] px-3 py-1.5 text-xs font-bold transition-all ${
            value === o.id
              ? "border-ink bg-pine text-[#f2f5ec] shadow-[2px_2px_0_#1B2A23]"
              : "border-ink/25 bg-card text-muted hover:border-ink hover:text-ink"
          }`}
        >
          {o.label}
          {o.count !== undefined && (
            <span className={`ml-1.5 ${value === o.id ? "text-amber" : "text-coral"}`}>{o.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

/* ── пустое состояние ── */
export function EmptyState({
  icon,
  title,
  text,
  action,
}: {
  icon: ReactNode;
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className="anim-rise fcard flex flex-col items-center px-6 py-14 text-center">
      <span className="flex h-14 w-14 -rotate-3 items-center justify-center rounded-2xl border-[1.5px] border-ink bg-mint text-pine shadow-[4px_4px_0_#1B2A23]">
        {icon}
      </span>
      <h2 className="mt-4 font-display text-lg font-bold">{title}</h2>
      <p className="mt-2 max-w-sm text-sm font-medium text-muted">{text}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ── тосты ── */
export interface ToastItem {
  id: number;
  text: string;
  tone: "ok" | "warn" | "pay";
}
export function Toasts({ items }: { items: ToastItem[] }) {
  return (
    <div className="pointer-events-none fixed bottom-20 right-4 z-[70] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2 lg:bottom-5">
      {items.map((t) => (
        <div
          key={t.id}
          className={`anim-toast fcard pointer-events-auto flex items-center gap-2.5 px-4 py-3 text-sm font-semibold ${
            t.tone === "ok" ? "bg-pine text-[#f2f5ec]" : t.tone === "pay" ? "bg-amber text-ink" : "bg-coralsoft text-coraldeep"
          }`}
        >
          {t.tone === "warn" ? (
            <IconAlert className="h-4.5 w-4.5 shrink-0" />
          ) : (
            <IconCheck className="h-4.5 w-4.5 shrink-0" />
          )}
          <span className="leading-snug">{t.text}</span>
        </div>
      ))}
    </div>
  );
}
