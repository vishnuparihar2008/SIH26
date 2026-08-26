import {
  GameMeta,
  MultipleChoiceQuestion,
  TrayItem,
  RoutineStep,
  SceneItem,
} from '@/types/game';

/**
 * Phase 1 placeholder content.
 *
 * Three of these games (Memory Album, Family Face & Name Match,
 * Local Culture Match) are designed around caregiver-uploaded
 * personal photos and regionally-specific media — that upload/
 * management flow is NOT part of this Techspec's original data
 * model and is not built in Phase 1. Everywhere a real photo would
 * go, `imageUri` is left undefined and the UI renders a labelled
 * placeholder instead, so the game logic can be built and tested
 * independent of that feature.
 */

export const GAME_CATALOG: GameMeta[] = [
  {
    id: 'memory-album',
    title: 'My Memory Album',
    description: 'Who is this? Recognise family and loved ones.',
    icon: '📸',
  },
  {
    id: 'memory-tray',
    title: 'Memory Tray',
    description: 'Remember the objects you just saw.',
    icon: '🧺',
  },
  {
    id: 'routine-sequencer',
    title: 'Daily Routine Sequencer',
    description: 'Put your morning routine in the right order.',
    icon: '⏰',
  },
  {
    id: 'what-changed',
    title: 'What Changed?',
    description: 'Spot what is different between two scenes.',
    icon: '👀',
  },
  {
    id: 'face-name-match',
    title: 'Family Face & Name Match',
    description: 'Match each family member to their name.',
    icon: '👨‍👩‍👧',
  },
  {
    id: 'local-culture-match',
    title: 'Local Culture Match',
    description: 'Match familiar food, festivals, and traditions.',
    icon: '🌿',
  },
];

// --- 1. My Memory Album (hardcoded difficulty: Easy, 2 options) ---
export const MEMORY_ALBUM_QUESTIONS: MultipleChoiceQuestion[] = [
  {
    id: 'ma-1',
    prompt: 'Who is this?',
    options: ['Daughter', 'Son'],
    correctOptionIndex: 0,
  },
  {
    id: 'ma-2',
    prompt: 'Who is this?',
    options: ['Granddaughter', 'Friend'],
    correctOptionIndex: 0,
  },
  {
    id: 'ma-3',
    prompt: 'Who is this?',
    options: ['Friend', 'Son'],
    correctOptionIndex: 1,
  },
];

// --- 2. Memory Tray (hardcoded difficulty: 3 items shown, 5s) ---
export const MEMORY_TRAY_SHOWN_ITEMS: TrayItem[] = [
  { id: 't-glass', label: 'Glass', icon: '🥛' },
  { id: 't-apple', label: 'Apple', icon: '🍎' },
  { id: 't-keys', label: 'Keys', icon: '🔑' },
];

export const MEMORY_TRAY_DISPLAY_SECONDS = 5;

export const MEMORY_TRAY_OPTION_POOL: TrayItem[] = [
  ...MEMORY_TRAY_SHOWN_ITEMS,
  { id: 't-book', label: 'Book', icon: '📖' },
  { id: 't-spectacles', label: 'Spectacles', icon: '👓' },
];

// --- 3. Daily Routine Sequencer (hardcoded difficulty: 5 steps) ---
export const ROUTINE_STEPS: RoutineStep[] = [
  { id: 'r-wake', label: 'Wake Up', icon: '🌅', correctOrder: 0 },
  { id: 'r-brush', label: 'Brush', icon: '🪥', correctOrder: 1 },
  { id: 'r-breakfast', label: 'Breakfast', icon: '🍽️', correctOrder: 2 },
  { id: 'r-medicine', label: 'Medicine', icon: '💊', correctOrder: 3 },
  { id: 'r-walk', label: 'Walk', icon: '🚶', correctOrder: 4 },
];

// --- 4. What Changed? (hardcoded difficulty: 1 object removed) ---
export const SCENE_BEFORE: SceneItem[] = [
  { id: 's-cup', label: 'Cup', icon: '☕' },
  { id: 's-apple', label: 'Apple', icon: '🍎' },
  { id: 's-book', label: 'Book', icon: '📖' },
  { id: 's-bottle', label: 'Bottle', icon: '💧' },
];

export const SCENE_AFTER: SceneItem[] = SCENE_BEFORE.filter(
  item => item.id !== 's-bottle',
);

export const WHAT_CHANGED_OPTIONS = SCENE_BEFORE.map(item => item.label);
export const WHAT_CHANGED_CORRECT_INDEX = SCENE_BEFORE.findIndex(
  item => item.id === 's-bottle',
);

// --- 5. Family Face & Name Match (hardcoded difficulty: 4 options) ---
export const FACE_NAME_QUESTIONS: MultipleChoiceQuestion[] = [
  {
    id: 'fn-1',
    prompt: 'What is Simran\'s relation to you?',
    options: ['Granddaughter', 'Neighbour', 'Nurse', 'Friend'],
    correctOptionIndex: 0,
  },
  {
    id: 'fn-2',
    prompt: 'What is Riya\'s relation to you?',
    options: ['Daughter', 'Son', 'Grandson', 'Friend'],
    correctOptionIndex: 0,
  },
];

// --- 6. Local Culture Match (hardcoded difficulty: 4 options) ---
export const LOCAL_CULTURE_QUESTIONS: MultipleChoiceQuestion[] = [
  {
    id: 'lc-1',
    prompt: 'Which category does this belong to?\n"Bihu"',
    options: ['Festival', 'Food', 'Clothing', 'Music instrument'],
    correctOptionIndex: 0,
  },
  {
    id: 'lc-2',
    prompt: 'Which category does this belong to?\n"Gamosa"',
    options: ['Food', 'Clothing', 'Festival', 'Place'],
    correctOptionIndex: 1,
  },
];
