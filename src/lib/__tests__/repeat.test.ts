import { customRule, repeatPatch, unitOf } from '../repeat';
import type { Item } from '../types';

const TUE = '2026-09-22';
const oneOff: Item = { id: 'a', listId: 'l', title: 'Lab', due: '2026-09-24', done: true, myDay: TUE };
const habit: Item = { id: 'b', listId: 'l', title: 'Read', rule: { type: 'daily' }, startDate: '2026-09-01', endDate: '2026-12-01', missed: 'carry' };

test('switching Repeat on makes a daily rule from the due date and clears one-off fields', () => {
  expect(repeatPatch(oneOff, 'daily', TUE)).toEqual({
    rule: { type: 'daily' },
    startDate: '2026-09-24',
    missed: 'skip',
    due: undefined,
    done: undefined,
    completedAt: undefined,
    myDay: undefined,
  });
});

test('no due date starts today; already repeating is left alone', () => {
  expect(repeatPatch({ ...oneOff, due: undefined }, 'daily', TUE)).toMatchObject({ startDate: TUE });
  expect(repeatPatch(habit, 'daily', TUE)).toEqual({});
});

test('switching Repeat off clears the schedule only', () => {
  expect(repeatPatch(habit, 'none', TUE)).toEqual({ rule: undefined, startDate: undefined, endDate: undefined, missed: undefined });
});

test('unitOf reads any rule as every N day/week/month', () => {
  expect(unitOf({ type: 'daily' })).toEqual({ unit: 'day', interval: 1 });
  expect(unitOf({ type: 'everyN', interval: 3 })).toEqual({ unit: 'day', interval: 3 });
  expect(unitOf({ type: 'weekdays' })).toEqual({ unit: 'week', interval: 1 });
  expect(unitOf({ type: 'weekly', days: [1], interval: 2 })).toEqual({ unit: 'week', interval: 2 });
  expect(unitOf({ type: 'monthly', dom: 5 })).toEqual({ unit: 'month', interval: 1 });
});

test('customRule builds rules and keeps chosen days / day of month', () => {
  expect(customRule('day', 1, TUE)).toEqual({ type: 'daily' });
  expect(customRule('day', 4, TUE)).toEqual({ type: 'everyN', interval: 4 });
  expect(customRule('week', 1, TUE)).toEqual({ type: 'weekly', days: [2], interval: 1 });
  expect(customRule('week', 2, TUE, { type: 'weekly', days: [1, 5] })).toEqual({ type: 'weekly', days: [1, 5], interval: 2 });
  expect(customRule('week', 1, TUE, { type: 'weekdays' })).toEqual({ type: 'weekly', days: [1, 2, 3, 4, 5], interval: 1 });
  expect(customRule('month', 3, '2026-09-30')).toEqual({ type: 'monthly', dom: 30, interval: 3 });
  expect(customRule('month', 1, TUE, { type: 'monthly', dom: 15, interval: 2 })).toEqual({ type: 'monthly', dom: 15, interval: 1 });
});
