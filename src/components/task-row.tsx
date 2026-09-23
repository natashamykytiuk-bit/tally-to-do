import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { usePalette } from '@/constants/tally';
import { prettyDate } from '@/lib/dates';
import { scheduleText, streak } from '@/lib/recurrence';
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
  showMyDay: boolean;
  selected: boolean;
  onPress: () => void;
  onToggle: () => void;
  onStar: () => void;
  onDelete: () => void;
  onRename: (title: string) => void;
  onToggleStep: (stepId: string) => void;
};

export function TaskRow(props: Props) {
  const { row, done, today, completions, progress, list, showMyDay, selected, onPress, onToggle, onStar, onDelete, onRename, onToggleStep } = props;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(props.row.item.title);
  // Escape unmounts the input, which fires onBlur; this stops that blur from saving.
  const cancelled = useRef(false);
  const c = usePalette();
  const { item } = row;
  const disabled = !!item.rule && !row.date;
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
  const steps = item.steps ?? [];
  const sc = stepCount(item, row.date, progress);
  if (list) meta.push({ text: list.name });
  if (steps.length) meta.push({ text: `${sc.done} of ${sc.total}` });
  if (row.late && row.date) meta.push({ text: `Missed ${prettyDate(row.date)}`, warn: true });
  if (item.rule) meta.push({ text: `↻ ${scheduleText(item)}` });
  if (disabled) meta.push({ text: 'Not scheduled today' });
  if (!item.rule && item.due) {
    const overdue = item.due < today && !item.done;
    const when = item.due === today ? 'today' : prettyDate(item.due);
    meta.push({ text: overdue ? `Overdue · ${when}` : `Due ${when}`, warn: overdue });
  }
  if (!item.rule && showMyDay && item.myDay === today) meta.push({ text: '☀ My Day' });

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityHint="Opens task details"
      style={[
        styles.row,
        { backgroundColor: row.late && !done ? c.warnSoft : c.panel, shadowColor: c.ink, borderColor: selected ? c.accent : 'transparent' },
      ]}>
      <Pressable
        onPress={onToggle}
        disabled={disabled}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done, disabled }}
        hitSlop={8}
        style={[
          styles.chk,
          { borderColor: done ? c.accent : c.muted, backgroundColor: done ? c.accent : 'transparent' },
          disabled && { opacity: 0.35 },
        ]}>
        {done && <Text style={styles.tick}>✓</Text>}
      </Pressable>
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
            accessibilityHint="Edit the title"
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
        {steps.length > 0 && !done && (
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
                  accessibilityState={{ checked: on, disabled }}
                  style={[styles.step, disabled && { opacity: 0.5 }]}>
                  <View style={[styles.stepBox, { borderColor: on ? c.accent : c.muted, backgroundColor: on ? c.accent : 'transparent' }]}>
                    {on && <Text style={styles.stepTick}>✓</Text>}
                  </View>
                  <Text style={[styles.stepText, { color: on ? c.muted : c.ink }, on && styles.strike]}>{st.title}</Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>
      {st >= 2 && (
        <Text style={[styles.streak, { backgroundColor: c.flameSoft, color: c.flame }]} accessibilityLabel={`${st}-day streak`}>
          🔥 {st}
        </Text>
      )}
      <Pressable onPress={onStar} hitSlop={8} accessibilityLabel="Important" accessibilityRole="button">
        <Text style={[styles.star, { color: item.important ? c.accent : c.muted }]}>{item.important ? '★' : '☆'}</Text>
      </Pressable>
      <Pressable
        onPress={onDelete}
        hitSlop={8}
        accessibilityLabel={`Delete ${item.title}`}
        accessibilityRole="button"
        style={({ hovered }) => [styles.del, hovered && { backgroundColor: c.warnSoft }]}>
        {({ hovered }) => <Text style={{ fontSize: 18, lineHeight: 20, color: hovered ? c.warn : c.muted }}>×</Text>}
      </Pressable>
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
  chk: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  tick: { color: '#fff', fontSize: 12, fontWeight: '700' },
  body: { flex: 1, minWidth: 0 },
  title: { fontSize: 15 },
  // Only the text itself is the edit target; the rest of the row still opens details.
  titleHit: { alignSelf: 'flex-start' },
  titleInput: { borderBottomWidth: 1, paddingVertical: 0, marginVertical: -1 },
  strike: { textDecorationLine: 'line-through' },
  steps: { marginTop: 6, gap: 4 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start' },
  stepBox: { width: 16, height: 16, borderRadius: 4, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  stepTick: { color: '#fff', fontSize: 10, fontWeight: '700' },
  stepText: { fontSize: 13.5 },
  meta: { fontSize: 12.5, marginTop: 2 },
  streak: { fontSize: 12, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2, overflow: 'hidden', fontVariant: ['tabular-nums'] },
  star: { fontSize: 18 },
  del: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
