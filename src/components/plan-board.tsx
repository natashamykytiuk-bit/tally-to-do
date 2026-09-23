import Ionicons from '@expo/vector-icons/Ionicons';
import { useRef, useState, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { PlanDayAdd } from '@/components/plan-day-add';
import { usePalette } from '@/constants/tally';
import { addDaysStr, prettyDate } from '@/lib/dates';
import { zoneAt, type Zone } from '@/lib/reorder';
import type { DateStr, Item } from '@/lib/types';
import { planDays, unplannedSoon } from '@/lib/views';

const UNPLANNED = 'unplanned';

type Props = {
  items: Item[];
  today: DateStr;
  /** Renders a task row; `handle` is the drag grip to show in it. */
  renderRow: (item: Item, handle: ReactNode) => ReactNode;
  /** Moves one of a task's work days: `from`/`to` are days, or undefined for "not planned". */
  onMove: (id: string, from: DateStr | undefined, to: DateStr | undefined) => void;
  /** Called with true while a drag is in progress, so the page can stop scrolling. */
  onDragging: (dragging: boolean) => void;
};

/** The Plan view: unplanned tasks due soon, then one section per day. Drag a task's ≡ to move it to another day. */
export function PlanBoard({ items, today, renderRow, onMove, onDragging }: Props) {
  const c = usePalette();
  const soon = unplannedSoon(items, today);
  const days = planDays(items, today);

  // Section positions are measured when a drag starts; `over` is the section under the pointer.
  const sections = useRef(new Map<string, View>());
  const zones = useRef<Zone[]>([]);
  const [drag, setDrag] = useState<{ id: string; from: string; dy: number; over: string | null } | null>(null);
  const dragRef = useRef(drag);
  dragRef.current = drag;

  const measure = () => {
    zones.current = [];
    sections.current.forEach((view, key) =>
      view?.measureInWindow((_x, y, _w, h) => zones.current.push({ key, top: y, bottom: y + h })),
    );
  };

  const gesture = (id: string, from: string) =>
    Gesture.Pan()
      .runOnJS(true)
      .onStart(() => {
        measure();
        onDragging(true);
        setDrag({ id, from, dy: 0, over: from });
      })
      .onUpdate((e) => setDrag((d) => d && { ...d, dy: e.translationY, over: zoneAt(zones.current, e.absoluteY) }))
      .onEnd(() => {
        const d = dragRef.current;
        const day = (k: string) => (k === UNPLANNED ? undefined : k);
        if (d?.over && d.over !== d.from) onMove(d.id, day(d.from), day(d.over));
      })
      .onFinalize(() => {
        setDrag(null);
        onDragging(false);
      });

  const handle = (item: Item, from: string) => (
    <GestureDetector gesture={gesture(item.id, from)}>
      <View
        style={[styles.grip, { cursor: drag?.id === item.id ? 'grabbing' : 'grab' } as object]}
        accessibilityLabel={`Drag ${item.title} to another day`}
        hitSlop={8}>
        <Ionicons name="reorder-two" size={18} color={c.muted} />
      </View>
    </GestureDetector>
  );

  const rows = (list: Item[], from: string) =>
    list.map((item) => {
      // A multi-day task appears in several sections; only the copy being dragged moves.
      const dragging = drag?.id === item.id;
      return (
        <View
          key={item.id}
          style={dragging && drag.from === from && { transform: [{ translateY: drag.dy }], zIndex: 20, opacity: 0.92 }}>
          {renderRow(item, handle(item, from))}
        </View>
      );
    });

  // The section being hovered during a drag (not the one the task came from) gets a highlight.
  const section = (key: string, children: ReactNode) => {
    const target = drag && drag.over === key && drag.from !== key;
    return (
      <View
        key={key}
        ref={(v) => {
          if (v) sections.current.set(key, v);
          else sections.current.delete(key);
        }}
        style={[
          styles.section,
          drag && { borderColor: target ? c.accent : 'transparent', backgroundColor: target ? c.accentSoft : 'transparent' },
          // Keep the dragged task drawn above later sections.
          drag?.from === key && { zIndex: 10 },
        ]}>
        {children}
      </View>
    );
  };

  const dayName = (d: DateStr) =>
    d === today ? `Today · ${prettyDate(d)}` : d === addDaysStr(today, 1) ? `Tomorrow · ${prettyDate(d)}` : prettyDate(d);

  return (
    <>
      {(soon.length > 0 || drag) &&
        section(
          UNPLANNED,
          <>
            <Text style={[styles.group, { color: c.muted }]}>DUE SOON · NOT PLANNED YET</Text>
            <Text style={[styles.hint, { color: c.muted }]}>
              {soon.length ? 'Drag ≡ onto a day, or tap 🕒 to pick one.' : 'Drop here to un-plan a task.'}
            </Text>
            {rows(soon, UNPLANNED)}
          </>,
        )}
      {days.map(({ date, items: dayItems }) =>
        section(
          date,
          <>
            <Text style={[styles.group, { color: date === today ? c.accent : c.muted }]}>{dayName(date).toUpperCase()}</Text>
            {rows(dayItems, date)}
            <PlanDayAdd date={date} />
          </>,
        ),
      )}
    </>
  );
}

const styles = StyleSheet.create({
  section: { gap: 6, borderWidth: 1.5, borderColor: 'transparent', borderRadius: 12, padding: 4, margin: -5 },
  group: { fontSize: 12, fontWeight: '600', letterSpacing: 0.7, marginTop: 12, marginBottom: 2, marginHorizontal: 4 },
  hint: { fontSize: 12.5, marginHorizontal: 4, marginTop: -2 },
  grip: { paddingRight: 2, marginLeft: -6 },
});
