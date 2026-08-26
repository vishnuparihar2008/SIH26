import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, typography, spacing, rounded, shadows } from '@/theme/theme';

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
      <View style={styles.header}>
        <Text style={styles.heading}>Voice assistant</Text>
        <Text style={styles.subheading}>Speak naturally in your preferred regional dialect</Text>
      </View>

      <View style={styles.dialogContainer}>
        <View style={styles.bubbleUser}>
          <Text style={styles.bubbleSpeaker}>You</Text>
          <Text style={styles.bubbleText}>{transcript}</Text>
        </View>

        {response ? (
          <View style={styles.bubbleAssistant}>
            <View style={styles.assistantHeader}>
              <Text style={styles.assistantSpeaker}>Assistant</Text>
              <View style={styles.audioBadge}>
                <Text style={styles.audioBadgeText}>🔊 Audio Ready</Text>
              </View>
            </View>
            <Text style={styles.assistantText}>{response}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.actionContainer}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isListening ? 'Listening' : 'Push to talk'}
          onPress={handleSimulateVoice}
          style={({ pressed }) => [
            styles.micButton,
            isListening && styles.micButtonActive,
            pressed && styles.micButtonPressed,
          ]}
        >
          <Text style={styles.micIcon}>{isListening ? '⏹' : '🎙️'}</Text>
          <Text style={styles.micLabel}>
            {isListening ? 'Listening...' : 'Tap to speak'}
          </Text>
        </Pressable>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            ⚡ Offline Engine: Vosk STT + Piper TTS with zero cloud connection.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    justifyContent: 'space-between',
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
  dialogContainer: {
    flex: 1,
    gap: spacing.md,
    marginVertical: spacing.md,
  },
  bubbleUser: {
    backgroundColor: colors.canvasSoft,
    borderColor: colors.hairline,
    borderWidth: 1,
    borderRadius: rounded.card,
    padding: spacing.md,
  },
  bubbleAssistant: {
    backgroundColor: colors.canvas,
    borderColor: colors.hairline,
    borderWidth: 1,
    borderRadius: rounded.card,
    padding: spacing.md,
    ...shadows.softFloat,
  },
  bubbleSpeaker: {
    fontSize: typography.bodySmStrong.fontSize,
    fontWeight: '700',
    color: colors.mute,
    marginBottom: 4,
  },
  assistantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  assistantSpeaker: {
    fontSize: typography.bodySmStrong.fontSize,
    fontWeight: '700',
    color: colors.ink,
  },
  audioBadge: {
    backgroundColor: colors.newBadgeBg,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: rounded.pill,
  },
  audioBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.newBadgeText,
  },
  bubbleText: {
    fontSize: typography.bodyMd.fontSize,
    fontWeight: '400',
    color: colors.ink,
    lineHeight: typography.bodyMd.lineHeight,
  },
  assistantText: {
    fontSize: typography.bodyMdStrong.fontSize,
    fontWeight: '700',
    color: colors.ink,
    lineHeight: typography.bodyMd.lineHeight,
  },
  actionContainer: {
    alignItems: 'center',
    gap: spacing.md,
  },
  micButton: {
    width: 108,
    height: 108,
    borderRadius: rounded.full,
    backgroundColor: colors.primary, // Rausch coral-pink
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.softFloat,
  },
  micButtonPressed: {
    backgroundColor: colors.primaryPressed,
    transform: [{ scale: 0.96 }],
  },
  micButtonActive: {
    backgroundColor: colors.error,
  },
  micIcon: {
    fontSize: 36,
    marginBottom: 2,
  },
  micLabel: {
    fontSize: typography.bodySmStrong.fontSize,
    color: colors.onPrimary,
    fontWeight: '700',
  },
  infoBox: {
    backgroundColor: colors.canvasSoft,
    borderColor: colors.hairline,
    borderWidth: 1,
    borderRadius: rounded.button,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    width: '100%',
  },
  infoText: {
    fontSize: typography.bodySm.fontSize,
    fontWeight: '400',
    color: colors.mute,
    textAlign: 'center',
  },
});
