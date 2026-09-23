import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { usePalette } from '@/constants/tally';
import type { DateStr } from '@/lib/types';
import { useData } from '@/providers/data';

/** "+ Add for <day>" box under each day in the Plan view. New tasks have no list. */
export function PlanDayAdd({ date }: { date: DateStr }) {
  const c = usePalette();
  const { addItem } = useData();
  const [draft, setDraft] = useState('');
  const add = () => {
    const title = draft.trim();
    if (!title) return;
    setDraft('');
    addItem({ title, plans: [date] });
  };
  return (
    <View style={[styles.row, { borderColor: c.line }]}>
      <Text style={{ color: c.accent, fontSize: 16 }}>+</Text>
      <TextInput
        accessibilityLabel="Add a task for this day"
        value={draft}
        onChangeText={setDraft}
        onSubmitEditing={add}
        submitBehavior="submit"
        placeholder="Add a task for this day"
        placeholderTextColor={c.muted}
        style={[styles.input, { color: c.ink }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  input: { flex: 1, minWidth: 0, fontSize: 14, paddingVertical: 6 },
});
