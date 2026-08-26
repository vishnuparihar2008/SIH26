import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '@/screens/HomeScreen';
import { GamesCatalogScreen } from '@/screens/GamesCatalogScreen';
import { RemindersPlaceholderScreen } from '@/screens/RemindersPlaceholderScreen';
import { VoiceAssistPlaceholderScreen } from '@/screens/VoiceAssistPlaceholderScreen';
import { VitalsStatusPlaceholderScreen } from '@/screens/VitalsStatusPlaceholderScreen';
import { MemoryAlbumScreen } from '@/screens/games/MemoryAlbumScreen';
import { MemoryTrayScreen } from '@/screens/games/MemoryTrayScreen';
import { RoutineSequencerScreen } from '@/screens/games/RoutineSequencerScreen';
import { WhatChangedScreen } from '@/screens/games/WhatChangedScreen';
import { FaceNameMatchScreen } from '@/screens/games/FaceNameMatchScreen';
import { LocalCultureMatchScreen } from '@/screens/games/LocalCultureMatchScreen';
import { colors, typography } from '@/theme/theme';

export type RootStackParamList = {
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

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontSize: typography.heading },
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'Cognitive Care' }}
        />
        <Stack.Screen
          name="GamesCatalog"
          component={GamesCatalogScreen}
          options={{ title: 'Memory Games' }}
        />
        <Stack.Screen
          name="Reminders"
          component={RemindersPlaceholderScreen}
          options={{ title: 'Daily Reminders' }}
        />
        <Stack.Screen
          name="VoiceAssist"
          component={VoiceAssistPlaceholderScreen}
          options={{ title: 'Voice Assistant' }}
        />
        <Stack.Screen
          name="VitalsStatus"
          component={VitalsStatusPlaceholderScreen}
          options={{ title: 'Health & Safety' }}
        />
        <Stack.Screen
          name="MemoryAlbum"
          component={MemoryAlbumScreen}
          options={{ title: 'My Memory Album' }}
        />
        <Stack.Screen
          name="MemoryTray"
          component={MemoryTrayScreen}
          options={{ title: 'Memory Tray' }}
        />
        <Stack.Screen
          name="RoutineSequencer"
          component={RoutineSequencerScreen}
          options={{ title: 'Daily Routine' }}
        />
        <Stack.Screen
          name="WhatChanged"
          component={WhatChangedScreen}
          options={{ title: 'What Changed?' }}
        />
        <Stack.Screen
          name="FaceNameMatch"
          component={FaceNameMatchScreen}
          options={{ title: 'Family Match' }}
        />
        <Stack.Screen
          name="LocalCultureMatch"
          component={LocalCultureMatchScreen}
          options={{ title: 'Local Culture' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

