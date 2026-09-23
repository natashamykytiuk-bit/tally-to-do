import { addMonths, monthGrid, monthLabel, monthStart } from '../calendar';

test('monthStart and addMonths cross years', () => {
  expect(monthStart('2026-09-22')).toBe('2026-09-01');
  expect(addMonths('2026-12-01', 1)).toBe('2027-01-01');
  expect(addMonths('2026-01-01', -1)).toBe('2025-12-01');
  expect(addMonths('2026-09-01', 14)).toBe('2027-11-01');
});

test('September 2026 starts on a Tuesday and has 30 days', () => {
  const g = monthGrid('2026-09-01');
  expect(g[0]).toEqual([null, null, '2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04', '2026-09-05']);
  expect(g.flat().filter(Boolean)).toHaveLength(30);
  expect(g.every((w) => w.length === 7)).toBe(true);
  expect(g[g.length - 1]).toContain('2026-09-30');
});

test('February in a leap year', () => {
  expect(monthGrid('2028-02-01').flat().filter(Boolean)).toHaveLength(29);
});

test('monthLabel', () => {
  expect(monthLabel('2026-09-01')).toBe('September 2026');
});
