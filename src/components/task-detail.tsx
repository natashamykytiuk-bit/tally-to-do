import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { DateField } from '@/components/date-field';
import { RepeatEditor } from '@/components/repeat-editor';
import { StepsEditor } from '@/components/steps-editor';
import { usePalette } from '@/constants/tally';
import { addDaysStr, dow, prettyDate } from '@/lib/dates';
import type { Item } from '@/lib/types';
import { useData } from '@/providers/data';

/** Edit panel for one task. Rendered as a side panel (wide) or bottom sheet (phone) by the screen. */
export function TaskDetail({ item, onClose }: { item: Item; onClose: () => void }) {
  const c = usePalette();
  const { lists, today, completions, updateItem, deleteItem } = useData();
  const [title, setTitle] = useState(item.title);
  const [notes, setNotes] = useState(item.notes ?? '');
  useEffect(() => {
    setTitle(item.title);
    setNotes(item.notes ?? '');
  }, [item.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (patch: Partial<Item>) => updateItem(item.id, patch);
  const saveTitle = () => {
    const t = title.trim();
    if (t && t !== item.title) set({ title: t });
    else setTitle(item.title);
  };
  const saveNotes = () => notes !== (item.notes ?? '') && set({ notes: notes || undefined });

  // Next Monday, or a week out if today is Monday.
  const nextWeek = addDaysStr(today, ((8 - dow(today)) % 7) || 7);
  const quick: [string, string][] = [
    ['Today', today],
    ['Tomorrow', addDaysStr(today, 1)],
    ['Next week', nextWeek],
  ];

  const card = [styles.card, { backgroundColor: c.panel, shadowColor: c.ink }];
  const label = [styles.label, { color: c.muted }];
  const chip = (on: boolean) => [styles.chip, { borderColor: on ? c.accent : c.line, backgroundColor: on ? c.accent : c.bg }];
  const chipText = (on: boolean) => ({ color: on ? '#fff' : c.ink, fontSize: 13 });

  return (
    <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
      <View style={styles.top}>
        <TextInput
          value={title}
          onChangeText={setTitle}
          onBlur={saveTitle}
          onSubmitEditing={saveTitle}
          style={[styles.title, { color: c.ink }]}
          accessibilityLabel="Task title"
        />
      </View>

      <View style={card}>
        <StepsEditor item={item} />
      </View>

      <View style={card}>
        <Text style={label}>List</Text>
        <View style={styles.chips}>
          {lists.map((l) => (
            <Pressable key={l.id} onPress={() => set({ listId: l.id })} style={chip(l.id === item.listId)}>
              <View style={[styles.dot, { backgroundColor: l.id === item.listId ? '#fff' : l.color }]} />
              <Text style={chipText(l.id === item.listId)}>{l.name}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {!item.rule && (
        <View style={card}>
          <View style={styles.row}>
            <Text style={{ color: c.ink, fontSize: 15 }}>☀ Add to My Day</Text>
            <Switch
              value={item.myDay === today}
              onValueChange={(on) => set({ myDay: on ? today : undefined })}
              trackColor={{ true: c.accent }}
            />
          </View>
          <Text style={[styles.hint, { color: c.muted }]}>Shows in My Day today only; tomorrow you start fresh.</Text>

          <Text style={[label, { marginTop: 6 }]}>Due date</Text>
          <View style={styles.chips}>
            {quick.map(([name, d]) => (
              <Pressable key={name} onPress={() => set({ due: d })} style={chip(item.due === d)}>
                <Text style={chipText(item.due === d)}>{name}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.row}>
            <DateField value={item.due} onChange={(d) => set({ due: d })} placeholder="Pick a date" />
            {item.due && (
              <Pressable onPress={() => set({ due: undefined })} hitSlop={8}>
                <Text style={{ color: c.warn }}>Remove</Text>
              </Pressable>
            )}
          </View>
          {item.due && (
            <Text style={[styles.hint, { color: c.muted }]}>
              Due {item.due === today ? 'today' : prettyDate(item.due)}. Shows in Planned, and in My Day once it’s due.
            </Text>
          )}
        </View>
      )}

      <View style={card}>
        <RepeatEditor item={item} today={today} completions={completions} set={set} />
      </View>

      <View style={card}>
        <Text style={label}>Notes</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          onBlur={saveNotes}
          multiline
          placeholder="Add notes"
          placeholderTextColor={c.muted}
          style={[styles.notes, { color: c.ink, borderColor: c.line, backgroundColor: c.bg }]}
        />
      </View>

      <View style={styles.foot}>
        <Pressable onPress={onClose} style={[styles.btn, { backgroundColor: c.accentSoft }]}>
          <Text style={{ color: c.accent, fontWeight: '600' }}>Close</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            onClose();
            deleteItem(item.id);
          }}
          style={[styles.btn, { backgroundColor: c.warnSoft }]}>
          <Text style={{ color: c.warn, fontWeight: '600' }}>Delete</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 18, gap: 14 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { flex: 1, minWidth: 0, fontSize: 18, fontWeight: '600', paddingVertical: 4 },
  card: {
    borderRadius: 10,
    padding: 12,
    gap: 8,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  label: { fontSize: 13 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  hint: { fontSize: 12 },
  notes: { borderWidth: 1, borderRadius: 8, padding: 9, minHeight: 80, textAlignVertical: 'top', fontSize: 14 },
  foot: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  btn: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
});
