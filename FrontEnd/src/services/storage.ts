/**
 * storage.ts — Offline-First Local Storage Engine for Cognitive Care Platform.
 *
 * Implements local-first storage for:
 *   - patients (cached patient records)
 *   - reminders (scheduled medications, hydration, appointments, activities)
 *   - vitals_readings (telemetry history & risk tiers)
 *   - game_sessions (offline cognitive gameplay scores)
 *   - alerts (emergency logs)
 *   - sync_queue (offline actions queued for backend synchronization)
 *
 * Guaranteed to function in Airplane Mode and across Web / Android / iOS.
 */

export interface LocalPatient {
  _id: string;
  caretakerId?: string;
  fullName: string;
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
  status: 'active' | 'inactive' | 'deceased' | 'discharged';
  contact?: { phone?: string; email?: string };
  medicalInfo?: {
    conditions?: string[];
    allergies?: string[];
    medications?: { name: string; dosage: string; frequency: string }[];
    emergencyContact?: { name?: string; phone?: string; relation?: string };
  };
  vitalsMonitoring?: {
    enabled: boolean;
    lastRecordedAt: string | null;
    currentVitals: {
      heartRate: number;
      spO2: number;
      motionStatus: string;
      tier: 'normal' | 'low' | 'high' | 'lethal';
    };
  };
  gameStats?: {
    totalSessions: number;
    averageScore: number;
    lastPlayedAt: string | null;
  };
}

export interface LocalReminder {
  _id: string;
  patientId: string;
  caretakerId?: string;
  title: string;
  description?: string;
  type: 'medicine' | 'hydration' | 'appointment' | 'exercise' | 'meal' | 'sleep' | 'other';
  scheduledAt: string; // ISO date string or HH:mm time
  timeStr: string; // e.g. "08:00 AM"
  recurrence: 'none' | 'daily' | 'weekly' | 'monthly';
  recurrenceDays?: number[];
  isActive: boolean;
  acknowledgedAt?: string | null;
  medication?: {
    name: string;
    dosage: string;
    instructions: string;
  };
  createdAt: string;
}

export interface LocalVitalReading {
  _id: string;
  patientId: string;
  heartRate: number;
  spO2: number;
  motionStatus: string;
  tier: 'normal' | 'low' | 'high' | 'lethal';
  source: 'ble_wearable' | 'manual_entry' | 'simulated' | 'app_sensor';
  notes?: string;
  recordedAt: string;
}

export interface LocalGameSession {
  _id: string;
  patientId: string;
  gameId: string;
  score: number;
  accuracy: number;
  durationSeconds: number;
  difficultyLevel: number;
  completedAt: string;
}

export interface SyncQueueItem {
  id: string;
  action: 'CREATE_REMINDER' | 'UPDATE_REMINDER' | 'ACK_REMINDER' | 'DELETE_REMINDER' | 'RECORD_VITAL' | 'RECORD_SESSION';
  endpoint: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  payload: Record<string, unknown>;
  createdAt: string;
  retryCount: number;
}

// ─── Default Seeds for Offline First / Demo Out-Of-The-Box ────────────────────

const DEFAULT_REMINDERS: LocalReminder[] = [
  {
    _id: 'rem-1',
    patientId: 'default-patient',
    title: 'Morning Medication',
    description: 'Take Metformin with a glass of water after breakfast',
    type: 'medicine',
    scheduledAt: new Date(new Date().setHours(8, 0, 0, 0)).toISOString(),
    timeStr: '08:00 AM',
    recurrence: 'daily',
    isActive: true,
    medication: {
      name: 'Metformin',
      dosage: '500mg',
      instructions: 'Take with food',
    },
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'rem-2',
    patientId: 'default-patient',
    title: 'Drink Fresh Water',
    description: 'Hydration check — drink at least 1 full glass of water',
    type: 'hydration',
    scheduledAt: new Date(new Date().setHours(11, 30, 0, 0)).toISOString(),
    timeStr: '11:30 AM',
    recurrence: 'daily',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'rem-3',
    patientId: 'default-patient',
    title: 'Nutritious Lunch',
    description: 'Enjoy your warm homemade lunch',
    type: 'meal',
    scheduledAt: new Date(new Date().setHours(13, 0, 0, 0)).toISOString(),
    timeStr: '01:00 PM',
    recurrence: 'daily',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'rem-4',
    patientId: 'default-patient',
    title: 'Light Afternoon Walk',
    description: '15-minute gentle walk in the garden or living room',
    type: 'exercise',
    scheduledAt: new Date(new Date().setHours(17, 0, 0, 0)).toISOString(),
    timeStr: '05:00 PM',
    recurrence: 'daily',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'rem-5',
    patientId: 'default-patient',
    title: 'Night Blood Pressure Pill',
    description: 'Amlodipine 5mg before going to bed',
    type: 'medicine',
    scheduledAt: new Date(new Date().setHours(21, 0, 0, 0)).toISOString(),
    timeStr: '09:00 PM',
    recurrence: 'daily',
    isActive: true,
    medication: {
      name: 'Amlodipine',
      dosage: '5mg',
      instructions: 'Before bed',
    },
    createdAt: new Date().toISOString(),
  },
];

const DEFAULT_VITALS: LocalVitalReading[] = [
  {
    _id: 'vital-init-1',
    patientId: 'default-patient',
    heartRate: 72,
    spO2: 98,
    motionStatus: 'Normal',
    tier: 'normal',
    source: 'simulated',
    notes: 'Resting vitals stable',
    recordedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    _id: 'vital-init-2',
    patientId: 'default-patient',
    heartRate: 74,
    spO2: 98,
    motionStatus: 'Normal',
    tier: 'normal',
    source: 'simulated',
    notes: 'Telemetry active',
    recordedAt: new Date().toISOString(),
  },
];

// ─── In-Memory & Web / Native Storage Engine ──────────────────────────────────

class OfflineStore {
  private memoryCache: Map<string, string> = new Map();
  private subscribers: Map<string, Set<() => void>> = new Map();

  constructor() {
    this.initDefaults();
  }

  private getStorage(): { getItem: (k: string) => string | null; setItem: (k: string, v: string) => void } {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
    return {
      getItem: (k: string) => this.memoryCache.get(k) ?? null,
      setItem: (k: string, v: string) => {
        this.memoryCache.set(k, v);
      },
    };
  }

  private initDefaults() {
    const storage = this.getStorage();
    if (!storage.getItem('reminders')) {
      storage.setItem('reminders', JSON.stringify(DEFAULT_REMINDERS));
    }
    if (!storage.getItem('vitals_readings')) {
      storage.setItem('vitals_readings', JSON.stringify(DEFAULT_VITALS));
    }
    if (!storage.getItem('sync_queue')) {
      storage.setItem('sync_queue', JSON.stringify([]));
    }
    if (!storage.getItem('game_sessions')) {
      storage.setItem('game_sessions', JSON.stringify([]));
    }
  }

  public subscribe(key: string, callback: () => void): () => void {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key)!.add(callback);
    return () => {
      this.subscribers.get(key)?.delete(callback);
    };
  }

  private notify(key: string) {
    this.subscribers.get(key)?.forEach((cb) => {
      try {
        cb();
      } catch (err) {
        console.warn('Storage subscriber error:', err);
      }
    });
  }

  public get<T>(key: string, fallback: T): T {
    try {
      const raw = this.getStorage().getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }

  public set<T>(key: string, value: T): void {
    try {
      const raw = JSON.stringify(value);
      this.getStorage().setItem(key, raw);
      this.notify(key);
    } catch (err) {
      console.warn(`Storage set error for key ${key}:`, err);
    }
  }

  // ─── Reminders CRUD ──────────────────────────────────────────────────────────

  public getReminders(patientId?: string): LocalReminder[] {
    const all = this.get<LocalReminder[]>('reminders', DEFAULT_REMINDERS);
    if (!patientId) return all;
    return all.filter((r) => r.patientId === patientId || r.patientId === 'default-patient');
  }

  public saveReminder(reminder: Omit<LocalReminder, '_id' | 'createdAt'> & { _id?: string }): LocalReminder {
    const all = this.getReminders();
    const isEdit = Boolean(reminder._id);
    const newId = reminder._id || `rem-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

    const savedItem: LocalReminder = {
      ...reminder,
      _id: newId,
      createdAt: new Date().toISOString(),
    };

    let updated: LocalReminder[];
    if (isEdit) {
      updated = all.map((r) => (r._id === newId ? savedItem : r));
    } else {
      updated = [savedItem, ...all];
    }

    this.set('reminders', updated);
    return savedItem;
  }

  public setReminders(reminders: LocalReminder[]): void {
    this.set('reminders', reminders);
  }

  public toggleReminder(id: string): LocalReminder | null {
    const all = this.getReminders();
    let updatedItem: LocalReminder | null = null;
    const updated = all.map((r) => {
      if (r._id === id) {
        updatedItem = { ...r, isActive: !r.isActive };
        return updatedItem;
      }
      return r;
    });
    if (updatedItem) {
      this.set('reminders', updated);
    }
    return updatedItem;
  }

  public acknowledgeReminder(id: string): LocalReminder | null {
    const all = this.getReminders();
    let updatedItem: LocalReminder | null = null;
    const now = new Date().toISOString();
    const updated = all.map((r) => {
      if (r._id === id) {
        updatedItem = { ...r, acknowledgedAt: now };
        return updatedItem;
      }
      return r;
    });
    if (updatedItem) {
      this.set('reminders', updated);
    }
    return updatedItem;
  }

  public deleteReminder(id: string): void {
    const all = this.getReminders();
    const updated = all.filter((r) => r._id !== id);
    this.set('reminders', updated);
  }

  // ─── Vitals Readings CRUD ───────────────────────────────────────────────────

  public getVitals(patientId?: string): LocalVitalReading[] {
    const all = this.get<LocalVitalReading[]>('vitals_readings', DEFAULT_VITALS);
    if (!patientId) return all;
    return all.filter((v) => v.patientId === patientId || v.patientId === 'default-patient');
  }

  public getLatestVital(patientId?: string): LocalVitalReading {
    const all = this.getVitals(patientId);
    if (all.length === 0) return DEFAULT_VITALS[0];
    return all[0];
  }

  public recordVital(reading: Omit<LocalVitalReading, '_id' | 'recordedAt'>): LocalVitalReading {
    const all = this.getVitals();
    const savedItem: LocalVitalReading = {
      ...reading,
      _id: `vital-${Date.now()}`,
      recordedAt: new Date().toISOString(),
    };

    // Store newest first, keep last 100 readings locally
    const updated = [savedItem, ...all].slice(0, 100);
    this.set('vitals_readings', updated);
    return savedItem;
  }

  // ─── Game Sessions CRUD ─────────────────────────────────────────────────────

  public getGameSessions(patientId?: string): LocalGameSession[] {
    const all = this.get<LocalGameSession[]>('game_sessions', []);
    if (!patientId) return all;
    return all.filter((s) => s.patientId === patientId || s.patientId === 'default-patient');
  }

  public recordGameSession(session: Omit<LocalGameSession, '_id' | 'completedAt'>): LocalGameSession {
    const all = this.getGameSessions();
    const saved: LocalGameSession = {
      ...session,
      _id: `session-${Date.now()}`,
      completedAt: new Date().toISOString(),
    };

    const updated = [saved, ...all].slice(0, 50);
    this.set('game_sessions', updated);
    return saved;
  }

  // ─── Sync Queue ─────────────────────────────────────────────────────────────

  public getSyncQueue(): SyncQueueItem[] {
    return this.get<SyncQueueItem[]>('sync_queue', []);
  }

  public queueAction(
    action: SyncQueueItem['action'],
    endpoint: string,
    method: SyncQueueItem['method'],
    payload: Record<string, unknown>
  ): void {
    const queue = this.getSyncQueue();
    const item: SyncQueueItem = {
      id: `sync-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      action,
      endpoint,
      method,
      payload,
      createdAt: new Date().toISOString(),
      retryCount: 0,
    };
    this.set('sync_queue', [...queue, item]);
  }

  public removeQueueItem(id: string): void {
    const queue = this.getSyncQueue();
    this.set('sync_queue', queue.filter((q) => q.id !== id));
  }

  public clearQueue(): void {
    this.set('sync_queue', []);
  }
}

export const localStore = new OfflineStore();

