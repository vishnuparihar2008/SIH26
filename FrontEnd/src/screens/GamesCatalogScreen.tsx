import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GameCard } from '@/components/GameCard';
import { GAME_CATALOG } from '@/data/mockGameData';
import { colors, typography, spacing, rounded } from '@/theme/theme';
import type { RootStackParamList } from '@/navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'GamesCatalog'>;

type CategoryTab = 'all' | 'memory' | 'routine' | 'recognition';

const CATEGORIES: { id: CategoryTab; label: string; icon: string }[] = [
  { id: 'all', label: 'All Games', icon: '✨' },
  { id: 'memory', label: 'Memory', icon: '📸' },
  { id: 'routine', label: 'Routine', icon: '⏰' },
  { id: 'recognition', label: 'Recognition', icon: '🌿' },
];

export function GamesCatalogScreen({ navigation }: Props) {
  const [activeTab, setActiveTab] = useState<CategoryTab>('all');

  const filteredGames = GAME_CATALOG.filter(game => {
    if (activeTab === 'all') return true;
    if (activeTab === 'memory') {
      return game.id === 'memory-album' || game.id === 'memory-tray';
    }
    if (activeTab === 'routine') {
      return game.id === 'routine-sequencer' || game.id === 'what-changed';
    }
    if (activeTab === 'recognition') {
      return game.id === 'face-name-match' || game.id === 'local-culture-match';
    }
    return true;
  });

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      accessibilityLabel="Choose a cognitive game"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.heading}>Cognitive exercises</Text>
        <Text style={styles.subheading}>
          Explore evidence-based memory, sequence, and recognition games
        </Text>
      </View>

      {/* Category Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabScroll}
        style={styles.tabContainer}
      >
        {CATEGORIES.map(cat => {
          const isActive = activeTab === cat.id;
          return (
            <Pressable
              key={cat.id}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              onPress={() => setActiveTab(cat.id)}
              style={[styles.tab, isActive && styles.tabActive]}
            >
              <Text style={styles.tabIcon}>{cat.icon}</Text>
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {cat.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Game Cards List */}
      <View style={styles.cardsList}>
        {filteredGames.map(game => (
          <GameCard
            key={game.id}
            game={game}
            isNew={game.id === 'memory-album' || game.id === 'local-culture-match'}
            badge={game.id === 'routine-sequencer' ? 'Guest favorite' : undefined}
            onPress={() => navigation.navigate(routeForGame(game.id))}
          />
        ))}
      </View>
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
    backgroundColor: colors.canvas,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.section,
  },
  header: {
    marginBottom: spacing.md,
  },
  heading: {
    fontSize: typography.displayLg.fontSize,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 4,
  },
  subheading: {
    fontSize: typography.bodyLg.fontSize,
    fontWeight: '400',
    color: colors.mute,
    lineHeight: typography.bodyLg.lineHeight,
  },
  tabContainer: {
    marginBottom: spacing.lg,
  },
  tabScroll: {
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: rounded.button,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.canvas,
    gap: spacing.xxs,
  },
  tabActive: {
    borderColor: colors.ink,
    backgroundColor: colors.canvasSoft,
  },
  tabIcon: {
    fontSize: 14,
  },
  tabLabel: {
    fontSize: typography.bodySmStrong.fontSize,
    fontWeight: '700',
    color: colors.mute,
  },
  tabLabelActive: {
    color: colors.ink,
  },
  cardsList: {
    gap: spacing.md,
  },
});
