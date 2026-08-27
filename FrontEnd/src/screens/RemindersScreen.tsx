import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  RefreshControl,
  Alert,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, typography, spacing, rounded, shadows } from '@/theme/theme';
import { useAuth } from '@/context/AuthContext';
import { localStore, type LocalReminder } from '@/services/storage';
import {
  reminderService,
  REMINDER_TYPE_META,
  type GroupedReminders,
} from '@/services/reminderService';
import type { PatientStackParamList } from '@/navigation/AppNavigator';

type Props = NativeStackScreenProps<PatientStackParamList, 'Reminders'>;

export function RemindersScreen({ navigation }: Props) {
  const { user } = useAuth();
  const patientId = (user?.patientProfile as any)?._id || user?.id || 'default-patient';

  const [groupedReminders, setGroupedReminders] = useState<GroupedReminders[]>([]);
  const [adherence, setAdherence] = useState({ completed: 0, total: 0, percentage: 100 });
  const [filterPendingOnly, setFilterPendingOnly] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = useCallback(() => {
    const groups = reminderService.getGroupedReminders(patientId);
    setGroupedReminders(groups);
    setAdherence(reminderService.getAdherenceStats(patientId));
  }, [patientId]);

  useEffect(() => {
    loadData();
    const unsubscribe = localStore.subscribe('reminders', loadData);
    // Opportunistically sync from server in background
    reminderService.syncFromServer(patientId);
    return unsubscribe;
  }, [loadData, patientId]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await reminderService.syncFromServer(patientId);
    loadData();
    setIsRefreshing(false);
  };

  const handleAcknowledge = async (item: LocalReminder) => {
    if (item.acknowledgedAt) return; // Already acknowledged

    await reminderService.acknowledge(item._id);
    loadData();
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor={colors.primary}
        />
      }
    >
      {/* Header Banner */}
      <View style={styles.header}>
        <Text style={styles.title}>Daily Care Reminders</Text>
        <Text style={styles.subtitle}>
          Everything scheduled for your health and comfort today
        </Text>
      </View>

      {/* Daily Adherence Card */}
      <View style={styles.adherenceCard}>
        <View style={styles.adherenceLeft}>
          <Text style={styles.adherenceIcon}>🌟</Text>
          <View>
            <Text style={styles.adherenceTitle}>
              {adherence.completed === adherence.total && adherence.total > 0
                ? 'All Done for Today!'
                : `${adherence.completed} of ${adherence.total} Completed`}
            </Text>
            <Text style={styles.adherenceSub}>
              {adherence.percentage}% adherence today
            </Text>
          </View>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${adherence.percentage}%` }]} />
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabRow}>
        <Pressable
          style={[styles.tabPill, !filterPendingOnly && styles.tabPillActive]}
          onPress={() => setFilterPendingOnly(false)}
          accessibilityRole="button"
        >
          <Text style={[styles.tabText, !filterPendingOnly && styles.tabTextActive]}>
            All Tasks ({adherence.total})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tabPill, filterPendingOnly && styles.tabPillActive]}
          onPress={() => setFilterPendingOnly(true)}
          accessibilityRole="button"
        >
          <Text style={[styles.tabText, filterPendingOnly && styles.tabTextActive]}>
            To Do ({adherence.total - adherence.completed})
          </Text>
        </Pressable>
      </View>

      {/* Grouped Lists */}
      {groupedReminders.map((section) => {
        const displayedItems = filterPendingOnly
          ? section.items.filter((i) => !i.acknowledgedAt)
          : section.items;

        if (displayedItems.length === 0 && filterPendingOnly) return null;

        return (
          <View key={section.group} style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>{section.icon}</Text>
              <Text style={styles.sectionTitle}>{section.group}</Text>
              <Text style={styles.sectionTime}>{section.timeRange}</Text>
            </View>

            {displayedItems.length === 0 ? (
              <View style={styles.emptySectionBox}>
                <Text style={styles.emptySectionText}>No tasks for {section.group.toLowerCase()}</Text>
              </View>
            ) : (
              <View style={styles.cardsList}>
                {displayedItems.map((item) => (
                  <ReminderCard
                    key={item._id}
                    item={item}
                    onAcknowledge={() => handleAcknowledge(item)}
                  />
                ))}
              </View>
            )}
          </View>
        );
      })}

      {/* Offline Guarantee Notice */}
      <View style={styles.offlineNotice}>
        <Text style={styles.offlineNoticeIcon}>✈️ 📶</Text>
        <Text style={styles.offlineNoticeText}>
          Works 100% in Airplane Mode. All your reminders, medications, and schedules are stored securely on this device.
        </Text>
      </View>
    </ScrollView>
  );
}

// ─── Sub-Component: Reminder Card ─────────────────────────────────────────────

function ReminderCard({
  item,
  onAcknowledge,
}: {
  item: LocalReminder;
  onAcknowledge: () => void;
}) {
  const meta = REMINDER_TYPE_META[item.type] || REMINDER_TYPE_META.other;
  const isDone = Boolean(item.acknowledgedAt);

  return (
    <View style={[styles.card, isDone && styles.cardDone]}>
      {/* Top row: Type badge + Time */}
      <View style={styles.cardHeader}>
        <View style={[styles.badge, { backgroundColor: meta.bg }]}>
          <Text style={styles.badgeIcon}>{meta.icon}</Text>
          <Text style={[styles.badgeText, { color: meta.color }]}>{meta.label}</Text>
        </View>
        <Text style={styles.timeText}>{item.timeStr}</Text>
      </View>

      {/* Title & Description */}
      <Text style={[styles.cardTitle, isDone && styles.textCrossed]}>
        {item.title}
      </Text>
      {item.description ? (
        <Text style={[styles.cardDesc, isDone && styles.textCrossed]}>
          {item.description}
        </Text>
      ) : null}

      {/* Medication dose pill if present */}
      {item.medication?.name ? (
        <View style={styles.medicationRow}>
          <Text style={styles.medicationText}>
            💊 {item.medication.name} ({item.medication.dosage})
          </Text>
          {item.medication.instructions ? (
            <Text style={styles.medicationNote}>{item.medication.instructions}</Text>
          ) : null}
        </View>
      ) : null}

      {/* Big Action Button */}
      <Pressable
        style={({ pressed }) => [
          styles.actionBtn,
          isDone ? styles.actionBtnDone : styles.actionBtnActive,
          pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
        ]}
        onPress={onAcknowledge}
        disabled={isDone}
        accessibilityRole="button"
        accessibilityLabel={isDone ? 'Completed' : 'Mark as done'}
      >
        <Text style={[styles.actionBtnText, isDone && styles.actionBtnTextDone]}>
          {isDone ? '✓ Completed' : 'Mark as Done  ✓'}
        </Text>
      </Pressable>
    </View>
  );
}

// ─── Styles (Elderly Friendly / Design Token Compliant) ────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvasSoft,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.section,
    gap: spacing.lg,
  },

  // Header
  header: {
    gap: 4,
  },
  title: {
    fontSize: typography.displayLg.fontSize,
    fontWeight: '700',
    color: colors.ink,
  },
  subtitle: {
    fontSize: typography.bodyMd.fontSize,
    color: colors.mute,
  },

  // Adherence Card
  adherenceCard: {
    backgroundColor: colors.canvas,
    borderRadius: rounded.card,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.hairline,
    ...shadows.softFloat,
  },
  adherenceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  adherenceIcon: {
    fontSize: 28,
  },
  adherenceTitle: {
    fontSize: typography.bodyMdStrong.fontSize,
    fontWeight: '700',
    color: colors.ink,
  },
  adherenceSub: {
    fontSize: typography.bodySm.fontSize,
    color: colors.mute,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: colors.canvasSoft,
    borderRadius: rounded.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: rounded.full,
  },

  // Tab Row
  tabRow: {
    flexDirection: 'row',
    backgroundColor: colors.canvas,
    borderRadius: rounded.button,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  tabPill: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: rounded.button - 2,
  },
  tabPillActive: {
    backgroundColor: colors.ink,
  },
  tabText: {
    fontSize: typography.bodySmStrong.fontSize,
    fontWeight: '700',
    color: colors.mute,
  },
  tabTextActive: {
    color: colors.canvas,
  },

  // Sections
  sectionContainer: {
    gap: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: 2,
  },
  sectionIcon: {
    fontSize: 20,
  },
  sectionTitle: {
    fontSize: typography.displaySm.fontSize,
    fontWeight: '700',
    color: colors.ink,
  },
  sectionTime: {
    fontSize: typography.bodySm.fontSize,
    color: colors.mute,
    marginLeft: 'auto',
  },
  emptySectionBox: {
    padding: spacing.md,
    backgroundColor: colors.canvas,
    borderRadius: rounded.md,
    alignItems: 'center',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  emptySectionText: {
    fontSize: typography.bodySm.fontSize,
    color: colors.mute,
  },
  cardsList: {
    gap: spacing.sm,
  },

  // Reminder Card
  card: {
    backgroundColor: colors.canvas,
    borderRadius: rounded.card,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.hairline,
    ...shadows.softFloat,
  },
  cardDone: {
    backgroundColor: '#F9FAF8',
    opacity: 0.85,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.xs,
    paddingVertical: 3,
    borderRadius: rounded.pill,
  },
  badgeIcon: {
    fontSize: 14,
  },
  badgeText: {
    fontSize: typography.bodySmStrong.fontSize,
    fontWeight: '700',
  },
  timeText: {
    fontSize: typography.bodyMdStrong.fontSize,
    fontWeight: '700',
    color: colors.ink,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.ink,
    lineHeight: 26,
  },
  cardDesc: {
    fontSize: typography.bodyMd.fontSize,
    color: colors.mute,
    lineHeight: 20,
  },
  textCrossed: {
    textDecorationLine: 'line-through',
    color: colors.mute,
  },
  medicationRow: {
    backgroundColor: colors.canvasSoft,
    borderRadius: rounded.sm,
    padding: spacing.xs,
    gap: 2,
  },
  medicationText: {
    fontSize: typography.bodySmStrong.fontSize,
    fontWeight: '700',
    color: colors.ink,
  },
  medicationNote: {
    fontSize: typography.caption.fontSize,
    color: colors.mute,
  },

  // Action Button
  actionBtn: {
    minHeight: 52,
    borderRadius: rounded.button,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  actionBtnActive: {
    backgroundColor: colors.primary,
    ...shadows.softFloat,
  },
  actionBtnDone: {
    backgroundColor: '#E2FBE8',
    borderWidth: 1,
    borderColor: '#B7EBC5',
  },
  actionBtnText: {
    fontSize: typography.buttonLg.fontSize,
    fontWeight: '700',
    color: colors.onPrimary,
  },
  actionBtnTextDone: {
    color: '#059669',
  },

  // Offline Notice
  offlineNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#F0F9FF',
    borderRadius: rounded.md,
    padding: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  offlineNoticeIcon: {
    fontSize: 22,
  },
  offlineNoticeText: {
    flex: 1,
    fontSize: typography.bodySm.fontSize,
    color: '#0369A1',
    lineHeight: 18,
  },
});

