import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { useRealToday } from '@/hooks/use-today';
import { PRESET_COLORS } from '@/lib/color';
import { db } from '@/lib/firebase';
import type { ImportedTask } from '@/lib/import';
import { completionKind } from '@/lib/recurrence';
import { completesTask, toggledIds, type AllProgress } from '@/lib/steps';
import type { Completion, DateStr, Item, List, StepProgress } from '@/lib/types';
import type { AllCompletions } from '@/lib/views';
import { useAuth } from '@/providers/auth';


// New lists cycle through the original six colours.
const LIST_COLORS = PRESET_COLORS.slice(0, 6);
const DEFAULT_LIST = { name: 'Tasks', color: LIST_COLORS[0], order: 0 };

type Data = {
  ready: boolean;
  lists: List[];
  items: Item[];
  completions: AllCompletions;
  progress: AllProgress;
  today: DateStr;
  addList: (name: string) => Promise<string>;
  updateList: (id: string, patch: Partial<Omit<List, 'id'>>) => Promise<void>;
  /**
   * Adds imported tasks. Lists are matched by name (ignoring case) and created if missing;
   * tasks without a list get no list. Returns how many tasks and lists were added.
   */
  importTasks: (tasks: ImportedTask[]) => Promise<{ tasks: number; lists: number }>;
  /** Saves a new list order (ids top to bottom). */
  reorderLists: (ids: string[]) => Promise<void>;
  /** Deletes the list, its tasks, and their completions and step progress. */
  deleteList: (id: string) => Promise<void>;
  addItem: (fields: Partial<Item> & { title: string }) => Promise<string>;
  updateItem: (id: string, patch: Partial<Item>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  /** One-off: toggles done. Recurring: toggles the completion for `date`. */
  toggle: (item: Item, date: DateStr | null) => Promise<void>;
  addStep: (item: Item, title: string) => Promise<void>;
  renameStep: (item: Item, stepId: string, title: string) => Promise<void>;
  removeStep: (item: Item, stepId: string) => Promise<void>;
  /** Ticks a step (per occurrence for recurring items); ticking the last one checks off the task. */
  toggleStep: (item: Item, stepId: string, date: DateStr | null) => Promise<void>;
};

const DataContext = createContext<Data | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const today = useRealToday();
  const [lists, setLists] = useState<List[] | null>(null);
  const [items, setItems] = useState<Item[] | null>(null);
  const [completions, setCompletions] = useState<AllCompletions>({});
  const [progress, setProgress] = useState<AllProgress>({});

  const uid = user?.uid;
  const col = (name: string) => collection(db!, 'users', uid!, name);

  useEffect(() => {
    if (!db || !uid) return;
    const unsubs = [
      onSnapshot(col('lists'), (s) => {
        const ls = s.docs.map((d) => ({ ...(d.data() as Omit<List, 'id'>), id: d.id }));
        setLists(ls.sort((a, b) => a.order - b.order));
      }),
      onSnapshot(col('items'), (s) => setItems(s.docs.map((d) => ({ ...(d.data() as Omit<Item, 'id'>), id: d.id })))),
      onSnapshot(col('completions'), (s) => {
        const all: AllCompletions = {};
        for (const d of s.docs) {
          const c = d.data() as Completion;
          (all[c.itemId] ??= {})[c.date] = c.kind;
        }
        setCompletions(all);
      }),
      onSnapshot(col('progress'), (s) => {
        const all: AllProgress = {};
        for (const d of s.docs) {
          const p = d.data() as StepProgress;
          (all[p.itemId] ??= {})[p.date] = p.done;
        }
        setProgress(all);
      }),
    ];
    return () => unsubs.forEach((u) => u());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  // First sign-in: give the user one list to put tasks in. Only checks the first load, so
  // wiping data during account deletion doesn't recreate it.
  const checkedFirstLoad = useRef<string | null>(null);
  useEffect(() => {
    if (!db || !uid || !lists || checkedFirstLoad.current === uid) return;
    checkedFirstLoad.current = uid;
    if (lists.length === 0) setDoc(doc(col('lists'), 'tasks'), DEFAULT_LIST);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, lists]);

  const value = useMemo<Data>(() => {
    const ls = lists ?? [];
    return {
      ready: lists !== null && items !== null,
      lists: ls,
      items: items ?? [],
      completions,
      progress,
      today,
      addList: async (name) => {
        const order = ls.length ? Math.max(...ls.map((l) => l.order)) + 1 : 0;
        const ref = await addDoc(col('lists'), { name, color: LIST_COLORS[ls.length % LIST_COLORS.length], order });
        return ref.id;
      },
      updateList: (id, patch) => updateDoc(doc(col('lists'), id), patch),
      importTasks: async (tasks) => {
        // Map each list name (lower-case) to its id, creating lists that don't exist yet.
        const byName = new Map(ls.map((l) => [l.name.trim().toLowerCase(), l.id]));
        const writes: [ReturnType<typeof doc>, object][] = [];
        let order = ls.length ? Math.max(...ls.map((l) => l.order)) + 1 : 0;
        let newLists = 0;
        for (const t of tasks) {
          const key = t.list?.trim().toLowerCase();
          if (!key || byName.has(key)) continue;
          const ref = doc(col('lists'));
          byName.set(key, ref.id);
          writes.push([ref, { name: t.list!.trim(), color: LIST_COLORS[(ls.length + newLists) % LIST_COLORS.length], order: order++ }]);
          newLists++;
        }
        for (const t of tasks) {
          const listId = t.list ? byName.get(t.list.trim().toLowerCase()) : undefined;
          writes.push([doc(col('items')), { title: t.title, listId, due: t.due, notes: t.notes, createdAt: serverTimestamp() }]);
        }
        // Firestore allows 500 writes per batch.
        for (let i = 0; i < writes.length; i += 450) {
          const batch = writeBatch(db!);
          writes.slice(i, i + 450).forEach(([ref, data]) => batch.set(ref, data));
          await batch.commit();
        }
        return { tasks: tasks.length, lists: newLists };
      },
      reorderLists: async (ids) => {
        setLists((cur) => cur && ids.map((id, order) => ({ ...cur.find((l) => l.id === id)!, order }))); // instant
        const batch = writeBatch(db!);
        ids.forEach((id, order) => batch.update(doc(col('lists'), id), { order }));
        await batch.commit();
      },
      deleteList: async (id) => {
        const batch = writeBatch(db!);
        batch.delete(doc(col('lists'), id));
        // Always keep one list, so there's somewhere to add tasks.
        if (ls.every((l) => l.id === id)) batch.set(doc(col('lists')), DEFAULT_LIST);
        for (const it of (items ?? []).filter((i) => i.listId === id)) {
          batch.delete(doc(col('items'), it.id));
          for (const date of Object.keys(completions[it.id] ?? {})) batch.delete(doc(col('completions'), `${it.id}_${date}`));
          for (const date of Object.keys(progress[it.id] ?? {})) batch.delete(doc(col('progress'), `${it.id}_${date}`));
        }
        await batch.commit();
      },
      addItem: async (fields) => {
        const ref = doc(col('items'));
        await setDoc(ref, { ...fields, createdAt: serverTimestamp() });
        return ref.id;
      },
      // undefined means "clear this field" (Firestore needs deleteField() for that).
      updateItem: (id, patch) =>
        updateDoc(
          doc(col('items'), id),
          Object.fromEntries(Object.entries(patch).map(([k, v]) => [k, v === undefined ? deleteField() : v])),
        ),
      deleteItem: async (id) => {
        const batch = writeBatch(db!);
        batch.delete(doc(col('items'), id));
        for (const date of Object.keys(completions[id] ?? {})) batch.delete(doc(col('completions'), `${id}_${date}`));
        for (const date of Object.keys(progress[id] ?? {})) batch.delete(doc(col('progress'), `${id}_${date}`));
        await batch.commit();
      },
      toggle: async (item, date) => {
        if (!item.rule) {
          const done = !item.done;
          return updateDoc(doc(col('items'), item.id), { done, completedAt: done ? serverTimestamp() : null });
        }
        if (!date) return;
        const ref = doc(col('completions'), `${item.id}_${date}`);
        if (completions[item.id]?.[date]) return deleteDoc(ref);
        const c: Completion = { itemId: item.id, date, kind: completionKind(date, today) };
        return setDoc(ref, c);
      },
      addStep: (item, title) =>
        updateDoc(doc(col('items'), item.id), {
          steps: [...(item.steps ?? []), { id: doc(col('items')).id, title }],
        }),
      renameStep: (item, stepId, title) =>
        updateDoc(doc(col('items'), item.id), {
          steps: (item.steps ?? []).map((s) => (s.id === stepId ? { ...s, title } : s)),
        }),
      removeStep: (item, stepId) =>
        updateDoc(doc(col('items'), item.id), { steps: (item.steps ?? []).filter((s) => s.id !== stepId) }),
      toggleStep: async (item, stepId, date) => {
        const finish = completesTask(item, stepId, date, progress);
        const batch = writeBatch(db!);
        if (!item.rule) {
          const steps = (item.steps ?? []).map((s) => (s.id === stepId ? { ...s, done: !s.done } : s));
          batch.update(doc(col('items'), item.id), finish && !item.done ? { steps, done: true, completedAt: serverTimestamp() } : { steps });
        } else {
          if (!date) return;
          const p: StepProgress = { itemId: item.id, date, done: toggledIds(progress[item.id]?.[date] ?? [], stepId) };
          batch.set(doc(col('progress'), `${item.id}_${date}`), p);
          if (finish && !completions[item.id]?.[date]) {
            const c: Completion = { itemId: item.id, date, kind: completionKind(date, today) };
            batch.set(doc(col('completions'), `${item.id}_${date}`), c);
          }
        }
        await batch.commit();
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lists, items, completions, progress, today, uid]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): Data {
  const d = useContext(DataContext);
  if (!d) throw new Error('useData must be used inside <DataProvider>');
  return d;
}
