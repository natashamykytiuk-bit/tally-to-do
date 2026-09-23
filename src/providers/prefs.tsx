import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { db } from '@/lib/firebase';
import type { SortMode } from '@/lib/reorder';
import { useAuth } from '@/providers/auth';

export type ThemeMode = 'system' | 'light' | 'dark';
/** users/{uid}/meta/prefs */
export type Prefs = {
  theme: ThemeMode;
  accent?: string;
  /** Finished or skipped the intro tour. */
  tourDone?: boolean;
  /** How My Day is sorted, and the dragged order (row keys) for 'custom'. */
  mydaySort?: SortMode;
  mydayOrder?: string[];
};

const DEFAULT: Prefs = { theme: 'system' };

type PrefsState = {
  prefs: Prefs;
  /** False until the signed-in user's saved prefs have arrived. */
  loaded: boolean;
  setPrefs: (patch: Partial<Prefs>) => Promise<void>;
};

const PrefsContext = createContext<PrefsState>({ prefs: DEFAULT, loaded: false, setPrefs: async () => {} });

/** Appearance preferences, synced to the signed-in user's account. Defaults when signed out. */
export function PrefsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [prefs, setLocal] = useState<Prefs>(DEFAULT);
  const [loaded, setLoaded] = useState(false);
  const uid = user?.uid;

  useEffect(() => {
    setLoaded(false);
    if (!db || !uid) {
      setLocal(DEFAULT);
      return;
    }
    return onSnapshot(doc(db, 'users', uid, 'meta', 'prefs'), (s) => {
      setLocal({ ...DEFAULT, ...(s.data() as Partial<Prefs>) });
      setLoaded(true);
    });
  }, [uid]);

  const setPrefs = async (patch: Partial<Prefs>) => {
    setLocal((p) => ({ ...p, ...patch })); // instant, before the round trip
    if (db && uid) await setDoc(doc(db, 'users', uid, 'meta', 'prefs'), patch, { merge: true });
  };

  return <PrefsContext.Provider value={{ prefs, loaded, setPrefs }}>{children}</PrefsContext.Provider>;
}

export const usePrefs = () => useContext(PrefsContext);
