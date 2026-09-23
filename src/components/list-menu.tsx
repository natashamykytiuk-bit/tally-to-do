import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { usePalette } from '@/constants/tally';

export type MenuAnchor = { x: number; y: number };

/** Small right-click / long-press menu for a list in the sidebar. */
export function ListMenu({
  anchor,
  onClose,
  onEdit,
  onDelete,
}: {
  anchor: MenuAnchor | null;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const c = usePalette();
  const item = (label: string, color: string, action: () => void) => (
    <Pressable
      onPress={() => {
        onClose();
        action();
      }}
      accessibilityRole="menuitem"
      style={({ hovered }) => [styles.item, hovered && { backgroundColor: c.accentSoft }]}>
      <Text style={{ color, fontSize: 14 }}>{label}</Text>
    </Pressable>
  );
  return (
    <Modal visible={!!anchor} transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={styles.fill} onPress={onClose} accessibilityLabel="Close menu" />
      {anchor && (
        <View
          accessibilityRole="menu"
          style={[styles.menu, { left: anchor.x, top: anchor.y, backgroundColor: c.panel, borderColor: c.line, shadowColor: c.ink }]}>
          {item('Edit list…', c.ink, onEdit)}
          {item('Delete list…', c.warn, onDelete)}
        </View>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  menu: {
    position: 'absolute',
    minWidth: 160,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 4,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  item: { paddingHorizontal: 12, paddingVertical: 8 },
});
