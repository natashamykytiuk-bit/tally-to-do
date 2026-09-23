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

import { DeleteListDialog } from '@/components/delete-list-dialog';
import { ListMenu, type MenuAnchor } from '@/components/list-menu';
import { ListSettings } from '@/components/list-settings';
import { Settings } from '@/components/settings';
import { Sidebar } from '@/components/sidebar';
import { TaskDetail } from '@/components/task-detail';
import { TaskRow } from '@/components/task-row';
import { usePalette, WIDE_BREAKPOINT } from '@/constants/tally';
import { prettyDate } from '@/lib/dates';
import {
  isRowDone,
  isSmartView,
  newItemDefaults,
  plannedGroup,
  rowsFor,
  SMART_VIEWS,
  type Row,
  type ViewId,
} from '@/lib/views';
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
  const [selId, setSelId] = useState<string | null>(null);
  const [editListId, setEditListId] = useState<string | null>(null);
  const [deleteListId, setDeleteListId] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ listId: string; anchor: MenuAnchor } | null>(null);
  const [settings, setSettings] = useState(false);

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
    setSelId(null);
  };
  const selected = data.items.find((i) => i.id === selId);
  const close = () => setSelId(null);
  const listById = (id: string | null) => data.lists.find((l) => l.id === id) ?? null;
  const openListMenu = (listId: string, anchor: MenuAnchor) => {
    setDrawer(false); // iOS can't show a modal on top of the drawer's modal
    setMenu({ listId, anchor });
  };
  const openSettings = () => {
    setDrawer(false); // iOS can't show a modal on top of the drawer's modal
    setSettings(true);
  };
  const deleting = listById(deleteListId);
  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteListId(null);
    if (current === deleting.id) select('myday');
    await data.deleteList(deleting.id);
  };

  return (
    <SafeAreaView style={[styles.fill, styles.app, { backgroundColor: c.bg }]} edges={['top', 'bottom']}>
      {wide && (
        <View style={styles.sideWide}>
          <Sidebar view={current} onSelect={select} onListMenu={openListMenu} onSettings={openSettings} />
        </View>
      )}
      <MainList
        view={current}
        onMenu={wide ? undefined : () => setDrawer(true)}
        selId={selId}
        onOpen={(id) => setSelId(selId === id ? null : id)}
        onEditList={setEditListId}
      />
      {wide && selected && (
        <View style={[styles.detailWide, { backgroundColor: c.side, borderColor: c.line }]}>
          <TaskDetail item={selected} onClose={close} />
        </View>
      )}
      {!wide && (
        <Modal visible={!!selected} transparent animationType="slide" onRequestClose={close}>
          <Pressable style={styles.scrim} onPress={close} accessibilityLabel="Close details" />
          <SafeAreaView style={[styles.sheet, { backgroundColor: c.side }]} edges={['bottom']}>
            {selected && <TaskDetail item={selected} onClose={close} />}
          </SafeAreaView>
        </Modal>
      )}
      {!wide && (
        <Modal visible={drawer} transparent animationType="fade" onRequestClose={() => setDrawer(false)}>
          <View style={styles.drawerWrap}>
            <SafeAreaView style={[styles.drawer, { backgroundColor: c.side }]} edges={['top', 'bottom', 'left']}>
              <Sidebar view={current} onSelect={select} onListMenu={openListMenu} onSettings={openSettings} />
            </SafeAreaView>
            <Pressable style={styles.scrim} onPress={() => setDrawer(false)} accessibilityLabel="Close lists" />
          </View>
        </Modal>
      )}
      <ListMenu
        anchor={menu?.anchor ?? null}
        onClose={() => setMenu(null)}
        onEdit={() => menu && setEditListId(menu.listId)}
        onDelete={() => menu && setDeleteListId(menu.listId)}
      />
      <ListSettings list={listById(editListId)} onClose={() => setEditListId(null)} onDelete={(l) => setDeleteListId(l.id)} />
      <Settings open={settings} onClose={() => setSettings(false)} />
      <DeleteListDialog
        list={deleting}
        taskCount={deleting ? data.items.filter((i) => i.listId === deleting.id).length : 0}
        onCancel={() => setDeleteListId(null)}
        onConfirm={confirmDelete}
      />
    </SafeAreaView>
  );
}

type MainProps = {
  view: ViewId;
  onMenu?: () => void;
  selId: string | null;
  onOpen: (id: string) => void;
  onEditList: (listId: string) => void;
};

function MainList({ view, onMenu, selId, onOpen, onEditList }: MainProps) {
  const c = usePalette();
  const { lists, items, today, completions, progress, addItem, updateItem, deleteItem, toggle, toggleStep } = useData();
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
      progress={progress}
      list={view === r.item.listId ? undefined : lists.find((l) => l.id === r.item.listId)}
      showMyDay={view !== 'myday'}
      selected={selId === r.item.id}
      onPress={() => onOpen(r.item.id)}
      onToggle={() => toggle(r.item, r.date)}
      onStar={() => updateItem(r.item.id, { important: !r.item.important })}
      onRename={(title) => updateItem(r.item.id, { title })}
      onToggleStep={(stepId) => toggleStep(r.item, stepId, r.date)}
      onDelete={() => {
        if (selId === r.item.id) onOpen(r.item.id); // close its detail panel first
        deleteItem(r.item.id);
      }}
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
    await addItem({
      ...newItemDefaults(view, today, lists[0].id, addsHabit),
      title: t,
    } as Parameters<typeof addItem>[0]);
  };

  return (
    <View style={styles.mainWrap}>
      <KeyboardAvoidingView style={[styles.fill, styles.main]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.head}>
          {onMenu && (
            <Pressable onPress={onMenu} hitSlop={10} accessibilityLabel="Open lists" style={styles.menu}>
              <Text style={{ color: c.ink, fontSize: 22 }}>☰</Text>
            </Pressable>
          )}
          <View style={styles.fill}>
            <View style={styles.titleRow}>
              <Text style={[styles.h1, { color: list?.color ?? c.ink }]}>{title}</Text>
              {list && (
                <Pressable
                  onPress={() => onEditList(list.id)}
                  hitSlop={10}
                  accessibilityLabel="List settings"
                  style={[styles.edit, { backgroundColor: c.accentSoft }]}>
                  <Text style={{ color: c.accent, fontSize: 13, fontWeight: '600' }}>Edit</Text>
                </Pressable>
              )}
            </View>
            {!!subtitle && <Text style={{ color: c.muted, marginTop: 2 }}>{subtitle}</Text>}
          </View>
        </View>

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
              <Text
                style={{
                  color: repeat ? '#fff' : c.accent,
                  fontWeight: '600',
                  fontSize: 13,
                }}>
                ↻ Repeat
              </Text>
            </Pressable>
          )}
          <Pressable onPress={add} style={[styles.btn, { backgroundColor: c.accent }]}>
            <Text style={styles.btnText}>Add</Text>
          </Pressable>
        </View>
        <ScrollView
          style={styles.fill}
          contentContainerStyle={[styles.gap, styles.listPad]}
          keyboardShouldPersistTaps="handled">
          {body}
          {!open.length && (
            <Text style={[styles.empty, { color: c.muted }]}>
              {view === 'myday' ? 'All clear for today.' : 'Nothing here yet — add a task above.'}
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

      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  app: { flexDirection: 'row' },
  sideWide: { width: 260 },
  drawerWrap: { flex: 1, flexDirection: 'row' },
  drawer: { width: 280 },
  detailWide: { width: 340, borderLeftWidth: 1 },
  sheet: {
    maxHeight: '85%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  scrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  // The screen is a row, so centre the column horizontally from a wrapper (alignSelf would centre it vertically).
  mainWrap: { flex: 1, alignItems: 'center' },
  main: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
    maxWidth: 900,
    width: '100%',
  },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  menu: { paddingTop: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  edit: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  h1: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  gap: { gap: 6 },
  listPad: { paddingTop: 12, paddingBottom: 10 },
  group: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.7,
    marginTop: 12,
    marginBottom: 2,
    marginHorizontal: 4,
  },
  empty: { textAlign: 'center', paddingVertical: 40 },
  add: {
    flexDirection: 'row',
    gap: 8,
    borderRadius: 10,
    paddingVertical: 6,
    paddingRight: 6,
    paddingLeft: 14,
    marginTop: 16,
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
