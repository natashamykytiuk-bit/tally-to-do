import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { usePalette, WIDE_BREAKPOINT } from '@/constants/tally';
import { TOUR } from '@/lib/tour';

type Props = { step: number; onStep: (i: number) => void; onDone: () => void };

/**
 * The intro tour: a card in the corner (bottom sheet on phones). It isn't a modal, so the app
 * stays usable behind it and people can try each thing as it's described.
 */
export function Tour({ step, onStep, onDone }: Props) {
  const c = usePalette();
  const wide = useWindowDimensions().width >= WIDE_BREAKPOINT;
  const s = TOUR[step];
  const last = step === TOUR.length - 1;

  return (
    <View
      role="dialog"
      aria-label={`Tour, step ${step + 1} of ${TOUR.length}: ${s.title}`}
      aria-live="polite"
      style={[
        styles.card,
        wide ? styles.corner : styles.bottom,
        { backgroundColor: c.panel, borderColor: c.line, shadowColor: c.ink },
      ]}>
      <View style={styles.head}>
        <View style={[styles.icon, { backgroundColor: c.accentSoft }]} aria-hidden>
          <Text style={{ fontSize: 18, color: c.accent }}>{s.icon}</Text>
        </View>
        <Text style={[styles.title, { color: c.ink }]} role="heading" aria-level={2}>
          {s.title}
        </Text>
        {!last && (
          <Pressable accessibilityRole="button" onPress={onDone} hitSlop={8} accessibilityLabel="Skip the tour">
            <Text style={{ color: c.muted, fontSize: 13 }}>Skip</Text>
          </Pressable>
        )}
      </View>
      <Text style={[styles.body, { color: c.ink }]}>{s.body}</Text>

      <View style={styles.foot}>
        <View style={styles.dots} role="img" aria-label={`Step ${step + 1} of ${TOUR.length}`}>
          {TOUR.map((_, i) => (
            <View key={i} style={[styles.dot, { backgroundColor: i === step ? c.accent : c.line }]} />
          ))}
        </View>
        <View style={styles.buttons}>
          {step > 0 && (
            <Pressable
              accessibilityRole="button"
              onPress={() => onStep(step - 1)}
              style={[styles.btn, { backgroundColor: c.accentSoft }]}>
              <Text style={{ color: c.accent, fontWeight: '600' }}>Back</Text>
            </Pressable>
          )}
          <Pressable
            accessibilityRole="button"
            onPress={() => (last ? onDone() : onStep(step + 1))}
            style={[styles.btn, { backgroundColor: c.accent }]}>
            <Text style={{ color: '#fff', fontWeight: '600' }}>
              {last ? 'Get started' : step === 0 ? 'Show me' : 'Next'}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    gap: 10,
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
    zIndex: 50,
  },
  corner: { right: 20, bottom: 20, width: 340 },
  bottom: { left: 12, right: 12, bottom: 12 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontSize: 16, fontWeight: '700' },
  body: { fontSize: 14, lineHeight: 20 },
  foot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  dots: { flexDirection: 'row', gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  buttons: { flexDirection: 'row', gap: 8 },
  btn: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
});
