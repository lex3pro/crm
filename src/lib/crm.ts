/* ── Доменная модель CRM Julia English ─────────────────────────── */

export type CourseId = "single" | "pack4" | "pack8" | "custom";
export type Audience = "adult" | "teen" | "kid";
export type Method = "sbp" | "card" | "cash";
export type PayStatus = "paid" | "partial" | "unpaid";

export interface Student {
  id: string;
  name: string;
  courseId: CourseId;
  fee: number; // ожидаемая сумма за месяц
  audience: Audience;
  contact: string; // @telegram или телефон
  note: string;
  active: boolean;
  createdAt: string;
}

export interface Payment {
  id: string;
  studentId: string;
  amount: number;
  date: string; // ISO
  monthKey: string; // YYYY-MM, к какому учебному месяцу относится
  method: Method;
  note?: string;
}

export interface CrmEvent {
  id: string;
  kind: "pay" | "user" | "info";
  text: string;
  at: string; // ISO
  read: boolean;
}

export interface Db {
  students: Student[];
  payments: Payment[];
  events: CrmEvent[];
}

/* ── Справочники (цены — с juliaenglish.ru) ─────────────────────── */

export const COURSES: Record<CourseId, { label: string; price: number }> = {
  single: { label: "Разовое занятие", price: 1500 },
  pack4: { label: "Пакет 4 занятия", price: 5600 },
  pack8: { label: "Пакет 8 занятий", price: 10400 },
  custom: { label: "Свой тариф", price: 0 },
};
export const COURSE_IDS = Object.keys(COURSES) as CourseId[];

export const AUDIENCES: Record<Audience, string> = {
  adult: "Взрослый",
  teen: "Подросток",
  kid: "Ребёнок",
};

export const METHODS: Record<Method, string> = {
  sbp: "СБП · QR",
  card: "Карта",
  cash: "Наличные",
};
export const METHOD_IDS = Object.keys(METHODS) as Method[];

export const STATUS_META: Record<PayStatus, { label: string; pill: string; dot: string }> = {
  paid: { label: "Оплачено", pill: "bg-mint text-pine border-pine/40", dot: "bg-moss" },
  partial: { label: "Частично", pill: "bg-ambersoft text-amberdeep border-amber/60", dot: "bg-amber" },
  unpaid: { label: "Нет оплаты", pill: "bg-coralsoft text-coraldeep border-coral/50", dot: "bg-coral" },
};

/* ── Даты и форматирование ──────────────────────────────────────── */

export const MONTHS = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];

export const monthKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

export const shiftMonth = (d: Date, n: number) =>
  new Date(d.getFullYear(), d.getMonth() + n, 1);

export const monthLabel = (key: string) => {
  const [y, m] = key.split("-").map(Number);
  return `${MONTHS[m - 1]} ${y}`;
};

export const dateInput = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const monthKeyOfInput = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return monthKey(new Date(y, m - 1, d));
};

export const fmt = (n: number) =>
  `${new Intl.NumberFormat("ru-RU").format(Math.round(n))} ₽`;

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });

export const fmtDateFull = (iso: string) =>
  new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "long" });

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "только что";
  if (min < 60) return `${min} мин назад`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} ч назад`;
  const d = Math.floor(h / 24);
  if (d === 1) return "вчера";
  if (d < 7) return `${d} дн назад`;
  return fmtDate(iso);
}

export function plural(n: number, one: string, few: string, many: string): string {
  const abs = Math.abs(n) % 100;
  const d = abs % 10;
  if (abs > 10 && abs < 20) return many;
  if (d > 1 && d < 5) return few;
  if (d === 1) return one;
  return many;
}

/* ── Статусы оплат ──────────────────────────────────────────────── */

export const statusOf = (paid: number, fee: number): PayStatus =>
  fee > 0 && paid >= fee ? "paid" : paid > 0 ? "partial" : "unpaid";

export function paidByStudent(payments: Payment[], key: string): Map<string, number> {
  const map = new Map<string, number>();
  for (const p of payments) {
    if (p.monthKey !== key) continue;
    map.set(p.studentId, (map.get(p.studentId) ?? 0) + p.amount);
  }
  return map;
}

/* ── Текст напоминания ученику ──────────────────────────────────── */

export function reminderText(name: string, fee: number, paid: number, month: string): string {
  const first = name.split(" ")[0];
  const rest = Math.max(0, fee - paid);
  if (paid > 0 && rest > 0) {
    return (
      `Здравствуйте, ${first}! 👋 Вижу вашу оплату ${fmt(paid)} — спасибо! ` +
      `Осталось доплатить ${fmt(rest)} за ${month.toLowerCase()} за занятия английским. ` +
      `Оплатить можно по СБП — пришлю QR-код. Если уже перевели — не обращайте внимания 🙌\n` +
      `Юля · Julia English`
    );
  }
  return (
    `Здравствуйте, ${first}! 👋 Напоминаю про оплату занятий английским за ${month.toLowerCase()} — ` +
    `${fmt(rest)}. Удобнее всего по СБП: пришлю QR-код, оплата за минуту. ` +
    `Если уже оплатили — просто не обращайте внимания 🙌\n` +
    `Юля · Julia English`
  );
}

export function tgLink(contact: string): string | null {
  const m = contact.trim().match(/^@?([a-zA-Z0-9_]{4,})$/);
  return m ? `https://t.me/${m[1]}` : null;
}

/* ── Слово дня для флэш-карточки ───────────────────────────────── */

export const WORDS: Array<[string, string, string]> = [
  ["invoice", "счёт на оплату", "ˈɪnvɔɪs"],
  ["tuition", "плата за обучение", "tjuˈɪʃn"],
  ["receipt", "чек, квитанция", "rɪˈsiːt"],
  ["deadline", "крайний срок", "ˈdedlaɪn"],
  ["overdue", "просроченный", "ˌəʊvəˈdjuː"],
  ["refund", "возврат денег", "ˈriːfʌnd"],
  ["fee", "взнос, плата", "fiː"],
  ["due date", "срок оплаты", "djuː deɪt"],
  ["balance", "остаток, баланс", "ˈbæləns"],
  ["reminder", "напоминание", "rɪˈmaɪndə"],
];

export const wordOfDay = () => {
  const start = new Date(new Date().getFullYear(), 0, 0);
  const day = Math.floor((Date.now() - start.getTime()) / 86400000);
  return WORDS[day % WORDS.length];
};

/* ── Идентификаторы и файлы ─────────────────────────────────────── */

export const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;

export function downloadFile(name: string, content: string, mime = "application/json") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ── Демо-данные (первый запуск) ───────────────────────────────── */

export function seedDb(): Db {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const today = now.getDate();
  const keyAt = (offset: number) => monthKey(new Date(y, m - offset, 1));
  const dayClamp = (offset: number, day: number) => {
    const maxDay = offset === 0 ? Math.max(1, today) : 28;
    return Math.min(day, maxDay);
  };
  const iso = (offset: number, day: number, h = 12) =>
    new Date(y, m - offset, dayClamp(offset, day), h, 15).toISOString();

  const students: Student[] = [
    { id: "s1", name: "Анна Смирнова", courseId: "pack8", fee: 10400, audience: "adult", contact: "@anna_smrn", note: "Готовится к собеседованию в IT-компанию", active: true, createdAt: iso(6, 10) },
    { id: "s2", name: "Дмитрий Козлов", courseId: "pack8", fee: 10400, audience: "teen", contact: "+7 912 480-55-12", note: "ЕГЭ, цель — 90+ баллов", active: true, createdAt: iso(5, 4) },
    { id: "s3", name: "Мария Иванова", courseId: "pack4", fee: 5600, audience: "adult", contact: "@marie_iv", note: "Разговорный, B1 → B2", active: true, createdAt: iso(5, 18) },
    { id: "s4", name: "Егор Волков", courseId: "pack8", fee: 10400, audience: "teen", contact: "+7 903 217-84-30", note: "ОГЭ, мама на связи", active: true, createdAt: iso(4, 7) },
    { id: "s5", name: "Софья Орлова", courseId: "pack4", fee: 5600, audience: "kid", contact: "@orlova_mama", note: "7 лет, пишет мама", active: true, createdAt: iso(4, 21) },
    { id: "s6", name: "Полина Морозова", courseId: "custom", fee: 8000, audience: "adult", contact: "@polly_mrn", note: "2 раза в неделю по 60 минут", active: true, createdAt: iso(3, 12) },
    { id: "s7", name: "Тимофей Лебедев", courseId: "pack4", fee: 5600, audience: "kid", contact: "+7 926 554-10-07", note: "9 лет, любит игры и мультики", active: true, createdAt: iso(2, 9) },
    { id: "s8", name: "Вера Николаева", courseId: "pack8", fee: 10400, audience: "adult", contact: "@vera_nik", note: "Переезд в Канаду осенью", active: true, createdAt: iso(2, 25) },
  ];

  const methods: Method[] = ["sbp", "card", "sbp", "cash", "sbp", "card", "sbp", "sbp"];
  const payments: Payment[] = [];

  // прошлые 5 месяцев — все оплатили
  for (let off = 5; off >= 1; off--) {
    students.forEach((s, i) => {
      payments.push({
        id: `seed-p-${off}-${s.id}`,
        studentId: s.id,
        amount: s.fee,
        date: iso(off, 2 + ((i * 2 + off) % 7)),
        monthKey: keyAt(off),
        method: methods[i % methods.length],
      });
    });
  }

  // текущий месяц: живая смесь статусов
  const cur: Array<[string, number | null, number, Method]> = [
    ["s1", 10400, 3, "sbp"],
    ["s2", null, 0, "sbp"], // не оплатил
    ["s3", 5600, 5, "card"],
    ["s4", 5000, 4, "sbp"], // частично
    ["s5", 5600, 2, "sbp"],
    ["s6", null, 0, "sbp"], // не оплатила
    ["s7", 5600, 4, "cash"],
    ["s8", 10400, 6, "sbp"],
  ];
  cur.forEach(([sid, amount, day, method], i) => {
    if (amount === null) return;
    payments.push({
      id: `seed-c-${i}`,
      studentId: sid as string,
      amount: amount as number,
      date: iso(0, day),
      monthKey: keyAt(0),
      method: method as Method,
    });
  });

  const h = 3600000;
  const events: CrmEvent[] = [
    { id: uid(), kind: "info", text: "CRM подключена. Данные хранятся локально в вашем браузере — для переноса на другой компьютер используйте «Скачать копию» в меню слева.", at: new Date(Date.now() - 26 * h).toISOString(), read: true },
    { id: uid(), kind: "pay", text: "Вера Николаева оплатила «Пакет 8 занятий» — 10 400 ₽ (СБП · QR)", at: new Date(Date.now() - 20 * h).toISOString(), read: true },
    { id: uid(), kind: "info", text: "До конца месяца не оплатили: Дмитрий Козлов, Полина Морозова. Загляните в «Уведомления» — там готовые тексты напоминаний.", at: new Date(Date.now() - 3 * h).toISOString(), read: false },
  ];

  return { students, payments, events };
}
