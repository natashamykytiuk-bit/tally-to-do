import { Redirect } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Sidebar } from '@/components/sidebar';
import { TaskRow } from '@/components/task-row';
import { usePalette, WIDE_BREAKPOINT } from '@/constants/tally';
import { prettyDate } from '@/lib/dates';
import { isRowDone, isSmartView, newItemDefaults, plannedGroup, rowsFor, SMART_VIEWS, type Row, type ViewId } from '@/lib/views';
import { useAuth } from '@/providers/auth';
import { DataProvider, useData } from '@/providers/data';

export default function Home() {
  const { user } = useAuth();
  if (!user) return <Redirect href="/sign-in" />;
  return (
    <DataProvider>
      <TallyScreen />
    </DataProvider>
  );
}

function TallyScreen() {
  const c = usePalette();
  const wide = useWindowDimensions().width >= WIDE_BREAKPOINT;
  const data = useData();
  const [view, setView] = useState<ViewId>('myday');
  const [drawer, setDrawer] = useState(false);

  if (!data.ready) {
    return (
      <View style={[styles.fill, styles.center, { backgroundColor: c.bg }]}>
        <ActivityIndicator color={c.accent} />
      </View>
    );
  }

  // A deleted list falls back to My Day.
  const current = isSmartView(view) || data.lists.some((l) => l.id === view) ? view : 'myday';
  const select = (v: ViewId) => {
    setView(v);
    setDrawer(false);
  };

  return (
    <SafeAreaView style={[styles.fill, styles.app, { backgroundColor: c.bg }]} edges={['top', 'bottom']}>
      {wide && (
        <View style={styles.sideWide}>
          <Sidebar view={current} onSelect={select} />
        </View>
      )}
      <MainList view={current} onMenu={wide ? undefined : () => setDrawer(true)} />
      {!wide && (
        <Modal visible={drawer} transparent animationType="fade" onRequestClose={() => setDrawer(false)}>
          <View style={styles.drawerWrap}>
            <SafeAreaView style={[styles.drawer, { backgroundColor: c.side }]} edges={['top', 'bottom', 'left']}>
              <Sidebar view={current} onSelect={select} />
            </SafeAreaView>
            <Pressable style={styles.scrim} onPress={() => setDrawer(false)} accessibilityLabel="Close lists" />
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

function MainList({ view, onMenu }: { view: ViewId; onMenu?: () => void }) {
  const c = usePalette();
  const { lists, items, today, completions, addItem, updateItem, toggle } = useData();
  const [showDone, setShowDone] = useState(true);
  const [draft, setDraft] = useState('');
  const [repeat, setRepeat] = useState(false);
  // Habits always adds habits; Planned only shows dated one-offs, so a habit added there would vanish.
  const canRepeat = view !== 'habits' && view !== 'planned';
  const addsHabit = view === 'habits' || (canRepeat && repeat);

  const list = lists.find((l) => l.id === view);
  const title = SMART_VIEWS.find((s) => s.id === view)?.name ?? list?.name ?? '';
  const subtitle =
    view === 'myday' ? prettyDate(today) : view === 'habits' ? 'Everything that repeats, with current streaks' : '';

  const rows = rowsFor(view, items, today, completions);
  const open = rows.filter((r) => !isRowDone(r, completions));
  const done = rows.filter((r) => isRowDone(r, completions));

  const renderRow = (r: Row) => (
    <TaskRow
      key={`${r.item.id}|${r.date ?? ''}`}
      row={r}
      done={isRowDone(r, completions)}
      today={today}
      completions={completions}
      list={view === r.item.listId ? undefined : lists.find((l) => l.id === r.item.listId)}
      showMyDay={view !== 'myday'}
      onToggle={() => toggle(r.item, r.date)}
      onStar={() => updateItem(r.item.id, { important: !r.item.important })}
    />
  );

  let body: React.ReactNode;
  if (view === 'planned') {
    body = (['Overdue', 'Today', 'Tomorrow', 'Later'] as const).map((g) => {
      const rs = open.filter((r) => r.item.due && plannedGroup(r.item.due, today) === g);
      if (!rs.length) return null;
      return (
        <View key={g} style={styles.gap}>
          <Text style={[styles.group, { color: c.muted }]}>{g.toUpperCase()}</Text>
          {rs.map(renderRow)}
        </View>
      );
    });
  } else body = open.map(renderRow);

  const add = async () => {
    const t = draft.trim();
    if (!t || !lists[0]) return;
    setDraft('');
    await addItem({ ...newItemDefaults(view, today, lists[0].id, addsHabit), title: t } as Parameters<typeof addItem>[0]);
  };

  return (
    <KeyboardAvoidingView style={[styles.fill, styles.main]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.head}>
        {onMenu && (
          <Pressable onPress={onMenu} hitSlop={10} accessibilityLabel="Open lists" style={styles.menu}>
            <Text style={{ color: c.ink, fontSize: 22 }}>☰</Text>
          </Pressable>
        )}
        <View style={styles.fill}>
          <Text style={[styles.h1, { color: list?.color ?? c.ink }]}>{title}</Text>
          {!!subtitle && <Text style={{ color: c.muted, marginTop: 2 }}>{subtitle}</Text>}
        </View>
      </View>

      <ScrollView style={styles.fill} contentContainerStyle={[styles.gap, styles.listPad]} keyboardShouldPersistTaps="handled">
        {body}
        {!open.length && (
          <Text style={[styles.empty, { color: c.muted }]}>
            {view === 'myday' ? 'All clear for today.' : 'Nothing here yet — add a task below.'}
          </Text>
        )}
        {done.length > 0 && (
          <>
            <Pressable onPress={() => setShowDone(!showDone)} accessibilityRole="button">
              <Text style={[styles.group, { color: c.muted }]}>
                {showDone ? '▾' : '▸'} COMPLETED {done.length}
              </Text>
            </Pressable>
            {showDone && done.map(renderRow)}
          </>
        )}
      </ScrollView>

      <View style={[styles.add, { backgroundColor: c.panel, shadowColor: c.ink }]}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={add}
          submitBehavior="submit"
          placeholder={addsHabit ? 'Add a daily habit' : 'Add a task'}
          placeholderTextColor={c.muted}
          style={[styles.addInput, { color: c.ink }]}
        />
        {canRepeat && (
          <Pressable
            onPress={() => setRepeat(!repeat)}
            accessibilityRole="switch"
            accessibilityState={{ checked: repeat }}
            accessibilityLabel="Repeat daily"
            style={[styles.repeat, { backgroundColor: repeat ? c.accent : c.accentSoft }]}>
            <Text style={{ color: repeat ? '#fff' : c.accent, fontWeight: '600', fontSize: 13 }}>↻ Repeat</Text>
          </Pressable>
        )}
        <Pressable onPress={add} style={[styles.btn, { backgroundColor: c.accent }]}>
          <Text style={styles.btnText}>Add</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  app: { flexDirection: 'row' },
  sideWide: { width: 260 },
  drawerWrap: { flex: 1, flexDirection: 'row' },
  drawer: { width: 280 },
  scrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  main: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 12, maxWidth: 900, width: '100%', alignSelf: 'center' },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  menu: { paddingTop: 4 },
  h1: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  gap: { gap: 6 },
  listPad: { paddingTop: 18, paddingBottom: 10 },
  group: { fontSize: 12, fontWeight: '600', letterSpacing: 0.7, marginTop: 12, marginBottom: 2, marginHorizontal: 4 },
  empty: { textAlign: 'center', paddingVertical: 40 },
  add: {
    flexDirection: 'row',
    gap: 8,
    borderRadius: 10,
    paddingVertical: 6,
    paddingRight: 6,
    paddingLeft: 14,
    marginTop: 8,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  addInput: { flex: 1, minWidth: 0, fontSize: 15, paddingVertical: 6 },
  repeat: { borderRadius: 8, paddingHorizontal: 10, justifyContent: 'center' },
  btn: { borderRadius: 8, paddingHorizontal: 14, justifyContent: 'center' },
  btnText: { color: '#fff', fontWeight: '600' },
});
