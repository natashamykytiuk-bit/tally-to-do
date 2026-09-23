import { isValid, parse } from 'date-fns';

import { addDaysStr, toLocalDateString } from './dates';
import type { DateStr, List } from './types';

export type ImportedTask = { title: string; due?: DateStr; list?: string; notes?: string };
export type ParsedSheet = { tasks: ImportedTask[]; skipped: number; columns: Partial<Record<Field, string>> };

type Field = 'title' | 'due' | 'list' | 'notes';

// Header words recognised for each field (lower-case, matched as whole header or as a word in it).
const HEADERS: Record<Field, string[]> = {
  title: ['task', 'title', 'name', 'assignment', 'item', 'todo', 'to do', 'to-do', 'activity', 'deliverable'],
  due: ['due', 'due date', 'date', 'deadline', 'when', 'due on'],
  list: ['list', 'class', 'course', 'subject', 'category', 'project', 'module', 'group'],
  notes: ['notes', 'note', 'description', 'details', 'comments', 'comment', 'info'],
};

const clean = (v: unknown) => (v == null ? '' : String(v).trim());

/** Which column holds each field, from the header row. */
export function findColumns(header: unknown[]): Partial<Record<Field, number>> {
  const cols: Partial<Record<Field, number>> = {};
  const names = header.map((h) => clean(h).toLowerCase());
  for (const field of Object.keys(HEADERS) as Field[]) {
    // Exact header match first, then a header that contains one of the words.
    let i = names.findIndex((n) => HEADERS[field].includes(n));
    if (i < 0) i = names.findIndex((n) => HEADERS[field].some((w) => n.split(/[^a-z-]+/).includes(w)));
    if (i >= 0 && !Object.values(cols).includes(i)) cols[field] = i;
  }
  return cols;
}

const TEXT_FORMATS = ['yyyy-MM-dd', 'M/d/yyyy', 'M/d/yy', 'M-d-yyyy', 'MMM d, yyyy', 'MMM d yyyy', 'MMMM d, yyyy', 'MMMM d yyyy', 'd MMM yyyy', 'MMM d', 'MMMM d', 'd MMM', 'M/d'];

/**
 * A due date from a cell: an Excel date serial number, a JS Date, or text in a common format.
 * Numeric dates are read month-first (9/24 = Sep 24). Dates without a year take the next such date on or after today.
 */
export function parseDate(v: unknown, today: DateStr): DateStr | undefined {
  if (v instanceof Date) return isValid(v) ? toLocalDateString(v) : undefined;
  if (typeof v === 'number' && v > 20000 && v < 80000) {
    // Excel serial: days since 1899-12-30 (this accounts for Excel's 1900 leap-year bug for modern dates).
    return addDaysStr('1899-12-30', Math.floor(v));
  }
  const s = clean(v).replace(/^(mon|tue|wed|thu|fri|sat|sun)[a-z]*,?\s+/i, '').replace(/(\d)(st|nd|rd|th)\b/i, '$1');
  if (!s) return undefined;
  const ref = new Date(Number(today.slice(0, 4)), Number(today.slice(5, 7)) - 1, Number(today.slice(8, 10)));
  for (const f of TEXT_FORMATS) {
    const d = parse(s, f, ref);
    if (!isValid(d)) continue;
    let out = toLocalDateString(d);
    if (!/y/.test(f) && out < today) out = `${Number(out.slice(0, 4)) + 1}${out.slice(4)}`; // no year given: next occurrence
    return out;
  }
  return undefined;
}

/** Turns sheet rows (first row = headers) into tasks. Rows without a title are skipped. */
export function parseSheet(rows: unknown[][], today: DateStr): ParsedSheet {
  const nonEmpty = rows.filter((r) => r.some((c) => clean(c)));
  if (!nonEmpty.length) return { tasks: [], skipped: 0, columns: {} };
  let cols = findColumns(nonEmpty[0]);
  let body = nonEmpty.slice(1);
  // No recognisable headers: treat the first column as titles and keep every row.
  if (cols.title === undefined) {
    cols = { title: 0 };
    body = nonEmpty;
  }
  const header = nonEmpty[0];
  const columns = Object.fromEntries(
    (Object.entries(cols) as [Field, number][]).map(([f, i]) => [f, body === nonEmpty ? `column ${i + 1}` : clean(header[i])]),
  ) as ParsedSheet['columns'];

  const tasks: ImportedTask[] = [];
  let skipped = 0;
  for (const r of body) {
    const title = clean(r[cols.title!]);
    if (!title) {
      skipped++;
      continue;
    }
    const t: ImportedTask = { title };
    if (cols.due !== undefined) {
      const due = parseDate(r[cols.due], today);
      if (due) t.due = due;
    }
    if (cols.list !== undefined && clean(r[cols.list])) t.list = clean(r[cols.list]);
    if (cols.notes !== undefined && clean(r[cols.notes])) t.notes = clean(r[cols.notes]);
    tasks.push(t);
  }
  return { tasks, skipped, columns };
}

/** Which list names need creating (matched to existing lists ignoring case), in first-seen order. */
export function newListNames(tasks: ImportedTask[], lists: List[]): string[] {
  const existing = new Set(lists.map((l) => l.name.trim().toLowerCase()));
  const out: string[] = [];
  for (const t of tasks) {
    const n = t.list?.trim();
    if (n && !existing.has(n.toLowerCase()) && !out.some((o) => o.toLowerCase() === n.toLowerCase())) out.push(n);
  }
  return out;
}
