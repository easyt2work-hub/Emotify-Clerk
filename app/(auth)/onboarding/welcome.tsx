import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Colors } from "@/constants/Colors";
import { Theme } from "@/constants/Theme";
import { Button } from "@/components/ui/Button";

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.emoji}>🌱</Text>
        <Text style={styles.title}>Welcome to Emotify</Text>
        <Text style={styles.subtitle}>
          A safe space for your mental wellbeing
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>📋 Before we begin</Text>
        <Text style={styles.disclaimer}>
          This app is <Text style={styles.bold}>not a diagnosis tool</Text> and
          does not replace professional mental health care. It is designed to
          help you understand your emotional patterns and connect you with
          support when needed.
        </Text>
        <Text style={styles.disclaimer}>
          All information you share is kept confidential and used only to
          personalize your experience within the app.
        </Text>
        <Text style={styles.disclaimer}>
          If you are in immediate danger or crisis, please contact your local
          emergency services or a crisis helpline.
        </Text>
      </View>

      <View style={styles.features}>
        <FeatureItem emoji="🧠" text="Understand your emotions better" />
        <FeatureItem emoji="📊" text="Track your wellbeing over time" />
        <FeatureItem emoji="🛠️" text="Access helpful coping tools" />
        <FeatureItem emoji="🤝" text="Get connected to support when needed" />
      </View>

      <Button
        title="Get Started"
        onPress={() => router.push("/(auth)/onboarding/consent")}
        size="lg"
        style={{ marginTop: Theme.spacing.lg }}
      />
    </ScrollView>
  );
}

function FeatureItem({ emoji, text }: { emoji: string; text: string }) {
  return (
    <View style={styles.featureRow}>
      <Text style={styles.featureEmoji}>{emoji}</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Theme.spacing.xl,
    paddingTop: 60,
  },
  hero: {
    alignItems: "center",
    marginBottom: Theme.spacing.xl,
  },
  emoji: {
    fontSize: 64,
    marginBottom: Theme.spacing.md,
  },
  title: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: Theme.fontSize.xxl,
    color: Colors.text,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: Theme.fontFamily.regular,
    fontSize: Theme.fontSize.md,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: Theme.spacing.xs,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.xl,
    borderLeftWidth: 3,
    borderLeftColor: Colors.warning,
  },
  cardTitle: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: Theme.fontSize.lg,
    color: Colors.text,
    marginBottom: Theme.spacing.md,
  },
  disclaimer: {
    fontFamily: Theme.fontFamily.regular,
    fontSize: Theme.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Theme.spacing.md,
  },
  bold: {
    fontFamily: Theme.fontFamily.bold,
    color: Colors.warning,
  },
  features: {
    gap: Theme.spacing.md,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.md,
  },
  featureEmoji: {
    fontSize: 24,
  },
  featureText: {
    fontFamily: Theme.fontFamily.regular,
    fontSize: Theme.fontSize.md,
    color: Colors.text,
  },
});
