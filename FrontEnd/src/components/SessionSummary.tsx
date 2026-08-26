import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LargeButton } from '@/components/LargeButton';
import { colors, typography, spacing } from '@/theme/theme';
import { GameSessionResult } from '@/types/game';

interface SessionSummaryProps {
  result: GameSessionResult;
  onPlayAgain: () => void;
  onGoHome: () => void;
}

/**
 * Phase 1: this just displays the result and offers replay/home.
 * Phase 2 wires `result` into local SQLite storage. Phase 4 feeds
 * a history of these results into the difficulty engine. Neither
 * happens here yet — this component only renders.
 */
export function SessionSummary({
  result,
  onPlayAgain,
  onGoHome,
}: SessionSummaryProps) {
  const isPerfect = result.correctCount === result.totalCount;

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>{isPerfect ? '🌟' : '👏'}</Text>
      <Text style={styles.heading}>{isPerfect ? 'Great Job!' : 'Well done!'}</Text>
      <Text style={styles.score}>
        You got {result.correctCount} of {result.totalCount} correct ({result.score}%)
      </Text>
      <View style={styles.badgeRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeLabel}>Level {result.difficultyLevel}</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeLabel}>{result.durationSeconds}s</Text>
        </View>
      </View>
      <LargeButton label="Play Again" onPress={onPlayAgain} />
      <LargeButton label="Back to Games" onPress={onGoHome} variant="default" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  heading: {
    fontSize: typography.title,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  score: {
    fontSize: typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  badge: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  badgeLabel: {
    fontSize: typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});

