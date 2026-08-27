import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '@/context/AuthContext';
import { colors, typography } from '@/theme/theme';

// ─── Auth screens ─────────────────────────────────────────────────────────────
import { LoginScreen } from '@/screens/auth/LoginScreen';
import { RegisterScreen } from '@/screens/auth/RegisterScreen';

// ─── Patient screens ──────────────────────────────────────────────────────────
import { HomeScreen } from '@/screens/HomeScreen';
import { GamesCatalogScreen } from '@/screens/GamesCatalogScreen';
import { RemindersScreen } from '@/screens/RemindersScreen';
import { VoiceAssistPlaceholderScreen } from '@/screens/VoiceAssistPlaceholderScreen';
import { VitalsStatusScreen } from '@/screens/VitalsStatusScreen';
import { MemoryAlbumScreen } from '@/screens/games/MemoryAlbumScreen';
import { MemoryTrayScreen } from '@/screens/games/MemoryTrayScreen';
import { RoutineSequencerScreen } from '@/screens/games/RoutineSequencerScreen';
import { WhatChangedScreen } from '@/screens/games/WhatChangedScreen';
import { FaceNameMatchScreen } from '@/screens/games/FaceNameMatchScreen';
import { LocalCultureMatchScreen } from '@/screens/games/LocalCultureMatchScreen';

// ─── Caretaker screens ────────────────────────────────────────────────────────
import { CaretakerDashboardScreen } from '@/screens/caretaker/CaretakerDashboardScreen';

// ─── Param lists ─────────────────────────────────────────────────────────────

/** Auth stack — shown when the user is not logged in */
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

/** Patient stack — shown when a patient is authenticated */
export type PatientStackParamList = {
  Home: undefined;
  GamesCatalog: undefined;
  Reminders: undefined;
  VoiceAssist: undefined;
  VitalsStatus: undefined;
  MemoryAlbum: undefined;
  MemoryTray: undefined;
  RoutineSequencer: undefined;
  WhatChanged: undefined;
  FaceNameMatch: undefined;
  LocalCultureMatch: undefined;
};

/** Caretaker stack — shown when a caretaker is authenticated */
export type CaretakerStackParamList = {
  CaretakerDashboard: undefined;
};

// Keep the old alias for backwards compat with existing screen imports
export type RootStackParamList = PatientStackParamList;

// ─── Navigators ───────────────────────────────────────────────────────────────

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const PatientStack = createNativeStackNavigator<PatientStackParamList>();
const CaretakerStack = createNativeStackNavigator<CaretakerStackParamList>();

// Shared screen options
const screenOptions = {
  headerStyle: { backgroundColor: colors.canvas },
  headerTintColor: colors.ink,
  headerShadowVisible: false,
  headerTitleStyle: {
    fontSize: typography.displaySm.fontSize,
    fontWeight: '700' as const,
    color: colors.ink,
  },
};

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ ...screenOptions, headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ headerShown: true, title: 'Create Account' }}
      />
    </AuthStack.Navigator>
  );
}

function PatientNavigator() {
  return (
    <PatientStack.Navigator screenOptions={screenOptions}>
      <PatientStack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Cognitive Care' }}
      />
      <PatientStack.Screen
        name="GamesCatalog"
        component={GamesCatalogScreen}
        options={{ title: 'Memory Games' }}
      />
      <PatientStack.Screen
        name="Reminders"
        component={RemindersScreen}
        options={{ title: 'Daily Reminders' }}
      />
      <PatientStack.Screen
        name="VoiceAssist"
        component={VoiceAssistPlaceholderScreen}
        options={{ title: 'Voice Assistant' }}
      />
      <PatientStack.Screen
        name="VitalsStatus"
        component={VitalsStatusScreen}
        options={{ title: 'Health & Safety' }}
      />
      <PatientStack.Screen
        name="MemoryAlbum"
        component={MemoryAlbumScreen}
        options={{ title: 'My Memory Album' }}
      />
      <PatientStack.Screen
        name="MemoryTray"
        component={MemoryTrayScreen}
        options={{ title: 'Memory Tray' }}
      />
      <PatientStack.Screen
        name="RoutineSequencer"
        component={RoutineSequencerScreen}
        options={{ title: 'Daily Routine' }}
      />
      <PatientStack.Screen
        name="WhatChanged"
        component={WhatChangedScreen}
        options={{ title: 'What Changed?' }}
      />
      <PatientStack.Screen
        name="FaceNameMatch"
        component={FaceNameMatchScreen}
        options={{ title: 'Family Match' }}
      />
      <PatientStack.Screen
        name="LocalCultureMatch"
        component={LocalCultureMatchScreen}
        options={{ title: 'Local Culture' }}
      />
    </PatientStack.Navigator>
  );
}

function CaretakerNavigator() {
  return (
    <CaretakerStack.Navigator screenOptions={screenOptions}>
      <CaretakerStack.Screen
        name="CaretakerDashboard"
        component={CaretakerDashboardScreen}
        options={{ title: 'Care Dashboard' }}
      />
    </CaretakerStack.Navigator>
  );
}

// ─── Root navigator — auth-gated ──────────────────────────────────────────────

export function AppNavigator() {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Show a splash/loader while restoring the session token
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.canvas }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!isAuthenticated ? (
        // Not logged in → show auth screens
        <AuthNavigator />
      ) : user?.role === 'caretaker' ? (
        // Caretaker → care dashboard
        <CaretakerNavigator />
      ) : (
        // Patient (or unrecognized role) → cognitive care app
        <PatientNavigator />
      )}
    </NavigationContainer>
  );
}
