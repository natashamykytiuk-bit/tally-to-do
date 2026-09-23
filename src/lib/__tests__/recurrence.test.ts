import { addDaysStr, daysBetween, dow } from '../dates';
import { completionKind, occursOn, pendingMissed, ruleText, streak } from '../recurrence';
import type { CompletionMap, Item, Rule } from '../types';

// 2026-09-21 is a Monday.
const MON = '2026-09-21';
const TUE = '2026-09-22';

const make = (rule: Rule, extra: Partial<Item> = {}): Item => ({
  id: 'x',
  listId: 'l',
  title: 't',
  important: false,
  rule,
  startDate: '2026-09-01',
  missed: 'skip',
  ...extra,
});

/** Dates from `from` (inclusive) for `n` days on which the item occurs. */
const occurrences = (it: Item, from: string, n: number) =>
  Array.from({ length: n }, (_, i) => addDaysStr(from, i)).filter((d) => occursOn(it, d));

describe('dates', () => {
  test('day of week is local', () => {
    expect(dow(MON)).toBe(1);
    expect(dow(TUE)).toBe(2);
  });
  test('addDaysStr crosses month, year and DST boundaries', () => {
    expect(addDaysStr('2026-09-30', 1)).toBe('2026-10-01');
    expect(addDaysStr('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDaysStr('2026-10-31', 1)).toBe('2026-11-01'); // DST ends Nov 1 (N. America)
    expect(addDaysStr('2026-11-01', 1)).toBe('2026-11-02');
    expect(addDaysStr('2026-03-08', -1)).toBe('2026-03-07'); // DST starts Mar 8
    expect(daysBetween('2026-10-25', '2026-11-08')).toBe(14);
  });
  test('stepping a full year never repeats or skips a day', () => {
    const seen = new Set<string>();
    let d = '2026-01-01';
    for (let i = 0; i < 365; i++, d = addDaysStr(d, 1)) seen.add(d);
    expect(seen.size).toBe(365);
    expect(d).toBe('2027-01-01');
  });
});

describe('occursOn', () => {
  test('daily', () => {
    expect(occurrences(make({ type: 'daily' }), '2026-09-01', 30)).toHaveLength(30);
  });
  test('weekdays', () => {
    const it = make({ type: 'weekdays' });
    expect(occurrences(it, MON, 7)).toEqual(['2026-09-21', '2026-09-22', '2026-09-23', '2026-09-24', '2026-09-25']);
  });
  test('weekly Mon/Wed/Fri shows only on those days', () => {
    const it = make({ type: 'weekly', days: [1, 3, 5] });
    expect(occurrences(it, MON, 7)).toEqual(['2026-09-21', '2026-09-23', '2026-09-25']);
  });
  test('every 2 weeks on Mon/Thu counts calendar weeks from the start week', () => {
    // Start Wed Sep 23: that week's Thu counts, the next week is skipped.
    const it = make({ type: 'weekly', days: [1, 4], interval: 2 }, { startDate: '2026-09-23' });
    expect(occurrences(it, '2026-09-20', 21)).toEqual(['2026-09-24', '2026-10-05', '2026-10-08']);
  });
  test('every 3 weeks', () => {
    const it = make({ type: 'weekly', days: [0], interval: 3 }, { startDate: '2026-09-06' });
    expect(occurrences(it, '2026-09-06', 50)).toEqual(['2026-09-06', '2026-09-27', '2026-10-18']);
  });
  test('everyN counts from startDate', () => {
    const it = make({ type: 'everyN', interval: 3 }, { startDate: '2026-09-13' });
    expect(occurrences(it, '2026-09-10', 12)).toEqual(['2026-09-13', '2026-09-16', '2026-09-19']);
  });
  test('everyN stays aligned across DST', () => {
    const it = make({ type: 'everyN', interval: 7 }, { startDate: '2026-10-25' });
    expect(occurrences(it, '2026-10-25', 15)).toEqual(['2026-10-25', '2026-11-01', '2026-11-08']);
  });
  test('monthly on the 31st clamps to short months', () => {
    const it = make({ type: 'monthly', dom: 31 }, { startDate: '2026-01-01' });
    expect(occursOn(it, '2026-09-30')).toBe(true);
    expect(occursOn(it, '2026-09-29')).toBe(false);
    expect(occursOn(it, '2026-10-31')).toBe(true);
    expect(occursOn(it, '2026-10-30')).toBe(false);
    expect(occursOn(it, '2026-02-28')).toBe(true);
    expect(occursOn(make({ type: 'monthly', dom: 31 }, { startDate: '2028-01-01' }), '2028-02-29')).toBe(true);
    expect(occursOn(make({ type: 'monthly', dom: 31 }, { startDate: '2028-01-01' }), '2028-02-28')).toBe(false);
  });
  test('every 2 months on the 31st, clamped', () => {
    const it = make({ type: 'monthly', dom: 31, interval: 2 }, { startDate: '2026-08-01' });
    const all = occurrences(it, '2026-08-01', 220);
    expect(all).toEqual(['2026-08-31', '2026-10-31', '2026-12-31', '2027-02-28']);
  });
  test('respects startDate and endDate', () => {
    const it = make({ type: 'daily' }, { startDate: TUE, endDate: '2026-09-24' });
    expect(occursOn(it, MON)).toBe(false);
    expect(occursOn(it, TUE)).toBe(true);
    expect(occursOn(it, '2026-09-24')).toBe(true);
    expect(occursOn(it, '2026-09-25')).toBe(false);
  });
  test('one-off items never occur', () => {
    expect(occursOn({ id: 'a', listId: 'l', title: 't', important: false, due: TUE }, TUE)).toBe(false);
  });
});

describe('pendingMissed', () => {
  const mwf = (missed: 'carry' | 'skip') => make({ type: 'weekly', days: [1, 3, 5] }, { missed });

  test('carry: a missed Monday shows once on Tuesday', () => {
    const c: CompletionMap = { '2026-09-14': 'on', '2026-09-16': 'on', '2026-09-18': 'on' };
    expect(pendingMissed(mwf('carry'), TUE, c)).toBe(MON);
  });
  test('carry: returns only the oldest of several misses', () => {
    const c: CompletionMap = { '2026-09-14': 'on' };
    expect(pendingMissed(mwf('carry'), TUE, c)).toBe('2026-09-16');
  });
  test('carry: nothing pending once the miss is checked off late', () => {
    const c: CompletionMap = { '2026-09-18': 'on', [MON]: 'late' };
    expect(pendingMissed(mwf('carry'), TUE, c)).toBeNull();
  });
  test('skip: never carries', () => {
    expect(pendingMissed(mwf('skip'), TUE, {})).toBeNull();
  });
  test('does not look before startDate', () => {
    const it = make({ type: 'daily' }, { missed: 'carry', startDate: MON });
    expect(pendingMissed(it, TUE, {})).toBe(MON);
    expect(pendingMissed(it, MON, {})).toBeNull();
  });
});

describe('streak', () => {
  const daily = make({ type: 'daily' });
  const onDays = (from: string, n: number): CompletionMap =>
    Object.fromEntries(Array.from({ length: n }, (_, i) => [addDaysStr(from, i), 'on' as const]));

  test('counts consecutive on-time completions', () => {
    expect(streak(daily, TUE, onDays('2026-09-13', 9))).toBe(9); // 13..21
  });
  test('today still open does not break the streak', () => {
    expect(streak(daily, TUE, onDays('2026-09-19', 3))).toBe(3);
  });
  test('today done extends it', () => {
    expect(streak(daily, TUE, onDays('2026-09-19', 4))).toBe(4);
  });
  test('skip: a missed day resets to 0', () => {
    const c = onDays('2026-09-15', 5); // 15..19, missed 20 and 21
    expect(streak(daily, TUE, c)).toBe(0);
  });
  test('late completions do not count and break the chain', () => {
    const c: CompletionMap = { ...onDays('2026-09-15', 6), [MON]: 'late' };
    expect(streak(daily, TUE, c)).toBe(0);
  });
  test('non-scheduled days are skipped over', () => {
    const it = make({ type: 'weekly', days: [1, 3, 5] });
    const c: CompletionMap = { '2026-09-14': 'on', '2026-09-16': 'on', '2026-09-18': 'on', [MON]: 'on' };
    expect(streak(it, TUE, c)).toBe(4);
  });
  test('stops at startDate', () => {
    expect(streak(make({ type: 'daily' }, { startDate: '2026-09-20' }), TUE, onDays('2026-09-10', 12))).toBe(2);
  });
});

describe('helpers', () => {
  test('completionKind', () => {
    expect(completionKind(TUE, TUE)).toBe('on');
    expect(completionKind(MON, TUE)).toBe('late');
  });
  test('ruleText', () => {
    expect(ruleText({ type: 'weekly', days: [5, 1, 3] })).toBe('Mon, Wed, Fri');
    expect(ruleText({ type: 'everyN', interval: 3 })).toBe('Every 3 days');
    expect(ruleText(null)).toBe('');
    expect(ruleText({ type: 'weekly', days: [1, 4], interval: 2 })).toBe('Every 2 weeks on Mon, Thu');
    expect(ruleText({ type: 'everyN', interval: 1 })).toBe('Daily');
    expect(ruleText({ type: 'monthly', dom: 22, interval: 3 })).toBe('Every 3 months on the 22nd');
    expect(ruleText({ type: 'monthly', dom: 1 })).toBe('Monthly on the 1st');
  });
});
