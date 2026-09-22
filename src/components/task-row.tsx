import { Pressable, StyleSheet, Text, View } from 'react-native';

import { usePalette } from '@/constants/tally';
import { prettyDate } from '@/lib/dates';
import { ruleText, streak } from '@/lib/recurrence';
import type { DateStr, List } from '@/lib/types';
import type { AllCompletions, Row } from '@/lib/views';

type Props = {
  row: Row;
  done: boolean;
  today: DateStr;
  completions: AllCompletions;
  /** Omitted when the view already is this list. */
  list?: List;
  showMyDay: boolean;
  onToggle: () => void;
  onStar: () => void;
};

export function TaskRow({ row, done, today, completions, list, showMyDay, onToggle, onStar }: Props) {
  const c = usePalette();
  const { item } = row;
  const disabled = !!item.rule && !row.date;
  const st = item.rule ? streak(item, today, completions[item.id] ?? {}) : 0;

  const meta: { text: string; warn?: boolean }[] = [];
  if (list) meta.push({ text: list.name });
  if (row.late && row.date) meta.push({ text: `Missed ${prettyDate(row.date)}`, warn: true });
  if (item.rule) meta.push({ text: `↻ ${ruleText(item.rule)}` });
  if (disabled) meta.push({ text: 'Not scheduled today' });
  if (!item.rule && item.due) {
    const overdue = item.due < today && !item.done;
    const when = item.due === today ? 'today' : prettyDate(item.due);
    meta.push({ text: overdue ? `Overdue · ${when}` : `Due ${when}`, warn: overdue });
  }
  if (!item.rule && showMyDay && item.myDay === today) meta.push({ text: '☀ My Day' });

  return (
    <View
      style={[
        styles.row,
        { backgroundColor: row.late && !done ? c.warnSoft : c.panel, shadowColor: c.ink },
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
        <Text style={[styles.title, { color: done ? c.muted : c.ink }, done && styles.strike]}>{item.title}</Text>
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
      </View>
      {st >= 2 && (
        <Text style={[styles.streak, { backgroundColor: c.flameSoft, color: c.flame }]} accessibilityLabel={`${st}-day streak`}>
          🔥 {st}
        </Text>
      )}
      <Pressable onPress={onStar} hitSlop={8} accessibilityLabel="Important" accessibilityRole="button">
        <Text style={[styles.star, { color: item.important ? c.accent : c.muted }]}>{item.important ? '★' : '☆'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 10,
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
  strike: { textDecorationLine: 'line-through' },
  meta: { fontSize: 12.5, marginTop: 2 },
  streak: { fontSize: 12, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2, overflow: 'hidden', fontVariant: ['tabular-nums'] },
  star: { fontSize: 18 },
});
