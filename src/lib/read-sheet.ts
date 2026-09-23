import * as XLSX from 'xlsx';

/** Rows of the first sheet in an .xlsx, .xls or .csv file given as base64. Cells keep their raw values. */
export function readSheet(base64: string): unknown[][] {
  const book = XLSX.read(base64, { type: 'base64' });
  const first = book.Sheets[book.SheetNames[0]];
  if (!first) return [];
  return XLSX.utils.sheet_to_json<unknown[]>(first, { header: 1, raw: true, blankrows: false, defval: '' });
}
