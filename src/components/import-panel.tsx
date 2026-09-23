import * as DocumentPicker from 'expo-document-picker';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { usePalette } from '@/constants/tally';
import { prettyDate } from '@/lib/dates';
import { newListNames, parseSheet, type ParsedSheet } from '@/lib/import';
import { readSheet } from '@/lib/read-sheet';
import { useData } from '@/providers/data';

const TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel', // .xls
  'text/csv',
  'text/comma-separated-values',
];

type State =
  | { stage: 'pick'; error?: string }
  | { stage: 'reading' }
  | { stage: 'preview'; fileName: string; sheet: ParsedSheet }
  | { stage: 'importing' }
  | { stage: 'done'; tasks: number; lists: number };

/** Settings → Import: pick a spreadsheet, preview the tasks and lists it will create, then import. */
export function ImportPanel({ onBack }: { onBack: () => void }) {
  const c = usePalette();
  const { lists, today, importTasks } = useData();
  const [state, setState] = useState<State>({ stage: 'pick' });

  const pick = async () => {
    const res = await DocumentPicker.getDocumentAsync({ type: TYPES, base64: true, copyToCacheDirectory: true });
    if (res.canceled) return;
    const file = res.assets[0];
    setState({ stage: 'reading' });
    try {
      // Phones give plain base64; the web gives a whole data: URL ("data:…;base64,XXXX").
      const raw = file.base64 ?? '';
      const b64 = raw.startsWith('data:') ? raw.slice(raw.indexOf(',') + 1) : raw;
      if (!b64) throw new Error('empty');
      const sheet = parseSheet(readSheet(b64), today);
      if (!sheet.tasks.length) return setState({ stage: 'pick', error: `No tasks found in ${file.name}.` });
      setState({ stage: 'preview', fileName: file.name, sheet });
    } catch {
      setState({ stage: 'pick', error: `Couldn’t read ${file.name}. Use an .xlsx, .xls or .csv file.` });
    }
  };

  const run = async (sheet: ParsedSheet) => {
    setState({ stage: 'importing' });
    const r = await importTasks(sheet.tasks);
    setState({ stage: 'done', ...r });
  };

  const primary = (label: string, onPress: () => void) => (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.primary, { backgroundColor: c.accent }]}>
      <Text style={{ color: '#fff', fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );

  return (
    <>
      <View style={styles.row}>
        <Pressable accessibilityRole="button" onPress={onBack} hitSlop={10} accessibilityLabel="Back">
          <Text style={{ color: c.accent, fontSize: 18 }}>‹</Text>
        </Pressable>
        <Text style={[styles.h, { color: c.ink }]}>Import from a spreadsheet</Text>
      </View>

      {state.stage === 'pick' && (
        <>
          <Text style={[styles.p, { color: c.ink }]}>
            Add tasks from an Excel (.xlsx, .xls) or CSV file. Tally reads the first sheet and uses its header row to
            find:
          </Text>
          <View style={[styles.box, { backgroundColor: c.bg }]}>
            <Text style={[styles.p, { color: c.ink }]}>
              <Text style={styles.b}>Task</Text> (or Title, Assignment) · required
            </Text>
            <Text style={[styles.p, { color: c.ink }]}>
              <Text style={styles.b}>Due</Text> (or Date, Deadline)
            </Text>
            <Text style={[styles.p, { color: c.ink }]}>
              <Text style={styles.b}>Class</Text> (or List, Course, Subject): tasks are sorted into these lists, which
              are created if needed
            </Text>
            <Text style={[styles.p, { color: c.ink }]}>
              <Text style={styles.b}>Notes</Text> (or Description)
            </Text>
          </View>
          <Text style={[styles.small, { color: c.muted }]}>You’ll see a preview before anything is added.</Text>
          {state.error && <Text style={{ color: c.warn }}>{state.error}</Text>}
          {primary('Choose a file…', pick)}
        </>
      )}

      {(state.stage === 'reading' || state.stage === 'importing') && (
        <View style={styles.center}>
          <ActivityIndicator color={c.accent} />
          <Text style={{ color: c.muted }}>
            {state.stage === 'reading' ? 'Reading the file…' : 'Adding your tasks…'}
          </Text>
        </View>
      )}

      {state.stage === 'preview' && (
        <Preview
          fileName={state.fileName}
          sheet={state.sheet}
          newLists={newListNames(state.sheet.tasks, lists)}
          onCancel={() => setState({ stage: 'pick' })}
          onImport={() => run(state.sheet)}
        />
      )}

      {state.stage === 'done' && (
        <>
          <Text style={[styles.p, { color: c.ink }]}>
            Added {state.tasks} {state.tasks === 1 ? 'task' : 'tasks'}
            {state.lists ? ` and ${state.lists} new ${state.lists === 1 ? 'list' : 'lists'}` : ''}.
          </Text>
          {primary('Done', onBack)}
        </>
      )}
    </>
  );
}

function Preview(props: {
  fileName: string;
  sheet: ParsedSheet;
  newLists: string[];
  onCancel: () => void;
  onImport: () => void;
}) {
  const c = usePalette();
  const { sheet, newLists } = props;
  const n = sheet.tasks.length;
  const unlisted = sheet.tasks.filter((t) => !t.list).length;
  const dated = sheet.tasks.filter((t) => t.due).length;
  const cols = Object.entries(sheet.columns)
    .map(([f, h]) => `${h} → ${f === 'title' ? 'task' : f === 'list' ? 'list' : f}`)
    .join(', ');

  return (
    <>
      <Text style={[styles.p, { color: c.ink }]}>
        <Text style={styles.b}>{props.fileName}</Text>: {n} {n === 1 ? 'task' : 'tasks'}
        {dated ? `, ${dated} with due dates` : ''}.
      </Text>
      <Text style={[styles.small, { color: c.muted }]}>Columns used: {cols}.</Text>
      {newLists.length > 0 && <Text style={[styles.p, { color: c.ink }]}>New lists: {newLists.join(', ')}.</Text>}
      {unlisted > 0 && (
        <Text style={[styles.small, { color: c.muted }]}>
          {unlisted} {unlisted === 1 ? 'task has' : 'tasks have'} no class, so {unlisted === 1 ? 'it goes' : 'they go'}{' '}
          under Tasks.
        </Text>
      )}
      {sheet.skipped > 0 && (
        <Text style={[styles.small, { color: c.muted }]}>
          {sheet.skipped} {sheet.skipped === 1 ? 'row has' : 'rows have'} no task name and will be skipped.
        </Text>
      )}

      <View style={[styles.box, { backgroundColor: c.bg }]}>
        {sheet.tasks.slice(0, 6).map((t, i) => (
          <View key={i} style={styles.previewRow}>
            <Text style={[styles.p, { color: c.ink, flex: 1 }]} numberOfLines={1}>
              {t.title}
            </Text>
            <Text style={[styles.small, { color: c.muted }]} numberOfLines={1}>
              {[t.list, t.due && prettyDate(t.due)].filter(Boolean).join(' · ')}
            </Text>
          </View>
        ))}
        {n > 6 && <Text style={[styles.small, { color: c.muted }]}>…and {n - 6} more</Text>}
      </View>

      <View style={[styles.row, { justifyContent: 'flex-end' }]}>
        <Pressable
          accessibilityRole="button"
          onPress={props.onCancel}
          style={[styles.btn, { backgroundColor: c.accentSoft }]}>
          <Text style={{ color: c.accent, fontWeight: '600' }}>Cancel</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={props.onImport}
          style={[styles.btn, { backgroundColor: c.accent }]}>
          <Text style={{ color: '#fff', fontWeight: '600' }}>
            Import {n} {n === 1 ? 'task' : 'tasks'}
          </Text>
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  h: { fontSize: 18, fontWeight: '700' },
  p: { fontSize: 14, lineHeight: 20 },
  b: { fontWeight: '700' },
  small: { fontSize: 12.5 },
  box: { borderRadius: 10, padding: 12, gap: 4 },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  center: { alignItems: 'center', gap: 8, paddingVertical: 20 },
  primary: { borderRadius: 8, paddingVertical: 11, alignItems: 'center' },
  btn: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 9 },
});
