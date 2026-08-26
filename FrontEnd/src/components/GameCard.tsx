import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, rounded, shadows } from '@/theme/theme';
import { GameMeta } from '@/types/game';

interface GameCardProps {
  game: GameMeta;
  onPress: () => void;
  badge?: string;
  isNew?: boolean;
}

/**
 * Airbnb Design System Listing Card Component
 *
 * Characteristics:
 * - 16px corner radius (`rounded.card`).
 * - Hairline 1px border with soft float elevation.
 * - Image/Icon container with full rounded top.
 * - Two-weight typography: Title (700 bold ink) and description (400 mute).
 * - "Guest favorite" or "NEW" pill badges.
 */
export function GameCard({ game, onPress, badge, isNew }: GameCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${game.title}. ${game.description}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.visualContainer}>
        <Text style={styles.icon}>{game.icon}</Text>
        {isNew ? (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>NEW</Text>
          </View>
        ) : badge ? (
          <View style={styles.guestFavoriteBadge}>
            <Text style={styles.guestFavoriteText}>{badge}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{game.title}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {game.description}
        </Text>
        <View style={styles.footerRow}>
          <Text style={styles.categoryTag}>Memory · Daily Exercise</Text>
          <View style={styles.arrowCircle}>
            <Text style={styles.arrowText}>→</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.canvas,
    borderRadius: rounded.card,
    borderWidth: 1,
    borderColor: colors.hairline,
    marginVertical: spacing.xs,
    overflow: 'hidden',
    ...shadows.softFloat,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
    borderColor: colors.ink,
  },
  visualContainer: {
    height: 120,
    backgroundColor: colors.canvasSoft,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  icon: {
    fontSize: 48,
  },
  newBadge: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
    backgroundColor: colors.newBadgeBg,
    paddingHorizontal: spacing.xs,
    paddingVertical: 3,
    borderRadius: rounded.pill,
  },
  newBadgeText: {
    color: colors.newBadgeText,
    fontSize: typography.bodySmStrong.fontSize,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  guestFavoriteBadge: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.hairline,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: rounded.button,
    ...shadows.softFloat,
  },
  guestFavoriteText: {
    color: colors.ink,
    fontSize: typography.bodySmStrong.fontSize,
    fontWeight: '700',
  },
  content: {
    padding: spacing.md,
  },
  title: {
    fontSize: typography.displaySm.fontSize,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 4,
  },
  description: {
    fontSize: typography.bodyMd.fontSize,
    fontWeight: '400',
    color: colors.mute,
    lineHeight: typography.bodyMd.lineHeight,
    marginBottom: spacing.sm,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.canvasSoft,
  },
  categoryTag: {
    fontSize: typography.bodySm.fontSize,
    fontWeight: '400',
    color: colors.mute,
  },
  arrowCircle: {
    width: 28,
    height: 28,
    borderRadius: rounded.full,
    borderWidth: 1,
    borderColor: colors.hairline,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.canvas,
  },
  arrowText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.ink,
  },
});
