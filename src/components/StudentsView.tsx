import { useMemo, useState } from "react";
import type { Audience, CourseId, Student } from "../lib/crm";
import {
  AUDIENCES, COURSES, COURSE_IDS, fmt, monthKey, paidByStudent, plural, statusOf, tgLink,
} from "../lib/crm";
import type { Crm } from "../lib/store";
import {
  IconPencil, IconPlus, IconRefresh, IconSearch, IconSend, IconTrash, IconUsers,
} from "./icons";
import { Avatar, EmptyState, Modal, Progress, Reveal, Seg, StatusPill } from "./ui";

type Filter = "all" | "unpaid" | "partial" | "paid" | "inactive";

export function StudentsView({
  crm, mKey, onPay, notify,
}: {
  crm: Crm;
  mKey: string;
  onPay: (studentId: string) => void;
  notify: (text: string, tone?: "ok" | "warn" | "pay") => void;
}) {
  const { db, removeStudent, updateStudent } = crm;
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [modal, setModal] = useState<{ mode: "add" } | { mode: "edit"; student: Student } | null>(null);

  const paidMap = paidByStudent(db.payments, mKey);

  const rows = useMemo(() => {
    const query = q.trim().toLowerCase();
    return db.students
      .map((s) => ({ s, paid: paidMap.get(s.id) ?? 0, status: statusOf(paidMap.get(s.id) ?? 0, s.fee) }))
      .filter((r) => {
        if (filter === "inactive") return !r.s.active;
        if (!r.s.active) return false;
        if (filter !== "all" && r.status !== filter) return false;
        if (
          query &&
          ![r.s.name, r.s.contact, r.s.note].some((v) => v.toLowerCase().includes(query))
        )
          return false;
        return true;
      })
      .sort((a, b) => a.s.name.localeCompare(b.s.name, "ru"));
  }, [db.students, paidMap, q, filter]);

  const counts = useMemo(() => {
    const act = db.students.filter((s) => s.active);
    const st = (id: string) => statusOf(paidMap.get(id) ?? 0, db.students.find((s) => s.id === id)?.fee ?? 0);
    return {
      all: act.length,
      unpaid: act.filter((s) => st(s.id) === "unpaid").length,
      partial: act.filter((s) => st(s.id) === "partial").length,
      paid: act.filter((s) => st(s.id) === "paid").length,
      inactive: db.students.filter((s) => !s.active).length,
    };
  }, [db.students, paidMap]);

  return (
    <div>
      {/* ── панель управления ── */}
      <div className="fcard anim-rise flex flex-col gap-3 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-0 flex-1 basis-56">
            <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              className="inp pl-9"
              placeholder="Имя, @telegram, заметка…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <button className="btn btn-pine" onClick={() => setModal({ mode: "add" })}>
            <IconPlus className="h-4 w-4" /> Ученик
          </button>
        </div>
        <Seg<Filter>
          value={filter}
          onChange={setFilter}
          options={[
            { id: "all", label: "Все", count: counts.all },
            { id: "unpaid", label: "Должники", count: counts.unpaid },
            { id: "partial", label: "Частично", count: counts.partial },
            { id: "paid", label: "Оплатили", count: counts.paid },
            { id: "inactive", label: "Архив", count: counts.inactive },
          ]}
        />
      </div>

      {/* ── карточки ── */}
      {rows.length === 0 ? (
        <div className="mt-5">
          <EmptyState
            icon={<IconUsers className="h-7 w-7" />}
            title={db.students.length === 0 ? "Пока нет учеников" : "Никого не нашлось"}
            text={
              db.students.length === 0
                ? "Добавьте первого ученика с тарифом и суммой — CRM сама посчитает, кто оплатил, а кто нет."
                : "Попробуйте другой запрос или фильтр."
            }
            action={
              db.students.length === 0 ? (
                <button className="btn btn-pine" onClick={() => setModal({ mode: "add" })}>
                  <IconPlus className="h-4 w-4" /> Добавить ученика
                </button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map(({ s, paid, status }, i) => {
            const link = tgLink(s.contact);
            return (
              <Reveal key={s.id} delay={(i % 6) * 50}>
                <div className={`fcard fcard-hover flex h-full flex-col p-4 ${s.active ? "" : "opacity-70"}`}>
                  <div className="flex items-start gap-3">
                    <Avatar name={s.name} i={s.name.length} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-[14px] font-bold leading-tight">{s.name}</p>
                      <p className="mt-0.5 text-[11px] font-semibold text-muted">
                        {AUDIENCES[s.audience]} · {COURSES[s.courseId].label}
                      </p>
                    </div>
                    {s.active ? <StatusPill status={status} small /> : (
                      <span className="rounded-full border-[1.5px] border-ink/30 bg-paper px-2 py-0.5 text-[10px] font-bold text-muted">
                        В архиве
                      </span>
                    )}
                  </div>

                  <div className="mt-3">
                    <div className="mb-1 flex items-baseline justify-between gap-2">
                      <p className="text-[11px] font-semibold text-muted">
                        оплачено <b className="text-ink">{fmt(paid)}</b> из {fmt(s.fee)}
                      </p>
                      {paid > 0 && s.active && paid < s.fee && (
                        <p className="text-[11px] font-bold text-coraldeep">осталось {fmt(s.fee - paid)}</p>
                      )}
                    </div>
                    <Progress
                      value={s.fee > 0 ? (paid / s.fee) * 100 : 0}
                      tone={status === "paid" ? "pine" : status === "partial" ? "amber" : "coral"}
                    />
                  </div>

                  {s.contact && (
                    <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-muted">
                      {link ? (
                        <a href={link} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 rounded-md px-1 py-0.5 text-pine underline decoration-amber decoration-2 underline-offset-4 transition-colors hover:bg-mint">
                          <IconSend className="h-3.5 w-3.5" /> {s.contact}
                        </a>
                      ) : (
                        <span className="flex items-center gap-1.5 px-1"><IconSend className="h-3.5 w-3.5" /> {s.contact}</span>
                      )}
                    </div>
                  )}
                  {s.note && <p className="mt-2 text-[11px] font-medium italic leading-relaxed text-muted">«{s.note}»</p>}

                  <div className="mt-auto flex items-center gap-1.5 pt-4">
                    {s.active && (
                      <button className="btn btn-pine btn-sm flex-1" onClick={() => onPay(s.id)}>
                        <IconPlus className="h-3.5 w-3.5" /> {status === "partial" ? "Доплата" : "Оплатить"}
                      </button>
                    )}
                    <button className="icon-btn" title="Редактировать" onClick={() => setModal({ mode: "edit", student: s })}>
                      <IconPencil className="h-4 w-4" />
                    </button>
                    <button
                      className="icon-btn"
                      title={s.active ? "В архив" : "Вернуть из архива"}
                      onClick={() => {
                        updateStudent(s.id, { active: !s.active });
                        notify(s.active ? `${s.name} — в архиве` : `${s.name} снова в строю`, "ok");
                      }}
                    >
                      <IconRefresh className="h-4 w-4" />
                    </button>
                    <button
                      className="icon-btn hover:!bg-coralsoft hover:!text-coraldeep"
                      title="Удалить"
                      onClick={() => {
                        if (window.confirm(`Удалить ученика «${s.name}» и все его платежи?`)) {
                          removeStudent(s.id);
                          notify(`Ученик «${s.name}» удалён`, "warn");
                        }
                      }}
                    >
                      <IconTrash className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      )}

      {rows.length > 0 && (
        <p className="mt-4 text-center text-xs font-medium text-muted">
          {rows.length} {plural(rows.length, "карточка", "карточки", "карточек")} · тарифы и цены — как на juliaenglish.ru
        </p>
      )}

      {modal && (
        <StudentModal
          initial={modal.mode === "edit" ? modal.student : undefined}
          onClose={() => setModal(null)}
          onSave={(data) => {
            if (modal.mode === "edit") {
              crm.updateStudent(modal.student.id, data);
              notify(`Карточка «${data.name}» обновлена`);
            } else {
              crm.addStudent(data);
              notify(`Ученик «${data.name}» добавлен — следим за оплатой`);
            }
            setModal(null);
          }}
        />
      )}
    </div>
  );
}

/* ── модалка ученика ── */
function StudentModal({
  initial, onClose, onSave,
}: {
  initial?: Student;
  onClose: () => void;
  onSave: (data: Omit<Student, "id" | "createdAt">) => void;
}) {
  const [f, setF] = useState({
    name: initial?.name ?? "",
    courseId: (initial?.courseId ?? "pack4") as CourseId,
    fee: String(initial?.fee ?? COURSES.pack4.price),
    audience: (initial?.audience ?? "adult") as Audience,
    contact: initial?.contact ?? "",
    note: initial?.note ?? "",
    active: initial?.active ?? true,
  });
  const [err, setErr] = useState("");

  const setCourse = (id: CourseId) =>
    setF((p) => ({ ...p, courseId: id, fee: id === "custom" ? p.fee : String(COURSES[id].price) }));

  const submit = () => {
    const fee = Number(f.fee);
    if (!f.name.trim()) return setErr("Укажите имя ученика");
    if (!Number.isFinite(fee) || fee <= 0) return setErr("Сумма за месяц должна быть больше нуля");
    onSave({
      name: f.name.trim(),
      courseId: f.courseId,
      fee,
      audience: f.audience,
      contact: f.contact.trim(),
      note: f.note.trim(),
      active: f.active,
    });
  };

  const label = "mb-1 block text-[11px] font-bold uppercase tracking-[0.1em] text-muted";

  return (
    <Modal open onClose={onClose} title={initial ? "Редактировать ученика" : "Новый ученик"}>
      <div className="flex flex-col gap-4">
        <div>
          <label className={label}>Имя и фамилия *</label>
          <input className="inp" autoFocus value={f.name} placeholder="Например: Анна Смирнова"
            onChange={(e) => setF((p) => ({ ...p, name: e.target.value }))} />
        </div>

        <div>
          <label className={label}>Тариф (цены с сайта)</label>
          <div className="grid grid-cols-2 gap-1.5">
            {COURSE_IDS.map((id) => (
              <button key={id} type="button" onClick={() => setCourse(id)}
                className={`rounded-lg border-[1.5px] px-2.5 py-2 text-left text-xs font-bold transition-all ${
                  f.courseId === id
                    ? "border-ink bg-pine text-[#f2f5ec] shadow-[2px_2px_0_#1B2A23]"
                    : "border-ink/25 bg-white text-muted hover:border-ink hover:text-ink"
                }`}>
                {COURSES[id].label}
                {COURSES[id].price > 0 && (
                  <span className={`block text-[11px] font-semibold ${f.courseId === id ? "text-amber" : "text-muted"}`}>
                    {fmt(COURSES[id].price)}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label}>Сумма в месяц, ₽ *</label>
            <input className="inp" type="number" min={1} value={f.fee}
              onChange={(e) => setF((p) => ({ ...p, fee: e.target.value }))} />
          </div>
          <div>
            <label className={label}>Кто занимается</label>
            <select className="inp" value={f.audience}
              onChange={(e) => setF((p) => ({ ...p, audience: e.target.value as Audience }))}>
              {(Object.keys(AUDIENCES) as Audience[]).map((a) => (
                <option key={a} value={a}>{AUDIENCES[a]}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={label}>Контакт (Telegram или телефон)</label>
          <input className="inp" value={f.contact} placeholder="@nickname или +7 …"
            onChange={(e) => setF((p) => ({ ...p, contact: e.target.value }))} />
        </div>

        <div>
          <label className={label}>Заметка</label>
          <textarea className="inp min-h-[64px] resize-y" value={f.note} placeholder="Цель, уровень, особенности…"
            onChange={(e) => setF((p) => ({ ...p, note: e.target.value }))} />
        </div>

        <label className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold">
          <input type="checkbox" className="h-4 w-4 accent-[#1E4D3B]" checked={f.active}
            onChange={(e) => setF((p) => ({ ...p, active: e.target.checked }))} />
          Активный ученик (учитывается в итогах)
        </label>

        {err && <p className="rounded-lg border-[1.5px] border-coral/60 bg-coralsoft px-3 py-2 text-xs font-bold text-coraldeep">{err}</p>}

        <div className="flex gap-2 pt-1">
          <button className="btn btn-ghost flex-1" onClick={onClose}>Отмена</button>
          <button className="btn btn-pine flex-1" onClick={submit}>
            {initial ? "Сохранить" : "Добавить"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export const monthKeyNow = () => monthKey(new Date());
