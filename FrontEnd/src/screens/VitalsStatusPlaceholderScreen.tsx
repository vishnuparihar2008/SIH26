import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { LargeButton } from '@/components/LargeButton';
import { colors, typography, spacing, layout } from '@/theme/theme';

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
  const [lastAction, setLastAction] = useState<string>('System Normal. Monitoring vitals.');

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
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Health & Safety Status</Text>
      <Text style={styles.subheading}>Companion BLE Wearable Monitor</Text>

      {/* BLE Status Card */}
      <View style={styles.statusCard}>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Wearable Status:</Text>
          <View style={styles.connectionBadge}>
            <Text style={styles.badgeText}>
              {vitals.bleConnected ? '🟢 BLE Connected (ESP32)' : '🔴 Disconnected'}
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
          <Text style={styles.tierText}>
            Status: {vitals.tier.toUpperCase()} — {lastAction}
          </Text>
        </View>
      </View>

      {/* Simulation Triggers for Testing */}
      <Text style={styles.sectionHeading}>Emergency Simulation Controls (Demo Fallback)</Text>
      <Text style={styles.sectionCaption}>
        Test airplane-mode emergency actions without physical hardware triggers:
      </Text>

      <LargeButton
        label="Simulate Normal Vitals"
        onPress={() => handleSimulateTier('normal')}
        variant="default"
      />
      <LargeButton
        label="Simulate Low Alert (SMS to Caregiver)"
        onPress={() => handleSimulateTier('low')}
        variant="default"
      />
      <LargeButton
        label="Simulate High Alert (Continuous Phone Call)"
        onPress={() => handleSimulateTier('high')}
        variant="incorrect"
      />
      <LargeButton
        label="Simulate Lethal / Fall Alert (Local Siren Alarm)"
        onPress={() => handleSimulateTier('lethal')}
        variant="incorrect"
      />
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
  statusCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 2,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statusLabel: {
    fontSize: typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  connectionBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 14,
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
    backgroundColor: '#FFFFFF',
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.sm,
    alignItems: 'center',
  },
  vitalIcon: {
    fontSize: 28,
    marginBottom: 2,
  },
  vitalValue: {
    fontSize: typography.heading,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  vitalValueText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  vitalUnit: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  tierBanner: {
    backgroundColor: '#EBF3FA',
    borderRadius: 8,
    padding: spacing.sm,
  },
  tierLow: {
    backgroundColor: '#FFF3E0',
  },
  tierHigh: {
    backgroundColor: '#FFEBEE',
  },
  tierLethal: {
    backgroundColor: '#FFCDD2',
  },
  tierText: {
    fontSize: typography.caption,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  sectionHeading: {
    fontSize: typography.heading,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  sectionCaption: {
    fontSize: typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
});

