import Ionicons from '@expo/vector-icons/Ionicons';
import { useRef, useState } from 'react';
import { Pressable, View } from 'react-native';

import { CalendarPopup, type Anchor } from '@/components/calendar-popup';
import { usePalette } from '@/constants/tally';
import type { DateStr } from '@/lib/types';

type Props = { value?: DateStr; onChange: (d: DateStr | undefined) => void };

/** Calendar icon on a task row that opens Tally's calendar for the due date. */
export function DueButton({ value, onChange }: Props) {
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
        accessibilityLabel={value ? 'Change due date' : 'Set due date'}>
        <Ionicons name={value ? 'calendar' : 'calendar-outline'} size={18} color={value ? c.accent : c.muted} />
      </Pressable>
      <CalendarPopup
        open={!!anchor}
        anchor={anchor}
        title="Due date"
        value={value}
        quick
        onPick={onChange}
        onClear={() => onChange(undefined)}
        onClose={() => setAnchor(null)}
      />
    </>
  );
}
