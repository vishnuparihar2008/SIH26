/**
 * Airbnb Design System Tokens
 *
 * Warm, approachable consumer design system:
 * - Single proprietary sans typography strictly at weights 400 and 700.
 * - Palette: near-black ink on pure white canvas, punctuated by signature coral-pink Rausch (#FF385C)
 *   used exclusively on primary CTAs and logo marks.
 * - 50px pill radius for buttons & search heroes, 16px radius for listing cards.
 * - Two-stop soft shadow and 1px hairline borders for depth.
 */

export const colors = {
  // Brand
  primary: '#FF385C', // Rausch coral-pink (primary CTA & brand accent only)
  primaryPressed: '#E00B41',
  onPrimary: '#FFFFFF',

  // Ink & Text
  ink: '#222222',
  body: '#222222',
  mute: '#717171',
  link: '#222222',
  textPrimary: '#222222',
  textSecondary: '#717171',

  // Surface & Dividers
  canvas: '#FFFFFF',
  canvasSoft: '#F7F7F7',
  surface: '#F7F7F7',
  background: '#FFFFFF',
  hairline: '#DDDDDD',
  border: '#DDDDDD',

  // Semantic & Badges
  error: '#C13515',
  success: '#1E7A3D',
  disabled: '#EBEBEB',
  disabledText: '#A0A0A0',
  newBadgeBg: '#E8F4F8',
  newBadgeText: '#005A6E',
} as const;

export const rounded = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  card: 16,
  pill: 10,
  button: 50,
  full: 9999,
} as const;

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 40,
  '3xl': 48,
  '4xl': 64,
  section: 96,
} as const;

export const typography = {
  displayLg: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 36,
  },
  displayMd: {
    fontSize: 22,
    fontWeight: '700' as const,
    lineHeight: 28,
  },
  displaySm: {
    fontSize: 18,
    fontWeight: '700' as const,
    lineHeight: 24,
  },
  bodyLg: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodyMd: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  bodyMdStrong: {
    fontSize: 14,
    fontWeight: '700' as const,
    lineHeight: 20,
  },
  bodySm: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
  bodySmStrong: {
    fontSize: 12,
    fontWeight: '700' as const,
    lineHeight: 16,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
  buttonMd: {
    fontSize: 14,
    fontWeight: '700' as const,
    lineHeight: 20,
  },
  buttonLg: {
    fontSize: 16,
    fontWeight: '700' as const,
    lineHeight: 20,
  },

  // Direct scale values for style compatibility
  title: 28,
  heading: 20,
  body: 15,
  captionSize: 13,
  lineHeightMultiplier: 1.35,
} as const;

export const shadows = {
  level0: {},
  hairline: {
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  softFloat: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHover: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
} as const;

export const touchTarget = {
  minHeight: 52,
  minWidth: 52,
  borderRadius: rounded.button,
} as const;

export const layout = {
  maxOptionsPerScreen: 4,
  screenPadding: spacing.lg,
  cardRadius: rounded.card,
  buttonRadius: rounded.button,
} as const;
