import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, typography, spacing, layout } from '@/theme/theme';

/**
 * Voice Assist Screen (Techspec §2.1, §2.3 & Implementation Plan Phase 3).
 * Push-to-talk offline regional speech recognition (Vosk STT + Piper TTS).
 */
export function VoiceAssistPlaceholderScreen() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState<string>(
    'Press and hold the button below to speak in your preferred regional language.',
  );
  const [response, setResponse] = useState<string | null>(null);

  function handleSimulateVoice() {
    setIsListening(true);
    setTranscript('Listening for offline voice input...');
    setResponse(null);

    setTimeout(() => {
      setIsListening(false);
      setTranscript('"What time is my next medicine?"');
      setResponse('Your next medicine is scheduled for 01:30 PM after lunch.');
    }, 1500);
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.heading}>Voice Assistant</Text>
      <Text style={styles.subheading}>Talk in your natural language (Works Offline)</Text>

      <View style={styles.dialogContainer}>
        <View style={styles.bubble}>
          <Text style={styles.bubbleSpeaker}>You</Text>
          <Text style={styles.bubbleText}>{transcript}</Text>
        </View>

        {response ? (
          <View style={[styles.bubble, styles.assistantBubble]}>
            <Text style={styles.assistantSpeaker}>Assistant 🔊</Text>
            <Text style={styles.assistantText}>{response}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.actionContainer}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isListening ? 'Listening' : 'Push to talk'}
          onPress={handleSimulateVoice}
          style={[styles.micButton, isListening && styles.micButtonActive]}
        >
          <Text style={styles.micIcon}>{isListening ? '🛑' : '🎙️'}</Text>
          <Text style={styles.micLabel}>
            {isListening ? 'Listening...' : 'Tap to Speak'}
          </Text>
        </Pressable>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            ⚡ Offline Engine: Vosk STT (50MB model) + Piper TTS. No internet required.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    padding: layout.screenPadding,
    justifyContent: 'space-between',
  },
  heading: {
    fontSize: typography.title,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subheading: {
    fontSize: typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  dialogContainer: {
    flex: 1,
    gap: spacing.md,
  },
  bubble: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 2,
    borderRadius: 16,
    padding: spacing.md,
  },
  assistantBubble: {
    backgroundColor: '#EBF3FA',
    borderColor: colors.primary,
  },
  bubbleSpeaker: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  assistantSpeaker: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  bubbleText: {
    fontSize: typography.body,
    color: colors.textPrimary,
  },
  assistantText: {
    fontSize: typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  actionContainer: {
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  micButton: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  micButtonActive: {
    backgroundColor: colors.error,
  },
  micIcon: {
    fontSize: 48,
    marginBottom: 4,
  },
  micLabel: {
    fontSize: typography.caption,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  infoBox: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.sm,
    width: '100%',
  },
  infoText: {
    fontSize: typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
