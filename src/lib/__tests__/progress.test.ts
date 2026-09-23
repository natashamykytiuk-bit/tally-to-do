import { fractionOf, isDoneForToday, parsePercent } from '../progress';
import type { Item } from '../types';

const TUE = '2026-09-22';
const task = (x: Partial<Item>): Item => ({ id: 't', title: 'Essay', ...x });

test('parsePercent accepts 1–99, with or without %', () => {
  expect(parsePercent('40')).toBe(40);
  expect(parsePercent(' 62% ')).toBe(62);
  expect(parsePercent('33.4')).toBe(33);
  expect(parsePercent('0')).toBeNull();
  expect(parsePercent('100')).toBeNull();
  expect(parsePercent('lots')).toBeNull();
});

test('fractionOf: done, manual percent, steps, whichever is higher', () => {
  expect(fractionOf(task({ progress: 50 }), null, true, {})).toBe(1);
  expect(fractionOf(task({ progress: 50 }), null, false, {})).toBe(0.5);
  const steps = [{ id: 'a', title: 'a', done: true }, { id: 'b', title: 'b' }, { id: 'c', title: 'c' }, { id: 'd', title: 'd' }];
  expect(fractionOf(task({ steps }), null, false, {})).toBe(0.25);
  expect(fractionOf(task({ steps, progress: 60 }), null, false, {})).toBe(0.6);
  expect(fractionOf(task({}), null, false, {})).toBe(0);
});

test('habits ignore the manual percent but fill from today’s steps', () => {
  const habit = task({ rule: { type: 'daily' }, startDate: '2026-09-01', progress: 80, steps: [{ id: 'a', title: 'a' }, { id: 'b', title: 'b' }] });
  expect(fractionOf(habit, TUE, false, {})).toBe(0);
  expect(fractionOf(habit, TUE, false, { t: { [TUE]: ['a'] } })).toBe(0.5);
});

test('isDoneForToday only for today, one-off, not finished', () => {
  expect(isDoneForToday(task({ doneForDay: TUE }), TUE)).toBe(true);
  expect(isDoneForToday(task({ doneForDay: TUE }), '2026-09-23')).toBe(false);
  expect(isDoneForToday(task({ doneForDay: TUE, done: true }), TUE)).toBe(false);
});
