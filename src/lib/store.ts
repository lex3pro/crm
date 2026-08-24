import { useEffect, useState } from "react";
import type { CrmEvent, Db, Method, Payment, Student } from "./crm";
import { COURSES, METHODS, fmt, monthLabel, seedDb, uid } from "./crm";

const KEY = "julia-english-crm-v1";

function load(): Db {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Db;
      if (
        parsed &&
        Array.isArray(parsed.students) &&
        Array.isArray(parsed.payments) &&
        Array.isArray(parsed.events)
      ) {
        return parsed;
      }
    }
  } catch {
    /* повреждённые данные — начнём с демо */
  }
  return seedDb();
}

function persist(db: Db) {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    /* квота — молча */
  }
}

const withEvent = (d: Db, kind: CrmEvent["kind"], text: string): Db => ({
  students: d.students,
  payments: d.payments,
  events: [
    { id: uid(), kind, text, at: new Date().toISOString(), read: false },
    ...d.events,
  ],
});

export interface PaymentInput {
  studentId: string;
  amount: number;
  date: string; // ISO
  monthKey: string;
  method: Method;
  note?: string;
}

export function useCrm() {
  const [db, setDb] = useState<Db>(load);

  useEffect(() => {
    persist(db);
  }, [db]);

  const addStudent = (s: Omit<Student, "id" | "createdAt">) => {
    const st: Student = { ...s, id: uid(), createdAt: new Date().toISOString() };
    setDb((d) =>
      withEvent(
        { ...d, students: [...d.students, st] },
        "user",
        `Новый ученик: ${st.name} — ${COURSES[st.courseId].label}, ${fmt(st.fee)} в месяц`,
      ),
    );
  };

  const updateStudent = (id: string, patch: Partial<Student>) => {
    setDb((d) => {
      const next = d.students.map((s) => (s.id === id ? { ...s, ...patch } : s));
      const st = next.find((s) => s.id === id);
      let out: Db = { ...d, students: next };
      if (st && patch.active !== undefined) {
        out = withEvent(out, "user", `${st.name} ${patch.active ? "вернулся к занятиям" : "переведён в архив"}`);
      }
      return out;
    });
  };

  const removeStudent = (id: string) => {
    setDb((d) => {
      const st = d.students.find((s) => s.id === id);
      const next: Db = {
        ...d,
        students: d.students.filter((s) => s.id !== id),
        payments: d.payments.filter((p) => p.studentId !== id),
      };
      return st ? withEvent(next, "user", `Ученик удалён: ${st.name}`) : next;
    });
  };

  const addPayment = (p: PaymentInput) => {
    setDb((d) => {
      const st = d.students.find((s) => s.id === p.studentId);
      const pay: Payment = { id: uid(), ...p };
      const next: Db = { ...d, payments: [...d.payments, pay] };
      return withEvent(
        next,
        "pay",
        `${st?.name ?? "Ученик"} — ${fmt(p.amount)} за ${monthLabel(p.monthKey).toLowerCase()} (${METHODS[p.method]})`,
      );
    });
  };

  const addEvent = (kind: CrmEvent["kind"], text: string) => {
    setDb((d) => withEvent(d, kind, text));
  };

  const markAllEventsRead = () => {
    setDb((d) => ({ ...d, events: d.events.map((e) => ({ ...e, read: true })) }));
  };

  /* ── резервные копии ── */

  const exportJson = () =>
    JSON.stringify(
      { app: "julia-english-crm", version: 1, exportedAt: new Date().toISOString(), ...db },
      null,
      2,
    );

  const importJson = (raw: string): boolean => {
    try {
      const parsed = JSON.parse(raw) as Partial<Db>;
      if (!parsed || !Array.isArray(parsed.students) || !Array.isArray(parsed.payments)) return false;
      setDb({
        students: parsed.students,
        payments: parsed.payments,
        events: Array.isArray(parsed.events) ? parsed.events : [],
      });
      return true;
    } catch {
      return false;
    }
  };

  const resetDemo = () => {
    setDb(
      withEvent(
        seedDb(),
        "info",
        "База сброшена к демонстрационным данным.",
      ),
    );
  };

  const clearAll = () => {
    setDb({
      students: [],
      payments: [],
      events: [
        {
          id: uid(),
          kind: "info",
          text: "База очищена. Добавьте первого ученика, чтобы начать учёт оплат.",
          at: new Date().toISOString(),
          read: false,
        },
      ],
    });
  };

  return {
    db,
    addStudent,
    updateStudent,
    removeStudent,
    addPayment,
    addEvent,
    markAllEventsRead,
    exportJson,
    importJson,
    resetDemo,
    clearAll,
  };
}

export type Crm = ReturnType<typeof useCrm>;
