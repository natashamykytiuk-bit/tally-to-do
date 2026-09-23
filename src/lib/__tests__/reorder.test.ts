import { dropIndex, moveIndex } from '../reorder';

test('moveIndex', () => {
  expect(moveIndex(['a', 'b', 'c', 'd'], 0, 2)).toEqual(['b', 'c', 'a', 'd']);
  expect(moveIndex(['a', 'b', 'c', 'd'], 3, 0)).toEqual(['d', 'a', 'b', 'c']);
  expect(moveIndex(['a', 'b'], 1, 1)).toEqual(['a', 'b']);
});

test('dropIndex rounds to the nearest slot and stays in range', () => {
  expect(dropIndex(1, 0, 40, 4)).toBe(1);
  expect(dropIndex(1, 19, 40, 4)).toBe(1);
  expect(dropIndex(1, 21, 40, 4)).toBe(2);
  expect(dropIndex(1, -45, 40, 4)).toBe(0);
  expect(dropIndex(1, 500, 40, 4)).toBe(3);
  expect(dropIndex(2, -500, 40, 4)).toBe(0);
});
