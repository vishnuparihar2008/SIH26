import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, touchTarget } from '@/theme/theme';
import { GameMeta } from '@/types/game';

interface GameCardProps {
  game: GameMeta;
  onPress: () => void;
}

export function GameCard({ game, onPress }: GameCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${game.title}. ${game.description}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <Text style={styles.icon}>{game.icon}</Text>
      <Text style={styles.title}>{game.title}</Text>
      <Text style={styles.description}>{game.description}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: touchTarget.minHeight * 1.5,
    borderRadius: touchTarget.borderRadius,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
    marginVertical: spacing.xs,
  },
  pressed: {
    backgroundColor: colors.disabled,
  },
  icon: {
    fontSize: 40,
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: typography.heading,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  description: {
    fontSize: typography.caption,
    color: colors.textSecondary,
  },
});
