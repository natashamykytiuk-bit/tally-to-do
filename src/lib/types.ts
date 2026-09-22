import type { Timestamp } from 'firebase/firestore';

/** Local calendar date, 'YYYY-MM-DD'. Never a UTC timestamp. */
export type DateStr = string;

export type List = { id: string; name: string; color: string; order: number };

export type Rule =
  | { type: 'daily' }
  | { type: 'weekdays' }
  | { type: 'weekly'; days: number[] } // 0=Sun … 6=Sat
  | { type: 'everyN'; interval: number } // counted from startDate
  | { type: 'monthly'; dom: number }; // clamps to last day of short months

export type Item = {
  id: string;
  listId: string;
  title: string;
  notes?: string;
  important: boolean;
  createdAt?: Timestamp;
  // one-off only
  due?: DateStr;
  myDay?: DateStr;
  done?: boolean;
  completedAt?: Timestamp;
  // recurring only
  rule?: Rule | null;
  startDate?: DateStr;
  endDate?: DateStr;
  missed?: 'carry' | 'skip';
};

export type CompletionKind = 'on' | 'late';

/** users/{uid}/completions/{itemId}_{date} */
export type Completion = { itemId: string; date: DateStr; kind: CompletionKind };

/** One item's completions keyed by scheduled date. */
export type CompletionMap = Record<DateStr, CompletionKind>;
