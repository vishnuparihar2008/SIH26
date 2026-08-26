import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/context/AuthContext';
import { AppNavigator } from '@/navigation/AppNavigator';

/**
 * App entry point.
 *
 * Auth flow added (Phase 2 backend sync):
 * - AuthProvider manages login state, token storage, and session restore.
 * - AppNavigator gates navigation based on role:
 *     Unauthenticated → Login / Register screens
 *     Patient         → Cognitive Care home (games, voice, vitals, reminders)
 *     Caretaker       → Care Dashboard (patient list, vitals, game stats)
 *
 * Still NOT included (later phases):
 * - Local SQLite / WatermelonDB persistence (Phase 3)
 * - Offline ASR/TTS voice assistant (Phase 3)
 * - Adaptive difficulty engine wiring (Phase 4)
 * - BLE wearable + emergency response (Phase 5)
 */
export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
