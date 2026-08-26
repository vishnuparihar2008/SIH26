import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, typography, spacing, layout, touchTarget } from '@/theme/theme';
import type { RootStackParamList } from '@/navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

interface HomeModule {
  id: string;
  title: string;
  description: string;
  icon: string;
  route: keyof RootStackParamList;
  highlight?: boolean;
}

const HOME_MODULES: HomeModule[] = [
  {
    id: 'games',
    title: 'Play Games',
    description: 'Memory, sequence & recognition exercises',
    icon: '🎮',
    route: 'GamesCatalog',
    highlight: true,
  },
  {
    id: 'reminders',
    title: 'Daily Reminders',
    description: 'Medicine, hydration & daily routine alerts',
    icon: '⏰',
    route: 'Reminders',
  },
  {
    id: 'voice',
    title: 'Voice Assistant',
    description: 'Speak in your regional language (Offline)',
    icon: '🎙️',
    route: 'VoiceAssist',
  },
  {
    id: 'vitals',
    title: 'Health & Safety',
    description: 'Wearable vitals status & emergency response',
    icon: '❤️',
    route: 'VitalsStatus',
  },
];

export function HomeScreen({ navigation }: Props) {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      accessibilityLabel="Cognitive Care Home Portal"
    >
      <Text style={styles.heading}>Welcome Back</Text>
      <Text style={styles.subheading}>Choose an activity to get started</Text>

      <View style={styles.grid}>
        {HOME_MODULES.map(module => (
          <Pressable
            key={module.id}
            accessibilityRole="button"
            accessibilityLabel={`${module.title}. ${module.description}`}
            onPress={() => navigation.navigate(module.route as any)}
            style={({ pressed }) => [
              styles.tile,
              module.highlight && styles.tileHighlight,
              pressed && styles.tilePressed,
            ]}
          >
            <Text style={styles.tileIcon}>{module.icon}</Text>
            <Text style={styles.tileTitle}>{module.title}</Text>
            <Text style={styles.tileDescription}>{module.description}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
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
  grid: {
    gap: spacing.md,
  },
  tile: {
    minHeight: touchTarget.minHeight * 1.6,
    borderRadius: touchTarget.borderRadius,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
    justifyContent: 'center',
  },
  tileHighlight: {
    borderColor: colors.primary,
    backgroundColor: '#F0F7FF',
  },
  tilePressed: {
    backgroundColor: colors.disabled,
  },
  tileIcon: {
    fontSize: 40,
    marginBottom: spacing.xs,
  },
  tileTitle: {
    fontSize: typography.heading,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  tileDescription: {
    fontSize: typography.caption,
    color: colors.textSecondary,
  },
});

