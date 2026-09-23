import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { db } from '@/lib/firebase';
import { useAuth } from '@/providers/auth';

export type ThemeMode = 'system' | 'light' | 'dark';
/** users/{uid}/meta/prefs */
export type Prefs = { theme: ThemeMode; accent?: string };

const DEFAULT: Prefs = { theme: 'system' };

type PrefsState = { prefs: Prefs; setPrefs: (patch: Partial<Prefs>) => Promise<void> };

const PrefsContext = createContext<PrefsState>({ prefs: DEFAULT, setPrefs: async () => {} });

/** Appearance preferences, synced to the signed-in user's account. Defaults when signed out. */
export function PrefsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [prefs, setLocal] = useState<Prefs>(DEFAULT);
  const uid = user?.uid;

  useEffect(() => {
    if (!db || !uid) {
      setLocal(DEFAULT);
      return;
    }
    return onSnapshot(doc(db, 'users', uid, 'meta', 'prefs'), (s) => setLocal({ ...DEFAULT, ...(s.data() as Partial<Prefs>) }));
  }, [uid]);

  const setPrefs = async (patch: Partial<Prefs>) => {
    setLocal((p) => ({ ...p, ...patch })); // instant, before the round trip
    if (db && uid) await setDoc(doc(db, 'users', uid, 'meta', 'prefs'), patch, { merge: true });
  };

  return <PrefsContext.Provider value={{ prefs, setPrefs }}>{children}</PrefsContext.Provider>;
}

export const usePrefs = () => useContext(PrefsContext);
