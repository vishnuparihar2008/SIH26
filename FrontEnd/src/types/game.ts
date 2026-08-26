/**
 * Shared types for the six Phase 1 games.
 *
 * NOTE: difficultyLevel is hardcoded per-game in Phase 1 (see
 * src/data/mockGameData.ts). The adaptive difficulty engine that
 * reads/writes this at runtime is Phase 4 — do not wire AI logic
 * into these types yet.
 */

export type GameId =
  | 'memory-album'
  | 'memory-tray'
  | 'routine-sequencer'
  | 'what-changed'
  | 'face-name-match'
  | 'local-culture-match';

export interface GameMeta {
  id: GameId;
  title: string;
  description: string;
  icon: string; // emoji placeholder until real iconography is designed
}

export interface MultipleChoiceQuestion {
  id: string;
  prompt: string;
  imageUri?: string; // for Memory Album / Face Match — caregiver-uploaded photo (Phase 2+)
  options: string[];
  correctOptionIndex: number;
}

export interface TrayItem {
  id: string;
  label: string;
  icon: string;
}

export interface RoutineStep {
  id: string;
  label: string;
  icon: string;
  correctOrder: number;
}

export interface SceneItem {
  id: string;
  label: string;
  icon: string;
}

/** Result of a single completed game session — aligned with Techspec §2.4 & §3.3
 * for Phase 2 local SQLite persistence and Phase 4 difficulty adaptation. */
export interface GameSessionResult {
  gameId: GameId;
  correctCount: number;
  totalCount: number;
  accuracy: number; // 0.0 to 1.0
  score: number; // 0 to 100
  difficultyLevel: number; // 1 to 5
  durationSeconds: number;
  errorTypes?: string[];
  completedAt: string; // ISO timestamp
}

/** Caregiver-managed personal photo asset per Techspec §2.9 */
export interface PhotoAsset {
  id: string;
  patientId?: string;
  localUri: string;
  label: string;
  relationship?: string;
  gameTags: ('memory-album' | 'face-name-match' | 'local-culture-match')[];
  syncedFlag?: boolean;
}

