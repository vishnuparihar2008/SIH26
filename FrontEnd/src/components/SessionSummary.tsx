import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LargeButton } from '@/components/LargeButton';
import { colors, typography, spacing, rounded, shadows } from '@/theme/theme';
import { useAuth } from '@/context/AuthContext';
import { gameSyncService } from '@/services/gameSyncService';
import { GameSessionResult } from '@/types/game';

interface SessionSummaryProps {
  result: GameSessionResult;
  onPlayAgain: () => void;
  onGoHome: () => void;
}

/**
 * Airbnb Design System Session Summary Card
 *
 * Characteristics:
 * - Clean white canvas surface with soft float shadow.
 * - 50px pill badges with hairline borders.
 * - Primary Rausch CTA for "Play Again" and secondary pill for "Back to Games".
 */
export function SessionSummary({
  result,
  onPlayAgain,
  onGoHome,
}: SessionSummaryProps) {
  const { user } = useAuth();
  const patientId = (user?.patientProfile as any)?._id || user?.id || 'default-patient';
  const hasSyncedRef = useRef(false);

  useEffect(() => {
    if (!hasSyncedRef.current) {
      hasSyncedRef.current = true;
      gameSyncService.recordGameSession(result, patientId);
    }
  }, [result, patientId]);

  const isPerfect = result.correctCount === result.totalCount;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.emojiCircle}>
          <Text style={styles.emoji}>{isPerfect ? '🌟' : '👏'}</Text>
        </View>

        <Text style={styles.heading}>{isPerfect ? 'Great job!' : 'Well done!'}</Text>
        <Text style={styles.subheading}>Cognitive practice complete</Text>

        <View style={styles.scoreContainer}>
          <Text style={styles.scoreValue}>{result.score}%</Text>
          <Text style={styles.scoreDetail}>
            {result.correctCount} of {result.totalCount} correct
          </Text>
        </View>

        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeLabel}>Level {result.difficultyLevel}</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeLabel}>{result.durationSeconds}s duration</Text>
          </View>
          {isPerfect && (
            <View style={styles.guestFavoriteBadge}>
              <Text style={styles.guestFavoriteText}>★ Perfect Score</Text>
            </View>
          )}
        </View>

        <View style={styles.actionContainer}>
          <LargeButton label="Play Again" onPress={onPlayAgain} variant="primary" />
          <LargeButton label="Back to Games" onPress={onGoHome} variant="secondary" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.canvas,
    padding: spacing.md,
  },
  card: {
    width: '100%',
    backgroundColor: colors.canvas,
    borderRadius: rounded.card,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadows.softFloat,
  },
  emojiCircle: {
    width: 80,
    height: 80,
    borderRadius: rounded.full,
    backgroundColor: colors.canvasSoft,
    borderWidth: 1,
    borderColor: colors.hairline,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  emoji: {
    fontSize: 44,
  },
  heading: {
    fontSize: typography.displayLg.fontSize,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 4,
    textAlign: 'center',
  },
  subheading: {
    fontSize: typography.bodyMd.fontSize,
    fontWeight: '400',
    color: colors.mute,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  scoreContainer: {
    backgroundColor: colors.canvasSoft,
    borderRadius: rounded.card,
    borderWidth: 1,
    borderColor: colors.hairline,
    width: '100%',
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.ink,
  },
  scoreDetail: {
    fontSize: typography.bodyMd.fontSize,
    fontWeight: '400',
    color: colors.mute,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  badge: {
    backgroundColor: colors.canvas,
    borderColor: colors.hairline,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: rounded.button,
  },
  badgeLabel: {
    fontSize: typography.bodySmStrong.fontSize,
    fontWeight: '700',
    color: colors.mute,
  },
  guestFavoriteBadge: {
    backgroundColor: colors.canvas,
    borderColor: colors.hairline,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: rounded.button,
    ...shadows.softFloat,
  },
  guestFavoriteText: {
    fontSize: typography.bodySmStrong.fontSize,
    fontWeight: '700',
    color: colors.ink,
  },
  actionContainer: {
    width: '100%',
    gap: spacing.xs,
  },
});
