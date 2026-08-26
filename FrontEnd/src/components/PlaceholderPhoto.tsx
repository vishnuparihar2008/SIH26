import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { colors, typography, spacing, rounded, shadows } from '@/theme/theme';

interface PlaceholderPhotoProps {
  label: string;
  imageUri?: string;
}

/**
 * Airbnb Design System Photo Component
 *
 * Characteristics:
 * - 16px corner radius (`rounded.card`).
 * - Full bleed image or soft canvas (#F7F7F7) placeholder with hairline border.
 * - Soft float elevation.
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
      <View style={styles.iconCircle}>
        <Text style={styles.icon}>🖼️</Text>
      </View>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.subtext}>Caregiver Photo Memory</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    height: 200,
    borderRadius: rounded.card,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.canvasSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    ...shadows.softFloat,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: rounded.full,
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.hairline,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  icon: {
    fontSize: 32,
  },
  imageWrapper: {
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: 220,
    borderRadius: rounded.card,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  caption: {
    fontSize: typography.bodySm.fontSize,
    fontWeight: '400',
    color: colors.mute,
    marginTop: spacing.xs,
  },
  label: {
    fontSize: typography.bodyMdStrong.fontSize,
    fontWeight: '700',
    color: colors.ink,
    textAlign: 'center',
    paddingHorizontal: spacing.sm,
  },
  subtext: {
    fontSize: typography.bodySm.fontSize,
    fontWeight: '400',
    color: colors.mute,
    marginTop: 2,
  },
});

