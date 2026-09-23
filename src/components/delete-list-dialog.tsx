import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { usePalette } from '@/constants/tally';
import type { List } from '@/lib/types';

/** Confirmation before deleting a list and every task in it. */
export function DeleteListDialog({
  list,
  taskCount,
  onCancel,
  onConfirm,
}: {
  list: List | null;
  taskCount: number;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const c = usePalette();
  return (
    <Modal visible={!!list} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.center}>
        <Pressable accessibilityRole="button" style={styles.scrim} onPress={onCancel} accessibilityLabel="Cancel" />
        {list && (
          <View style={[styles.card, { backgroundColor: c.panel }]} role="alertdialog" aria-modal aria-label={`Delete ${list.name}?`}>
            <Text style={[styles.h, { color: c.ink }]}>Delete “{list.name}”?</Text>
            <Text style={{ color: c.muted, fontSize: 14 }}>
              {taskCount === 0
                ? 'This list is empty.'
                : `Its ${taskCount} ${taskCount === 1 ? 'task' : 'tasks'} will be deleted too, including streak history.`}{' '}
              This can’t be undone.
            </Text>
            <View style={styles.buttons}>
              <Pressable
                accessibilityRole="button"
                onPress={onCancel}
                style={[styles.btn, { backgroundColor: c.accentSoft }]}>
                <Text style={{ color: c.accent, fontWeight: '600' }}>Cancel</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={onConfirm}
                style={[styles.btn, { backgroundColor: c.warn }]}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>Delete list</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // Absolute fill, not flex: 1 - react-native-web's Modal doesn't stretch its children.
  center: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  scrim: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(0,0,0,0.35)' },
  card: { width: '100%', maxWidth: 380, borderRadius: 14, padding: 18, gap: 10 },
  h: { fontSize: 18, fontWeight: '700' },
  buttons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 6 },
  btn: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 9 },
});
