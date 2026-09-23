import { completesTask, isStepDone, stepCount, toggledIds } from '../steps';
import type { Item } from '../types';

const steps = [
  { id: 'a', title: 'Read', done: true },
  { id: 'b', title: 'Write' },
];
const oneOff: Item = { id: 'x', listId: 'l', title: 'Lab', important: false, steps };
const habit: Item = { ...oneOff, id: 'h', rule: { type: 'daily' }, startDate: '2026-09-01', steps: steps.map(({ id, title }) => ({ id, title })) };
const progress = { h: { '2026-09-22': ['a'] } };

test('one-off steps use their own done flag', () => {
  expect(isStepDone(oneOff, steps[0], null, {})).toBe(true);
  expect(stepCount(oneOff, null, {})).toEqual({ done: 1, total: 2 });
});

test('recurring steps are per occurrence', () => {
  expect(isStepDone(habit, habit.steps![0], '2026-09-22', progress)).toBe(true);
  expect(isStepDone(habit, habit.steps![0], '2026-09-23', progress)).toBe(false);
  expect(isStepDone(habit, habit.steps![0], null, progress)).toBe(false);
});

test('ticking the last open step completes the task; unticking never does', () => {
  expect(completesTask(oneOff, 'b', null, {})).toBe(true);
  expect(completesTask(oneOff, 'a', null, {})).toBe(false);
  expect(completesTask(habit, 'b', '2026-09-22', progress)).toBe(true);
  expect(completesTask(habit, 'b', '2026-09-23', progress)).toBe(false);
});

test('toggledIds', () => {
  expect(toggledIds(['a'], 'b')).toEqual(['a', 'b']);
  expect(toggledIds(['a', 'b'], 'a')).toEqual(['b']);
});
