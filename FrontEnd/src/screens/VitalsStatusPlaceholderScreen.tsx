import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { LargeButton } from '@/components/LargeButton';
import { colors, typography, spacing, rounded, shadows } from '@/theme/theme';

type AlertTier = 'normal' | 'low' | 'high' | 'lethal';

interface VitalsState {
  heartRate: number; // bpm
  spO2: number; // percentage
  motionStatus: 'Normal' | 'Fall Detected' | 'Resting';
  tier: AlertTier;
  bleConnected: boolean;
}

/**
 * Vitals Status & Emergency Action Layer Screen (Techspec §2.5, §2.6, §2.7 & Phase 5).
 * Connects to BLE ESP32 wearable and provides Simulated-Vitals mode for testing.
 */
export function VitalsStatusPlaceholderScreen() {
  const [vitals, setVitals] = useState<VitalsState>({
    heartRate: 72,
    spO2: 98,
    motionStatus: 'Resting',
    tier: 'normal',
    bleConnected: true,
  });
  const [lastAction, setLastAction] = useState<string>('System normal. Monitoring vitals.');

  function handleSimulateTier(tier: AlertTier) {
    if (tier === 'normal') {
      setVitals({
        heartRate: 74,
        spO2: 98,
        motionStatus: 'Normal',
        tier: 'normal',
        bleConnected: true,
      });
      setLastAction('Normal vitals restored.');
      return;
    }

    if (tier === 'low') {
      setVitals({
        heartRate: 58,
        spO2: 94,
        motionStatus: 'Resting',
        tier: 'low',
        bleConnected: true,
      });
      setLastAction('Tier Low Triggered: Dispatched SMS to caregiver via Android SmsManager.');
      Alert.alert('Tier: Low Alert', 'Dispatched SMS to caregiver contact.');
    } else if (tier === 'high') {
      setVitals({
        heartRate: 125,
        spO2: 89,
        motionStatus: 'Resting',
        tier: 'high',
        bleConnected: true,
      });
      setLastAction('Tier High Triggered: Initiating continuous automated calling retry via Intent.ACTION_CALL.');
      Alert.alert('Tier: High Alert', 'Initiated automated emergency calling loop.');
    } else if (tier === 'lethal') {
      setVitals({
        heartRate: 145,
        spO2: 82,
        motionStatus: 'Fall Detected',
        tier: 'lethal',
        bleConnected: true,
      });
      setLastAction('Tier Lethal: MAX-VOLUME local alarm + full-screen alert + emergency vibration (Zero signal dependency).');
      Alert.alert('🚨 LETHAL ALERT / FALL DETECTED', 'Playing loud continuous audio alarm and vibration.');
    }
  }

  const isLethal = vitals.tier === 'lethal';
  const isHigh = vitals.tier === 'high';
  const isLow = vitals.tier === 'low';

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.heading}>Health & safety status</Text>
        <Text style={styles.subheading}>Companion BLE wearable telemetry monitor</Text>
      </View>

      {/* BLE Status Card */}
      <View style={styles.statusCard}>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Wearable connection</Text>
          <View style={styles.connectionBadge}>
            <Text style={styles.badgeText}>
              {vitals.bleConnected ? '● Connected (ESP32)' : '○ Disconnected'}
            </Text>
          </View>
        </View>

        <View style={styles.vitalsRow}>
          <View style={styles.vitalBox}>
            <Text style={styles.vitalIcon}>❤️</Text>
            <Text style={styles.vitalValue}>{vitals.heartRate}</Text>
            <Text style={styles.vitalUnit}>BPM</Text>
          </View>

          <View style={styles.vitalBox}>
            <Text style={styles.vitalIcon}>🫁</Text>
            <Text style={styles.vitalValue}>{vitals.spO2}%</Text>
            <Text style={styles.vitalUnit}>SpO2</Text>
          </View>

          <View style={styles.vitalBox}>
            <Text style={styles.vitalIcon}>🏃</Text>
            <Text style={styles.vitalValueText}>{vitals.motionStatus}</Text>
            <Text style={styles.vitalUnit}>Motion</Text>
          </View>
        </View>

        <View
          style={[
            styles.tierBanner,
            isLethal && styles.tierLethal,
            isHigh && styles.tierHigh,
            isLow && styles.tierLow,
          ]}
        >
          <Text style={styles.tierStatusTag}>STATUS: {vitals.tier.toUpperCase()}</Text>
          <Text style={styles.tierText}>{lastAction}</Text>
        </View>
      </View>

      {/* Simulation Triggers for Testing */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionHeading}>Emergency simulation controls</Text>
        <Text style={styles.sectionCaption}>
          Test offline protocol triggers without physical hardware dependencies:
        </Text>
      </View>

      <View style={styles.buttonList}>
        <LargeButton
          label="Simulate Normal Vitals"
          onPress={() => handleSimulateTier('normal')}
          variant="secondary"
        />
        <LargeButton
          label="Simulate Low Alert (Caregiver SMS)"
          onPress={() => handleSimulateTier('low')}
          variant="secondary"
        />
        <LargeButton
          label="Simulate High Alert (Continuous Phone Call)"
          onPress={() => handleSimulateTier('high')}
          variant="primary"
        />
        <LargeButton
          label="Simulate Lethal / Fall Alert (Local Siren)"
          onPress={() => handleSimulateTier('lethal')}
          variant="incorrect"
        />
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
  statusCard: {
    backgroundColor: colors.canvas,
    borderColor: colors.hairline,
    borderWidth: 1,
    borderRadius: rounded.card,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    ...shadows.softFloat,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statusLabel: {
    fontSize: typography.bodySmStrong.fontSize,
    fontWeight: '700',
    color: colors.ink,
  },
  connectionBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: rounded.button,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2E7D32',
  },
  vitalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  vitalBox: {
    flex: 1,
    backgroundColor: colors.canvasSoft,
    borderColor: colors.hairline,
    borderWidth: 1,
    borderRadius: rounded.md,
    padding: spacing.sm,
    alignItems: 'center',
  },
  vitalIcon: {
    fontSize: 24,
    marginBottom: 2,
  },
  vitalValue: {
    fontSize: typography.displaySm.fontSize,
    fontWeight: '700',
    color: colors.ink,
  },
  vitalValueText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.ink,
    textAlign: 'center',
  },
  vitalUnit: {
    fontSize: 11,
    fontWeight: '400',
    color: colors.mute,
    marginTop: 2,
  },
  tierBanner: {
    backgroundColor: colors.canvasSoft,
    borderRadius: rounded.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: spacing.md,
  },
  tierLow: {
    backgroundColor: '#FFF8E1',
    borderColor: '#FFE082',
  },
  tierHigh: {
    backgroundColor: '#FFEBEE',
    borderColor: '#FFCDD2',
  },
  tierLethal: {
    backgroundColor: '#FFCDD2',
    borderColor: colors.error,
  },
  tierStatusTag: {
    fontSize: typography.bodySmStrong.fontSize,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 2,
  },
  tierText: {
    fontSize: typography.bodySm.fontSize,
    fontWeight: '400',
    color: colors.ink,
    lineHeight: 18,
  },
  sectionHeader: {
    marginBottom: spacing.sm,
  },
  sectionHeading: {
    fontSize: typography.displaySm.fontSize,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 4,
  },
  sectionCaption: {
    fontSize: typography.bodyMd.fontSize,
    fontWeight: '400',
    color: colors.mute,
    lineHeight: typography.bodyMd.lineHeight,
  },
  buttonList: {
    gap: spacing.xxs,
  },
});

