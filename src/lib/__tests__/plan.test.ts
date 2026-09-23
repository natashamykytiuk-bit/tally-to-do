import { movePlanDay, planLabel, plannedToday, plansOf, plansPatch, togglePlanDay } from '../plan';
import type { Item } from '../types';

const TUE = '2026-09-22';
const task = (x: Partial<Item>): Item => ({ id: 't', listId: 'l', title: 'Essay', ...x });

test('plansOf reads the list, the old single field, and sorts / de-duplicates', () => {
  expect(plansOf(task({ plans: ['2026-09-24', '2026-09-22', '2026-09-24'] }))).toEqual(['2026-09-22', '2026-09-24']);
  expect(plansOf(task({ plan: '2026-09-23' }))).toEqual(['2026-09-23']);
  expect(plansOf(task({}))).toEqual([]);
});

test('plansPatch retires the old field and clears when empty', () => {
  expect(plansPatch(['2026-09-24', '2026-09-22'])).toEqual({ plans: ['2026-09-22', '2026-09-24'], plan: undefined });
  expect(plansPatch([])).toEqual({ plans: undefined, plan: undefined });
});

test('toggle and move days', () => {
  expect(togglePlanDay(['2026-09-22'], '2026-09-24')).toEqual(['2026-09-22', '2026-09-24']);
  expect(togglePlanDay(['2026-09-22', '2026-09-24'], '2026-09-22')).toEqual(['2026-09-24']);
  expect(movePlanDay(['2026-09-22', '2026-09-24'], '2026-09-22', '2026-09-26')).toEqual(['2026-09-24', '2026-09-26']);
  expect(movePlanDay(['2026-09-22', '2026-09-24'], '2026-09-22', '2026-09-24')).toEqual(['2026-09-24']); // merged
  expect(movePlanDay(['2026-09-22'], '2026-09-22', undefined)).toEqual([]);
  expect(movePlanDay([], undefined, '2026-09-25')).toEqual(['2026-09-25']); // from "not planned"
});

test('My Day: each work day, and carried forward once all days have passed', () => {
  const t = task({ plans: ['2026-09-21', '2026-09-23'] });
  expect(plannedToday(t, TUE)).toBe(false); // between work days
  expect(plannedToday(t, '2026-09-23')).toBe(true);
  expect(plannedToday(t, '2026-09-25')).toBe(true); // all passed, not done
  expect(plannedToday({ ...t, done: true }, '2026-09-25')).toBe(false);
});

test('planLabel', () => {
  expect(planLabel(task({ plans: [TUE] }), TUE)).toEqual({ text: 'Work on today', warn: false });
  expect(planLabel(task({ plans: ['2026-09-23', '2026-09-24', '2026-09-26'] }), TUE)).toEqual({
    text: 'Work on Wed, Sep 23 + 2 more',
    warn: false,
  });
  expect(planLabel(task({ plans: ['2026-09-20', '2026-09-21'] }), TUE)).toEqual({ text: 'Planned Mon, Sep 21', warn: true });
  expect(planLabel(task({}), TUE)).toBeNull();
});
