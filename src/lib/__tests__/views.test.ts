import type { Item } from '../types';
import { isRowDone, newItemDefaults, openCount, planDays, plannedGroup, rowsFor, unplannedSoon } from '../views';

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
  expect(newItemDefaults('myday', TUE)).toEqual({ myDay: TUE }); // no list
  expect(newItemDefaults('planned', TUE)).toMatchObject({ due: TUE });
  expect(newItemDefaults('habits', TUE)).toMatchObject({ rule: { type: 'daily' }, startDate: TUE, missed: 'skip' });
  expect(newItemDefaults('cpen', TUE)).toMatchObject({ listId: 'cpen' });
});

test('repeat adds a daily habit to the current list', () => {
  const it = newItemDefaults('cpen', TUE, true);
  expect(it).toMatchObject({ listId: 'cpen', rule: { type: 'daily' }, startDate: TUE, missed: 'skip' });
  expect(newItemDefaults('myday', TUE, true)).not.toHaveProperty('myDay');
  expect(newItemDefaults('planned', TUE, true)).not.toHaveProperty('due');
});

describe('planning', () => {
  const plan: Item[] = [
    { id: 'p1', listId: 'l', title: 'Start essay', plan: '2026-09-23', due: '2026-09-30' },
    { id: 'p2', listId: 'l', title: 'Leftover', plan: '2026-09-20' },
    { id: 'p3', listId: 'l', title: 'Far off', plan: '2026-10-15' },
    { id: 'p4', listId: 'l', title: 'Done', plan: '2026-09-24', done: true },
    { id: 'u1', listId: 'l', title: 'Lab 4', due: '2026-09-25' },
    { id: 'u2', listId: 'l', title: 'Late', due: '2026-09-19' },
    { id: 'u3', listId: 'l', title: 'Next month', due: '2026-11-30' },
  ];

  test('My Day shows work planned for today or earlier, until done', () => {
    expect(ids(rowsFor('myday', plan, TUE, {})).sort()).toEqual(['p2', 'u2']);
    expect(ids(rowsFor('myday', plan, '2026-09-23', {}))).toContain('p1');
  });

  test('planDays: a week from today plus later planned days; leftovers roll into today', () => {
    const days = planDays(plan, TUE);
    expect(days.map((d) => d.date)).toEqual([
      '2026-09-22', '2026-09-23', '2026-09-24', '2026-09-25', '2026-09-26', '2026-09-27', '2026-09-28', '2026-10-15',
    ]);
    expect(days[0].items.map((i) => i.id)).toEqual(['p2']);
    expect(days[1].items.map((i) => i.id)).toEqual(['p1']);
    expect(days[2].items).toEqual([]); // done tasks drop out
    expect(days[7].items.map((i) => i.id)).toEqual(['p3']);
  });

  test('unplannedSoon: due within two weeks or overdue, not planned, soonest first', () => {
    expect(unplannedSoon(plan, TUE).map((i) => i.id)).toEqual(['u2', 'u1']);
  });

  test('multi-day tasks show under each of their days', () => {
    const multi: Item[] = [{ id: 'm', listId: 'l', title: 'Big essay', plans: ['2026-09-22', '2026-09-24', '2026-10-03'] }];
    const days = planDays(multi, TUE);
    expect(days.filter((d) => d.items.length).map((d) => d.date)).toEqual(['2026-09-22', '2026-09-24', '2026-10-03']);
    expect(ids(rowsFor('myday', multi, TUE, {}))).toEqual(['m']);
    expect(ids(rowsFor('myday', multi, '2026-09-23', {}))).toEqual([]); // not a work day
  });

  test('adding from Plan plans it for today', () => {
    expect(newItemDefaults('plan', TUE)).toMatchObject({ plans: [TUE] });
  });
});

test('Tasks shows tasks without a list; smart views add tasks with no list', () => {
  const loose: Item[] = [
    { id: 'a', title: 'Buy stamps' },
    { id: 'b', listId: 'cpen', title: 'Lab' },
    { id: 'c', title: 'Stretch', rule: { type: 'daily' }, startDate: '2026-09-01' },
  ];
  expect(ids(rowsFor('nolist', loose, TUE, {})).sort()).toEqual(['a', 'c@2026-09-22']);
  for (const v of ['myday', 'plan', 'planned', 'habits', 'nolist']) expect(newItemDefaults(v, TUE).listId).toBeUndefined();
});

test('Done for today moves out of the open count until tomorrow', () => {
  const t: Item[] = [{ id: 'e', title: 'Essay', myDay: TUE, doneForDay: TUE }, { id: 'f', title: 'Read', myDay: TUE }];
  expect(openCount('myday', t, TUE, {})).toBe(1);
  expect(openCount('myday', [{ ...t[0], myDay: '2026-09-23' }], '2026-09-23', {})).toBe(1);
});
