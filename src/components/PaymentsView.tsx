import { useMemo, useState } from "react";
import type { Method, Payment, Student } from "../lib/crm";
import {
  COURSES, METHODS, METHOD_IDS, dateInput, downloadFile, fmt, fmtDate, monthKeyOfInput,
  monthLabel, paidByStudent,
} from "../lib/crm";
import type { Crm, PaymentInput } from "../lib/store";
import { IconBanknote, IconCard, IconClock, IconDownload, IconPlus, IconWallet } from "./icons";
import { Avatar, EmptyState, Modal, Reveal, Seg } from "./ui";

type Mode = "month" | "all";

export function PaymentsView({
  crm, mKey, onAdd,
}: {
  crm: Crm;
  mKey: string;
  onAdd: () => void;
}) {
  const { db } = crm;
  const [mode, setMode] = useState<Mode>("month");

  const rows = useMemo(() => {
    const list = mode === "all" ? db.payments : db.payments.filter((p) => p.monthKey === mKey);
    return [...list].sort((a, b) => b.date.localeCompare(a.date));
  }, [db.payments, mKey, mode]);

  const total = rows.reduce((s, p) => s + p.amount, 0);
  const avg = rows.length ? total / rows.length : 0;
  const nameOf = (id: string) => db.students.find((s) => s.id === id);

  const exportCsv = () => {
    const head = "Дата;Ученик;Сумма;Месяц;Способ;Заметка";
    const body = rows.map((p) =>
      [
        p.date.slice(0, 10),
        (nameOf(p.studentId)?.name ?? "—").replace(/;/g, ","),
        p.amount,
        p.monthKey,
        METHODS[p.method],
        (p.note ?? "").replace(/;/g, ","),
      ].join(";"),
    );
    downloadFile(
      `julia-english-payments-${mode === "all" ? "all" : mKey}.csv`,
      "\uFEFF" + [head, ...body].join("\n"),
      "text/csv;charset=utf-8",
    );
  };

  return (
    <div>
      <div className="fcard anim-rise flex flex-wrap items-center gap-3 p-4 sm:p-5">
        <Seg<Mode>
          value={mode}
          onChange={setMode}
          options={[
            { id: "month", label: monthLabel(mKey) },
            { id: "all", label: "Всё время" },
          ]}
        />
        <div className="ml-auto flex items-center gap-2">
          <button className="btn btn-ghost btn-sm" onClick={exportCsv} disabled={rows.length === 0} title="Выгрузить в таблицу">
            <IconDownload className="h-3.5 w-3.5" /> CSV
          </button>
          <button className="btn btn-amber" onClick={onAdd}>
            <IconPlus className="h-4 w-4" /> Внести платёж
          </button>
        </div>
      </div>

      {/* итоги */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        {[
          { icon: <IconWallet className="h-4 w-4" />, label: "Сумма", value: fmt(total) },
          { icon: <IconCard className="h-4 w-4" />, label: "Платежей", value: String(rows.length) },
          { icon: <IconClock className="h-4 w-4" />, label: "Средний чек", value: rows.length ? fmt(avg) : "—" },
        ].map((s, i) => (
          <Reveal key={s.label} delay={i * 60}>
            <div className="fcard flex items-center gap-2.5 p-3 sm:gap-3 sm:p-4">
              <span className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg border-[1.5px] border-ink bg-mint text-pine sm:flex">
                {s.icon}
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">{s.label}</p>
                <p className="truncate font-display text-[15px] font-bold sm:text-lg">{s.value}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      {/* журнал */}
      <div className="fcard mt-4 overflow-hidden">
        {rows.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={<IconBanknote className="h-7 w-7" />}
              title={mode === "month" ? `За ${monthLabel(mKey).toLowerCase()} платежей нет` : "Платежей пока нет"}
              text="Как только ученик переведёт деньги по СБП — внесите платёж, и он попадёт в отчёт."
              action={
                <button className="btn btn-amber" onClick={onAdd}>
                  <IconPlus className="h-4 w-4" /> Внести платёж
                </button>
              }
            />
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {rows.map((p: Payment, i) => {
              const st = nameOf(p.studentId);
              return (
                <Reveal key={p.id} delay={Math.min(i, 8) * 35}>
                  <li className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 transition-colors hover:bg-mint/50 sm:px-5">
                    <span className="flex h-9 w-16 shrink-0 items-center justify-center rounded-md border-[1.5px] border-ink bg-ambersoft text-[11px] font-bold">
                      {fmtDate(p.date)}
                    </span>
                    {st ? <Avatar name={st.name} i={st.name.length} small /> : null}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">{st?.name ?? "Ученик удалён"}</p>
                      <p className="truncate text-[11px] font-medium text-muted">
                        {st ? `${COURSES[st.courseId].label} · ` : ""}
                        {METHODS[p.method]}
                        {p.note ? ` · ${p.note}` : ""}
                      </p>
                    </div>
                    {p.monthKey !== mKey && (
                      <span className="rounded-full border-[1.5px] border-ink/25 bg-paper px-2 py-0.5 text-[10px] font-bold text-muted">
                        за {monthLabel(p.monthKey).toLowerCase()}
                      </span>
                    )}
                    <p className="font-display text-sm font-bold text-pine">+{fmt(p.amount)}</p>
                  </li>
                </Reveal>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ── модалка платежа (используется по всему приложению) ── */
export function PaymentModal({
  db, mKey, studentId, onClose, onSave,
}: {
  db: { students: Student[]; payments: Payment[] };
  mKey: string;
  studentId?: string;
  onClose: () => void;
  onSave: (p: PaymentInput) => void;
}) {
  const activeStudents = db.students.filter((s) => s.active);
  const [sid, setSid] = useState(studentId ?? activeStudents[0]?.id ?? "");
  const student = activeStudents.find((s) => s.id === sid);
  const [date, setDate] = useState(() => dateInput(new Date()));
  const [method, setMethod] = useState<Method>("sbp");
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");

  const paidMap = paidByStudent(db.payments, monthKeyOfInput(date));
  const remaining = student ? Math.max(0, student.fee - (paidMap.get(student.id) ?? 0)) : 0;
  const suggested = student ? (remaining > 0 ? remaining : student.fee) : 0;

  const [amount, setAmount] = useState<string>(() => String(suggested));

  const pickStudent = (id: string) => {
    setSid(id);
    const st = activeStudents.find((s) => s.id === id);
    if (st) {
      const rem = Math.max(0, st.fee - (paidMap.get(st.id) ?? 0));
      setAmount(String(rem > 0 ? rem : st.fee));
    }
  };

  const payMonthKey = monthKeyOfInput(date);
  const label = "mb-1 block text-[11px] font-bold uppercase tracking-[0.1em] text-muted";

  const submit = () => {
    const amt = Number(amount);
    if (!student) return setErr("Выберите ученика");
    if (!Number.isFinite(amt) || amt <= 0) return setErr("Сумма должна быть больше нуля");
    onSave({
      studentId: student.id,
      amount: amt,
      date: new Date(`${date}T12:00:00`).toISOString(),
      monthKey: payMonthKey,
      method,
      note: note.trim() || undefined,
    });
  };

  return (
    <Modal open onClose={onClose} title="Внести платёж">
      <div className="flex flex-col gap-4">
        <div>
          <label className={label}>Ученик</label>
          <select className="inp" value={sid} onChange={(e) => pickStudent(e.target.value)}>
            {activeStudents.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} — {COURSES[s.courseId].label} ({fmt(s.fee)})
              </option>
            ))}
          </select>
          {student && (
            <p className="mt-1.5 text-[11px] font-semibold text-muted">
              за {monthLabel(payMonthKey).toLowerCase()} уже получено{" "}
              <b className="text-ink">{fmt(paidMap.get(student.id) ?? 0)}</b> из {fmt(student.fee)}
              {remaining > 0 && <span className="text-coraldeep"> · осталось {fmt(remaining)}</span>}
              {remaining === 0 && <span className="text-pine"> · месяц закрыт ✓</span>}
            </p>
          )}
        </div>

        <div>
          <label className={label}>Сумма, ₽</label>
          <input className="inp font-display font-bold" type="number" min={1} value={amount}
            onChange={(e) => setAmount(e.target.value)} />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {[1500, 5600, 10400].map((v) => (
              <button key={v} type="button"
                className={`rounded-lg border-[1.5px] px-2.5 py-1 text-xs font-bold transition-all ${
                  Number(amount) === v ? "border-ink bg-amber shadow-[2px_2px_0_#1B2A23]" : "border-ink/25 bg-white text-muted hover:border-ink hover:text-ink"
                }`}
                onClick={() => setAmount(String(v))}>
                {fmt(v)}
              </button>
            ))}
            {student && remaining > 0 && (
              <button type="button"
                className={`rounded-lg border-[1.5px] px-2.5 py-1 text-xs font-bold transition-all ${
                  Number(amount) === remaining ? "border-ink bg-amber shadow-[2px_2px_0_#1B2A23]" : "border-ink/25 bg-white text-muted hover:border-ink hover:text-ink"
                }`}
                onClick={() => setAmount(String(remaining))}>
                остаток {fmt(remaining)}
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label}>Дата платежа</label>
            <input className="inp" type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
          </div>
          <div>
            <label className={label}>Зачислится в</label>
            <p className="inp flex items-center bg-paper font-semibold">{monthLabel(payMonthKey)}</p>
          </div>
        </div>

        <div>
          <label className={label}>Способ оплаты</label>
          <div className="grid grid-cols-3 gap-1.5">
            {METHOD_IDS.map((m) => (
              <button key={m} type="button" onClick={() => setMethod(m)}
                className={`rounded-lg border-[1.5px] px-2 py-2 text-xs font-bold transition-all ${
                  method === m ? "border-ink bg-pine text-[#f2f5ec] shadow-[2px_2px_0_#1B2A23]" : "border-ink/25 bg-white text-muted hover:border-ink hover:text-ink"
                }`}>
                {METHODS[m]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={label}>Заметка (необязательно)</label>
          <input className="inp" value={note} placeholder="Например: пакет со скидкой"
            onChange={(e) => setNote(e.target.value)} />
        </div>

        {err && <p className="rounded-lg border-[1.5px] border-coral/60 bg-coralsoft px-3 py-2 text-xs font-bold text-coraldeep">{err}</p>}

        <div className="flex gap-2 pt-1">
          <button className="btn btn-ghost flex-1" onClick={onClose}>Отмена</button>
          <button className="btn btn-pine flex-1" onClick={submit}>
            <IconBanknote className="h-4 w-4" /> Записать {amount && Number(amount) > 0 ? fmt(Number(amount)) : ""}
          </button>
        </div>
      </div>
    </Modal>
  );
}
