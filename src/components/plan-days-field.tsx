import Ionicons from '@expo/vector-icons/Ionicons';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CalendarPopup, type Anchor } from '@/components/calendar-popup';
import { usePalette } from '@/constants/tally';
import type { DateStr } from '@/lib/types';

/** "Choose days…" button in task details: opens the multi-select calendar with the current work days ticked. */
export function PlanDaysField({ days, onChange }: { days: DateStr[]; onChange: (days: DateStr[]) => void }) {
  const c = usePalette();
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const ref = useRef<View>(null);
  const show = () => ref.current?.measureInWindow((x, y, width, height) => setAnchor({ x, y, width, height }));
  return (
    <>
      <Pressable
        ref={ref}
        onPress={show}
        accessibilityRole="button"
        style={({ hovered }) => [styles.field, { borderColor: hovered ? c.accent : c.line, backgroundColor: c.bg }]}>
        <Ionicons name="time-outline" size={16} color={days.length ? c.accent : c.muted} />
        <Text style={{ color: c.ink, fontSize: 14 }}>{days.length ? 'Change days…' : 'Choose days…'}</Text>
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

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
});
