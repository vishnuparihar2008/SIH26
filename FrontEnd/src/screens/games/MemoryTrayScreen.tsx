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
import { colors, typography, spacing, layout, touchTarget } from '@/theme/theme';
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
        <Text style={styles.heading}>Remember these items</Text>
        <View style={styles.trayRow}>
          {MEMORY_TRAY_SHOWN_ITEMS.map((item: TrayItem) => (
            <TrayCell key={item.id} item={item} />
          ))}
        </View>
        <Text style={styles.timer}>Hiding in {secondsLeft}...</Text>
      </View>
    );
  }

  // stage === 'selecting'
  return (
    <View style={styles.screen}>
      <Text style={styles.heading}>Which items did you see?</Text>
      <View style={styles.trayRow}>
        {MEMORY_TRAY_OPTION_POOL.map((item: TrayItem) => (
          <Pressable
            key={item.id}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: selected.has(item.id) }}
            onPress={() => toggle(item.id)}
            style={[
              styles.selectableCell,
              selected.has(item.id) && styles.selectedCell,
            ]}
          >
            <Text style={styles.trayIcon}>{item.icon}</Text>
            <Text style={styles.trayLabel}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
      <LargeButton
        label="Submit"
        variant={selected.size === 0 ? 'disabled' : 'default'}
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
    backgroundColor: colors.background,
    padding: layout.screenPadding,
  },
  heading: {
    fontSize: typography.heading,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  trayRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  trayCell: {
    alignItems: 'center',
    margin: spacing.sm,
  },
  selectableCell: {
    alignItems: 'center',
    margin: spacing.sm,
    padding: spacing.sm,
    borderRadius: touchTarget.borderRadius,
    borderWidth: 2,
    borderColor: colors.border,
    minWidth: touchTarget.minWidth,
    minHeight: touchTarget.minHeight,
  },
  selectedCell: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  trayIcon: {
    fontSize: 40,
  },
  trayLabel: {
    fontSize: typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  timer: {
    fontSize: typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  submitButton: {
    marginTop: spacing.lg,
  },
});
