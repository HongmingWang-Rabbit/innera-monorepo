import { createFont, createTamagui, createTokens } from '@tamagui/core';

// ---------------------------------------------------------------------------
// Tokens
// ---------------------------------------------------------------------------

const sizeSpaceTokens = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  11: 44,
  12: 48,
  13: 52,
  14: 56,
  15: 60,
  16: 64,
  17: 68,
  18: 72,
  19: 76,
  20: 80,
} as const;

// Size and space share the same scale
const sizeTokens = sizeSpaceTokens;
const spaceTokens = sizeSpaceTokens;

const radiusTokens = {
  1: 2,
  2: 4,
  3: 6,
  4: 8,
  5: 10,
  6: 12,
  7: 14,
  8: 16,
  9: 20,
  10: 24,
  11: 28,
  12: 32,
} as const;

const zIndexTokens = {
  1: 100,
  2: 200,
  3: 300,
  4: 400,
  5: 500,
} as const;

// Palette — a flat set of raw color values used in themes below.
const palette = {
  // Neutrals
  white: '#ffffff',
  black: '#000000',
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray800: '#1f2937',
  gray900: '#111827',
  gray950: '#030712',

  // Brand — indigo
  indigo50: '#eef2ff',
  indigo100: '#e0e7ff',
  indigo200: '#c7d2fe',
  indigo300: '#a5b4fc',
  indigo400: '#818cf8',
  indigo500: '#6366f1',
  indigo600: '#4f46e5',
  indigo700: '#4338ca',
  indigo800: '#3730a3',
  indigo900: '#312e81',

  // Danger — red
  red50: '#fef2f2',
  red100: '#fee2e2',
  red200: '#fecaca',
  red400: '#f87171',
  red500: '#ef4444',
  red600: '#dc2626',
  red700: '#b91c1c',

  // Success — emerald
  emerald50: '#ecfdf5',
  emerald500: '#10b981',
  emerald600: '#059669',

  // Warning — amber
  amber50: '#fffbeb',
  amber500: '#f59e0b',

  // Blue shades
  blue50: '#eff6ff',
  blue100: '#dbeafe',
  blue200: '#bfdbfe',
  blue300: '#93c5fd',
  blue400: '#60a5fa',
  blue500: '#3b82f6',
  blue600: '#2563eb',
  blue700: '#1d4ed8',
  blue800: '#1e40af',
  blue900: '#1e3a8a',

  // Green shades
  green50: '#f0fdf4',
  green100: '#dcfce7',
  green200: '#bbf7d0',
  green300: '#86efac',
  green400: '#4ade80',
  green500: '#22c55e',
  green600: '#16a34a',
  green700: '#15803d',
  green800: '#166534',
  green900: '#14532d',

  // Yellow shades
  yellow50: '#fefce8',
  yellow100: '#fef9c3',
  yellow200: '#fef08a',
  yellow300: '#fde047',
  yellow400: '#facc15',
  yellow500: '#eab308',
  yellow600: '#ca8a04',
  yellow700: '#a16207',
  yellow800: '#854d0e',
  yellow900: '#713f12',

  // Purple shades
  purple50: '#faf5ff',
  purple100: '#f3e8ff',
  purple200: '#e9d5ff',
  purple300: '#d8b4fe',
  purple400: '#c084fc',
  purple500: '#a855f7',
  purple600: '#9333ea',
  purple700: '#7e22ce',
  purple800: '#6b21a8',
  purple900: '#581c87',

  // Pink shades
  pink50: '#fdf2f8',
  pink100: '#fce7f3',
  pink200: '#fbcfe8',
  pink300: '#f9a8d4',
  pink400: '#f472b6',
  pink500: '#ec4899',
  pink600: '#db2777',
  pink700: '#be185d',
  pink800: '#9d174d',
  pink900: '#831843',

  // Warm neutrals
  warmWhite: '#FDFBF7',
  warmGray50: '#FAF8F5',
  warmGray100: '#F5F2ED',
  warmHeader: '#FFF8F0',
  warmBorder: '#EDE8E0',

  // Transparent
  transparent: 'rgba(0,0,0,0)',
} as const;

const colorTokens = {
  ...palette,
};

const tokens = createTokens({
  size: sizeTokens,
  space: spaceTokens,
  radius: radiusTokens,
  zIndex: zIndexTokens,
  color: colorTokens,
});

// ---------------------------------------------------------------------------
// Fonts
// ---------------------------------------------------------------------------

const headingFont = createFont({
  family:
    '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  size: {
    1: 11,
    2: 12,
    3: 13,
    4: 14,
    5: 16,
    6: 18,
    7: 20,
    8: 24,
    9: 28,
    10: 32,
    11: 40,
    12: 48,
    13: 56,
    14: 64,
    15: 72,
    16: 80,
  },
  lineHeight: {
    1: 16,
    2: 17,
    3: 18,
    4: 20,
    5: 22,
    6: 26,
    7: 28,
    8: 32,
    9: 36,
    10: 40,
    11: 48,
    12: 56,
    13: 64,
    14: 72,
    15: 80,
    16: 88,
  },
  weight: {
    1: '300',
    2: '400',
    3: '500',
    4: '600',
    5: '700',
    6: '800',
    7: '900',
  },
  letterSpacing: {
    1: -0.5,
    2: -0.25,
    3: 0,
    4: 0.1,
    5: 0.25,
  },
  face: {
    300: { normal: 'Inter_300Light' },
    400: { normal: 'Inter_400Regular' },
    500: { normal: 'Inter_500Medium' },
    600: { normal: 'Inter_600SemiBold' },
    700: { normal: 'Inter_700Bold' },
    800: { normal: 'Inter_800ExtraBold' },
    900: { normal: 'Inter_900Black' },
  },
});

const bodyFont = createFont({
  family:
    '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  size: {
    1: 11,
    2: 12,
    3: 13,
    4: 14,
    5: 15,
    6: 16,
    7: 18,
    8: 20,
    9: 22,
    10: 24,
    11: 28,
    12: 32,
    13: 36,
    14: 40,
    15: 48,
    16: 56,
  },
  lineHeight: {
    1: 16,
    2: 17,
    3: 18,
    4: 20,
    5: 22,
    6: 24,
    7: 26,
    8: 28,
    9: 32,
    10: 36,
    11: 40,
    12: 44,
    13: 48,
    14: 52,
    15: 56,
    16: 64,
  },
  weight: {
    1: '300',
    2: '400',
    3: '500',
    4: '600',
    5: '700',
  },
  letterSpacing: {
    1: -0.25,
    2: 0,
    3: 0.1,
    4: 0.25,
    5: 0.5,
  },
  face: {
    300: { normal: 'Inter_300Light' },
    400: { normal: 'Inter_400Regular' },
    500: { normal: 'Inter_500Medium' },
    600: { normal: 'Inter_600SemiBold' },
    700: { normal: 'Inter_700Bold' },
  },
});

// ---------------------------------------------------------------------------
// Themes
// ---------------------------------------------------------------------------

const lightTheme = {
  background: palette.warmWhite,
  backgroundHover: palette.warmGray50,
  backgroundPress: palette.warmGray100,
  backgroundFocus: palette.warmGray50,
  backgroundStrong: palette.gray100,
  backgroundTransparent: palette.transparent,

  color: palette.gray900,
  colorHover: palette.gray700,
  colorPress: palette.gray600,
  colorFocus: palette.gray900,
  colorTransparent: palette.transparent,

  borderColor: palette.gray200,
  borderColorHover: palette.gray300,
  borderColorFocus: palette.indigo500,
  borderColorPress: palette.gray400,

  placeholderColor: palette.gray400,

  shadowColor: palette.gray900,
  shadowColorHover: palette.gray900,

  // Brand
  primary: palette.indigo500,
  primaryHover: palette.indigo600,
  primaryPress: palette.indigo700,
  primaryColor: palette.white,

  // Secondary
  secondary: palette.gray100,
  secondaryHover: palette.gray200,
  secondaryPress: palette.gray300,
  secondaryColor: palette.gray900,

  // Danger
  danger: palette.red500,
  dangerHover: palette.red600,
  dangerPress: palette.red700,
  dangerColor: palette.white,

  // Semantic
  success: palette.emerald500,
  warning: palette.amber500,
  error: palette.red500,

  // Surface levels
  surface1: palette.warmWhite,
  surface2: palette.warmGray50,
  surface3: palette.warmGray100,
  surface4: palette.gray200,

  // Muted text
  colorSubtle: palette.gray600,

  // Semantic — info
  info: palette.blue500,

  // Warm header
  headerWarm: palette.warmHeader,

  // Blue shade tokens
  blue1: palette.blue50,
  blue3: palette.blue100,
  blue6: palette.blue400,
  blue8: palette.blue600,
  blue10: palette.blue800,

  // Green shade tokens
  green3: palette.green100,
  green10: palette.green800,

  // Yellow shade tokens
  yellow3: palette.yellow100,
  yellow10: palette.yellow800,

  // Purple shade tokens
  purple3: palette.purple100,
  purple10: palette.purple800,

  // Pink shade tokens
  pink3: palette.pink100,
  pink10: palette.pink800,

  // Red shade tokens
  red3: palette.red100,
  red10: palette.red700,
};

const darkTheme = {
  background: palette.gray950,
  backgroundHover: palette.gray900,
  backgroundPress: palette.gray800,
  backgroundFocus: palette.gray900,
  backgroundStrong: palette.gray800,
  backgroundTransparent: palette.transparent,

  color: palette.gray50,
  colorHover: palette.gray200,
  colorPress: palette.gray300,
  colorFocus: palette.gray50,
  colorTransparent: palette.transparent,

  borderColor: palette.gray700,
  borderColorHover: palette.gray600,
  borderColorFocus: palette.indigo400,
  borderColorPress: palette.gray500,

  placeholderColor: palette.gray500,

  shadowColor: palette.black,
  shadowColorHover: palette.black,

  // Brand
  primary: palette.indigo400,
  primaryHover: palette.indigo300,
  primaryPress: palette.indigo200,
  primaryColor: palette.gray950,

  // Secondary
  secondary: palette.gray800,
  secondaryHover: palette.gray700,
  secondaryPress: palette.gray600,
  secondaryColor: palette.gray50,

  // Danger
  danger: palette.red400,
  dangerHover: palette.red500,
  dangerPress: palette.red600,
  dangerColor: palette.white,

  // Semantic
  success: palette.emerald500,
  warning: palette.amber500,
  error: palette.red400,

  // Surface levels
  surface1: palette.gray950,
  surface2: palette.gray900,
  surface3: palette.gray800,
  surface4: palette.gray700,

  // Muted text
  colorSubtle: palette.gray400,

  // Semantic — info
  info: palette.blue400,

  // Warm header
  headerWarm: palette.gray900,

  // Blue shade tokens
  blue1: palette.blue900,
  blue3: palette.blue800,
  blue6: palette.blue500,
  blue8: palette.blue400,
  blue10: palette.blue300,

  // Green shade tokens
  green3: palette.green800,
  green10: palette.green300,

  // Yellow shade tokens
  yellow3: palette.yellow800,
  yellow10: palette.yellow300,

  // Purple shade tokens
  purple3: palette.purple800,
  purple10: palette.purple300,

  // Pink shade tokens
  pink3: palette.pink800,
  pink10: palette.pink300,

  // Red shade tokens
  red3: palette.red700,
  red10: palette.red200,
};

// ---------------------------------------------------------------------------
// Media queries
// ---------------------------------------------------------------------------

const media = {
  xs: { maxWidth: 479 },
  sm: { maxWidth: 767 },
  md: { maxWidth: 1023 },
  lg: { maxWidth: 1279 },
  xl: { maxWidth: 1535 },
  gtXs: { minWidth: 480 },
  gtSm: { minWidth: 768 },
  gtMd: { minWidth: 1024 },
  gtLg: { minWidth: 1280 },
  short: { maxHeight: 820 },
  tall: { minHeight: 820 },
  hoverNone: { hover: 'none' },
  pointerCoarse: { pointer: 'coarse' },
} as const;

// ---------------------------------------------------------------------------
// Shorthands
// ---------------------------------------------------------------------------

const shorthands = {
  // Margin
  m: 'margin',
  mt: 'marginTop',
  mr: 'marginRight',
  mb: 'marginBottom',
  ml: 'marginLeft',
  mx: 'marginHorizontal',
  my: 'marginVertical',

  // Padding
  p: 'padding',
  pt: 'paddingTop',
  pr: 'paddingRight',
  pb: 'paddingBottom',
  pl: 'paddingLeft',
  px: 'paddingHorizontal',
  py: 'paddingVertical',

  // Border radius
  br: 'borderRadius',
  brtl: 'borderTopLeftRadius',
  brtr: 'borderTopRightRadius',
  brbl: 'borderBottomLeftRadius',
  brbr: 'borderBottomRightRadius',

  // Dimensions
  w: 'width',
  h: 'height',
  minW: 'minWidth',
  minH: 'minHeight',
  maxW: 'maxWidth',
  maxH: 'maxHeight',

  // Flex
  f: 'flex',
  fd: 'flexDirection',
  fw: 'flexWrap',
  ai: 'alignItems',
  ac: 'alignContent',
  jc: 'justifyContent',
  as: 'alignSelf',
  fg: 'flexGrow',
  fs: 'flexShrink',
  fb: 'flexBasis',

  // Position
  pos: 'position',
  t: 'top',
  r: 'right',
  b: 'bottom',
  l: 'left',

  // Border
  bw: 'borderWidth',
  bc: 'borderColor',
  bs: 'borderStyle',

  // Background
  bg: 'backgroundColor',

  // Overflow
  ov: 'overflow',

  // Opacity
  op: 'opacity',

  // Gap
  g: 'gap',
  gx: 'columnGap',
  gy: 'rowGap',
} as const;

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const monoFont = createFont({
  family:
    '"SF Mono", "Fira Code", "Fira Mono", "Roboto Mono", Menlo, Courier, monospace',
  size: {
    1: 11,
    2: 12,
    3: 13,
    4: 14,
    5: 15,
    6: 16,
    7: 18,
    8: 20,
  },
  lineHeight: {
    1: 16,
    2: 18,
    3: 20,
    4: 22,
    5: 24,
    6: 26,
    7: 28,
    8: 32,
  },
  weight: {
    1: '400',
    2: '500',
    3: '700',
  },
  letterSpacing: {
    1: 0,
    2: 0.5,
  },
});

export const config = createTamagui({
  tokens,
  fonts: {
    heading: headingFont,
    body: bodyFont,
    mono: monoFont,
  },
  themes: {
    light: lightTheme,
    dark: darkTheme,
  },
  media,
  shorthands,
  settings: {
    defaultTheme: 'light',
    shouldAddPrefersColorThemes: true,
    themeClassNameOnRoot: true,
  },
});

// Type declaration so Tamagui internals pick up the correct types.
export type AppConfig = typeof config;

declare module 'tamagui' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface TamaguiCustomConfig extends AppConfig {}
}

declare module '@tamagui/core' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface TamaguiCustomConfig extends AppConfig {}
}
