/** Preset list colours: the original six first, then a few more. */
export const PRESET_COLORS = [
  '#3354C4', '#2A9D8F', '#D9682A', '#8A4FC7', '#C43D6B', '#5E8C2F',
  '#0E7FA8', '#C99A06', '#B4492F', '#4B5563', '#1B7A5A', '#D0558A',
];

/** Normalises '#abc', 'abc', '#AABBCC' or 'aabbcc' to '#AABBCC'; null if it isn't a hex colour. */
export function normalizeHex(input: string): string | null {
  const v = input.trim().replace(/^#/, '');
  if (/^[0-9a-f]{3}$/i.test(v)) return '#' + [...v].map((ch) => ch + ch).join('').toUpperCase();
  if (/^[0-9a-f]{6}$/i.test(v)) return '#' + v.toUpperCase();
  return null;
}

/** Blends `tint` into `base` (both hex) by `amount` (0–1); returns `base` if either isn't a hex colour. */
export function mixHex(base: string, tint: string, amount: number): string {
  const a = normalizeHex(base);
  const b = normalizeHex(tint);
  if (!a || !b) return base;
  const ch = (h: string, i: number) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16);
  return (
    '#' +
    [0, 1, 2]
      .map((i) => Math.round(ch(a, i) + (ch(b, i) - ch(a, i)) * amount).toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
  );
}
