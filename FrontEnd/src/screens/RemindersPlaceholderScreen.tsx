import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, typography, spacing, rounded, shadows } from '@/theme/theme';

interface ReminderItem {
  id: string;
  time: string;
  label: string;
  type: 'medicine' | 'hydration' | 'activity';
  icon: string;
}

const SAMPLE_REMINDERS: ReminderItem[] = [
  { id: '1', time: '08:00 AM', label: 'Morning blood pressure medication', type: 'medicine', icon: '💊' },
  { id: '2', time: '11:00 AM', label: 'Drink a glass of water', type: 'hydration', icon: '💧' },
  { id: '3', time: '01:30 PM', label: 'After-lunch multivitamin', type: 'medicine', icon: '💊' },
  { id: '4', time: '05:00 PM', label: 'Evening gentle walk in garden', type: 'activity', icon: '🚶' },
];

/**
 * Reminders Screen (Techspec §2.1 & Implementation Plan Phase 2).
 * Operates offline using local notifications and SQLite scheduled triggers.
 */
export function RemindersPlaceholderScreen() {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.heading}>Today{"'"}s schedule</Text>
        <Text style={styles.subheading}>Automated alerts that function completely offline</Text>
      </View>

      <View style={styles.list}>
        {SAMPLE_REMINDERS.map(item => (
          <View key={item.id} style={styles.card}>
            <View style={styles.iconCircle}>
              <Text style={styles.icon}>{item.icon}</Text>
            </View>
            <View style={styles.textContainer}>
              <View style={styles.timeBadge}>
                <Text style={styles.timeText}>{item.time}</Text>
              </View>
              <Text style={styles.label}>{item.label}</Text>
              <Text style={styles.categoryText}>Scheduled Care Alert · Device Triggered</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Offline Reliability</Text>
        <Text style={styles.infoText}>
          Reminders are scheduled natively on-device. Alerts trigger reliably with sound and vibration even in Airplane Mode.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
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
  list: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.canvas,
    borderColor: colors.hairline,
    borderWidth: 1,
    borderRadius: rounded.card,
    padding: spacing.md,
    ...shadows.softFloat,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: rounded.full,
    backgroundColor: colors.canvasSoft,
    borderWidth: 1,
    borderColor: colors.hairline,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  icon: {
    fontSize: 26,
  },
  textContainer: {
    flex: 1,
  },
  timeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.canvasSoft,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: rounded.button,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    marginBottom: 4,
  },
  timeText: {
    fontSize: typography.bodySmStrong.fontSize,
    fontWeight: '700',
    color: colors.ink,
  },
  label: {
    fontSize: typography.bodyMdStrong.fontSize,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 2,
  },
  categoryText: {
    fontSize: typography.bodySm.fontSize,
    fontWeight: '400',
    color: colors.mute,
  },
  infoBox: {
    backgroundColor: colors.canvasSoft,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: rounded.card,
    padding: spacing.lg,
  },
  infoTitle: {
    fontSize: typography.bodyMdStrong.fontSize,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 4,
  },
  infoText: {
    fontSize: typography.bodyMd.fontSize,
    fontWeight: '400',
    color: colors.mute,
    lineHeight: typography.bodyMd.lineHeight,
  },
});
