import { usePalette } from '@/constants/tally';
import type { DateStr } from '@/lib/types';

type Props = { value?: DateStr; onChange: (d: DateStr) => void; placeholder: string };

/** Web date field: the browser's own <input type="date">, which already speaks 'YYYY-MM-DD'. */
export function DateField({ value, onChange, placeholder }: Props) {
  const c = usePalette();
  return (
    <input
      type="date"
      aria-label={placeholder}
      value={value ?? ''}
      onChange={(e) => e.target.value && onChange(e.target.value)}
      style={{
        border: `1px solid ${c.line}`,
        borderRadius: 8,
        padding: '7px 9px',
        background: c.bg,
        color: c.ink,
        // Same stack react-native-web gives <Text>; 'inherit' would fall back to the browser's serif.
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        fontSize: 14,
        colorScheme: 'light dark',
      }}
    />
  );
}
