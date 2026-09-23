import { addDaysStr, weekStart } from './dates';
import { planOverdue, plannedToday, plansOf } from './plan';
import { isDoneForToday } from './progress';
import { occursOn, pendingMissed } from './recurrence';
import type { CompletionMap, DateStr, Item } from './types';

export type SmartView = 'myday' | 'plan' | 'planned' | 'habits' | 'nolist';
/** A smart view or a list id. */
export type ViewId = SmartView | string;

export const SMART_VIEWS: { id: SmartView; icon: string; name: string }[] = [
  { id: 'myday', icon: '☀', name: 'My Day' },
  { id: 'plan', icon: '✎', name: 'Plan' },
  { id: 'planned', icon: '▦', name: 'Scheduled' },
  { id: 'nolist', icon: '☰', name: 'Tasks' },
  { id: 'habits', icon: '↻', name: 'Habits' },
];

/** The "Tasks" view: everything that isn't in one of the user's lists. */
export const NO_LIST = 'nolist';

export const isSmartView = (v: ViewId): v is SmartView => SMART_VIEWS.some((s) => s.id === v);

/**
 * One row on screen. For recurring items `date` is the occurrence it checks off
 * (null = not scheduled today, checkbox disabled).
 */
export type Row = { item: Item; date: DateStr | null; late: boolean };

export type AllCompletions = Record<string, CompletionMap>;

const compsOf = (all: AllCompletions, id: string): CompletionMap => all[id] ?? {};

export function isRowDone(row: Row, all: AllCompletions): boolean {
  if (!row.item.rule) return !!row.item.done;
  return row.date ? !!compsOf(all, row.item.id)[row.date] : false;
}

/** Carried-over miss (if any) plus today's occurrence (if scheduled). */
function recurringRows(item: Item, today: DateStr, all: AllCompletions): Row[] {
  const rows: Row[] = [];
  const missed = pendingMissed(item, today, compsOf(all, item.id));
  if (missed) rows.push({ item, date: missed, late: true });
  if (occursOn(item, today)) rows.push({ item, date: today, late: false });
  return rows;
}

/** A single always-visible row for a recurring item (Habits and list views). */
function habitRow(item: Item, today: DateStr, all: AllCompletions): Row[] {
  const missed = pendingMissed(item, today, compsOf(all, item.id));
  if (occursOn(item, today)) return [...(missed ? [{ item, date: missed, late: true }] : []), { item, date: today, late: false }];
  return [{ item, date: missed, late: !!missed }];
}

export function rowsFor(view: ViewId, items: Item[], today: DateStr, all: AllCompletions): Row[] {
  const rows: Row[] = [];
  for (const item of items) {
    const one = (): Row => ({ item, date: null, late: false });
    if (view === 'myday') {
      if (item.rule) rows.push(...recurringRows(item, today, all));
      else if (item.myDay === today || (item.due && item.due <= today && !item.done) || plannedToday(item, today)) rows.push(one());
      else if (item.done && plansOf(item).includes(today)) rows.push(one());
      else if (item.done && item.due === today) rows.push(one());
    } else if (view === 'planned') {
      if (!item.rule && item.due) rows.push(one());
    } else if (view === 'habits') {
      if (item.rule) rows.push(...habitRow(item, today, all));
    } else if (view === NO_LIST) {
      if (!item.listId) item.rule ? rows.push(...habitRow(item, today, all)) : rows.push(one());
    } else if (item.listId === view) {
      item.rule ? rows.push(...habitRow(item, today, all)) : rows.push(one());
    }
  }
  // Missed first, then by due date, undated last.
  return rows.sort((a, b) => Number(b.late) - Number(a.late) || (a.item.due ?? '9').localeCompare(b.item.due ?? '9'));
}

export const openCount = (view: ViewId, items: Item[], today: DateStr, all: AllCompletions) =>
  rowsFor(view, items, today, all).filter(
    (r) => !isRowDone(r, all) && !isDoneForToday(r.item, today) && !(r.item.rule && !r.date),
  ).length;

/** Scheduled view groups, in display order. Weeks run Sunday to Saturday. */
export const PLANNED_GROUPS = ['Overdue', 'Today', 'Tomorrow', 'Later this week', 'Next week', 'Later'] as const;
export type PlannedGroup = (typeof PLANNED_GROUPS)[number];

export function plannedGroup(due: DateStr, today: DateStr): PlannedGroup {
  if (due < today) return 'Overdue';
  if (due === today) return 'Today';
  if (due === addDaysStr(today, 1)) return 'Tomorrow';
  const nextSunday = addDaysStr(weekStart(today), 7);
  if (due < nextSunday) return 'Later this week';
  if (due < addDaysStr(nextSunday, 7)) return 'Next week';
  return 'Later';
}

/**
 * Fields a new item gets when added from a view. Only a list view puts it in a list; everywhere else it has none.
 * `repeat` makes it a daily habit wherever it's added.
 */
export function newItemDefaults(view: ViewId, today: DateStr, repeat = view === 'habits'): Partial<Item> {
  const base: Partial<Item> = isSmartView(view) ? {} : { listId: view };
  if (repeat) return { ...base, rule: { type: 'daily' }, startDate: today, missed: 'skip' };
  if (view === 'myday') base.myDay = today;
  if (view === 'plan') base.plans = [today];
  if (view === 'planned') base.due = today;
  return base;
}

/** Days shown in the Plan view: today and the next 6, plus any later day with planned work. */
export function planDays(items: Item[], today: DateStr, span = 7): { date: DateStr; items: Item[] }[] {
  const open = items.filter((i) => !i.rule && !i.done && plansOf(i).length);
  const dates = new Set(Array.from({ length: span }, (_, k) => addDaysStr(today, k)));
  for (const i of open) for (const d of plansOf(i)) if (d > today) dates.add(d);
  return [...dates].sort().map((date) => ({
    date,
    // A task shows under each of its work days; once all of them have passed unfinished, it rolls into today.
    items: open.filter((i) => plansOf(i).includes(date) || (date === today && planOverdue(i, today))),
  }));
}

/** Open one-off tasks due within `days` (or overdue) that have no work day planned yet, soonest first. */
export function unplannedSoon(items: Item[], today: DateStr, days = 14): Item[] {
  const limit = addDaysStr(today, days);
  return items
    .filter((i) => !i.rule && !i.done && !plansOf(i).length && i.due && i.due <= limit)
    .sort((a, b) => a.due!.localeCompare(b.due!));
}

/**
 * The Plan view's week: seven days from `weekStart` (a Sunday), each with the open tasks planned for it.
 * In the current week, work left over from earlier days rolls into today.
 */
export function planWeek(items: Item[], today: DateStr, weekStart: DateStr): { date: DateStr; items: Item[] }[] {
  const open = items.filter((i) => !i.rule && !i.done && plansOf(i).length);
  return Array.from({ length: 7 }, (_, k) => {
    const date = addDaysStr(weekStart, k);
    return { date, items: open.filter((i) => plansOf(i).includes(date) || (date === today && planOverdue(i, today))) };
  });
}
