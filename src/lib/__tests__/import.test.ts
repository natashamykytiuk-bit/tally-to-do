import { findColumns, newListNames, parseDate, parseSheet } from '../import';

const TODAY = '2026-09-22';

describe('findColumns', () => {
  test('recognises common header names in any order', () => {
    expect(findColumns(['Course', 'Assignment', 'Due Date', 'Notes'])).toEqual({ list: 0, title: 1, due: 2, notes: 3 });
    expect(findColumns(['Task', 'Deadline', 'Class'])).toEqual({ title: 0, due: 1, list: 2 });
    expect(findColumns(['Task name', 'When'])).toEqual({ title: 0, due: 1 });
  });
});

describe('parseDate', () => {
  test('Excel serial numbers', () => {
    expect(parseDate(46289, TODAY)).toBe('2026-09-24');
    expect(parseDate(45658, TODAY)).toBe('2025-01-01');
  });
  test('text formats (month first)', () => {
    expect(parseDate('2026-09-24', TODAY)).toBe('2026-09-24');
    expect(parseDate('9/24/2026', TODAY)).toBe('2026-09-24');
    expect(parseDate('Sep 24, 2026', TODAY)).toBe('2026-09-24');
    expect(parseDate('Thursday, September 24th 2026', TODAY)).toBe('2026-09-24');
    expect(parseDate('24 Sep 2026', TODAY)).toBe('2026-09-24');
  });
  test('no year means the next such date', () => {
    expect(parseDate('Sep 24', TODAY)).toBe('2026-09-24');
    expect(parseDate('Jan 5', TODAY)).toBe('2027-01-05');
    expect(parseDate('9/22', TODAY)).toBe('2026-09-22');
  });
  test('junk is ignored', () => {
    expect(parseDate('', TODAY)).toBeUndefined();
    expect(parseDate('soon', TODAY)).toBeUndefined();
    expect(parseDate(3, TODAY)).toBeUndefined();
  });
});

describe('parseSheet', () => {
  test('reads tasks, skips blank titles', () => {
    const rows = [
      ['Course', 'Assignment', 'Due'],
      ['CPEN 221', 'Lab 3', 46289],
      ['CPEN 211', 'Problem set 2', 'Oct 1'],
      ['CPEN 211', '', 'Oct 2'],
      [],
      ['', 'Buy yarn', ''],
    ];
    const r = parseSheet(rows, TODAY);
    expect(r.tasks).toEqual([
      { title: 'Lab 3', list: 'CPEN 221', due: '2026-09-24' },
      { title: 'Problem set 2', list: 'CPEN 211', due: '2026-10-01' },
      { title: 'Buy yarn' },
    ]);
    expect(r.skipped).toBe(1);
    expect(r.columns).toEqual({ title: 'Assignment', due: 'Due', list: 'Course' });
  });
  test('no headers: first column is the title and nothing is lost', () => {
    const r = parseSheet([['Read chapter 2'], ['Stretch']], TODAY);
    expect(r.tasks.map((t) => t.title)).toEqual(['Read chapter 2', 'Stretch']);
    expect(r.columns).toEqual({ title: 'column 1' });
  });
});

test('newListNames matches existing lists ignoring case', () => {
  const lists = [{ id: 'a', name: 'CPEN 221', color: '#000', order: 0 }];
  const tasks = [{ title: 'x', list: 'cpen 221' }, { title: 'y', list: 'CPEN 211' }, { title: 'z', list: 'cpen 211' }, { title: 'w' }];
  expect(newListNames(tasks, lists)).toEqual(['CPEN 211']);
});

test('reads a real spreadsheet file end to end', () => {
  // Build a small .xlsx in memory, the way Excel would save it.
  const XLSX = require('xlsx');
  const ws = XLSX.utils.aoa_to_sheet([
    ['Class', 'Task', 'Due date'],
    ['CPEN 221', 'Lab 3', new Date(2026, 8, 24)],
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  const b64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
  const { readSheet } = require('../read-sheet');
  expect(parseSheet(readSheet(b64), TODAY).tasks).toEqual([{ title: 'Lab 3', list: 'CPEN 221', due: '2026-09-24' }]);
});
