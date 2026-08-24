import type { ReactNode } from "react";
import type { Payment } from "../lib/crm";
import {
  COURSES, fmt, fmtDate, monthKey, monthLabel, paidByStudent, plural,
  reminderText, shiftMonth, statusOf, tgLink, MONTHS,
} from "../lib/crm";
import type { Tab } from "./Sidebar";
import type { Crm } from "../lib/store";
import {
  IconAlert, IconArrowUp, IconBanknote, IconCheck, IconPlus, IconSend, IconTarget, IconUsers, IconWallet,
} from "./icons";
import { Avatar, CopyBtn, EmptyState, Reveal, StatusPill } from "./ui";

function Stat({
  icon, label, value, sub, tone = "default", children,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "amber" | "coral";
  children?: ReactNode;
}) {
  const tag =
    tone === "amber" ? "bg-amber text-ink" : tone === "coral" ? "bg-coral text-white" : "bg-pine text-[#f2f5ec]";
  return (
    <div className="fcard fcard-hover relative overflow-hidden p-4 sm:p-5">
      <span className={`absolute -right-2 -top-2 flex h-9 w-9 rotate-12 items-center justify-center rounded-lg border-[1.5px] border-ink ${tag}`}>
        {icon}
      </span>
      <p className="pr-8 text-[11px] font-bold uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className="mt-2 font-display text-xl font-bold leading-none sm:text-[26px]">{value}</p>
      {sub && <p className="mt-2 text-xs font-medium text-muted">{sub}</p>}
      {children}
    </div>
  );
}

function Donut({ pct }: { pct: number }) {
  const r = 40;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-16 w-16 shrink-0">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" strokeWidth="14" className="stroke-line" />
        <circle
          cx="50" cy="50" r={r} fill="none" strokeWidth="14" strokeLinecap="round"
          className="stroke-amber"
          strokeDasharray={`${Math.max(0.5, (pct / 100) * c)} ${c}`}
          style={{ transition: "stroke-dasharray 0.8s cubic-bezier(0.2,0.8,0.3,1)" }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-display text-[13px] font-bold">
        {pct}%
      </span>
    </div>
  );
}

export function Dashboard({
  crm, mKey, onPay, onPickMonth, goto,
}: {
  crm: Crm;
  mKey: string;
  onPay: (studentId: string) => void;
  onPickMonth: (key: string) => void;
  goto: (t: Tab) => void;
}) {
  const { db } = crm;
  const active = db.students.filter((s) => s.active);
  const paidMap = paidByStudent(db.payments, mKey);

  const monthPayments = db.payments.filter((p) => p.monthKey === mKey);
  const totalPaid = monthPayments.reduce((s, p) => s + p.amount, 0);
  const expected = active.reduce((s, st) => s + st.fee, 0);
  const debt = active.reduce((s, st) => s + Math.max(0, st.fee - (paidMap.get(st.id) ?? 0)), 0);
  const paidCount = active.filter((s) => statusOf(paidMap.get(s.id) ?? 0, s.fee) === "paid").length;
  const pct = expected > 0 ? Math.round((totalPaid / expected) * 100) : 0;

  /* график: последние 6 месяцев, заканчивая текущим */
  const now = new Date();
  const curKey = monthKey(now);
  const chartKeys = Array.from({ length: 6 }, (_, i) => monthKey(shiftMonth(now, i - 5)));
  const chartVals = chartKeys.map((k) =>
    db.payments.filter((p) => p.monthKey === k).reduce((s, p) => s + p.amount, 0),
  );
  const chartMax = Math.max(1, ...chartVals);

  /* структура по тарифам за выбранный месяц */
  const byCourse = new Map<string, { expected: number; collected: number; count: number }>();
  active.forEach((s) => {
    const c = byCourse.get(s.courseId) ?? { expected: 0, collected: 0, count: 0 };
    c.expected += s.fee;
    c.collected += Math.min(s.fee, paidMap.get(s.id) ?? 0);
    c.count += 1;
    byCourse.set(s.courseId, c);
  });

  /* требуют внимания */
  const attention = active
    .map((s) => ({ s, paid: paidMap.get(s.id) ?? 0 }))
    .filter((x) => statusOf(x.paid, x.s.fee) !== "paid")
    .sort((a, b) => (b.s.fee - b.paid) - (a.s.fee - a.paid));

  const recent = [...db.payments].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
  const nameOf = (id: string) => db.students.find((s) => s.id === id)?.name ?? "—";

  if (db.students.length === 0) {
    return (
      <EmptyState
        icon={<IconUsers className="h-7 w-7" />}
        title="Пока нет учеников"
        text="Добавьте первого ученика — укажите тариф и ожидаемую сумму, и CRM начнёт следить за оплатами."
        action={
          <button className="btn btn-pine" onClick={() => goto("students")}>
            <IconPlus className="h-4 w-4" /> Добавить ученика
          </button>
        }
      />
    );
  }

  return (
    <div>
      {/* ── ключевые цифры месяца ── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Reveal>
          <Stat
            icon={<IconWallet className="h-4.5 w-4.5" />}
            label="Собрано"
            value={fmt(totalPaid)}
            tone="amber"
            sub={`${monthPayments.length} ${plural(monthPayments.length, "платёж", "платежа", "платежей")} за ${monthLabel(mKey).toLowerCase()}`}
          />
        </Reveal>
        <Reveal delay={60}>
          <Stat
            icon={<IconTarget className="h-4.5 w-4.5" />}
            label="Ожидается"
            value={fmt(expected)}
            sub={`по ${active.length} ${plural(active.length, "активному ученику", "активным ученикам", "активным ученикам")}`}
          />
        </Reveal>
        <Reveal delay={120}>
          <Stat
            icon={<IconAlert className="h-4.5 w-4.5" />}
            label="Не собрано"
            value={debt > 0 ? fmt(debt) : "0 ₽"}
            tone={debt > 0 ? "coral" : "default"}
            sub={
              debt > 0
                ? `${attention.length} ${plural(attention.length, "должник", "должника", "должников")} — список ниже`
                : "долгов нет — отличная работа"
            }
          />
        </Reveal>
        <Reveal delay={180}>
          <Stat
            icon={<IconCheck className="h-4.5 w-4.5" />}
            label="Оплатили"
            value={`${paidCount} из ${active.length}`}
            sub="доля закрытого месяца"
          >
            <div className="mt-3 flex items-center gap-3">
              <Donut pct={pct} />
              <p className="text-[11px] font-medium leading-relaxed text-muted">
                {pct >= 100 ? "месяц закрыт полностью!" : pct >= 60 ? "идёте по плану" : "стоит поторопить должников"}
              </p>
            </div>
          </Stat>
        </Reveal>
      </div>

      {/* ── график + структура ── */}
      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        <Reveal className="xl:col-span-2">
          <div className="fcard h-full p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display text-[15px] font-bold">
                Сборы за <span className="hl">6 месяцев</span>
              </h2>
              <p className="text-xs font-medium text-muted">клик по столбику — открыть месяц</p>
            </div>
            <div className="mt-6 flex h-44 items-end gap-2 sm:gap-3">
              {chartKeys.map((k, i) => {
                const v = chartVals[i];
                const h = Math.max(4, Math.round((v / chartMax) * 100));
                const sel = k === mKey;
                const isCur = k === curKey;
                const [, m] = k.split("-").map(Number);
                return (
                  <button
                    key={k}
                    onClick={() => onPickMonth(k)}
                    className="group flex h-full flex-1 flex-col items-center justify-end gap-2"
                    title={`${monthLabel(k)} — ${fmt(v)}`}
                  >
                    <span
                      className={`pointer-events-none rounded-md border-[1.5px] border-ink bg-card px-2 py-0.5 text-[11px] font-bold opacity-0 shadow-[2px_2px_0_#1B2A23] transition-opacity group-hover:opacity-100 ${
                        sel ? "!opacity-100" : ""
                      }`}
                    >
                      {fmt(v)}
                    </span>
                    <span
                      className={`bar-grow w-full max-w-[64px] rounded-t-md border-[1.5px] border-ink transition-colors ${
                        sel ? "bg-amber" : isCur ? "bg-pine" : "bg-mint group-hover:bg-ambersoft"
                      }`}
                      style={{ height: `${h}%`, animationDelay: `${i * 60}ms` }}
                    />
                    <span className={`text-[11px] font-bold ${sel ? "text-ink" : "text-muted"}`}>
                      {MONTHS[m - 1].slice(0, 3)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </Reveal>

        <Reveal delay={90}>
          <div className="fcard h-full p-5">
            <h2 className="font-display text-[15px] font-bold">
              По <span className="hl">тарифам</span>
            </h2>
            <p className="mt-1 text-xs font-medium text-muted">за {monthLabel(mKey).toLowerCase()}</p>
            <div className="mt-4 flex flex-col gap-4">
              {[...byCourse.entries()].map(([cid, c]) => (
                <div key={cid}>
                  <div className="mb-1.5 flex items-baseline justify-between gap-2">
                    <p className="text-[13px] font-bold">{COURSES[cid as keyof typeof COURSES]?.label ?? cid}</p>
                    <p className="font-display text-[13px] font-bold text-pine">{fmt(c.collected)}</p>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full border border-ink/25 bg-white">
                    <div
                      className="line-grow h-full rounded-full bg-pinesoft"
                      style={{ width: `${c.expected > 0 ? Math.min(100, (c.collected / c.expected) * 100) : 0}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[11px] font-medium text-muted">
                    {c.count} {plural(c.count, "ученик", "ученика", "учеников")} · план {fmt(c.expected)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>

      {/* ── внимание + последние платежи ── */}
      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <Reveal>
          <div className="fcard h-full p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-[15px] font-bold">
                Требуют <span className="hl">внимания</span>
              </h2>
              {attention.length > 0 && (
                <span className="rounded-full border-[1.5px] border-coral/60 bg-coralsoft px-2.5 py-0.5 text-xs font-bold text-coraldeep">
                  {attention.length}
                </span>
              )}
            </div>

            {attention.length === 0 ? (
              <div className="mt-4 flex items-center gap-3 rounded-lg border-[1.5px] border-moss/50 bg-mint px-4 py-4">
                <IconCheck className="h-5 w-5 shrink-0 text-pine" />
                <p className="text-sm font-semibold text-pine">
                  Все ученики оплатили {monthLabel(mKey).toLowerCase()}. Можно выдохнуть ☕
                </p>
              </div>
            ) : (
              <ul className="mt-3 divide-y divide-line">
                {attention.map(({ s, paid }) => {
                  const owed = s.fee - paid;
                  const link = tgLink(s.contact);
                  return (
                    <li key={s.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3">
                      <Avatar name={s.name} i={s.name.length} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold">{s.name}</p>
                        <p className="text-xs font-medium text-coraldeep">
                          {paid > 0 ? `частично · осталось ${fmt(owed)}` : `долг ${fmt(owed)}`}
                        </p>
                      </div>
                      <StatusPill status={statusOf(paid, s.fee)} small />
                      <div className="flex items-center gap-1.5">
                        {link && (
                          <a className="icon-btn" href={link} target="_blank" rel="noreferrer" title={`Написать в Telegram: ${s.contact}`}>
                            <IconSend className="h-4 w-4" />
                          </a>
                        )}
                        <CopyBtn small label="Текст" text={reminderText(s.name, s.fee, paid, monthLabel(mKey))} />
                        <button className="btn btn-pine btn-sm" onClick={() => onPay(s.id)}>
                          <IconPlus className="h-3.5 w-3.5" /> оплата
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Reveal>

        <Reveal delay={90}>
          <div className="fcard h-full p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-[15px] font-bold">
                Последние <span className="hl">платежи</span>
              </h2>
              <button className="btn btn-ghost btn-sm" onClick={() => goto("pay")}>
                все платежи <IconArrowUp className="h-3.5 w-3.5 rotate-45" />
              </button>
            </div>
            {recent.length === 0 ? (
              <p className="mt-4 rounded-lg border-[1.5px] border-dashed border-line bg-white/60 px-4 py-6 text-center text-sm font-medium text-muted">
                Платежей пока нет — внесите первый.
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-line">
                {recent.map((p: Payment) => (
                  <li key={p.id} className="flex items-center gap-3 py-2.5">
                    <span className="flex h-9 w-14 shrink-0 items-center justify-center rounded-md border-[1.5px] border-ink bg-ambersoft text-[11px] font-bold">
                      {fmtDate(p.date)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">{nameOf(p.studentId)}</p>
                      <p className="text-[11px] font-medium text-muted">
                        {p.monthKey !== mKey && `за ${monthLabel(p.monthKey).toLowerCase()} · `}
                        {p.note || "оплата занятий"}
                      </p>
                    </div>
                    <p className="font-display text-sm font-bold text-pine">+{fmt(p.amount)}</p>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4 flex items-center gap-2 rounded-lg border-[1.5px] border-ink bg-pinedeep px-4 py-3 text-[#c9d8cd]">
              <IconBanknote className="h-5 w-5 shrink-0 text-amber" />
              <p className="text-xs font-medium leading-relaxed">
                Основной способ оплаты на juliaenglish.ru — <b className="text-[#f2f5ec]">СБП по QR-коду</b>. Отмечайте способ при внесении платежа.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
