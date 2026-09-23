import type { DateStr, Item, Step } from './types';

/** itemId → date → ids of ticked steps (recurring items only). */
export type AllProgress = Record<string, Record<DateStr, string[]>>;

/** Whether a step is ticked. One-off: stored on the step. Recurring: per occurrence date. */
export function isStepDone(item: Item, step: Step, date: DateStr | null, progress: AllProgress): boolean {
  if (!item.rule) return !!step.done;
  return !!date && (progress[item.id]?.[date] ?? []).includes(step.id);
}

/** Ticked ids for an occurrence after toggling `stepId`. */
export function toggledIds(done: string[], stepId: string): string[] {
  return done.includes(stepId) ? done.filter((x) => x !== stepId) : [...done, stepId];
}

/** Toggling this step finishes the last one, so the task should be checked off too. */
export function completesTask(item: Item, stepId: string, date: DateStr | null, progress: AllProgress): boolean {
  const steps = item.steps ?? [];
  if (!steps.length) return false;
  const target = steps.find((s) => s.id === stepId);
  if (!target || isStepDone(item, target, date, progress)) return false; // unticking never completes
  return steps.every((s) => s.id === stepId || isStepDone(item, s, date, progress));
}

export function stepCount(item: Item, date: DateStr | null, progress: AllProgress): { done: number; total: number } {
  const steps = item.steps ?? [];
  return { done: steps.filter((s) => isStepDone(item, s, date, progress)).length, total: steps.length };
}
