import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { usePalette } from '@/constants/tally';

type Option<T extends string> = { value: T; label: string };

/** Compact select: shows the current option; tapping opens the choices just below it. */
export function Dropdown<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: Option<T>[];
  onChange: (v: T) => void;
  label: string;
}) {
  const c = usePalette();
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={() => setOpen(!open)}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${current?.label}`}
        accessibilityState={{ expanded: open }}
        style={[styles.button, { borderColor: open ? c.accent : c.line, backgroundColor: c.bg }]}>
        <Text style={{ color: c.ink, fontSize: 14 }}>{current?.label}</Text>
        <Text style={{ color: c.muted, fontSize: 11 }}>{open ? '▲' : '▼'}</Text>
      </Pressable>
      {open && (
        <View
          style={[styles.menu, { backgroundColor: c.panel, borderColor: c.line, shadowColor: c.ink }]}
          accessibilityRole="menu">
          {options.map((o) => {
            const on = o.value === value;
            return (
              <Pressable
                key={o.value}
                onPress={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                accessibilityRole="menuitem"
                accessibilityState={{ selected: on }}
                style={({ hovered }) => [styles.item, (on || hovered) && { backgroundColor: c.accentSoft }]}>
                <Text style={{ color: on ? c.accent : c.ink, fontWeight: on ? '600' : '400', fontSize: 14 }}>
                  {o.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'flex-start' },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 110,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  menu: {
    marginTop: 4,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 4,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  item: { paddingHorizontal: 12, paddingVertical: 8 },
});
