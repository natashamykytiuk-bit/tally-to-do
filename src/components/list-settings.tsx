import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ColorField } from '@/components/color-field';
import { usePalette } from '@/constants/tally';
import type { List } from '@/lib/types';
import { useData } from '@/providers/data';

/** Rename a list and choose its colour. */
export function ListSettings({
  list,
  onClose,
  onDelete,
}: {
  list: List | null;
  onClose: () => void;
  onDelete: (list: List) => void;
}) {
  const c = usePalette();
  const { updateList } = useData();
  const [name, setName] = useState(list?.name ?? '');
  useEffect(() => setName(list?.name ?? ''), [list?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveName = () => {
    const n = name.trim();
    if (list && n && n !== list.name) updateList(list.id, { name: n });
    else if (list) setName(list.name);
  };

  return (
    <Modal visible={!!list} transparent animationType="fade" onRequestClose={onClose}>
      {/* Modals render outside the app root, so the colour wheel's gestures need their own root view. */}
      <GestureHandlerRootView style={styles.fill}>
        <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel="Close list settings" />
        {list && (
          <View style={[styles.card, { backgroundColor: c.panel }]}>
            <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
              <Text style={[styles.h, { color: c.ink }]}>List settings</Text>
              <Text style={[styles.label, { color: c.muted }]}>Name</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                onBlur={saveName}
                onSubmitEditing={saveName}
                style={[styles.input, { color: c.ink, borderColor: c.line, backgroundColor: c.bg }]}
              />
              <Text style={[styles.label, { color: c.muted }]}>Colour</Text>
              <ColorField value={list.color} onChange={(color) => updateList(list.id, { color })} />
              <View style={styles.foot}>
                <Pressable
                  onPress={() => {
                    onClose();
                    onDelete(list);
                  }}
                  style={[styles.btn, { backgroundColor: c.warnSoft }]}>
                  <Text style={{ color: c.warn, fontWeight: '600' }}>Delete list</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    saveName();
                    onClose();
                  }}
                  style={[styles.btn, { backgroundColor: c.accent }]}>
                  <Text style={{ color: '#fff', fontWeight: '600' }}>Done</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        )}
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  scrim: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(0,0,0,0.35)' },
  card: { width: '100%', maxWidth: 400, maxHeight: '90%', borderRadius: 14 },
  body: { padding: 18, gap: 10 },
  h: { fontSize: 18, fontWeight: '700' },
  label: { fontSize: 13, marginTop: 4 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 15 },
  foot: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginTop: 6 },
  btn: { borderRadius: 8, paddingHorizontal: 16, paddingVertical: 9 },
});
