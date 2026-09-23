import type { Item } from '../types';
import { isRowDone, newItemDefaults, openCount, plannedGroup, rowsFor } from '../views';

const TUE = '2026-09-22';
const base = { listId: 'cpen' };
const items: Item[] = [
  { ...base, id: 'lab', title: 'Lab 3', due: '2026-09-24' },
  { ...base, id: 'read', title: 'Read ch. 2', due: TUE },
  { ...base, id: 'ps1', title: 'Problem set 1', due: '2026-09-21' },
  { ...base, id: 'yarn', listId: 'me', title: 'Buy yarn', myDay: TUE },
  { ...base, id: 'old', listId: 'me', title: 'Old My Day', myDay: '2026-09-20' },
  { ...base, id: 'rev', title: 'Review notes', rule: { type: 'weekly', days: [1, 3, 5] }, startDate: '2026-09-07', missed: 'carry' },
  { ...base, id: 'str', listId: 'me', title: 'Stretch', rule: { type: 'daily' }, startDate: '2026-09-10', missed: 'skip' },
];
const comps = { rev: { '2026-09-18': 'on' as const }, str: { '2026-09-21': 'on' as const } };
const ids = (rows: { item: Item; date: string | null }[]) => rows.map((r) => `${r.item.id}${r.date ? '@' + r.date : ''}`);

test('My Day: carried miss first, then today, plus due/overdue and My Day one-offs', () => {
  const rows = rowsFor('myday', items, TUE, comps);
  expect(ids(rows)[0]).toBe('rev@2026-09-21');
  expect(rows[0].late).toBe(true);
  expect(ids(rows).sort()).toEqual(['ps1', 'read', 'rev@2026-09-21', 'str@2026-09-22', 'yarn']);
});

test('My Day: finished overdue items drop out', () => {
  const done = items.map((i) => (i.id === 'ps1' ? { ...i, done: true } : i));
  expect(ids(rowsFor('myday', done, TUE, comps))).not.toContain('ps1');
});

test('Planned groups', () => {
  expect(plannedGroup('2026-09-21', TUE)).toBe('Overdue');
  expect(plannedGroup(TUE, TUE)).toBe('Today');
  expect(plannedGroup('2026-09-23', TUE)).toBe('Tomorrow');
  expect(plannedGroup('2026-09-24', TUE)).toBe('Later');
  expect(ids(rowsFor('planned', items, TUE, comps)).sort()).toEqual(['lab', 'ps1', 'read']);
});

test('Habits shows every recurring item; unscheduled today has no date', () => {
  const rows = rowsFor('habits', items, '2026-09-23', { ...comps, rev: { '2026-09-21': 'on' } });
  expect(ids(rows).sort()).toEqual(['rev@2026-09-23', 'str@2026-09-23']);
  const thu = rowsFor('habits', items, '2026-09-24', { rev: { '2026-09-23': 'on' } });
  expect(thu.find((r) => r.item.id === 'rev')?.date).toBeNull();
});

test('list view and counts', () => {
  expect(ids(rowsFor('me', items, TUE, comps)).sort()).toEqual(['old', 'str@2026-09-22', 'yarn']);
  expect(openCount('myday', items, TUE, comps)).toBe(5);
  expect(openCount('myday', items, TUE, { ...comps, str: { [TUE]: 'on' } })).toBe(4);
});

test('isRowDone reads the occurrence date', () => {
  const [row] = rowsFor('habits', [items[6]], TUE, { str: { [TUE]: 'on' } });
  expect(isRowDone(row, { str: { [TUE]: 'on' } })).toBe(true);
});

test('adding from a view pre-fills context', () => {
  expect(newItemDefaults('myday', TUE, 'l1')).toMatchObject({ listId: 'l1', myDay: TUE });
  expect(newItemDefaults('planned', TUE, 'l1')).toMatchObject({ due: TUE });
  expect(newItemDefaults('habits', TUE, 'l1')).toMatchObject({ rule: { type: 'daily' }, startDate: TUE, missed: 'skip' });
  expect(newItemDefaults('cpen', TUE, 'l1')).toMatchObject({ listId: 'cpen' });
});

test('repeat adds a daily habit to the current list', () => {
  const it = newItemDefaults('cpen', TUE, 'l1', true);
  expect(it).toMatchObject({ listId: 'cpen', rule: { type: 'daily' }, startDate: TUE, missed: 'skip' });
  expect(newItemDefaults('myday', TUE, 'l1', true)).not.toHaveProperty('myDay');
  expect(newItemDefaults('planned', TUE, 'l1', true)).not.toHaveProperty('due');
});
