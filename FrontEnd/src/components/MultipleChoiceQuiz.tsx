import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LargeButton } from '@/components/LargeButton';
import { colors, typography, spacing, rounded } from '@/theme/theme';
import { MultipleChoiceQuestion, GameSessionResult, GameId } from '@/types/game';

interface MultipleChoiceQuizProps {
  gameId: GameId;
  questions: MultipleChoiceQuestion[];
  difficultyLevel?: number;
  /** Rendered above the options for the current question — used to
   * slot in a photo, an icon, or any other question-specific visual. */
  renderQuestionVisual?: (question: MultipleChoiceQuestion) => React.ReactNode;
  onComplete: (result: GameSessionResult) => void;
}

type AnswerState = 'unanswered' | 'correct' | 'incorrect';

/**
 * Shared flow for every "show a prompt, pick one of N options" game:
 * Memory Album, Family Face & Name Match, Local Culture Match, and
 * the question step of What Changed?
 */
export function MultipleChoiceQuiz({
  gameId,
  questions,
  difficultyLevel = 1,
  renderQuestionVisual,
  onComplete,
}: MultipleChoiceQuizProps) {
  const [startTime] = useState<number>(() => Date.now());
  const [index, setIndex] = useState(0);
  const [answerState, setAnswerState] = useState<AnswerState>('unanswered');
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [errorTypes, setErrorTypes] = useState<string[]>([]);

  const question = questions[index];
  const isLastQuestion = index === questions.length - 1;

  function handleSelect(optionIndex: number) {
    if (answerState !== 'unanswered') return; // ignore taps after answering

    const isCorrect = optionIndex === question.correctOptionIndex;
    setSelectedOption(optionIndex);
    setAnswerState(isCorrect ? 'correct' : 'incorrect');
    if (isCorrect) {
      setCorrectCount(c => c + 1);
    } else {
      setErrorTypes(prev => [...prev, `${gameId}-wrong-choice-q${index + 1}`]);
    }
  }

  function handleNext() {
    if (isLastQuestion) {
      const finalCorrect = answerState === 'correct' ? correctCount : correctCount;
      const totalCount = questions.length;
      const accuracy = totalCount > 0 ? Number((finalCorrect / totalCount).toFixed(2)) : 0;
      const score = Math.round(accuracy * 100);
      const durationSeconds = Math.max(1, Math.round((Date.now() - startTime) / 1000));

      onComplete({
        gameId,
        correctCount: finalCorrect,
        totalCount,
        accuracy,
        score,
        difficultyLevel,
        durationSeconds,
        errorTypes: errorTypes.length > 0 ? errorTypes : undefined,
        completedAt: new Date().toISOString(),
      });
      return;
    }
    setIndex(i => i + 1);
    setAnswerState('unanswered');
    setSelectedOption(null);
  }

  return (
    <View style={styles.container}>
      <View style={styles.progressPill}>
        <Text style={styles.progressText}>
          Question {index + 1} of {questions.length}
        </Text>
      </View>

      {renderQuestionVisual?.(question)}

      <Text style={styles.prompt}>{question.prompt}</Text>

      <View style={styles.optionsContainer}>
        {question.options.map((option, i) => {
          let variant: 'option' | 'correct' | 'incorrect' | 'disabled' = 'option';
          if (answerState !== 'unanswered') {
            if (i === question.correctOptionIndex) variant = 'correct';
            else if (i === selectedOption) variant = 'incorrect';
            else variant = 'disabled';
          }
          return (
            <LargeButton
              key={i}
              label={option}
              variant={variant}
              onPress={() => handleSelect(i)}
            />
          );
        })}
      </View>

      {answerState !== 'unanswered' && (
        <LargeButton
          label={isLastQuestion ? 'Finish' : 'Next Question'}
          variant="primary"
          onPress={handleNext}
          style={styles.nextButton}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  progressPill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.canvasSoft,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: rounded.button,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    marginBottom: spacing.md,
  },
  progressText: {
    fontSize: typography.bodySmStrong.fontSize,
    fontWeight: '700',
    color: colors.mute,
  },
  prompt: {
    fontSize: typography.displayMd.fontSize,
    fontWeight: '700',
    color: colors.ink,
    lineHeight: typography.displayMd.lineHeight,
    marginBottom: spacing.md,
  },
  optionsContainer: {
    marginVertical: spacing.xs,
  },
  nextButton: {
    marginTop: spacing.lg,
  },
});
