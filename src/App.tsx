import { useState } from "react";
import { downloadFile, fmt, monthKey, monthLabel, paidByStudent, shiftMonth, statusOf } from "./lib/crm";
import { useCrm } from "./lib/store";
import type { PaymentInput } from "./lib/store";
import { Sidebar } from "./components/Sidebar";
import type { Tab } from "./components/Sidebar";
import { Dashboard } from "./components/Dashboard";
import { StudentsView } from "./components/StudentsView";
import { PaymentModal, PaymentsView } from "./components/PaymentsView";
import { NotificationsView } from "./components/NotificationsView";
import { Modal, Toasts } from "./components/ui";
import type { ToastItem } from "./components/ui";
import { IconChevronL, IconChevronR, IconPlus } from "./components/icons";

const TITLES: Record<Tab, { title: string; sub: string }> = {
  overview: { title: "Сводка", sub: "кто оплатил, кто нет и сколько собрано" },
  students: { title: "Ученики", sub: "карточки учеников и статусы оплат" },
  pay: { title: "Платежи", sub: "журнал всех поступлений" },
  alerts: { title: "Уведомления", sub: "должники и готовые напоминания" },
};

export default function App() {
  const crm = useCrm();
  const { db } = crm;

  const [tab, setTab] = useState<Tab>("overview");
  const [mKey, setMKey] = useState(() => monthKey(new Date()));
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [pay, setPay] = useState<{ open: boolean; studentId?: string }>({ open: false });
  const [confirm, setConfirm] = useState<null | "reset" | "clear">(null);

  const curKey = monthKey(new Date());
  const [mkY, mkM] = mKey.split("-").map(Number);

  const notify = (text: string, tone: ToastItem["tone"] = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-3), { id, text, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600);
  };

  /* счётчики для сайдбара */
  const paidMap = paidByStudent(db.payments, curKey);
  const debtCount = db.students.filter(
    (s) => s.active && statusOf(paidMap.get(s.id) ?? 0, s.fee) !== "paid",
  ).length;
  const unread = db.events.filter((e) => !e.read).length;

  const openPay = (studentId?: string) => {
    if (!db.students.some((s) => s.active)) {
      notify("Сначала добавьте ученика — записывать оплату пока не на кого", "warn");
      setTab("students");
      return;
    }
    setPay({ open: true, studentId });
  };

  const savePayment = (p: PaymentInput) => {
    crm.addPayment(p);
    const name = db.students.find((s) => s.id === p.studentId)?.name ?? "ученик";
    notify(`Платёж ${fmt(p.amount)} от ${name.split(" ")[0]} записан — ${monthLabel(p.monthKey)}`, "pay");
    setPay({ open: false });
  };

  const onExport = () => {
    downloadFile(`julia-english-crm-${new Date().toISOString().slice(0, 10)}.json`, crm.exportJson());
    notify("Резервная копия скачана — храните её в надёжном месте");
  };

  const onImportFile = (file: File) => {
    file.text().then((raw) => {
      if (crm.importJson(raw)) notify("Копия загружена — данные восстановлены");
      else notify("Не получилось прочитать файл: это не копия CRM", "warn");
    });
  };

  const t = TITLES[tab];

  return (
    <div className="min-h-screen bg-scene">
      <Sidebar
        tab={tab}
        setTab={setTab}
        debtCount={debtCount}
        unread={unread}
        studentCount={db.students.length}
        paymentCount={db.payments.length}
        onExport={onExport}
        onImportFile={onImportFile}
        onReset={() => setConfirm("reset")}
        onClear={() => setConfirm("clear")}
      />

      <div className="pt-14 lg:pl-[280px] lg:pt-0">
        {/* ── шапка ── */}
        <header className="sticky top-14 z-30 border-b-[1.5px] border-line bg-paper/85 backdrop-blur lg:top-0">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-3 px-4 py-4 sm:px-6">
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-xl font-bold leading-tight sm:text-2xl">
                {t.title}
                <span className="text-amber">.</span>
              </h1>
              <p className="mt-0.5 text-xs font-medium text-muted">{t.sub}</p>
            </div>

            {tab !== "alerts" && (
              <div className="flex items-center gap-2">
                {mKey !== curKey && (
                  <button className="btn btn-ghost btn-sm" onClick={() => setMKey(curKey)}>
                    к текущему
                  </button>
                )}
                <div className="flex items-center overflow-hidden rounded-lg border-[1.5px] border-ink bg-card shadow-[3px_3px_0_#1B2A23]">
                  <button
                    onClick={() => setMKey(monthKey(shiftMonth(new Date(mkY, mkM - 1, 1), 0)))}
                    className="flex h-10 w-10 items-center justify-center border-r-[1.5px] border-ink transition-colors hover:bg-amber"
                    aria-label="Предыдущий месяц"
                  >
                    <IconChevronL className="h-4 w-4" />
                  </button>
                  <span className="min-w-[112px] px-2 text-center text-xs font-bold">{monthLabel(mKey)}</span>
                  <button
                    onClick={() => setMKey(monthKey(shiftMonth(new Date(mkY, mkM - 1, 1), 1)))}
                    className="flex h-10 w-10 items-center justify-center border-l-[1.5px] border-ink transition-colors hover:bg-amber"
                    aria-label="Следующий месяц"
                  >
                    <IconChevronR className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            <button className="btn btn-amber" onClick={() => openPay()}>
              <IconPlus className="h-4 w-4" /> Оплата
            </button>
          </div>
        </header>

        {/* ── контент ── */}
        <main className="mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:pb-14">
          <div key={tab} className="anim-rise">
            {tab === "overview" && (
              <Dashboard crm={crm} mKey={mKey} onPay={openPay} onPickMonth={setMKey} goto={setTab} />
            )}
            {tab === "students" && (
              <StudentsView crm={crm} mKey={mKey} onPay={openPay} notify={notify} />
            )}
            {tab === "pay" && <PaymentsView crm={crm} mKey={mKey} onAdd={() => openPay()} />}
            {tab === "alerts" && (
              <NotificationsView crm={crm} onPay={openPay} notify={notify} />
            )}
          </div>

          <footer className="mt-10 border-t-[1.5px] border-dashed border-line pt-4 text-center text-[11px] font-medium text-muted">
            Данные хранятся локально в вашем браузере · для переноса используйте «Скачать копию» в меню слева ·{" "}
            <a href="https://juliaenglish.ru" target="_blank" rel="noreferrer" className="font-bold text-pine underline decoration-amber decoration-2 underline-offset-4">
              juliaenglish.ru
            </a>
          </footer>
        </main>
      </div>

      {/* ── модалки и тосты ── */}
      {pay.open && (
        <PaymentModal
          db={db}
          mKey={mKey}
          studentId={pay.studentId}
          onClose={() => setPay({ open: false })}
          onSave={savePayment}
        />
      )}

      <Modal open={confirm !== null} onClose={() => setConfirm(null)} title={confirm === "reset" ? "Вернуть демо-данные?" : "Очистить всё?"}>
        <p className="text-sm font-medium leading-relaxed text-muted">
          {confirm === "reset"
            ? "Текущие ученики и платежи будут заменены демонстрационной базой. Перед сбросом можно скачать копию своих данных."
            : `Будут удалены все ученики (${db.students.length}), платежи (${db.payments.length}) и события. Перед очисткой рекомендуем скачать копию.`}
        </p>
        <div className="mt-5 flex gap-2">
          <button className="btn btn-ghost flex-1" onClick={() => setConfirm(null)}>Отмена</button>
          <button className="btn btn-ghost flex-1" onClick={onExport}>
            Сначала скачать копию
          </button>
          <button
            className="btn btn-danger flex-1"
            onClick={() => {
              if (confirm === "reset") {
                crm.resetDemo();
                notify("Демо-данные восстановлены", "warn");
              } else {
                crm.clearAll();
                notify("База очищена — можно начинать с чистого листа", "warn");
              }
              setConfirm(null);
            }}
          >
            {confirm === "reset" ? "Сбросить" : "Очистить"}
          </button>
        </div>
      </Modal>

      <Toasts items={toasts} />
    </div>
  );
}
