import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, typography, spacing, touchTarget } from '@/theme/theme';

interface LargeButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'default' | 'correct' | 'incorrect' | 'disabled';
  style?: ViewStyle;
}

/**
 * Every tappable choice in the app should go through this component
 * rather than a raw Pressable/Button, so touch-target size and
 * contrast stay consistent as more games are added.
 */
export function LargeButton({
  label,
  onPress,
  variant = 'default',
  style,
}: LargeButtonProps) {
  const isDisabled = variant === 'disabled';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variant === 'correct' && styles.correct,
        variant === 'incorrect' && styles.incorrect,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: touchTarget.minHeight,
    borderRadius: touchTarget.borderRadius,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginVertical: spacing.xs,
  },
  pressed: {
    backgroundColor: colors.primaryPressed,
  },
  correct: {
    backgroundColor: colors.success,
  },
  incorrect: {
    backgroundColor: colors.error,
  },
  disabled: {
    backgroundColor: colors.disabled,
  },
  label: {
    color: '#FFFFFF',
    fontSize: typography.body,
    fontWeight: '600',
    textAlign: 'center',
  },
});
