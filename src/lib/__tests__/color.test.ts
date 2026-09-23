import { normalizeHex } from '../color';

test('normalizeHex', () => {
  expect(normalizeHex('#3354c4')).toBe('#3354C4');
  expect(normalizeHex('3354C4')).toBe('#3354C4');
  expect(normalizeHex(' #abc ')).toBe('#AABBCC');
  expect(normalizeHex('#12345')).toBeNull();
  expect(normalizeHex('zzzzzz')).toBeNull();
  expect(normalizeHex('')).toBeNull();
});
