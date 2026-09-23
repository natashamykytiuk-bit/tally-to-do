import { addDaysStr } from './dates';
import { occursOn, pendingMissed } from './recurrence';
import type { CompletionMap, DateStr, Item } from './types';

export type SmartView = 'myday' | 'planned' | 'habits';
/** A smart view or a list id. */
export type ViewId = SmartView | string;

export const SMART_VIEWS: { id: SmartView; icon: string; name: string }[] = [
  { id: 'myday', icon: '☀', name: 'My Day' },
  { id: 'planned', icon: '▦', name: 'Planned' },
  { id: 'habits', icon: '↻', name: 'Habits' },
];

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
      else if (item.myDay === today || (item.due && item.due <= today && !item.done)) rows.push(one());
      else if (item.done && item.due === today) rows.push(one());
    } else if (view === 'planned') {
      if (!item.rule && item.due) rows.push(one());
    } else if (view === 'habits') {
      if (item.rule) rows.push(...habitRow(item, today, all));
    } else if (item.listId === view) {
      item.rule ? rows.push(...habitRow(item, today, all)) : rows.push(one());
    }
  }
  // Missed first, then by due date, undated last.
  return rows.sort((a, b) => Number(b.late) - Number(a.late) || (a.item.due ?? '9').localeCompare(b.item.due ?? '9'));
}

export const openCount = (view: ViewId, items: Item[], today: DateStr, all: AllCompletions) =>
  rowsFor(view, items, today, all).filter((r) => !isRowDone(r, all) && !(r.item.rule && !r.date)).length;

export type PlannedGroup = 'Overdue' | 'Today' | 'Tomorrow' | 'Later';

export function plannedGroup(due: DateStr, today: DateStr): PlannedGroup {
  if (due < today) return 'Overdue';
  if (due === today) return 'Today';
  if (due === addDaysStr(today, 1)) return 'Tomorrow';
  return 'Later';
}

/** Fields a new item gets when added from a view. `repeat` makes it a daily habit wherever it's added. */
export function newItemDefaults(
  view: ViewId,
  today: DateStr,
  fallbackListId: string,
  repeat = view === 'habits',
): Partial<Item> {
  const base: Partial<Item> = { listId: isSmartView(view) ? fallbackListId : view };
  if (repeat) return { ...base, rule: { type: 'daily' }, startDate: today, missed: 'skip' };
  if (view === 'myday') base.myDay = today;
  if (view === 'planned') base.due = today;
  return base;
}
