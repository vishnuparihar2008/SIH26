import React from 'react';
import { Text, ScrollView, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GameCard } from '@/components/GameCard';
import { GAME_CATALOG } from '@/data/mockGameData';
import { colors, typography, spacing, layout } from '@/theme/theme';
import type { RootStackParamList } from '@/navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'GamesCatalog'>;

export function GamesCatalogScreen({ navigation }: Props) {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      accessibilityLabel="Choose a cognitive game"
    >
      <Text style={styles.heading}>Memory & Focus Games</Text>
      <Text style={styles.subheading}>Select a game to practice your memory</Text>

      {GAME_CATALOG.map(game => (
        <GameCard
          key={game.id}
          game={game}
          onPress={() => navigation.navigate(routeForGame(game.id))}
        />
      ))}
    </ScrollView>
  );
}

function routeForGame(
  id: (typeof GAME_CATALOG)[number]['id'],
): keyof RootStackParamList {
  const map: Record<string, keyof RootStackParamList> = {
    'memory-album': 'MemoryAlbum',
    'memory-tray': 'MemoryTray',
    'routine-sequencer': 'RoutineSequencer',
    'what-changed': 'WhatChanged',
    'face-name-match': 'FaceNameMatch',
    'local-culture-match': 'LocalCultureMatch',
  };
  return map[id];
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: layout.screenPadding,
  },
  heading: {
    fontSize: typography.title,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subheading: {
    fontSize: typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
});
