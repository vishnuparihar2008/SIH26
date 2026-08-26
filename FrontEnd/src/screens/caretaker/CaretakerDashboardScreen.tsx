import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, typography, spacing, rounded, shadows } from '@/theme/theme';
import { useAuth } from '@/context/AuthContext';
import { patientApi, type Patient, ApiError } from '@/services/api';
import type { CaretakerStackParamList } from '@/navigation/AppNavigator';

type Props = NativeStackScreenProps<CaretakerStackParamList, 'CaretakerDashboard'>;

// ─── Vitals status config ─────────────────────────────────────────────────────

const TIER_CONFIG = {
  normal: { label: 'Normal', color: colors.success, bg: '#EBF7EF' },
  low: { label: 'Low', color: '#D97706', bg: '#FFFBEB' },
  high: { label: 'High', color: '#EA580C', bg: '#FFF7ED' },
  lethal: { label: 'Critical', color: colors.error, bg: '#FFF0ED' },
} as const;

function getTimeSince(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CaretakerDashboardScreen({ navigation }: Props) {
  const { user, logout } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPatients = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    setError(null);
    try {
      const res = await patientApi.list();
      setPatients(res.data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to load patients. Check your connection.');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchPatients(true);
  };

  // ─── Render states ──────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading patients…</Text>
      </View>
    );
  }

  // ─── Main render ────────────────────────────────────────────────────────────

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
      {/* Dashboard Header */}
      <View style={styles.dashHeader}>
        <View style={styles.dashHeaderText}>
          <Text style={styles.greeting}>
            👋 Hello, {user?.name?.split(' ')[0] ?? 'Caretaker'}
          </Text>
          <Text style={styles.dashSubtitle}>
            {patients.length} patient{patients.length !== 1 ? 's' : ''} under your care
          </Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.logoutButton, pressed && { opacity: 0.7 }]}
          onPress={logout}
          accessibilityRole="button"
          accessibilityLabel="Sign out"
        >
          <Text style={styles.logoutText}>Sign out</Text>
        </Pressable>
      </View>

      {/* Summary Stats Strip */}
      {patients.length > 0 && (
        <View style={styles.statsStrip}>
          <StatBadge
            icon="✅"
            label="Active"
            value={patients.filter(p => p.status === 'active').length}
          />
          <StatBadge
            icon="⚠️"
            label="High risk"
            value={
              patients.filter(p =>
                p.vitalsMonitoring?.currentVitals?.tier === 'high' ||
                p.vitalsMonitoring?.currentVitals?.tier === 'lethal',
              ).length
            }
            highlight
          />
          <StatBadge
            icon="🎮"
            label="Played today"
            value={
              patients.filter(p => {
                if (!p.gameStats?.lastPlayedAt) return false;
                const diff = Date.now() - new Date(p.gameStats.lastPlayedAt).getTime();
                return diff < 24 * 60 * 60 * 1000;
              }).length
            }
          />
        </View>
      )}

      {/* Error Banner */}
      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
          <Pressable onPress={() => fetchPatients()}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      )}

      {/* Patient List */}
      {patients.length === 0 && !error ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🏥</Text>
          <Text style={styles.emptyTitle}>No patients yet</Text>
          <Text style={styles.emptySubtitle}>
            Add a patient to start monitoring their care and progress.
          </Text>
        </View>
      ) : (
        <View style={styles.patientList}>
          <Text style={styles.sectionTitle}>Patient Overview</Text>
          {patients.map(patient => (
            <PatientCard key={patient._id} patient={patient} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatBadge({
  icon,
  label,
  value,
  highlight = false,
}: {
  icon: string;
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <View style={[statStyles.badge, highlight && value > 0 && statStyles.badgeHighlight]}>
      <Text style={statStyles.icon}>{icon}</Text>
      <Text style={[statStyles.value, highlight && value > 0 && statStyles.valueHighlight]}>
        {value}
      </Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  badge: {
    flex: 1,
    backgroundColor: colors.canvasSoft,
    borderRadius: rounded.md,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  badgeHighlight: {
    backgroundColor: '#FFF0ED',
  },
  icon: { fontSize: 20, marginBottom: 2 },
  value: {
    fontSize: typography.displayMd.fontSize,
    fontWeight: '700',
    color: colors.ink,
  },
  valueHighlight: {
    color: colors.error,
  },
  label: {
    fontSize: typography.caption.fontSize,
    color: colors.mute,
    marginTop: 2,
  },
});

function PatientCard({ patient }: { patient: Patient }) {
  const tier = patient.vitalsMonitoring?.currentVitals?.tier ?? 'normal';
  const tierCfg = TIER_CONFIG[tier];

  return (
    <View style={cardStyles.card}>
      {/* Top row: name + vitals badge */}
      <View style={cardStyles.header}>
        <View style={cardStyles.avatar}>
          <Text style={cardStyles.avatarText}>
            {patient.fullName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={cardStyles.nameBlock}>
          <Text style={cardStyles.name}>{patient.fullName}</Text>
          <Text style={cardStyles.meta}>
            {patient.gender !== 'prefer_not_to_say'
              ? `${patient.gender} · `
              : ''}
            {patient.bloodGroup ?? ''}
          </Text>
        </View>
        <View style={[cardStyles.tierBadge, { backgroundColor: tierCfg.bg }]}>
          <Text style={[cardStyles.tierText, { color: tierCfg.color }]}>
            {tierCfg.label}
          </Text>
        </View>
      </View>

      {/* Vitals row */}
      <View style={cardStyles.vitalsRow}>
        <VitalChip
          icon="❤️"
          label="HR"
          value={`${patient.vitalsMonitoring?.currentVitals?.heartRate ?? '--'} bpm`}
        />
        <VitalChip
          icon="🫁"
          label="SpO₂"
          value={`${patient.vitalsMonitoring?.currentVitals?.spO2 ?? '--'}%`}
        />
        <VitalChip
          icon="🏃"
          label="Motion"
          value={patient.vitalsMonitoring?.currentVitals?.motionStatus ?? 'Unknown'}
        />
      </View>

      {/* Divider + stats footer */}
      <View style={cardStyles.footer}>
        <View style={cardStyles.footerItem}>
          <Text style={cardStyles.footerLabel}>🎮 Games played</Text>
          <Text style={cardStyles.footerValue}>
            {patient.gameStats?.totalSessions ?? 0}
          </Text>
        </View>
        <View style={cardStyles.footerItem}>
          <Text style={cardStyles.footerLabel}>📊 Avg score</Text>
          <Text style={cardStyles.footerValue}>
            {patient.gameStats?.averageScore ?? 0}
          </Text>
        </View>
        <View style={cardStyles.footerItem}>
          <Text style={cardStyles.footerLabel}>🕐 Last active</Text>
          <Text style={cardStyles.footerValue}>
            {getTimeSince(patient.gameStats?.lastPlayedAt ?? null)}
          </Text>
        </View>
      </View>

      {/* Medical conditions */}
      {patient.medicalInfo?.conditions?.length > 0 && (
        <View style={cardStyles.conditionsRow}>
          {patient.medicalInfo.conditions.slice(0, 3).map((c, i) => (
            <View key={i} style={cardStyles.conditionPill}>
              <Text style={cardStyles.conditionText}>{c}</Text>
            </View>
          ))}
          {patient.medicalInfo.conditions.length > 3 && (
            <Text style={cardStyles.moreConditions}>
              +{patient.medicalInfo.conditions.length - 3} more
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

function VitalChip({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={vitalStyles.chip}>
      <Text style={vitalStyles.icon}>{icon}</Text>
      <Text style={vitalStyles.label}>{label}</Text>
      <Text style={vitalStyles.value}>{value}</Text>
    </View>
  );
}

const vitalStyles = StyleSheet.create({
  chip: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  icon: { fontSize: 14 },
  label: {
    fontSize: 10,
    color: colors.mute,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: typography.bodySmStrong.fontSize,
    fontWeight: '700',
    color: colors.ink,
  },
});

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.canvas,
    borderRadius: rounded.card,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: spacing.md,
    gap: spacing.md,
    ...shadows.softFloat,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: rounded.full,
    backgroundColor: colors.canvasSoft,
    borderWidth: 1,
    borderColor: colors.hairline,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.ink,
  },
  nameBlock: {
    flex: 1,
  },
  name: {
    fontSize: typography.bodyMdStrong.fontSize,
    fontWeight: '700',
    color: colors.ink,
  },
  meta: {
    fontSize: typography.bodySm.fontSize,
    color: colors.mute,
    marginTop: 2,
  },
  tierBadge: {
    borderRadius: rounded.pill,
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
  },
  tierText: {
    fontSize: typography.bodySmStrong.fontSize,
    fontWeight: '700',
  },
  vitalsRow: {
    flexDirection: 'row',
    backgroundColor: colors.canvasSoft,
    borderRadius: rounded.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.canvasSoft,
    paddingTop: spacing.sm,
  },
  footerItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  footerLabel: {
    fontSize: typography.caption.fontSize,
    color: colors.mute,
  },
  footerValue: {
    fontSize: typography.bodySmStrong.fontSize,
    fontWeight: '700',
    color: colors.ink,
  },
  conditionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  conditionPill: {
    backgroundColor: colors.canvasSoft,
    borderRadius: rounded.pill,
    paddingHorizontal: spacing.xs,
    paddingVertical: 3,
  },
  conditionText: {
    fontSize: typography.caption.fontSize,
    color: colors.mute,
  },
  moreConditions: {
    fontSize: typography.caption.fontSize,
    color: colors.mute,
    alignSelf: 'center',
  },
});

// ─── Screen styles ────────────────────────────────────────────────────────────

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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.canvas,
  },
  loadingText: {
    fontSize: typography.bodyMd.fontSize,
    color: colors.mute,
  },

  dashHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  dashHeaderText: {
    flex: 1,
  },
  greeting: {
    fontSize: typography.displaySm.fontSize,
    fontWeight: '700',
    color: colors.ink,
  },
  dashSubtitle: {
    fontSize: typography.bodyMd.fontSize,
    color: colors.mute,
    marginTop: 4,
  },
  logoutButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: rounded.pill,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.canvas,
  },
  logoutText: {
    fontSize: typography.bodySm.fontSize,
    color: colors.mute,
    fontWeight: '700',
  },

  statsStrip: {
    flexDirection: 'row',
    gap: spacing.sm,
  },

  errorBox: {
    backgroundColor: '#FFF0ED',
    borderRadius: rounded.md,
    padding: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    color: colors.error,
    fontSize: typography.bodyMd.fontSize,
    flex: 1,
  },
  retryText: {
    color: colors.ink,
    fontWeight: '700',
    fontSize: typography.bodyMd.fontSize,
    marginLeft: spacing.sm,
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['4xl'],
    gap: spacing.sm,
  },
  emptyIcon: { fontSize: 56 },
  emptyTitle: {
    fontSize: typography.displaySm.fontSize,
    fontWeight: '700',
    color: colors.ink,
  },
  emptySubtitle: {
    fontSize: typography.bodyMd.fontSize,
    color: colors.mute,
    textAlign: 'center',
    lineHeight: typography.bodyMd.lineHeight,
    maxWidth: 280,
  },

  patientList: {
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.displaySm.fontSize,
    fontWeight: '700',
    color: colors.ink,
  },
});
