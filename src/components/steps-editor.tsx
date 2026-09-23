import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { usePalette } from '@/constants/tally';
import { occursOn } from '@/lib/recurrence';
import { isStepDone } from '@/lib/steps';
import type { Item } from '@/lib/types';
import { useData } from '@/providers/data';

/** Checklist for a task. Recurring tasks tick steps for today's occurrence. */
export function StepsEditor({ item }: { item: Item }) {
  const c = usePalette();
  const { today, progress, addStep, renameStep, removeStep, toggleStep } = useData();
  const [draft, setDraft] = useState('');
  const steps = item.steps ?? [];
  const date = item.rule ? (occursOn(item, today) ? today : null) : null;
  const canTick = !item.rule || !!date;

  const add = () => {
    const t = draft.trim();
    if (!t) return;
    setDraft('');
    addStep(item, t);
  };

  return (
    <>
      <Text style={[styles.label, { color: c.muted }]}>Steps</Text>
      {steps.map((st) => {
        const on = isStepDone(item, st, date, progress);
        return (
          <View key={st.id} style={styles.row}>
            <Pressable
              onPress={() => toggleStep(item, st.id, date)}
              disabled={!canTick}
              hitSlop={6}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on, disabled: !canTick }}
              style={[
                styles.box,
                { borderColor: on ? c.accent : c.muted, backgroundColor: on ? c.accent : 'transparent' },
                !canTick && { opacity: 0.4 },
              ]}>
              {on && <Text style={styles.tick}>✓</Text>}
            </Pressable>
            <StepTitle
              title={st.title}
              done={on}
              onSave={(t) => (t ? renameStep(item, st.id, t) : removeStep(item, st.id))}
            />
            <Pressable
              accessibilityRole="button"
              onPress={() => removeStep(item, st.id)}
              hitSlop={8}
              accessibilityLabel={`Remove step ${st.title}`}>
              <Text style={{ color: c.muted, fontSize: 16 }}>×</Text>
            </Pressable>
          </View>
        );
      })}
      <View style={styles.row}>
        <Text style={{ color: c.accent, fontSize: 16, width: 18, textAlign: 'center' }}>+</Text>
        <TextInput
          accessibilityLabel={steps.length ? 'Next step' : 'Add a step'}
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={add}
          submitBehavior="submit"
          placeholder={steps.length ? 'Next step' : 'Add a step'}
          placeholderTextColor={c.muted}
          style={[styles.input, { color: c.ink }]}
        />
      </View>
      {item.rule && steps.length > 0 && (
        <Text style={[styles.hint, { color: c.muted }]}>
          {date ? 'Steps reset for each occurrence.' : 'Not scheduled today, so steps can’t be ticked here.'} Ticking
          the last step checks off the task.
        </Text>
      )}
    </>
  );
}

function StepTitle({ title, done, onSave }: { title: string; done: boolean; onSave: (t: string) => void }) {
  const c = usePalette();
  const [v, setV] = useState(title);
  const save = () => v.trim() !== title && onSave(v.trim());
  return (
    <TextInput
      value={v}
      onChangeText={setV}
      onBlur={save}
      onSubmitEditing={save}
      style={[styles.input, { color: done ? c.muted : c.ink }, done && { textDecorationLine: 'line-through' }]}
    />
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  box: { width: 18, height: 18, borderRadius: 5, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  tick: { color: '#fff', fontSize: 11, fontWeight: '700' },
  input: { flex: 1, minWidth: 0, fontSize: 14, paddingVertical: 4 },
  hint: { fontSize: 12 },
});
