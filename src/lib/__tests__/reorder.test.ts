import { dropIndex, moveIndex, sortRows, zoneAt } from '../reorder';

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

describe('sortRows', () => {
  const rows = [
    { key: 'a', title: 'essay', due: '2026-09-30', created: 100 },
    { key: 'b', title: 'Lab 10', due: '2026-09-24', created: 300 },
    { key: 'c', title: 'lab 9', created: 200 },
    { key: 'd', title: 'Buy stamps' },
  ];
  const keys = (rs: { key: string }[]) => rs.map((r) => r.key).join('');
  test('due date: soonest first, undated last in incoming order', () => expect(keys(sortRows(rows, 'due'))).toBe('bacd'));
  test('date created: newest first, unknown last', () => expect(keys(sortRows(rows, 'created'))).toBe('bcad'));
  test('A to Z: ignores case, numbers in order', () => expect(keys(sortRows(rows, 'az'))).toBe('dacb'));
  test('my order: saved keys first, new rows after', () => {
    expect(keys(sortRows(rows, 'custom', ['c', 'a']))).toBe('cabd');
    expect(keys(sortRows(rows, 'custom'))).toBe('abcd');
  });
});
