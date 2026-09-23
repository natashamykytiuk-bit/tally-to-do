import { addDaysStr, dow, lastDayOfMonth, parseLocal } from './dates';
import type { DateStr } from './types';

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** First day of the month containing `d`. */
export const monthStart = (d: DateStr): DateStr => d.slice(0, 8) + '01';

/** Same day-1 of the month `n` months away. */
export function addMonths(first: DateStr, n: number): DateStr {
  const idx = Number(first.slice(0, 4)) * 12 + Number(first.slice(5, 7)) - 1 + n;
  const y = Math.floor(idx / 12), m = (idx % 12) + 1;
  return `${y}-${String(m).padStart(2, '0')}-01`;
}

/** Weeks (Sun–Sat) covering the month; days outside the month are null. */
export function monthGrid(first: DateStr): (DateStr | null)[][] {
  const lead = dow(first);
  const days = lastDayOfMonth(first);
  const cells: (DateStr | null)[] = Array(lead).fill(null);
  for (let i = 0; i < days; i++) cells.push(addDaysStr(first, i));
  while (cells.length % 7) cells.push(null);
  const weeks: (DateStr | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

export const monthLabel = (first: DateStr): string =>
  `${MONTHS[parseLocal(first).getMonth()]} ${first.slice(0, 4)}`;
