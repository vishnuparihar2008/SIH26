import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MultipleChoiceQuiz } from '@/components/MultipleChoiceQuiz';
import { SessionSummary } from '@/components/SessionSummary';
import { PlaceholderPhoto } from '@/components/PlaceholderPhoto';
import { FACE_NAME_QUESTIONS } from '@/data/mockGameData';
import { colors, spacing } from '@/theme/theme';
import { GameSessionResult } from '@/types/game';
import type { RootStackParamList } from '@/navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'FaceNameMatch'>;

export function FaceNameMatchScreen({ navigation }: Props) {
  const [result, setResult] = useState<GameSessionResult | null>(null);

  return (
    <View style={styles.screen}>
      {result ? (
        <SessionSummary
          result={result}
          onPlayAgain={() => setResult(null)}
          onGoHome={() => navigation.navigate('Home')}
        />
      ) : (
        <MultipleChoiceQuiz
          gameId="face-name-match"
          questions={FACE_NAME_QUESTIONS}
          renderQuestionVisual={q => (
            <PlaceholderPhoto
              label="Family Member Photo"
              imageUri={q.imageUri}
            />
          )}
          onComplete={setResult}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
    padding: spacing.lg,
  },
});
