import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { usePalette } from '@/constants/tally';
import { parseLocal, toLocalDateString } from '@/lib/dates';
import type { DateStr } from '@/lib/types';

type Props = { value?: DateStr; onChange: (d: DateStr | undefined) => void };

/** Calendar icon that opens a date picker for the task's due date. See due-button.web.tsx for web. */
export function DueButton({ value, onChange }: Props) {
  const c = usePalette();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(new Date());
  const show = () => {
    setDraft(value ? parseLocal(value) : new Date());
    setOpen(true);
  };

  return (
    <>
      <Pressable onPress={show} hitSlop={8} accessibilityRole="button" accessibilityLabel={value ? 'Change due date' : 'Set due date'}>
        <Ionicons name={value ? 'calendar' : 'calendar-outline'} size={18} color={value ? c.accent : c.muted} />
      </Pressable>

      {/* Android: the system dialog. */}
      {open && Platform.OS === 'android' && (
        <DateTimePicker
          value={draft}
          mode="date"
          onChange={(e, d) => {
            setOpen(false);
            if (e.type === 'set' && d) onChange(toLocalDateString(d));
          }}
        />
      )}

      {/* iOS: an inline calendar in a small sheet, with Remove / Done. */}
      {Platform.OS === 'ios' && (
        <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
          <View style={styles.center}>
            <Pressable style={styles.scrim} onPress={() => setOpen(false)} accessibilityLabel="Cancel" />
            <View style={[styles.card, { backgroundColor: c.panel }]}>
              <DateTimePicker value={draft} mode="date" display="inline" onChange={(_, d) => d && setDraft(d)} />
              <View style={styles.row}>
                {value ? (
                  <Pressable
                    onPress={() => {
                      setOpen(false);
                      onChange(undefined);
                    }}>
                    <Text style={{ color: c.warn }}>Remove</Text>
                  </Pressable>
                ) : (
                  <View />
                )}
                <Pressable
                  onPress={() => {
                    setOpen(false);
                    onChange(toLocalDateString(draft));
                  }}>
                  <Text style={{ color: c.accent, fontWeight: '600' }}>Done</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  scrim: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(0,0,0,0.35)' },
  card: { width: '100%', maxWidth: 360, borderRadius: 14, padding: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 8, paddingTop: 8 },
});
