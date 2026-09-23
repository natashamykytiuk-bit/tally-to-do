import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import type { MenuAnchor } from '@/components/list-menu';
import { usePalette } from '@/constants/tally';
import { SMART_VIEWS, openCount, type ViewId } from '@/lib/views';
import { useData } from '@/providers/data';

type Props = {
  view: ViewId;
  onSelect: (v: ViewId) => void;
  /** Right-click (web) or long-press (phone) on a list. */
  onListMenu: (listId: string, anchor: MenuAnchor) => void;
  onSettings: () => void;
};

export function Sidebar({ view, onSelect, onListMenu, onSettings }: Props) {
  const c = usePalette();
  const { lists, items, today, completions, addList } = useData();
  const [name, setName] = useState('');

  const nav = (id: ViewId, icon: React.ReactNode, label: string, isList = false) => {
    const on = view === id;
    const n = openCount(id, items, today, completions);
    return (
      <Pressable
        key={id}
        onPress={() => onSelect(id)}
        onLongPress={isList ? (e) => onListMenu(id, { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY }) : undefined}
        // react-native-web passes onContextMenu through to the DOM; it isn't in RN's types.
        {...(isList && {
          onContextMenu: (e: { preventDefault: () => void; clientX: number; clientY: number }) => {
            e.preventDefault();
            onListMenu(id, { x: e.clientX, y: e.clientY });
          },
        })}
        accessibilityRole="button"
        accessibilityState={{ selected: on }}
        style={({ hovered }) => [
          styles.nav,
          on && { backgroundColor: c.panel, shadowColor: c.ink, ...styles.navOn },
          hovered && !on && { backgroundColor: c.line },
        ]}>
        <View style={styles.ico}>{icon}</View>
        <Text style={[styles.label, { color: c.ink }, on && { fontWeight: '600' }]} numberOfLines={1}>
          {label}
        </Text>
        {n > 0 && <Text style={[styles.count, { color: c.muted }]}>{n}</Text>}
      </Pressable>
    );
  };

  const submit = async () => {
    const v = name.trim();
    if (!v) return;
    setName('');
    onSelect(await addList(v));
  };

  return (
    <View style={[styles.side, { backgroundColor: c.side }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.brand, { color: c.ink }]}>
          Tally<Text style={{ color: c.accent }}>.</Text>
        </Text>
        {SMART_VIEWS.map((s) => nav(s.id, <Text style={{ color: c.accent }}>{s.icon}</Text>, s.name))}
        <View style={[styles.sep, { backgroundColor: c.line }]} />
        {lists.map((l) => nav(l.id, <View style={[styles.dot, { backgroundColor: l.color }]} />, l.name, true))}
      </ScrollView>
      <View style={styles.newList}>
        <TextInput
          value={name}
          onChangeText={setName}
          onSubmitEditing={submit}
          placeholder="New list or class"
          placeholderTextColor={c.muted}
          style={[styles.input, { borderColor: c.line, backgroundColor: c.panel, color: c.ink }]}
        />
        <Pressable onPress={submit} style={[styles.plus, { backgroundColor: c.accentSoft }]} accessibilityLabel="Add list">
          <Text style={{ color: c.accent, fontWeight: '700' }}>+</Text>
        </Pressable>
      </View>
      <Pressable
        onPress={onSettings}
        accessibilityRole="button"
        style={({ hovered }) => [styles.nav, styles.settings, hovered && { backgroundColor: c.line }]}>
        <View style={styles.ico}>
          <Text style={{ color: c.muted }}>⚙</Text>
        </View>
        <Text style={[styles.label, { color: c.ink }]}>Settings</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  side: { flex: 1, paddingHorizontal: 12, paddingTop: 18, paddingBottom: 12 },
  scroll: { gap: 2 },
  brand: { fontSize: 18, fontWeight: '700', paddingHorizontal: 10, paddingBottom: 14 },
  nav: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8 },
  navOn: { shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  ico: { width: 20, alignItems: 'center' },
  label: { flex: 1, fontSize: 15 },
  count: { fontSize: 12, fontVariant: ['tabular-nums'] },
  dot: { width: 10, height: 10, borderRadius: 5 },
  sep: { height: 1, marginVertical: 10, marginHorizontal: 6 },
  newList: { flexDirection: 'row', gap: 6, paddingTop: 8 },
  input: { flex: 1, minWidth: 0, borderWidth: 1, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 7, fontSize: 14 },
  plus: { borderRadius: 8, paddingHorizontal: 14, justifyContent: 'center' },
  settings: { marginTop: 8 },
});
