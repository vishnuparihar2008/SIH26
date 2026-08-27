/**
 * vitalsService.ts — Vitals Threshold Engine & Telemetry Manager for Cognitive Care.
 *
 * Classifies readings into 4 risk tiers:
 *   1. Normal: Within healthy resting baseline (HR 60-100, SpO2 >= 95%)
 *   2. Low: Mild deviation (HR 50-59 or 101-115, SpO2 90-94%) -> Action: Cellular SMS
 *   3. High: Significant deviation (HR 40-49 or 116-135, SpO2 85-89%) -> Action: Automated Calling
 *   4. Lethal: Critical breach or Fall Detected (HR < 40 or > 135, SpO2 < 85%, or Fall) -> Action: Immediate Max Alarm
 *
 * Operates 100% on-device in Airplane Mode with local storage history.
 */

import { localStore, type LocalVitalReading } from './storage';
import { vitalsApi } from './api';

export type VitalTier = 'normal' | 'low' | 'high' | 'lethal';

export interface VitalThresholdConfig {
  heartRate: { minNormal: number; maxNormal: number; minLow: number; maxLow: number; lethalLow: number; lethalHigh: number };
  spO2: { minNormal: number; minLow: number; lethalLow: number };
}

export const DEFAULT_THRESHOLDS: VitalThresholdConfig = {
  heartRate: {
    minNormal: 60,
    maxNormal: 100,
    minLow: 50,
    maxLow: 115,
    lethalLow: 40,
    lethalHigh: 135,
  },
  spO2: {
    minNormal: 95,
    minLow: 90,
    lethalLow: 85,
  },
};

export interface EmergencyActionInfo {
  tier: VitalTier;
  title: string;
  badgeLabel: string;
  color: string;
  bgColor: string;
  actionText: string;
  networkRequired: string;
}

export const TIER_ACTIONS: Record<VitalTier, EmergencyActionInfo> = {
  normal: {
    tier: 'normal',
    title: 'Vitals Healthy & Stable',
    badgeLabel: 'Normal',
    color: '#059669',
    bgColor: '#ECFDF5',
    actionText: 'Continuous on-device telemetry active. All readings within baseline.',
    networkRequired: 'None',
  },
  low: {
    tier: 'low',
    title: 'Mild Vitals Deviation',
    badgeLabel: 'Low Risk',
    color: '#D97706',
    bgColor: '#FFFBEB',
    actionText: 'Tier 1 Escalation: Automated GSM SMS alert queued to primary caregiver.',
    networkRequired: 'GSM SMS (No mobile data needed)',
  },
  high: {
    tier: 'high',
    title: 'Significant Vitals Deviation',
    badgeLabel: 'High Alert',
    color: '#EA580C',
    bgColor: '#FFF7ED',
    actionText: 'Tier 2 Escalation: Continuous automated phone call with retry to caregiver & backup contact.',
    networkRequired: 'Cellular Voice Call',
  },
  lethal: {
    tier: 'lethal',
    title: 'CRITICAL EMERGENCY / FALL',
    badgeLabel: 'CRITICAL',
    color: '#FF385C',
    bgColor: '#FFF0ED',
    actionText: 'Tier 3 Escalation: Immediate on-device 100% volume siren alarm + vibration + full-screen SOS.',
    networkRequired: 'NONE — Operates 100% Offline with zero signal',
  },
};

export const vitalsService = {
  /**
   * Evaluates vitals readings against thresholds and returns the risk tier
   */
  classifyTier(
    heartRate: number,
    spO2: number,
    motionStatus: string,
    config: VitalThresholdConfig = DEFAULT_THRESHOLDS
  ): VitalTier {
    if (motionStatus === 'Fall Detected') {
      return 'lethal';
    }

    // Check Lethal
    if (heartRate <= config.heartRate.lethalLow || heartRate >= config.heartRate.lethalHigh || spO2 < config.spO2.lethalLow) {
      return 'lethal';
    }

    // Check High
    if (heartRate < config.heartRate.minLow || heartRate > config.heartRate.maxLow || spO2 < config.spO2.minLow) {
      return 'high';
    }

    // Check Low deviation
    if (heartRate < config.heartRate.minNormal || heartRate > config.heartRate.maxNormal || spO2 < config.spO2.minNormal) {
      return 'low';
    }

    return 'normal';
  },

  /**
   * Records a new vitals reading, classifies it, persists locally, and attempts sync
   */
  async recordReading(payload: {
    patientId: string;
    heartRate: number;
    spO2: number;
    motionStatus?: string;
    source?: LocalVitalReading['source'];
    notes?: string;
  }): Promise<LocalVitalReading> {
    const motion = payload.motionStatus || 'Normal';
    const tier = this.classifyTier(payload.heartRate, payload.spO2, motion);

    // 1. Save locally
    const saved = localStore.recordVital({
      patientId: payload.patientId,
      heartRate: payload.heartRate,
      spO2: payload.spO2,
      motionStatus: motion,
      tier,
      source: payload.source || 'ble_wearable',
      notes: payload.notes || '',
    });

    // 2. Try online sync or queue
    try {
      await vitalsApi.record(payload.patientId, {
        heartRate: payload.heartRate,
        spO2: payload.spO2,
        motionStatus: motion,
        tier,
        source: payload.source || 'ble_wearable',
        notes: payload.notes,
        recordedAt: saved.recordedAt,
      });
    } catch {
      localStore.queueAction('RECORD_VITAL', `/vitals/patient/${payload.patientId}`, 'POST', {
        heartRate: payload.heartRate,
        spO2: payload.spO2,
        motionStatus: motion,
        tier,
        source: payload.source || 'ble_wearable',
        notes: payload.notes,
        recordedAt: saved.recordedAt,
      });
    }

    return saved;
  },

  /**
   * Generates a simulated reading preset for testing emergency tiers during live demo
   */
  async simulateTier(patientId: string, tier: VitalTier): Promise<LocalVitalReading> {
    let heartRate = 72;
    let spO2 = 98;
    let motionStatus = 'Normal';

    switch (tier) {
      case 'normal':
        heartRate = Math.floor(68 + Math.random() * 10);
        spO2 = Math.floor(96 + Math.random() * 3);
        motionStatus = 'Normal';
        break;
      case 'low':
        heartRate = 108;
        spO2 = 92;
        motionStatus = 'Stationary';
        break;
      case 'high':
        heartRate = 126;
        spO2 = 88;
        motionStatus = 'Stationary';
        break;
      case 'lethal':
        heartRate = 145;
        spO2 = 82;
        motionStatus = 'Fall Detected';
        break;
    }

    return this.recordReading({
      patientId,
      heartRate,
      spO2,
      motionStatus,
      source: 'simulated',
      notes: `Simulated ${tier.toUpperCase()} test reading`,
    });
  },

  /**
   * Fetches latest local reading for patient
   */
  getLatestReading(patientId?: string): LocalVitalReading {
    return localStore.getLatestVital(patientId);
  },

  /**
   * Fetches history of readings stored locally
   */
  getHistory(patientId?: string): LocalVitalReading[] {
    return localStore.getVitals(patientId);
  },
};

