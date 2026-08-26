import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, typography, spacing, rounded, shadows } from '@/theme/theme';
import { useAuth } from '@/context/AuthContext';
import { ApiError } from '@/services/api';
import type { AuthStackParamList } from '@/navigation/AppNavigator';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

type Role = 'patient' | 'caretaker';

export function RegisterScreen({ navigation }: Props) {
  const { register } = useAuth();

  const [role, setRole] = useState<Role>('patient');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [relationship, setRelationship] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRegister() {
    setError(null);

    // Local validation
    if (!name.trim() || !email.trim() || !password) {
      setError('Name, email, and password are required.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        password,
        role,
        relationshipToPatients: role === 'caretaker' ? relationship : undefined,
      });
      // AuthContext updates user state → AppNavigator automatically transitions
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>🧠</Text>
          <Text style={styles.title}>Create an account</Text>
          <Text style={styles.subtitle}>
            Join Cognitive Care to get started
          </Text>
        </View>

        {/* Role Selector */}
        <View style={styles.roleRow}>
          {(['patient', 'caretaker'] as Role[]).map(r => (
            <Pressable
              key={r}
              style={[styles.rolePill, role === r && styles.rolePillActive]}
              onPress={() => setRole(r)}
              accessibilityRole="button"
              accessibilityState={{ selected: role === r }}
            >
              <Text style={[styles.rolePillText, role === r && styles.rolePillTextActive]}>
                {r === 'patient' ? '👤 Patient' : '🩺 Caretaker'}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Role description */}
        <View style={styles.roleHint}>
          <Text style={styles.roleHintText}>
            {role === 'patient'
              ? 'As a patient you can play memory games, use voice assistance, and track your health.'
              : 'As a caretaker you can monitor patients, view their progress, and manage care reminders.'}
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Field label="Full name">
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Anita Sharma"
              placeholderTextColor={colors.mute}
              autoCapitalize="words"
              textContentType="name"
              autoComplete="name"
              returnKeyType="next"
              accessibilityLabel="Full name"
            />
          </Field>

          <Field label="Email address">
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={colors.mute}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              autoComplete="email"
              returnKeyType="next"
              accessibilityLabel="Email address"
            />
          </Field>

          <Field label="Phone number (optional)">
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="+91 9876543210"
              placeholderTextColor={colors.mute}
              keyboardType="phone-pad"
              textContentType="telephoneNumber"
              returnKeyType="next"
              accessibilityLabel="Phone number"
            />
          </Field>

          {/* Caretaker-only field */}
          {role === 'caretaker' && (
            <Field label="Your relationship to patients">
              <TextInput
                style={styles.input}
                value={relationship}
                onChangeText={setRelationship}
                placeholder="e.g. Son, Nurse, Guardian"
                placeholderTextColor={colors.mute}
                autoCapitalize="words"
                returnKeyType="next"
                accessibilityLabel="Relationship to patients"
              />
            </Field>
          )}

          <Field label="Password">
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, styles.inputFlex]}
                value={password}
                onChangeText={setPassword}
                placeholder="At least 8 characters"
                placeholderTextColor={colors.mute}
                secureTextEntry={!showPassword}
                textContentType="newPassword"
                autoComplete="new-password"
                returnKeyType="next"
                accessibilityLabel="Password"
              />
              <Pressable
                style={styles.eyeButton}
                onPress={() => setShowPassword(v => !v)}
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              >
                <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
              </Pressable>
            </View>
          </Field>

          <Field label="Confirm password">
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Repeat your password"
              placeholderTextColor={colors.mute}
              secureTextEntry={!showPassword}
              textContentType="newPassword"
              returnKeyType="done"
              onSubmitEditing={handleRegister}
              accessibilityLabel="Confirm password"
            />
          </Field>

          {/* Error */}
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          ) : null}

          {/* Register Button */}
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.primaryButtonPressed,
              isLoading && styles.primaryButtonDisabled,
            ]}
            onPress={handleRegister}
            disabled={isLoading}
            accessibilityRole="button"
            accessibilityLabel="Create account"
          >
            {isLoading ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <Text style={styles.primaryButtonText}>Create account</Text>
            )}
          </Pressable>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Pressable
            onPress={() => navigation.navigate('Login')}
            accessibilityRole="link"
          >
            <Text style={styles.footerLink}>Sign in</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Small helper component to reduce repetition ─────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={fieldStyles.group}>
      <Text style={fieldStyles.label}>{label}</Text>
      {children}
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  group: { gap: 6 },
  label: {
    fontSize: typography.bodySmStrong.fontSize,
    fontWeight: '700',
    color: colors.ink,
  },
});

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing['2xl'],
    paddingBottom: spacing.section,
  },

  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logo: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography.displayMd.fontSize,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.bodyMd.fontSize,
    color: colors.mute,
    textAlign: 'center',
  },

  roleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
    backgroundColor: colors.canvasSoft,
    borderRadius: rounded.button,
    padding: 4,
  },
  rolePill: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: rounded.button - 2,
    alignItems: 'center',
  },
  rolePillActive: {
    backgroundColor: colors.canvas,
    ...shadows.softFloat,
  },
  rolePillText: {
    fontSize: typography.bodyMdStrong.fontSize,
    fontWeight: '700',
    color: colors.mute,
  },
  rolePillTextActive: {
    color: colors.ink,
  },

  roleHint: {
    backgroundColor: colors.canvasSoft,
    borderRadius: rounded.md,
    padding: spacing.sm,
    marginBottom: spacing.xl,
  },
  roleHintText: {
    fontSize: typography.bodySm.fontSize,
    color: colors.mute,
    lineHeight: 18,
  },

  form: {
    gap: spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: rounded.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.bodyLg.fontSize,
    color: colors.ink,
    backgroundColor: colors.canvas,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputFlex: { flex: 1 },
  eyeButton: {
    position: 'absolute',
    right: spacing.sm,
    padding: spacing.xs,
  },
  eyeIcon: { fontSize: 18 },

  errorBox: {
    backgroundColor: '#FFF0ED',
    borderRadius: rounded.md,
    padding: spacing.sm,
  },
  errorText: {
    color: colors.error,
    fontSize: typography.bodyMd.fontSize,
  },

  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: rounded.button,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
    ...shadows.softFloat,
  },
  primaryButtonPressed: {
    backgroundColor: colors.primaryPressed,
    transform: [{ scale: 0.98 }],
  },
  primaryButtonDisabled: { opacity: 0.7 },
  primaryButtonText: {
    color: colors.onPrimary,
    fontSize: typography.buttonLg.fontSize,
    fontWeight: '700',
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing['2xl'],
  },
  footerText: {
    fontSize: typography.bodyMd.fontSize,
    color: colors.mute,
  },
  footerLink: {
    fontSize: typography.bodyMd.fontSize,
    fontWeight: '700',
    color: colors.ink,
    textDecorationLine: 'underline',
  },
});

