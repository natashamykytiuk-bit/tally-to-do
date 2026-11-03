import { prettyDate } from './dates';
import type { DateStr, Item } from './types';

/** A task's work days, sorted. Reads the older single `plan` field too. */
export function plansOf(item: Item): DateStr[] {
  const days = item.plans ?? (item.plan ? [item.plan] : []);
  return [...new Set(days)].sort();
}

/** Patch that saves `days` as the task's work days (and retires the old single-day field). */
export const plansPatch = (days: DateStr[]): Partial<Item> => {
  const sorted = [...new Set(days)].sort();
  return { plans: sorted.length ? sorted : undefined, plan: undefined };
};

/** Adds the day if missing, removes it if present. */
export const togglePlanDay = (days: DateStr[], day: DateStr): DateStr[] =>
  days.includes(day) ? days.filter((d) => d !== day) : [...days, day].sort();

/** Moves one work day to another (or just removes it when `to` is undefined). */
export function movePlanDay(days: DateStr[], from: DateStr | undefined, to: DateStr | undefined): DateStr[] {
  const rest = from ? days.filter((d) => d !== from) : days;
  return to ? [...new Set([...rest, to])].sort() : rest;
}

/** The last work day is behind us and the task still isn't done. */
export const planOverdue = (item: Item, today: DateStr): boolean => {
  const days = plansOf(item);
  return !item.done && days.length > 0 && days[days.length - 1] < today;
};

/** Should it be in My Day today: planned for today, or all its work days have passed unfinished. */
export const plannedToday = (item: Item, today: DateStr): boolean =>
  !item.done && (plansOf(item).includes(today) || planOverdue(item, today));

/** Marked for today, either with the sun button or as a work day. */
export const markedToday = (item: Item, today: DateStr): boolean =>
  item.myDay === today || plansOf(item).includes(today);

/** Patch that marks the task for today, or clears both ways of marking it. */
export const markTodayPatch = (item: Item, today: DateStr, on: boolean): Partial<Item> => {
  if (on) return { myDay: today };
  const days = plansOf(item);
  return { myDay: undefined, ...(days.includes(today) && plansPatch(days.filter((d) => d !== today))) };
};

/** Row text, e.g. "Work on today", "Work on Wed, Sep 23 + 2 more", or "Planned Mon, Sep 21" when overdue. */
export function planLabel(item: Item, today: DateStr): { text: string; warn: boolean } | null {
  const days = plansOf(item);
  if (!days.length || item.done) return null;
  if (planOverdue(item, today)) return { text: `Planned ${prettyDate(days[days.length - 1])}`, warn: true };
  const upcoming = days.filter((d) => d >= today);
  const first = upcoming[0] === today ? 'today' : prettyDate(upcoming[0]);
  return { text: `Work on ${first}${upcoming.length > 1 ? ` + ${upcoming.length - 1} more` : ''}`, warn: false };
}
