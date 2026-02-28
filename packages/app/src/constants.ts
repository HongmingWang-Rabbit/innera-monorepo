/**
 * Raw color values for use in contexts where Tamagui theme tokens aren't
 * available (e.g. Lucide icon `color` props which require plain strings).
 *
 * Values mirror the palette in packages/ui/src/tamagui.config.ts.
 */
export const palette = {
  white: '#ffffff',
  indigo500: '#6366f1',
  pink500: '#ec4899',
  purple500: '#a855f7',
  amber500: '#f59e0b',
  blue500: '#3b82f6',
  green500: '#22c55e',
  gray400: '#9ca3af',
  warmWhite: '#FDFBF7',
  warmBorder: '#EDE8E0',
} as const;
