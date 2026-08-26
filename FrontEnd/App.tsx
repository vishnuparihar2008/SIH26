import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from '@/navigation/AppNavigator';

/**
 * Phase 1 entry point.
 *
 * Deliberately NOT included yet (later phases, per implementation-plan.md):
 * - Local SQLite / WatermelonDB persistence (Phase 2)
 * - Offline ASR/TTS voice assistant (Phase 3)
 * - Adaptive difficulty engine wiring (Phase 4)
 * - BLE wearable + emergency response (Phase 5)
 * - Backend sync (Phase 7)
 *
 * This app runs fully standalone, offline, with hardcoded difficulty,
 * exactly as scoped for Phase 1.
 */
export default function App() {
  return (
    <SafeAreaProvider>
      <AppNavigator />
    </SafeAreaProvider>
  );
}
