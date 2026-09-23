import { addDaysStr, dayOfMonth, daysBetween, dow, lastDayOfMonth, prettyDate, weekStart } from './dates';
import type { CompletionKind, CompletionMap, DateStr, Item, Rule } from './types';

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const CARRY_LOOKBACK_DAYS = 60;
const STREAK_LOOKBACK_DAYS = 400;

/** Whether a recurring item is scheduled on a date. One-off items never "occur". */
export function occursOn(item: Item, date: DateStr): boolean {
  const r = item.rule;
  if (!r || !item.startDate || date < item.startDate) return false;
  if (item.endDate && date > item.endDate) return false;
  switch (r.type) {
    case 'daily':
      return true;
    case 'weekdays': {
      const d = dow(date);
      return d > 0 && d < 6;
    }
    case 'weekly': {
      if (!r.days.includes(dow(date))) return false;
      // Every N weeks, counted in calendar weeks (Sun–Sat) from the start date's week.
      const weeks = daysBetween(weekStart(item.startDate), weekStart(date)) / 7;
      return weeks % Math.max(1, r.interval ?? 1) === 0;
    }
    case 'everyN':
      return daysBetween(item.startDate, date) % Math.max(1, r.interval) === 0;
    case 'monthly': {
      if (dayOfMonth(date) !== Math.min(r.dom, lastDayOfMonth(date))) return false;
      const months = monthIndex(date) - monthIndex(item.startDate);
      return months % Math.max(1, r.interval ?? 1) === 0;
    }
  }
}

const monthIndex = (s: DateStr) => Number(s.slice(0, 4)) * 12 + Number(s.slice(5, 7));

/**
 * For 'carry' items: the oldest scheduled-but-undone date before today,
 * looking back only as far as the most recent completed occurrence.
 */
export function pendingMissed(item: Item, today: DateStr, completions: CompletionMap): DateStr | null {
  if (item.missed !== 'carry' || !item.startDate) return null;
  let oldest: DateStr | null = null;
  for (let i = 1; i <= CARRY_LOOKBACK_DAYS; i++) {
    const d = addDaysStr(today, -i);
    if (d < item.startDate) break;
    if (!occursOn(item, d)) continue;
    if (completions[d]) break;
    oldest = d;
  }
  return oldest;
}

/** Consecutive on-time completions. Late check-offs break the chain. */
export function streak(item: Item, today: DateStr, completions: CompletionMap): number {
  if (!item.startDate) return 0;
  let d = today;
  // Today still being open shouldn't zero the streak.
  if (occursOn(item, d) && completions[d] !== 'on') d = addDaysStr(d, -1);
  let n = 0;
  for (let i = 0; i < STREAK_LOOKBACK_DAYS && d >= item.startDate; i++, d = addDaysStr(d, -1)) {
    if (!occursOn(item, d)) continue;
    if (completions[d] === 'on') n++;
    else break;
  }
  return n;
}

export const completionKind = (scheduledDate: DateStr, today: DateStr): CompletionKind =>
  scheduledDate === today ? 'on' : 'late';

export function ruleText(r: Rule | null | undefined): string {
  if (!r) return '';
  switch (r.type) {
    case 'daily':
      return 'Daily';
    case 'weekdays':
      return 'Weekdays';
    case 'weekly': {
      const n = r.interval ?? 1;
      const days = [...r.days].sort().map((d) => DOW[d]).join(', ');
      const every = n === 1 ? 'Weekly' : `Every ${n} weeks`;
      return days ? (n === 1 ? days : `${every} on ${days}`) : every;
    }
    case 'everyN':
      return r.interval === 1 ? 'Daily' : `Every ${r.interval} days`;
    case 'monthly': {
      const n = r.interval ?? 1;
      return `${n === 1 ? 'Monthly' : `Every ${n} months`} on the ${ordinal(r.dom)}`;
    }
  }
}

/** Rule text plus the end date, e.g. "Mon, Wed · until Fri, Dec 4". */
export const scheduleText = (item: Item): string =>
  item.rule ? ruleText(item.rule) + (item.endDate ? ` · until ${prettyDate(item.endDate)}` : '') : '';

const ordinal = (n: number) => {
  const s = ['th', 'st', 'nd', 'rd'], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};
