import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable } from 'react-native';

import { CalendarPopup } from '@/components/calendar-popup';
import { usePalette } from '@/constants/tally';
import type { DateStr } from '@/lib/types';

type Props = { value?: DateStr; onChange: (d: DateStr | undefined) => void };

/** Calendar icon on a task row that opens Tally's calendar for the due date. */
export function DueButton({ value, onChange }: Props) {
  const c = usePalette();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={value ? 'Change due date' : 'Set due date'}>
        <Ionicons name={value ? 'calendar' : 'calendar-outline'} size={18} color={value ? c.accent : c.muted} />
      </Pressable>
      <CalendarPopup
        open={open}
        title="Due date"
        value={value}
        quick
        onPick={onChange}
        onClear={() => onChange(undefined)}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
