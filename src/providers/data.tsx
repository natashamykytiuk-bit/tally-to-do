import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { useRealToday } from '@/hooks/use-today';
import { db } from '@/lib/firebase';
import { completionKind } from '@/lib/recurrence';
import type { Completion, DateStr, Item, List } from '@/lib/types';
import type { AllCompletions } from '@/lib/views';
import { useAuth } from '@/providers/auth';

export const LIST_COLORS = ['#3354C4', '#2A9D8F', '#D9682A', '#8A4FC7', '#C43D6B', '#5E8C2F'];

type Data = {
  ready: boolean;
  lists: List[];
  items: Item[];
  completions: AllCompletions;
  today: DateStr;
  addList: (name: string) => Promise<string>;
  addItem: (fields: Partial<Item> & { title: string; listId: string }) => Promise<string>;
  updateItem: (id: string, patch: Partial<Item>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  /** One-off: toggles done. Recurring: toggles the completion for `date`. */
  toggle: (item: Item, date: DateStr | null) => Promise<void>;
};

const DataContext = createContext<Data | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const today = useRealToday();
  const [lists, setLists] = useState<List[] | null>(null);
  const [items, setItems] = useState<Item[] | null>(null);
  const [completions, setCompletions] = useState<AllCompletions>({});

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
    ];
    return () => unsubs.forEach((u) => u());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  // First sign-in: give the user one list to put tasks in.
  useEffect(() => {
    if (db && uid && lists && lists.length === 0) {
      setDoc(doc(col('lists'), 'tasks'), { name: 'Tasks', color: LIST_COLORS[0], order: 0 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, lists]);

  const value = useMemo<Data>(() => {
    const ls = lists ?? [];
    return {
      ready: lists !== null && items !== null,
      lists: ls,
      items: items ?? [],
      completions,
      today,
      addList: async (name) => {
        const order = ls.length ? Math.max(...ls.map((l) => l.order)) + 1 : 0;
        const ref = await addDoc(col('lists'), { name, color: LIST_COLORS[ls.length % LIST_COLORS.length], order });
        return ref.id;
      },
      addItem: async (fields) => {
        const ref = doc(col('items'));
        await setDoc(ref, { important: false, ...fields, createdAt: serverTimestamp() });
        return ref.id;
      },
      updateItem: (id, patch) => updateDoc(doc(col('items'), id), patch),
      deleteItem: async (id) => {
        const batch = writeBatch(db!);
        batch.delete(doc(col('items'), id));
        for (const date of Object.keys(completions[id] ?? {})) batch.delete(doc(col('completions'), `${id}_${date}`));
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
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lists, items, completions, today, uid]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): Data {
  const d = useContext(DataContext);
  if (!d) throw new Error('useData must be used inside <DataProvider>');
  return d;
}
