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
import { colors, typography, spacing, layout } from '@/theme/theme';
import { GameSessionResult, SceneItem } from '@/types/game';
import type { RootStackParamList } from '@/navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'WhatChanged'>;

type Stage = 'before' | 'after' | 'question' | 'done';

function SceneRow({ items }: { items: SceneItem[] }) {
  return (
    <View style={styles.sceneRow}>
      {items.map(item => (
        <View key={item.id} style={styles.sceneItem}>
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
              prompt: 'What changed?',
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
      <Text style={styles.heading}>
        {isBefore ? 'Look carefully at these items' : 'Now look again...'}
      </Text>
      <SceneRow items={isBefore ? SCENE_BEFORE : SCENE_AFTER} />
      <LargeButton
        label={isBefore ? "I'm Ready — Next" : 'What Changed?'}
        onPress={() => setStage(isBefore ? 'after' : 'question')}
        style={styles.actionButton}
      />
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
  sceneRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  sceneItem: {
    alignItems: 'center',
    margin: spacing.sm,
  },
  sceneIcon: {
    fontSize: 56,
  },
  sceneLabel: {
    fontSize: typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  actionButton: {
    marginTop: spacing.lg,
  },
});
