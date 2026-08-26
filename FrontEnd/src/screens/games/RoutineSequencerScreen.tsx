import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LargeButton } from '@/components/LargeButton';
import { SessionSummary } from '@/components/SessionSummary';
import { ROUTINE_STEPS } from '@/data/mockGameData';
import { colors, typography, spacing, layout, touchTarget } from '@/theme/theme';
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
  // Simple tap-to-order interaction (chosen over drag-and-drop for
  // Phase 1 — far more reliable for users with reduced fine motor
  // control, and avoids a drag-and-drop native dependency this early).
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
      <Text style={styles.heading}>Tap the steps in order</Text>

      <View style={styles.placedRow}>
        {Array.from({ length: ROUTINE_STEPS.length }).map((_, i) => {
          const step = placed[i];
          return (
            <Pressable
              key={i}
              accessibilityRole={step ? 'button' : 'none'}
              accessibilityLabel={step ? `Step ${i + 1}: ${step.label}. Tap to remove.` : `Empty step slot ${i + 1}`}
              onPress={() => step && unplaceStep(i)}
              style={styles.slot}
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

      <Text style={styles.subheading}>Available steps</Text>
      <View style={styles.optionsRow}>
        {remaining.map((step: RoutineStep) => (
          <Pressable
            key={step.id}
            accessibilityRole="button"
            accessibilityLabel={step.label}
            onPress={() => placeStep(step)}
            style={styles.optionCell}
          >
            <Text style={styles.stepIcon}>{step.icon}</Text>
            <Text style={styles.stepLabel}>{step.label}</Text>
          </Pressable>
        ))}
      </View>

      {remaining.length > 0 && (
        <LargeButton
          label="Start Over"
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
    backgroundColor: colors.background,
    padding: layout.screenPadding,
  },
  heading: {
    fontSize: typography.heading,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  subheading: {
    fontSize: typography.body,
    color: colors.textSecondary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  placedRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  slot: {
    width: touchTarget.minWidth,
    minHeight: touchTarget.minHeight,
    borderRadius: touchTarget.borderRadius,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    margin: spacing.xs,
  },
  slotNumber: {
    fontSize: typography.body,
    color: colors.textSecondary,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  optionCell: {
    alignItems: 'center',
    padding: spacing.sm,
    margin: spacing.xs,
    borderRadius: touchTarget.borderRadius,
    borderWidth: 2,
    borderColor: colors.primary,
    minWidth: touchTarget.minWidth,
    minHeight: touchTarget.minHeight,
    justifyContent: 'center',
  },
  stepIcon: {
    fontSize: 32,
  },
  stepLabel: {
    fontSize: typography.caption,
    color: colors.textPrimary,
    marginTop: 4,
  },
  resetButton: {
    marginTop: spacing.lg,
  },
});
