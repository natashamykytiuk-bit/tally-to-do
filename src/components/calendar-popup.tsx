import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { usePalette } from '@/constants/tally';
import { addMonths, monthGrid, monthLabel, monthStart } from '@/lib/calendar';
import { addDaysStr, dow, prettyDate } from '@/lib/dates';
import type { DateStr } from '@/lib/types';
import { useData } from '@/providers/data';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

type Props = {
  open: boolean;
  title: string;
  value?: DateStr;
  onPick: (d: DateStr) => void;
  /** Shows a Remove button when given and a date is set. */
  onClear?: () => void;
  onClose: () => void;
  /** Today / Tomorrow / Next week shortcuts. */
  quick?: boolean;
};

/** Tally's own month calendar, themed with the user's colours on every platform. */
export function CalendarPopup({ open, title, value, onPick, onClear, onClose, quick }: Props) {
  const c = usePalette();
  const { today } = useData();
  const [month, setMonth] = useState(monthStart(value ?? today));
  useEffect(() => {
    if (open) setMonth(monthStart(value ?? today));
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const pick = (d: DateStr) => {
    onClose();
    onPick(d);
  };
  // Next Monday, or a week out if today is Monday.
  const nextWeek = addDaysStr(today, ((8 - dow(today)) % 7) || 7);
  const shortcuts: [string, DateStr][] = [
    ['Today', today],
    ['Tomorrow', addDaysStr(today, 1)],
    ['Next week', nextWeek],
  ];

  const navBtn = (icon: 'chevron-back' | 'chevron-forward', n: number, label: string) => (
    <Pressable
      onPress={() => setMonth(addMonths(month, n))}
      hitSlop={8}
      accessibilityLabel={label}
      style={({ hovered }) => [styles.nav, hovered && { backgroundColor: c.accentSoft }]}>
      <Ionicons name={icon} size={18} color={c.ink} />
    </Pressable>
  );

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      {/* The popup is rendered inside a task row; stop presses here from reaching the row (which opens details). */}
      <View
        style={styles.center}
        onStartShouldSetResponder={() => true}
        {...{ onClick: (e: { stopPropagation: () => void }) => e.stopPropagation() }}>
        <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel="Close calendar" />
        <View style={[styles.card, { backgroundColor: c.panel, shadowColor: c.ink }]}>
          <Text style={[styles.title, { color: c.muted }]}>{title}</Text>

          {quick && (
            <View style={styles.quick}>
              {shortcuts.map(([name, d]) => {
                const on = d === value;
                return (
                  <Pressable
                    key={name}
                    onPress={() => pick(d)}
                    style={[styles.chip, { borderColor: on ? c.accent : c.line, backgroundColor: on ? c.accent : c.bg }]}>
                    <Text style={{ color: on ? '#fff' : c.ink, fontSize: 13 }}>{name}</Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          <View style={styles.header}>
            {navBtn('chevron-back', -1, 'Previous month')}
            <Text style={[styles.month, { color: c.ink }]}>{monthLabel(month)}</Text>
            {navBtn('chevron-forward', 1, 'Next month')}
          </View>

          <View style={styles.week}>
            {WEEKDAYS.map((d, i) => (
              <Text key={i} style={[styles.cell, styles.weekday, { color: c.muted }]}>
                {d}
              </Text>
            ))}
          </View>
          {monthGrid(month).map((week, wi) => (
            <View key={wi} style={styles.week}>
              {week.map((d, di) => {
                if (!d) return <View key={di} style={styles.cell} />;
                const selected = d === value;
                const isToday = d === today;
                return (
                  <Pressable
                    key={d}
                    onPress={() => pick(d)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    accessibilityLabel={prettyDate(d)}
                    style={({ hovered }) => [
                      styles.cell,
                      styles.day,
                      isToday && !selected && { borderWidth: 1.5, borderColor: c.accent },
                      hovered && !selected && { backgroundColor: c.accentSoft },
                      selected && { backgroundColor: c.accent },
                    ]}>
                    <Text
                      style={{
                        color: selected ? '#fff' : isToday ? c.accent : c.ink,
                        fontWeight: selected || isToday ? '700' : '400',
                        fontSize: 14,
                      }}>
                      {Number(d.slice(8))}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ))}

          <View style={styles.foot}>
            {onClear && value ? (
              <Pressable
                onPress={() => {
                  onClose();
                  onClear();
                }}
                hitSlop={6}>
                <Text style={{ color: c.warn, fontWeight: '600' }}>Remove</Text>
              </Pressable>
            ) : (
              <View />
            )}
            <Pressable onPress={onClose} hitSlop={6}>
              <Text style={{ color: c.accent, fontWeight: '600' }}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const CELL = 38;
const styles = StyleSheet.create({
  // Absolute fill, not flex: 1 - react-native-web's Modal doesn't stretch its children.
  center: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center', padding: 16 },
  scrim: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(0,0,0,0.35)' },
  card: {
    borderRadius: 14,
    padding: 14,
    gap: 4,
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  title: { fontSize: 13, marginBottom: 4 },
  quick: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  chip: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  nav: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  month: { fontSize: 15, fontWeight: '600' },
  week: { flexDirection: 'row' },
  cell: { width: CELL, height: CELL, alignItems: 'center', justifyContent: 'center', textAlign: 'center' },
  weekday: { fontSize: 12, fontWeight: '600', height: 24 },
  day: { borderRadius: CELL / 2 },
  foot: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingHorizontal: 4 },
});
