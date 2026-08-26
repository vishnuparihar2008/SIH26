import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LargeButton } from '@/components/LargeButton';
import { MultipleChoiceQuiz } from '@/components/MultipleChoiceQuiz';
import { SessionSummary } from '@/components/SessionSummary';
import {
  SCENE_BEFORE,
  SCENE_AFTER,
  WHAT_CHANGED_OPTIONS,
  WHAT_CHANGED_CORRECT_INDEX,
} from '@/data/mockGameData';
import { colors, typography, spacing, rounded, shadows } from '@/theme/theme';
import { GameSessionResult, SceneItem } from '@/types/game';
import type { RootStackParamList } from '@/navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'WhatChanged'>;

type Stage = 'before' | 'after' | 'question' | 'done';

function SceneRow({ items }: { items: SceneItem[] }) {
  return (
    <View style={styles.sceneGrid}>
      {items.map(item => (
        <View key={item.id} style={styles.sceneCard}>
          <Text style={styles.sceneIcon}>{item.icon}</Text>
          <Text style={styles.sceneLabel}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

export function WhatChangedScreen({ navigation }: Props) {
  const [stage, setStage] = useState<Stage>('before');
  const [result, setResult] = useState<GameSessionResult | null>(null);

  if (stage === 'done' && result) {
    return (
      <View style={styles.screen}>
        <SessionSummary
          result={result}
          onPlayAgain={() => {
            setResult(null);
            setStage('before');
          }}
          onGoHome={() => navigation.navigate('Home')}
        />
      </View>
    );
  }

  if (stage === 'question') {
    return (
      <View style={styles.screen}>
        <MultipleChoiceQuiz
          gameId="what-changed"
          questions={[
            {
              id: 'wc-1',
              prompt: 'Which item was removed from the scene?',
              options: WHAT_CHANGED_OPTIONS,
              correctOptionIndex: WHAT_CHANGED_CORRECT_INDEX,
            },
          ]}
          onComplete={(r: GameSessionResult) => {
            setResult(r);
            setStage('done');
          }}
        />
      </View>
    );
  }

  const isBefore = stage === 'before';
  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.heading}>
          {isBefore ? 'Look carefully at these items' : 'Now look again...'}
        </Text>
        <Text style={styles.subheading}>
          {isBefore
            ? 'Observe the objects on the screen. One will be removed in the next step.'
            : 'Can you spot which item went missing?'}
        </Text>
      </View>

      <SceneRow items={isBefore ? SCENE_BEFORE : SCENE_AFTER} />

      <LargeButton
        label={isBefore ? "I'm Ready — Next" : 'Choose Missing Item'}
        variant="primary"
        onPress={() => setStage(isBefore ? 'after' : 'question')}
        style={styles.actionButton}
      />
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
  sceneGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  sceneCard: {
    width: 130,
    height: 130,
    backgroundColor: colors.canvas,
    borderRadius: rounded.card,
    borderWidth: 1,
    borderColor: colors.hairline,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.sm,
    ...shadows.softFloat,
  },
  sceneIcon: {
    fontSize: 50,
    marginBottom: 4,
  },
  sceneLabel: {
    fontSize: typography.bodyMdStrong.fontSize,
    fontWeight: '700',
    color: colors.ink,
    textAlign: 'center',
  },
  actionButton: {
    marginTop: spacing.md,
  },
});
