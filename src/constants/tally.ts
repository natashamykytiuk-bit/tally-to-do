import { useColorScheme } from 'react-native';

const light = {
  bg: '#F3F5F9',
  side: '#E8ECF3',
  panel: '#FFFFFF',
  ink: '#1B2233',
  muted: '#667089',
  line: '#D9DEE8',
  accent: '#3354C4',
  accentSoft: '#E3E9FB',
  flame: '#D9682A',
  flameSoft: '#FBEBDF',
  warn: '#B4492F',
  warnSoft: '#F9E4DE',
};

const dark: typeof light = {
  bg: '#141821',
  side: '#1B202B',
  panel: '#202634',
  ink: '#E6E9F0',
  muted: '#9099AE',
  line: '#2E3544',
  accent: '#7D98F0',
  accentSoft: '#26304A',
  flame: '#F0955C',
  flameSoft: '#3A2A21',
  warn: '#EC8A72',
  warnSoft: '#3B2420',
};

export type Palette = typeof light;

export const usePalette = (): Palette => (useColorScheme() === 'dark' ? dark : light);

/** Sidebar is permanent at or above this width, a drawer below it. */
export const WIDE_BREAKPOINT = 860;
