/**
 * reminderService.ts — Reminder Scheduler and State Management for Cognitive Care.
 *
 * Provides offline-first scheduling, time grouping (Morning/Afternoon/Evening/Night),
 * status acknowledgement, and synchronization.
 */

import { localStore, type LocalReminder } from './storage';
import { reminderApi, ApiError } from './api';

export type TimeOfDayGroup = 'Morning' | 'Afternoon' | 'Evening' | 'Night';

export interface GroupedReminders {
  group: TimeOfDayGroup;
  icon: string;
  timeRange: string;
  items: LocalReminder[];
}

export const REMINDER_TYPE_META: Record<
  LocalReminder['type'],
  { icon: string; label: string; color: string; bg: string }
> = {
  medicine: { icon: '💊', label: 'Medicine', color: '#FF385C', bg: '#FFF0ED' },
  hydration: { icon: '💧', label: 'Hydration', color: '#0284C7', bg: '#F0F9FF' },
  meal: { icon: '🍲', label: 'Meal', color: '#D97706', bg: '#FFFBEB' },
  exercise: { icon: '🚶', label: 'Activity', color: '#059669', bg: '#ECFDF5' },
  appointment: { icon: '📅', label: 'Appointment', color: '#7C3AED', bg: '#F5F3FF' },
  sleep: { icon: '🌙', label: 'Rest & Sleep', color: '#4B5563', bg: '#F3F4F6' },
  other: { icon: '🔔', label: 'Reminder', color: '#222222', bg: '#F7F7F7' },
};

function getTimeOfDay(timeStr: string): TimeOfDayGroup {
  // Try parsing time from string like "08:00 AM" or ISO string
  let hour = 8;
  if (timeStr.includes('AM') || timeStr.includes('PM')) {
    const parts = timeStr.trim().split(/[:\s]/);
    let h = parseInt(parts[0], 10);
    const isPM = timeStr.toUpperCase().includes('PM');
    if (isPM && h < 12) h += 12;
    if (!isPM && h === 12) h = 0;
    hour = h;
  } else {
    try {
      const d = new Date(timeStr);
      if (!isNaN(d.getTime())) {
        hour = d.getHours();
      }
    } catch {
      hour = 8;
    }
  }

  if (hour >= 5 && hour < 12) return 'Morning';
  if (hour >= 12 && hour < 17) return 'Afternoon';
  if (hour >= 17 && hour < 21) return 'Evening';
  return 'Night';
}

export const reminderService = {
  /**
   * Returns all reminders for a patient, grouped by time of day
   */
  getGroupedReminders(patientId?: string): GroupedReminders[] {
    const reminders = localStore.getReminders(patientId);

    const groups: Record<TimeOfDayGroup, LocalReminder[]> = {
      Morning: [],
      Afternoon: [],
      Evening: [],
      Night: [],
    };

    reminders.forEach((r) => {
      const slot = getTimeOfDay(r.timeStr || r.scheduledAt);
      groups[slot].push(r);
    });

    return [
      {
        group: 'Morning',
        icon: '🌅',
        timeRange: '5:00 AM – 12:00 PM',
        items: groups.Morning,
      },
      {
        group: 'Afternoon',
        icon: '☀️',
        timeRange: '12:00 PM – 5:00 PM',
        items: groups.Afternoon,
      },
      {
        group: 'Evening',
        icon: '🌇',
        timeRange: '5:00 PM – 9:00 PM',
        items: groups.Evening,
      },
      {
        group: 'Night',
        icon: '🌙',
        timeRange: '9:00 PM – 5:00 AM',
        items: groups.Night,
      },
    ];
  },

  /**
   * Calculates adherence percentage for today's reminders
   */
  getAdherenceStats(patientId?: string): { completed: number; total: number; percentage: number } {
    const reminders = localStore.getReminders(patientId).filter((r) => r.isActive);
    if (reminders.length === 0) return { completed: 0, total: 0, percentage: 100 };

    const completed = reminders.filter((r) => Boolean(r.acknowledgedAt)).length;
    const percentage = Math.round((completed / reminders.length) * 100);
    return { completed, total: reminders.length, percentage };
  },

  /**
   * Acknowledges / marks a reminder as completed.
   * Works fully offline and queues sync if network is down.
   */
  async acknowledge(id: string): Promise<LocalReminder | null> {
    const updated = localStore.acknowledgeReminder(id);

    // Attempt online sync opportunistically
    try {
      if (id.startsWith('rem-') && !id.includes('-')) {
        // If it's a backend MongoDB ObjectId, patch server directly
        await reminderApi.acknowledge(id);
      } else {
        localStore.queueAction('ACK_REMINDER', `/reminders/${id}/acknowledge`, 'PATCH', { id });
      }
    } catch {
      localStore.queueAction('ACK_REMINDER', `/reminders/${id}/acknowledge`, 'PATCH', { id });
    }

    return updated;
  },

  /**
   * Toggles active/inactive state of a reminder
   */
  async toggle(id: string): Promise<LocalReminder | null> {
    const updated = localStore.toggleReminder(id);
    try {
      await reminderApi.toggle(id);
    } catch {
      localStore.queueAction('UPDATE_REMINDER', `/reminders/${id}/toggle`, 'PATCH', { id });
    }
    return updated;
  },

  /**
   * Caretaker creates a new reminder for a patient
   */
  async create(payload: {
    patientId: string;
    title: string;
    description?: string;
    type: LocalReminder['type'];
    scheduledAt: string;
    timeStr: string;
    recurrence?: LocalReminder['recurrence'];
    medication?: LocalReminder['medication'];
  }): Promise<LocalReminder> {
    // 1. Save to local storage first (instant responsiveness)
    const local = localStore.saveReminder({
      ...payload,
      recurrence: payload.recurrence || 'daily',
      isActive: true,
    });

    // 2. Sync to backend if online
    try {
      const res = await reminderApi.create({
        patientId: payload.patientId,
        title: payload.title,
        description: payload.description,
        type: payload.type,
        scheduledAt: payload.scheduledAt,
        recurrence: payload.recurrence || 'daily',
        medication: payload.medication,
      });

      if (res.data?._id) {
        // Replace local id with server id
        localStore.deleteReminder(local._id);
        const serverSynced: LocalReminder = {
          ...local,
          _id: res.data._id,
        };
        localStore.saveReminder(serverSynced);
        return serverSynced;
      }
    } catch (err) {
      // Offline fallback: queue creation
      localStore.queueAction('CREATE_REMINDER', '/reminders', 'POST', {
        patientId: payload.patientId,
        title: payload.title,
        description: payload.description,
        type: payload.type,
        scheduledAt: payload.scheduledAt,
        recurrence: payload.recurrence || 'daily',
        medication: payload.medication,
      });
    }

    return local;
  },

  /**
   * Caretaker deletes a reminder
   */
  async delete(id: string): Promise<void> {
    localStore.deleteReminder(id);
    try {
      await reminderApi.delete(id);
    } catch {
      localStore.queueAction('DELETE_REMINDER', `/reminders/${id}`, 'DELETE', { id });
    }
  },

  /**
   * Syncs reminders from server into local store for a given patient
   */
  async syncFromServer(patientId?: string): Promise<void> {
    try {
      const res = await reminderApi.list(patientId);
      if (res.data && Array.isArray(res.data)) {
        const mapped: LocalReminder[] = res.data.map((r: any) => {
          const dateObj = new Date(r.scheduledAt);
          const hours = dateObj.getHours();
          const mins = dateObj.getMinutes();
          const ampm = hours >= 12 ? 'PM' : 'AM';
          const formattedHours = hours % 12 || 12;
          const formattedMins = mins < 10 ? `0${mins}` : mins;
          const timeStr = `${formattedHours}:${formattedMins} ${ampm}`;

          return {
            _id: r._id,
            patientId: typeof r.patientId === 'object' ? r.patientId._id : r.patientId,
            caretakerId: r.caretakerId,
            title: r.title,
            description: r.description,
            type: r.type,
            scheduledAt: r.scheduledAt,
            timeStr,
            recurrence: r.recurrence,
            isActive: r.isActive,
            acknowledgedAt: r.acknowledgedAt,
            medication: r.medication,
            createdAt: r.createdAt || new Date().toISOString(),
          };
        });

        if (mapped.length > 0) {
          localStore.setReminders(mapped);
        }
      }
    } catch {
      // Use existing local storage seamlessly
    }
  },
};
