import { dropIndex, moveIndex, zoneAt } from '../reorder';

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

test('zoneAt finds the day under the pointer, or the nearest one', () => {
  const zones = [
    { key: 'unplanned', top: 100, bottom: 200 },
    { key: '2026-09-22', top: 210, bottom: 300 },
    { key: '2026-09-23', top: 310, bottom: 360 },
  ];
  expect(zoneAt(zones, 150)).toBe('unplanned');
  expect(zoneAt(zones, 250)).toBe('2026-09-22');
  expect(zoneAt(zones, 305)).toBe('2026-09-22'); // in the gap, closer to the one above
  expect(zoneAt(zones, 900)).toBe('2026-09-23');
  expect(zoneAt([], 10)).toBeNull();
});
