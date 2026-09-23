import Ionicons from '@expo/vector-icons/Ionicons';
import { useRef, useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { usePalette } from '@/constants/tally';
import { moveIndex, zoneAt, type Zone } from '@/lib/reorder';

export type ReorderEntry = { key: string; label: string; render: (handle: ReactNode) => ReactNode };

type Props = {
  entries: ReorderEntry[];
  /** New order of keys, top to bottom. */
  onReorder: (keys: string[]) => void;
  onDragging: (dragging: boolean) => void;
};

/** A column of rows that can be reordered by dragging each row's ≡ grip. Rows may have different heights. */
export function ReorderList({ entries, onReorder, onDragging }: Props) {
  const c = usePalette();
  const keys = entries.map((e) => e.key);
  const views = useRef(new Map<string, View>());
  const zones = useRef<Zone[]>([]);
  const [drag, setDrag] = useState<{ key: string; dy: number; over: string } | null>(null);
  const dragRef = useRef(drag);
  dragRef.current = drag;

  const from = drag ? keys.indexOf(drag.key) : -1;
  const to = drag ? Math.max(0, zones.current.findIndex((z) => z.key === drag.over)) : -1;
  const shown = drag && from >= 0 ? moveIndex(keys, from, to) : keys;

  // Where the dragged row's slot has moved to, relative to where it started (rows can differ in height).
  const slotOffset = () => {
    const z = zones.current;
    if (!drag || from < 0 || !z[from] || !z[to]) return 0;
    const h = z[from].bottom - z[from].top;
    return to > from ? z[to].bottom - h - z[from].top : z[to].top - z[from].top;
  };

  const gesture = (key: string) =>
    Gesture.Pan()
      .runOnJS(true)
      .onStart(() => {
        // Measure every row, in the current order, before anything moves.
        const found: Zone[] = [];
        let pending = keys.length;
        keys.forEach((k, i) =>
          views.current.get(k)?.measureInWindow((_x, y, _w, h) => {
            found[i] = { key: k, top: y, bottom: y + h };
            if (--pending === 0) zones.current = found;
          }),
        );
        onDragging(true);
        setDrag({ key, dy: 0, over: key });
      })
      .onUpdate((e) => setDrag((d) => d && { ...d, dy: e.translationY, over: zoneAt(zones.current, e.absoluteY) ?? d.over }))
      .onEnd(() => {
        const d = dragRef.current;
        if (!d) return;
        const a = keys.indexOf(d.key);
        const b = zones.current.findIndex((z) => z.key === d.over);
        if (a >= 0 && b >= 0 && a !== b) onReorder(moveIndex(keys, a, b));
      })
      .onFinalize(() => {
        setDrag(null);
        onDragging(false);
      });

  return (
    <>
      {shown.map((key) => {
        const entry = entries.find((e) => e.key === key)!;
        const dragging = drag?.key === key;
        const handle = (
          <GestureDetector gesture={gesture(key)}>
            <View
              style={[{ paddingRight: 2, marginLeft: -6 }, { cursor: dragging ? 'grabbing' : 'grab' } as object]}
              accessibilityLabel={`Drag to reorder ${entry.label}`}
              hitSlop={8}>
              <Ionicons name="reorder-two" size={18} color={c.muted} />
            </View>
          </GestureDetector>
        );
        return (
          <View
            key={key}
            ref={(v) => {
              if (v) views.current.set(key, v);
              else views.current.delete(key);
            }}
            style={dragging && { transform: [{ translateY: drag.dy - slotOffset() }], zIndex: 20, opacity: 0.92 }}>
            {entry.render(handle)}
          </View>
        );
      })}
    </>
  );
}
