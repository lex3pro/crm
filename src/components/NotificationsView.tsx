import { useMemo } from "react";
import type { CrmEvent } from "../lib/crm";
import {
  fmt, monthKey, monthLabel, paidByStudent, plural, reminderText,
  statusOf, tgLink, timeAgo,
} from "../lib/crm";
import type { Crm } from "../lib/store";
import { IconBanknote, IconBell, IconCheck, IconPlus, IconSend, IconSpark, IconUsers } from "./icons";
import { Avatar, CopyBtn, Reveal, StatusPill } from "./ui";

const EVENT_ICON = {
  pay: IconBanknote,
  user: IconUsers,
  info: IconSpark,
} as const;

export function NotificationsView({
  crm, onPay, notify,
}: {
  crm: Crm;
  onPay: (studentId: string) => void;
  notify: (text: string, tone?: "ok" | "warn" | "pay") => void;
}) {
  const { db, markAllEventsRead } = crm;
  const now = new Date();
  const curKey = monthKey(now);
  const curName = monthLabel(curKey);
  const paidMap = paidByStudent(db.payments, curKey);

  const debtors = useMemo(
    () =>
      db.students
        .filter((s) => s.active)
        .map((s) => ({ s, paid: paidMap.get(s.id) ?? 0 }))
        .filter((x) => statusOf(x.paid, x.s.fee) !== "paid")
        .sort((a, b) => (b.s.fee - b.paid) - (a.s.fee - a.paid)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [db.students, db.payments],
  );

  const totalDebt = debtors.reduce((sum, x) => sum + Math.max(0, x.s.fee - x.paid), 0);
  const unread = db.events.filter((e) => !e.read).length;

  const allMessages = debtors
    .map(({ s, paid }) => reminderText(s.name, s.fee, paid, curName))
    .join("\n\n———\n\n");

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      {/* ── напоминания об оплате ── */}
      <Reveal>
        <div className="fcard h-full p-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className={`flex h-11 w-11 items-center justify-center rounded-xl border-[1.5px] border-ink ${debtors.length ? "bg-coralsoft text-coraldeep" : "bg-mint text-pine"}`}>
              <IconBell className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <h2 className="font-display text-[15px] font-bold">
                Напоминания за <span className="hl">{curName.toLowerCase()}</span>
              </h2>
              <p className="text-xs font-medium text-muted">
                {debtors.length
                  ? `${debtors.length} ${plural(debtors.length, "ученик", "ученика", "учеников")} ещё не оплатили · ${fmt(totalDebt)}`
                  : "все активные ученики оплатили"}
              </p>
            </div>
            {debtors.length > 0 && <CopyBtn label="Все тексты" text={allMessages} />}
          </div>

          {debtors.length === 0 ? (
            <div className="mt-5 flex flex-col items-center rounded-lg border-[1.5px] border-moss/50 bg-mint px-5 py-8 text-center">
              <span className="flex h-12 w-12 -rotate-3 items-center justify-center rounded-xl border-[1.5px] border-ink bg-card text-pine shadow-[3px_3px_0_#1B2A23]">
                <IconCheck className="h-6 w-6" />
              </span>
              <p className="mt-3 font-display text-sm font-bold text-pine">Всё собрано!</p>
              <p className="mt-1 max-w-[260px] text-xs font-medium leading-relaxed text-pine/80">
                По {curName.toLowerCase()} долгов нет. Загляните в начале следующего месяца.
              </p>
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-line">
              {debtors.map(({ s, paid }, i) => {
                const owed = s.fee - paid;
                const link = tgLink(s.contact);
                const text = reminderText(s.name, s.fee, paid, curName);
                return (
                  <li key={s.id} className="py-3.5">
                    <Reveal delay={i * 50}>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                        <Avatar name={s.name} i={s.name.length + 1} />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-bold">{s.name}</p>
                            <StatusPill status={statusOf(paid, s.fee)} small />
                          </div>
                          <p className="text-xs font-medium text-coraldeep">
                            {paid > 0 ? `получено ${fmt(paid)}, осталось ${fmt(owed)}` : `к оплате ${fmt(owed)}`}
                            {s.contact && <span className="text-muted"> · {s.contact}</span>}
                          </p>
                        </div>
                        <button className="btn btn-pine btn-sm" onClick={() => onPay(s.id)}>
                          <IconPlus className="h-3.5 w-3.5" /> оплата
                        </button>
                      </div>
                      <div className="mt-2.5 flex flex-wrap items-center gap-2 rounded-lg border-[1.5px] border-dashed border-line bg-white/70 px-3 py-2.5">
                        <p className="min-w-0 flex-1 truncate text-xs italic text-muted" title={text}>
                          «{text.split("\n")[0]}»
                        </p>
                        <CopyBtn small label="Текст" text={text} />
                        {link && (
                          <a className="btn btn-ghost btn-sm" href={link} target="_blank" rel="noreferrer">
                            <IconSend className="h-3.5 w-3.5" /> в Telegram
                          </a>
                        )}
                      </div>
                    </Reveal>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </Reveal>

      {/* ── история событий ── */}
      <Reveal delay={90}>
        <div className="fcard h-full p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-[15px] font-bold">
                История <span className="hl">событий</span>
              </h2>
              <p className="text-xs font-medium text-muted">
                {db.events.length} {plural(db.events.length, "событие", "события", "событий")}
                {unread > 0 && <span className="text-amberdeep"> · непрочитанных: {unread}</span>}
              </p>
            </div>
            {unread > 0 && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  markAllEventsRead();
                  notify("Все события отмечены прочитанными");
                }}
              >
                <IconCheck className="h-3.5 w-3.5" /> Прочитать всё
              </button>
            )}
          </div>

          {db.events.length === 0 ? (
            <p className="mt-4 rounded-lg border-[1.5px] border-dashed border-line bg-white/60 px-4 py-6 text-center text-sm font-medium text-muted">
              Событий пока нет — они появляются при оплатах и изменениях.
            </p>
          ) : (
            <ul className="mt-4 max-h-[520px] divide-y divide-line overflow-y-auto pr-1">
              {db.events.map((e: CrmEvent) => {
                const Ic = EVENT_ICON[e.kind];
                return (
                  <li key={e.id} className={`flex items-start gap-3 py-3 ${e.read ? "opacity-75" : ""}`}>
                    <span
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-[1.5px] border-ink ${
                        e.kind === "pay" ? "bg-mint text-pine" : e.kind === "user" ? "bg-ambersoft text-amberdeep" : "bg-white text-muted"
                      }`}
                    >
                      <Ic className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold leading-snug">{e.text}</p>
                      <p className="mt-0.5 text-[11px] font-medium text-muted">{timeAgo(e.at)}</p>
                    </div>
                    {!e.read && <span className="anim-pulse mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full border border-ink bg-amber" />}
                  </li>
                );
              })}
            </ul>
          )}

          <div className="mt-4 rounded-lg border-[1.5px] border-ink bg-ambersoft px-4 py-3">
            <p className="text-xs font-semibold leading-relaxed text-amberdeep">
              Совет: тексты напоминаний уже написаны за вас — скопируйте и отправьте в Telegram. Счётчик должников
              погаснет, как только вы запишете их оплату.
            </p>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
