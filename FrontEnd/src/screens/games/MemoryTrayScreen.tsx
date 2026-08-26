import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LargeButton } from '@/components/LargeButton';
import { SessionSummary } from '@/components/SessionSummary';
import {
  MEMORY_TRAY_SHOWN_ITEMS,
  MEMORY_TRAY_OPTION_POOL,
  MEMORY_TRAY_DISPLAY_SECONDS,
} from '@/data/mockGameData';
import { colors, typography, spacing, rounded, shadows } from '@/theme/theme';
import { GameSessionResult, TrayItem } from '@/types/game';
import type { RootStackParamList } from '@/navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'MemoryTray'>;
type Stage = 'showing' | 'selecting' | 'done';

export function MemoryTrayScreen({ navigation }: Props) {
  const [stage, setStage] = useState<Stage>('showing');
  const [secondsLeft, setSecondsLeft] = useState<number>(MEMORY_TRAY_DISPLAY_SECONDS);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [result, setResult] = useState<GameSessionResult | null>(null);
  const [startTime, setStartTime] = useState<number>(() => Date.now());

  useEffect(() => {
    if (stage !== 'showing') return;
    if (secondsLeft <= 0) {
      setStage('selecting');
      return;
    }
    const timer = setTimeout(() => setSecondsLeft((s: number) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [stage, secondsLeft]);

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function submit() {
    const shownIds = new Set(MEMORY_TRAY_SHOWN_ITEMS.map((i: TrayItem) => i.id));
    let truePositives = 0;
    let falsePositives = 0;

    selected.forEach(id => {
      if (shownIds.has(id)) {
        truePositives += 1;
      } else {
        falsePositives += 1;
      }
    });

    const netScore = Math.max(0, truePositives - falsePositives);
    const totalCount = MEMORY_TRAY_SHOWN_ITEMS.length;
    const accuracy = totalCount > 0 ? Number((netScore / totalCount).toFixed(2)) : 0;
    const score = Math.round(accuracy * 100);
    const durationSeconds = Math.max(1, Math.round((Date.now() - startTime) / 1000));

    setResult({
      gameId: 'memory-tray',
      correctCount: netScore,
      totalCount,
      accuracy,
      score,
      difficultyLevel: 1,
      durationSeconds,
      errorTypes: falsePositives > 0 ? [`distractor-selected-count-${falsePositives}`] : undefined,
      completedAt: new Date().toISOString(),
    });
    setStage('done');
  }

  function reset() {
    setSelected(new Set());
    setSecondsLeft(MEMORY_TRAY_DISPLAY_SECONDS);
    setStage('showing');
    setResult(null);
    setStartTime(Date.now());
  }

  if (stage === 'done' && result) {
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

  if (stage === 'showing') {
    return (
      <View style={styles.screen}>
        <View style={styles.header}>
          <Text style={styles.heading}>Remember these objects</Text>
          <Text style={styles.subheading}>
            Study the items carefully before they disappear
          </Text>
        </View>

        <View style={styles.trayGrid}>
          {MEMORY_TRAY_SHOWN_ITEMS.map((item: TrayItem) => (
            <TrayCell key={item.id} item={item} />
          ))}
        </View>

        <View style={styles.timerPill}>
          <Text style={styles.timerText}>Hiding in {secondsLeft} seconds</Text>
        </View>
      </View>
    );
  }

  // stage === 'selecting'
  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.heading}>Which objects did you see?</Text>
        <Text style={styles.subheading}>Tap all the items that were on the tray</Text>
      </View>

      <View style={styles.trayGrid}>
        {MEMORY_TRAY_OPTION_POOL.map((item: TrayItem) => {
          const isSelected = selected.has(item.id);
          return (
            <Pressable
              key={item.id}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isSelected }}
              onPress={() => toggle(item.id)}
              style={[
                styles.selectableCell,
                isSelected && styles.selectedCell,
              ]}
            >
              <Text style={styles.trayIcon}>{item.icon}</Text>
              <Text style={[styles.trayLabel, isSelected && styles.selectedLabel]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <LargeButton
        label={selected.size === 0 ? 'Select Items to Submit' : `Submit (${selected.size} Selected)`}
        variant={selected.size === 0 ? 'disabled' : 'primary'}
        onPress={submit}
        style={styles.submitButton}
      />
    </View>
  );
}

function TrayCell({ item }: { item: TrayItem }) {
  return (
    <View style={styles.trayCell}>
      <Text style={styles.trayIcon}>{item.icon}</Text>
      <Text style={styles.trayLabel}>{item.label}</Text>
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
    marginBottom: spacing.lg,
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
  trayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  trayCell: {
    width: 100,
    height: 100,
    borderRadius: rounded.card,
    backgroundColor: colors.canvasSoft,
    borderWidth: 1,
    borderColor: colors.hairline,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.softFloat,
  },
  selectableCell: {
    width: 100,
    height: 100,
    borderRadius: rounded.card,
    backgroundColor: colors.canvas,
    borderWidth: 1.5,
    borderColor: colors.hairline,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.softFloat,
  },
  selectedCell: {
    borderColor: colors.ink,
    backgroundColor: colors.canvasSoft,
  },
  trayIcon: {
    fontSize: 38,
    marginBottom: 2,
  },
  trayLabel: {
    fontSize: typography.bodySmStrong.fontSize,
    fontWeight: '700',
    color: colors.ink,
  },
  selectedLabel: {
    color: colors.ink,
  },
  timerPill: {
    alignSelf: 'center',
    backgroundColor: colors.canvasSoft,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: rounded.button,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
  },
  timerText: {
    fontSize: typography.bodyMdStrong.fontSize,
    fontWeight: '700',
    color: colors.ink,
    textAlign: 'center',
  },
  submitButton: {
    marginTop: spacing.lg,
  },
});
