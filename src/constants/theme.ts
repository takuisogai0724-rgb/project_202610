/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://unistyl.es/), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

/** 標高計UIカード・ボタン共通のセマンティックカラーパレット */
export const ElevationPalette = {
  primary: '#208AEF',
  primarySoftBg: 'rgba(32, 138, 239, 0.14)',
  primarySubtleBg: 'rgba(32, 138, 239, 0.08)',
  primaryTrackBg: 'rgba(32, 138, 239, 0.18)',
  primaryBarFill: 'rgba(32, 138, 239, 0.65)',
  accentTeal: '#12A594',
  warningAmber: '#D97706',
  warningSoftBg: 'rgba(245, 166, 35, 0.16)',
  dangerRed: '#E5484D',
  dangerSoftBg: 'rgba(229, 72, 77, 0.15)',
  divider: 'rgba(128, 128, 128, 0.25)',
  neutralTrackBg: 'rgba(128, 128, 128, 0.12)',
  white: '#FFFFFF',
} as const;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
