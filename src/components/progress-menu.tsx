import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';

import { usePalette } from '@/constants/tally';
import { parsePercent, PROGRESS_PRESETS } from '@/lib/progress';

export type PointAnchor = { x: number; y: number };

type Props = {
  anchor: PointAnchor | null;
  current?: number;
  onPick: (pct: number | undefined) => void;
  onClose: () => void;
};

const WIDTH = 190;

/** Right-click / long-press menu on a task's circle: 25%, 50%, 75%, a custom percent, or clear. */
export function ProgressMenu({ anchor, current, onPick, onClose }: Props) {
  const c = usePalette();
  const win = useWindowDimensions();
  const [custom, setCustom] = useState<string | null>(null);
  useEffect(() => {
    if (anchor) setCustom(null);
  }, [anchor]);

  const pick = (pct: number | undefined) => {
    onClose();
    onPick(pct);
  };
  const customPct = custom === null ? null : parsePercent(custom);
  const left = anchor ? Math.max(8, Math.min(anchor.x, win.width - WIDTH - 8)) : 0;
  const top = anchor ? Math.max(8, Math.min(anchor.y + 4, win.height - 250)) : 0;

  const item = (label: string, on: boolean, action: () => void) => (
    <Pressable
      key={label}
      onPress={action}
      accessibilityRole="menuitem"
      style={({ hovered }) => [styles.item, (hovered || on) && { backgroundColor: c.accentSoft }]}>
      <Text style={{ color: on ? c.accent : c.ink, fontWeight: on ? '600' : '400', fontSize: 14 }}>{label}</Text>
    </Pressable>
  );

  return (
    <Modal visible={!!anchor} transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      {/* Rendered inside a task row: keep presses here from reaching the row. */}
      <View
        style={styles.layer}
        onStartShouldSetResponder={() => true}
        {...{ onClick: (e: { stopPropagation: () => void }) => e.stopPropagation() }}>
        <Pressable accessibilityRole="button" style={styles.layer} onPress={onClose} accessibilityLabel="Close menu" />
        {anchor && (
          <View
            accessibilityRole="menu"
            style={[styles.menu, { left, top, backgroundColor: c.panel, borderColor: c.line, shadowColor: c.ink }]}>
            <Text style={[styles.title, { color: c.muted }]}>Mark as partly done</Text>
            {PROGRESS_PRESETS.map((p) => item(`${p}%`, current === p, () => pick(p)))}
            {custom === null ? (
              item(
                current && !PROGRESS_PRESETS.includes(current) ? `Custom (${current}%)…` : 'Custom…',
                !!current && !PROGRESS_PRESETS.includes(current),
                () => setCustom(current ? String(current) : ''),
              )
            ) : (
              <View style={styles.customRow}>
                <TextInput
                  autoFocus
                  value={custom}
                  onChangeText={setCustom}
                  onSubmitEditing={() => customPct && pick(customPct)}
                  keyboardType="number-pad"
                  placeholder="1–99"
                  placeholderTextColor={c.muted}
                  accessibilityLabel="Custom percent"
                  style={[
                    styles.input,
                    { color: c.ink, borderColor: custom && !customPct ? c.warn : c.line, backgroundColor: c.bg },
                  ]}
                />
                <Text style={{ color: c.muted }}>%</Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => customPct && pick(customPct)}
                  disabled={!customPct}
                  style={[styles.set, { backgroundColor: c.accent }, !customPct && { opacity: 0.4 }]}>
                  <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>Set</Text>
                </Pressable>
              </View>
            )}
            {current ? item('Clear', false, () => pick(undefined)) : null}
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  layer: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  menu: {
    position: 'absolute',
    width: WIDTH,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 6,
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  title: { fontSize: 12, paddingHorizontal: 12, paddingBottom: 4 },
  item: { paddingHorizontal: 12, paddingVertical: 8 },
  customRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6 },
  input: { width: 56, borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 5, fontSize: 14 },
  set: { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6 },
});
