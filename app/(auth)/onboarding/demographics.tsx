import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, ScrollView } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAppAuth } from "@/utils/auth";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Colors } from "@/constants/Colors";
import { Theme } from "@/constants/Theme";
import { Button } from "@/components/ui/Button";

export default function DemographicsScreen() {
  const router = useRouter();
  const { user, updateUser } = useAppAuth();
  const params = useLocalSearchParams<{
    emergencyName: string;
    emergencyPhone: string;
  }>();

  const completeOnboarding = useMutation(api.users.completeOnboarding);

  const [alias, setAlias] = useState("");
  const [age, setAge] = useState("");
  const [campus, setCampus] = useState("");
  const [department, setDepartment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isValid = alias.trim() && age.trim() && campus.trim() && department.trim();

  async function handleSubmit() {
    if (!user || !isValid) return;
    setLoading(true);
    setError("");

    try {
      await completeOnboarding({
        alias: alias.trim(),
        age: parseInt(age, 10) || 0,
        campus: campus.trim(),
        department: department.trim(),
        consentVersion: "1.0",
        consentTimestamp: Date.now(),
        emergencyContactName: params.emergencyName || undefined,
        emergencyContactPhone: params.emergencyPhone || undefined,
      });

      await updateUser({
        ...user,
        onboardingComplete: true,
      });

      // Go to app dashboard directly (screening is now a tab/card)
      router.replace("/(auth)/(tabs)");
    } catch (err: any) {
      console.error("Onboarding error:", err);
      setError("Failed to save your information. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.step}>Step 3 of 3</Text>
      <Text style={styles.title}>Tell us about you</Text>
      <Text style={styles.subtitle}>
        This helps us personalize your experience. You can use a nickname if
        you prefer.
      </Text>

      <View style={styles.form}>
        <Text style={styles.label}>What should we call you?</Text>
        <TextInput
          style={styles.input}
          value={alias}
          onChangeText={setAlias}
          placeholder="Your name or nickname"
          placeholderTextColor={Colors.textMuted}
        />

        <Text style={styles.label}>Age</Text>
        <TextInput
          style={styles.input}
          value={age}
          onChangeText={setAge}
          placeholder="e.g. 20"
          placeholderTextColor={Colors.textMuted}
          keyboardType="number-pad"
          maxLength={3}
        />

        <Text style={styles.label}>Campus</Text>
        <TextInput
          style={styles.input}
          value={campus}
          onChangeText={setCampus}
          placeholder="e.g. Main Campus"
          placeholderTextColor={Colors.textMuted}
        />

        <Text style={styles.label}>Department</Text>
        <TextInput
          style={styles.input}
          value={department}
          onChangeText={setDepartment}
          placeholder="e.g. Computer Science"
          placeholderTextColor={Colors.textMuted}
        />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button
        title="Complete Setup"
        onPress={handleSubmit}
        loading={loading}
        disabled={!isValid}
        size="lg"
        style={{ marginTop: Theme.spacing.xl }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Theme.spacing.xl, paddingTop: 60 },
  step: {
    fontFamily: Theme.fontFamily.medium,
    fontSize: Theme.fontSize.xs,
    color: Colors.primary,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: Theme.spacing.sm,
  },
  title: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: Theme.fontSize.xxl,
    color: Colors.text,
    marginBottom: Theme.spacing.xs,
  },
  subtitle: {
    fontFamily: Theme.fontFamily.regular,
    fontSize: Theme.fontSize.md,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Theme.spacing.xl,
  },
  form: { gap: Theme.spacing.xs },
  label: {
    fontFamily: Theme.fontFamily.medium,
    fontSize: Theme.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: Theme.spacing.md,
    marginBottom: Theme.spacing.xs,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: 14,
    fontFamily: Theme.fontFamily.regular,
    fontSize: Theme.fontSize.md,
    color: Colors.text,
  },
  error: {
    fontFamily: Theme.fontFamily.regular,
    fontSize: Theme.fontSize.sm,
    color: Colors.error,
    marginTop: Theme.spacing.md,
    textAlign: "center",
  },
});
