import Ionicons from '@expo/vector-icons/Ionicons';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CalendarPopup, type Anchor } from '@/components/calendar-popup';
import { usePalette } from '@/constants/tally';
import { prettyDate } from '@/lib/dates';
import type { DateStr } from '@/lib/types';

type Props = { value?: DateStr; onChange: (d: DateStr) => void; placeholder: string };

/** A field showing a date; tapping it opens Tally's calendar. */
export function DateField({ value, onChange, placeholder }: Props) {
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
        accessibilityLabel={value ? `${placeholder}: ${prettyDate(value)}` : placeholder}
        style={({ hovered }) => [styles.field, { borderColor: hovered ? c.accent : c.line, backgroundColor: c.bg }]}>
        <Ionicons name="calendar-outline" size={16} color={value ? c.accent : c.muted} />
        <Text style={{ color: value ? c.ink : c.muted, fontSize: 14 }}>{value ? prettyDate(value) : placeholder}</Text>
      </Pressable>
      <CalendarPopup
        open={!!anchor}
        anchor={anchor}
        title={placeholder}
        value={value}
        onPick={onChange}
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
