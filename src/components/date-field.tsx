import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { CalendarPopup } from '@/components/calendar-popup';
import { usePalette } from '@/constants/tally';
import { prettyDate } from '@/lib/dates';
import type { DateStr } from '@/lib/types';

type Props = { value?: DateStr; onChange: (d: DateStr) => void; placeholder: string };

/** A field showing a date; tapping it opens Tally's calendar. */
export function DateField({ value, onChange, placeholder }: Props) {
  const c = usePalette();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={value ? `${placeholder}: ${prettyDate(value)}` : placeholder}
        style={({ hovered }) => [styles.field, { borderColor: hovered ? c.accent : c.line, backgroundColor: c.bg }]}>
        <Ionicons name="calendar-outline" size={16} color={value ? c.accent : c.muted} />
        <Text style={{ color: value ? c.ink : c.muted, fontSize: 14 }}>{value ? prettyDate(value) : placeholder}</Text>
      </Pressable>
      <CalendarPopup open={open} title={placeholder} value={value} onPick={onChange} onClose={() => setOpen(false)} />
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
