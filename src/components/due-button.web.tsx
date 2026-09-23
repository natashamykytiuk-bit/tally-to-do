import Ionicons from '@expo/vector-icons/Ionicons';
import { useRef } from 'react';

import { usePalette } from '@/constants/tally';
import type { DateStr } from '@/lib/types';

type Props = { value?: DateStr; onChange: (d: DateStr | undefined) => void };

/** Calendar icon that opens the browser's date picker. Clearing the date in the picker removes it. */
export function DueButton({ value, onChange }: Props) {
  const c = usePalette();
  const input = useRef<HTMLInputElement>(null);

  return (
    <span style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        type="button"
        aria-label={value ? 'Change due date' : 'Set due date'}
        title={value ? 'Change due date' : 'Set due date'}
        // Keep presses from reaching the row, which would open the task's details.
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          const el = input.current;
          if (!el) return;
          try {
            el.showPicker();
          } catch {
            el.focus(); // browsers without showPicker()
          }
        }}
        style={{ background: 'none', border: 0, padding: 2, cursor: 'pointer', display: 'flex' }}>
        <Ionicons name={value ? 'calendar' : 'calendar-outline'} size={18} color={value ? c.accent : c.muted} />
      </button>
      {/* Invisible input under the icon: it anchors the browser's picker. */}
      <input
        ref={input}
        type="date"
        tabIndex={-1}
        aria-hidden
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || undefined)}
        onClick={(e) => e.stopPropagation()}
        style={{ position: 'absolute', inset: 0, opacity: 0, pointerEvents: 'none', width: '100%', height: '100%', colorScheme: 'light dark' }}
      />
    </span>
  );
}
