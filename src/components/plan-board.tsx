import { useRef, useState, type ReactNode } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';

import { PlanDayAdd } from '@/components/plan-day-add';
import { ProgressCircle } from '@/components/progress-circle';
import { usePalette, WIDE_BREAKPOINT } from '@/constants/tally';
import { dow, prettyDate } from '@/lib/dates';
import { markDragged, rowDrag } from '@/lib/drag';
import { zoneAtPoint, type Zone2D } from '@/lib/reorder';
import type { DateStr, Item } from '@/lib/types';
import { fractionOf, overallProgress } from '@/lib/progress';
import { planDayTasks, planWeek, unplannedSoon } from '@/lib/views';

const UNPLANNED = 'unplanned';
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type Props = {
  items: Item[];
  today: DateStr;
  /** Sunday of the week being shown. */
  weekStart: DateStr;
  /** Renders a task; `compact` for the narrow day columns. */
  renderRow: (item: Item, compact: boolean) => ReactNode;
  /** Moves one of a task's work days: `from`/`to` are days, or undefined for "not planned". */
  onMove: (id: string, from: DateStr | undefined, to: DateStr | undefined) => void;
  /** Called with true while a drag is in progress, so the page can stop scrolling. */
  onDragging: (dragging: boolean) => void;
};

/**
 * The Plan view: tasks due soon that aren't planned yet, then the week (Sun–Sat): side-by-side columns on a
 * computer, stacked rows (one per day) on a phone.
 * Drag a task onto a day to plan it there, or onto "Due soon" to un-plan it.
 */
export function PlanBoard({ items, today, weekStart, renderRow, onMove, onDragging }: Props) {
  const c = usePalette();
  const columnsLayout = useWindowDimensions().width >= WIDE_BREAKPOINT;
  const soon = unplannedSoon(items, today);
  const week = planWeek(items, today, weekStart);

  // Drop zones (the "due soon" area and each day column) are measured when a drag starts.
  const zoneViews = useRef(new Map<string, View>());
  const zones = useRef<Zone2D[]>([]);
  const [drag, setDrag] = useState<{ id: string; from: string; dx: number; dy: number; over: string | null } | null>(
    null,
  );
  const dragRef = useRef(drag);
  dragRef.current = drag;

  const measure = () => {
    zones.current = [];
    zoneViews.current.forEach((view, key) =>
      view?.measureInWindow((x, y, w, h) =>
        zones.current.push(
          key === UNPLANNED ? { key, top: y, bottom: y + h } : { key, top: y, bottom: y + h, left: x, right: x + w },
        ),
      ),
    );
  };

  const gesture = (id: string, from: string) =>
    rowDrag()
      .onStart(() => {
        measure();
        onDragging(true);
        setDrag({ id, from, dx: 0, dy: 0, over: from });
      })
      .onUpdate((e) =>
        setDrag(
          (d) =>
            d && {
              ...d,
              dx: e.translationX,
              dy: e.translationY,
              over: zoneAtPoint(zones.current, e.absoluteX, e.absoluteY),
            },
        ),
      )
      .onEnd(() => {
        markDragged(); // only runs after a real drag, not a plain click
        const d = dragRef.current;
        const day = (k: string) => (k === UNPLANNED ? undefined : k);
        if (d?.over && d.over !== d.from) onMove(d.id, day(d.from), day(d.over));
      })
      .onFinalize(() => {
        setDrag(null);
        onDragging(false);
      });

  const rows = (list: Item[], from: string, compact: boolean) =>
    list.map((item) => {
      // A multi-day task appears in several columns; only the copy being dragged moves.
      const moving = drag?.id === item.id && drag.from === from;
      return (
        <GestureDetector key={item.id} gesture={gesture(item.id, from)}>
          <View
            style={
              moving && { transform: [{ translateX: drag.dx }, { translateY: drag.dy }], zIndex: 30, opacity: 0.92 }
            }>
            {renderRow(item, compact)}
          </View>
        </GestureDetector>
      );
    });

  const zoneRef = (key: string) => (v: View | null) => {
    if (v) zoneViews.current.set(key, v);
    else zoneViews.current.delete(key);
  };
  // The zone under a dragged task (other than where it came from) is highlighted.
  const highlight = (key: string) =>
    drag && drag.over === key && drag.from !== key && { borderColor: c.accent, backgroundColor: c.accentSoft };

  const columns = week.map(({ date, items: dayItems }) => {
    const isToday = date === today;
    // The day's pie: everything planned for it, finished or not; partly done tasks count for their share.
    const dayPie = overallProgress(planDayTasks(items, date, today).map((i) => fractionOf(i, null, !!i.done, {})));
    return (
      <View
        key={date}
        ref={zoneRef(date)}
        role="group"
        aria-label={`${isToday ? 'Today, ' : ''}${prettyDate(date)}, ${dayItems.length} ${dayItems.length === 1 ? 'task' : 'tasks'}`}
        style={[
          columnsLayout ? styles.column : styles.dayRow,
          { backgroundColor: c.side, borderColor: isToday ? c.accent : 'transparent' },
          highlight(date),
          drag?.from === date && { zIndex: 20 },
        ]}>
        <View
          style={columnsLayout ? styles.dayHead : styles.dayHeadRow}
          role="heading"
          aria-level={2}
          aria-label={prettyDate(date)}>
          <Text style={[styles.dayName, { color: isToday ? c.accent : c.muted }]}>
            {DAY_NAMES[dow(date)].toUpperCase()}
          </Text>
          <Text style={[styles.dayNum, { color: isToday ? c.accent : c.ink }]}>{Number(date.slice(8))}</Text>
          {!columnsLayout && isToday && <Text style={[styles.todayTag, { color: c.accent }]}>TODAY</Text>}
          {dayPie.total > 0 && (
            <View
              style={[styles.dayPie, !columnsLayout && styles.dayPieRow]}
              role="img"
              aria-label={`${dayPie.done} of ${dayPie.total} planned ${dayPie.total === 1 ? 'task' : 'tasks'} done`}>
              <ProgressCircle size={16} fraction={dayPie.fraction} color={c.accent} ring={c.line} />
              <Text style={[styles.dayPieText, { color: c.muted }]} aria-hidden>
                {dayPie.done}/{dayPie.total}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.cards}>{rows(dayItems, date, columnsLayout)}</View>
        <PlanDayAdd date={date} compact={columnsLayout} />
      </View>
    );
  });

  return (
    <>
      {(soon.length > 0 || drag) && (
        <View
          ref={zoneRef(UNPLANNED)}
          style={[styles.unplanned, highlight(UNPLANNED), drag?.from === UNPLANNED && { zIndex: 20 }]}>
          <Text
            style={[styles.group, { color: c.muted }]}
            role="heading"
            aria-level={2}
            aria-label="Due soon, not planned yet">
            DUE SOON · NOT PLANNED YET
          </Text>
          <Text style={[styles.hint, { color: c.muted }]}>
            {soon.length ? 'Drag a task onto a day, or tap 🕒 to pick days.' : 'Drop here to un-plan a task.'}
          </Text>
          {rows(soon, UNPLANNED, false)}
        </View>
      )}
      <View style={columnsLayout ? styles.week : styles.weekRows}>{columns}</View>
    </>
  );
}

const styles = StyleSheet.create({
  unplanned: {
    gap: 6,
    borderWidth: 1.5,
    borderColor: 'transparent',
    borderRadius: 12,
    padding: 4,
    margin: -5,
    marginBottom: 6,
  },
  group: { fontSize: 12, fontWeight: '600', letterSpacing: 0.7, marginTop: 4, marginHorizontal: 4 },
  hint: { fontSize: 12.5, marginHorizontal: 4, marginTop: -2 },
  week: { flexDirection: 'row', gap: 8, alignItems: 'stretch', paddingTop: 8 },
  column: { flex: 1, minWidth: 0, borderWidth: 1.5, borderRadius: 12, padding: 6, gap: 6, minHeight: 260 },
  // Phones: one full-width row per day, stacked.
  weekRows: { gap: 8, paddingTop: 8 },
  dayRow: { borderWidth: 1.5, borderRadius: 12, padding: 8, gap: 6 },
  dayHeadRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, paddingHorizontal: 4, paddingBottom: 2 },
  todayTag: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
  dayHead: { alignItems: 'center', paddingVertical: 4 },
  dayName: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
  dayNum: { fontSize: 20, fontWeight: '700' },
  cards: { gap: 6, flex: 1 },
  dayPie: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  // In phone rows the pie sits at the right end of the day's heading line.
  dayPieRow: { marginTop: 0, marginLeft: 'auto', alignSelf: 'center' },
  dayPieText: { fontSize: 11, fontVariant: ['tabular-nums'] },
});
