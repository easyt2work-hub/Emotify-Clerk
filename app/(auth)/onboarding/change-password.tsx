import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useAppAuth } from "@/utils/auth";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Colors } from "@/constants/Colors";
import { Theme } from "@/constants/Theme";
import { Button } from "@/components/ui/Button";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { user, updateUser } = useAppAuth();
  const changePassword = useMutation(api.users.changePassword);
  const insets = useSafeAreaInsets();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isFormValid = password.length >= 6 && password === confirmPassword;

  async function handleSubmit() {
    if (!isFormValid) {
      if (password.length < 6) {
        setError("Password must be at least 6 characters long.");
      } else if (password !== confirmPassword) {
        setError("Passwords do not match.");
      }
      return;
    }

    setLoading(true);
    setError("");

    try {
      await changePassword({ newPassword: password.trim() });

      if (user) {
        await updateUser({
          ...user,
          is_first_login: false,
        });
      }

      router.replace("/(auth)/onboarding/welcome");
    } catch (err: any) {
      console.error("Failed to update password:", err);
      setError(err.message || "Failed to update password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(40, insets.top),
            paddingBottom: Math.max(40, insets.bottom + 20),
          }
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <LinearGradient
          colors={['#FAF9F5', '#EBF5FF', '#F3E8FF'] as any}
          style={StyleSheet.absoluteFill}
        />
        
        {/* Subtle Floating Glows */}
        <View style={[styles.glowBall, { top: -100, right: -100, backgroundColor: Colors.primary + '10' }]} />
        <View style={[styles.glowBall, { bottom: -100, left: -100, backgroundColor: Colors.secondary + '05' }]} />

        <View style={styles.header}>
          <Text style={styles.step}>Security Update</Text>
          <Text style={styles.title}>Update Password</Text>
          <Text style={styles.subtitle}>
            Please choose a new secure password for your account to complete setup.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.form}>
            <Text style={styles.label}>New Password</Text>
            <View style={styles.inputBox}>
              <Ionicons name="lock-closed-outline" size={20} color="#64748B" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                value={password}
                onChangeText={setPassword}
                placeholder="Minimum 6 characters"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Confirm New Password</Text>
            <View style={styles.inputBox}>
              <Ionicons name="lock-closed-outline" size={20} color="#64748B" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Re-enter new password"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                <Ionicons name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            title="Update & Continue"
            onPress={handleSubmit}
            loading={loading}
            disabled={!password || !confirmPassword || password !== confirmPassword || password.length < 6}
            size="lg"
            style={{ marginTop: Theme.spacing.xl }}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Theme.spacing.xl, flexGrow: 1, justifyContent: "center" },
  glowBall: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.5,
  },
  step: {
    fontFamily: Theme.fontFamily.medium,
    fontSize: Theme.fontSize.xs,
    color: Colors.primary,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: Theme.spacing.sm,
    textAlign: "center",
  },
  title: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 28,
    color: Colors.text,
    marginBottom: Theme.spacing.xs,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: Theme.fontFamily.regular,
    fontSize: Theme.fontSize.md,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Theme.spacing.xl,
    textAlign: "center",
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 24,
    ...Theme.shadows.secondary,
  },
  header: {
    marginBottom: Theme.spacing.md,
  },
  form: { gap: Theme.spacing.xs },
  label: {
    fontFamily: Theme.fontFamily.medium,
    fontSize: Theme.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: Theme.spacing.md,
    marginBottom: Theme.spacing.xs,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: Theme.spacing.sm,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontFamily: Theme.fontFamily.medium,
    fontSize: 16,
    color: '#0F172A',
  },
  eyeIcon: {
    padding: 4,
  },
  error: {
    fontFamily: Theme.fontFamily.regular,
    fontSize: Theme.fontSize.sm,
    color: Colors.error,
    marginTop: Theme.spacing.md,
    textAlign: "center",
  },
});
