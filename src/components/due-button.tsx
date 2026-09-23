import Ionicons from '@expo/vector-icons/Ionicons';
import { useRef, useState } from 'react';
import { Pressable, View } from 'react-native';

import { CalendarPopup, type Anchor } from '@/components/calendar-popup';
import { usePalette } from '@/constants/tally';
import { prettyDate } from '@/lib/dates';
import type { DateStr } from '@/lib/types';

type Props = {
  value?: DateStr;
  onChange: (d: DateStr | undefined) => void;
  /** Task title, for screen readers. */ task?: string;
};

/** An icon on a task row that drops down Tally's calendar to set one of the task's dates. */
function DateIconButton({
  value,
  onChange,
  task,
  icon,
  title,
  label,
}: Props & { icon: 'calendar'; title: string; label: string }) {
  const c = usePalette();
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const ref = useRef<View>(null);
  const show = () => ref.current?.measureInWindow((x, y, width, height) => setAnchor({ x, y, width, height }));
  return (
    <>
      <Pressable
        ref={ref}
        onPress={show}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={`${value ? `Change ${label}` : `Set ${label}`}${task ? ` for ${task}` : ''}${value ? `, currently ${prettyDate(value)}` : ''}`}>
        <Ionicons name={value ? icon : `${icon}-outline`} size={18} color={value ? c.accent : c.muted} />
      </Pressable>
      <CalendarPopup
        open={!!anchor}
        anchor={anchor}
        title={title}
        value={value}
        quick
        onPick={onChange}
        onClear={() => onChange(undefined)}
        onClose={() => setAnchor(null)}
      />
    </>
  );
}

/** 📅 Due date. */
export const DueButton = (p: Props) => <DateIconButton {...p} icon="calendar" title="Due date" label="due date" />;

/** 🕒 The days to work on it (Plan). Pick as many as you like. */
export function PlanButton({
  days,
  onChange,
  task,
}: {
  days: DateStr[];
  onChange: (days: DateStr[]) => void;
  task?: string;
}) {
  const c = usePalette();
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const ref = useRef<View>(null);
  const show = () => ref.current?.measureInWindow((x, y, width, height) => setAnchor({ x, y, width, height }));
  return (
    <>
      <Pressable
        ref={ref}
        onPress={show}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={`${days.length ? `Change work days (${days.length})` : 'Plan days to work on it'}${task ? ` for ${task}` : ''}`}>
        <Ionicons name={days.length ? 'time' : 'time-outline'} size={18} color={days.length ? c.accent : c.muted} />
      </Pressable>
      <CalendarPopup
        open={!!anchor}
        anchor={anchor}
        title="Work on (pick one or more days)"
        quick
        onPick={() => {}}
        multiple={{ days, onDone: onChange }}
        onClose={() => setAnchor(null)}
      />
    </>
  );
}
