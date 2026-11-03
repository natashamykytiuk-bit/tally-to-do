import { dropIndex, mergeOrder, moveIndex, slotAt, sortRows, zoneAt, zoneAtPoint } from '../reorder';

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

test('zoneAtPoint finds the column under the pointer', () => {
  const zones = [
    { key: 'unplanned', top: 0, bottom: 100 },
    { key: 'sun', top: 120, bottom: 500, left: 0, right: 99 },
    { key: 'mon', top: 120, bottom: 500, left: 100, right: 199 },
  ];
  expect(zoneAtPoint(zones, 150, 50)).toBe('unplanned');
  expect(zoneAtPoint(zones, 50, 300)).toBe('sun');
  expect(zoneAtPoint(zones, 150, 300)).toBe('mon');
  expect(zoneAtPoint(zones, 500, 300)).toBeNull();
});

test('slotAt counts the cards above the pointer', () => {
  expect(slotAt([10, 30, 50], 5)).toBe(0);
  expect(slotAt([10, 30, 50], 40)).toBe(2);
  expect(slotAt([10, 30, 50], 99)).toBe(3);
});

test('mergeOrder reorders a day’s planned tasks around the other saved rows', () => {
  expect(mergeOrder(['a|', 'h|2026-09-22', 'b|'], ['b|', 'a|'])).toEqual(['b|', 'h|2026-09-22', 'a|']);
  expect(mergeOrder(['a|', 'h|x'], ['c|', 'a|'])).toEqual(['c|', 'a|', 'h|x']);
  expect(mergeOrder([], ['a|', 'b|'])).toEqual(['a|', 'b|']);
});
