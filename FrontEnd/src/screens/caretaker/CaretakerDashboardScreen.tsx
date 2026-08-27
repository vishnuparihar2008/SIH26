import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, typography, spacing, rounded, shadows } from '@/theme/theme';
import { useAuth } from '@/context/AuthContext';
import { patientApi, reminderApi, type Patient, type ServerReminder, ApiError } from '@/services/api';
import { reminderService, REMINDER_TYPE_META } from '@/services/reminderService';
import { localStore, type LocalReminder } from '@/services/storage';
import { TIER_ACTIONS } from '@/services/vitalsService';
import type { CaretakerStackParamList } from '@/navigation/AppNavigator';

type Props = NativeStackScreenProps<CaretakerStackParamList, 'CaretakerDashboard'>;

const TIER_CONFIG = {
  normal: { label: 'Normal', color: colors.success, bg: '#EBF7EF' },
  low: { label: 'Low Alert', color: '#D97706', bg: '#FFFBEB' },
  high: { label: 'High Alert', color: '#EA580C', bg: '#FFF7ED' },
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

type DetailTab = 'reminders' | 'vitals' | 'games' | 'profile';

export function CaretakerDashboardScreen({ navigation }: Props) {
  const { user, logout } = useAuth();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [activeTab, setActiveTab] = useState<DetailTab>('reminders');
  const [patientReminders, setPatientReminders] = useState<LocalReminder[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [showLinkPatientModal, setShowLinkPatientModal] = useState(false);
  const [showAddReminderModal, setShowAddReminderModal] = useState(false);
  const [showEditMedicalModal, setShowEditMedicalModal] = useState(false);

  // New Patient Form State
  const [pName, setPName] = useState('');
  const [pEmail, setPEmail] = useState('');
  const [pPassword, setPPassword] = useState('');
  const [pDob, setPDob] = useState('1950-05-12');
  const [pGender, setPGender] = useState('male');
  const [pBloodGroup, setPBloodGroup] = useState('B+');
  const [pRelationship, setPRelationship] = useState('Parent');
  const [pConditions, setPConditions] = useState('');
  const [pAllergies, setPAllergies] = useState('');
  const [pPhone, setPPhone] = useState('');
  const [pEmergName, setPEmergName] = useState('');
  const [pEmergPhone, setPEmergPhone] = useState('');
  const [isSubmittingPatient, setIsSubmittingPatient] = useState(false);

  // Link Patient Form State
  const [linkIdentifier, setLinkIdentifier] = useState('');
  const [isSubmittingLink, setIsSubmittingLink] = useState(false);

  // New Reminder Form State
  const [remTitle, setRemTitle] = useState('');
  const [remType, setRemType] = useState<LocalReminder['type']>('medicine');
  const [remTime, setRemTime] = useState('08:00 AM');
  const [remDescription, setRemDescription] = useState('');
  const [remMedName, setRemMedName] = useState('');
  const [remMedDose, setRemMedDose] = useState('');
  const [isSubmittingReminder, setIsSubmittingReminder] = useState(false);

  // Edit Medical Info Form State
  const [editConditions, setEditConditions] = useState('');
  const [editAllergies, setEditAllergies] = useState('');
  const [editPhysician, setEditPhysician] = useState('');
  const [editEmergName, setEditEmergName] = useState('');
  const [editEmergPhone, setEditEmergPhone] = useState('');
  const [editEmergRel, setEditEmergRel] = useState('');
  const [editMedications, setEditMedications] = useState<{ name: string; dosage: string; frequency: string }[]>([]);
  const [newMedName, setNewMedName] = useState('');
  const [newMedDose, setNewMedDose] = useState('');
  const [newMedFreq, setNewMedFreq] = useState('Twice daily');
  const [isSubmittingMedical, setIsSubmittingMedical] = useState(false);

  const fetchPatients = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    setError(null);
    try {
      const res = await patientApi.list();
      setPatients(res.data);
      if (res.data.length > 0) {
        if (!selectedPatient) {
          setSelectedPatient(res.data[0]);
        } else {
          const updated = res.data.find((p) => p._id === selectedPatient._id);
          setSelectedPatient(updated || res.data[0]);
        }
      } else {
        setSelectedPatient(null);
      }
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
  }, [selectedPatient]);

  const loadPatientReminders = useCallback(async (patientId: string) => {
    const local = localStore.getReminders(patientId);
    setPatientReminders(local);

    try {
      const res = await reminderApi.list(patientId);
      if (res.data) {
        await reminderService.syncFromServer(patientId);
        setPatientReminders(localStore.getReminders(patientId));
      }
    } catch {
      // Offline fallback
    }
  }, []);

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    if (selectedPatient) {
      loadPatientReminders(selectedPatient._id);
    }
  }, [selectedPatient, loadPatientReminders]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchPatients(true);
    if (selectedPatient) {
      loadPatientReminders(selectedPatient._id);
    }
  };

  // ─── Add Patient ─────────────────────────────────────────────────────────────
  const handleAddPatient = async () => {
    if (!pName.trim()) {
      Alert.alert('Required', 'Please enter patient full name.');
      return;
    }

    setIsSubmittingPatient(true);
    try {
      const conditionsList = pConditions
        ? pConditions.split(',').map((c) => c.trim()).filter(Boolean)
        : ['Hypertension'];

      const allergiesList = pAllergies
        ? pAllergies.split(',').map((c) => c.trim()).filter(Boolean)
        : [];

      const res = await patientApi.create({
        fullName: pName.trim(),
        dateOfBirth: pDob,
        gender: pGender,
        bloodGroup: pBloodGroup,
        relationshipToCaretaker: pRelationship,
        contact: {
          phone: pPhone,
          email: pEmail ? pEmail.toLowerCase().trim() : '',
        },
        email: pEmail ? pEmail.toLowerCase().trim() : undefined,
        phone: pPhone || undefined,
        password: pPassword || undefined,
        medicalInfo: {
          conditions: conditionsList,
          allergies: allergiesList,
          medications: [],
          emergencyContact: {
            name: pEmergName || user?.name || '',
            phone: pEmergPhone || pPhone || user?.phone || '',
            relation: pRelationship || 'Caretaker',
          },
        },
        vitalsMonitoring: {
          enabled: true,
          lastRecordedAt: new Date().toISOString(),
          currentVitals: {
            heartRate: 72,
            spO2: 98,
            motionStatus: 'Normal',
            tier: 'normal',
          },
        },
      });

      Alert.alert('Success', `${res.data.fullName} added successfully to your care.`);
      setShowAddPatientModal(false);
      setPName('');
      setPEmail('');
      setPPassword('');
      setPConditions('');
      setPAllergies('');
      setPPhone('');
      setPEmergName('');
      setPEmergPhone('');
      await fetchPatients(true);
      setSelectedPatient(res.data);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add patient.');
    } finally {
      setIsSubmittingPatient(false);
    }
  };

  // ─── Link Existing Patient ───────────────────────────────────────────────────
  const handleLinkPatient = async () => {
    if (!linkIdentifier.trim()) {
      Alert.alert('Required', 'Please enter patient email or phone number.');
      return;
    }

    setIsSubmittingLink(true);
    try {
      const res = await patientApi.link(linkIdentifier.trim());
      Alert.alert('Linked!', res.message || 'Patient successfully linked.');
      setShowLinkPatientModal(false);
      setLinkIdentifier('');
      await fetchPatients(true);
      setSelectedPatient(res.data);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to link patient.');
    } finally {
      setIsSubmittingLink(false);
    }
  };

  // ─── Remove / Discharge Patient ──────────────────────────────────────────────
  const handleRemovePatient = () => {
    if (!selectedPatient) return;

    Alert.alert(
      'Remove Patient from Care',
      `Are you sure you want to remove ${selectedPatient.fullName} from your care dashboard?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await patientApi.update(selectedPatient._id, { status: 'discharged' });
              Alert.alert('Removed', `${selectedPatient.fullName} has been removed from your dashboard.`);
              await fetchPatients(true);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to remove patient.');
            }
          },
        },
      ]
    );
  };

  // ─── Open Edit Medical Modal ────────────────────────────────────────────────
  const handleOpenEditMedical = () => {
    if (!selectedPatient) return;
    setEditConditions((selectedPatient.medicalInfo?.conditions || []).join(', '));
    setEditAllergies((selectedPatient.medicalInfo?.allergies || []).join(', '));
    setEditPhysician((selectedPatient.medicalInfo as any)?.primaryPhysician || '');
    setEditEmergName(selectedPatient.medicalInfo?.emergencyContact?.name || '');
    setEditEmergPhone(selectedPatient.medicalInfo?.emergencyContact?.phone || '');
    setEditEmergRel(selectedPatient.medicalInfo?.emergencyContact?.relation || '');
    setEditMedications(selectedPatient.medicalInfo?.medications || []);
    setShowEditMedicalModal(true);
  };

  const handleAddMedicationToList = () => {
    if (!newMedName.trim() || !newMedDose.trim()) {
      Alert.alert('Required', 'Please enter medicine name and dosage.');
      return;
    }
    setEditMedications((prev) => [
      ...prev,
      { name: newMedName.trim(), dosage: newMedDose.trim(), frequency: newMedFreq.trim() },
    ]);
    setNewMedName('');
    setNewMedDose('');
  };

  const handleRemoveMedicationFromList = (index: number) => {
    setEditMedications((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveMedicalInfo = async () => {
    if (!selectedPatient) return;

    setIsSubmittingMedical(true);
    try {
      const conditionsList = editConditions
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const allergiesList = editAllergies
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const updatedMedicalInfo = {
        conditions: conditionsList,
        allergies: allergiesList,
        medications: editMedications,
        primaryPhysician: editPhysician.trim(),
        emergencyContact: {
          name: editEmergName.trim(),
          phone: editEmergPhone.trim(),
          relation: editEmergRel.trim(),
        },
      };

      const res = await patientApi.update(selectedPatient._id, {
        medicalInfo: updatedMedicalInfo as any,
      });

      Alert.alert('Updated!', 'Medical profile updated successfully.');
      setShowEditMedicalModal(false);
      setSelectedPatient(res.data);
      await fetchPatients(true);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update medical info.');
    } finally {
      setIsSubmittingMedical(false);
    }
  };

  // ─── Create Reminder ─────────────────────────────────────────────────────────
  const handleAddReminder = async () => {
    if (!selectedPatient) return;
    if (!remTitle.trim()) {
      Alert.alert('Required', 'Please enter a reminder title.');
      return;
    }

    setIsSubmittingReminder(true);
    try {
      await reminderService.create({
        patientId: selectedPatient._id,
        title: remTitle.trim(),
        description: remDescription.trim(),
        type: remType,
        scheduledAt: new Date().toISOString(),
        timeStr: remTime,
        recurrence: 'daily',
        medication:
          remType === 'medicine'
            ? {
                name: remMedName.trim() || remTitle.trim(),
                dosage: remMedDose.trim() || '1 Dose',
                instructions: remDescription.trim() || 'Take with water',
              }
            : undefined,
      });

      Alert.alert('Created!', 'Reminder scheduled and synced to patient device.');
      setShowAddReminderModal(false);
      setRemTitle('');
      setRemDescription('');
      setRemMedName('');
      setRemMedDose('');
      loadPatientReminders(selectedPatient._id);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create reminder.');
    } finally {
      setIsSubmittingReminder(false);
    }
  };

  const handleToggleReminder = async (id: string) => {
    await reminderService.toggle(id);
    if (selectedPatient) loadPatientReminders(selectedPatient._id);
  };

  const handleDeleteReminder = async (id: string) => {
    Alert.alert('Delete Reminder', 'Are you sure you want to remove this reminder?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await reminderService.delete(id);
          if (selectedPatient) loadPatientReminders(selectedPatient._id);
        },
      },
    ]);
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading Care Dashboard…</Text>
      </View>
    );
  }

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
      {/* Caretaker Header */}
      <View style={styles.dashHeader}>
        <View style={styles.dashHeaderText}>
          <Text style={styles.greeting}>
            🩺 Care Dashboard · {user?.name?.split(' ')[0] ?? 'Caretaker'}
          </Text>
          <Text style={styles.dashSubtitle}>
            {patients.length} patient{patients.length !== 1 ? 's' : ''} monitored · One-to-Many Care Management
          </Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.logoutButton, pressed && { opacity: 0.7 }]}
          onPress={logout}
          accessibilityRole="button"
        >
          <Text style={styles.logoutText}>Sign out</Text>
        </Pressable>
      </View>

      {/* Quick Action Strip (Add & Link Patient) */}
      <View style={styles.actionStrip}>
        <Pressable
          style={[styles.actionChip, styles.actionChipPrimary]}
          onPress={() => setShowAddPatientModal(true)}
        >
          <Text style={styles.actionChipPrimaryText}>+ Add New Patient</Text>
        </Pressable>
        <Pressable
          style={styles.actionChip}
          onPress={() => setShowLinkPatientModal(true)}
        >
          <Text style={styles.actionChipText}>🔗 Link Existing Patient</Text>
        </Pressable>
      </View>

      {/* Summary Statistics */}
      {patients.length > 0 && (
        <View style={styles.statsStrip}>
          <View style={styles.statBadge}>
            <Text style={styles.statIcon}>👥</Text>
            <Text style={styles.statValue}>{patients.length}</Text>
            <Text style={styles.statLabel}>Patients</Text>
          </View>
          <View style={styles.statBadge}>
            <Text style={styles.statIcon}>⚠️</Text>
            <Text style={[styles.statValue, { color: colors.error }]}>
              {patients.filter((p) => p.vitalsMonitoring?.currentVitals?.tier === 'high' || p.vitalsMonitoring?.currentVitals?.tier === 'lethal').length}
            </Text>
            <Text style={styles.statLabel}>High Risk</Text>
          </View>
          <View style={styles.statBadge}>
            <Text style={styles.statIcon}>🎮</Text>
            <Text style={styles.statValue}>
              {patients.reduce((sum, p) => sum + (p.gameStats?.totalSessions || 0), 0)}
            </Text>
            <Text style={styles.statLabel}>Game Plays</Text>
          </View>
        </View>
      )}

      {/* Error Notice */}
      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
          <Pressable onPress={() => fetchPatients()}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      )}

      {/* Patient Selector / Cards */}
      {patients.length === 0 && !error ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🏥</Text>
          <Text style={styles.emptyTitle}>No patients linked yet</Text>
          <Text style={styles.emptySubtitle}>
            Add a patient with their email/login to start managing their scheduled reminders, medical info, vitals telemetry, and cognitive training.
          </Text>
          <Pressable
            style={styles.bigAddBtn}
            onPress={() => setShowAddPatientModal(true)}
          >
            <Text style={styles.bigAddBtnText}>+ Add First Patient</Text>
          </Pressable>
        </View>
      ) : (
        <>
          {/* Horizontal Patient Carousel / Switcher */}
          <View style={styles.switcherSection}>
            <Text style={styles.sectionTitle}>Select Patient to Manage</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.patientRow}>
              {patients.map((p) => {
                const isSelected = selectedPatient?._id === p._id;
                const tier = p.vitalsMonitoring?.currentVitals?.tier || 'normal';
                const tierCfg = TIER_CONFIG[tier];

                return (
                  <Pressable
                    key={p._id}
                    style={[styles.patientPill, isSelected && styles.patientPillSelected]}
                    onPress={() => setSelectedPatient(p)}
                  >
                    <View style={styles.patientAvatar}>
                      <Text style={styles.avatarChar}>{p.fullName.charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={styles.pillText}>
                      <Text style={[styles.pillName, isSelected && styles.pillNameSelected]}>
                        {p.fullName}
                      </Text>
                      <Text style={styles.pillMeta}>
                        {p.relationshipToCaretaker || 'Patient'} · {p.bloodGroup || 'O+'}
                      </Text>
                    </View>
                    <View style={[styles.miniTier, { backgroundColor: tierCfg.bg }]}>
                      <Text style={[styles.miniTierText, { color: tierCfg.color }]}>
                        {tierCfg.label}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Detailed Workspace for Selected Patient */}
          {selectedPatient && (
            <View style={styles.workspaceCard}>
              {/* Patient Top Summary */}
              <View style={styles.workspaceHeader}>
                <View style={styles.wsInfo}>
                  <Text style={styles.wsName}>{selectedPatient.fullName}</Text>
                  <Text style={styles.wsSub}>
                    {selectedPatient.gender} · Born {selectedPatient.dateOfBirth?.slice(0, 10)} · Blood: {selectedPatient.bloodGroup}
                  </Text>
                  {selectedPatient.contact?.email ? (
                    <Text style={styles.wsEmail}>✉️ {selectedPatient.contact.email}</Text>
                  ) : null}
                </View>

                <View style={styles.headerRightActions}>
                  <View style={styles.wsVitalsBadge}>
                    <Text style={styles.wsVitalsText}>
                      ❤️ {selectedPatient.vitalsMonitoring?.currentVitals?.heartRate || 72} bpm
                    </Text>
                  </View>
                  <Pressable
                    style={styles.removePatientBtn}
                    onPress={handleRemovePatient}
                    accessibilityLabel="Remove patient from care"
                  >
                    <Text style={styles.removePatientBtnText}>🗑️ Remove</Text>
                  </Pressable>
                </View>
              </View>

              {/* Workspace Navigation Tabs */}
              <View style={styles.workspaceTabs}>
                <Pressable
                  style={[styles.wsTab, activeTab === 'reminders' && styles.wsTabActive]}
                  onPress={() => setActiveTab('reminders')}
                >
                  <Text style={[styles.wsTabText, activeTab === 'reminders' && styles.wsTabTextActive]}>
                    ⏰ Reminders ({patientReminders.length})
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.wsTab, activeTab === 'vitals' && styles.wsTabActive]}
                  onPress={() => setActiveTab('vitals')}
                >
                  <Text style={[styles.wsTabText, activeTab === 'vitals' && styles.wsTabTextActive]}>
                    📊 Vitals
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.wsTab, activeTab === 'games' && styles.wsTabActive]}
                  onPress={() => setActiveTab('games')}
                >
                  <Text style={[styles.wsTabText, activeTab === 'games' && styles.wsTabTextActive]}>
                    🎮 Game Stats
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.wsTab, activeTab === 'profile' && styles.wsTabActive]}
                  onPress={() => setActiveTab('profile')}
                >
                  <Text style={[styles.wsTabText, activeTab === 'profile' && styles.wsTabTextActive]}>
                    📋 Medical Info
                  </Text>
                </Pressable>
              </View>

              {/* ─── TAB 1: REMINDERS ───────────────────────────────────────── */}
              {activeTab === 'reminders' && (
                <View style={styles.tabContent}>
                  <View style={styles.tabHeaderRow}>
                    <Text style={styles.tabTitle}>Scheduled Care Reminders</Text>
                    <Pressable
                      style={styles.addReminderBtn}
                      onPress={() => setShowAddReminderModal(true)}
                    >
                      <Text style={styles.addReminderBtnText}>+ Set Reminder</Text>
                    </Pressable>
                  </View>

                  {patientReminders.length === 0 ? (
                    <View style={styles.emptyReminderBox}>
                      <Text style={styles.emptyReminderIcon}>⏰</Text>
                      <Text style={styles.emptyReminderTitle}>No reminders set yet</Text>
                      <Text style={styles.emptyReminderSub}>
                        Set medication, water, meal, and appointment reminders for {selectedPatient.fullName}.
                      </Text>
                      <Pressable
                        style={styles.addFirstReminderBtn}
                        onPress={() => setShowAddReminderModal(true)}
                      >
                        <Text style={styles.addFirstReminderBtnText}>+ Create First Reminder</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <View style={styles.remindersList}>
                      {patientReminders.map((r) => {
                        const meta = REMINDER_TYPE_META[r.type] || REMINDER_TYPE_META.other;
                        return (
                          <View key={r._id} style={styles.dashReminderCard}>
                            <View style={styles.remLeft}>
                              <View style={[styles.remTypeBadge, { backgroundColor: meta.bg }]}>
                                <Text style={styles.remTypeIcon}>{meta.icon}</Text>
                                <Text style={[styles.remTypeLabel, { color: meta.color }]}>
                                  {meta.label}
                                </Text>
                              </View>
                              <Text style={styles.remTitle}>{r.title}</Text>
                              {r.description ? (
                                <Text style={styles.remDesc}>{r.description}</Text>
                              ) : null}
                              {r.medication?.name ? (
                                <Text style={styles.remMedText}>
                                  💊 {r.medication.name} - {r.medication.dosage}
                                </Text>
                              ) : null}
                            </View>

                            <View style={styles.remRight}>
                              <Text style={styles.remTime}>{r.timeStr}</Text>
                              <View style={styles.remActions}>
                                <Pressable
                                  style={[
                                    styles.toggleBtn,
                                    r.isActive ? styles.toggleBtnActive : styles.toggleBtnInactive,
                                  ]}
                                  onPress={() => handleToggleReminder(r._id)}
                                >
                                  <Text style={styles.toggleText}>
                                    {r.isActive ? 'Active' : 'Paused'}
                                  </Text>
                                </Pressable>
                                <Pressable
                                  style={styles.deleteBtn}
                                  onPress={() => handleDeleteReminder(r._id)}
                                >
                                  <Text style={styles.deleteText}>🗑️</Text>
                                </Pressable>
                              </View>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              )}

              {/* ─── TAB 2: VITALS ─────────────────────────────────────────── */}
              {activeTab === 'vitals' && (
                <View style={styles.tabContent}>
                  <Text style={styles.tabTitle}>Vitals Telemetry & Risk Matrix</Text>
                  <View style={styles.vitalsRow}>
                    <View style={styles.vitalCard}>
                      <Text style={styles.vitalCardIcon}>❤️</Text>
                      <Text style={styles.vitalCardVal}>
                        {selectedPatient.vitalsMonitoring?.currentVitals?.heartRate || 72}
                        <Text style={styles.vitalCardUnit}> bpm</Text>
                      </Text>
                      <Text style={styles.vitalCardLabel}>Heart Rate</Text>
                    </View>
                    <View style={styles.vitalCard}>
                      <Text style={styles.vitalCardIcon}>🫁</Text>
                      <Text style={styles.vitalCardVal}>
                        {selectedPatient.vitalsMonitoring?.currentVitals?.spO2 || 98}
                        <Text style={styles.vitalCardUnit}> %</Text>
                      </Text>
                      <Text style={styles.vitalCardLabel}>SpO₂ Oxygen</Text>
                    </View>
                    <View style={styles.vitalCard}>
                      <Text style={styles.vitalCardIcon}>🏃</Text>
                      <Text style={styles.vitalCardVal}>
                        {selectedPatient.vitalsMonitoring?.currentVitals?.motionStatus || 'Normal'}
                      </Text>
                      <Text style={styles.vitalCardLabel}>Motion Status</Text>
                    </View>
                  </View>

                  {/* Tier Action Card */}
                  <View style={styles.tierActionBox}>
                    <Text style={styles.tierActionTitle}>Active Alert Protocol:</Text>
                    <Text style={styles.tierActionDesc}>
                      {TIER_ACTIONS[selectedPatient.vitalsMonitoring?.currentVitals?.tier || 'normal'].actionText}
                    </Text>
                  </View>
                </View>
              )}

              {/* ─── TAB 3: GAMES STATS ────────────────────────────────────── */}
              {activeTab === 'games' && (
                <View style={styles.tabContent}>
                  <Text style={styles.tabTitle}>Cognitive Training & Memory Stats</Text>
                  <View style={styles.statsSummaryGrid}>
                    <View style={styles.statBox}>
                      <Text style={styles.statBoxVal}>
                        {selectedPatient.gameStats?.totalSessions || 0}
                      </Text>
                      <Text style={styles.statBoxLabel}>Total Sessions</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={styles.statBoxVal}>
                        {selectedPatient.gameStats?.averageScore || 0}
                      </Text>
                      <Text style={styles.statBoxLabel}>Average Score</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={styles.statBoxVal}>
                        {getTimeSince(selectedPatient.gameStats?.lastPlayedAt || null)}
                      </Text>
                      <Text style={styles.statBoxLabel}>Last Active</Text>
                    </View>
                  </View>

                  <Text style={[styles.tabTitle, { marginTop: spacing.md }]}>Supported Games</Text>
                  <Text style={styles.gamesListText}>
                    🧠 Memory Album · 🧺 Memory Tray · ☀️ Daily Routine Sequencer · 🔍 What Changed · 👨‍👩‍👧 Family Face Match · 🏛️ Local Culture Match
                  </Text>
                </View>
              )}

              {/* ─── TAB 4: MEDICAL PROFILE & MANAGEMENT ──────────────────── */}
              {activeTab === 'profile' && (
                <View style={styles.tabContent}>
                  <View style={styles.tabHeaderRow}>
                    <Text style={styles.tabTitle}>Medical & Emergency Profile</Text>
                    <Pressable
                      style={styles.editMedicalBtn}
                      onPress={handleOpenEditMedical}
                    >
                      <Text style={styles.editMedicalBtnText}>✏️ Edit Medical Info</Text>
                    </Pressable>
                  </View>

                  <View style={styles.profileSection}>
                    {/* Conditions */}
                    <Text style={styles.profileLabel}>Medical Conditions:</Text>
                    <View style={styles.pillWrap}>
                      {selectedPatient.medicalInfo?.conditions && selectedPatient.medicalInfo.conditions.length > 0 ? (
                        selectedPatient.medicalInfo.conditions.map((c, i) => (
                          <View key={i} style={styles.medPill}>
                            <Text style={styles.medPillText}>{c}</Text>
                          </View>
                        ))
                      ) : (
                        <Text style={styles.noneText}>None recorded (tap Edit to add)</Text>
                      )}
                    </View>

                    {/* Allergies */}
                    <Text style={[styles.profileLabel, { marginTop: spacing.sm }]}>Allergies:</Text>
                    <View style={styles.pillWrap}>
                      {selectedPatient.medicalInfo?.allergies && selectedPatient.medicalInfo.allergies.length > 0 ? (
                        selectedPatient.medicalInfo.allergies.map((a, i) => (
                          <View key={i} style={[styles.medPill, { backgroundColor: '#FFF0ED' }]}>
                            <Text style={[styles.medPillText, { color: colors.error }]}>⚠️ {a}</Text>
                          </View>
                        ))
                      ) : (
                        <Text style={styles.noneText}>No allergies known</Text>
                      )}
                    </View>

                    {/* Prescribed Medications */}
                    <Text style={[styles.profileLabel, { marginTop: spacing.sm }]}>Prescribed Medications:</Text>
                    {selectedPatient.medicalInfo?.medications && selectedPatient.medicalInfo.medications.length > 0 ? (
                      <View style={styles.medsList}>
                        {selectedPatient.medicalInfo.medications.map((m, i) => (
                          <View key={i} style={styles.medItemRow}>
                            <Text style={styles.medItemName}>💊 {m.name} ({m.dosage})</Text>
                            <Text style={styles.medItemFreq}>{m.frequency}</Text>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <Text style={styles.noneText}>No medications prescribed</Text>
                    )}

                    {/* Physician */}
                    <Text style={[styles.profileLabel, { marginTop: spacing.sm }]}>Primary Physician:</Text>
                    <Text style={styles.contactText}>
                      {(selectedPatient.medicalInfo as any)?.primaryPhysician || 'Not assigned'}
                    </Text>

                    {/* Emergency Contacts */}
                    <Text style={[styles.profileLabel, { marginTop: spacing.sm }]}>Emergency Contact:</Text>
                    <Text style={styles.contactText}>
                      Primary: {selectedPatient.medicalInfo?.emergencyContact?.name || user?.name || 'Caregiver'} (
                      {selectedPatient.medicalInfo?.emergencyContact?.phone || user?.phone || 'On file'}) ·{' '}
                      {selectedPatient.medicalInfo?.emergencyContact?.relation || 'Family'}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          )}
        </>
      )}

      {/* ─── MODAL: ADD PATIENT ──────────────────────────────────────────────── */}
      <Modal visible={showAddPatientModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add New Patient to Your Care</Text>
            <Text style={styles.modalSub}>
              Creates patient profile and optional user login so the patient can log into their device.
            </Text>

            <ScrollView style={styles.modalForm}>
              <Text style={styles.fieldLabel}>Full Name *</Text>
              <TextInput
                style={styles.modalInput}
                value={pName}
                onChangeText={setPName}
                placeholder="e.g. Ramesh Kumar"
                placeholderTextColor={colors.mute}
              />

              <Text style={styles.fieldLabel}>Patient Email (for Login)</Text>
              <TextInput
                style={styles.modalInput}
                value={pEmail}
                onChangeText={setPEmail}
                placeholder="e.g. ramesh@example.com"
                placeholderTextColor={colors.mute}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              <Text style={styles.fieldLabel}>Patient Initial Password</Text>
              <TextInput
                style={styles.modalInput}
                value={pPassword}
                onChangeText={setPPassword}
                placeholder="Default: Patient@123"
                placeholderTextColor={colors.mute}
                secureTextEntry
              />

              <Text style={styles.fieldLabel}>Phone Number</Text>
              <TextInput
                style={styles.modalInput}
                value={pPhone}
                onChangeText={setPPhone}
                placeholder="+91 9876543210"
                placeholderTextColor={colors.mute}
                keyboardType="phone-pad"
              />

              <Text style={styles.fieldLabel}>Date of Birth (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.modalInput}
                value={pDob}
                onChangeText={setPDob}
                placeholder="1950-05-12"
                placeholderTextColor={colors.mute}
              />

              <Text style={styles.fieldLabel}>Relationship to You</Text>
              <TextInput
                style={styles.modalInput}
                value={pRelationship}
                onChangeText={setPRelationship}
                placeholder="e.g. Mother, Father, Spouse, Patient"
                placeholderTextColor={colors.mute}
              />

              <Text style={styles.fieldLabel}>Blood Group</Text>
              <TextInput
                style={styles.modalInput}
                value={pBloodGroup}
                onChangeText={setPBloodGroup}
                placeholder="e.g. B+, O+, A+"
                placeholderTextColor={colors.mute}
              />

              <Text style={styles.fieldLabel}>Medical Conditions (comma-separated)</Text>
              <TextInput
                style={styles.modalInput}
                value={pConditions}
                onChangeText={setPConditions}
                placeholder="e.g. Hypertension, Type 2 Diabetes, Mild Dementia"
                placeholderTextColor={colors.mute}
              />

              <Text style={styles.fieldLabel}>Allergies (comma-separated)</Text>
              <TextInput
                style={styles.modalInput}
                value={pAllergies}
                onChangeText={setPAllergies}
                placeholder="e.g. Penicillin, Peanuts"
                placeholderTextColor={colors.mute}
              />

              <Text style={styles.fieldLabel}>Emergency Contact Name</Text>
              <TextInput
                style={styles.modalInput}
                value={pEmergName}
                onChangeText={setPEmergName}
                placeholder="e.g. Anita Sharma"
                placeholderTextColor={colors.mute}
              />

              <Text style={styles.fieldLabel}>Emergency Contact Phone</Text>
              <TextInput
                style={styles.modalInput}
                value={pEmergPhone}
                onChangeText={setPEmergPhone}
                placeholder="+91 9988776655"
                placeholderTextColor={colors.mute}
                keyboardType="phone-pad"
              />
            </ScrollView>

            <View style={styles.modalBtnRow}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => setShowAddPatientModal(false)}
                disabled={isSubmittingPatient}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.modalSubmitBtn}
                onPress={handleAddPatient}
                disabled={isSubmittingPatient}
              >
                {isSubmittingPatient ? (
                  <ActivityIndicator color={colors.onPrimary} />
                ) : (
                  <Text style={styles.modalSubmitText}>Save Patient</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── MODAL: EDIT MEDICAL PROFILE ────────────────────────────────────── */}
      <Modal visible={showEditMedicalModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit Medical Profile</Text>
            <Text style={styles.modalSub}>
              Manage conditions, allergies, physician, and prescribed medications for {selectedPatient?.fullName}.
            </Text>

            <ScrollView style={styles.modalForm}>
              <Text style={styles.fieldLabel}>Medical Conditions (comma-separated)</Text>
              <TextInput
                style={styles.modalInput}
                value={editConditions}
                onChangeText={setEditConditions}
                placeholder="e.g. Hypertension, Type 2 Diabetes, Mild Memory Decline"
                placeholderTextColor={colors.mute}
              />

              <Text style={styles.fieldLabel}>Known Allergies (comma-separated)</Text>
              <TextInput
                style={styles.modalInput}
                value={editAllergies}
                onChangeText={setEditAllergies}
                placeholder="e.g. Penicillin, Sulfa drugs, Dust"
                placeholderTextColor={colors.mute}
              />

              <Text style={styles.fieldLabel}>Primary Physician</Text>
              <TextInput
                style={styles.modalInput}
                value={editPhysician}
                onChangeText={setEditPhysician}
                placeholder="e.g. Dr. Neha Verma"
                placeholderTextColor={colors.mute}
              />

              <Text style={styles.fieldLabel}>Emergency Contact Name</Text>
              <TextInput
                style={styles.modalInput}
                value={editEmergName}
                onChangeText={setEditEmergName}
                placeholder="e.g. Sunita Kumar"
                placeholderTextColor={colors.mute}
              />

              <Text style={styles.fieldLabel}>Emergency Contact Phone</Text>
              <TextInput
                style={styles.modalInput}
                value={editEmergPhone}
                onChangeText={setEditEmergPhone}
                placeholder="+91 9988776655"
                placeholderTextColor={colors.mute}
                keyboardType="phone-pad"
              />

              <Text style={styles.fieldLabel}>Relationship to Patient</Text>
              <TextInput
                style={styles.modalInput}
                value={editEmergRel}
                onChangeText={setEditEmergRel}
                placeholder="e.g. Daughter, Son, Guardian"
                placeholderTextColor={colors.mute}
              />

              {/* Prescribed Medications Section */}
              <Text style={[styles.fieldLabel, { marginTop: spacing.md }]}>Prescribed Medications</Text>
              {editMedications.map((m, i) => (
                <View key={i} style={styles.medRowEdit}>
                  <Text style={styles.medRowEditText}>
                    💊 {m.name} ({m.dosage}) - {m.frequency}
                  </Text>
                  <Pressable
                    style={styles.medRemoveBtn}
                    onPress={() => handleRemoveMedicationFromList(i)}
                  >
                    <Text style={styles.medRemoveBtnText}>✕</Text>
                  </Pressable>
                </View>
              ))}

              <View style={styles.addMedBox}>
                <Text style={styles.addMedSub}>+ Add a Prescribed Medicine</Text>
                <TextInput
                  style={styles.modalInput}
                  value={newMedName}
                  onChangeText={setNewMedName}
                  placeholder="Medicine name (e.g. Donepezil)"
                  placeholderTextColor={colors.mute}
                />
                <TextInput
                  style={[styles.modalInput, { marginTop: 6 }]}
                  value={newMedDose}
                  onChangeText={setNewMedDose}
                  placeholder="Dosage (e.g. 5mg, 500mg)"
                  placeholderTextColor={colors.mute}
                />
                <TextInput
                  style={[styles.modalInput, { marginTop: 6 }]}
                  value={newMedFreq}
                  onChangeText={setNewMedFreq}
                  placeholder="Frequency (e.g. Once daily at bedtime)"
                  placeholderTextColor={colors.mute}
                />
                <Pressable style={styles.addMedRowBtn} onPress={handleAddMedicationToList}>
                  <Text style={styles.addMedRowBtnText}>+ Add to Medication List</Text>
                </Pressable>
              </View>
            </ScrollView>

            <View style={styles.modalBtnRow}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => setShowEditMedicalModal(false)}
                disabled={isSubmittingMedical}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.modalSubmitBtn}
                onPress={handleSaveMedicalInfo}
                disabled={isSubmittingMedical}
              >
                {isSubmittingMedical ? (
                  <ActivityIndicator color={colors.onPrimary} />
                ) : (
                  <Text style={styles.modalSubmitText}>Save Medical Info</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── MODAL: LINK EXISTING PATIENT ────────────────────────────────────── */}
      <Modal visible={showLinkPatientModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Link Existing Patient</Text>
            <Text style={styles.modalSub}>
              Enter the patient's registered email address or phone number to link them to your dashboard.
            </Text>

            <TextInput
              style={[styles.modalInput, { marginTop: spacing.md }]}
              value={linkIdentifier}
              onChangeText={setLinkIdentifier}
              placeholder="patient@example.com or +91-9876543210"
              placeholderTextColor={colors.mute}
              autoCapitalize="none"
            />

            <View style={styles.modalBtnRow}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => setShowLinkPatientModal(false)}
                disabled={isSubmittingLink}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.modalSubmitBtn}
                onPress={handleLinkPatient}
                disabled={isSubmittingLink}
              >
                {isSubmittingLink ? (
                  <ActivityIndicator color={colors.onPrimary} />
                ) : (
                  <Text style={styles.modalSubmitText}>Link Patient</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── MODAL: ADD REMINDER ────────────────────────────────────────────── */}
      <Modal visible={showAddReminderModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Schedule Care Reminder</Text>
            <Text style={styles.modalSub}>
              Set for {selectedPatient?.fullName} — will appear on their device.
            </Text>

            <ScrollView style={styles.modalForm}>
              <Text style={styles.fieldLabel}>Reminder Title</Text>
              <TextInput
                style={styles.modalInput}
                value={remTitle}
                onChangeText={setRemTitle}
                placeholder="e.g. Morning Blood Pressure Medication"
                placeholderTextColor={colors.mute}
              />

              <Text style={styles.fieldLabel}>Type</Text>
              <View style={styles.typeSelectorRow}>
                {(['medicine', 'hydration', 'meal', 'exercise', 'appointment'] as LocalReminder['type'][]).map((t) => (
                  <Pressable
                    key={t}
                    style={[styles.typeChip, remType === t && styles.typeChipSelected]}
                    onPress={() => setRemType(t)}
                  >
                    <Text style={[styles.typeChipText, remType === t && styles.typeChipTextSelected]}>
                      {REMINDER_TYPE_META[t].icon} {REMINDER_TYPE_META[t].label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Scheduled Time</Text>
              <TextInput
                style={styles.modalInput}
                value={remTime}
                onChangeText={setRemTime}
                placeholder="e.g. 08:00 AM"
                placeholderTextColor={colors.mute}
              />

              {remType === 'medicine' && (
                <>
                  <Text style={styles.fieldLabel}>Medicine Name & Dosage</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={remMedName}
                    onChangeText={setRemMedName}
                    placeholder="e.g. Metformin 500mg"
                    placeholderTextColor={colors.mute}
                  />
                </>
              )}

              <Text style={styles.fieldLabel}>Instructions / Notes (optional)</Text>
              <TextInput
                style={styles.modalInput}
                value={remDescription}
                onChangeText={setRemDescription}
                placeholder="e.g. Take with 1 full glass of water after meal"
                placeholderTextColor={colors.mute}
              />
            </ScrollView>

            <View style={styles.modalBtnRow}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => setShowAddReminderModal(false)}
                disabled={isSubmittingReminder}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.modalSubmitBtn}
                onPress={handleAddReminder}
                disabled={isSubmittingReminder}
              >
                {isSubmittingReminder ? (
                  <ActivityIndicator color={colors.onPrimary} />
                ) : (
                  <Text style={styles.modalSubmitText}>Set Reminder</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.canvas,
    gap: spacing.md,
  },
  loadingText: {
    fontSize: typography.bodyMd.fontSize,
    color: colors.mute,
  },

  // Header
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
    fontSize: typography.bodySm.fontSize,
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

  // Action Strip
  actionStrip: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionChip: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: rounded.button,
    backgroundColor: colors.canvas,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.hairline,
    ...shadows.softFloat,
  },
  actionChipPrimary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  actionChipText: {
    fontSize: typography.bodySmStrong.fontSize,
    fontWeight: '700',
    color: colors.ink,
  },
  actionChipPrimaryText: {
    fontSize: typography.bodySmStrong.fontSize,
    fontWeight: '700',
    color: colors.onPrimary,
  },

  // Stats
  statsStrip: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statBadge: {
    flex: 1,
    backgroundColor: colors.canvas,
    borderRadius: rounded.card,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  statIcon: { fontSize: 18, marginBottom: 2 },
  statValue: {
    fontSize: typography.displaySm.fontSize,
    fontWeight: '700',
    color: colors.ink,
  },
  statLabel: {
    fontSize: typography.caption.fontSize,
    color: colors.mute,
  },

  // Error
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
    marginLeft: spacing.sm,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
    gap: spacing.sm,
    backgroundColor: colors.canvas,
    borderRadius: rounded.card,
    paddingHorizontal: spacing.lg,
  },
  emptyIcon: { fontSize: 48 },
  emptyTitle: {
    fontSize: typography.displaySm.fontSize,
    fontWeight: '700',
    color: colors.ink,
  },
  emptySubtitle: {
    fontSize: typography.bodyMd.fontSize,
    color: colors.mute,
    textAlign: 'center',
  },
  bigAddBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: rounded.button,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  bigAddBtnText: {
    color: colors.onPrimary,
    fontSize: typography.buttonMd.fontSize,
    fontWeight: '700',
  },

  // Switcher
  switcherSection: {
    gap: spacing.xs,
  },
  sectionTitle: {
    fontSize: typography.bodySmStrong.fontSize,
    color: colors.mute,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  patientRow: {
    flexDirection: 'row',
    marginTop: spacing.xs,
  },
  patientPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.canvas,
    borderRadius: rounded.card,
    padding: spacing.sm,
    marginRight: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.hairline,
    minWidth: 220,
    gap: spacing.xs,
  },
  patientPillSelected: {
    borderColor: colors.primary,
    backgroundColor: '#FFF9F9',
  },
  patientAvatar: {
    width: 36,
    height: 36,
    borderRadius: rounded.full,
    backgroundColor: colors.canvasSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarChar: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.ink,
  },
  pillText: {
    flex: 1,
  },
  pillName: {
    fontSize: typography.bodyMdStrong.fontSize,
    fontWeight: '700',
    color: colors.ink,
  },
  pillNameSelected: {
    color: colors.primary,
  },
  pillMeta: {
    fontSize: typography.caption.fontSize,
    color: colors.mute,
  },
  miniTier: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: rounded.pill,
  },
  miniTierText: {
    fontSize: 10,
    fontWeight: '700',
  },

  // Workspace
  workspaceCard: {
    backgroundColor: colors.canvas,
    borderRadius: rounded.card,
    borderWidth: 1,
    borderColor: colors.hairline,
    overflow: 'hidden',
    ...shadows.softFloat,
  },
  workspaceHeader: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.canvasSoft,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  wsInfo: { flex: 1 },
  wsName: {
    fontSize: typography.displaySm.fontSize,
    fontWeight: '700',
    color: colors.ink,
  },
  wsSub: {
    fontSize: typography.caption.fontSize,
    color: colors.mute,
    marginTop: 2,
  },
  wsEmail: {
    fontSize: typography.caption.fontSize,
    color: colors.primary,
    marginTop: 2,
    fontWeight: '700',
  },
  headerRightActions: {
    alignItems: 'flex-end',
    gap: 6,
  },
  wsVitalsBadge: {
    backgroundColor: colors.canvasSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: rounded.pill,
  },
  wsVitalsText: {
    fontSize: typography.bodySmStrong.fontSize,
    color: colors.ink,
    fontWeight: '700',
  },
  removePatientBtn: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 3,
    borderRadius: rounded.pill,
    backgroundColor: '#FFF0ED',
  },
  removePatientBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.error,
  },

  // Tabs
  workspaceTabs: {
    flexDirection: 'row',
    backgroundColor: colors.canvasSoft,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  wsTab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  wsTabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    backgroundColor: colors.canvas,
  },
  wsTabText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '700',
    color: colors.mute,
  },
  wsTabTextActive: {
    color: colors.primary,
  },

  // Tab Content
  tabContent: {
    padding: spacing.md,
    gap: spacing.md,
  },
  tabHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tabTitle: {
    fontSize: typography.bodyMdStrong.fontSize,
    fontWeight: '700',
    color: colors.ink,
  },
  addReminderBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: rounded.pill,
  },
  addReminderBtnText: {
    color: colors.onPrimary,
    fontSize: typography.bodySmStrong.fontSize,
    fontWeight: '700',
  },
  editMedicalBtn: {
    backgroundColor: colors.ink,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: rounded.pill,
  },
  editMedicalBtnText: {
    color: colors.canvas,
    fontSize: typography.bodySmStrong.fontSize,
    fontWeight: '700',
  },

  // Empty Reminders
  emptyReminderBox: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.xs,
  },
  emptyReminderIcon: { fontSize: 36 },
  emptyReminderTitle: {
    fontSize: typography.bodyMdStrong.fontSize,
    fontWeight: '700',
    color: colors.ink,
  },
  emptyReminderSub: {
    fontSize: typography.bodySm.fontSize,
    color: colors.mute,
    textAlign: 'center',
  },
  addFirstReminderBtn: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: rounded.pill,
  },
  addFirstReminderBtnText: {
    color: colors.onPrimary,
    fontWeight: '700',
    fontSize: typography.bodySm.fontSize,
  },

  // Reminders List
  remindersList: {
    gap: spacing.sm,
  },
  dashReminderCard: {
    backgroundColor: colors.canvasSoft,
    borderRadius: rounded.md,
    padding: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  remLeft: { flex: 1, gap: 2 },
  remTypeBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: rounded.pill,
  },
  remTypeIcon: { fontSize: 12 },
  remTypeLabel: { fontSize: 10, fontWeight: '700' },
  remTitle: {
    fontSize: typography.bodyMdStrong.fontSize,
    fontWeight: '700',
    color: colors.ink,
    marginTop: 2,
  },
  remDesc: {
    fontSize: typography.caption.fontSize,
    color: colors.mute,
  },
  remMedText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '700',
    color: colors.ink,
  },
  remRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  remTime: {
    fontSize: typography.bodySmStrong.fontSize,
    fontWeight: '700',
    color: colors.ink,
  },
  remActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toggleBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: rounded.pill,
  },
  toggleBtnActive: {
    backgroundColor: '#EBF7EF',
  },
  toggleBtnInactive: {
    backgroundColor: '#F3F4F6',
  },
  toggleText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.ink,
  },
  deleteBtn: {
    padding: 4,
  },
  deleteText: { fontSize: 14 },

  // Vitals Tab
  vitalsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  vitalCard: {
    flex: 1,
    backgroundColor: colors.canvasSoft,
    borderRadius: rounded.md,
    padding: spacing.sm,
    alignItems: 'center',
  },
  vitalCardIcon: { fontSize: 18, marginBottom: 2 },
  vitalCardVal: {
    fontSize: typography.bodyMdStrong.fontSize,
    fontWeight: '700',
    color: colors.ink,
  },
  vitalCardUnit: { fontSize: 10, color: colors.mute },
  vitalCardLabel: { fontSize: 10, color: colors.mute, marginTop: 2 },
  tierActionBox: {
    backgroundColor: '#F0F9FF',
    padding: spacing.sm,
    borderRadius: rounded.md,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  tierActionTitle: {
    fontSize: typography.bodySmStrong.fontSize,
    fontWeight: '700',
    color: '#0369A1',
  },
  tierActionDesc: {
    fontSize: typography.caption.fontSize,
    color: '#0369A1',
    marginTop: 2,
  },

  // Stats Tab
  statsSummaryGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.canvasSoft,
    padding: spacing.sm,
    borderRadius: rounded.md,
    alignItems: 'center',
  },
  statBoxVal: {
    fontSize: typography.bodyLg.fontSize,
    fontWeight: '700',
    color: colors.ink,
  },
  statBoxLabel: {
    fontSize: typography.caption.fontSize,
    color: colors.mute,
    marginTop: 2,
  },
  gamesListText: {
    fontSize: typography.bodySm.fontSize,
    color: colors.mute,
    lineHeight: 20,
  },

  // Profile Tab
  profileSection: {
    gap: 6,
  },
  profileLabel: {
    fontSize: typography.bodySmStrong.fontSize,
    fontWeight: '700',
    color: colors.ink,
  },
  pillWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 2,
  },
  medPill: {
    backgroundColor: colors.canvasSoft,
    paddingHorizontal: spacing.xs,
    paddingVertical: 3,
    borderRadius: rounded.pill,
  },
  medPillText: {
    fontSize: typography.caption.fontSize,
    color: colors.ink,
  },
  noneText: {
    fontSize: typography.caption.fontSize,
    color: colors.mute,
    fontStyle: 'italic',
  },
  medsList: {
    gap: 4,
    marginTop: 2,
  },
  medItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.canvasSoft,
    borderRadius: rounded.sm,
    padding: spacing.xs,
  },
  medItemName: {
    fontSize: typography.bodySmStrong.fontSize,
    color: colors.ink,
    fontWeight: '700',
  },
  medItemFreq: {
    fontSize: typography.caption.fontSize,
    color: colors.mute,
  },
  contactText: {
    fontSize: typography.bodySm.fontSize,
    color: colors.ink,
    marginTop: 2,
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.canvas,
    borderRadius: rounded.card,
    padding: spacing.lg,
    maxHeight: '88%',
    gap: spacing.sm,
  },
  modalTitle: {
    fontSize: typography.displaySm.fontSize,
    fontWeight: '700',
    color: colors.ink,
  },
  modalSub: {
    fontSize: typography.caption.fontSize,
    color: colors.mute,
  },
  modalForm: {
    marginVertical: spacing.sm,
  },
  fieldLabel: {
    fontSize: typography.bodySmStrong.fontSize,
    fontWeight: '700',
    color: colors.ink,
    marginTop: spacing.sm,
    marginBottom: 4,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: rounded.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.bodyMd.fontSize,
    color: colors.ink,
    backgroundColor: colors.canvasSoft,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  typeChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: rounded.pill,
    backgroundColor: colors.canvasSoft,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  typeChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeChipText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '700',
    color: colors.ink,
  },
  typeChipTextSelected: {
    color: colors.onPrimary,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: rounded.button,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  modalCancelText: {
    fontSize: typography.bodyMdStrong.fontSize,
    fontWeight: '700',
    color: colors.mute,
  },
  modalSubmitBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: rounded.button,
    backgroundColor: colors.primary,
  },
  modalSubmitText: {
    fontSize: typography.bodyMdStrong.fontSize,
    fontWeight: '700',
    color: colors.onPrimary,
  },

  // Edit Medical Modal Extras
  medRowEdit: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.canvasSoft,
    borderRadius: rounded.sm,
    padding: spacing.xs,
    marginVertical: 2,
  },
  medRowEditText: {
    fontSize: typography.bodySm.fontSize,
    color: colors.ink,
    flex: 1,
  },
  medRemoveBtn: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  medRemoveBtnText: {
    color: colors.error,
    fontWeight: '700',
  },
  addMedBox: {
    backgroundColor: colors.canvasSoft,
    borderRadius: rounded.md,
    padding: spacing.sm,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  addMedSub: {
    fontSize: typography.bodySmStrong.fontSize,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  addMedRowBtn: {
    backgroundColor: colors.ink,
    borderRadius: rounded.pill,
    paddingVertical: 6,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  addMedRowBtnText: {
    color: colors.canvas,
    fontSize: typography.caption.fontSize,
    fontWeight: '700',
  },
});
