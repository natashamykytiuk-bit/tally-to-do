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
