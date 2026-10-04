import { Platform, useColorScheme } from 'react-native';

export const Colors = {
  light: {
    background: '#F3F5F9',
    surface: '#FFFFFF',
    surfaceAlt: '#EAEEF5',
    text: '#0B1220',
    textSecondary: '#5B6472',
    border: '#D7DDE8',
    primary: '#1D4ED8',
    onPrimary: '#FFFFFF',
    success: '#15803D',
    successBg: '#DCFCE7',
    warning: '#92400E',
    warningBg: '#FEF3C7',
    danger: '#B91C1C',
    dangerBg: '#FEE2E2',
    info: '#1D4ED8',
    infoBg: '#DBEAFE',
    neutral: '#475569',
    neutralBg: '#E2E8F0',
  },
  dark: {
    background: '#0B1220',
    surface: '#151D2E',
    surfaceAlt: '#1D2740',
    text: '#F4F7FB',
    textSecondary: '#9AA7B8',
    border: '#28344C',
    primary: '#7BA2F7',
    onPrimary: '#0B1220',
    success: '#4ADE80',
    successBg: '#10331E',
    warning: '#FBBF24',
    warningBg: '#3A2A0A',
    danger: '#F87171',
    dangerBg: '#3B1215',
    info: '#7BA2F7',
    infoBg: '#132445',
    neutral: '#A8B3C4',
    neutralBg: '#1E2A40',
  },
};

export type ThemeColors = (typeof Colors)['light'];

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const Radius = {
  sm: 8,
  md: 14,
  lg: 20,
  pill: 999,
} as const;

export const Fonts = {
  sans: Platform.select({
    web: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    default: undefined,
  }),
  mono: Platform.select({
    ios: 'ui-monospace',
    android: 'monospace',
    web: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
    default: 'monospace',
  }),
};

export function useTheme(): ThemeColors {
  return useColorScheme() === 'dark' ? Colors.dark : Colors.light;
}
