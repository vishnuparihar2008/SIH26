import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, typography, spacing, rounded, shadows } from '@/theme/theme';
import { useAuth } from '@/context/AuthContext';
import { reminderService } from '@/services/reminderService';
import { vitalsService, TIER_ACTIONS } from '@/services/vitalsService';
import { localStore } from '@/services/storage';
import type { RootStackParamList } from '@/navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const { user } = useAuth();
  const patientId = (user?.patientProfile as any)?._id || user?.id || 'default-patient';

  const [adherence, setAdherence] = useState(() => reminderService.getAdherenceStats(patientId));
  const [latestVital, setLatestVital] = useState(() => vitalsService.getLatestReading(patientId));

  useEffect(() => {
    const update = () => {
      setAdherence(reminderService.getAdherenceStats(patientId));
      setLatestVital(vitalsService.getLatestReading(patientId));
    };
    update();
    const un1 = localStore.subscribe('reminders', update);
    const un2 = localStore.subscribe('vitals_readings', update);
    return () => {
      un1();
      un2();
    };
  }, [patientId]);

  const tierInfo = TIER_ACTIONS[latestVital.tier] || TIER_ACTIONS.normal;

  const HOME_MODULES = [
    {
      id: 'games',
      title: 'Cognitive Memory Games',
      description: 'Personal memory albums, routine sequencer, and focus exercises.',
      icon: '🎮',
      route: 'GamesCatalog' as keyof RootStackParamList,
      tag: '6 Games Active',
      category: 'Brain Health · Adaptive Engine',
    },
    {
      id: 'reminders',
      title: 'Daily Care Reminders',
      description:
        adherence.total > 0
          ? `${adherence.completed} of ${adherence.total} completed (${adherence.percentage}% adherence)`
          : 'Medicine, hydration, and daily routine scheduled offline alerts.',
      icon: '⏰',
      route: 'Reminders' as keyof RootStackParamList,
      category: 'Schedule · Offline Active',
      tag: adherence.completed === adherence.total && adherence.total > 0 ? '✓ All Done' : undefined,
    },
    {
      id: 'voice',
      title: 'Offline Voice Assistant',
      description: 'Speak in your regional language with push-to-talk speech AI.',
      icon: '🎙️',
      route: 'VoiceAssist' as keyof RootStackParamList,
      isNew: true,
      category: 'Vosk STT · Piper TTS',
    },
    {
      id: 'vitals',
      title: 'Health & Wearable Vitals',
      description: `Telemetry: ${latestVital.heartRate || 72} bpm, SpO₂ ${latestVital.spO2 || 98}% · Tier: ${tierInfo.badgeLabel}`,
      icon: '❤️',
      route: 'VitalsStatus' as keyof RootStackParamList,
      category: 'BLE Companion · 3 Alert Tiers',
      tag: latestVital.tier !== 'normal' ? '⚠️ Alert Active' : undefined,
    },
  ];
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      accessibilityLabel="Cognitive Care Home Portal"
      showsVerticalScrollIndicator={false}
    >
      {/* Airbnb Hero Search Bar */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Search activities and games"
        onPress={() => navigation.navigate('GamesCatalog')}
        style={({ pressed }) => [styles.searchBar, pressed && styles.searchBarPressed]}
      >
        <View style={styles.searchFields}>
          <Text style={styles.searchTitle}>What would you like to practice?</Text>
          <Text style={styles.searchSubtitle}>Memory · Daily Routine · Voice Care</Text>
        </View>
        <View style={styles.searchButton}>
          <Text style={styles.searchButtonIcon}>🔍</Text>
        </View>
      </Pressable>

      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.heading}>Recommended for today</Text>
        <Text style={styles.subheading}>
          Tailored daily cognitive and health care routines
        </Text>
      </View>

      {/* Listing Cards Grid */}
      <View style={styles.grid}>
        {HOME_MODULES.map(module => (
          <Pressable
            key={module.id}
            accessibilityRole="button"
            accessibilityLabel={`${module.title}. ${module.description}`}
            onPress={() => navigation.navigate(module.route as any)}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          >
            <View style={styles.visualContainer}>
              <Text style={styles.tileIcon}>{module.icon}</Text>
              {module.isNew ? (
                <View style={styles.newBadge}>
                  <Text style={styles.newBadgeText}>NEW</Text>
                </View>
              ) : module.tag ? (
                <View style={styles.badgePill}>
                  <Text style={styles.badgePillText}>{module.tag}</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.cardBody}>
              <Text style={styles.categoryText}>{module.category}</Text>
              <Text style={styles.cardTitle}>{module.title}</Text>
              <Text style={styles.cardDescription} numberOfLines={2}>
                {module.description}
              </Text>
              <View style={styles.cardFooter}>
                <Text style={styles.ctaLabel}>Start exercise</Text>
                <View style={styles.arrowCircle}>
                  <Text style={styles.arrowIcon}>→</Text>
                </View>
              </View>
            </View>
          </Pressable>
        ))}
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
  // Airbnb Hero Search Bar
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: rounded.button,
    paddingLeft: spacing.lg,
    paddingRight: spacing.xs,
    paddingVertical: spacing.xs,
    marginBottom: spacing.xl,
    ...shadows.softFloat,
  },
  searchBarPressed: {
    borderColor: colors.ink,
    transform: [{ scale: 0.99 }],
  },
  searchFields: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: spacing.xxs,
  },
  searchTitle: {
    fontSize: typography.bodyMdStrong.fontSize,
    fontWeight: '700',
    color: colors.ink,
  },
  searchSubtitle: {
    fontSize: typography.bodySm.fontSize,
    fontWeight: '400',
    color: colors.mute,
    marginTop: 2,
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: rounded.full,
    backgroundColor: colors.primary, // Rausch coral-pink
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonIcon: {
    fontSize: 18,
  },

  // Section Headers
  sectionHeader: {
    marginBottom: spacing.lg,
  },
  heading: {
    fontSize: typography.displayLg.fontSize,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 4,
    letterSpacing: 0,
  },
  subheading: {
    fontSize: typography.bodyLg.fontSize,
    fontWeight: '400',
    color: colors.mute,
    lineHeight: typography.bodyLg.lineHeight,
  },

  // Listing Cards
  grid: {
    gap: spacing.lg,
  },
  card: {
    backgroundColor: colors.canvas,
    borderRadius: rounded.card,
    borderWidth: 1,
    borderColor: colors.hairline,
    overflow: 'hidden',
    ...shadows.softFloat,
  },
  cardPressed: {
    borderColor: colors.ink,
    transform: [{ scale: 0.99 }],
  },
  visualContainer: {
    height: 130,
    backgroundColor: colors.canvasSoft,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  tileIcon: {
    fontSize: 52,
  },
  badgePill: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: rounded.button,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    ...shadows.softFloat,
  },
  badgePillText: {
    fontSize: typography.bodySmStrong.fontSize,
    fontWeight: '700',
    color: colors.ink,
  },
  newBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: colors.newBadgeBg,
    borderRadius: rounded.pill,
    paddingHorizontal: spacing.xs,
    paddingVertical: 3,
  },
  newBadgeText: {
    fontSize: typography.bodySmStrong.fontSize,
    fontWeight: '700',
    color: colors.newBadgeText,
    letterSpacing: 0.5,
  },
  cardBody: {
    padding: spacing.lg,
  },
  categoryText: {
    fontSize: typography.bodySm.fontSize,
    fontWeight: '400',
    color: colors.mute,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: typography.displaySm.fontSize,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: typography.bodyMd.fontSize,
    fontWeight: '400',
    color: colors.mute,
    lineHeight: typography.bodyMd.lineHeight,
    marginBottom: spacing.md,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.canvasSoft,
  },
  ctaLabel: {
    fontSize: typography.bodyMdStrong.fontSize,
    fontWeight: '700',
    color: colors.ink,
  },
  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: rounded.full,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.canvas,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowIcon: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.ink,
  },
});

