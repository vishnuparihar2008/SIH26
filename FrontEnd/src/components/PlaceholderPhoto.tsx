import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { colors, typography, spacing } from '@/theme/theme';

interface PlaceholderPhotoProps {
  label: string;
  imageUri?: string;
}

/**
 * Renders caregiver-uploaded photo if imageUri is present (Techspec §2.9),
 * or an accessible high-contrast placeholder if no photo is assigned.
 */
export function PlaceholderPhoto({ label, imageUri }: PlaceholderPhotoProps) {
  if (imageUri) {
    return (
      <View style={styles.imageWrapper}>
        <Image
          source={{ uri: imageUri }}
          style={styles.image}
          contentFit="cover"
          accessibilityLabel={label}
        />
        {label ? <Text style={styles.caption}>{label}</Text> : null}
      </View>
    );
  }

  return (
    <View style={styles.box} accessibilityLabel={`Photo placeholder: ${label}`}>
      <Text style={styles.icon}>🖼️</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    height: 220,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  imageWrapper: {
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.border,
  },
  caption: {
    fontSize: typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  icon: {
    fontSize: 48,
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.sm,
  },
});

