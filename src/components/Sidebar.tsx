import { useRef, useState } from "react";
import { wordOfDay } from "../lib/crm";
import {
  IconAsterisk, IconBell, IconCard, IconDatabase, IconDownload, IconGrid,
  IconRefresh, IconTrash, IconUpload, IconUsers,
} from "./icons";

export type Tab = "overview" | "students" | "pay" | "alerts";

const NAV: { id: Tab; label: string; icon: (p: { className?: string }) => JSX.Element }[] = [
  { id: "overview", label: "Сводка", icon: IconGrid },
  { id: "students", label: "Ученики", icon: IconUsers },
  { id: "pay", label: "Платежи", icon: IconCard },
  { id: "alerts", label: "Уведомления", icon: IconBell },
];

const dataBtn =
  "flex w-full items-center gap-2 rounded-lg border-[1.5px] border-[#f2f5ec]/25 px-2.5 py-2 text-left text-xs font-semibold text-[#c9d8cd] transition-all hover:border-amber hover:bg-white/5 hover:text-[#f2f5ec]";

export function Sidebar({
  tab, setTab, debtCount, unread, studentCount, paymentCount,
  onExport, onImportFile, onReset, onClear,
}: {
  tab: Tab;
  setTab: (t: Tab) => void;
  debtCount: number;
  unread: number;
  studentCount: number;
  paymentCount: number;
  onExport: () => void;
  onImportFile: (f: File) => void;
  onReset: () => void;
  onClear: () => void;
}) {
  const [flipped, setFlipped] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [wEn, wRu, wTr] = wordOfDay();

  const navItems = (compact?: boolean) =>
    NAV.map((n) => {
      const active = tab === n.id;
      return (
        <button
          key={n.id}
          onClick={() => setTab(n.id)}
          className={
            compact
              ? `relative flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-bold transition-colors ${
                  active ? "bg-amber text-ink" : "text-[#a9c0b3] hover:text-[#f2f5ec]"
                }`
              : `relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
                  active
                    ? "translate-x-0.5 bg-amber text-ink shadow-[3px_3px_0_rgba(0,0,0,0.3)]"
                    : "text-[#a9c0b3] hover:bg-white/5 hover:text-[#f2f5ec]"
                }`
          }
        >
          <n.icon className={compact ? "h-5 w-5" : "h-[18px] w-[18px]"} />
          {!compact && n.label}
          {n.id === "alerts" && debtCount > 0 && (
            <span
              className={
                compact
                  ? "absolute -right-0.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full border border-ink bg-coral px-1 text-[9px] font-bold text-white"
                  : "ml-auto flex h-5 min-w-5 items-center justify-center rounded-full border border-ink bg-coral px-1.5 text-[10px] font-bold text-white"
              }
            >
              {debtCount}
            </span>
          )}
        </button>
      );
    });

  return (
    <>
      {/* ── десктоп ── */}
      <aside className="pine-texture fixed inset-y-0 left-0 z-40 hidden w-[280px] flex-col gap-5 overflow-y-auto border-r-[1.5px] border-ink bg-pinedeep p-5 lg:flex">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 rotate-3 items-center justify-center rounded-xl border-[1.5px] border-ink bg-amber text-ink shadow-[3px_3px_0_rgba(0,0,0,0.35)]">
            <IconAsterisk className="h-5 w-5" />
          </span>
          <div>
            <p className="font-display text-[15px] font-bold leading-tight text-[#f2f5ec]">Julia English</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber">кабинет оплат</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1.5">{navItems()}</nav>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8fa89b]">Слово дня</p>
          <div
            className={`flip-card mt-2 h-[104px] cursor-pointer select-none ${flipped ? "flipped" : ""}`}
            onClick={() => setFlipped((f) => !f)}
            title="Кликните, чтобы перевернуть карточку"
          >
            <div className="flip-inner">
              <div className="flip-face fcard flex flex-col items-center justify-center bg-pinedeep px-4">
                <p className="font-display text-lg font-bold text-amber">{wEn}</p>
                <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8fa89b]">
                  клик — перевод
                </p>
              </div>
              <div className="flip-face flip-back fcard flex flex-col items-center justify-center bg-amber px-4">
                <p className="font-display text-sm font-bold text-ink">{wRu}</p>
                <p className="mt-1 text-[11px] font-semibold text-ink/70">[{wTr}]</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-auto rounded-xl border-[1.5px] border-[#f2f5ec]/20 bg-black/20 p-3">
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8fa89b]">
            <IconDatabase className="h-3.5 w-3.5 text-amber" /> Данные · локально
          </p>
          <div className="mt-2.5 flex flex-col gap-1.5">
            <button onClick={onExport} className={dataBtn}>
              <IconDownload className="h-3.5 w-3.5 shrink-0 text-amber" /> Скачать копию (.json)
            </button>
            <button onClick={() => fileRef.current?.click()} className={dataBtn}>
              <IconUpload className="h-3.5 w-3.5 shrink-0 text-amber" /> Загрузить копию
            </button>
            <button onClick={onReset} className={dataBtn}>
              <IconRefresh className="h-3.5 w-3.5 shrink-0 text-amber" /> Вернуть демо-данные
            </button>
            <button onClick={onClear} className={`${dataBtn} hover:!border-coral hover:!text-coralsoft`}>
              <IconTrash className="h-3.5 w-3.5 shrink-0 text-coral" /> Очистить всё
            </button>
          </div>
          <p className="mt-2.5 text-[10px] font-medium text-[#7c9587]">
            {studentCount} уч. · {paymentCount} платежей
          </p>
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onImportFile(f);
              e.target.value = "";
            }}
          />
        </div>

        {unread > 0 && (
          <p className="text-center text-[10px] font-semibold text-[#7c9587]">
            непрочитанных событий: <span className="text-amber">{unread}</span>
          </p>
        )}
      </aside>

      {/* ── мобильная шапка ── */}
      <header className="pine-texture fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b-[1.5px] border-ink bg-pinedeep px-4 lg:hidden">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 rotate-3 items-center justify-center rounded-lg border-[1.5px] border-ink bg-amber text-ink shadow-[2px_2px_0_rgba(0,0,0,0.35)]">
            <IconAsterisk className="h-4 w-4" />
          </span>
          <p className="font-display text-[13px] font-bold text-[#f2f5ec]">
            Julia English <span className="text-amber">· CRM</span>
          </p>
        </div>
        <button
          onClick={() => setTab("alerts")}
          className="relative flex h-9 w-9 items-center justify-center rounded-lg border-[1.5px] border-[#f2f5ec]/30 text-[#f2f5ec]"
          aria-label="Уведомления"
        >
          <IconBell className="h-4.5 w-4.5" />
          {debtCount > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full border border-ink bg-coral px-1 text-[9px] font-bold text-white">
              {debtCount}
            </span>
          )}
        </button>
      </header>

      {/* ── мобильная нижняя навигация ── */}
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 gap-1 border-t-[1.5px] border-ink bg-pinedeep px-2 pb-[max(0.4rem,env(safe-area-inset-bottom))] pt-1.5 lg:hidden">
        {navItems(true)}
      </nav>
    </>
  );
}
