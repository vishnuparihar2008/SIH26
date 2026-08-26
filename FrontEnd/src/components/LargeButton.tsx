import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors, typography, spacing, rounded, touchTarget } from '@/theme/theme';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'option'
  | 'default'
  | 'correct'
  | 'incorrect'
  | 'disabled';

interface LargeButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

/**
 * Airbnb Design System Button Component
 *
 * Characteristics:
 * - 50px pill container (`rounded.button`).
 * - Primary: Signature Rausch (#FF385C) CTA with white text.
 * - Secondary: White canvas with hairline or ink border and ink text.
 * - Strict 700 font weight for all button text.
 */
export function LargeButton({
  label,
  onPress,
  variant = 'primary',
  style,
  textStyle,
  icon,
}: LargeButtonProps) {
  const isDisabled = variant === 'disabled';
  const isSecondary = variant === 'secondary';
  const isGhost = variant === 'ghost';
  const isOption = variant === 'option';
  const isPrimary = variant === 'primary' || variant === 'default';
  const isCorrect = variant === 'correct';
  const isIncorrect = variant === 'incorrect';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        isPrimary && styles.primary,
        isSecondary && styles.secondary,
        isGhost && styles.ghost,
        isOption && styles.option,
        isCorrect && styles.correct,
        isIncorrect && styles.incorrect,
        isDisabled && styles.disabled,
        pressed && !isDisabled && (
          isPrimary ? styles.primaryPressed :
          isSecondary ? styles.secondaryPressed :
          isOption ? styles.optionPressed :
          styles.pressed
        ),
        style,
      ]}
    >
      {icon}
      <Text
        style={[
          styles.label,
          (isSecondary || isGhost || isOption) && styles.inkLabel,
          isDisabled && styles.disabledLabel,
          textStyle,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: touchTarget.minHeight,
    borderRadius: rounded.button,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginVertical: spacing.xs,
    gap: spacing.xs,
  },
  primary: {
    backgroundColor: colors.primary,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryPressed: {
    backgroundColor: colors.primaryPressed,
    transform: [{ scale: 0.98 }],
  },
  secondary: {
    backgroundColor: colors.canvas,
    borderWidth: 1.5,
    borderColor: colors.ink,
  },
  secondaryPressed: {
    backgroundColor: colors.canvasSoft,
    transform: [{ scale: 0.98 }],
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  option: {
    backgroundColor: colors.canvas,
    borderWidth: 1.5,
    borderColor: colors.hairline,
    justifyContent: 'flex-start',
    paddingHorizontal: spacing.md,
  },
  optionPressed: {
    backgroundColor: colors.canvasSoft,
    borderColor: colors.ink,
  },
  correct: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  incorrect: {
    backgroundColor: colors.error,
    borderColor: colors.error,
  },
  disabled: {
    backgroundColor: colors.disabled,
    borderColor: colors.disabled,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  label: {
    color: colors.onPrimary,
    fontSize: typography.buttonLg.fontSize,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0,
  },
  inkLabel: {
    color: colors.ink,
  },
  disabledLabel: {
    color: colors.disabledText,
  },
});
