import { shouldShowTour, TOUR } from '../tour';
import type { Item } from '../types';

const task: Item = { id: 'a', listId: 'l', title: 'Lab 3' };

test('new accounts see the tour; finished or existing accounts do not', () => {
  expect(shouldShowTour(undefined, [])).toBe(true);
  expect(shouldShowTour(true, [])).toBe(false);
  expect(shouldShowTour(undefined, [task])).toBe(false);
});

test('tour starts with a welcome and every step has text', () => {
  expect(TOUR[0].title).toMatch(/Welcome/);
  expect(TOUR.every((s) => s.title && s.body)).toBe(true);
});
