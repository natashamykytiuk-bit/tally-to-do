import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, Text } from 'react-native';

import { usePalette } from '@/constants/tally';
import { parseLocal, prettyDate, toLocalDateString } from '@/lib/dates';
import type { DateStr } from '@/lib/types';

type Props = { value?: DateStr; onChange: (d: DateStr) => void; placeholder: string };

/** Native date field: a button that opens the platform picker. See date-field.web.tsx for web. */
export function DateField({ value, onChange, placeholder }: Props) {
  const c = usePalette();
  const [open, setOpen] = useState(false);
  const date = value ? parseLocal(value) : new Date();

  // iOS renders the compact picker inline; Android opens a dialog on demand.
  if (Platform.OS === 'ios') {
    return (
      <DateTimePicker
        value={date}
        mode="date"
        display="compact"
        onChange={(_, d) => d && onChange(toLocalDateString(d))}
        style={{ alignSelf: 'flex-start' }}
      />
    );
  }
  return (
    <>
      <Pressable onPress={() => setOpen(true)} style={{ borderWidth: 1, borderColor: c.line, borderRadius: 8, padding: 9, backgroundColor: c.bg }}>
        <Text style={{ color: value ? c.ink : c.muted }}>{value ? prettyDate(value) : placeholder}</Text>
      </Pressable>
      {open && (
        <DateTimePicker
          value={date}
          mode="date"
          onChange={(e, d) => {
            setOpen(false);
            if (e.type === 'set' && d) onChange(toLocalDateString(d));
          }}
        />
      )}
    </>
  );
}
