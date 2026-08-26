import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LargeButton } from '@/components/LargeButton';
import { SessionSummary } from '@/components/SessionSummary';
import { ROUTINE_STEPS } from '@/data/mockGameData';
import { colors, typography, spacing, rounded, shadows } from '@/theme/theme';
import { GameSessionResult, RoutineStep } from '@/types/game';
import type { RootStackParamList } from '@/navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'RoutineSequencer'>;

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function RoutineSequencerScreen({ navigation }: Props) {
  const [shuffledSteps, setShuffledSteps] = useState<RoutineStep[]>(() =>
    shuffle<RoutineStep>(ROUTINE_STEPS),
  );
  const [placed, setPlaced] = useState<RoutineStep[]>([]);
  const [result, setResult] = useState<GameSessionResult | null>(null);
  const [startTime, setStartTime] = useState<number>(() => Date.now());

  const remaining = shuffledSteps.filter(
    (step: RoutineStep) => !placed.find(p => p.id === step.id),
  );

  function placeStep(step: RoutineStep) {
    const next = [...placed, step];
    setPlaced(next);
    if (next.length === ROUTINE_STEPS.length) {
      const correctCount = next.filter(
        (s: RoutineStep, i: number) => s.correctOrder === i,
      ).length;
      const totalCount = ROUTINE_STEPS.length;
      const accuracy = totalCount > 0 ? Number((correctCount / totalCount).toFixed(2)) : 0;
      const score = Math.round(accuracy * 100);
      const durationSeconds = Math.max(1, Math.round((Date.now() - startTime) / 1000));
      const errorCount = totalCount - correctCount;

      setResult({
        gameId: 'routine-sequencer',
        correctCount,
        totalCount,
        accuracy,
        score,
        difficultyLevel: 1,
        durationSeconds,
        errorTypes: errorCount > 0 ? [`out-of-order-steps-${errorCount}`] : undefined,
        completedAt: new Date().toISOString(),
      });
    }
  }

  function unplaceStep(index: number) {
    if (index >= placed.length) return;
    setPlaced(prev => prev.filter((_, i) => i !== index));
  }

  function reset() {
    setPlaced([]);
    setShuffledSteps(shuffle<RoutineStep>(ROUTINE_STEPS));
    setResult(null);
    setStartTime(Date.now());
  }

  if (result) {
    return (
      <View style={styles.screen}>
        <SessionSummary
          result={result}
          onPlayAgain={reset}
          onGoHome={() => navigation.navigate('Home')}
        />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.heading}>Order your routine</Text>
        <Text style={styles.subheading}>Tap the steps below in the chronological order you do them</Text>
      </View>

      <Text style={styles.sectionLabel}>Your Sequence ({placed.length}/{ROUTINE_STEPS.length})</Text>
      <View style={styles.placedRow}>
        {Array.from({ length: ROUTINE_STEPS.length }).map((_, i) => {
          const step = placed[i];
          return (
            <Pressable
              key={i}
              accessibilityRole={step ? 'button' : 'none'}
              accessibilityLabel={step ? `Step ${i + 1}: ${step.label}. Tap to remove.` : `Empty step slot ${i + 1}`}
              onPress={() => step && unplaceStep(i)}
              style={[styles.slot, step && styles.slotFilled]}
            >
              {step ? (
                <>
                  <Text style={styles.stepIcon}>{step.icon}</Text>
                  <Text style={styles.stepLabel}>{step.label}</Text>
                </>
              ) : (
                <Text style={styles.slotNumber}>{i + 1}</Text>
              )}
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.sectionLabel}>Available Steps</Text>
      <View style={styles.optionsRow}>
        {remaining.map((step: RoutineStep) => (
          <Pressable
            key={step.id}
            accessibilityRole="button"
            accessibilityLabel={step.label}
            onPress={() => placeStep(step)}
            style={({ pressed }) => [styles.optionCell, pressed && styles.optionCellPressed]}
          >
            <Text style={styles.stepIcon}>{step.icon}</Text>
            <Text style={styles.stepLabel}>{step.label}</Text>
          </Pressable>
        ))}
      </View>

      {remaining.length > 0 && placed.length > 0 && (
        <LargeButton
          label="Start Over"
          variant="secondary"
          onPress={reset}
          style={styles.resetButton}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.section,
  },
  header: {
    marginBottom: spacing.md,
  },
  heading: {
    fontSize: typography.displayLg.fontSize,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 4,
  },
  subheading: {
    fontSize: typography.bodyLg.fontSize,
    fontWeight: '400',
    color: colors.mute,
    lineHeight: typography.bodyLg.lineHeight,
  },
  sectionLabel: {
    fontSize: typography.bodySmStrong.fontSize,
    fontWeight: '700',
    color: colors.mute,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  placedRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  slot: {
    width: 68,
    height: 76,
    borderRadius: rounded.card,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.canvasSoft,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxs,
  },
  slotFilled: {
    backgroundColor: colors.canvas,
    borderColor: colors.ink,
    ...shadows.softFloat,
  },
  slotNumber: {
    fontSize: typography.bodyMdStrong.fontSize,
    fontWeight: '700',
    color: colors.mute,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  optionCell: {
    width: 68,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxs,
    borderRadius: rounded.card,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.canvas,
    ...shadows.softFloat,
  },
  optionCellPressed: {
    backgroundColor: colors.canvasSoft,
    borderColor: colors.ink,
    transform: [{ scale: 0.96 }],
  },
  stepIcon: {
    fontSize: 26,
  },
  stepLabel: {
    fontSize: typography.bodySm.fontSize,
    fontWeight: '700',
    color: colors.ink,
    marginTop: 2,
    textAlign: 'center',
  },
  resetButton: {
    marginTop: spacing.sm,
  },
});
