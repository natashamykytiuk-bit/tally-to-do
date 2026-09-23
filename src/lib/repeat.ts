import { dayOfMonth, dow } from './dates';
import type { DateStr, Item, Rule } from './types';

export type Unit = 'day' | 'week' | 'month';

/** A rule as "every `interval` `unit`s" (what the Repeat controls show). */
export function unitOf(rule: Rule): { unit: Unit; interval: number } {
  switch (rule.type) {
    case 'daily':
      return { unit: 'day', interval: 1 };
    case 'everyN':
      return { unit: 'day', interval: rule.interval };
    case 'weekdays':
      return { unit: 'week', interval: 1 };
    case 'weekly':
      return { unit: 'week', interval: rule.interval ?? 1 };
    case 'monthly':
      return { unit: 'month', interval: rule.interval ?? 1 };
  }
}

/** Rule for "every `interval` `unit`s", keeping days/day-of-month from `prev` when it has them. */
export function customRule(unit: Unit, interval: number, start: DateStr, prev?: Rule | null): Rule {
  if (unit === 'day') return interval === 1 ? { type: 'daily' } : { type: 'everyN', interval };
  if (unit === 'week') {
    const days = prev?.type === 'weekly' ? prev.days : prev?.type === 'weekdays' ? [1, 2, 3, 4, 5] : [dow(start)];
    return { type: 'weekly', days, interval };
  }
  return { type: 'monthly', dom: prev?.type === 'monthly' ? prev.dom : dayOfMonth(start), interval };
}

/**
 * Patch for turning Repeat on ('daily') or off ('none'). `undefined` fields are cleared.
 * One-off → recurring: drops due/done/My Day, starts on the due date (or today), missed defaults to 'skip'.
 * Recurring → one-off: drops the schedule; title, list and notes stay.
 */
export function repeatPatch(item: Item, choice: 'daily' | 'none', today: DateStr): Partial<Item> {
  if (choice === 'none') {
    return { rule: undefined, startDate: undefined, endDate: undefined, missed: undefined };
  }
  if (item.rule) return {};
  const start = item.due ?? today;
  return {
    rule: { type: 'daily' },
    startDate: start,
    missed: 'skip',
    due: undefined,
    done: undefined,
    completedAt: undefined,
    myDay: undefined,
    plan: undefined,
  };
}
