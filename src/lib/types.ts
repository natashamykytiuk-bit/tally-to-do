import type { Timestamp } from 'firebase/firestore';

/** Local calendar date, 'YYYY-MM-DD'. Never a UTC timestamp. */
export type DateStr = string;

export type List = { id: string; name: string; color: string; order: number };

export type Rule =
  | { type: 'daily' }
  | { type: 'weekdays' }
  | { type: 'weekly'; days: number[]; interval?: number } // days 0=Sun … 6=Sat; every `interval` weeks (default 1)
  | { type: 'everyN'; interval: number } // counted from startDate
  | { type: 'monthly'; dom: number; interval?: number }; // clamps to last day of short months; every `interval` months (default 1)

/** A checklist entry inside a task. `done` is used for one-off tasks only. */
export type Step = { id: string; title: string; done?: boolean };

export type Item = {
  id: string;
  listId: string;
  title: string;
  notes?: string;
  /** Legacy (the Important list was removed); ignored. */
  important?: boolean;
  createdAt?: Timestamp;
  steps?: Step[];
  // one-off only
  due?: DateStr;
  myDay?: DateStr;
  /** The day the user plans to work on it (one-off only). Shows in My Day from then until done. */
  plan?: DateStr;
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

/** users/{uid}/progress/{itemId}_{date}: which steps are ticked for one occurrence of a recurring item. */
export type StepProgress = { itemId: string; date: DateStr; done: string[] };
