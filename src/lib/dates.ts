import { addDays, differenceInCalendarDays, format, getDaysInMonth, parse } from 'date-fns';

import type { DateStr } from './types';

// All dates are local 'YYYY-MM-DD' strings. Never use toISOString() here:
// it converts to UTC and shifts the day for anyone west/east of Greenwich.

export const toLocalDateString = (d: Date): DateStr => format(d, 'yyyy-MM-dd');

/** Parses to local noon so DST shifts can never push it into a neighbouring day. */
export const parseLocal = (s: DateStr): Date => parse(`${s} 12`, 'yyyy-MM-dd HH', new Date());

export const addDaysStr = (s: DateStr, n: number): DateStr => toLocalDateString(addDays(parseLocal(s), n));

/** Calendar days from a to b (positive when b is later). */
export const daysBetween = (a: DateStr, b: DateStr): number =>
  differenceInCalendarDays(parseLocal(b), parseLocal(a));

/** Sunday of the week containing s. */
export const weekStart = (s: DateStr): DateStr => addDaysStr(s, -dow(s));

/** Day of week, 0=Sun … 6=Sat. */
export const dow = (s: DateStr): number => parseLocal(s).getDay();

export const dayOfMonth = (s: DateStr): number => Number(s.slice(8, 10));

export const lastDayOfMonth = (s: DateStr): number => getDaysInMonth(parseLocal(s));

export const prettyDate = (s: DateStr): string => format(parseLocal(s), 'EEE, MMM d');

/** A week's range for headings, e.g. "Sep 20 – 26" or "Sep 27 – Oct 3". Adds the year when it isn't this year's. */
export function weekLabel(start: DateStr, thisYear = String(new Date().getFullYear())): string {
  const end = addDaysStr(start, 6);
  const a = parseLocal(start), b = parseLocal(end);
  const sameMonth = start.slice(0, 7) === end.slice(0, 7);
  const range = `${format(a, 'MMM d')} – ${format(b, sameMonth ? 'd' : 'MMM d')}`;
  return end.slice(0, 4) === thisYear ? range : `${range}, ${end.slice(0, 4)}`;
}
