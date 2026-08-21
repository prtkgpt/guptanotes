import type { NoteColor } from './types';

export interface Theme {
  dark: boolean;
  background: string;
  surface: string;
  surfaceBorder: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  accent: string;
  onAccent: string;
  danger: string;
  chipBg: string;
  chipText: string;
  chipActiveBg: string;
  chipActiveText: string;
  searchBg: string;
  divider: string;
}

export const lightTheme: Theme = {
  dark: false,
  background: '#FAF8F5',
  surface: '#FFFFFF',
  surfaceBorder: '#E8E4DE',
  text: '#1C1B1A',
  textSecondary: '#5C574F',
  textTertiary: '#8F8A81',
  accent: '#C2610C',
  onAccent: '#FFFFFF',
  danger: '#C0392B',
  chipBg: '#EFEBE4',
  chipText: '#5C574F',
  chipActiveBg: '#1C1B1A',
  chipActiveText: '#FAF8F5',
  searchBg: '#EFEBE4',
  divider: '#E8E4DE',
};

export const darkTheme: Theme = {
  dark: true,
  background: '#151311',
  surface: '#201E1B',
  surfaceBorder: '#33302B',
  text: '#F2EFEA',
  textSecondary: '#B5AFA5',
  textTertiary: '#7D786F',
  accent: '#F0A24B',
  onAccent: '#1C1200',
  danger: '#E5715F',
  chipBg: '#2A2723',
  chipText: '#B5AFA5',
  chipActiveBg: '#F2EFEA',
  chipActiveText: '#151311',
  searchBg: '#2A2723',
  divider: '#2A2723',
};

/** Google Keep–inspired card tints, tuned per theme. */
const noteColorMap: Record<NoteColor, { light: string; dark: string }> = {
  default: { light: '#FFFFFF', dark: '#201E1B' },
  coral: { light: '#FAE1DD', dark: '#48302B' },
  peach: { light: '#FDE8CD', dark: '#4A3823' },
  sand: { light: '#FBF3C4', dark: '#454120' },
  mint: { light: '#DCEDE0', dark: '#283C2E' },
  sky: { light: '#D9E9F5', dark: '#25384A' },
  lavender: { light: '#E6DFF5', dark: '#37304A' },
  blush: { light: '#F6DFEA', dark: '#452C3A' },
  graphite: { light: '#E9E8E6', dark: '#35322F' },
};

export function noteBackground(color: NoteColor, theme: Theme): string {
  return noteColorMap[color][theme.dark ? 'dark' : 'light'];
}

/** Swatch color shown in the color picker (always the theme-matching tint). */
export function noteSwatch(color: NoteColor, theme: Theme): string {
  return noteBackground(color, theme);
}
