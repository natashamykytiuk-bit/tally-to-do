import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import ColorPicker, { BrightnessSlider, Panel3 } from 'reanimated-color-picker';

import { usePalette } from '@/constants/tally';
import { normalizeHex, PRESET_COLORS } from '@/lib/color';

/** Preset swatches, a hex code box and a colour wheel. Calls onChange with '#RRGGBB'. */
export function ColorField({ value, onChange }: { value: string; onChange: (hex: string) => void }) {
  const c = usePalette();
  const [hex, setHex] = useState(value);
  const [wheel, setWheel] = useState(false);
  useEffect(() => setHex(value), [value]);

  const valid = normalizeHex(hex);
  const commitHex = () => (valid ? valid !== value && onChange(valid) : setHex(value));

  return (
    <View style={styles.wrap}>
      <View style={styles.swatches}>
        {PRESET_COLORS.map((col) => {
          const on = col.toUpperCase() === value.toUpperCase();
          return (
            <Pressable
              key={col}
              onPress={() => onChange(col)}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              accessibilityLabel={`Colour ${col}`}
              style={[styles.swatch, { backgroundColor: col, borderColor: on ? c.ink : 'transparent' }]}>
              {on && <Text style={styles.check}>✓</Text>}
            </Pressable>
          );
        })}
      </View>

      <View style={styles.hexRow}>
        <View style={[styles.preview, { backgroundColor: valid ?? value, borderColor: c.line }]} />
        <TextInput
          value={hex}
          onChangeText={setHex}
          onBlur={commitHex}
          onSubmitEditing={commitHex}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={7}
          accessibilityLabel="Hex colour code"
          style={[styles.hex, { color: c.ink, borderColor: valid ? c.line : c.warn, backgroundColor: c.bg }]}
        />
        <Pressable onPress={() => setWheel(!wheel)} style={[styles.wheelBtn, { backgroundColor: c.accentSoft }]}>
          <Text style={{ color: c.accent, fontWeight: '600', fontSize: 13 }}>{wheel ? 'Hide wheel' : 'Colour wheel'}</Text>
        </Pressable>
      </View>
      {!valid && <Text style={[styles.hint, { color: c.warn }]}>Use a hex code like #3354C4.</Text>}

      {wheel && (
        <ColorPicker
          value={value}
          onCompleteJS={({ hex: h }) => onChange(normalizeHex(h.slice(0, 7)) ?? value)}
          style={styles.picker}>
          <Panel3 style={styles.panel} />
          <BrightnessSlider style={styles.slider} />
        </ColorPicker>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  swatch: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  check: { color: '#fff', fontWeight: '700' },
  hexRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  preview: { width: 32, height: 32, borderRadius: 8, borderWidth: 1 },
  hex: { width: 100, borderWidth: 1, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 7, fontSize: 14 },
  wheelBtn: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  hint: { fontSize: 12 },
  picker: { gap: 12, alignSelf: 'center', width: 240 },
  panel: { width: 240, height: 240 },
  slider: { height: 24, borderRadius: 12 },
});
