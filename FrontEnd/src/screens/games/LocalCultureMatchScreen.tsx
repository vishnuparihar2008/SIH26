import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MultipleChoiceQuiz } from '@/components/MultipleChoiceQuiz';
import { SessionSummary } from '@/components/SessionSummary';
import { LOCAL_CULTURE_QUESTIONS } from '@/data/mockGameData';
import { colors, layout } from '@/theme/theme';
import { GameSessionResult } from '@/types/game';
import type { RootStackParamList } from '@/navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'LocalCultureMatch'>;

/**
 * NER-specific USP game. Content here (Bihu, Gamosa, etc.) is
 * placeholder — real content should be reviewed with someone from
 * the target community before this ships beyond the prototype.
 */
export function LocalCultureMatchScreen({ navigation }: Props) {
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
          gameId="local-culture-match"
          questions={LOCAL_CULTURE_QUESTIONS}
          onComplete={setResult}
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
});
