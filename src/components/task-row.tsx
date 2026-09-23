import { useRef, useState } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type GestureResponderEvent,
} from 'react-native';

import Ionicons from '@expo/vector-icons/Ionicons';

import { DueButton, PlanButton } from '@/components/due-button';
import { useConfetti } from '@/components/confetti';
import { ProgressCircle } from '@/components/progress-circle';
import { ProgressMenu, type PointAnchor } from '@/components/progress-menu';
import { usePalette } from '@/constants/tally';
import { justDragged } from '@/lib/drag';
import { prettyDate } from '@/lib/dates';
import { scheduleText, streak } from '@/lib/recurrence';
import { planLabel, plansOf } from '@/lib/plan';
import { fractionOf, isDoneForToday } from '@/lib/progress';
import { isStepDone, stepCount, type AllProgress } from '@/lib/steps';
import type { DateStr, List } from '@/lib/types';
import type { AllCompletions, Row } from '@/lib/views';

type Props = {
  row: Row;
  done: boolean;
  today: DateStr;
  completions: AllCompletions;
  progress: AllProgress;
  /** Omitted when the view already is this list. */
  list?: List;
  selected: boolean;
  onPress: () => void;
  onToggle: () => void;
  onMyDay: () => void;
  onDue: (due: DateStr | undefined) => void;
  onPlan: (days: DateStr[]) => void;
  onRename: (title: string) => void;
  /** Manual partial progress (1–99), or undefined to clear. */
  onProgress: (pct: number | undefined) => void;
  onToggleStep: (stepId: string) => void;
  /** Narrow card for the Plan week columns: circle, title and due date only. */
  compact?: boolean;
};

export function TaskRow(props: Props) {
  const {
    compact,
    row,
    done,
    today,
    completions,
    progress,
    list,
    selected,
    onPress,
    onToggle,
    onMyDay,
    onDue,
    onPlan,
    onRename,
    onProgress,
    onToggleStep,
  } = props;
  const [menu, setMenu] = useState<PointAnchor | null>(null);
  const openMenu = (x: number, y: number) => setMenu({ x, y });

  // Completing a task: the circle pops and confetti bursts out of it. Unchecking stays quiet.
  const confetti = useConfetti();
  const circleRef = useRef<View>(null);
  const pop = useRef(new Animated.Value(1)).current;
  const complete = (e?: GestureResponderEvent) => {
    if (!props.done) {
      // Burst from where the click/tap landed. Measuring the circle afterwards would be too late: the task
      // immediately moves to the Completed section. Keyboard presses have no position, so measure then.
      const { pageX, pageY } = e?.nativeEvent ?? {};
      if (pageX || pageY) confetti(pageX!, pageY!);
      else circleRef.current?.measureInWindow((x, y, w, h) => confetti(x + w / 2, y + h / 2));
      pop.setValue(0.7);
      Animated.spring(pop, { toValue: 1, friction: 3, tension: 180, useNativeDriver: Platform.OS !== 'web' }).start();
    }
    onToggle();
  };
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(props.row.item.title);
  // Escape unmounts the input, which fires onBlur; this stops that blur from saving.
  const cancelled = useRef(false);
  const c = usePalette();
  const { item } = row;
  const disabled = !!item.rule && !row.date;
  const fraction = fractionOf(item, row.date, done, progress);
  const restingToday = isDoneForToday(item, today);
  const st = item.rule ? streak(item, today, completions[item.id] ?? {}) : 0;

  const save = () => {
    if (cancelled.current) return;
    const t = draft.trim();
    setEditing(false);
    if (t && t !== item.title) onRename(t);
  };
  const cancel = () => {
    cancelled.current = true;
    setDraft(item.title);
    setEditing(false);
  };

  const meta: { text: string; warn?: boolean }[] = [];
  const inMyDay = item.myDay === today;
  const steps = item.steps ?? [];
  const sc = stepCount(item, row.date, progress);
  if (restingToday) meta.push({ text: 'Done for today' });
  if (!done && fraction > 0 && fraction < 1) meta.push({ text: `${Math.round(fraction * 100)}%` });
  if (list) meta.push({ text: list.name });
  if (steps.length) meta.push({ text: `${sc.done} of ${sc.total}` });
  if (row.late && row.date) meta.push({ text: `Missed ${prettyDate(row.date)}`, warn: true });
  if (item.rule) meta.push({ text: `↻ ${scheduleText(item)}` });
  if (disabled) meta.push({ text: 'Not scheduled today' });
  const plan = item.rule ? null : planLabel(item, today);
  if (plan) meta.push(plan);
  if (compact) meta.splice(0, meta.length);
  if (!item.rule && item.due) {
    const overdue = item.due < today && !item.done;
    const when = item.due === today ? 'today' : prettyDate(item.due);
    meta.push({ text: overdue ? `Overdue · ${when}` : `Due ${when}`, warn: overdue });
  }

  return (
    <Pressable
      onPress={() => !justDragged() && onPress()}
      accessibilityRole="button"
      accessibilityLabel={[
        item.title,
        done ? 'done' : '',
        ...meta.map((m) => m.text),
        st >= 2 ? `${st}-day streak` : '',
      ]
        .filter(Boolean)
        .join(', ')}
      accessibilityHint="Opens task details. Drag to move it."
      accessibilityState={{ selected }}
      style={[
        styles.row,
        compact && styles.compact,
        {
          backgroundColor: row.late && !done ? c.warnSoft : c.panel,
          shadowColor: c.ink,
          borderColor: selected ? c.accent : 'transparent',
        },
      ]}>
      <Pressable
        ref={circleRef}
        onPress={complete}
        disabled={disabled}
        // Right-click (web) or long-press (phone) on a one-off task's circle: mark it partly done.
        onLongPress={item.rule ? undefined : (e) => openMenu(e.nativeEvent.pageX, e.nativeEvent.pageY)}
        {...(!item.rule && {
          onContextMenu: (e: { preventDefault: () => void; clientX: number; clientY: number }) => {
            e.preventDefault();
            openMenu(e.clientX, e.clientY);
          },
        })}
        accessibilityRole="checkbox"
        accessibilityLabel={`Done: ${item.title}`}
        accessibilityHint={item.rule ? undefined : 'Right-click or long-press to mark it partly done'}
        accessibilityState={{ checked: done ? true : fraction > 0 ? 'mixed' : false, disabled }}
        accessibilityValue={fraction > 0 && fraction < 1 ? { text: `${Math.round(fraction * 100)}% done` } : undefined}
        hitSlop={8}
        style={[styles.chk, disabled && { opacity: 0.35 }]}>
        <Animated.View style={{ transform: [{ scale: pop }] }}>
          <ProgressCircle size={22} fraction={fraction} color={c.accent} ring={c.muted} />
        </Animated.View>
      </Pressable>
      <ProgressMenu anchor={menu} current={item.progress} onPick={onProgress} onClose={() => setMenu(null)} />
      <View style={styles.body}>
        {editing ? (
          <TextInput
            autoFocus
            value={draft}
            onChangeText={setDraft}
            onBlur={save}
            onSubmitEditing={save}
            onKeyPress={(e) => e.nativeEvent.key === 'Escape' && cancel()}
            selectTextOnFocus
            accessibilityLabel="Task title"
            style={[styles.title, styles.titleInput, { color: c.ink, borderColor: c.accent }]}
          />
        ) : (
          <Pressable
            onPress={() => {
              cancelled.current = false;
              setDraft(item.title);
              setEditing(true);
            }}
            accessibilityRole="button"
            accessibilityLabel={`Rename ${item.title}`}
            style={styles.titleHit}>
            <Text style={[styles.title, { color: done ? c.muted : c.ink }, done && styles.strike]}>{item.title}</Text>
          </Pressable>
        )}
        {meta.length > 0 && (
          <Text style={[styles.meta, { color: c.muted }]}>
            {meta.map((m, i) => (
              <Text key={i}>
                {i > 0 && '  ·  '}
                <Text style={m.warn && { color: c.warn, fontWeight: '600' }}>{m.text}</Text>
              </Text>
            ))}
          </Text>
        )}
        {steps.length > 0 && !done && !compact && (
          <View style={styles.steps}>
            {steps.map((st) => {
              const on = isStepDone(item, st, row.date, progress);
              return (
                <Pressable
                  key={st.id}
                  onPress={() => onToggleStep(st.id)}
                  disabled={disabled}
                  hitSlop={4}
                  accessibilityRole="checkbox"
                  accessibilityLabel={`Step: ${st.title}`}
                  accessibilityState={{ checked: on, disabled }}
                  style={[styles.step, disabled && { opacity: 0.5 }]}>
                  <View
                    style={[
                      styles.stepBox,
                      { borderColor: on ? c.accent : c.muted, backgroundColor: on ? c.accent : 'transparent' },
                    ]}>
                    {on && <Text style={styles.stepTick}>✓</Text>}
                  </View>
                  <Text style={[styles.stepText, { color: on ? c.muted : c.ink }, on && styles.strike]}>
                    {st.title}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>
      {st >= 2 && !compact && (
        <Text
          style={[styles.streak, { backgroundColor: c.flameSoft, color: c.flame }]}
          accessibilityLabel={`${st}-day streak`}>
          🔥 {st}
        </Text>
      )}
      {!item.rule && !compact && (
        <>
          <PlanButton days={plansOf(item)} onChange={onPlan} task={item.title} />
          <DueButton value={item.due} onChange={onDue} task={item.title} />
          <Pressable
            onPress={onMyDay}
            hitSlop={8}
            accessibilityRole="switch"
            accessibilityState={{ checked: inMyDay }}
            accessibilityLabel={`In My Day: ${item.title}`}>
            <Ionicons name={inMyDay ? 'sunny' : 'sunny-outline'} size={19} color={inMyDay ? c.flame : c.muted} />
          </Pressable>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 11,
    paddingHorizontal: 14,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  chk: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, minWidth: 0 },
  // Long words (e.g. "PrairieLearn") break instead of spilling out of narrow cards; web-only style.
  title: { fontSize: 15, overflowWrap: 'anywhere' } as object,
  compact: { gap: 8, paddingVertical: 8, paddingHorizontal: 8, alignItems: 'flex-start' },
  // Only the text itself is the edit target; the rest of the row still opens details.
  titleHit: { alignSelf: 'flex-start', maxWidth: '100%' },
  titleInput: { borderBottomWidth: 1, paddingVertical: 0, marginVertical: -1 },
  strike: { textDecorationLine: 'line-through' },
  steps: { marginTop: 6, gap: 4 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start' },
  stepBox: { width: 16, height: 16, borderRadius: 4, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  stepTick: { color: '#fff', fontSize: 10, fontWeight: '700' },
  stepText: { fontSize: 13.5, flexShrink: 1, overflowWrap: 'anywhere' } as object,
  meta: { fontSize: 12.5, marginTop: 2, overflowWrap: 'anywhere' } as object,
  streak: {
    fontSize: 12,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
    overflow: 'hidden',
    fontVariant: ['tabular-nums'],
  },
});
