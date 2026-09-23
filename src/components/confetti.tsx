import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, StyleSheet, View } from 'react-native';

import { usePalette } from '@/constants/tally';

type Burst = { id: number; x: number; y: number };
type Fire = (x: number, y: number) => void;

const ConfettiContext = createContext<Fire>(() => {});

/** Call with a point in window coordinates (e.g. a checkbox's centre) to celebrate there. */
export const useConfetti = () => useContext(ConfettiContext);

const PIECES = 14;
const DURATION = 800;

/**
 * A see-through layer over the whole screen that plays confetti bursts. Lives above the task list so a burst keeps
 * playing even when the completed task jumps to the Completed section. Skipped when the user prefers reduced motion.
 */
export function ConfettiProvider({ children }: { children: ReactNode }) {
  const [bursts, setBursts] = useState<Burst[]>([]);
  const reduceMotion = useRef(false);
  const nextId = useRef(0);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((v) => (reduceMotion.current = v));
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (v) => (reduceMotion.current = v));
    return () => sub.remove();
  }, []);

  const fire = useCallback<Fire>((x, y) => {
    if (reduceMotion.current) return;
    const id = nextId.current++;
    setBursts((b) => [...b, { id, x, y }]);
    setTimeout(() => setBursts((b) => b.filter((p) => p.id !== id)), DURATION + 100);
  }, []);

  return (
    <ConfettiContext.Provider value={fire}>
      {children}
      <View style={styles.layer} pointerEvents="none" aria-hidden>
        {bursts.map((b) => (
          <BurstView key={b.id} x={b.x} y={b.y} />
        ))}
      </View>
    </ConfettiContext.Provider>
  );
}

function BurstView({ x, y }: { x: number; y: number }) {
  const c = usePalette();
  const t = useRef(new Animated.Value(0)).current;
  // Each piece gets a direction, distance, size, spin and colour when the burst starts.
  const pieces = useRef(
    Array.from({ length: PIECES }, (_, i) => {
      const angle = (i / PIECES) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      const dist = 26 + Math.random() * 30;
      return {
        dx: Math.cos(angle) * dist,
        dy: Math.sin(angle) * dist,
        size: 4 + Math.random() * 4,
        round: Math.random() < 0.4,
        spin: (Math.random() - 0.5) * 720,
        color: [c.accent, c.flame, '#2A9D8F', '#8A4FC7', '#C99A06', '#C43D6B'][i % 6],
      };
    }),
  ).current;

  useEffect(() => {
    Animated.timing(t, {
      toValue: 1,
      duration: DURATION,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [t]);

  return (
    <View style={[styles.origin, { left: x, top: y }]}>
      {pieces.map((p, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            width: p.size,
            height: p.round ? p.size : p.size * 1.8,
            borderRadius: p.round ? p.size / 2 : 1,
            backgroundColor: p.color,
            left: -p.size / 2,
            top: -p.size / 2,
            opacity: t.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 1, 0] }),
            transform: [
              { translateX: t.interpolate({ inputRange: [0, 1], outputRange: [0, p.dx] }) },
              // Fly out, then drift down a little as if falling.
              { translateY: t.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, p.dy, p.dy + 14] }) },
              { rotate: t.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${p.spin}deg`] }) },
              { scale: t.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0.3, 1, 0.8] }) },
            ],
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  layer: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 1000 },
  origin: { position: 'absolute', width: 0, height: 0 },
});
