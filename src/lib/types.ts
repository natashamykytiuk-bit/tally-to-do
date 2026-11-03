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
  /** Missing when the task isn't in a list (added from My Day, Plan, Scheduled or Habits). */
  listId?: string;
  title: string;
  notes?: string;
  /** Legacy (the Important list was removed); ignored. */
  important?: boolean;
  createdAt?: Timestamp;
  steps?: Step[];
  // one-off only
  due?: DateStr;
  myDay?: DateStr;
  /** Days the user plans to work on it (one-off only). Use plansOf() to read. */
  plans?: DateStr[];
  /** Older single work day; still read by plansOf(), cleared on the next change. */
  plan?: DateStr;
  done?: boolean;
  /** Manual partial progress, 1–99 (one-off only). */
  progress?: number;
  /** Set aside with "Done for today" on this date (one-off only). */
  doneForDay?: DateStr;
  completedAt?: Timestamp;
  // recurring only
  /** Skipped with "Not today" on this date. */
  notToday?: DateStr;
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
