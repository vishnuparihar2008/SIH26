/**
 * api.ts — Centralized API client for the Cognitive Care app.
 *
 * Uses the built-in fetch API (no extra deps).
 * Automatically attaches the Bearer token from AuthContext.
 * Falls back to Android emulator URL in development.
 *
 * Usage:
 *   import { api } from '@/services/api';
 *   const data = await api.post('/auth/login', { email, password });
 */

import { Platform } from 'react-native';

// ─── Config ─────────────────────────────────────────────────────────────────
// Android emulator → 10.0.2.2, Web/iOS simulator/physical device → localhost
// Change this to your deployed URL in production.
function getBaseUrl(): string {
  if (!__DEV__) return 'https://your-production-api.com/api/v1';
  if (Platform.OS === 'android') return 'http://10.0.2.2:5000/api/v1'; // Android emulator
  if (typeof document !== 'undefined') return 'http://localhost:5000/api/v1'; // web browser
  return 'http://192.168.29.199:5000/api/v1'; // physical iOS / Android device on LAN
}
const BASE_URL = getBaseUrl();

// ─── Token store ─────────────────────────────────────────────────────────────
// Simple module-level singleton — AuthContext sets this after login.
let _authToken: string | null = null;

export function setAuthToken(token: string | null) {
  _authToken = token;
}

export function getAuthToken(): string | null {
  return _authToken;
}

// ─── Core fetch wrapper ───────────────────────────────────────────────────────

type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface ApiOptions {
  method?: HTTPMethod;
  body?: Record<string, unknown>;
  headers?: Record<string, string>;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly data?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T = unknown>(
  path: string,
  options: ApiOptions = {},
): Promise<T> {
  const { method = 'GET', body, headers: extraHeaders = {} } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extraHeaders,
  };

  if (_authToken) {
    headers['Authorization'] = `Bearer ${_authToken}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    json = null;
  }

  if (!response.ok) {
    const message =
      (json as { message?: string })?.message ?? `HTTP ${response.status}`;
    throw new ApiError(response.status, message, json);
  }

  return json as T;
}

// ─── Convenience methods ──────────────────────────────────────────────────────

export const api = {
  get: <T = unknown>(path: string) => request<T>(path, { method: 'GET' }),

  post: <T = unknown>(path: string, body?: Record<string, unknown>) =>
    request<T>(path, { method: 'POST', body }),

  put: <T = unknown>(path: string, body?: Record<string, unknown>) =>
    request<T>(path, { method: 'PUT', body }),

  patch: <T = unknown>(path: string, body?: Record<string, unknown>) =>
    request<T>(path, { method: 'PATCH', body }),

  delete: <T = unknown>(path: string) => request<T>(path, { method: 'DELETE' }),
};

// ─── Typed API calls ──────────────────────────────────────────────────────────

export interface LoginPayload {
  email: string;
  password: string;
  role?: 'caretaker' | 'patient';
}

export interface RegisterPayload {
  name: string;
  email: string;
  phone?: string;
  password: string;
  role: 'caretaker' | 'patient';
  relationshipToPatients?: string;
  dateOfBirth?: string;
  gender?: string;
}

export interface AuthResponse {
  message: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: 'caretaker' | 'patient';
    caretakerProfile?: unknown;
    patientProfile?: unknown;
  };
  accessToken: string;
}

export interface Patient {
  _id: string;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup: string;
  relationshipToCaretaker?: string;
  status: 'active' | 'inactive' | 'deceased' | 'discharged';
  vitalsMonitoring: {
    enabled: boolean;
    lastRecordedAt: string | null;
    currentVitals: {
      heartRate: number;
      spO2: number;
      motionStatus: string;
      tier: 'normal' | 'low' | 'high' | 'lethal';
    };
  };
  gameStats: {
    totalSessions: number;
    averageScore: number;
    lastPlayedAt: string | null;
  };
  contact: { phone: string; email: string };
  medicalInfo: {
    conditions: string[];
    allergies: string[];
    medications: { name: string; dosage: string; frequency: string }[];
    emergencyContact?: { name?: string; phone?: string; relation?: string };
  };
}

export const authApi = {
  login: (payload: LoginPayload) =>
    api.post<AuthResponse>('/auth/login', payload as unknown as Record<string, unknown>),

  register: (payload: RegisterPayload) =>
    api.post<AuthResponse>('/auth/register', payload as unknown as Record<string, unknown>),

  me: () => api.get<{ user: AuthResponse['user'] }>('/auth/me'),

  logout: () => api.post('/auth/logout', {}),
};

export const patientApi = {
  list: () => api.get<{ success: boolean; count: number; data: Patient[] }>('/patients'),

  getById: (id: string) => api.get<{ success: boolean; data: Patient }>(`/patients/${id}`),

  create: (data: Partial<Patient> & { email?: string; password?: string; phone?: string }) =>
    api.post<{ success: boolean; data: Patient }>('/patients', data as Record<string, unknown>),

  link: (identifier: string) =>
    api.post<{ success: boolean; message: string; data: Patient }>('/patients/link', { identifier }),

  update: (id: string, data: Partial<Patient>) =>
    api.put<{ success: boolean; data: Patient }>(`/patients/${id}`, data as Record<string, unknown>),

  recordGame: (id: string, payload: { gameId: string; score: number; accuracy?: number; durationSeconds?: number }) =>
    api.post(`/patients/${id}/game-results`, payload as Record<string, unknown>),
};

export interface ServerReminder {
  _id: string;
  patientId: string | { _id: string; fullName: string };
  caretakerId?: string;
  title: string;
  description?: string;
  type: 'medicine' | 'hydration' | 'appointment' | 'exercise' | 'meal' | 'sleep' | 'other';
  scheduledAt: string;
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

export const reminderApi = {
  list: (patientId?: string) =>
    api.get<{ success: boolean; count: number; data: ServerReminder[] }>(
      patientId ? `/reminders/patient/${patientId}` : '/reminders'
    ),

  create: (payload: Partial<ServerReminder>) =>
    api.post<{ success: boolean; message: string; data: ServerReminder }>(
      '/reminders',
      payload as Record<string, unknown>
    ),

  update: (id: string, payload: Partial<ServerReminder>) =>
    api.put<{ success: boolean; message: string; data: ServerReminder }>(
      `/reminders/${id}`,
      payload as Record<string, unknown>
    ),

  toggle: (id: string) =>
    api.patch<{ success: boolean; message: string; data: ServerReminder }>(
      `/reminders/${id}/toggle`,
      {}
    ),

  acknowledge: (id: string) =>
    api.patch<{ success: boolean; message: string; data: ServerReminder }>(
      `/reminders/${id}/acknowledge`,
      {}
    ),

  delete: (id: string) =>
    api.delete<{ success: boolean; message: string }>(`/reminders/${id}`),
};

export const vitalsApi = {
  getHistory: (patientId: string, limit = 50) =>
    api.get<{ success: boolean; count: number; data: any[] }>(
      `/vitals/patient/${patientId}?limit=${limit}`
    ),

  record: (patientId: string, payload: Record<string, unknown>) =>
    api.post<{ success: boolean; message: string; data: any; currentVitals: any }>(
      `/vitals/patient/${patientId}`,
      payload
    ),

  bulkSync: (readings: any[]) =>
    api.post<{ success: boolean; message: string; count: number }>('/vitals/bulk', { readings }),
};

export const sessionApi = {
  getHistory: (patientId: string, limit = 50) =>
    api.get<{ success: boolean; count: number; data: any[] }>(
      `/sessions/patient/${patientId}?limit=${limit}`
    ),

  record: (payload: Record<string, unknown>) =>
    api.post<{ success: boolean; message: string; data: any }>('/sessions', payload),

  bulkSync: (sessions: any[]) =>
    api.post<{ success: boolean; message: string; count: number }>('/sessions/bulk', { sessions }),
};


