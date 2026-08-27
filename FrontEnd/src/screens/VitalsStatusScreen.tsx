import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Alert,
  Platform,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, typography, spacing, rounded, shadows } from '@/theme/theme';
import { useAuth } from '@/context/AuthContext';
import { localStore, type LocalVitalReading } from '@/services/storage';
import {
  vitalsService,
  TIER_ACTIONS,
  type VitalTier,
} from '@/services/vitalsService';
import type { PatientStackParamList } from '@/navigation/AppNavigator';

type Props = NativeStackScreenProps<PatientStackParamList, 'VitalsStatus'>;

export function VitalsStatusScreen({ navigation }: Props) {
  const { user } = useAuth();
  const patientId = (user?.patientProfile as any)?._id || user?.id || 'default-patient';

  const [currentVital, setCurrentVital] = useState<LocalVitalReading>(() =>
    vitalsService.getLatestReading(patientId)
  );
  const [history, setHistory] = useState<LocalVitalReading[]>(() =>
    vitalsService.getHistory(patientId)
  );
  const [isSimulating, setIsSimulating] = useState(false);

  const loadVitals = useCallback(() => {
    setCurrentVital(vitalsService.getLatestReading(patientId));
    setHistory(vitalsService.getHistory(patientId));
  }, [patientId]);

  useEffect(() => {
    loadVitals();
    const unsubscribe = localStore.subscribe('vitals_readings', loadVitals);
    return unsubscribe;
  }, [loadVitals]);

  const handleSimulate = async (tier: VitalTier) => {
    setIsSimulating(true);
    const reading = await vitalsService.simulateTier(patientId, tier);
    setCurrentVital(reading);
    loadVitals();
    setIsSimulating(false);

    if (tier === 'lethal') {
      Alert.alert(
        '🚨 EMERGENCY SIREN ALARM ACTIVATED',
        'Lethal tier vitals breach / Fall detected! Local full-volume siren, vibration, and full-screen SOS triggered without requiring network connectivity.',
        [{ text: 'Dismiss Alarm', style: 'cancel' }]
      );
    } else if (tier === 'high') {
      Alert.alert(
        '📞 HIGH EMERGENCY ALERT',
        'High deviation sustained. Continuous automated calling to caregiver intent triggered with retry logic.',
        [{ text: 'OK' }]
      );
    } else if (tier === 'low') {
      Alert.alert(
        '📱 GSM SMS ALERT SENT',
        'Low deviation sustained. Cellular SMS sent to caregiver phone number via Android SmsManager.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleSOS = () => {
    Alert.alert(
      '🆘 MANUAL SOS TRIGGERED',
      'Contacting primary caregiver and sounding local assistance alarm.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Trigger Full Alarm',
          style: 'destructive',
          onPress: () => handleSimulate('lethal'),
        },
      ]
    );
  };

  const tierInfo = TIER_ACTIONS[currentVital.tier] || TIER_ACTIONS.normal;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Health & Safety Monitor</Text>
        <Text style={styles.subtitle}>
          Real-time wearable vitals & offline emergency response
        </Text>
      </View>

      {/* Main Risk Tier Status Banner */}
      <View style={[styles.tierCard, { backgroundColor: tierInfo.bgColor, borderColor: tierInfo.color }]}>
        <View style={styles.tierHeader}>
          <View style={[styles.tierBadge, { backgroundColor: tierInfo.color }]}>
            <Text style={styles.tierBadgeText}>{tierInfo.badgeLabel}</Text>
          </View>
          <Text style={styles.lastUpdatedText}>
            Updated {new Date(currentVital.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        <Text style={[styles.tierTitle, { color: tierInfo.color }]}>
          {tierInfo.title}
        </Text>
        <Text style={styles.tierActionText}>{tierInfo.actionText}</Text>
        <View style={styles.networkBadge}>
          <Text style={styles.networkText}>📶 {tierInfo.networkRequired}</Text>
        </View>
      </View>

      {/* Telemetry Metric Cards */}
      <View style={styles.metricsGrid}>
        {/* Heart Rate */}
        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <Text style={styles.metricIcon}>❤️</Text>
            <Text style={styles.metricLabel}>Heart Rate</Text>
          </View>
          <Text style={styles.metricValue}>
            {currentVital.heartRate ? `${currentVital.heartRate}` : '--'}
            <Text style={styles.metricUnit}> bpm</Text>
          </Text>
          <Text style={styles.metricRange}>Normal: 60 – 100</Text>
        </View>

        {/* SpO2 */}
        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <Text style={styles.metricIcon}>🫁</Text>
            <Text style={styles.metricLabel}>Blood Oxygen</Text>
          </View>
          <Text style={styles.metricValue}>
            {currentVital.spO2 ? `${currentVital.spO2}` : '--'}
            <Text style={styles.metricUnit}> %</Text>
          </Text>
          <Text style={styles.metricRange}>Normal: 95 – 100%</Text>
        </View>

        {/* Motion Status */}
        <View style={[styles.metricCard, styles.metricCardFull]}>
          <View style={styles.metricHeader}>
            <Text style={styles.metricIcon}>🏃</Text>
            <Text style={styles.metricLabel}>Motion & Fall Detection</Text>
          </View>
          <Text style={[styles.metricValue, currentVital.motionStatus === 'Fall Detected' && { color: colors.error }]}>
            {currentVital.motionStatus || 'Normal'}
          </Text>
          <Text style={styles.metricRange}>
            {currentVital.motionStatus === 'Fall Detected'
              ? '⚠️ Immediate fall impact registered'
              : 'Accelerometer active · Zero fall events'}
          </Text>
        </View>
      </View>

      {/* Emergency Action Plan Reference */}
      <View style={styles.actionPlanCard}>
        <Text style={styles.sectionHeading}>Tiered Offline Response Matrix</Text>
        <View style={styles.tierRow}>
          <Text style={styles.tierDot}>🟢</Text>
          <View style={styles.tierRowContent}>
            <Text style={styles.tierRowTitle}>Normal (Resting)</Text>
            <Text style={styles.tierRowDesc}>Safe continuous telemetry to local store.</Text>
          </View>
        </View>
        <View style={styles.tierRow}>
          <Text style={styles.tierDot}>🟡</Text>
          <View style={styles.tierRowContent}>
            <Text style={styles.tierRowTitle}>Tier 1: Low Deviation</Text>
            <Text style={styles.tierRowDesc}>Automatic GSM SMS via cellular antenna (no data plan needed).</Text>
          </View>
        </View>
        <View style={styles.tierRow}>
          <Text style={styles.tierDot}>🟠</Text>
          <View style={styles.tierRowContent}>
            <Text style={styles.tierRowTitle}>Tier 2: High Alert</Text>
            <Text style={styles.tierRowDesc}>Continuous auto-dial voice call to caregiver with retry.</Text>
          </View>
        </View>
        <View style={styles.tierRow}>
          <Text style={styles.tierDot}>🔴</Text>
          <View style={styles.tierRowContent}>
            <Text style={styles.tierRowTitle}>Tier 3: Lethal / Fall Detected</Text>
            <Text style={styles.tierRowDesc}>Full-volume siren alarm + vibration + full-screen SOS (0% signal needed).</Text>
          </View>
        </View>
      </View>

      {/* Simulated Vitals Controls (Demo / Hardware Fallback) */}
      <View style={styles.simCard}>
        <Text style={styles.simTitle}>🧪 Simulated Vitals & Demo Triggers</Text>
        <Text style={styles.simSubtitle}>
          Test the tiered emergency action engine offline in Airplane Mode:
        </Text>
        <View style={styles.simButtonsGrid}>
          <Pressable
            style={[styles.simBtn, { backgroundColor: '#ECFDF5', borderColor: '#059669' }]}
            onPress={() => handleSimulate('normal')}
            disabled={isSimulating}
          >
            <Text style={[styles.simBtnText, { color: '#059669' }]}>🟢 Normal</Text>
          </Pressable>
          <Pressable
            style={[styles.simBtn, { backgroundColor: '#FFFBEB', borderColor: '#D97706' }]}
            onPress={() => handleSimulate('low')}
            disabled={isSimulating}
          >
            <Text style={[styles.simBtnText, { color: '#D97706' }]}>🟡 Low Tier</Text>
          </Pressable>
          <Pressable
            style={[styles.simBtn, { backgroundColor: '#FFF7ED', borderColor: '#EA580C' }]}
            onPress={() => handleSimulate('high')}
            disabled={isSimulating}
          >
            <Text style={[styles.simBtnText, { color: '#EA580C' }]}>🟠 High Tier</Text>
          </Pressable>
          <Pressable
            style={[styles.simBtn, { backgroundColor: '#FFF0ED', borderColor: '#FF385C' }]}
            onPress={() => handleSimulate('lethal')}
            disabled={isSimulating}
          >
            <Text style={[styles.simBtnText, { color: '#FF385C' }]}>🔴 Critical / Fall</Text>
          </Pressable>
        </View>
      </View>

      {/* SOS Manual Button */}
      <Pressable
        style={({ pressed }) => [
          styles.sosBtn,
          pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 },
        ]}
        onPress={handleSOS}
        accessibilityRole="button"
        accessibilityLabel="Emergency SOS button"
      >
        <Text style={styles.sosIcon}>🆘</Text>
        <Text style={styles.sosText}>EMERGENCY SOS</Text>
        <Text style={styles.sosSubtext}>Tap to sound alarm & alert family</Text>
      </Pressable>
    </ScrollView>
  );
}

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

  // Tier Card
  tierCard: {
    borderRadius: rounded.card,
    padding: spacing.md,
    gap: spacing.xs,
    borderWidth: 1.5,
    ...shadows.softFloat,
  },
  tierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tierBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 3,
    borderRadius: rounded.pill,
  },
  tierBadgeText: {
    color: colors.onPrimary,
    fontSize: typography.bodySmStrong.fontSize,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  lastUpdatedText: {
    fontSize: typography.caption.fontSize,
    color: colors.mute,
  },
  tierTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  tierActionText: {
    fontSize: typography.bodyMd.fontSize,
    color: colors.ink,
    lineHeight: 20,
  },
  networkBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.06)',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: rounded.pill,
    marginTop: 4,
  },
  networkText: {
    fontSize: typography.caption.fontSize,
    color: colors.ink,
    fontWeight: '700',
  },

  // Metrics Grid
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.canvas,
    borderRadius: rounded.card,
    padding: spacing.md,
    gap: 4,
    borderWidth: 1,
    borderColor: colors.hairline,
    ...shadows.softFloat,
  },
  metricCardFull: {
    minWidth: '100%',
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metricIcon: {
    fontSize: 18,
  },
  metricLabel: {
    fontSize: typography.bodySmStrong.fontSize,
    color: colors.mute,
    fontWeight: '700',
  },
  metricValue: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.ink,
  },
  metricUnit: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.mute,
  },
  metricRange: {
    fontSize: typography.caption.fontSize,
    color: colors.mute,
  },

  // Action Plan
  actionPlanCard: {
    backgroundColor: colors.canvas,
    borderRadius: rounded.card,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  sectionHeading: {
    fontSize: typography.bodyMdStrong.fontSize,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 4,
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  tierDot: {
    fontSize: 14,
    marginTop: 2,
  },
  tierRowContent: {
    flex: 1,
  },
  tierRowTitle: {
    fontSize: typography.bodySmStrong.fontSize,
    fontWeight: '700',
    color: colors.ink,
  },
  tierRowDesc: {
    fontSize: typography.caption.fontSize,
    color: colors.mute,
    lineHeight: 16,
  },

  // Sim Card
  simCard: {
    backgroundColor: colors.canvas,
    borderRadius: rounded.card,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  simTitle: {
    fontSize: typography.bodyMdStrong.fontSize,
    fontWeight: '700',
    color: colors.ink,
  },
  simSubtitle: {
    fontSize: typography.bodySm.fontSize,
    color: colors.mute,
  },
  simButtonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  simBtn: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: rounded.md,
    borderWidth: 1,
  },
  simBtnText: {
    fontSize: typography.bodySmStrong.fontSize,
    fontWeight: '700',
  },

  // SOS Button
  sosBtn: {
    backgroundColor: colors.error,
    borderRadius: rounded.card,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    gap: 4,
    ...shadows.softFloat,
  },
  sosIcon: {
    fontSize: 36,
  },
  sosText: {
    color: colors.onPrimary,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 1,
  },
  sosSubtext: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: typography.bodySm.fontSize,
  },
});

