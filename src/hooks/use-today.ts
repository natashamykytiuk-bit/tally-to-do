import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { toLocalDateString } from '@/lib/dates';
import type { DateStr } from '@/lib/types';

const msUntilMidnight = () => {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return next.getTime() - now.getTime() + 1000;
};

/** The device's local date. Updates at midnight and when the app returns to the foreground. */
export function useRealToday(): DateStr {
  const [today, setToday] = useState(() => toLocalDateString(new Date()));
  useEffect(() => {
    const refresh = () => setToday(toLocalDateString(new Date()));
    let timer = setTimeout(function tick() {
      refresh();
      timer = setTimeout(tick, msUntilMidnight());
    }, msUntilMidnight());
    const sub = AppState.addEventListener('change', (s) => s === 'active' && refresh());
    return () => {
      clearTimeout(timer);
      sub.remove();
    };
  }, []);
  return today;
}
