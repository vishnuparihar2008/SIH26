/**
 * Design tokens for the patient-facing app.
 *
 * Every value here exists to serve one constraint from the PRD:
 * elderly, low-digital-literacy users, often with mild cognitive
 * impairment. That means: large touch targets, high contrast,
 * minimal simultaneous choices, and no fine motor precision required.
 */

export const colors = {
  background: '#FFFFFF',
  surface: '#F5F7FA',
  textPrimary: '#101418',
  textSecondary: '#3C4650',
  primary: '#1B5E9E', // high-contrast blue, distinguishable for common colour-vision deficiencies
  primaryPressed: '#144675',
  success: '#1E7A3D',
  error: '#B3261E',
  border: '#C7CED6',
  disabled: '#D8DEE4',
} as const;

export const typography = {
  // Base sizes are intentionally large — never go below 'body' anywhere
  // in patient-facing (not caregiver-facing) screens.
  title: 32,
  heading: 26,
  body: 22,
  caption: 18,
  lineHeightMultiplier: 1.35,
} as const;

export const spacing = {
  xs: 8,
  sm: 12,
  md: 20,
  lg: 32,
  xl: 48,
} as const;

export const touchTarget = {
  // Minimum tap target size, well above the usual 44px accessibility
  // minimum, to accommodate reduced fine motor control.
  minHeight: 72,
  minWidth: 72,
  borderRadius: 16,
} as const;

export const layout = {
  maxOptionsPerScreen: 4, // never present more than this many simultaneous choices by default
  screenPadding: spacing.lg,
} as const;
