import { stepCount, type AllProgress } from './steps';
import type { DateStr, Item } from './types';

/** Percent choices in the circle's menu. */
export const PROGRESS_PRESETS = [25, 50, 75];

/** A whole percent from 1 to 99, or null if it isn't a usable partial amount. */
export function parsePercent(input: string): number | null {
  const n = Math.round(Number(input.trim().replace(/%$/, '')));
  return Number.isFinite(n) && n >= 1 && n <= 99 ? n : null;
}

/**
 * How full the circle is, 0–1: done is 1; otherwise the larger of the manual percent (one-off tasks)
 * and the share of steps ticked for this occurrence.
 */
export function fractionOf(item: Item, date: DateStr | null, done: boolean, progress: AllProgress): number {
  if (done) return 1;
  const manual = !item.rule && item.progress ? item.progress / 100 : 0;
  const s = stepCount(item, date, progress);
  const fromSteps = s.total ? s.done / s.total : 0;
  return Math.max(0, Math.min(1, Math.max(manual, fromSteps)));
}

/** Set aside for the rest of today with "Done for today" (one-off tasks, not finished). */
export const isDoneForToday = (item: Item, today: DateStr): boolean =>
  !item.rule && !item.done && item.doneForDay === today;

/** Skipped for today with "Not today" (recurring tasks). */
export const isNotToday = (item: Item, today: DateStr): boolean => !!item.rule && item.notToday === today;

/** Overall progress for a set of tasks: each counts 0–1 (partial progress counts for its share). */
export function overallProgress(fractions: number[]): { done: number; total: number; fraction: number } {
  const total = fractions.length;
  const done = fractions.filter((f) => f >= 1).length;
  const sum = fractions.reduce((a, f) => a + Math.max(0, Math.min(1, f)), 0);
  return { done, total, fraction: total ? sum / total : 0 };
}
