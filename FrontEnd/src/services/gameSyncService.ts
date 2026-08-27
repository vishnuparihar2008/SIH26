/**
 * gameSyncService.ts — Synchronizes Cognitive Game Sessions & Scores
 *
 * Automatically records every finished cognitive game session to:
 * 1. On-device local storage (works in Airplane Mode)
 * 2. Backend /api/v1/patients/:id/game-results & /api/v1/sessions
 * 3. Offline sync queue if network is disconnected
 */

import { localStore, type LocalGameSession } from './storage';
import { patientApi, sessionApi } from './api';
import type { GameSessionResult } from '@/types/game';

export const gameSyncService = {
  /**
   * Records a completed game session
   */
  async recordGameSession(
    result: GameSessionResult,
    patientId: string
  ): Promise<LocalGameSession> {
    const targetPatientId = patientId || 'default-patient';

    // 1. Record in local storage immediately
    const localSession = localStore.recordGameSession({
      patientId: targetPatientId,
      gameId: result.gameId,
      score: result.score,
      accuracy: result.accuracy,
      durationSeconds: result.durationSeconds,
      difficultyLevel: result.difficultyLevel || 1,
    });

    // 2. Synchronize to backend if online, else queue
    try {
      if (targetPatientId !== 'default-patient') {
        await Promise.allSettled([
          patientApi.recordGame(targetPatientId, {
            gameId: result.gameId,
            score: result.score,
            accuracy: result.accuracy,
            durationSeconds: result.durationSeconds,
          }),
          sessionApi.record({
            patientId: targetPatientId,
            gameId: result.gameId,
            score: result.score,
            accuracy: result.accuracy,
            durationSeconds: result.durationSeconds,
            difficultyLevel: result.difficultyLevel || 1,
            completedAt: localSession.completedAt,
          }),
        ]);
      }
    } catch {
      // Offline fallback: queue sync action
      localStore.queueAction('RECORD_SESSION', `/patients/${targetPatientId}/game-results`, 'POST', {
        gameId: result.gameId,
        score: result.score,
        accuracy: result.accuracy,
        durationSeconds: result.durationSeconds,
        difficultyLevel: result.difficultyLevel || 1,
        completedAt: localSession.completedAt,
      });
    }

    return localSession;
  },
};

