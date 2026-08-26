import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, typography, spacing, layout } from '@/theme/theme';

interface ReminderItem {
  id: string;
  time: string;
  label: string;
  type: 'medicine' | 'hydration' | 'activity';
  icon: string;
}

const SAMPLE_REMINDERS: ReminderItem[] = [
  { id: '1', time: '08:00 AM', label: 'Morning Blood Pressure Medication', type: 'medicine', icon: '💊' },
  { id: '2', time: '11:00 AM', label: 'Drink a Glass of Water', type: 'hydration', icon: '💧' },
  { id: '3', time: '01:30 PM', label: 'After-Lunch Multivitamin', type: 'medicine', icon: '💊' },
  { id: '4', time: '05:00 PM', label: 'Evening Gentle Walk in Garden', type: 'activity', icon: '🚶' },
];

/**
 * Reminders Screen (Techspec §2.1 & Implementation Plan Phase 2).
 * Operates offline using local notifications and SQLite scheduled triggers.
 */
export function RemindersPlaceholderScreen() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Today{"'"}s Reminders</Text>
      <Text style={styles.subheading}>Scheduled alerts that work fully offline</Text>

      {SAMPLE_REMINDERS.map(item => (
        <View key={item.id} style={styles.card}>
          <Text style={styles.icon}>{item.icon}</Text>
          <View style={styles.textContainer}>
            <Text style={styles.time}>{item.time}</Text>
            <Text style={styles.label}>{item.label}</Text>
          </View>
        </View>
      ))}

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          🔒 Offline First: Reminders trigger on-device notifications even with Airplane Mode enabled.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: layout.screenPadding,
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
    marginBottom: spacing.lg,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 2,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  icon: {
    fontSize: 36,
    marginRight: spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  time: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 2,
  },
  label: {
    fontSize: typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  infoBox: {
    backgroundColor: '#EBF3FA',
    borderRadius: 12,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  infoText: {
    fontSize: typography.caption,
    color: colors.textSecondary,
    lineHeight: 24,
  },
});
